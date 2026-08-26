import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, User as UserIcon, HeartPulse, Activity, HelpCircle, X, Key, Phone, Check, ShieldAlert, Eye, EyeOff, Copy, RefreshCw, Send } from 'lucide-react';
import { User } from '../types';
import { DEFAULT_USERS } from '../data';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
  users?: User[];
  onUpdateUsers?: (users: User[]) => void;
}

export default function LoginScreen({ onLoginSuccess, users = [], onUpdateUsers }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Password Reminder states
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderSearch, setReminderSearch] = useState('');
  const [autoFillSuccess, setAutoFillSuccess] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Quick Password Reset state inside modal
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const savedRemember = localStorage.getItem('alfarrah_remember_me') === 'true';
    if (savedRemember) {
      setRememberMe(true);
      const savedUser = localStorage.getItem('alfarrah_remembered_username') || '';
      const savedPass = localStorage.getItem('alfarrah_remembered_password') || '';
      setUsername(savedUser);
      setPassword(savedPass);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate an authenticating spinner
    setTimeout(() => {
      const userList = users.length > 0 ? users : DEFAULT_USERS;
      const foundUser = userList.find(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
      );

      if (foundUser) {
        if (rememberMe) {
          localStorage.setItem('alfarrah_remember_me', 'true');
          localStorage.setItem('alfarrah_remembered_username', username.trim());
          localStorage.setItem('alfarrah_remembered_password', password);
        } else {
          localStorage.removeItem('alfarrah_remember_me');
          localStorage.removeItem('alfarrah_remembered_username');
          localStorage.removeItem('alfarrah_remembered_password');
        }
        onLoginSuccess(foundUser);
      } else {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة. يرجى المحاولة مجدداً.');
        setIsLoading(false);
      }
    }, 850);
  };

  const activeUsers = users.length > 0 ? users : DEFAULT_USERS;
  
  // Role Mapping
  const roleMap: Record<string, string> = {
    'systemadmin': 'مدير نظام (كامل الصلاحيات)',
    'superadmin': 'مسؤول النظام / مدير عام',
    'accountant': 'محاسب / تدقيق مالي',
    'hr': 'إدارة الموارد البشرية',
    'dataentry': 'مدخل بيانات / حسابات',
    'lab_technician': 'تقني مختبر / باثولوجي',
    'ward_nurse': 'ممرض جراحة / ردهة',
    'lab_manager': 'مدير المختبر',
    'lab_analyst': 'محلل مختبر',
    'lab_dataentry': 'مدخل بيانات المختبر'
  };

  // Filter users based on search
  const filteredUsers = activeUsers.filter(u => {
    const search = reminderSearch.trim().toLowerCase();
    if (!search) return true;
    const roleAr = roleMap[u.role.toLowerCase()] || u.role;
    return u.username.toLowerCase().includes(search) || roleAr.toLowerCase().includes(search) || u.role.toLowerCase().includes(search);
  });

  const handleAutoFill = (u: User) => {
    setUsername(u.username);
    setPassword(u.password || '');
    setRememberMe(true);
    setAutoFillSuccess(`تم تعبئة بيانات الحساب (${u.username}) تلقائياً بنجاح!`);
    setTimeout(() => {
      setAutoFillSuccess(null);
      setShowReminderModal(false);
    }, 1000);
  };

  const handleCopyPassword = (u: User) => {
    if (u.password) {
      navigator.clipboard.writeText(u.password);
      setCopiedId(u.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleConfirmResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || !resetNewPassword.trim()) return;

    const updatedUsers = activeUsers.map(u => 
      u.id === resettingUser.id ? { ...u, password: resetNewPassword.trim(), mustChangePassword: false } : u
    );

    if (onUpdateUsers) {
      onUpdateUsers(updatedUsers);
    } else {
      localStorage.setItem('alfarrah_users', JSON.stringify(updatedUsers));
    }

    // Auto update state
    setUsername(resettingUser.username);
    setPassword(resetNewPassword.trim());
    setRememberMe(true);

    setResetSuccessMsg(`تم تحديث كلمة المرور للحساب (${resettingUser.username}) بنجاح!`);
    setResettingUser(null);
    setResetNewPassword('');

    setTimeout(() => {
      setResetSuccessMsg(null);
      setShowReminderModal(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0a192f] bg-gradient-to-br from-[#0a192f] via-[#0b1c36] to-[#040f1f] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans select-none" dir="rtl">
      {/* Absolute decorative ambient light blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/15 blur-[130px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-950/20 blur-[130px]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md glass-panel rounded-3xl p-8 shadow-2xl relative border border-white/10"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="p-3.5 bg-blue-500/15 rounded-full border border-blue-500/30 text-blue-400"
            >
              <HeartPulse className="w-10 h-10 animate-pulse" />
            </motion.div>
          </div>
          
          <h1 id="hospital-main-title" className="text-2xl font-bold text-white tracking-tight">مستشفى الفرح الأهلي</h1>
          <p className="text-slate-400 text-xs mt-1 text-center font-mono tracking-widest uppercase">
            Al-Farrah Private Hospital
          </p>
          <div className="h-[2px] w-20 bg-gradient-to-r from-blue-500 to-emerald-500 mx-auto mt-4 rounded-full" />
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-6 text-center text-xs text-blue-300">
          البوابة المحاسبية والإدارية الموحدة لرواتب الكليات والكوادر الطبية
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-300 text-xs mb-2 font-medium">اسم المستخدم</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 pointer-events-none">
                <UserIcon className="w-4 h-4" />
              </span>
              <input
                id="login-username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                className="w-full pl-4 pr-10 py-3 glass-input border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-xs mb-2 font-medium">كلمة المرور</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 pointer-events-none">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                className="w-full pl-10 pr-10 py-3 glass-input border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-slate-900 border-white/10 rounded focus:ring-blue-500 focus:ring-offset-slate-950 cursor-pointer"
              />
              <span className="text-xs text-slate-300 font-medium">تذكر كلمة المرور على هذا الجهاز</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setReminderSearch(username.trim());
                setShowReminderModal(true);
              }}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-semibold underline underline-offset-2 cursor-pointer flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>نسيت كلمة المرور؟</span>
            </button>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 p-2.5 rounded-lg text-center font-medium"
            >
              {error}
            </motion.p>
          )}

          <button
            id="login-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium text-sm rounded-xl transition-all shadow-md active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>تسجيل الدخول للنظام</span>
            )}
          </button>
        </form>
      </motion.div>

      {/* Password Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto" dir="rtl">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-[#0e1e38] border border-white/10 rounded-3xl p-6 shadow-2xl relative my-8"
          >
            <button
              type="button"
              onClick={() => {
                setShowReminderModal(false);
                setResettingUser(null);
              }}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-indigo-500/15 rounded-2xl border border-indigo-500/30 text-indigo-400">
                <Key className="w-6 h-6 animate-pulse" />
              </div>
              <div className="text-right">
                <h2 className="text-lg font-bold text-white font-sans">تذكير واسترجاع كلمات المرور</h2>
                <p className="text-slate-400 text-xs mt-0.5 font-sans">تسهيل استرجاع وتعبئة كلمات المرور للكوادر المعتمدة</p>
              </div>
            </div>

            {/* Quick Reset Password Inline Section if active */}
            {resettingUser ? (
              <form onSubmit={handleConfirmResetPassword} className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-4 mb-4 space-y-3 text-right">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-bold text-amber-400">إعادة تعيين كلمة مرور الحساب</span>
                  <button
                    type="button"
                    onClick={() => setResettingUser(null)}
                    className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
                <div>
                  <p className="text-xs text-slate-300 font-medium">اسم الحساب: <span className="text-white font-bold">{resettingUser.username}</span></p>
                </div>
                <div>
                  <label className="block text-slate-300 text-xs mb-1 font-medium">كلمة المرور الجديدة</label>
                  <input
                    type="text"
                    required
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور الجديدة"
                    className="w-full px-3 py-2 bg-slate-950 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer"
                >
                  حفظ كلمة المرور الجديدة والتعبئة التلقائية
                </button>
              </form>
            ) : (
              <div className="mb-4 text-right">
                <label className="block text-slate-300 text-xs mb-2 font-medium font-sans">ابحث بالاسم أو الدور الوظيفي</label>
                <div className="relative">
                  <input
                    type="text"
                    value={reminderSearch}
                    onChange={(e) => setReminderSearch(e.target.value)}
                    placeholder="ابحث باسم المستخدم (مثلاً: admin, sysadmin, data...)"
                    className="w-full pl-4 pr-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500/50 text-right"
                  />
                </div>
              </div>
            )}

            {autoFillSuccess && (
              <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-xs mb-4 flex items-center gap-2 justify-start font-sans">
                <Check className="w-4 h-4 shrink-0 animate-bounce" />
                <span>{autoFillSuccess}</span>
              </div>
            )}

            {resetSuccessMsg && (
              <div className="bg-amber-500/15 border border-amber-500/30 text-amber-300 p-3 rounded-xl text-xs mb-4 flex items-center gap-2 justify-start font-sans">
                <Check className="w-4 h-4 shrink-0 animate-bounce" />
                <span>{resetSuccessMsg}</span>
              </div>
            )}

            {!resettingUser && (
              <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1 mb-5 custom-scrollbar">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u, i) => {
                    const roleAr = roleMap[u.role.toLowerCase()] || u.role;
                    return (
                      <div
                        key={u.id || i}
                        className="p-3 bg-slate-900/40 hover:bg-slate-900/80 border border-white/5 hover:border-indigo-500/30 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        <div className="flex flex-col gap-1 text-right">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white">{u.username}</span>
                            <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md font-medium font-sans">
                              {roleAr}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 flex-wrap">
                            <span>كلمة المرور:</span>
                            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 select-all font-sans">
                              {u.password || 'غير معينة'}
                            </span>
                            {copiedId === u.id ? (
                              <span className="text-[10px] text-emerald-300 font-sans font-bold animate-pulse">تم النسخ!</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleCopyPassword(u)}
                                className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
                                title="نسخ كلمة المرور"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => {
                              setResettingUser(u);
                              setResetNewPassword(u.password || '');
                            }}
                            className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[10px] rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer font-sans"
                            title="إعادة تعيين كلمة المرور لهذا الحساب"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>تعيين كلمة سر جديدة</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAutoFill(u)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer shadow-md active:scale-95 font-sans"
                          >
                            <Check className="w-3 h-3" />
                            <span>تعبئة تلقائية</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-xs text-slate-500 border border-dashed border-white/10 rounded-xl font-sans">
                    لم يتم العثور على كوادر مطابقة لبحثك.
                  </div>
                )}
              </div>
            )}

            {/* Administrator details with Direct WhatsApp & Call Buttons */}
            <div className="bg-[#112240] border border-indigo-500/20 rounded-2xl p-4 text-right">
              <h3 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 mb-2 font-sans">
                <Phone className="w-3.5 h-3.5" />
                <span>الاتصال المباشر بمسؤول النظام والشبكات للمساعدة:</span>
              </h3>
              <div className="space-y-1 text-[11px] text-slate-300 leading-relaxed font-sans mb-3">
                <p>الاسم الكامل: <span className="text-white font-bold">المهندس محمد جاسم محمد ابراهيم</span></p>
                <p>رقم الهاتف المباشر: <span className="text-white font-bold font-mono" dir="ltr">07836885808</span></p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <a
                  href="https://wa.me/9647836885808?text=%D0%A3%D0%BB%D0%B0%D0%BC%D0%B0%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%D8%8C%20%D8%A3%D8%B1%D8%BA%D8%A8%20%D8%A8%D8%A7%D8%B3%D8%AA%D8%B1%D8%AC%D8%A7%D8%B9%20%D9%83%D9%84%D9%85%D8%A9%20%D8%A7%D9%84%D9%85%D8%B1%D9%88%D8%B1%20%D9%84%D8%AD%D8%B3%D8%A7%D8%A8%D9%8A"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>تواصل عبر WhatsApp</span>
                </a>

                <a
                  href="tel:07836885808"
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>اتصال هاتف</span>
                </a>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowReminderModal(false);
                setResettingUser(null);
              }}
              className="w-full mt-4 py-2.5 bg-slate-850 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all border border-white/10 cursor-pointer font-sans"
            >
              إغلاق نافذة التذكير
            </button>
          </motion.div>
        </div>
      )}

      {/* Persistent copyright footer */}
      <footer className="mt-12 text-center text-[10px] text-slate-500 max-w-xl px-4 z-10 select-text bg-slate-900 border-none">
        <p className="leading-5">
          حقوق النظام محفوظة لـ: مسؤول النظام المهندس محمد جاسم محمد ابراهيم | رقم الهاتف: 07836885808
        </p>
      </footer>
    </div>
  );
}

