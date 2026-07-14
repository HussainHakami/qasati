import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { fmt } from '@/lib/format';
import { homeContainerVariants, itemVariants } from '@/lib/animation';

export default function HomeScreen() {
  const { loans, borrowers, payments, navigateToScreen, navigateToLoan, toasts, removeToast } = useApp();

  const stats = useMemo(() => {
    const totalLoaned = loans.reduce((s, l) => s + l.amount, 0);
    const totalCollected = payments.reduce((s, p) => s + p.amount, 0);
    const totalRemaining = loans
      .filter(l => l.status === 'active' || l.status === 'overdue')
      .reduce((s, l) => {
        const remainingMonths = l.monthsTotal - l.monthsPaid;
        if (remainingMonths <= 0) return s;
        return s + (l.monthlyPayment * (remainingMonths - 1) + l.lastPayment);
      }, 0);
    const activeLoans = loans.filter(l => l.status === 'active').length;
    const overdueLoans = loans.filter(l => l.status === 'overdue').length;
    const paidLoans = loans.filter(l => l.status === 'paid').length;
    const thisMonth = payments
      .filter(p => {
        const d = new Date(p.date);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, p) => s + p.amount, 0);
    return { totalLoaned, totalCollected, totalRemaining, activeLoans, overdueLoans, paidLoans, thisMonth };
  }, [loans, payments]);

  const recentPayments = payments.slice(0, 5);
  const upcomingLoans = loans
    .filter(l => l.status === 'active' || l.status === 'overdue')
    .slice(0, 4);

  return (
    <>
      {/* Toast Container — auto-dismiss after 4s */}
      <div className="fixed top-4 left-4 right-4 z-[70] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] as const }}
              onAnimationComplete={() => setTimeout(() => removeToast(toast.id), 4000)}
              className="pointer-events-auto mx-auto w-full max-w-sm px-4 py-3 rounded-2xl shadow-lg flex items-center gap-3"
              style={{ background: '#111D32', border: '1px solid rgba(212, 175, 55, 0.2)', backdropFilter: 'blur(8px)' }}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: toast.type === 'success' ? 'rgba(5, 150, 105, 0.15)' : toast.type === 'error' ? 'rgba(220, 38, 38, 0.15)' : 'rgba(212, 175, 55, 0.15)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={toast.type === 'success' ? '#059669' : toast.type === 'error' ? '#DC2626' : '#D4AF37'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {toast.type === 'success' ? <><polyline points="20 6 9 17 4 12" /></> : toast.type === 'error' ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></> : <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>}
                </svg>
              </div>
              <p className="text-sm font-bold text-cream flex-1" style={{ wordBreak: 'break-word' }}>{toast.message}</p>
              <button onClick={() => removeToast(toast.id)} className="text-cream-muted hover:text-gold transition-colors shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <h1 className="font-kufi text-xl font-bold text-gold" style={{ textShadow: '0 2px 8px rgba(212,175,55,0.3)' }}>لوحة التحكم</h1>
        <div className="flex items-center gap-1">
          <button onClick={() => navigateToScreen('notifications')} className="relative p-2 rounded-xl" style={{ background: 'rgba(212,175,55,0.08)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          </button>
          <button onClick={() => navigateToScreen('settings')} className="p-2 rounded-xl" style={{ background: 'rgba(212,175,55,0.08)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m4.22-10.22l4.24-4.24M6.34 17.66l-4.24 4.24M23 12h-6m-6 0H1m20.24 8.24l-4.24-4.24M6.34 6.34L2.1 2.1"/></svg>
          </button>
        </div>
      </div>

      <motion.div variants={homeContainerVariants} initial="hidden" animate="visible" exit="exit" className="flex-1 overflow-y-auto px-5 pb-4" style={{ direction: 'rtl' }}>
        {/* Stats Summary */}
        <motion.div variants={itemVariants} className="mt-3 p-4 rounded-2xl relative overflow-hidden" style={{ background: '#111D32', border: '1px solid rgba(212, 175, 55, 0.15)' }}>
          <div className="absolute inset-0 opacity-10" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, transparent 60%)' }} />
          <div className="relative">
            <p className="text-xs font-bold text-gold mb-2">إجمالي العقود</p>
            <p className="text-3xl font-bold text-cream mb-3" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{fmt(stats.totalLoaned)} <span className="text-base text-cream-muted font-bold">ر.س</span></p>
            <div className="flex gap-4">
              <div>
                <p className="text-xs text-cream-muted">التحصيل هذا الشهر</p>
                <p className="text-sm font-bold text-gold">{fmt(stats.thisMonth)} <span className="text-xs">ر.س</span></p>
              </div>
              <div>
                <p className="text-xs text-cream-muted">إجمالي المحصل</p>
                <p className="text-sm font-bold" style={{ color: '#059669' }}>{fmt(stats.totalCollected)} <span className="text-xs">ر.س</span></p>
              </div>
              <div>
                <p className="text-xs text-cream-muted">المبالغ المستحقة</p>
                <p className="text-sm font-bold" style={{ color: '#DC2626' }}>{fmt(stats.totalRemaining)} <span className="text-xs">ر.س</span></p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mini Cards */}
        <motion.div variants={itemVariants} className="mt-3 grid grid-cols-4 gap-2">
          <button onClick={() => navigateToScreen('borrowers')} className="p-3 rounded-xl flex flex-col items-center gap-1" style={{ background: '#111D32', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.12)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
            <p className="text-lg font-bold text-cream">{borrowers.length}</p>
            <p className="text-[10px] text-cream-muted font-semibold">العملاء</p>
          </button>
          <button onClick={() => navigateToScreen('loans')} className="p-3 rounded-xl flex flex-col items-center gap-1" style={{ background: '#111D32', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(5, 150, 105, 0.12)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
            <p className="text-lg font-bold text-cream">{stats.activeLoans}</p>
            <p className="text-[10px] text-cream-muted font-semibold">نشطة</p>
          </button>
          <button onClick={() => navigateToScreen('loans')} className="p-3 rounded-xl flex flex-col items-center gap-1" style={{ background: '#111D32', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(220, 38, 38, 0.12)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div>
            <p className="text-lg font-bold text-cream">{stats.overdueLoans}</p>
            <p className="text-[10px] text-cream-muted font-semibold">متأخرة</p>
          </button>
          <button onClick={() => navigateToScreen('loans')} className="p-3 rounded-xl flex flex-col items-center gap-1" style={{ background: '#111D32', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(37, 99, 235, 0.12)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
            <p className="text-lg font-bold text-cream">{stats.paidLoans}</p>
            <p className="text-[10px] text-cream-muted font-semibold">مكتملة</p>
          </button>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="mt-3 grid grid-cols-3 gap-2">
          <button onClick={() => navigateToScreen('addBorrower')} className="py-3 rounded-xl flex flex-col items-center gap-1.5" style={{ background: '#111D32', border: '1px solid rgba(212, 175, 55, 0.15)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.12)' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>
            <p className="text-xs font-bold text-cream">عميل جديد</p>
          </button>
          <button onClick={() => navigateToScreen('addLoan')} className="py-3 rounded-xl flex flex-col items-center gap-1.5" style={{ background: '#111D32', border: '1px solid rgba(212, 175, 55, 0.15)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(37, 99, 235, 0.12)' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></div>
            <p className="text-xs font-bold text-cream">عقد جديد</p>
          </button>
          <button onClick={() => navigateToScreen('report')} className="py-3 rounded-xl flex flex-col items-center gap-1.5" style={{ background: '#111D32', border: '1px solid rgba(212, 175, 55, 0.15)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(139, 92, 246, 0.12)' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>
            <p className="text-xs font-bold text-cream">التقرير الشهري</p>
          </button>
        </motion.div>

        {/* Upcoming Payments */}
        <motion.div variants={itemVariants} className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-cream">أقساط مستحقة قريباً</h2>
            <button onClick={() => navigateToScreen('loans')} className="text-xs text-gold font-semibold hover:text-gold-light transition-colors">عرض الكل</button>
          </div>
          {upcomingLoans.length === 0 ? (
            <div className="p-4 rounded-xl text-center" style={{ background: '#111D32', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#A3956B" strokeWidth="1.5" className="mx-auto mb-2 opacity-40"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <p className="text-sm text-cream-muted font-semibold">لا توجد أقساط مستحقة حالياً</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingLoans.map((loan) => (
                <motion.button
                  key={loan.id}
                  variants={itemVariants}
                  onClick={() => navigateToLoan(loan.id)}
                  className="w-full p-3 rounded-xl text-right"
                  style={{ background: '#111D32', border: '1px solid rgba(212, 175, 55, 0.1)' }}
                  whileHover={{ scale: 1.01, backgroundColor: '#162544' }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-cream">{loan.borrowerName}</p>
                      <p className="text-xs text-cream-muted mt-0.5">{loan.productName} — {loan.monthsPaid + 1}/{loan.monthsTotal}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold" style={{ color: '#D4AF37' }}>{fmt(loan.monthlyPayment)} <span className="text-xs">ر.س</span></p>
                      <p className="text-xs" style={{ color: loan.status === 'overdue' ? '#DC2626' : '#A3956B' }}>{loan.status === 'overdue' ? 'متأخر' : loan.nextDueDate}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Payments */}
        <motion.div variants={itemVariants} className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-cream">آخر الدفعات المستلمة</h2>
            <button onClick={() => navigateToScreen('reports')} className="text-xs text-gold font-semibold hover:text-gold-light transition-colors">عرض الكل</button>
          </div>
          {recentPayments.length === 0 ? (
            <div className="p-4 rounded-xl text-center" style={{ background: '#111D32', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
              <p className="text-sm text-cream-muted font-semibold">لا توجد دفعات مسجلة بعد</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentPayments.map((payment) => (
                <motion.div
                  key={payment.id}
                  variants={itemVariants}
                  className="p-3 rounded-xl"
                  style={{ background: '#111D32', border: '1px solid rgba(5, 150, 105, 0.15)' }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-cream">{payment.borrowerName}</p>
                      <p className="text-xs text-cream-muted mt-0.5">{payment.date}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold" style={{ color: '#059669' }}>{fmt(payment.amount)} <span className="text-xs">ر.س</span></p>
                      <p className="text-xs" style={{ color: '#A3956B' }}>{payment.method === 'cash' ? 'كاش' : payment.method === 'transfer' ? 'تحويل' : 'بنكي'}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

      </motion.div>
    </>
  );
}
