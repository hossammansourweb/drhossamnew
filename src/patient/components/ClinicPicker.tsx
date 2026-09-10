import React from 'react';
import { MapPin, Calendar, Clock, ChevronLeft, ArrowRight, ExternalLink } from 'lucide-react';
import { ClinicConfig, BookingType } from '../../shared/types';
import { ARABIC_DAYS, convertTo12HourArabic } from '../../shared/utils/dateUtils';

interface Props {
  clinics: ClinicConfig[];
  bookingType: BookingType;
  price: number;
  onSelectClinic: (clinic: ClinicConfig) => void;
  onBack: () => void;
}

export const ClinicPicker: React.FC<Props> = ({
  clinics,
  bookingType,
  price,
  onSelectClinic,
  onBack
}) => {
  const getWorkingDaysText = (workingDays: number[]) => {
    if (!workingDays || workingDays.length === 0) return 'جميع أيام الأسبوع عدا الجمعة';
    return workingDays.map(d => ARABIC_DAYS[d]).join(' + ');
  };

  return (
    <div className="w-full max-w-xl mx-auto py-6 px-4" dir="rtl">
      
      {/* Top Header with Back Button */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع للرئيسية</span>
        </button>

        <div className="text-left">
          <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
            {bookingType === 'new' ? 'حجز جديد' : 'متابعة'} • {price} جنيه
          </span>
        </div>
      </div>

      {/* Step Heading */}
      <div className="text-center mb-8">
        <span className="text-xs font-bold text-teal-700 uppercase tracking-wider block mb-1">
          الخطوة 1 من 4
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
          اختر العيادة
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
          يرجى اختيار فرع العيادة الأنسب لك للاطلاع على أيام ومواعيد الكشف المتاحة
        </p>
      </div>

      {/* Two Large Buttons for Clinics */}
      <div className="space-y-4">
        {clinics.map((clinic) => {
          const isTanta = clinic.id === 'tanta' || clinic.name.includes('طنطا');
          const workingDaysLabel = getWorkingDaysText(clinic.workingDays);

          return (
            <div
              key={clinic.id}
              onClick={() => onSelectClinic(clinic)}
              className="group relative overflow-hidden p-6 sm:p-7 rounded-3xl bg-white border-2 border-slate-200/90 hover:border-teal-600 shadow-md hover:shadow-xl hover:shadow-teal-700/10 active:scale-[0.99] transition duration-200 cursor-pointer text-right"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                {/* Branch Info */}
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition ${
                    isTanta 
                      ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20 group-hover:scale-105' 
                      : 'bg-teal-50 text-teal-800 border border-teal-200 group-hover:bg-teal-700 group-hover:text-white'
                  }`}>
                    <MapPin className="w-7 h-7" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-teal-800 transition">
                        {clinic.name}
                      </h3>
                      <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                        {clinic.slotIntervalMinutes || 8} دقائق / كشف
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {clinic.address}
                    </p>

                    {/* Working Days Badge */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-bold text-slate-700">
                      <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        <span>أيام العمل: {workingDaysLabel}</span>
                      </span>
                      {((clinic.startTime || clinic.openTime) && (clinic.endTime || clinic.closeTime)) && (
                        <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span className="font-mono" dir="ltr">{convertTo12HourArabic(clinic.startTime || clinic.openTime || '')} — {convertTo12HourArabic(clinic.endTime || clinic.closeTime || '')}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Choose Action Pill */}
                <div className="sm:self-center shrink-0 text-left pt-2 sm:pt-0">
                  <span className="inline-flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl bg-teal-50 group-hover:bg-teal-700 text-teal-800 group-hover:text-white transition shadow-xs w-full sm:w-auto">
                    <span>اختيار الموعد</span>
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition" />
                  </span>
                </div>

              </div>

              {/* Google Maps link */}
              {clinic.googleMapsUrl && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
                  <a
                    href={clinic.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-900 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>موقع العيادة على خرائط Google Maps</span>
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
