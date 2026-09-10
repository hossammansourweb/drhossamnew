// ============================================================
// Vercel Serverless Function: POST /api/notify-booking
// Same Telegram relay contract as server.js (used for VPS/Firebase).
// Vercel static hosting cannot run server.js, so this function
// handles Telegram notifications in production on Vercel.
//
// Required Vercel env vars (Project → Settings → Environment Variables):
//   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
//
// Behavior (identical to server.js):
// - Always responds HTTP 200 with { ok } so a Telegram failure
//   NEVER breaks the booking (booking is already saved by then).
// - 405 only for non-POST methods.
// ============================================================

const BOOKING_TYPE_LABELS = { new: 'حجز جديد', followup: 'متابعة' };
const PAYMENT_METHOD_LABELS = { clinic: 'الدفع في العيادة', instapay: 'InstaPay' };

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

  const isInstapay = b.paymentMethod === 'instapay';
  const proofUrl = String(b.paymentProofUrl || '').trim();
  if (isInstapay && proofUrl) {
    lines.push(`<b>اسكرين شوت:</b> ${escapeTelegramHtml(proofUrl)}`);
  }

  return lines.join('\n');
}

// Best-effort idempotency per warm lambda instance. (Serverless is
// stateless across instances; the frontend already guards duplicates,
// so this only catches retries hitting the same warm instance.)
const notifiedBookingIds = new Set();

async function sendTelegramMessage(text, botToken, chatId) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });
  const rawBody = await res.text().catch(() => '');
  let data = {};
  try {
    data = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    data = { _raw: String(rawBody).slice(0, 500) };
  }
  if (!res.ok || data?.ok === false) {
    throw new Error(
      `Telegram API error (HTTP ${res.status}): ` +
        `error_code=${data?.error_code ?? '?'} description=${data?.description || String(rawBody).slice(0, 300) || '?'}`
    );
  }
  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, reason: 'method-not-allowed' });
  }

  const TELEGRAM_BOT_TOKEN = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
  const TELEGRAM_CHAT_ID = (process.env.TELEGRAM_CHAT_ID || '').trim();

  // Vercel parses JSON bodies automatically; fall back to manual parse.
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  const booking = body?.booking || body || {};

  if (!booking || typeof booking !== 'object' || Array.isArray(booking)) {
    return res.status(200).json({ ok: false, skipped: true, reason: 'empty-payload' });
  }

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('[telegram] Skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set in Vercel env.');
    return res.status(200).json({ ok: false, skipped: true, reason: 'telegram-not-configured' });
  }

  const dedupeKey = String(booking.bookingNumber || booking.id || '').trim();
  if (dedupeKey && notifiedBookingIds.has(dedupeKey)) {
    return res.status(200).json({ ok: true, duplicate: true });
  }
  if (dedupeKey) notifiedBookingIds.add(dedupeKey);

  try {
    const text = buildBookingMessage(booking);
    const tg = await sendTelegramMessage(text, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID);
    return res.status(200).json({ ok: true, telegramMessageId: tg?.result?.message_id ?? null });
  } catch (err) {
    console.error('[telegram] Failed to send booking notification:', err?.message);
    return res.status(200).json({
      ok: false,
      reason: 'telegram-send-failed',
      detail: err?.message || 'unknown error',
    });
  }
}
