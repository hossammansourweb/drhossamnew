// Arabic date and time formatting utilities

export const ARABIC_DAYS = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت'
];

export const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر'
];

export function getArabicDayName(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return ARABIC_DAYS[d.getDay()] || '';
  } catch {
    return '';
  }
}

export function formatArabicDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const dayName = ARABIC_DAYS[d.getDay()];
    const monthName = ARABIC_MONTHS[month - 1];
    return `${dayName} ${day} ${monthName} ${year}`;
  } catch {
    return dateStr;
  }
}

export function formatShortArabicDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const dayName = ARABIC_DAYS[d.getDay()];
    const monthName = ARABIC_MONTHS[month - 1];
    return `${dayName} ${day} ${monthName}`;
  } catch {
    return dateStr;
  }
}

export function convertTo12HourArabic(time24: string): string {
  // e.g. "09:00" -> "09:00 ص", "14:30" -> "02:30 م"
  if (!time24) return time24;
  const trimmed = time24.trim();
  // Already in 12-hour Arabic format ("09:00 ص" / "02:30 م") -> return as-is (idempotent)
  if (trimmed.includes('ص') || trimmed.includes('م')) return trimmed;
  const [hourStr, minStr = '00'] = trimmed.split(':');
  let hour = parseInt(hourStr, 10);
  if (Number.isNaN(hour)) return time24;
  const minutes = (minStr.slice(0, 2) || '00').padStart(2, '0');
  const period = hour >= 12 ? 'م' : 'ص';
  if (hour > 12) hour -= 12;
  if (hour === 0) hour = 12;
  const formattedHour = String(hour).padStart(2, '0');
  return `${formattedHour}:${minutes} ${period}`;
}

export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 600; // default 10:00 AM
  const isPM = timeStr.includes('م') || timeStr.toLowerCase().includes('pm');
  const isAM = timeStr.includes('ص') || timeStr.toLowerCase().includes('am');
  const clean = timeStr.replace(/[^\d:]/g, '').trim();
  const parts = clean.split(':').map(Number);
  let h = parts[0] || 0;
  const m = parts[1] || 0;

  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;

  return h * 60 + m;
}

export function generateSlotsForRange(startTime: string, endTime: string, slotDurationMinutes = 8): string[] {
  const slots: string[] = [];
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);

  const duration = slotDurationMinutes > 0 ? slotDurationMinutes : 8;
  let currentMinutes = startMinutes;

  while (currentMinutes < endMinutes) {
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    const time24 = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    slots.push(convertTo12HourArabic(time24));
    currentMinutes += duration;
  }

  return slots;
}

export interface AvailableClinicDate {
  dateStr: string; // YYYY-MM-DD
  dayName: string; // e.g. "السبت"
  formattedDate: string; // e.g. "السبت 12 سبتمبر"
  dayOfWeek: number;
}

/**
 * Generates available dates strictly within the next 30 days
 * matching the clinic's working days, excluding blocked dates.
 */
export function get30DaysWorkingDatesForClinic(
  workingDays: number[], // e.g. [6, 2] for Saturday & Tuesday
  blockedDates: string[] = []
): AvailableClinicDate[] {
  const result: AvailableClinicDate[] = [];
  const now = new Date();

  // Exactly next 30 days starting from Today (0 to 30)
  for (let i = 0; i <= 30; i++) {
    const targetDate = new Date();
    targetDate.setDate(now.getDate() + i);

    const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 6 = Saturday
    if (!workingDays.includes(dayOfWeek)) {
      continue;
    }

    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    if (blockedDates.includes(dateStr)) {
      continue;
    }

    const dayName = ARABIC_DAYS[dayOfWeek];
    const monthName = ARABIC_MONTHS[targetDate.getMonth()];

    result.push({
      dateStr,
      dayName,
      formattedDate: `${dayName} ${targetDate.getDate()} ${monthName}`,
      dayOfWeek
    });
  }

  return result;
}

