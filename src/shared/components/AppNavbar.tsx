import React, { useState } from 'react';
import {
  Stethoscope,
  Menu,
  X,
  User,
  MapPin,
  Phone,
  LogIn,
  ExternalLink,
  MessageCircle,
  Clock,
  ArrowRight,
  ChevronDown,
  Info,
  Shield,
  FileText,
  CalendarX,
  CreditCard,
  PhoneCall
} from 'lucide-react';
import { ClinicSettings } from '../types';
import { LegalPageType } from './LegalPagesModal';
import { usePwaInstall } from '../hooks/usePwaInstall';

interface Props {
  currentView: 'patient' | 'admin';
  onNavigate: (view: 'patient' | 'admin') => void;
  onOpenLegalPage: (type: LegalPageType) => void;
  onLogoClick: () => void;
  settings?: ClinicSettings;
}

export const AppNavbar: React.FC<Props> = ({
  currentView,
  onNavigate,
  onOpenLegalPage,
  onLogoClick,
  settings
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeModalSection, setActiveModalSection] = useState<'about' | 'clinics' | 'contact' | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const { canInstall, promptInstall } = usePwaInstall();

  const infoLinks: { id: LegalPageType; title: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'privacy', title: 'سياسة الخصوصية', icon: Shield },
    { id: 'terms', title: 'شروط الاستخدام', icon: FileText },
    { id: 'cancellation', title: 'سياسة الحجز والإلغاء', icon: CalendarX },
    { id: 'refund', title: 'سياسة الدفع والاسترداد', icon: CreditCard },
    { id: 'contact', title: 'اتصل بنا', icon: PhoneCall },
  ];

  const handleInfoLinkClick = (type: LegalPageType) => {
    setDrawerOpen(false);
    setActiveModalSection(null);
    setInfoOpen(false);
    onOpenLegalPage(type);
  };

  const doctorName = settings?.doctorName || 'د. حسام منصور أبوكل';
  const doctorSpecialty = settings?.doctorSpecialty || 'استشاري جراحة العظام بالقوات المسلحة';
  const phoneNumbers = settings?.phoneNumbers || [
    '01100171817',
    '01100171917',
    '01000111819',
    '0404724242'
  ];
  const whatsapp = settings?.whatsappNumber || '01100171817';

  const handleLogoClick = () => {
    setDrawerOpen(false);
    setInfoOpen(false);
    onLogoClick();
  };

  const handlePatientClick = () => {
    setDrawerOpen(false);
    setInfoOpen(false);
    onNavigate('patient');
  };

  const handleAdminLoginClick = () => {
    setDrawerOpen(false);
    setInfoOpen(false);
    onNavigate('admin');
  };

  return (
    <>
      {/* Very Simple Patient Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Right Side: Doctor Logo + Name + Short Description */}
            <div
              onClick={handleLogoClick}
              className="flex items-center gap-3 cursor-pointer select-none"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-teal-700 text-white flex items-center justify-center shadow-md shadow-teal-700/20 shrink-0">
                <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                {/* Brand name as <p>, not <h1>: the page H1 lives in the hero
                    section — keeps exactly one H1 per public view for SEO. */}
                <p className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  {doctorName}
                </p>
                <p className="text-xs text-slate-500 font-semibold line-clamp-1">
                  {doctorSpecialty}
                </p>
              </div>
            </div>

            {/* Left Side: Hamburger Icon ☰ */}
            <div className="flex items-center gap-2">
              {currentView === 'admin' && (
                <button
                  onClick={handlePatientClick}
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl border border-teal-200 transition"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>موقع الحجز</span>
                </button>
              )}

              <button
                id="hamburger-menu-btn"
                onClick={() => setDrawerOpen(true)}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer"
                aria-label="القائمة الجانبية"
                title="القائمة"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Clean Side Navigation Drawer (RTL) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" dir="rtl">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => {
              setDrawerOpen(false);
              setActiveModalSection(null);
              setInfoOpen(false);
            }}
          />

          {/* Drawer Container */}
          <div className="fixed inset-y-0 right-0 max-w-sm w-full bg-white shadow-2xl flex flex-col z-10 transform transition-transform duration-300 ease-in-out">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 leading-tight">
                    {doctorName}
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {doctorSpecialty}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  setActiveModalSection(null);
                  setInfoOpen(false);
                }}
                className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body — ONLY the requested sections */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">

              {/* PWA Install — visible only when the app is installable */}
              {canInstall && (
                <button
                  onClick={() => promptInstall()}
                  className="w-full py-3 px-4 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-teal-700/25 transition cursor-pointer"
                >
                  <span className="text-base leading-none">📱</span>
                  <span>تثبيت التطبيق</span>
                </button>
              )}
              
              {/* Item 1: عن الدكتور */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white hover:border-teal-300 transition">
                <button
                  onClick={() => setActiveModalSection(activeModalSection === 'about' ? null : 'about')}
                  className="w-full flex items-center justify-between text-right font-bold text-slate-900 text-sm"
                >
                  <span className="flex items-center gap-2.5 text-slate-900">
                    <User className="w-4 h-4 text-teal-700" />
                    عن الدكتور
                  </span>
                  <span className="text-xs text-teal-700 font-semibold">
                    {activeModalSection === 'about' ? 'إخفاء' : 'عرض التفاصيل'}
                  </span>
                </button>
                
                {/* Details Accordion */}
                {activeModalSection === 'about' && (
                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 leading-relaxed space-y-2">
                    <p className="font-bold text-slate-800">
                      {doctorName}
                    </p>
                    <p className="text-teal-800 font-semibold">
                      {doctorSpecialty}
                    </p>
                    <p>
                      استشاري وخبير في جراحات العظام والمفاصل والمناظير وعلاج إصابات الملاعب والكسور المعقدة، والخشونة المتقدمة بمفصل الركبة والحوض.
                    </p>
                  </div>
                )}
              </div>

              {/* Item 2: العيادات */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white hover:border-teal-300 transition">
                <button
                  onClick={() => setActiveModalSection(activeModalSection === 'clinics' ? null : 'clinics')}
                  className="w-full flex items-center justify-between text-right font-bold text-slate-900 text-sm"
                >
                  <span className="flex items-center gap-2.5 text-slate-900">
                    <MapPin className="w-4 h-4 text-teal-700" />
                    العيادات
                  </span>
                  <span className="text-xs text-teal-700 font-semibold">
                    {activeModalSection === 'clinics' ? 'إخفاء' : 'عرض الفروع'}
                  </span>
                </button>

                {/* Details Accordion */}
                {activeModalSection === 'clinics' && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-3 text-xs">
                    {/* عيادة طنطا */}
                    <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-teal-900">عيادة طنطا</span>
                        <span className="text-[11px] font-bold text-teal-700 bg-white px-2 py-0.5 rounded-md border border-teal-200">
                          السبت والثلاثاء
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-normal">
                        طنطا — شارع البحر الرئيسي مع طه الحكيم، أعلى مطعم حضرموت
                      </p>
                      <a
                        href="https://maps.google.com/?q=Tanta+Egypt"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:underline pt-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>فتح الموقع على Google Maps</span>
                      </a>
                    </div>

                    {/* عيادة زفتى */}
                    <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-teal-900">عيادة زفتى</span>
                        <span className="text-[11px] font-bold text-teal-700 bg-white px-2 py-0.5 rounded-md border border-teal-200">
                          الأحد والأربعاء
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-normal">
                        زفتى — شارع الشوربجي من شارع البحر أمام مستشفى زفتى العام
                      </p>
                      <a
                        href="https://maps.google.com/?q=Zefta+Egypt"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:underline pt-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>فتح الموقع على Google Maps</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Item 3: أرقام التواصل */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white hover:border-teal-300 transition">
                <button
                  onClick={() => setActiveModalSection(activeModalSection === 'contact' ? null : 'contact')}
                  className="w-full flex items-center justify-between text-right font-bold text-slate-900 text-sm"
                >
                  <span className="flex items-center gap-2.5 text-slate-900">
                    <Phone className="w-4 h-4 text-teal-700" />
                    أرقام التواصل
                  </span>
                  <span className="text-xs text-teal-700 font-semibold">
                    {activeModalSection === 'contact' ? 'إخفاء' : 'عرض الأرقام'}
                  </span>
                </button>

                {/* Details Accordion */}
                {activeModalSection === 'contact' && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <p className="text-[11px] text-slate-500 font-medium mb-1">
                      انقر على أي رقم للاتصال المباشر:
                    </p>
                    <div className="grid grid-cols-1 gap-1.5 font-mono">
                      {phoneNumbers.map((num, idx) => (
                        <a
                          key={idx}
                          href={`tel:${num}`}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold border border-slate-200"
                          dir="ltr"
                        >
                          <Phone className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>{num}</span>
                        </a>
                      ))}
                    </div>

                    {whatsapp && (
                      <div className="pt-2">
                        <a
                          href={`https://wa.me/2${whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 hover:bg-emerald-100 transition"
                        >
                          <MessageCircle className="w-4 h-4 text-emerald-600" />
                          <span className="font-sans text-xs">واتساب العيادة:</span>
                          <span className="font-mono text-xs" dir="ltr">{whatsapp}</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* معلومات ومساعدة — small collapsible section */}
              <div className="border border-slate-200 rounded-2xl bg-slate-50/60 overflow-hidden">
                <button
                  onClick={() => setInfoOpen(!infoOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 text-right"
                  aria-expanded={infoOpen}
                >
                  <span className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                    معلومات ومساعدة
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${infoOpen ? 'rotate-180' : ''}`} />
                </button>

                {infoOpen && (
                  <div className="px-2 pb-2 space-y-0.5">
                    {infoLinks.map((link) => {
                      const LinkIcon = link.icon;
                      return (
                        <button
                          key={link.id}
                          onClick={() => handleInfoLinkClick(link.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold text-slate-500 hover:bg-white hover:text-teal-800 transition text-right cursor-pointer"
                        >
                          <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{link.title}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Drawer Footer: تسجيل دخول الدكتور — ONLY requested button */}
            <div className="p-5 border-t border-slate-200 bg-slate-50">
              <button
                id="drawer-admin-login-btn"
                onClick={handleAdminLoginClick}
                className="w-full py-3.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-teal-700/20 transition cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>تسجيل دخول الدكتور</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
