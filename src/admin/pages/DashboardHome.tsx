import React from 'react';
import {
  Calendar,
  CalendarCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  TrendingUp,
  User,
  Phone
} from 'lucide-react';
import { Appointment } from '../../shared/types';
import { formatArabicDate } from '../../shared/utils/dateUtils';

interface Props {
  appointments: Appointment[];
  onNavigateToAppointments: (filterStatus?: string) => void;
  onOpenAppointmentDetails: (appointment: Appointment) => void;
}

export const DashboardHome: React.FC<Props> = ({
  appointments,
  onNavigateToAppointments,
  onOpenAppointmentDetails
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate statistics (Exact list per Section 17)
  const todayAppointments = appointments.filter(a => a.appointmentDate === todayStr);
  const upcomingAppointments = appointments.filter(a => a.appointmentDate >= todayStr && a.bookingStatus !== 'cancelled');
  const newBookings = appointments.filter(a => a.bookingType === 'new');
  const followups = appointments.filter(a => a.bookingType === 'followup');
  const confirmedBookings = appointments.filter(a => a.bookingStatus === 'confirmed');
  const unpaidBookings = appointments.filter(a => a.paymentStatus === 'unpaid' || a.paymentStatus === 'pay_at_clinic');
  const pendingReviewBookings = appointments.filter(a => a.paymentStatus === 'pending_review');
  const cancelledBookings = appointments.filter(a => a.bookingStatus === 'cancelled');

  const statCards = [
    {
      title: 'حجوزات اليوم',
      count: todayAppointments.length,
      desc: 'مواعيد كشوفات اليوم',
      icon: Clock,
      color: 'bg-teal-50 text-teal-800 border-teal-200',
      badgeColor: 'bg-teal-700 text-white',
      filter: 'today'
    },
    {
      title: 'الحجوزات القادمة',
      count: upcomingAppointments.length,
      desc: 'إجمالي المواعيد المستقبلية',
      icon: CalendarCheck,
      color: 'bg-blue-50 text-blue-800 border-blue-200',
      badgeColor: 'bg-blue-700 text-white',
      filter: 'upcoming'
    },
    {
      title: 'الحجوزات الجديدة',
      count: newBookings.length,
      desc: 'كشف أول مرة (300 جنيه)',
      icon: TrendingUp,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      badgeColor: 'bg-emerald-700 text-white',
      filter: 'new'
    },
    {
      title: 'المتابعات',
      count: followups.length,
      desc: 'كشف متابعة (200 جنيه)',
      icon: Calendar,
      color: 'bg-purple-50 text-purple-800 border-purple-200',
      badgeColor: 'bg-purple-700 text-white',
      filter: 'followup'
    },
    {
      title: 'الحجوزات المؤكدة',
      count: confirmedBookings.length,
      desc: 'تم تأكيد موعدها نهائياً',
      icon: CheckCircle2,
      color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      badgeColor: 'bg-indigo-700 text-white',
      filter: 'confirmed'
    },
    {
      title: 'في انتظار الدفع',
      count: unpaidBookings.length,
      desc: 'الدفع عند الوصول للعيادة',
      icon: Clock,
      color: 'bg-slate-50 text-slate-800 border-slate-200',
      badgeColor: 'bg-slate-700 text-white',
      filter: 'pay_at_clinic'
    },
    {
      title: 'في انتظار مراجعة الدفع',
      count: pendingReviewBookings.length,
      desc: 'تحويلات InstaPay بانتظار الاعتماد',
      icon: AlertCircle,
      color: 'bg-amber-50 text-amber-900 border-amber-300',
      badgeColor: 'bg-amber-600 text-white',
      highlight: true,
      filter: 'pending_review'
    },
    {
      title: 'الحجوزات الملغاة',
      count: cancelledBookings.length,
      desc: 'حجوزات ملغاة وتم فتح مواعيدها',
      icon: XCircle,
      color: 'bg-rose-50 text-rose-800 border-rose-200',
      badgeColor: 'bg-rose-600 text-white',
      filter: 'cancelled'
    },
  ];

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            نظرة عامة على حجوزات العيادة
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            إحصائيات فورية ومحدثة من قاعدة بيانات كشوفات د. حسام منصور أبوكل
          </p>
        </div>
        <button
          onClick={() => onNavigateToAppointments()}
          className="inline-flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer self-start sm:self-auto"
        >
          <span>عرض جدول الحجوزات بالكامل</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Large Statistics Grid (Section 17) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => onNavigateToAppointments(card.filter)}
              className={`p-4 sm:p-5 rounded-2xl border transition duration-150 cursor-pointer hover:shadow-md ${card.color} ${
                card.highlight ? 'ring-2 ring-amber-400' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${card.badgeColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-2xl sm:text-3xl font-black font-mono">
                  {card.count}
                </span>
              </div>
              <h3 className="text-sm font-extrabold block">
                {card.title}
              </h3>
              <p className="text-[11px] opacity-80 mt-0.5 truncate">
                {card.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Recent Appointments Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">
            أحدث الحجوزات المسجلة
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            آخر 5 حجوزات
          </span>
        </div>

        {appointments.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">لا توجد حجوزات مسجلة بعد.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {appointments.slice(0, 5).map((appt) => (
              <div
                key={appt.id}
                onClick={() => onOpenAppointmentDetails(appt)}
                className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 font-mono font-bold flex items-center justify-center text-xs">
                    #{appt.bookingNumber}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {appt.patientName}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="font-mono" dir="ltr">{appt.patientPhone}</span>
                      <span>•</span>
                      <span>{appt.appointmentDate} ({appt.appointmentTime})</span>
                    </div>
                  </div>
                </div>

                <div className="text-left flex items-center gap-3">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    appt.paymentStatus === 'paid'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : appt.paymentStatus === 'pending_review'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {appt.paymentStatus === 'paid' ? 'تم الدفع' : appt.paymentStatus === 'pending_review' ? 'مراجعة دفع' : 'دفع بالعيادة'}
                  </span>
                  <span className="text-xs font-extrabold text-slate-800">
                    {appt.price} ج
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
