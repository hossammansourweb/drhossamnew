import React, { useState } from 'react';
import {
  Save,
  CheckCircle2,
  Stethoscope,
  MapPin,
  Phone,
  MessageCircle,
  CreditCard,
  Clock,
  Globe,
  Loader2,
  Plus,
  Trash2,
  ExternalLink,
  Sliders,
  ShieldCheck
} from 'lucide-react';
import { ClinicSettings, ClinicConfig } from '../../shared/types';
import { convertTo12HourArabic } from '../../shared/utils/dateUtils';
import { saveClinicSettings } from '../../shared/services/bookingService';

interface Props {
  settings: ClinicSettings;
  onSettingsUpdated: (updated: ClinicSettings) => void;
}

const WEEK_DAYS = [
  { id: 6, name: 'السبت' },
  { id: 0, name: 'الأحد' },
  { id: 1, name: 'الإثنين' },
  { id: 2, name: 'الثلاثاء' },
  { id: 3, name: 'الأربعاء' },
  { id: 4, name: 'الخميس' },
  { id: 5, name: 'الجمعة' },
];

export const SettingsPage: React.FC<Props> = ({ settings, onSettingsUpdated }) => {
  const [formData, setFormData] = useState<ClinicSettings>({
    ...settings,
    enableInstapay: settings.enableInstapay ?? true,
    enableClinicPayment: settings.enableClinicPayment ?? true,
    isBookingEnabled: settings.isBookingEnabled ?? true,
    siteTitle: settings.siteTitle || 'عيادات د. حسام منصور أبوكل | جراحة العظام',
    siteDescription: settings.siteDescription || 'الحجز الإلكتروني المباشر لعيادات د. حسام منصور أبوكل بطنطا وزفتى',
    announcementNotice: settings.announcementNotice || '',
    instapayAccountName: settings.instapayAccountName || 'د. حسام منصور أبوكل',
    doctorTitle: settings.doctorTitle || 'استشاري جراحة العظام بالقوات المسلحة',
    doctorBio: settings.doctorBio || 'استشاري جراحة العظام والعمود الفقري ومناظير المفاصل والكسور المعقدة بالقوات المسلحة.'
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState<'all' | 'doctor' | 'clinics' | 'pricing' | 'payments' | 'contact'>('all');

  const handleFieldChange = (field: keyof ClinicSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Manage Clinic Branches
  const handleBranchChange = (index: number, key: keyof ClinicConfig, val: any) => {
    const nextBranches = [...formData.clinics];
    nextBranches[index] = { ...nextBranches[index], [key]: val };
    setFormData(prev => ({ ...prev, clinics: nextBranches }));
  };

  const handleToggleBranchDay = (clinicIndex: number, dayNumber: number) => {
    const nextBranches = [...formData.clinics];
    const clinic = nextBranches[clinicIndex];
    const currentDays = clinic.workingDays || [];
    const updatedDays = currentDays.includes(dayNumber)
      ? currentDays.filter(d => d !== dayNumber)
      : [...currentDays, dayNumber].sort();
    nextBranches[clinicIndex] = { ...clinic, workingDays: updatedDays };
    setFormData(prev => ({ ...prev, clinics: nextBranches }));
  };

  const handleAddBranch = () => {
    const newId = 'clinic_' + Date.now();
    setFormData(prev => ({
      ...prev,
      clinics: [
        ...prev.clinics,
        {
          id: newId,
          name: 'فرع جديد',
          city: 'المدينة',
          address: '',
          googleMapsUrl: '',
          phone: '',
          workingDays: [6, 3],
          startTime: '19:00',
          endTime: '22:00',
          openTime: '19:00',
          closeTime: '22:00',
          slotIntervalMinutes: 8,
          isWorking: true
        }
      ]
    }));
  };

  const handleRemoveBranch = (index: number) => {
    if (formData.clinics.length <= 1) {
      alert('يجب أن تتوفر عيادة واحدة على الأقل.');
      return;
    }
    const nextBranches = formData.clinics.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, clinics: nextBranches }));
  };

  // Phone list management
  const handlePhoneChange = (index: number, value: string) => {
    const nextPhones = [...formData.phoneNumbers];
    nextPhones[index] = value;
    setFormData(prev => ({ ...prev, phoneNumbers: nextPhones }));
  };

  const handleAddPhone = () => {
    setFormData(prev => ({
      ...prev,
      phoneNumbers: [...prev.phoneNumbers, '']
    }));
  };

  const handleRemovePhone = (index: number) => {
    if (formData.phoneNumbers.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      phoneNumbers: prev.phoneNumbers.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const updated = await saveClinicSettings(formData);
      onSettingsUpdated(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('حدث خطأ أثناء حفظ الإعدادات في Firestore.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-right pb-12" dir="rtl">
      
      {/* Header & Main Save Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Sliders className="w-6 h-6 text-teal-700" />
            <span>لوحة التحكم في إعدادات الموقع والعيادة</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            المركز الموحد للتحكم بجميع بيانات الطبيب، الفروع، الأسعار، الحسابات، وطرق التواصل
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 text-xs font-bold px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white transition cursor-pointer shadow-md disabled:opacity-60 self-start sm:self-auto"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'جاري الحفظ في Firestore...' : 'حفظ التعديلات'}</span>
        </button>
      </div>

      {/* Success Notification */}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>تم حفظ الإعدادات المركزية وتحديثها فوراً في قاعدة بيانات Firestore!</span>
        </div>
      )}

      {/* Section Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
        {[
          { id: 'all', label: 'عرض الكل' },
          { id: 'doctor', label: 'معلومات الطبيب والموقع' },
          { id: 'clinics', label: 'الفروع ومواعيد العمل' },
          { id: 'pricing', label: 'الأسعار والحجز' },
          { id: 'payments', label: 'الدفع وإنستاباي' },
          { id: 'contact', label: 'التواصل والواتساب' },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSection(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
              activeSection === tab.id
                ? 'bg-teal-800 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. معلومات الطبيب والموقع */}
      {(activeSection === 'all' || activeSection === 'doctor') && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Stethoscope className="w-4 h-4 text-teal-700" />
            <span>بيانات الطبيب وهوية الموقع</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                اسم الطبيب الكامل
              </label>
              <input
                type="text"
                required
                value={formData.doctorName}
                onChange={(e) => handleFieldChange('doctorName', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 outline-none focus:border-teal-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                التخصص والصفة الرسمية
              </label>
              <input
                type="text"
                required
                value={formData.doctorSpecialty}
                onChange={(e) => handleFieldChange('doctorSpecialty', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 outline-none focus:border-teal-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                اللقب الطبي (يظهر في الهيدر)
              </label>
              <input
                type="text"
                value={formData.doctorTitle || ''}
                onChange={(e) => handleFieldChange('doctorTitle', e.target.value)}
                placeholder="استشاري جراحة العظام بالقوات المسلحة"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-teal-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                عنوان الموقع الإلكتروني (Site Title)
              </label>
              <input
                type="text"
                value={formData.siteTitle || ''}
                onChange={(e) => handleFieldChange('siteTitle', e.target.value)}
                placeholder="عيادات د. حسام منصور أبوكل | جراحة العظام"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-teal-700"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                نبذة عن الطبيب وخبراته (تظهر في الواجهة والفوتر)
              </label>
              <textarea
                rows={2}
                value={formData.doctorBio || ''}
                onChange={(e) => handleFieldChange('doctorBio', e.target.value)}
                placeholder="استشاري جراحة العظام والعمود الفقري ومناظير المفاصل والكسور المعقدة بالقوات المسلحة."
                className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-teal-700"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                شريط التنبيهات العلوي للموقع (اختياري - يظهر كإشعار في أعلى الصفحة)
              </label>
              <input
                type="text"
                value={formData.announcementNotice || ''}
                onChange={(e) => handleFieldChange('announcementNotice', e.target.value)}
                placeholder="مثال: الحجز متاح الآن للأسبوع القادم بفرعي طنطا وزفتى"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-teal-700"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. العيادات والفروع ومواعيد العمل وخرائط جوجل */}
      {(activeSection === 'all' || activeSection === 'clinics') && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-700" />
              <span>فروع العيادة، مواعيد العمل، وروابط خرائط Google Maps</span>
            </h3>
            <button
              type="button"
              onClick={handleAddBranch}
              className="text-xs font-bold text-teal-800 hover:text-teal-900 flex items-center gap-1 cursor-pointer bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة فرع جديد</span>
            </button>
          </div>

          <div className="space-y-4">
            {formData.clinics.map((branch, index) => (
              <div key={branch.id || index} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-900 bg-teal-100/60 px-2.5 py-0.5 rounded-md">
                    فرع #{index + 1}: {branch.name}
                  </span>
                  {formData.clinics.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveBranch(index)}
                      className="text-rose-600 hover:text-rose-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف الفرع</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">اسم الفرع</label>
                    <input
                      type="text"
                      value={branch.name}
                      onChange={(e) => handleBranchChange(index, 'name', e.target.value)}
                      placeholder="عيادة طنطا"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">المدينة / المركز</label>
                    <input
                      type="text"
                      value={branch.city || ''}
                      onChange={(e) => handleBranchChange(index, 'city', e.target.value)}
                      placeholder="طنطا"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">العنوان التفصيلي للفرع</label>
                    <input
                      type="text"
                      value={branch.address}
                      onChange={(e) => handleBranchChange(index, 'address', e.target.value)}
                      placeholder="طنطا — شارع البحر الرئيسي مع طه الحكيم..."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700">رابط خريطة Google Maps</label>
                      {branch.googleMapsUrl && (
                        <a
                          href={branch.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-teal-700 hover:underline flex items-center gap-0.5"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span>فتح الخريطة للتأكد</span>
                        </a>
                      )}
                    </div>
                    <input
                      type="text"
                      value={branch.googleMapsUrl || ''}
                      onChange={(e) => handleBranchChange(index, 'googleMapsUrl', e.target.value)}
                      placeholder="https://shorturl.at/75Qok"
                      dir="ltr"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">هاتف الفرع (اختياري)</label>
                    <input
                      type="text"
                      value={branch.phone || ''}
                      onChange={(e) => handleBranchChange(index, 'phone', e.target.value)}
                      placeholder="01100171817"
                      dir="ltr"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white outline-none font-mono"
                    />
                  </div>

                  {/* Working Days per Clinic */}
                  <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                    <label className="block text-[11px] font-bold text-teal-950 mb-2">
                      أيام العمل في هذا الفرع (انقر على اليوم لتفعيله أو إلغائه):
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {WEEK_DAYS.map((day) => {
                        const isSelected = (branch.workingDays || []).includes(day.id);
                        return (
                          <button
                            key={day.id}
                            type="button"
                            onClick={() => handleToggleBranchDay(index, day.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-teal-800 text-white shadow-xs'
                                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            <span>{day.name}</span>
                            {isSelected && <span className="text-[10px]">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hours & Slot Interval */}
                  <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        وقت بدء الكشف
                      </label>
                      <input
                        type="time"
                        value={branch.startTime || branch.openTime || '19:00'}
                        onChange={(e) => {
                          handleBranchChange(index, 'startTime', e.target.value);
                          handleBranchChange(index, 'openTime', e.target.value);
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold font-mono text-slate-900 outline-none"
                      />
                      <span className="text-[10px] text-teal-700 font-bold mt-0.5 block">يظهر للمريض: {convertTo12HourArabic(branch.startTime || branch.openTime || '19:00')}</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        وقت انتهاء الكشف
                      </label>
                      <input
                        type="time"
                        value={branch.endTime || branch.closeTime || '22:00'}
                        onChange={(e) => {
                          handleBranchChange(index, 'endTime', e.target.value);
                          handleBranchChange(index, 'closeTime', e.target.value);
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold font-mono text-slate-900 outline-none"
                      />
                      <span className="text-[10px] text-teal-700 font-bold mt-0.5 block">يظهر للمريض: {convertTo12HourArabic(branch.endTime || branch.closeTime || '22:00')}</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        الفاصل الزمني للموعد (دقائق)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="60"
                        value={branch.slotIntervalMinutes ?? 8}
                        onChange={(e) => handleBranchChange(index, 'slotIntervalMinutes', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold font-mono text-slate-900 outline-none"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">الافتراضي الموصى به: 8 دقائق</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. أسعار الكشوفات وإعدادات الحجز */}
      {(activeSection === 'all' || activeSection === 'pricing') && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <CreditCard className="w-4 h-4 text-teal-700" />
            <span>أسعار الكشوفات وإعدادات الحجز المباشر</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-200">
              <label className="block text-xs font-bold text-teal-950 mb-1.5">
                سعر حجز جديد (كشف أول مرة)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.newBookingPrice}
                  onChange={(e) => handleFieldChange('newBookingPrice', Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono font-black text-base text-slate-900 outline-none"
                />
                <span className="text-xs font-bold text-slate-700">جنيه</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">الافتراضي: 300 جنيه (يظهر للمريض)</p>
            </div>

            <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200">
              <label className="block text-xs font-bold text-purple-950 mb-1.5">
                سعر المتابعة (استشارة)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.followupPrice}
                  onChange={(e) => handleFieldChange('followupPrice', Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono font-black text-base text-slate-900 outline-none"
                />
                <span className="text-xs font-bold text-slate-700">جنيه</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">الافتراضي: 200 جنيه</p>
            </div>

            <div className="sm:col-span-2 flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-900 block">إتاحة الحجز الإلكتروني عبر الموقع</span>
                <span className="text-[11px] text-slate-500">عند تعطيل هذا الخيار، سيتم عرض تنبيه للمرضى بإيقاف الحجز المؤقت</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isBookingEnabled ?? true}
                  onChange={(e) => handleFieldChange('isBookingEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-700"></div>
              </label>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                نص مواعيد العمل التوضيحي (الموجز)
              </label>
              <input
                type="text"
                value={formData.workingHours}
                onChange={(e) => handleFieldChange('workingHours', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                تعليمات الحضور للمرضى
              </label>
              <textarea
                rows={2}
                value={formData.bookingInstructions}
                onChange={(e) => handleFieldChange('bookingInstructions', e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. إعدادات الدفع وإنستاباي */}
      {(activeSection === 'all' || activeSection === 'payments') && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-purple-950 flex items-center gap-2 border-b border-slate-100 pb-3">
            <CreditCard className="w-4 h-4 text-purple-700" />
            <span>إعدادات الدفع وبيانات التحويل عبر إنستاباي (InstaPay)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Toggle InstaPay */}
            <div className="flex items-center justify-between p-3.5 bg-purple-50/50 rounded-xl border border-purple-200">
              <div>
                <span className="text-xs font-bold text-purple-950 block">تفعيل الدفع الإلكتروني (InstaPay)</span>
                <span className="text-[11px] text-slate-500">إتاحة التحويل ورفع لقطة الشاشة مع التأكيد التلقائي</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableInstapay ?? true}
                  onChange={(e) => handleFieldChange('enableInstapay', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-700"></div>
              </label>
            </div>

            {/* Toggle Clinic Cash */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-900 block">تفعيل خيار الدفع نقداً بالعيادة</span>
                <span className="text-[11px] text-slate-500">السماح للمريض باختيار الدفع عند الحضور</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableClinicPayment ?? true}
                  onChange={(e) => handleFieldChange('enableClinicPayment', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-700"></div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                معرف إنستاباي (IPA Handle)
              </label>
              <input
                type="text"
                value={formData.instapayIdentifier}
                onChange={(e) => handleFieldChange('instapayIdentifier', e.target.value)}
                placeholder="dr.hossam.abokl@instapay"
                dir="ltr"
                className="w-full px-3.5 py-2 rounded-xl border border-purple-200 font-mono text-xs font-bold text-slate-800 outline-none bg-purple-50/20 focus:border-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                رقم هاتف حساب إنستاباي
              </label>
              <input
                type="text"
                value={formData.instapayPhone}
                onChange={(e) => handleFieldChange('instapayPhone', e.target.value)}
                placeholder="01100171817"
                dir="ltr"
                className="w-full px-3.5 py-2 rounded-xl border border-purple-200 font-mono text-xs font-bold text-slate-800 outline-none bg-purple-50/20 focus:border-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                اسم صاحب الحساب كما يظهر في تطبيق إنستاباي
              </label>
              <input
                type="text"
                value={formData.instapayAccountName || ''}
                onChange={(e) => handleFieldChange('instapayAccountName', e.target.value)}
                placeholder="د. حسام منصور أبوكل"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-purple-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                تعليمات التحويل عبر إنستاباي الموضحة للمريض
              </label>
              <textarea
                rows={2}
                value={formData.instapayInstructions}
                onChange={(e) => handleFieldChange('instapayInstructions', e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-purple-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. بيانات التواصل والواتساب والطوارئ */}
      {(activeSection === 'all' || activeSection === 'contact') && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Phone className="w-4 h-4 text-teal-700" />
            <span>بيانات التواصل، الواتساب، وأرقام الاستعلامات</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>رقم الواتساب الرسمي للحجز والتأكيد</span>
                </label>
                {formData.whatsappNumber && (
                  <a
                    href={`https://wa.me/2${formData.whatsappNumber.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-emerald-700 hover:underline flex items-center gap-0.5"
                  >
                    <ExternalLink className="w-2.5 h-2.5" />
                    <span>تجربة المحادثة</span>
                  </a>
                )}
              </div>
              <input
                type="text"
                value={formData.whatsappNumber}
                onChange={(e) => handleFieldChange('whatsappNumber', e.target.value)}
                placeholder="01100171817"
                dir="ltr"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-xs font-bold text-slate-800 outline-none focus:border-teal-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                رقم هاتف الطوارئ
              </label>
              <input
                type="text"
                value={formData.emergencyPhone || formData.emergencyNumber || ''}
                onChange={(e) => {
                  handleFieldChange('emergencyPhone', e.target.value);
                  handleFieldChange('emergencyNumber', e.target.value);
                }}
                placeholder="01000111819"
                dir="ltr"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-xs font-bold text-slate-800 outline-none focus:border-teal-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                حساب إنستغرام (اختياري)
              </label>
              <input
                type="text"
                value={formData.instagram || ''}
                onChange={(e) => handleFieldChange('instagram', e.target.value)}
                placeholder="dr.hossam.abokl"
                dir="ltr"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-xs text-slate-800 outline-none focus:border-teal-700"
              />
            </div>

            <div className="sm:col-span-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700">أرقام هواتف العيادة (للاتصال المباشر):</label>
                <button
                  type="button"
                  onClick={handleAddPhone}
                  className="text-xs font-bold text-teal-800 hover:text-teal-900 flex items-center gap-1 cursor-pointer bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200"
                >
                  <Plus className="w-3 h-3" />
                  <span>إضافة رقم هاتف</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {formData.phoneNumbers.map((phone, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => handlePhoneChange(idx, e.target.value)}
                      placeholder="01100171817"
                      dir="ltr"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs text-slate-800 outline-none bg-white"
                    />
                    {formData.phoneNumbers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePhone(idx)}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                        title="حذف الرقم"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Big Bottom Save Button */}
      <div className="pt-3">
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white font-extrabold text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>جاري حفظ الإعدادات في Firestore...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>حفظ وتطبيق جميع الإعدادات في الموقع فوراً</span>
            </>
          )}
        </button>
      </div>

    </form>
  );
};
