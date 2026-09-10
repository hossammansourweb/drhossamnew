export type BookingType = 'new' | 'followup';

export type PaymentMethod = 'instapay' | 'clinic';

export type BookingStatus = 
  | 'new'          // جديد
  | 'confirmed'    // مؤكد
  | 'attended'     // حضر
  | 'not_attended' // لم يحضر
  | 'completed'    // مكتمل
  | 'cancelled';   // ملغي

export type PaymentStatus =
  | 'unpaid'          // لم يتم الدفع
  | 'pay_at_clinic'   // الدفع في العيادة
  | 'pending_review'  // في انتظار المراجعة
  | 'paid'            // تم الدفع
  | 'rejected';       // مرفوض

export interface Slot {
  id: string; // `${clinicId}_${date}_${time}`
  clinicId?: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "10:08 ص"
  isBooked: boolean;
  appointmentId?: string;
  patientName?: string;
  patientPhone?: string;
  bookedAt?: string;
}

export interface ClinicConfig {
  id: string; // e.g. 'tanta', 'zefta'
  name: string; // e.g. 'عيادة طنطا', 'عيادة زفتى'
  city?: string;
  address: string;
  googleMapsUrl?: string;
  phone?: string;
  workingDays: number[]; // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  openTime?: string; // e.g. "19:00"
  closeTime?: string; // e.g. "23:00"
  startTime?: string; // alias for openTime
  endTime?: string;   // alias for closeTime
  slotIntervalMinutes: number; // default: 8
  isWorking?: boolean;
}

export type ClinicBranch = ClinicConfig;

export interface WorkingDayConfig {
  dayOfWeek: number; // 0 for Sunday, 6 for Saturday
  dayName: string;
  startTime: string; // e.g. "11:00 AM"
  endTime: string;   // e.g. "05:00 PM"
  slotDurationMinutes: number;
  isWorking: boolean;
}

export interface BlockedSlotRecord {
  clinicId?: string;
  date: string;
  time: string;
  reason?: string;
}

export interface ClinicSettings {
  doctorName: string;
  doctorSpecialty: string;
  doctorTitle?: string;
  doctorBio?: string;
  newBookingPrice: number;
  followupPrice: number;
  clinics: ClinicConfig[];
  phoneNumbers: string[];
  whatsappNumber: string;
  emergencyNumber: string;
  emergencyPhone?: string;
  instagram: string;
  googleMapsLink: string;
  workingHours: string;
  bookingInstructions: string;
  instapayIdentifier: string;
  instapayPhone: string;
  instapayInstructions: string;
  instapayQrUrl: string;
  instapayAccountName?: string;
  enableInstapay?: boolean;
  enableClinicPayment?: boolean;
  isBookingEnabled?: boolean;
  siteTitle?: string;
  siteDescription?: string;
  announcementNotice?: string;
  slotDurationMinutes?: number;
  workingSchedule?: WorkingDayConfig[];
  blockedDates?: string[];
  blockedSlots?: BlockedSlotRecord[];
}

export interface Appointment {
  id: string;
  bookingNumber: string | number;
  patientId?: string;
  patientName: string;
  patientPhone: string;
  clinicId: string;
  clinicName: string;
  bookingType: BookingType;
  price: number;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // e.g. "10:08 ص"
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;
  paymentProofUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DaySlotGroup {
  date: string;
  displayDay: string; // e.g. "السبت"
  displayDate: string; // e.g. "19 سبتمبر 2026"
  slots: {
    time: string;
    isAvailable: boolean;
  }[];
}
