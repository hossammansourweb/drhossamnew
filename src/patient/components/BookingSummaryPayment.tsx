import React, { useRef, useState } from 'react';
import {
  ChevronRight,
  CreditCard,
  Building2,
  UploadCloud,
  CheckCircle,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Calendar,
  Clock,
  User,
  Phone,
  QrCode,
  ShieldAlert,
  MapPin
} from 'lucide-react';
import { BookingType, PaymentMethod, ClinicSettings, Appointment, ClinicConfig } from '../../shared/types';
import { formatArabicDate, getArabicDayName } from '../../shared/utils/dateUtils';
import { createAppointmentWithAtomicCheck, uploadPaymentProofImage, getClinicSlotsForDate } from '../../shared/services/bookingService';
import { notifyTelegramBooking } from '../../shared/services/telegramService';

interface Props {
  clinic: ClinicConfig;
  bookingType: BookingType;
  appointmentDate: string;
  appointmentTime: string;
  patientName: string;
  patientPhone: string;
  price: number;
  settings: ClinicSettings;
  onBack: () => void;
  onDoubleBookingError: (msg: string) => void;
  onBookingSuccess: (appointment: Appointment) => void;
}

export const BookingSummaryPayment: React.FC<Props> = ({
  clinic,
  bookingType,
  appointmentDate,
  appointmentTime,
  patientName,
  patientPhone,
  price,
  settings,
  onBack,
  onDoubleBookingError,
  onBookingSuccess
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('clinic');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Sync ref guard: React state updates are async, so rapid double-clicks
  // could invoke the handler twice before `submitting` disables the button.
  // The ref blocks the second invocation immediately (no duplicate booking
  // creation and no duplicate Telegram notification).

  const submittingRef = useRef(false);

  const dayName = getArabicDayName(appointmentDate);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onload = () => setReceiptPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmBooking = async () => {
    // Block duplicate submissions (double-clicks) synchronously.
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      // FINAL fresh availability re-check from the server right before the
      // booking (patient may have sat on this screen while someone else
      // booked the slot). The Firestore transaction inside
      // createAppointmentWithAtomicCheck remains the atomic backstop; this
      // only improves the error UX by failing fast with a clear message.
      try {
        const freshSlots = await getClinicSlotsForDate(clinic.id, appointmentDate, settings);
        const fresh = freshSlots.find(s => s.time === appointmentTime);
        if (fresh && (fresh.isBooked || fresh.isAvailable === false)) {
          onDoubleBookingError('عذراً، هذا الموعد تم حجزه للتو من مريض آخر. برجاء اختيار موعد آخر.');
          return;
        }
      } catch {
        // Non-critical pre-check: if it fails (e.g. offline), continue —
        // the atomic transaction still guarantees correctness.
      }

      let paymentProofUrl = '';

      // Upload receipt if InstaPay chosen and file selected
      if (paymentMethod === 'instapay') {
        if (receiptFile) {
          paymentProofUrl = await uploadPaymentProofImage(receiptFile);
        }
      }

      // Atomic booking execution with Clinic + Date + Time
      const appointment = await createAppointmentWithAtomicCheck({
        clinicId: clinic.id,
        clinicName: clinic.name,
        patientName,
        patientPhone,
        bookingType,
        appointmentDate,
        appointmentTime,
        price,
        paymentMethod,
        paymentProofUrl,
        notes: ''
      });

      // Telegram notification — ONLY after the booking was saved
      // successfully. Fire-and-forget: never blocks/avoids success UI,
      // failures are logged server-side. Exactly-once guarded inside.
      void notifyTelegramBooking(appointment);

      onBookingSuccess(appointment);
    } catch (err: any) {
      console.error('Booking confirmation error:', err);
      const msg = err.message || 'حدث خطأ أثناء تنفيذ الحجز.';
      
      if (msg.includes('تم حجزه بالفعل') || msg.includes('SLOT_ALREADY_BOOKED')) {
        // Return to appointment selection per Section 4 requirement
        onDoubleBookingError('عذراً، هذا الموعد تم حجزه بالفعل. برجاء اختيار موعد آخر.');
      } else {
        setErrorMessage(msg);
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto py-4 sm:py-6 px-4">
      
      {/* Header bar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <button
          onClick={onBack}
          disabled={submitting}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
          <span>تعديل البيانات</span>
        </button>

        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
          مراجعة وتأكيد الحجز
        </span>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          مراجعة الحجز
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          تأكد من صحة البيانات الموضحة أدناه ثم اختر طريقة الدفع
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl mb-6 flex items-start gap-3 text-rose-800 text-sm font-bold">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p>{errorMessage}</p>
            <p className="text-xs font-normal text-rose-600 mt-0.5">
              يبدو أن الاتصال بالإنترنت غير متاح أو أن الموعد قد تغير. يرجى المحاولة مرة أخرى.
            </p>
          </div>
        </div>
      )}

      {/* Booking Summary Card — compact (same fields, minimal footprint) */}
      <div className="bg-white rounded-2xl px-3.5 py-3 sm:px-4 border border-slate-200 mb-5 text-right">
        {/* Top line: type + clinic ... price */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-extrabold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 whitespace-nowrap">
              {bookingType === 'new' ? 'حجز جديد' : 'متابعة'}
            </span>
            <span className="text-sm font-extrabold text-slate-700 flex items-center gap-1 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span className="truncate">{clinic.name}</span>
            </span>
          </div>
          <div className="shrink-0 text-left">
            <span className="block text-[11px] font-bold text-slate-400 leading-tight">قيمة الكشف</span>
            <span className="block text-lg font-black text-teal-800 leading-tight whitespace-nowrap">
              {price} <span className="text-[11px] font-bold text-slate-400">جنيه</span>
            </span>
          </div>
        </div>

        {/* Details grid: 2 columns on desktop, compact stack on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 pt-2">
          <div className="flex items-center gap-2 min-w-0">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="min-w-0">
              <span className="block text-[11px] font-bold text-slate-400 leading-tight">الاسم</span>
              <span className="block text-sm font-bold text-slate-800 leading-snug truncate">{patientName}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="min-w-0">
              <span className="block text-[11px] font-bold text-slate-400 leading-tight">رقم الهاتف</span>
              <span className="block text-sm font-bold font-mono text-slate-800 leading-snug" dir="ltr">{patientPhone}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="min-w-0">
              <span className="block text-[11px] font-bold text-slate-400 leading-tight">التاريخ واليوم</span>
              <span className="block text-sm font-bold text-slate-800 leading-snug">
                {dayName}، {formatArabicDate(appointmentDate)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="min-w-0">
              <span className="block text-[11px] font-bold text-slate-400 leading-tight">الساعة</span>
              <span className="block text-sm font-extrabold font-mono text-teal-700 leading-snug" dir="ltr">
                {appointmentTime}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Choose Payment Method (Section 10 & 11 & 12) */}
      <div className="mb-6 text-right">
        <h3 className="text-base font-bold text-slate-800 mb-3">
          اختر طريقة الدفع
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          
          {/* Option 1: Pay at Clinic */}
          <button
            type="button"
            onClick={() => setPaymentMethod('clinic')}
            className={`p-4 rounded-2xl border-2 text-right transition cursor-pointer flex flex-col justify-between ${
              paymentMethod === 'clinic'
                ? 'border-teal-700 bg-teal-50/50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                paymentMethod === 'clinic' ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-300'
              }`}>
                {paymentMethod === 'clinic' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>
            <div>
              <span className="text-sm font-extrabold text-slate-900 block">
                الدفع في العيادة
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">
                الدفع عند الوصول للعيادة نقداً أو بالفيزا
              </span>
            </div>
          </button>

          {/* Option 2: Pay via InstaPay */}
          <button
            type="button"
            onClick={() => setPaymentMethod('instapay')}
            className={`p-4 rounded-2xl border-2 text-right transition cursor-pointer flex flex-col justify-between ${
              paymentMethod === 'instapay'
                ? 'border-teal-700 bg-teal-50/50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                paymentMethod === 'instapay' ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-300'
              }`}>
                {paymentMethod === 'instapay' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>
            <div>
              <span className="text-sm font-extrabold text-slate-900 block">
                الدفع الآن عبر InstaPay
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">
                تحويل مباشر ورفع إيصال التحويل
              </span>
            </div>
          </button>

        </div>

        {/* InstaPay Details Sub-Card (Per Section 11) */}
        {paymentMethod === 'instapay' && (
          <div className="p-5 bg-gradient-to-br from-purple-50/60 to-slate-50 border-2 border-purple-200/80 rounded-3xl space-y-4 mb-4">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100">
              <div>
                <h4 className="font-extrabold text-purple-950 text-sm">
                  دفع قيمة الحجز عبر إنستاباي
                </h4>
                <p className="text-xs text-purple-800 mt-0.5">
                  المبلغ المطلوب تحويله: <span className="font-extrabold text-sm">{price} جنيه</span>
                </p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-200/70 text-purple-900">
                InstaPay
              </span>
            </div>

            {/* Configured InstaPay Identifiers */}
            <div className="space-y-2.5">
              {settings.instapayIdentifier && (
                <div className="bg-white p-3 rounded-2xl border border-purple-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block">معرف إنستاباي (IPA)</span>
                    <span className="text-xs font-mono font-bold text-slate-800" dir="ltr">
                      {settings.instapayIdentifier}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(settings.instapayIdentifier, 'ipa')}
                    className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 transition flex items-center gap-1 text-xs font-semibold cursor-pointer"
                  >
                    {copiedField === 'ipa' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'ipa' ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                </div>
              )}

              {settings.instapayPhone && (
                <div className="bg-white p-3 rounded-2xl border border-purple-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block">رقم التحويل</span>
                    <span className="text-xs font-mono font-bold text-slate-800" dir="ltr">
                      {settings.instapayPhone}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(settings.instapayPhone, 'phone')}
                    className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 transition flex items-center gap-1 text-xs font-semibold cursor-pointer"
                  >
                    {copiedField === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'phone' ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Upload Screenshot */}
            <div>
              <label className="block text-xs font-bold text-purple-950 mb-2">
                رفع صورة أو لقطة شاشة لإيصال التحويل:
              </label>

              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-purple-300 hover:border-purple-500 rounded-2xl bg-white cursor-pointer transition">
                {receiptPreview ? (
                  <div className="flex items-center gap-3 w-full">
                    <img
                      src={receiptPreview}
                      alt="معاينة إيصال تحويل InstaPay لحجز عيادة د. حسام منصور"
                      width={64}
                      height={64}
                      loading="lazy"
                      decoding="async"
                      className="w-16 h-16 object-cover rounded-xl border border-purple-200"
                    />
                    <div className="flex-1 text-right">
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> تم اختيار صورة الإيصال
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate max-w-[200px]">
                        {receiptFile?.name}
                      </span>
                      <span className="text-[10px] text-purple-700 underline mt-1 block">انقر لتغيير الصورة</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <UploadCloud className="w-8 h-8 text-purple-600 mx-auto mb-1" />
                    <span className="text-xs font-bold text-slate-800 block">اضغط لاختيار صورة الإيصال</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">JPG, PNG بحد أقصى 5 ميجابايت</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <div className="mt-2.5 p-2.5 bg-purple-100/60 rounded-xl text-[11px] text-purple-900 leading-relaxed">
                ℹ️ حالة الدفع ستكون <span className="font-bold">"في انتظار المراجعة"</span> وسيتم التأكيد النهائي فور مراجعة الإيصال من إدارة العيادة.
              </div>
            </div>
          </div>
        )}

        {paymentMethod === 'clinic' && (
          <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl text-teal-900 text-xs leading-relaxed flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-teal-700 shrink-0" />
            <span>
              <strong>الدفع عند الوصول للعيادة:</strong> يمكنك الحضور وسداد قيمة الكشف ({price} جنيه) مباشرة في استقبال العيادة قبل الدخول للطبيب.
            </span>
          </div>
        )}
      </div>

      {/* Confirmation Submit Button */}
      <div>
        <button
          onClick={handleConfirmBooking}
          disabled={submitting}
          className="w-full py-4 px-6 rounded-2xl bg-teal-700 hover:bg-teal-800 active:scale-[0.98] text-white font-extrabold text-lg shadow-xl shadow-teal-700/20 transition cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>جاري تأكيد وحجز الموعد...</span>
            </>
          ) : (
            <>
              <span>تأكيد الحجز النهائي</span>
              <CheckCircle className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

    </div>
  );
};
