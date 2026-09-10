import type { Appointment } from '../types';

/**
 * Frontend Telegram relay helper.
 *
 * SECURITY: this file NEVER contains the bot token. It only POSTs the
 * saved booking to our own server endpoint `/api/notify-booking`,
 * which holds TELEGRAM_BOT_TOKEN server-side.
 *
 * RELIABILITY: fire-and-forget — this function NEVER throws, so a
 * Telegram failure can never turn a successful booking into an error.
 */

export interface TelegramBookingExtra {
  email?: string;
  serviceLabel?: string;
}

// In-memory + sessionStorage guard so re-renders / StrictMode /
// refresh-driven double-invokes never send the same booking twice.
const notifiedIds = new Set<string>();

function alreadyNotified(bookingId: string): boolean {
  if (!bookingId) return false;
  if (notifiedIds.has(bookingId)) return true;
  try {
    if (sessionStorage.getItem(`telegram_notified_${bookingId}`)) {
      notifiedIds.add(bookingId);
      return true;
    }
  } catch {
    /* storage unavailable — fall back to memory only */
  }
  return false;
}

function markNotified(bookingId: string): void {
  if (!bookingId) return;
  notifiedIds.add(bookingId);
  try {
    sessionStorage.setItem(`telegram_notified_${bookingId}`, '1');
  } catch {
    /* ignore */
  }
}

export async function notifyTelegramBooking(
  appointment: Appointment,
  extra?: TelegramBookingExtra
): Promise<void> {
  try {
    if (!appointment || !appointment.id) return;
    // Exactly-once per booking id.
    if (alreadyNotified(appointment.id)) return;
    markNotified(appointment.id);

    const payload = {
      booking: {
        id: appointment.id,
        bookingNumber: appointment.bookingNumber,
        patientName: appointment.patientName,
        patientPhone: appointment.patientPhone,
        bookingType: appointment.bookingType,
        clinicName: appointment.clinicName,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        paymentMethod: appointment.paymentMethod,
        paymentProofUrl: appointment.paymentProofUrl || '',
      },
    };

    let res: Response;
    try {
      res = await fetch('/api/notify-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      // Most common cause in dev: the Express relay (server.js) is not running.
      // Run it with `npm run dev:server` (or `npm run dev:all` for both).
      // Booking already succeeded — only warn for diagnostics.
      console.warn(
        '[telegram] Relay unreachable (is server.js running? try `npm run dev:server`). Booking unaffected:',
        err
      );
      return;
    }

    if (!res.ok) {
      // Surface the actual relay/proxy error instead of hiding it behind
      // a bare status code. Still never throws: booking already succeeded.
      const body = await res.text().catch(() => '');
      console.warn(
        `[telegram] Relay responded with HTTP ${res.status} ${res.statusText}. ` +
          `If running \`npm run dev\` only, start the API with \`npm run dev:server\` (Vite proxies /api → localhost:3001). ` +
          `Response body: ${body.slice(0, 500)}`
      );
      return;
    }

    const data = await res.json().catch(() => ({}));
    if (!data?.ok && !data?.skipped) {
      console.warn('[telegram] Notification not delivered:', data?.detail || data?.reason);
    }
  } catch (err) {
    // Swallow: Telegram must never break the booking UX.
    console.warn('[telegram] Notify failed (booking unaffected):', err);
  }
}
