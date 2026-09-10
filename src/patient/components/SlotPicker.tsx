import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, Calendar as CalendarIcon, Clock, AlertCircle, Loader2, MapPin } from 'lucide-react';
import { BookingType, ClinicConfig, ClinicSettings } from '../../shared/types';
import { getClinicSlotsForDate } from '../../shared/services/bookingService';
import {
  formatArabicDate,
  get30DaysWorkingDatesForClinic,
  AvailableClinicDate
} from '../../shared/utils/dateUtils';

interface Props {
  clinic: ClinicConfig;
  settings: ClinicSettings;
  bookingType: BookingType;
  price: number;
  onBack: () => void;
  onSlotSelected: (date: string, time: string) => void;
}

export const SlotPicker: React.FC<Props> = ({
  clinic,
  settings,
  bookingType,
  price,
  onBack,
  onSlotSelected
}) => {
  // Generate 30 days window matching the selected clinic's working days only
  const availableWorkingDates = useMemo<AvailableClinicDate[]>(() => {
    return get30DaysWorkingDatesForClinic(
      clinic.workingDays || [6, 2],
      settings.blockedDates || []
    );
  }, [clinic, settings.blockedDates]);

  const [selectedDate, setSelectedDate] = useState<string>(
    availableWorkingDates[0]?.dateStr || ''
  );
  const [slots, setSlots] = useState<{ time: string; isBooked: boolean; isBlocked?: boolean }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // When available working dates change (e.g. if clinic changed), default to first working date
  useEffect(() => {
    if (availableWorkingDates.length > 0 && !availableWorkingDates.some(d => d.dateStr === selectedDate)) {
      setSelectedDate(availableWorkingDates[0].dateStr);
    }
  }, [availableWorkingDates, selectedDate]);

  useEffect(() => {
    let isMounted = true;
    async function loadSlots() {
      if (!selectedDate) {
        setSlots([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setSelectedTime(null);
      try {
        const result = await getClinicSlotsForDate(clinic.id, selectedDate, settings);
        if (isMounted) {
          setSlots(result);
        }
      } catch (err) {
        console.error('Error loading clinic slots:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadSlots();
    return () => { isMounted = false; };
  }, [clinic.id, selectedDate, settings]);

  const handleConfirmSlot = (time: string) => {
    setSelectedTime(time);
    onSlotSelected(selectedDate, time);
  };

  return (
    <div className="w-full max-w-xl mx-auto py-4 sm:py-6 px-4" dir="rtl">
      
      {/* Top Bar with Back Action & Clinic Indicator */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
          <span>تغيير العيادة</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
            <MapPin className="w-3.5 h-3.5 text-teal-600" />
            {clinic.name}
          </span>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
            {bookingType === 'new' ? 'حجز جديد' : 'متابعة'} • {price} جنيه
          </span>
        </div>
      </div>

      {/* Heading */}
      <div className="text-center mb-6">
        <span className="text-xs font-bold text-teal-700 uppercase tracking-wider block mb-1">
          الخطوة 2 من 4
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
          اختر التاريخ والموعد
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          المواعيد المتاحة خلال الـ 30 يوماً القادمة في {clinic.name} (كل {clinic.slotIntervalMinutes || 8} دقائق)
        </p>
      </div>

      {/* Date Carousel — ONLY working days within 30 days */}
      {availableWorkingDates.length === 0 ? (
        <div className="py-12 px-4 text-center bg-white rounded-3xl border border-slate-200 mb-6">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800 text-base">لا توجد أيام عمل متاحة حالياً لهذه العيادة</h3>
          <p className="text-xs text-slate-500 mt-1">يرجى اختيار فرع آخر أو مراجعة إدارة العيادة.</p>
        </div>
      ) : (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-600">
              أيام العمل المتاحة (خلال 30 يوم):
            </label>
            <span className="text-[11px] font-semibold text-slate-500">
              {availableWorkingDates.length} يوم متاح
            </span>
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-3 pt-1 scrollbar-thin no-scrollbar">
            {availableWorkingDates.map((item) => {
              const isSelected = item.dateStr === selectedDate;
              const dayNum = item.dateStr.split('-')[2];
              const monthNum = item.dateStr.split('-')[1];

              return (
                <button
                  key={item.dateStr}
                  onClick={() => setSelectedDate(item.dateStr)}
                  className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[88px] sm:min-w-[96px] p-3 rounded-2xl border-2 transition duration-150 cursor-pointer ${
                    isSelected
                      ? 'border-teal-700 bg-teal-700 text-white shadow-md shadow-teal-700/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-teal-400 hover:bg-slate-50'
                  }`}
                >
                  <span className={`text-xs font-bold ${isSelected ? 'text-teal-100' : 'text-slate-500'}`}>
                    {item.dayName}
                  </span>
                  <span className="text-lg font-black my-0.5">
                    {dayNum}
                  </span>
                  <span className={`text-[11px] font-medium ${isSelected ? 'text-teal-100' : 'text-slate-400'}`}>
                    شهر {monthNum}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Date Header */}
      {selectedDate && (
        <div className="bg-slate-100/80 rounded-2xl p-3.5 mb-5 flex items-center justify-between text-right border border-slate-200">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-teal-700" />
            <span className="text-xs sm:text-sm font-bold text-slate-800">
              {formatArabicDate(selectedDate)}
            </span>
          </div>
          <span className="text-xs text-slate-500 font-bold">
            {loading ? 'جاري الفحص...' : `${slots.filter(s => !s.isBooked).length} موعد شاغر`}
          </span>
        </div>
      )}

      {/* Slots Grid */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-teal-700 mb-3" />
          <p className="text-xs sm:text-sm font-bold">جاري تحميل المواعيد وفحص الحجوزات...</p>
        </div>
      ) : slots.length === 0 ? (
        <div className="py-12 px-4 text-center bg-white rounded-3xl border border-slate-200">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800 text-base">لا توجد مواعيد لهذا التاريخ</h3>
          <p className="text-xs text-slate-500 mt-1">يرجى اختيار يوم آخر من الأيام المتاحة بالأعلى.</p>
        </div>
      ) : (
        <div>
          <label className="text-xs font-bold text-slate-600 mb-2.5 block text-right">
            اختر الساعة المناسبة (مدة الكشف {clinic.slotIntervalMinutes || 8} دقائق):
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[420px] overflow-y-auto p-1">
            {slots.map((slot) => {
              const isSelected = selectedTime === slot.time;
              
              if (slot.isBooked) {
                return (
                  <div
                    key={slot.time}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-400 text-center select-none opacity-60"
                    title="هذا الموعد تم حجزه بالفعل"
                  >
                    <span className="text-xs font-bold line-through block font-mono" dir="ltr">
                      {slot.time}
                    </span>
                    <span className="text-[10px] font-bold text-rose-500 mt-0.5 block">
                      {slot.isBlocked ? 'غير متاح' : 'محجوز'}
                    </span>
                  </div>
                );
              }

              return (
                <button
                  key={slot.time}
                  onClick={() => handleConfirmSlot(slot.time)}
                  className={`group p-3.5 rounded-2xl border-2 text-center transition duration-150 cursor-pointer active:scale-95 shadow-xs ${
                    isSelected
                      ? 'border-teal-700 bg-teal-700 text-white shadow-md'
                      : 'border-slate-200 bg-white text-slate-800 hover:border-teal-600 hover:bg-teal-50/40'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-teal-200' : 'text-teal-700'}`} />
                    <span className="text-sm sm:text-base font-black font-mono" dir="ltr">
                      {slot.time}
                    </span>
                  </div>
                  <span className={`text-[10px] block mt-1 font-bold ${isSelected ? 'text-teal-100' : 'text-emerald-600'}`}>
                    متاح للحجز
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
