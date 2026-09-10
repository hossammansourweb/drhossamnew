import React, { useState } from 'react';
import { ChevronRight, User, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatArabicDate } from '../../shared/utils/dateUtils';
import { BookingType } from '../../shared/types';

interface Props {
  clinicName?: string;
  bookingType: BookingType;
  appointmentDate: string;
  appointmentTime: string;
  price: number;
  initialName?: string;
  initialPhone?: string;
  onBack: () => void;
  onSubmitInfo: (name: string, phone: string) => void;
}

export const PatientInfoForm: React.FC<Props> = ({
  clinicName,
  bookingType,
  appointmentDate,
  appointmentTime,
  price,
  initialName = '',
  initialPhone = '',
  onBack,
  onSubmitInfo
}) => {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (!cleanName || cleanName.length < 3) {
      setError('يرجى إدخال اسم المريض بالكامل (ثلاثي على الأقل).');
      return;
    }

    // Phone validation for Egyptian/Arab mobile numbers (at least 10 digits)
    const phoneDigits = cleanPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      setError('يرجى إدخال رقم هاتف صحيح (مثال: 01012345678).');
      return;
    }

    onSubmitInfo(cleanName, cleanPhone);
  };

  return (
    <div className="w-full max-w-xl mx-auto py-4 sm:py-6 px-4">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
          <span>تغيير الموعد</span>
        </button>

        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
          {bookingType === 'new' ? 'حجز جديد' : 'متابعة'} • {price} جنيه
        </span>
      </div>

      {/* Selected Slot Banner */}
      <div className="p-4 bg-teal-50/70 border border-teal-100 rounded-3xl mb-6 text-right">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-teal-900 block">
              الموعد في {clinicName || 'العيادة'}:
            </span>
            <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
              {formatArabicDate(appointmentDate)}
            </span>
          </div>
          <div className="bg-teal-700 text-white font-mono font-bold text-sm px-3.5 py-1.5 rounded-xl shadow-xs" dir="ltr">
            {appointmentTime}
          </div>
        </div>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          بيانات المريض
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          أدخل اسم المريض ورقم الهاتف فقط دون الحاجة لإنشاء حساب
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5 text-right">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-800 text-xs font-bold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Patient Name */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            الاسم بالكامل <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اكتب اسمك هنا"
              className="w-full pr-11 pl-4 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-teal-600 focus:ring-4 focus:ring-teal-50 text-slate-800 text-base font-medium transition placeholder:text-slate-400 outline-none"
            />
            <User className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            رقم الهاتف (المحمول) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="اكتب رقم هاتفك"
              dir="ltr"
              className="w-full pl-4 pr-11 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-teal-600 focus:ring-4 focus:ring-teal-50 text-slate-800 text-base font-mono font-medium transition placeholder:text-slate-400 outline-none text-right"
            />
            <Phone className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            سنرسل تفاصيل وتأكيد الحجز إلى هذا الرقم عبر واتساب
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            className="w-full py-4 px-6 rounded-2xl bg-teal-700 hover:bg-teal-800 active:scale-[0.98] text-white font-extrabold text-lg shadow-lg shadow-teal-700/20 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <span>متابعة الحجز</span>
            <CheckCircle2 className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};
