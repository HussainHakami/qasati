import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { fmt } from '@/lib/format';
import { screenVariants, itemVariants } from '@/lib/animation';
import ScreenHeader from '@/components/ScreenHeader';
import { RatingBadge } from '@/components/StatusBadge';
import ConfirmModal from '@/components/ConfirmModal';

export default function BorrowersScreen() {
  const { borrowers, loans, navigateToScreen, navigateToBorrower, deleteBorrower } = useApp();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return borrowers;
    const q = search.toLowerCase();
    return borrowers.filter(b => b.name.toLowerCase().includes(q) || b.phone.includes(q));
  }, [borrowers, search]);

  const getLoanCount = (id: string) => loans.filter(l => l.borrowerId === id).length;
  const getTotalDebt = (id: string) => loans.filter(l => l.borrowerId === id && (l.status === 'active' || l.status === 'overdue')).reduce((s, l) => {
    const remainingMonths = l.monthsTotal - l.monthsPaid;
    if (remainingMonths <= 0) return s;
    return s + (l.monthlyPayment * (remainingMonths - 1) + l.lastPayment);
  }, 0);

  const borrowerToDelete = borrowers.find(b => b.id === deleteId);

  return (
    <motion.div variants={screenVariants} initial="hidden" animate="visible" exit="exit" className="h-full flex flex-col overflow-hidden">
      <ScreenHeader title="العملاء" action={
        <button onClick={() => navigateToScreen('addBorrower')} className="p-2 rounded-full" style={{ background: '#D4AF37' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A1628" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </button>
      } />

      <motion.div variants={itemVariants} className="px-5 mt-1">
        <div className="relative">
          <input value={search} onChange={e => setSearch(e.target.value)} className="w-full py-2.5 pr-10 pl-4 rounded-xl outline-none text-sm" style={{ background: '#111D32', border: '2px solid rgba(212, 175, 55, 0.2)', color: '#F5F0E0' }} placeholder="البحث باسم العميل أو الجوال..." />
          <svg className="absolute right-3 top-1/2 -translate-y-1/2" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A3956B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        </div>
      </motion.div>

      <div className="flex-1 overflow-y-auto px-5 mt-3 pb-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((b, i) => (
            <motion.div key={b.id} variants={itemVariants} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="mb-2 rounded-xl" style={{ background: '#111D32', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
              <div className="p-3">
                <div className="flex items-center gap-3">
                  <button onClick={() => navigateToBorrower(b.id)} className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg, #D4AF37, #B8960E)', color: '#0A1628' }}>{b.name.charAt(0)}</button>
                  <button onClick={() => navigateToBorrower(b.id)} className="flex-1 text-right">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-cream">{b.name}</h3>
                      <RatingBadge rating={b.rating} />
                    </div>
                    <p className="text-xs text-cream-muted">{b.phone} | {getLoanCount(b.id)} عقود</p>
                  </button>
                  <div className="text-left flex-shrink-0">
                    <p className="text-xs text-cream-muted">مستحق</p>
                    <p className="text-sm font-bold text-gold">{fmt(getTotalDebt(b.id))} ر.س</p>
                  </div>
                </div>
              </div>
              <div className="flex border-t" style={{ borderColor: 'rgba(212, 175, 55, 0.08)' }}>
                <button onClick={() => navigateToBorrower(b.id)} className="flex-1 py-2 text-xs font-semibold text-center text-gold">التفاصيل</button>
                <button onClick={() => navigateToScreen('addLoan')} className="flex-1 py-2 text-xs font-semibold text-center" style={{ color: '#059669', borderRight: '1px solid rgba(212, 175, 55, 0.08)' }}>+ عقد</button>
                <button onClick={() => { setDeleteId(b.id); setConfirmDelete(true); }} className="flex-1 py-2 text-xs font-semibold text-center" style={{ color: '#DC2626', borderRight: '1px solid rgba(212, 175, 55, 0.08)' }}>حذف</button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && <p className="text-xs text-cream-muted text-center py-8">لا يوجد عملاء</p>}
      </div>

      <ConfirmModal
        show={confirmDelete && !!deleteId}
        title="حذف العميل؟"
        message={borrowerToDelete ? `سيتم حذف ${borrowerToDelete.name} وكل عقوده بشكل نهائي.` : ''}
        confirmLabel="حذف"
        icon="delete"
        onConfirm={() => { if (deleteId) { deleteBorrower(deleteId); } setConfirmDelete(false); setDeleteId(null); }}
        onCancel={() => { setConfirmDelete(false); setDeleteId(null); }}
      />
    </motion.div>
  );
}