// Convert "09:00 ص" or "02:30 م" and "2026-09-19" into standard ISO / Google Calendar dates
export function createGoogleCalendarUrl(params: {
  title: string;
  details: string;
  location: string;
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // e.g. "09:00 ص" or "02:30 م"
  durationMinutes?: number;
}): string {
  const { title, details, location, dateStr, timeStr, durationMinutes = 30 } = params;
  
  // Parse time
  const isPM = timeStr.includes('م');
  const cleanTime = timeStr.replace(/[صم\s]/g, '');
  const [hStr, mStr] = cleanTime.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10) || 0;
  if (isPM && h < 12) h += 12;
  if (!isPM && h === 12) h = 0;

  const [year, month, day] = dateStr.split('-').map(Number);
  const startDate = new Date(Date.UTC(year, month - 1, day, h, m));
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

  const formatGCalDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const datesParam = `${formatGCalDate(startDate)}/${formatGCalDate(endDate)}`;
  
  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.set('action', 'TEMPLATE');
  url.searchParams.set('text', title);
  url.searchParams.set('details', details);
  url.searchParams.set('location', location);
  url.searchParams.set('dates', datesParam);

  return url.toString();
}

export function createWhatsAppBookingUrl(params: {
  whatsappNumber: string;
  patientName: string;
  bookingType: string;
  bookingNumber: string | number;
  dateStr: string;
  dayName: string;
  timeStr: string;
  price: number;
  paymentMethod: string;
}): string {
  const {
    whatsappNumber,
    patientName,
    bookingType,
    bookingNumber,
    dateStr,
    dayName,
    timeStr,
    price,
    paymentMethod
  } = params;

  // Clean Egyptian phone number for WhatsApp link
  let cleanPhone = whatsappNumber.replace(/\D/g, '');
  if (cleanPhone.startsWith('01')) {
    cleanPhone = '2' + cleanPhone; // Egypt country code
  } else if (!cleanPhone.startsWith('20') && !cleanPhone.startsWith('2')) {
    cleanPhone = '20' + cleanPhone;
  }

  const message = 
`السلام عليكم ورحمة الله وبركاته،
تأكيد حجز موعد عيادة د. حسام منصور أبوكل
(استشاري جراحة العظام بالقوات المسلحة)

👤 اسم المريض: ${patientName}
🔢 رقم الحجز: #${bookingNumber}
🩺 نوع الحجز: ${bookingType}
📅 تاريخ الكشف: ${dateStr} (${dayName})
⏰ الساعة: ${timeStr}
💰 قيمة الكشف: ${price} جنيه
💳 طريقة الدفع: ${paymentMethod}

شكراً لكم، ونتمنى لكم دوام الصحة والعافية.`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

// -----------------------------------------------------------
// Firestore-safe timestamp helpers
// `createdAt`/`updatedAt` can be: ISO string (local/demo), millis number,
// JS Date, or a Firestore Timestamp object ({ toDate() } / { seconds }).
// `new Date()` on a Timestamp object yields "Invalid Date" — these
// helpers normalize every shape and never render "Invalid Date".
// -----------------------------------------------------------

/** Normalize any stored timestamp shape to millis, or 0 when unknown. */
export function toMillis(value: unknown): number {
  try {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') {
      // Heuristic: seconds (< 1e12) vs millis.
      return value < 1e12 ? value * 1000 : value;
    }
    if (value instanceof Date) {
      const t = value.getTime();
      return Number.isNaN(t) ? 0 : t;
    }
    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      if (typeof obj.toDate === 'function') {
        const t = (obj.toDate as () => Date)().getTime();
        return Number.isNaN(t) ? 0 : t;
      }
      const seconds = obj.seconds ?? obj._seconds;
      if (typeof seconds === 'number') return seconds * 1000;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return 0;
      const t = new Date(trimmed).getTime();
      return Number.isNaN(t) ? 0 : t;
    }
    return 0;
  } catch {
    return 0;
  }
}

/** Format any stored timestamp for display (Arabic locale), or '—' when unknown. */
export function formatRecordTimestamp(value: unknown): string {
  const ms = toMillis(value);
  if (!ms) return '—';
  try {
    return new Date(ms).toLocaleDateString('ar-EG');
  } catch {
    return '—';
  }
}
