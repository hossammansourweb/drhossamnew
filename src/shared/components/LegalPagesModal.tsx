import React from 'react';
import { X, Shield, FileText, CalendarX, CreditCard, PhoneCall, MapPin, ExternalLink, MessageCircle } from 'lucide-react';
import { ClinicSettings } from '../types';

export type LegalPageType = 'privacy' | 'terms' | 'cancellation' | 'refund' | 'contact';

interface Props {
  isOpen: boolean;
  pageType: LegalPageType;
  onClose: () => void;
  settings: ClinicSettings;
  onSelectPage: (type: LegalPageType) => void;
}

export const LegalPagesModal: React.FC<Props> = ({
  isOpen,
  pageType,
  onClose,
  settings,
  onSelectPage
}) => {
  if (!isOpen) return null;

  const tantaClinic = settings.clinics.find(c => c.id === 'tanta' || c.name.includes('طنطا')) || settings.clinics[0];
  const zeftaClinic = settings.clinics.find(c => c.id === 'zefta' || c.name.includes('زفتى')) || settings.clinics[1];

  const tabs: { id: LegalPageType; title: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'privacy', title: 'سياسة الخصوصية', icon: Shield },
    { id: 'terms', title: 'شروط الاستخدام', icon: FileText },
    { id: 'cancellation', title: 'الحجز والإلغاء', icon: CalendarX },
    { id: 'refund', title: 'الدفع والاسترداد', icon: CreditCard },
    { id: 'contact', title: 'اتصل بنا', icon: PhoneCall },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 text-right flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-xl font-black text-slate-900">
              {tabs.find(t => t.id === pageType)?.title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {settings.doctorName} — {settings.doctorSpecialty}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-3 border-b border-slate-100 shrink-0 scrollbar-none">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = pageType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectPage(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.title}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body Content */}
        <div className="py-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
          
          {/* 1. سياسة الخصوصية */}
          {pageType === 'privacy' && (
            <div className="space-y-3.5">
              <div className="p-3.5 bg-teal-50/60 border border-teal-100 rounded-2xl">
                <h4 className="font-bold text-teal-900 mb-1">سرية البيانات الطبية والشخصية</h4>
                <p className="text-xs text-teal-800">
                  نحن نولي أقصى درجات الاهتمام لخصوصية بيانات المرضى وحمايتها وفقاً لأعلى معايير السرية الطبية والمهنية.
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-slate-900">1. البيانات التي يتم جمعها:</h5>
                <p>
                  يقتصر جمع البيانات على المعلومات الأساسية اللازمة لتنظيم مواعيد الكشف (مثل: اسم المريض، رقم الهاتف، نوع الكشف، وإيصال التحويل في حال الدفع المسبق).
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-slate-900">2. استخدام البيانات:</h5>
                <p>
                  تُستخدم البيانات حصراً للتواصل بشأن تأكيد الحجز، وتذكير المريض بالموعد، وإدارة جدول الكشوفات وتنظيم العيادة.
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-slate-900">3. عدم مشاركة البيانات:</h5>
                <p>
                  نلتزم بشكل تام بعدم بيع أو مشاركة أو إفشاء أي بيانات شخصية أو طبية خاصة بالمرضى مع أي طرف خارجي أو جهة تجارية تحت أي ظرف.
                </p>
              </div>
            </div>
          )}

          {/* 2. شروط الاستخدام */}
          {pageType === 'terms' && (
            <div className="space-y-3.5">
              <div className="space-y-2">
                <h5 className="font-bold text-slate-900">1. طبيعة المنصة:</h5>
                <p>
                  هذا الموقع الإلكتروني مخصص حصراً لتيسير حجز مواعيد الكشف والاستشارة لدى عيادات د. حسام منصور أبوكل (استشاري جراحة العظام بالقوات المسلحة).
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-slate-900">2. دقة بيانات الحجز:</h5>
                <p>
                  يتحمل المريض أو من ينوب عنه مسؤولية صحة ودقة رقم الهاتف والاسم المسجل لضمان إمكانية التواصل وتأكيد الموعد عند الحاجة.
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-slate-900">3. الحالات الطارئة والحرجة:</h5>
                <p>
                  نظام الحجز مخصص للمواعيد المجدولة. في حالات الطوارئ والإصابات الحادة، يرجى التوجه فوراً لأقرب قسم طوارئ أو الاتصال بخط الطوارئ المباشر: <span className="font-bold font-mono text-teal-700">{settings.emergencyNumber || '01000111819'}</span>.
                </p>
              </div>
            </div>
          )}

          {/* 3. سياسة الحجز والإلغاء */}
          {pageType === 'cancellation' && (
            <div className="space-y-3.5">
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl">
                <h4 className="font-bold text-amber-900 mb-1">الالتزام بمواعيد الكشف</h4>
                <p className="text-xs text-amber-800">
                  نظراً لتنظيم أوقات الكشوفات بمعدل (8 دقائق لكل مريض) لتجنب فترات الانتظار الطويلة، يرجى الحضور قبل الموعد بـ 10 دقائق على الأقل.
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-slate-900">1. تعديل أو تأجيل الموعد:</h5>
                <p>
                  يمكن للمريض طلب تعديل أو إعادة جدولة الموعد عبر إرسال رسالة واتساب إلى الرقم <span className="font-bold font-mono text-teal-700">{settings.whatsappNumber}</span> قبل الموعد بـ 4 ساعات على الأقل.
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-slate-900">2. إلغاء الحجز:</h5>
                <p>
                  في حال الرغبة في الإلغاء، يرجى إخطار العيادة مسبقاً لإتاحة الموعد لمريض آخر في قائمة الانتظار.
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-slate-900">3. التأخر عن الموعد:</h5>
                <p>
                  في حال التأخر عن الموعد المحدد لأكثر من 15 دقيقة، قد يتم إدخال المريض الذي يليه وتنظيم الدخول وفقاً لما يراه فريق تنظيم العيادة ملائماً.
                </p>
              </div>
            </div>
          )}

          {/* 4. سياسة الدفع والاسترداد */}
          {pageType === 'refund' && (
            <div className="space-y-3.5">
              <div className="space-y-2">
                <h5 className="font-bold text-slate-900">1. طرق الدفع المتاحة:</h5>
                <p>
                  • <strong>الدفع نقداً في العيادة:</strong> يتم سداد قيمة الكشف عند الوصول لمقر العيادة.
                  <br />
                  • <strong>التحويل عبر InstaPay:</strong> يمكن السداد إلكترونياً وتأكيد الحجز برفع إيصال التحويل للحساب <span className="font-bold font-mono text-teal-700">{settings.instapayIdentifier}</span>.
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-slate-900">2. سياسة الاسترداد:</h5>
                <p>
                  • في حال إلغاء الموعد أو تعديله قبل 4 ساعات من وقت الكشف، يتم استرداد المبلغ المحول بالكامل عبر نفس وسيلة الدفع خلال 24 ساعة.
                  <br />
                  • في حال تم إلغاء الكشف من طرف العيادة لظرف طارئ أو ارتباط طبي للعيادة، يحق للمريض استرداد المبلغ كاملاً فوراً أو نقل الحجز لأقرب موعد بديل حسب رغبته.
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-slate-900">3. المتابعات والاستشارات:</h5>
                <p>
                  سعر الاستشارة / المتابعة محدد بـ {settings.followupPrice} جنيه وتكون صالحة للحالات التي كشفت مسبقاً خلال مدة المتابعة المعتمدة طبياً.
                </p>
              </div>
            </div>
          )}

          {/* 5. اتصل بنا */}
          {pageType === 'contact' && (
            <div className="space-y-4">
              
              {/* Tanta Clinic */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900 text-sm">{tantaClinic?.name || 'عيادة طنطا'}</span>
                  <a
                    href="https://shorturl.at/75Qok"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1"
                  >
                    <span>عرض الموقع على الخريطة</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-slate-600 mb-2">
                  طنطا — شارع البحر الرئيسي مع طه الحكيم
                </p>
                <div className="text-xs text-slate-700 font-medium">
                  <strong>أيام العمل:</strong> السبت والأربعاء (7:00 مساءً — 10:00 مساءً)
                </div>
              </div>

              {/* Zefta Clinic */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900 text-sm">{zeftaClinic?.name || 'عيادة زفتى'}</span>
                  <a
                    href="https://shorturl.at/TyxZt"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1"
                  >
                    <span>عرض الموقع على الخريطة</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-slate-600 mb-2">
                  زفتى — شارع الجيش، أعلى صيدلية الجمهورية
                </p>
                <div className="text-xs text-slate-700 font-medium">
                  <strong>أيام العمل:</strong> الأحد والخميس (6:00 مساءً — 10:00 مساءً)
                </div>
              </div>

              {/* Phones & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <a
                  href={`tel:${settings.phoneNumbers[0] || '01100171817'}`}
                  className="flex items-center justify-between p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-teal-900 font-bold text-xs"
                >
                  <span>الاتصال الهاتفي:</span>
                  <span className="font-mono" dir="ltr">{settings.phoneNumbers[0] || '01100171817'}</span>
                </a>
                <a
                  href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-900 font-bold text-xs"
                >
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>مراسلة واتساب:</span>
                  </span>
                  <span className="font-mono" dir="ltr">{settings.whatsappNumber}</span>
                </a>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
