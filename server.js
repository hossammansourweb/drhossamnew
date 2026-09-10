// ============================================================
// Clinic Booking — minimal API server + static hosting
// - Serves the Vite `dist/` build (production)
// - Exposes POST /api/notify-booking (server-side Telegram relay)
//
// Why this server exists:
// The app writes bookings directly from the browser to Firestore /
// localStorage (no prior backend). The Telegram Bot token must NEVER
// be exposed to the browser, so all Telegram calls happen HERE,
// using TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID from server env only.
// ============================================================
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3001);

const TELEGRAM_BOT_TOKEN = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
const TELEGRAM_CHAT_ID = (process.env.TELEGRAM_CHAT_ID || '').trim();

app.use(express.json({ limit: '256kb' }));

// ------------------------------------------------------------
// Telegram helpers (server-side only)
// ------------------------------------------------------------
function escapeTelegramHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Graceful field: never show undefined/null/empty — show '—' instead. */
function field(value, formatter, fallback = '—') {
  if (value === undefined || value === null) return fallback;
  const str = String(value).trim();
  if (!str || str === 'undefined' || str === 'null') return fallback;
  const out = formatter ? formatter(str) : str;
  return escapeTelegramHtml(out);
}

const BOOKING_TYPE_LABELS = { new: 'حجز جديد', followup: 'متابعة' };
const PAYMENT_METHOD_LABELS = { clinic: 'الدفع في العيادة', instapay: 'InstaPay' };

/**
 * Telegram booking notification — exact structure:
 *
 * 🔔 حجز جديد او متابعة
 * 🆔 رقم الحجز: 6429
 *
 * 👤 بيانات الحجز
 * الاسم: [name]
 * رقم الهاتف: [phone]
 * العيادة: [clinic]
 * التاريخ: [date]
 * الوقت: [time]
 *
 * 💳 بيانات الدفع
 * طريقة الدفع: [payment method]
 * اسكرين شوت: [image URL]     <- ONLY when InstaPay
 *
 * All user-provided values are HTML-escaped; missing optional fields
 * show "—" instead of undefined/null.
 */
function buildBookingMessage(b = {}) {
  const lines = [];

  lines.push(`🔔 ${field(BOOKING_TYPE_LABELS[b.bookingType] || b.bookingType, undefined, 'حجز جديد')}`);
  lines.push(`🆔 <b>رقم الحجز:</b> ${field(b.bookingNumber || b.bookingId || b.id)}`);
  lines.push('');
  lines.push('👤 <b>بيانات الحجز</b>');
  lines.push(`<b>الاسم:</b> ${field(b.patientName)}`);
  lines.push(`<b>رقم الهاتف:</b> ${field(b.patientPhone)}`);
  lines.push(`<b>العيادة:</b> ${field(b.clinicName)}`);
  lines.push(`<b>التاريخ:</b> ${field(b.appointmentDate)}`);
  lines.push(`<b>الوقت:</b> ${field(b.appointmentTime)}`);
  lines.push('');
  lines.push('💳 <b>بيانات الدفع</b>');
  const payMethod = b.paymentMethodLabel || PAYMENT_METHOD_LABELS[b.paymentMethod] || b.paymentMethod;
  lines.push(`<b>طريقة الدفع:</b> ${field(payMethod)}`);

  // Screenshot line ONLY for InstaPay payments, using the URL stored
  // with the booking (paymentProofUrl) — never a hardcoded/fake value.
  const isInstapay = b.paymentMethod === 'instapay';
  const proofUrl = String(b.paymentProofUrl || '').trim();
  if (isInstapay && proofUrl) {
    // Plain URL (not a tag) so Telegram renders it clickable.
    lines.push(`<b>اسكرين شوت:</b> ${escapeTelegramHtml(proofUrl)}`);
  }

  return lines.join('\n');
}

function maskChatId(chatId) {
  const s = String(chatId || '');
  if (s.length <= 4) return '****';
  return `${s.slice(0, 2)}****${s.slice(-2)}`;
}

async function sendTelegramMessage(text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
  } catch (err) {
    // Network-level failure (DNS, no internet, Telegram down).
    const netErr = new Error(`Telegram request network failure: ${err?.message || err}`);
    netErr.cause = err;
    throw netErr;
  }
  // Telegram usually returns JSON, but parse defensively so a non-JSON
  // gateway/proxy response still produces a useful log instead of a crash.
  const rawBody = await res.text().catch(() => '');
  let data = {};
  try {
    data = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    data = { _raw: rawBody.slice(0, 500) };
  }
  if (!res.ok || data?.ok === false) {
    const err = new Error(
      `Telegram API error (HTTP ${res.status} ${res.statusText}): ` +
        `error_code=${data?.error_code ?? '?'} description=${data?.description || rawBody.slice(0, 300) || '?'}`
    );
    err.telegramResponse = data;
    err.httpStatus = res.status;
    throw err;
  }
  return data;
}

