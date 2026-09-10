import React from 'react';
import { Phone, MessageCircle, MapPin, Sparkles, Stethoscope, ChevronLeft } from 'lucide-react';
import { ClinicSettings, BookingType } from '../../shared/types';

interface Props {
  settings: ClinicSettings;
  onSelectBookingType: (type: BookingType) => void;
  onOpenClinicInfo: () => void;
}

export const BookingHero: React.FC<Props> = ({
  settings,
  onSelectBookingType,
  onOpenClinicInfo
}) => {
  const whatsappUrl = `https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent('السلام عليكم دكتور، أود الاستفسار بخصوص حجز موعد في العيادة.')}`;
  const primaryPhone = settings.phoneNumbers[0] || '01100171817';

  return (
    <div className="w-full max-w-xl mx-auto py-6 sm:py-10 px-4 text-center">
      
      {/* Optional Announcement Banner */}
      {settings.announcementNotice && (
        <div className="mb-6 p-3 bg-teal-50 border border-teal-200/80 rounded-2xl text-teal-900 text-xs font-semibold flex items-center justify-center gap-2 shadow-xs">
          <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{settings.announcementNotice}</span>
        </div>
      )}

      {/* Doctor Identity Header */}
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-700 to-teal-900 text-white shadow-xl shadow-teal-900/20 mb-4 ring-8 ring-teal-50">
          <Stethoscope className="w-10 h-10" />
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
          {settings.doctorName}
        </h1>
        
        <p className="text-xs sm:text-sm font-bold text-teal-800 bg-teal-50 inline-block px-4 py-1.5 rounded-full border border-teal-200/70">
          {settings.doctorSpecialty}
        </p>

        <div className="mt-6">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            احجز موعد كشفك الآن
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            اختر نوع الكشف للمتابعة وحجز الموعد المناسب في دقائق معدودة
          </p>
        </div>
      </div>

      {/* Booking Disabled Notice if turned off in Settings */}
      {settings.isBookingEnabled === false ? (
        <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 mb-8 text-center space-y-2">
          <p className="font-black text-base">الحجز الإلكتروني متوقف مؤقتاً</p>
          <p className="text-xs text-amber-800">
            نعتذر، الحجز الإلكتروني غير متاح حالياً. يرجى التواصل مع العيادة هاتفياً أو عبر الواتساب للاستفسار.
          </p>
        </div>
      ) : (
        /* REDESIGNED BOOKING BUTTONS: Superior clarity, alignment, mobile usability */
        <div className="space-y-4 mb-8">
          
          {/* Button 1: حجز جديد */}
          <button
            id="btn-new-booking"
            type="button"
            onClick={() => onSelectBookingType('new')}
            className="w-full group p-5 sm:p-6 rounded-3xl bg-gradient-to-l from-teal-800 to-teal-950 text-white shadow-lg shadow-teal-950/15 hover:shadow-xl hover:shadow-teal-950/25 active:scale-[0.99] transition duration-200 text-right border border-teal-700/60 cursor-pointer"
          >
            <div className="flex items-center justify-between gap-3">
              {/* Right side: Icon + Title + Description */}
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0 group-hover:bg-white/20 transition">
                  <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-teal-200" />
                </div>
                <div className="text-right min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xl sm:text-2xl font-black text-white">
                      حجز جديد
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold bg-teal-600/60 text-teal-100 px-2 py-0.5 rounded-full border border-teal-400/30">
                      كشف أول مرة
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-teal-100/80 font-medium truncate mt-0.5">
                    فحص سريري كامل وتشخيص دقيق
                  </p>
                </div>
              </div>

              {/* Left side: Price Badge + Arrow */}
              <div className="shrink-0 text-left pl-1">
                <div className="bg-white/10 group-hover:bg-white/20 border border-white/20 px-3.5 py-2 rounded-2xl transition text-center">
                  <div className="text-lg sm:text-2xl font-black text-white font-mono leading-none">
                    {settings.newBookingPrice}
                  </div>
                  <div className="text-[10px] sm:text-xs text-teal-200 font-bold mt-0.5">
                    جنيه
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom action indicator */}
            <div className="mt-3.5 pt-3 border-t border-teal-700/40 flex items-center justify-between text-xs text-teal-200 font-bold">
              <span>متاح بفروع طنطا وزفتى</span>
              <span className="inline-flex items-center gap-1 group-hover:-translate-x-1 transition">
                <span>اختيار الموعد الآن</span>
                <ChevronLeft className="w-4 h-4" />
              </span>
            </div>
          </button>

          {/* Button 2: متابعة */}
          <button
            id="btn-followup-booking"
            type="button"
            onClick={() => onSelectBookingType('followup')}
            className="w-full group p-5 sm:p-6 rounded-3xl bg-white text-slate-800 shadow-md shadow-slate-200/50 hover:shadow-lg hover:border-teal-600 active:scale-[0.99] transition duration-200 text-right border-2 border-slate-200 cursor-pointer"
          >
            <div className="flex items-center justify-between gap-3">
              {/* Right side: Icon + Title + Description */}
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center shrink-0 group-hover:bg-teal-100 transition">
                  <Stethoscope className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div className="text-right min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-teal-900 transition">
                      متابعة
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                      استشارة
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium truncate mt-0.5">
                    متابعة خطة العلاج أو فحص الفحوصات
                  </p>
                </div>
              </div>

              {/* Left side: Price Badge + Arrow */}
              <div className="shrink-0 text-left pl-1">
                <div className="bg-slate-50 group-hover:bg-teal-50/70 border border-slate-200 group-hover:border-teal-200 px-3.5 py-2 rounded-2xl transition text-center">
                  <div className="text-lg sm:text-2xl font-black text-teal-800 font-mono leading-none">
                    {settings.followupPrice}
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-500 font-bold mt-0.5">
                    جنيه
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom action indicator */}
            <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
              <span>خلال مدة المتابعة المقررة</span>
              <span className="inline-flex items-center gap-1 text-teal-800 group-hover:-translate-x-1 transition">
                <span>اختيار الموعد الآن</span>
                <ChevronLeft className="w-4 h-4" />
              </span>
            </div>
          </button>

        </div>
      )}

      {/* Secondary Actions (Clean & minimal, not overloading) */}
      <div className="pt-6 border-t border-slate-200/80">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          للاستفسار السريع أو معرفة العناوين
        </p>
        <div className="grid grid-cols-3 gap-2.5">
          {/* Call Us */}
          <a
            href={`tel:${primaryPhone}`}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 transition text-slate-700 active:scale-95"
          >
            <Phone className="w-5 h-5 text-teal-700 mb-1" />
            <span className="text-xs font-bold">اتصل بنا</span>
          </a>

          {/* WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition text-slate-700 active:scale-95"
          >
            <MessageCircle className="w-5 h-5 text-emerald-600 mb-1" />
            <span className="text-xs font-bold">واتساب</span>
          </a>

          {/* Clinic Location */}
          <button
            onClick={onOpenClinicInfo}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 transition text-slate-700 active:scale-95 cursor-pointer"
          >
            <MapPin className="w-5 h-5 text-teal-700 mb-1" />
            <span className="text-xs font-bold">موقع العيادة</span>
          </button>
        </div>
      </div>

    </div>
  );
};
