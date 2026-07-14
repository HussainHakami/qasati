import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { fmt } from '@/lib/format';
import { screenVariants, itemVariants } from '@/lib/animation';
import ScreenHeader from '@/components/ScreenHeader';
import { LoanStatusBadge } from '@/components/StatusBadge';

type Tab = 'all' | 'active' | 'overdue' | 'paid';
const tabs: { key: Tab; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'active', label: 'نشط' },
  { key: 'overdue', label: 'متأخر' },
  { key: 'paid', label: 'مغلق' },
];

export default function LoansScreen() {
  const { loans, navigateToScreen, navigateToLoan } = useApp();
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let result = loans;
    if (tab !== 'all') result = result.filter(l => l.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l => l.borrowerName.toLowerCase().includes(q) || l.productName.toLowerCase().includes(q));
    }
    return result;
  }, [loans, tab, search]);

  return (
    <motion.div variants={screenVariants} initial="hidden" animate="visible" exit="exit" className="h-full flex flex-col overflow-hidden">
      <ScreenHeader title="العقود" action={
        <button onClick={() => navigateToScreen('addLoan')} className="p-2 rounded-full" style={{ background: '#D4AF37' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A1628" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </button>
      } />

      <motion.div variants={itemVariants} className="px-5 mt-1">
        <input value={search} onChange={e => setSearch(e.target.value)} className="w-full py-2.5 px-4 rounded-xl outline-none text-sm" style={{ background: '#111D32', border: '2px solid rgba(212, 175, 55, 0.2)', color: '#F5F0E0' }} placeholder="بحث بالعميل أو المنتج..." />
      </motion.div>

      <motion.div variants={itemVariants} className="px-5 mt-2">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#111D32' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: tab === t.key ? '#D4AF37' : 'transparent', color: tab === t.key ? '#0A1628' : '#A3956B' }}>{t.label}</button>
          ))}
        </div>
      </motion.div>

      <div className="flex-1 overflow-y-auto px-5 mt-2 pb-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((loan, i) => {
            const progress = (loan.monthsPaid / loan.monthsTotal) * 100;
            const remainingMonths = loan.monthsTotal - loan.monthsPaid;
            const remaining = remainingMonths > 0 ? loan.monthlyPayment * (remainingMonths - 1) + loan.lastPayment : 0;
            return (
              <motion.button key={loan.id} variants={itemVariants} onClick={() => navigateToLoan(loan.id)} whileTap={{ scale: 0.98 }}
                className="w-full text-right mb-2 p-3 rounded-xl" style={{ background: '#111D32', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'linear-gradient(135deg, #D4AF37, #B8960E)', color: '#0A1628' }}>{loan.borrowerName.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-bold text-cream">{loan.borrowerName}</p>
                      <p className="text-xs text-cream-muted">{loan.productName}</p>
                    </div>
                  </div>
                  <LoanStatusBadge status={loan.status} />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-cream-muted">{loan.monthsPaid}/{loan.monthsTotal} | {fmt(loan.monthlyPayment)} ر.س/شهر</span>
                  <span className="text-sm font-bold text-gold">{fmt(remaining)} ر.س</span>
                </div>
                <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: '#1A2D4A' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8, delay: i * 0.05 }} className="h-full rounded-full" style={{ background: loan.status === 'overdue' ? '#DC2626' : 'linear-gradient(90deg, #D4AF37, #E5C84B)' }} />
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
        {filtered.length === 0 && <p className="text-xs text-cream-muted text-center py-8">لا توجد عقود</p>}
      </div>
    </motion.div>
  );
}