// ------------------------------------------------------------
// API routes
// ------------------------------------------------------------
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    telegramConfigured: Boolean(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID),
  });
});

/**
 * POST /api/notify-booking
 * Called by the frontend EXACTLY ONCE, AFTER a booking was
 * successfully saved (Firestore/localStorage).
 * Never fails the booking: Telegram errors are logged here and
 * reported as { ok:false } with HTTP 200 so the UI keeps success.
 *
 * Server-side idempotency: if the same booking id is re-sent (client
 * retry / re-render edge case the frontend guard somehow misses), the
 * relay still sends only ONE Telegram message per booking id.
 */
const notifiedBookingIds = new Set();

app.post('/api/notify-booking', async (req, res) => {
  const booking = req?.body?.booking || req?.body || {};

  // Basic validation — still never break the booking on the client.
  if (!booking || typeof booking !== 'object' || Array.isArray(booking)) {
    console.warn('[telegram] Rejected malformed payload:', typeof booking);
    return res.status(200).json({ ok: false, skipped: true, reason: 'empty-payload' });
  }

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn(
      '[telegram] Skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set in server env.'
    );
    return res.status(200).json({ ok: false, skipped: true, reason: 'telegram-not-configured' });
  }

  // Idempotency: exactly one message per booking id per server lifetime.
  const dedupeKey = String(booking.bookingNumber || booking.id || '').trim();
  if (dedupeKey && notifiedBookingIds.has(dedupeKey)) {
    console.log(`[telegram] Duplicate notify request for booking #${dedupeKey} ignored (idempotent).`);
    return res.status(200).json({ ok: true, duplicate: true });
  }
  if (dedupeKey) notifiedBookingIds.add(dedupeKey);

  try {
    const text = buildBookingMessage(booking);
    const tg = await sendTelegramMessage(text);
    console.log(`[telegram] Notification sent for booking #${booking.bookingNumber || booking.id || '?'} (tg msg ${tg?.result?.message_id ?? '?'})`);
    return res.status(200).json({ ok: true, telegramMessageId: tg?.result?.message_id ?? null });
  } catch (err) {
    // Full server-side diagnostics (token NEVER logged).
    // Endpoint + HTTP status + safe Telegram response are logged so the
    // real Telegram API failure is identifiable during development.
    console.error('[telegram] Failed to send booking notification:', {
      endpoint: 'POST https://api.telegram.org/bot<redacted>/sendMessage',
      chatId: maskChatId(TELEGRAM_CHAT_ID),
      message: err?.message,
      httpStatus: err?.httpStatus,
      telegramResponse: err?.telegramResponse,
      tokenPresent: Boolean(TELEGRAM_BOT_TOKEN),
      bookingNumber: booking?.bookingNumber || booking?.id,
      cause: err?.cause?.message,
    });
    // HTTP 200 on purpose: booking itself already succeeded.
    return res.status(200).json({
      ok: false,
      reason: 'telegram-send-failed',
      detail: err?.message || 'unknown error',
    });
  }
});

// JSON 404 for unknown /api routes (so clients never misread an HTML page).
app.use('/api', (_req, res) => {
  res.status(404).json({ ok: false, reason: 'unknown-api-route' });
});

// Global error handler: log the real stack, return JSON (never an HTML 500 page).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[server] Unhandled error:', err?.stack || err);
  res.status(500).json({ ok: false, reason: 'internal-error', detail: err?.message || 'unknown error' });
});

// ------------------------------------------------------------
// SEO: crawler headers
// - Private areas (/admin, /api) are never indexed: X-Robots-Tag noindex.
// - robots.txt / sitemap.xml get a long cache (they change rarely).
// ------------------------------------------------------------
app.use((req, res, next) => {
  if (req.path === '/admin' || req.path.startsWith('/admin/') || req.path.startsWith('/api/')) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  }
  if (req.path === '/robots.txt' || req.path === '/sitemap.xml') {
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
  next();
});

// ------------------------------------------------------------
// Static hosting of the Vite build (production)
// ------------------------------------------------------------
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  // SPA fallback (must be AFTER /api routes)
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.json({ ok: true, message: 'API running (no dist/ build found). Use `npm run build` first.' });
  });
}

app.listen(PORT, () => {
  console.log(`Clinic server listening on http://localhost:${PORT}`);
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('[telegram] WARNING: TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID missing — notifications will be skipped (bookings unaffected).');
  } else {
    console.log('[telegram] Telegram notifications enabled.');
  }
});

export { buildBookingMessage, escapeTelegramHtml };
