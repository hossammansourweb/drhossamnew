import React, { useState } from 'react';
import { Lock, Mail, ShieldAlert, Loader2, Stethoscope, ArrowRight, UserPlus, LogIn, Sparkles } from 'lucide-react';
import { adminSignIn, adminSignUp } from '../../shared/services/bookingService';
import { isFirebaseConfigured } from '../../config/firebase';

interface Props {
  onLoginSuccess: (email: string) => void;
  onReturnToPatient: () => void;
}

export const AdminLogin: React.FC<Props> = ({ onLoginSuccess, onReturnToPatient }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('admin@clinic.com');
  const [password, setPassword] = useState('admin123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfigured = isFirebaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const res = await adminSignUp(email, password);
        onLoginSuccess(res.user.email);
      } else {
        const res = await adminSignIn(email, password);
        onLoginSuccess(res.user.email);
      }
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول. تحقق من البريد وكلمة المرور.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setEmail('admin@clinic.com');
    setPassword('admin123456');
    setLoading(true);
    setError(null);
    try {
      const res = await adminSignIn('admin@clinic.com', 'admin123456');
      onLoginSuccess(res.user.email);
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول التجريبي.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-8" dir="rtl">
      <div className="bg-white rounded-3xl p-7 sm:p-9 max-w-md w-full border border-slate-200 shadow-xl shadow-slate-200/50 text-right">
        
        {/* Top Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-teal-800 text-white flex items-center justify-center shadow-lg shadow-teal-800/20 mb-3">
            <Stethoscope className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">
            لوحة تحكم الطبيب والعيادة
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            د. حسام منصور أبوكل — استشاري جراحة العظام
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'signin'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>تسجيل الدخول</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'signup'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>إنشاء حساب طبيب جديد</span>
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-800 text-xs font-bold">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@clinic.com"
                dir="ltr"
                className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-50 text-slate-800 text-sm outline-none transition font-mono"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                dir="ltr"
                className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-50 text-slate-800 text-sm outline-none transition font-mono"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-teal-800 hover:bg-teal-900 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-teal-900/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{mode === 'signup' ? 'جاري إنشاء الحساب...' : 'جاري التحقق...'}</span>
              </>
            ) : (
              <span>{mode === 'signup' ? 'إنشاء حساب الطبيب والدخول' : 'تسجيل الدخول'}</span>
            )}
          </button>
        </form>

        {/* Quick Demo Button */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleQuickDemo}
            disabled={loading}
            className="w-full py-2.5 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs border border-teal-200 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>تسجيل دخول سريع بحساب الطبيب الافتراضي</span>
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onReturnToPatient}
            className="text-xs font-bold text-slate-500 hover:text-teal-800 transition flex items-center gap-1 cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة لصفحة حجز المريض</span>
          </button>
        </div>

      </div>
    </div>
  );
};
