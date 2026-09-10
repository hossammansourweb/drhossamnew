import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Phone,
  Banknote,
  Building2,
  Share2,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { Appointment, ClinicSettings } from '../../shared/types';
import {
  formatArabicDate,
  getArabicDayName,
  createGoogleCalendarUrl
} from '../../shared/utils/dateUtils';

interface Props {
  appointment: Appointment;
  settings: ClinicSettings;
  onBookAnother: () => void;
}

export const BookingSuccess: React.FC<Props> = ({
  appointment,
  settings,
  onBookAnother
}) => {
  const dayName = getArabicDayName(appointment.appointmentDate);

  // Trigger celebration confetti
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // Safe fallback if confetti fails
    }
  }, []);

  const bookingTypeText = appointment.bookingType === 'new' ? 'حجز جديد' : 'متابعة';
  const paymentMethodText = appointment.paymentMethod === 'clinic' ? 'الدفع في العيادة' : 'الدفع عبر InstaPay';

  // Find selected clinic details
  const selectedClinic = settings.clinics.find(c => c.id === appointment.clinicId) || settings.clinics[0];
  const clinicName = appointment.clinicName || selectedClinic?.name || 'عيادة د. حسام منصور';
  const clinicAddress = selectedClinic?.address || 'شارع البحر الرئيسي مع طه الحكيم، طنطا';
  const mapsLink = selectedClinic?.googleMapsUrl || settings.googleMapsLink || 'https://maps.google.com';

  // Google Calendar URL
  const gcalUrl = createGoogleCalendarUrl({
    title: `موعد كشف (${clinicName}) — ${settings.doctorName}`,
    details: `موعد كشف بـ ${clinicName} (${settings.doctorName} - ${settings.doctorSpecialty})
- اسم المريض: ${appointment.patientName}
- نوع الحجز: ${bookingTypeText}
- رقم الحجز: #${appointment.bookingNumber}
- رقم الهاتف: ${appointment.patientPhone}
- فرع العيادة: ${clinicName}
- عنوان العيادة: ${clinicAddress}
- خرائط جوجل: ${mapsLink}
- طريقة الدفع: ${paymentMethodText} (${appointment.price} جنيه)`,
    location: `${clinicName} — ${clinicAddress}`,
    dateStr: appointment.appointmentDate,
    timeStr: appointment.appointmentTime,
    durationMinutes: selectedClinic?.slotIntervalMinutes || 8
  });

  return (
    <div className="w-full max-w-xl mx-auto py-6 sm:py-10 px-4 text-center">
      
      {/* Success Badge */}
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 shadow-xl shadow-emerald-700/20 mb-3 animate-bounce">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          تم الحجز بنجاح ✓
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          تم تأكيد وتسجيل موعدك في جدول كشوفات العيادة
        </p>
      </div>

      {/* Booking Number Highlight Box */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-900 rounded-3xl p-6 text-white shadow-xl shadow-teal-900/20 mb-6">
        <span className="text-xs font-bold text-teal-200 uppercase tracking-widest block mb-1">
          رقم الحجز الخاص بك
        </span>
        <span className="text-4xl sm:text-5xl font-black font-mono tracking-wider block">
          #{appointment.bookingNumber}
        </span>
        <span className="text-xs text-teal-100/80 mt-2 block font-medium">
          يرجى الاحتفاظ برقم الحجز وإبرازه عند الحضور للعيادة
        </span>
      </div>

      {/* Booking Details Card (Exact fields per Section 13) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-md shadow-slate-200/40 mb-6 text-right space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" /> اسم المريض
          </span>
          <span className="text-sm font-bold text-slate-900">{appointment.patientName}</span>
        </div>

        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-400">نوع الحجز</span>
          <span className="text-sm font-extrabold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
            {bookingTypeText}
          </span>
        </div>

        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-teal-600" /> فرع العيادة
          </span>
          <span className="text-sm font-extrabold text-teal-800">
            {clinicName}
          </span>
        </div>

        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> التاريخ واليوم
          </span>
          <span className="text-sm font-bold text-slate-900">
            {dayName}، {formatArabicDate(appointment.appointmentDate)}
          </span>
        </div>

        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> الساعة
          </span>
          <span className="text-sm font-bold font-mono text-teal-800 bg-slate-100 px-2.5 py-1 rounded-lg" dir="ltr">
            {appointment.appointmentTime}
          </span>
        </div>

        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <Banknote className="w-3.5 h-3.5 text-slate-400" /> قيمة الكشف
          </span>
          <span className="text-base font-extrabold text-slate-900">
            {appointment.price} جنيه
          </span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" /> طريقة الدفع
          </span>
          <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
            {paymentMethodText}
          </span>
        </div>
      </div>

      {/* Action Buttons: Google Calendar + WhatsApp (Sections 14 & 15) */}
      <div className="space-y-3.5 mb-8">
        
        {/* Section 14: Google Calendar Very Obvious Button */}
        <a
          id="btn-add-google-calendar"
          href={gcalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-4 px-6 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-300 hover:border-teal-600 text-slate-800 font-extrabold text-base shadow-sm hover:shadow-md transition cursor-pointer flex items-center justify-center gap-3 active:scale-[0.98]"
        >
          <Calendar className="w-5 h-5 text-teal-700" />
          <span>📅 إضافة الموعد إلى Google Calendar</span>
        </a>

      </div>

      {/* Clinic address reminder */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-right text-xs text-slate-600 mb-6">
        <div className="flex items-center justify-between mb-1">
          <span className="font-bold text-slate-800 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-teal-600" /> عنوان العيادة المعتمد:
          </span>
          {mapsLink && (
            <a
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-700 font-bold flex items-center gap-0.5 hover:underline"
            >
              <span>الخريطة</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <p className="leading-relaxed text-slate-600">{clinicAddress}</p>
        <p className="text-[11px] text-teal-800 font-semibold mt-1">
          يرجى التواجد قبل الموعد بـ 15 دقيقة مصطحبين الفحوصات والتحاليل السابقة إن وجدت.
        </p>
      </div>


    </div>
  );
};
