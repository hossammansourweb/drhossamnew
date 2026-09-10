import React, { useState } from 'react';
import {
  CalendarCheck,
  Settings,
  LogOut,
  ChevronLeft,
  Stethoscope,
  ExternalLink,
  Menu,
  X
} from 'lucide-react';

export type AdminTab = 'appointments' | 'settings';

interface Props {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onLogout: () => void;
  onReturnToPatient: () => void;
  newAppointmentsCount?: number;
}

export const AdminSidebar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  onLogout,
  onReturnToPatient,
  newAppointmentsCount = 0
}) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const menuItems: { id: AdminTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'appointments', label: 'إدارة الحجوزات', icon: CalendarCheck, badge: newAppointmentsCount },
    { id: 'settings', label: 'إعدادات النظام', icon: Settings },
  ];

  const handleSelect = (id: AdminTab) => {
    onSelectTab(id);
    setMobileDrawerOpen(false);
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between p-4 sm:p-5 text-right" dir="rtl">
      <div>
        {/* Doctor & Brand Header */}
        <div className="pb-5 mb-5 border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onReturnToPatient}
              title="الصفحة الرئيسية — موقع حجز المرضى"
              aria-label="الذهاب إلى الصفحة الرئيسية"
              className="w-10 h-10 rounded-2xl bg-teal-800 text-white flex items-center justify-center shadow-md shadow-teal-900/20 shrink-0 cursor-pointer hover:bg-teal-900 transition"
            >
              <Stethoscope className="w-5 h-5" />
            </button>
            <div>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md uppercase tracking-wider block w-fit mb-0.5">
                لوحة الإدارة
              </span>
              <h2 className="text-sm font-black text-slate-900 leading-tight">
                د. حسام منصور أبوكل
              </h2>
            </div>
          </div>
        </div>

        {/* Clean Side Navigation Links */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                  isActive
                    ? 'bg-teal-800 text-white shadow-md shadow-teal-900/15'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-200' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white text-teal-800' : 'bg-rose-500 text-white'
                  }`}>
                    {item.badge} جديد
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions: View Patient Site & Logout */}
      <div className="pt-4 border-t border-slate-200/80 space-y-2 mt-6">
        <button
          onClick={() => {
            setMobileDrawerOpen(false);
            onReturnToPatient();
          }}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-teal-800 hover:bg-teal-50 transition cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-teal-600" />
            <span>موقع حجز المرضى</span>
          </div>
          <ChevronLeft className="w-3.5 h-3.5 text-teal-600" />
        </button>

        <button
          onClick={() => {
            setMobileDrawerOpen(false);
            onLogout();
          }}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </div>
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Side Navbar */}
      <aside className="hidden lg:block w-64 bg-white border-l border-slate-200/90 shrink-0 min-h-[calc(100vh)] sticky top-0 h-screen overflow-y-auto">
        {navContent}
      </aside>

      {/* Mobile Topbar with Hamburger Toggle */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xs" dir="rtl">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onReturnToPatient}
            title="الصفحة الرئيسية — موقع حجز المرضى"
            aria-label="الذهاب إلى الصفحة الرئيسية"
            className="w-8 h-8 rounded-xl bg-teal-800 text-white flex items-center justify-center cursor-pointer hover:bg-teal-900 transition shrink-0"
          >
            <Stethoscope className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block">لوحة تحكم الطبيب</span>
            <span className="text-xs font-black text-slate-800 block">د. حسام منصور أبوكل</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
          aria-label="فتح القائمة"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Side Drawer Overlay */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex" dir="rtl">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            <div className="p-3 flex justify-end border-b border-slate-100">
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {navContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
