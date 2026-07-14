import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { getOAuthUrl } from '@/hooks/useOAuth';

export default function LoginScreen() {
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [mode, setMode] = useState<'quick' | 'secure'>('quick');

  const handleQuickLogin = () => {
    if (!name.trim()) return;
    login(name.trim(), businessName.trim() || undefined);
  };

  const handleOAuth = () => {
    const url = getOAuthUrl();
    if (url) window.location.href = url;
  };

  const oauthAvailable = !!getOAuthUrl();

  return (
    <div className="h-full flex flex-col items-center justify-center px-6" style={{ background: '#0A1628' }}>
      <div className="absolute top-0 left-0 right-0 h-64 opacity-10" style={{ background: 'linear-gradient(180deg, #D4AF37 0%, transparent 100%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #D4AF37, #B8960E)', boxShadow: '0 8px 32px rgba(212, 175, 55, 0.3)' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0A1628" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </div>
          <h1 className="font-kufi text-3xl font-bold text-gold">قسطي</h1>
          <p className="text-sm mt-2" style={{ color: '#A3956B' }}>نظام إدارة العقود والأقساط</p>
        </div>

        {/* Login Card */}
        <div className="p-6 rounded-2xl" style={{ background: '#111D32', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
          {/* Mode Toggle */}
          <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: '#0A1628' }}>
            <button
              onClick={() => setMode('quick')}
              className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
              style={{ background: mode === 'quick' ? '#D4AF37' : 'transparent', color: mode === 'quick' ? '#0A1628' : '#A3956B' }}
            >
              دخول سريع
            </button>
            {oauthAvailable && (
              <button
                onClick={() => setMode('secure')}
                className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                style={{ background: mode === 'secure' ? '#D4AF37' : 'transparent', color: mode === 'secure' ? '#0A1628' : '#A3956B' }}
              >
                دخول آمن (OAuth)
              </button>
            )}
          </div>

          {mode === 'quick' ? (
            <>
              <div className="mb-3">
                <label className="text-xs text-cream-muted block mb-1.5">الاسم</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="أحمد محمد"
                  className="w-full py-3 px-4 rounded-xl outline-none text-sm"
                  style={{ background: '#0A1628', border: '2px solid rgba(212, 175, 55, 0.2)', color: '#F5F0E0' }}
                  onKeyDown={e => e.key === 'Enter' && handleQuickLogin()}
                />
              </div>
              <div className="mb-4">
                <label className="text-xs text-cream-muted block mb-1.5">اسم المنشأة (اختياري)</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="شركة التمويل"
                  className="w-full py-3 px-4 rounded-xl outline-none text-sm"
                  style={{ background: '#0A1628', border: '2px solid rgba(212, 175, 55, 0.2)', color: '#F5F0E0' }}
                  onKeyDown={e => e.key === 'Enter' && handleQuickLogin()}
                />
              </div>
              <button
                onClick={handleQuickLogin}
                disabled={!name.trim()}
                className="w-full py-3 rounded-full font-bold text-sm transition-all"
                style={{
                  background: name.trim() ? '#D4AF37' : '#1A2D4A',
                  color: name.trim() ? '#0A1628' : '#A3956B',
                  border: name.trim() ? '3px solid #B8960E' : '3px solid transparent',
                }}
              >
                دخول
              </button>
              <p className="text-xs text-center mt-3" style={{ color: '#A3956B' }}>
                البيانات تُحفظ محلياً في متصفحك
              </p>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <p className="text-sm text-cream mb-4">تسجيل الدخول بحساب Kimi OAuth</p>
              <button
                onClick={handleOAuth}
                className="w-full py-3 rounded-full font-bold text-sm transition-all"
                style={{ background: '#D4AF37', color: '#0A1628', border: '3px solid #B8960E' }}
              >
                تسجيل الدخول بحسابي
              </button>
              <p className="text-xs mt-3" style={{ color: '#A3956B' }}>
                تسجيل دخول آمن مع تشفير SSL و JWT
              </p>
            </div>
          )}
        </div>

        <p className="text-xs text-center mt-6" style={{ color: '#A3956B' }}>
          قسطي &copy; 2025 — نظام إدارة العقود والأقساط
        </p>
      </motion.div>
    </div>
  );
}
