import React from 'react';
import { X, MapPin, Phone, MessageCircle, Clock, Info, ExternalLink } from 'lucide-react';
import { ClinicSettings } from '../../shared/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: ClinicSettings;
}

export const ClinicInfoModal: React.FC<Props> = ({ isOpen, onClose, settings }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 my-8 text-right" dir="rtl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">بيانات العيادات والتواصل</h3>
              <p className="text-xs text-slate-500">{settings.doctorName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Clinic Addresses */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-teal-600" />
              عناوين الفروع والعيادات
            </h4>
            <div className="space-y-2.5">
              {settings.clinics.map((c, i) => (
                <div key={i} className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800 text-sm">{c.name}</span>
                    {c.googleMapsUrl && (
                      <a
                        href={c.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-teal-700 hover:underline flex items-center gap-1 font-medium"
                      >
                        <span>خرائط Google</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{c.address}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Numbers */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-teal-600" />
              أرقام هواتف الحجز والاستفسار
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {settings.phoneNumbers.map((num, i) => (
                <a
                  key={i}
                  href={`tel:${num}`}
                  className="flex items-center justify-between p-3 bg-slate-50 hover:bg-teal-50 border border-slate-100 hover:border-teal-200 rounded-xl transition text-slate-800 hover:text-teal-800"
                >
                  <span className="text-xs font-bold font-mono" dir="ltr">{num}</span>
                  <Phone className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                </a>
              ))}
            </div>
          </div>

          {/* Working Hours */}
          <div className="p-3.5 bg-teal-50/60 border border-teal-100 rounded-2xl flex items-start gap-3">
            <Clock className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-slate-800 text-xs mb-1">مواعيد العمل</h5>
              <p className="text-xs text-slate-600">{settings.workingHours}</p>
            </div>
          </div>

          {/* Booking Instructions */}
          {settings.bookingInstructions && (
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3">
              <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-slate-800 text-xs mb-1">تعليمات الحضور</h5>
                <p className="text-xs text-slate-600 leading-relaxed">{settings.bookingInstructions}</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-2xl transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
