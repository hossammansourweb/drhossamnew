import React, { useState } from 'react';
import { X, Check, Copy, ExternalLink, ShieldCheck, Database, Key, Server } from 'lucide-react';
import { isFirebaseConfigured, firebaseConfig } from '../../config/firebase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseGuideModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const isConfigured = isFirebaseConfigured();

  if (!isOpen) return null;

  const envContent = `# .env
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="clinic-app.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="clinic-app"
VITE_FIREBASE_STORAGE_BUCKET="clinic-app.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="1234567890"
VITE_FIREBASE_APP_ID="1:1234567890:web:abcdef"`;

  const copyEnv = () => {
    navigator.clipboard.writeText(envContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8 text-right" dir="rtl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">إعداد وتوصيل Firebase</h3>
              <p className="text-xs text-slate-500">دليل ربط قاعدة البيانات والتخزين السحابي</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status banner */}
        <div className={`p-4 rounded-xl mb-5 flex items-center gap-3 ${
          isConfigured 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
            : 'bg-amber-50 border border-amber-200 text-amber-900'
        }`}>
          <div className={`w-3 h-3 rounded-full shrink-0 ${isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <div className="text-sm">
            {isConfigured ? (
              <p className="font-semibold">Firebase متصل الآن بنجاح! يتم الحفظ مباشرة في مشروعك: <span className="font-mono text-xs">{firebaseConfig.projectId}</span></p>
            ) : (
              <div>
                <p className="font-semibold">الموقع يعمل حالياً في وضع العرض التجريبي المتكامل (Local Storage).</p>
                <p className="text-xs mt-1 text-amber-700">تستطيع اختبار وتجربة الحجز، ومنع الحجز المزدوج، والدخول للوحة التحكم. لربط مشروع Firebase الحقيقي اتبع الخطوات أدناه.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 text-sm text-slate-700">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Key className="w-4 h-4 text-teal-600" />
              1. إضافة مفاتيح Firebase في ملف <code className="bg-slate-200 px-1.5 py-0.5 rounded text-xs font-mono">.env</code>
            </h4>
            <p className="text-xs text-slate-600 mb-3">
              أنشئ ملف باسم <code className="font-mono font-bold">.env</code> في المجلد الرئيسي وضع فيه بيانات مشروع Firebase الخاص بك من لوحة تحكم Firebase Console:
            </p>
            
            <div className="relative font-mono text-xs bg-slate-900 text-emerald-400 p-3 rounded-lg overflow-x-auto text-left" dir="ltr">
              <pre>{envContent}</pre>
              <button
                onClick={copyEnv}
                className="absolute top-2 right-2 bg-slate-800 hover:bg-slate-700 text-white text-xs px-2.5 py-1 rounded flex items-center gap-1 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              2. القواعد الأمنية المجهزة بالمشروع
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              تم تجهيز ملفات <code className="bg-slate-200 px-1 rounded">firestore.rules</code> و <code className="bg-slate-200 px-1 rounded">storage.rules</code> و <code className="bg-slate-200 px-1 rounded">firestore.indexes.json</code> بأعلى معايير الأمان التي تمنع قراءة بيانات المرضى لغير الطبيب وتسمح للمرضى بحجز المواعيد بدون تسجيل دخول، مع منع الحجز المزدوج.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Server className="w-4 h-4 text-teal-600" />
              3. حساب مسؤول لوحة التحكم الافتراضي (في وضع المعاينة)
            </h4>
            <div className="text-xs text-slate-600 space-y-1 mt-1">
              <p>البريد الإلكتروني: <code className="font-mono font-bold text-slate-800 bg-slate-200 px-1.5 py-0.5 rounded">admin@clinic.com</code></p>
              <p>كلمة المرور: <code className="font-mono font-bold text-slate-800 bg-slate-200 px-1.5 py-0.5 rounded">admin123456</code></p>
              <p className="text-slate-500">أو يمكنك إنشاء حساب مسؤول من Firebase Authentication وتعيين صلاحياته.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl transition shadow-sm"
          >
            فهمت ذلك، إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
