import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Filter,
  Phone,
  MessageCircle,
  Eye,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Calendar,
  AlertCircle,
  Loader2,
  X,
  User,
  Banknote,
  Building2,
  FileText,
  MapPin,
  Trash2
} from 'lucide-react';
import { Appointment, BookingStatus, PaymentStatus, BookingType } from '../../shared/types';
import { updateAppointment, deleteAppointment } from '../../shared/services/bookingService';
import { formatArabicDate, formatRecordTimestamp } from '../../shared/utils/dateUtils';

interface Props {
  appointments: Appointment[];
  initialFilter?: string;
  onRefresh: () => void;
}

export const AppointmentsPage: React.FC<Props> = ({
  appointments,
  initialFilter,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [clinicFilter, setClinicFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>(() => {
    if (initialFilter === 'confirmed') return 'confirmed';
    if (initialFilter === 'cancelled') return 'cancelled';
    return 'all';
  });
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>(() => {
    if (initialFilter === 'pending_review') return 'pending_review';
    if (initialFilter === 'pay_at_clinic') return 'pay_at_clinic';
    return 'all';
  });

  // Collapsible filters: hidden by default
  const [showFilters, setShowFilters] = useState<boolean>(() => {
    return initialFilter !== undefined && initialFilter !== 'all';
  });

  // Selected appointment for details modal
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [editNotes, setEditNotes] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  // Toast notification (success / error feedback for status & payment updates)
  const [toast, setToast] = useState<{ id: number; type: 'success' | 'error'; message: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), type, message });
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  };

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
    new: 'جديد',
    confirmed: 'مؤكد',
    attended: 'حضر',
    not_attended: 'لم يحضر',
    completed: 'مكتمل',
    cancelled: 'ملغي',
  };

  const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
    unpaid: 'لم يتم الدفع',
    pay_at_clinic: 'الدفع بالعيادة',
    pending_review: 'مراجعة التحويل',
    paid: 'تم الدفع',
    rejected: 'مرفوض',
  };

  // Quick Today shortcut filter
  const todayStr = new Date().toISOString().split('T')[0];

  const handleFilterToday = () => {
    setDateFilter(todayStr);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setClinicFilter('all');
    setDateFilter('');
    setTypeFilter('all');
    setBookingStatusFilter('all');
    setPaymentStatusFilter('all');
  };

  const hasActiveFilters = Boolean(
    searchTerm ||
    clinicFilter !== 'all' ||
    dateFilter ||
    typeFilter !== 'all' ||
    bookingStatusFilter !== 'all' ||
    paymentStatusFilter !== 'all'
  );

  // Filtered appointments
  const filteredAppointments = appointments.filter(a => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = a.patientName.toLowerCase().includes(q);
      const matchPhone = (a.patientPhone || '').includes(q);
      const matchNum = String(a.bookingNumber).includes(q);
      if (!matchName && !matchPhone && !matchNum) return false;
    }

    // Clinic Filter: all, tanta, zefta
    if (clinicFilter !== 'all') {
      const cId = a.clinicId || (a.clinicName?.includes('زفتى') ? 'zefta' : 'tanta');
      if (cId !== clinicFilter) return false;
    }

    if (dateFilter && a.appointmentDate !== dateFilter) {
      return false;
    }

    if (typeFilter !== 'all' && a.bookingType !== typeFilter) {
      return false;
    }

    if (bookingStatusFilter !== 'all' && a.bookingStatus !== bookingStatusFilter) {
      return false;
    }

    if (paymentStatusFilter !== 'all' && a.paymentStatus !== paymentStatusFilter) {
      return false;
    }

    return true;
  });

  // Update status handler
  const handleUpdateStatus = async (
    apptId: string,
    updates: { bookingStatus?: BookingStatus; paymentStatus?: PaymentStatus; notes?: string }
  ) => {
    setActionLoading(true);
    try {
      await updateAppointment(apptId, updates);
      if (selectedAppt && selectedAppt.id === apptId) {
        setSelectedAppt(prev => prev ? { ...prev, ...updates } : null);
      }
      onRefresh();
      // Success toast describing exactly what changed
      if (updates.bookingStatus) {
        showToast('success', `تم تحديث حالة الحجز إلى: ${BOOKING_STATUS_LABELS[updates.bookingStatus]}`);
      } else if (updates.paymentStatus) {
        showToast('success', `تم تحديث حالة الدفع إلى: ${PAYMENT_STATUS_LABELS[updates.paymentStatus]}`);
      } else if (updates.notes !== undefined) {
        showToast('success', 'تم حفظ الملاحظات بنجاح');
      } else {
        showToast('success', 'تم تحديث الحجز بنجاح');
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      showToast('error', 'حدث خطأ أثناء تحديث حالة الحجز. يرجى المحاولة مرة أخرى.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete confirmation modal state (professional replacement for window.confirm)
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Close delete modal with Escape key
  useEffect(() => {
    if (!deleteTarget) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDeleteTarget(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deleteTarget]);

  // Delete appointment handler (runs only after modal confirmation)
  const handleDeleteAppointment = async () => {
    if (!deleteTarget) return;
    const { id: apptId, patientName } = deleteTarget;

    setDeleting(true);
    try {
      await deleteAppointment(apptId);
      if (selectedAppt && selectedAppt.id === apptId) {
        setSelectedAppt(null);
      }
      onRefresh();
      setDeleteTarget(null);
      showToast('success', `تم حذف حجز "${patientName}" نهائياً`);
    } catch (err) {
      console.error('Failed to delete appointment:', err);
      showToast('error', 'حدث خطأ أثناء حذف الحجز. يرجى المحاولة مرة أخرى.');
    } finally {
      setDeleting(false);
    }
  };

  const openDetails = (appt: Appointment) => {
    setSelectedAppt(appt);
    setEditNotes(appt.notes || '');
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            إدارة ومتابعة الحجوزات
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            عرض وتحديث حالات الكشف والدفع والتواصل مع المرضى
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Toggle Filters Button */}
          <button
            onClick={() => setShowFilters(prev => !prev)}
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border transition cursor-pointer ${
              showFilters
                ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>الفلاتر</span>
            {hasActiveFilters && (
              <span className={`w-2 h-2 rounded-full ${showFilters ? 'bg-amber-300' : 'bg-teal-600'}`} />
            )}
          </button>

          <button
            onClick={handleFilterToday}
            className={`text-xs font-bold px-3 py-2 rounded-xl border transition cursor-pointer ${
              dateFilter === todayStr
                ? 'bg-teal-700 text-white border-teal-700'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            حجوزات اليوم فقط
          </button>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-xs font-bold px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-transparent transition cursor-pointer"
            >
              إعادة تعيين الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Filter Bar - Hidden by default */}
      {showFilters && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
            
            {/* Clinic Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">الفرع</label>
              <select
                value={clinicFilter}
                onChange={(e) => setClinicFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-teal-200 bg-teal-50/50 focus:border-teal-600 text-xs font-bold text-teal-900 outline-none"
              >
                <option value="all">كل العيادات (طنطا وزفتى)</option>
                <option value="tanta">عيادة طنطا</option>
                <option value="zefta">عيادة زفتى</option>
              </select>
            </div>

            {/* Search Box */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">بحث</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="بحث بالاسم أو الهاتف أو رقم الحجز..."
                  className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 focus:border-teal-600 text-xs text-slate-800 outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">التاريخ</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-teal-600 text-xs text-slate-800 outline-none"
              />
            </div>

            {/* Booking Type Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">النوع</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-teal-600 text-xs text-slate-800 outline-none bg-white"
              >
                <option value="all">كل أنواع الحجز</option>
                <option value="new">حجز جديد (300 ج)</option>
                <option value="followup">متابعة (200 ج)</option>
              </select>
            </div>

            {/* Booking Status Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">حالة الحجز</label>
              <select
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-teal-600 text-xs text-slate-800 outline-none bg-white"
              >
                <option value="all">كل حالات الحجز</option>
                <option value="new">جديد</option>
                <option value="confirmed">مؤكد</option>
                <option value="attended">حضر</option>
                <option value="not_attended">لم يحضر</option>
                <option value="completed">مكتمل</option>
                <option value="cancelled">ملغي</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">حالة الدفع</label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-teal-600 text-xs text-slate-800 outline-none bg-white"
              >
                <option value="all">كل حالات الدفع</option>
                <option value="unpaid">لم يتم الدفع</option>
                <option value="pay_at_clinic">الدفع في العيادة</option>
                <option value="pending_review">في انتظار المراجعة (InstaPay)</option>
                <option value="paid">تم الدفع</option>
                <option value="rejected">مرفوض</option>
              </select>
            </div>

          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>عدد النتائج: <strong className="text-slate-800 font-mono">{filteredAppointments.length}</strong> حجز</span>
            <button
              onClick={() => setShowFilters(false)}
              className="text-slate-400 hover:text-slate-600 text-xs"
            >
              إخفاء الفلاتر ▲
            </button>
          </div>
        </div>
      )}

      {/* Quick Summary Pill if filters are closed */}
      {!showFilters && (
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>إجمالي النتائج المعروضة: <strong className="text-slate-800 font-mono">{filteredAppointments.length}</strong> حجز</span>
          {hasActiveFilters && (
            <span className="text-[11px] text-teal-700 font-bold bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              يوجد فلاتر مفعّلة
            </span>
          )}
        </div>
      )}

      {/* Mobile Cards View (shown on screens smaller than md) */}
      <div className="block md:hidden space-y-3">
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-200">
            لا توجد حجوزات مطابقة للفلاتر الحالية.
          </div>
        ) : (
          filteredAppointments.map((appt) => {
            const whatsappMsg = encodeURIComponent(
              `مرحباً ${appt.patientName}، بخصوص حجز موعدك رقم #${appt.bookingNumber} بعيادة د. حسام منصور أبوكل (${appt.clinicName || (appt.clinicId === 'zefta' ? 'عيادة زفتى' : 'عيادة طنطا')}) في تاريخ ${appt.appointmentDate} الساعة ${appt.appointmentTime}.`
            );
            const waLink = `https://wa.me/2${(appt.patientPhone || '').replace(/\D/g, '')}?text=${whatsappMsg}`;

            return (
              <div
                key={appt.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3 text-right"
              >
                {/* Card Top Row: Booking #, Clinic & Status */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-teal-800 text-sm bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200">
                      #{appt.bookingNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-600">
                      {appt.clinicName || (appt.clinicId === 'zefta' ? 'عيادة زفتى' : 'عيادة طنطا')}
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    appt.bookingStatus === 'confirmed'
                      ? 'bg-blue-100 text-blue-800'
                      : appt.bookingStatus === 'attended'
                      ? 'bg-emerald-100 text-emerald-800'
                      : appt.bookingStatus === 'completed'
                      ? 'bg-slate-200 text-slate-800'
                      : appt.bookingStatus === 'cancelled'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-900'
                  }`}>
                    {appt.bookingStatus === 'new' && 'جديد'}
                    {appt.bookingStatus === 'confirmed' && 'مؤكد'}
                    {appt.bookingStatus === 'attended' && 'حضر'}
                    {appt.bookingStatus === 'not_attended' && 'لم يحضر'}
                    {appt.bookingStatus === 'completed' && 'مكتمل'}
                    {appt.bookingStatus === 'cancelled' && 'ملغي'}
                  </span>
                </div>

                {/* Patient Name & Type */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{appt.patientName}</h4>
                    <span className="font-mono text-slate-500 text-xs block" dir="ltr">
                      {appt.patientPhone}
                    </span>
                  </div>

                  <div className="text-left">
                    <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] block w-fit ml-auto ${
                      appt.bookingType === 'new'
                        ? 'bg-teal-50 text-teal-800 border border-teal-200'
                        : 'bg-purple-50 text-purple-800 border border-purple-200'
                    }`}>
                      {appt.bookingType === 'new' ? 'حجز جديد' : 'متابعة'}
                    </span>
                    <span className="font-mono font-black text-slate-800 text-xs mt-0.5 block">
                      {appt.price} جنيه
                    </span>
                  </div>
                </div>

                {/* Date, Time & Payment Pill */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50 p-2.5 rounded-xl">
                  <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-teal-700" />
                    <span>{appt.appointmentDate}</span>
                    <span className="text-slate-400">•</span>
                    <Clock className="w-3.5 h-3.5 text-teal-700" />
                    <span className="font-mono" dir="ltr">{appt.appointmentTime}</span>
                  </div>

                  <div>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      appt.paymentStatus === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : appt.paymentStatus === 'pending_review'
                        ? 'bg-amber-100 text-amber-900 animate-pulse'
                        : appt.paymentStatus === 'rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {appt.paymentMethod === 'clinic' ? 'نقداً بالعيادة' : 'InstaPay'}
                      {' - '}
                      {appt.paymentStatus === 'paid' && 'مدفوع'}
                      {appt.paymentStatus === 'pending_review' && 'مراجعة الدفع'}
                      {appt.paymentStatus === 'pay_at_clinic' && 'في انتظار الدفع'}
                      {appt.paymentStatus === 'unpaid' && 'غير مدفوع'}
                      {appt.paymentStatus === 'rejected' && 'مرفوض'}
                    </span>
                  </div>
                </div>

                {/* Mobile Card Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => openDetails(appt)}
                    className="flex-1 py-2 rounded-xl bg-teal-800 text-white font-bold text-xs flex items-center justify-center gap-1 hover:bg-teal-900 transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>تفاصيل الحجز</span>
                  </button>

                  {/* Quick Delete */}
                  <button
                    onClick={() => setDeleteTarget(appt)}
                    disabled={actionLoading}
                    className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                    title="حذف الحجز نهائياً من قاعدة البيانات"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <a
                    href={appt.patientPhone ? `tel:${appt.patientPhone}` : undefined}
                    className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition"
                    title="اتصال"
                  >
                    <Phone className="w-4 h-4" />
                  </a>

                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
                    title="واتساب"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View (hidden on mobile, visible on md and up) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="py-3.5 px-4">رقم الحجز</th>
                <th className="py-3.5 px-4">العيادة</th>
                <th className="py-3.5 px-4">المريض</th>
                <th className="py-3.5 px-4">نوع الحجز</th>
                <th className="py-3.5 px-4">الموعد</th>
                <th className="py-3.5 px-4">السعر</th>
                <th className="py-3.5 px-4">طريقة الدفع</th>
                <th className="py-3.5 px-4">حالة الدفع</th>
                <th className="py-3.5 px-4">حالة الحجز</th>
                <th className="py-3.5 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    لا توجد نتائج مطابقة لشروط البحث والفلاتر.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((appt) => {
                  const whatsappMsg = encodeURIComponent(
                    `مرحباً ${appt.patientName}، بخصوص حجز موعدك رقم #${appt.bookingNumber} بعيادة د. حسام منصور أبوكل (${appt.clinicName || (appt.clinicId === 'zefta' ? 'عيادة زفتى' : 'عيادة طنطا')}) في تاريخ ${appt.appointmentDate} الساعة ${appt.appointmentTime}.`
                  );
const waLink = `https://wa.me/2${(appt.patientPhone || '').replace(/\D/g, '')}?text=${whatsappMsg}`;

                  return (
                    <tr key={appt.id} className="hover:bg-slate-50/80 transition">
                      {/* Booking Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-800">
                        #{appt.bookingNumber}
                      </td>

                      {/* Clinic */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                          <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
                          <span>{appt.clinicName || (appt.clinicId === 'zefta' ? 'عيادة زفتى' : 'عيادة طنطا')}</span>
                        </span>
                      </td>

                      {/* Patient Name & Phone */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{appt.patientName}</span>
                        <span className="font-mono text-slate-500 text-[11px]" dir="ltr">{appt.patientPhone || '-'}</span>
                      </td>

                      {/* Booking Type */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                          appt.bookingType === 'new'
                            ? 'bg-teal-50 text-teal-800 border border-teal-200'
                            : 'bg-purple-50 text-purple-800 border border-purple-200'
                        }`}>
                          {appt.bookingType === 'new' ? 'حجز جديد' : 'متابعة'}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-800 block">{appt.appointmentDate}</span>
                        <span className="font-mono text-slate-500 text-[11px]" dir="ltr">{appt.appointmentTime}</span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                        {appt.price} ج
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4">
                        {appt.paymentMethod === 'clinic' ? (
                          <span className="text-slate-600">في العيادة</span>
                        ) : (
                          <span className="text-purple-700 font-semibold flex items-center gap-1">
                            <span>InstaPay</span>
                            {appt.paymentProofUrl && <span className="w-1.5 h-1.5 rounded-full bg-purple-600" title="يوجد إيصال مرفوع" />}
                          </span>
                        )}
                      </td>

                      {/* Payment Status */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          appt.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : appt.paymentStatus === 'pending_review'
                            ? 'bg-amber-100 text-amber-900 animate-pulse'
                            : appt.paymentStatus === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {appt.paymentStatus === 'paid' && 'تم الدفع'}
                          {appt.paymentStatus === 'pending_review' && 'مراجعة الدفع'}
                          {appt.paymentStatus === 'pay_at_clinic' && 'الدفع بالعيادة'}
                          {appt.paymentStatus === 'unpaid' && 'لم يتم الدفع'}
                          {appt.paymentStatus === 'rejected' && 'مرفوض'}
                        </span>
                      </td>

                      {/* Booking Status */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          appt.bookingStatus === 'confirmed'
                            ? 'bg-blue-100 text-blue-800'
                            : appt.bookingStatus === 'attended'
                            ? 'bg-emerald-100 text-emerald-800'
                            : appt.bookingStatus === 'completed'
                            ? 'bg-slate-200 text-slate-800'
                            : appt.bookingStatus === 'cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}>
                          {appt.bookingStatus === 'new' && 'جديد'}
                          {appt.bookingStatus === 'confirmed' && 'مؤكد'}
                          {appt.bookingStatus === 'attended' && 'حضر'}
                          {appt.bookingStatus === 'not_attended' && 'لم يحضر'}
                          {appt.bookingStatus === 'completed' && 'مكتمل'}
                          {appt.bookingStatus === 'cancelled' && 'ملغي'}
                        </span>
                      </td>

                      {/* Actions Buttons (Section 18) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Details */}
                          <button
                            onClick={() => openDetails(appt)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                            title="فتح التفاصيل"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Confirm */}
                          {appt.bookingStatus !== 'confirmed' && appt.bookingStatus !== 'cancelled' && (
                            <button
                              onClick={() => handleUpdateStatus(appt.id, { bookingStatus: 'confirmed' })}
                              disabled={actionLoading}
                              className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 transition"
                              title="تأكيد الحجز"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete Permanently from Database (Replaces Cancel on Desktop) */}
                          <button
                            onClick={() => setDeleteTarget(appt)}
                            disabled={actionLoading}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 transition cursor-pointer"
                            title="حذف الحجز نهائياً من قاعدة البيانات"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Call */}
                          <a
href={appt.patientPhone ? `tel:${appt.patientPhone}` : undefined}

                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 transition"
                            title="اتصال هاتفي"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>

                          {/* Quick WhatsApp */}
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition"
                            title="محادثة واتساب"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Appointment Full Details Modal */}
      {selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 my-8 text-right" dir="rtl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-800 font-mono font-black flex items-center justify-center text-sm">
                  #{selectedAppt.bookingNumber}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    تفاصيل حجز: {selectedAppt.patientName}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono" dir="ltr">
{selectedAppt.patientPhone || '-'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAppt(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="col-span-2 bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-500 font-bold flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-teal-600" /> فرع العيادة:
                  </span>
                  <span className="font-extrabold text-teal-900 text-sm">
                    {selectedAppt.clinicName || (selectedAppt.clinicId === 'zefta' ? 'عيادة زفتى' : 'عيادة طنطا')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">نوع الكشف</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {selectedAppt.bookingType === 'new' ? 'حجز جديد' : 'متابعة'} ({selectedAppt.price} ج)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">الموعد المحدد</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {selectedAppt.appointmentDate} ({selectedAppt.appointmentTime})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">طريقة الدفع</span>
                  <span className="font-bold text-slate-800">
                    {selectedAppt.paymentMethod === 'clinic' ? 'الدفع في العيادة' : 'InstaPay'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">تاريخ التسجيل</span>
                  <span className="font-mono text-slate-600">
                    {formatRecordTimestamp(selectedAppt.createdAt)}
                  </span>
                </div>
              </div>

              {/* InstaPay Proof Screenshot */}
              {selectedAppt.paymentProofUrl && (
                <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200">
                  <span className="font-bold text-purple-900 block mb-2">صورة إيصال التحويل المرفقة:</span>
                  <a
                    href={selectedAppt.paymentProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group relative rounded-xl overflow-hidden border border-purple-300 max-h-56"
                  >
                    <img
                      src={selectedAppt.paymentProofUrl}
                      alt="إيصال دفع حجز عيادة د. حسام منصور أبوكل"
                      width={640}
                      height={360}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-auto object-contain max-h-56 bg-white"
                    />
                    <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition">
                      انقر لعرض الصورة بالحجم الكامل <ExternalLink className="w-4 h-4 mr-1" />
                    </div>
                  </a>
                </div>
              )}

              {/* Status Update Buttons */}
              <div className="space-y-3 pt-2">
                <span className="font-bold text-slate-900 block">تحديث حالة الحجز:</span>
                <div className="flex flex-wrap gap-2">
                  {(['new', 'confirmed', 'attended', 'not_attended', 'completed', 'cancelled'] as BookingStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(selectedAppt.id, { bookingStatus: status })}
                      disabled={actionLoading}
                      className={`px-3 py-1.5 rounded-xl font-bold transition text-xs cursor-pointer ${
                        selectedAppt.bookingStatus === status
                          ? 'bg-teal-700 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {status === 'new' && 'جديد'}
                      {status === 'confirmed' && 'تأكيد ✓'}
                      {status === 'attended' && 'حضر'}
                      {status === 'not_attended' && 'لم يحضر'}
                      {status === 'completed' && 'مكتمل'}
                      {status === 'cancelled' && 'إلغاء ✕'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Status Buttons */}
              <div className="space-y-3 pt-2">
                <span className="font-bold text-slate-900 block">تحديث حالة الدفع:</span>
                <div className="flex flex-wrap gap-2">
                  {(['unpaid', 'pay_at_clinic', 'pending_review', 'paid', 'rejected'] as PaymentStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(selectedAppt.id, { paymentStatus: status })}
                      disabled={actionLoading}
                      className={`px-3 py-1.5 rounded-xl font-bold transition text-xs cursor-pointer ${
                        selectedAppt.paymentStatus === status
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {status === 'unpaid' && 'لم يتم الدفع'}
                      {status === 'pay_at_clinic' && 'بالعيادة'}
                      {status === 'pending_review' && 'مراجعة التحويل'}
                      {status === 'paid' && 'تأكيد الدفع ✓'}
                      {status === 'rejected' && 'رفض الدفع ✕'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes Input */}
              <div className="pt-2">
                <label className="font-bold text-slate-900 block mb-1.5">ملاحظات الطبيب / العيادة:</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="ملاحظات سريرية أو تعليمات خاصة..."
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-teal-600 text-xs text-slate-800 outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedAppt.id, { notes: editNotes })}
                  disabled={actionLoading}
                  className="mt-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                >
                  حفظ الملاحظات
                </button>
              </div>

            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
<a
                    href={selectedAppt.patientPhone ? `tel:${selectedAppt.patientPhone}` : undefined}
                    className="px-3 py-2 rounded-xl bg-teal-50 text-teal-800 hover:bg-teal-100 font-bold text-xs flex items-center gap-1.5 transition"
                  >
                  <Phone className="w-3.5 h-3.5" />
                  <span>اتصال</span>
                </a>
                <a
                  href={`https://wa.me/2${(selectedAppt.patientPhone || '').replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>واتساب</span>
                </a>
              </div>

              <button
                onClick={() => setSelectedAppt(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Professional delete-confirmation modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          dir="rtl"
          onClick={() => !deleting && setDeleteTarget(null)}
          role="alertdialog"
          aria-modal="true"
          aria-label="تأكيد حذف الحجز"
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 fade-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Warning icon */}
            <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-1.5">
              حذف الحجز نهائياً؟
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              هذا الإجراء لا يمكن التراجع عنه. سيتم مسح الحجز بالكامل وإتاحة الموعد فوراً لحجز جديد.
            </p>

            {/* Booking summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 mb-5 text-right space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">المريض</span>
                <span className="font-black text-slate-900">{deleteTarget.patientName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">رقم الحجز</span>
                <span className="font-black font-mono text-slate-800" dir="ltr">#{deleteTarget.bookingNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">الموعد</span>
                <span className="font-bold text-slate-800">
                  {deleteTarget.clinicName} • {deleteTarget.appointmentDate} ({deleteTarget.appointmentTime})
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer disabled:opacity-60"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleDeleteAppointment}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري الحذف...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>نعم، احذف نهائياً</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification — confirms booking/payment updates */}
      {toast && (
        <div
          key={toast.id}
          role={toast.type === 'error' ? 'alert' : 'status'}
          dir="rtl"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2.5 bg-white/95 backdrop-blur px-4 py-2.5 rounded-full shadow-xl shadow-slate-900/10 border border-slate-200 text-[13px] font-bold text-slate-800 max-w-[92vw] whitespace-nowrap overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
              toast.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
          </span>
          <span className="truncate">{toast.message}</span>
        </div>
      )}

    </div>
  );
};
