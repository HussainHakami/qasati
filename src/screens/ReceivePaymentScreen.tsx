import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { fmt } from '@/lib/format';
import { screenVariants, itemVariants } from '@/lib/animation';
export default function ReceivePaymentScreen() {
  const { navigateBack, borrowers, loans, receivePayment } = useApp();
  const [borrowerId, setBorrowerId] = useState('');
  const [loanId, setLoanId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'cash' | 'transfer' | 'bank'>('cash');
  const [notes, setNotes] = useState('');
  const [success, setSuccess] = useState(false);
  const activeLoans = useMemo(() => {
    if (!borrowerId) return [];
    return loans.filter(l => l.borrowerId === borrowerId && (l.status === 'active' || l.status === 'overdue'));
  }, [borrowerId, loans]);
  const selectedLoan = loans.find(l => l.id === loanId);
  const handleSubmit = () => {
    if (!borrowerId || !loanId || !amount) return;
    const borrower = borrowers.find(b => b.id === borrowerId);
    receivePayment({
      loanId,
      borrowerId,
      borrowerName: borrower?.name || '',
      amount: parseFloat(amount),
      method,
      notes,
    });
    setSuccess(true);
    setTimeout(() => { setSuccess(false); setLoanId(''); setAmount(''); }, 1200);
  };
  return (
    <motion.div variants={screenVariants} initial="hidden" animate="visible" exit="exit" className="h-full flex flex-col overflow-hidden">
      <motion.div variants={itemVariants} className="flex items-center gap-3 px-5 pt-4 pb-2">
        <button onClick={navigateBack} className="p-2 rounded-full" style={{ background: '#111D32', border: '2px solid rgba(212, 175, 55, 0.3)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <h1 className="font-kufi text-xl font-bold text-gold">تسجيل دفعة</h1>
      </motion.div>
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {/* Select Borrower */}
        <motion.div variants={itemVariants} className="mt-2">
          <label className="text-sm text-cream-muted block mb-1.5">العميل</label>
          <div className="max-h-28 overflow-y-auto space-y-1">
            {borrowers.map(b => (
              <button key={b.id} onClick={() => { setBorrowerId(b.id); setLoanId(''); }} className="w-full flex items-center gap-3 p-2 rounded-xl text-right transition-all"
                style={{ background: borrowerId === b.id ? 'rgba(212, 175, 55, 0.15)' : '#111D32', border: borrowerId === b.id ? '2px solid #D4AF37' : '2px solid transparent' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'linear-gradient(135deg, #D4AF37, #B8960E)', color: '#0A1628' }}>{b.name.charAt(0)}</div>
                <p className="text-sm font-bold text-cream">{b.name}</p>
              </button>
            ))}
          </div>
        </motion.div>
        {/* Select Loan */}
        {activeLoans.length > 0 && (
          <motion.div variants={itemVariants} className="mt-3">
            <label className="text-sm text-cream-muted block mb-1.5">العقد</label>
            <div className="space-y-1">
              {activeLoans.map(l => (
                <button key={l.id} onClick={() => { setLoanId(l.id); setAmount(l.monthlyPayment.toString()); }} className="w-full flex items-center justify-between p-2.5 rounded-xl text-right transition-all"
                  style={{ background: loanId === l.id ? 'rgba(212, 175, 55, 0.15)' : '#111D32', border: loanId === l.id ? '2px solid #D4AF37' : '2px solid transparent' }}>
                  <div>
                    <p className="text-sm font-bold text-cream">{l.productName}</p>
                    <p className="text-xs text-cream-muted">{l.monthsPaid}/{l.monthsTotal} | مستحق: {fmt(l.amount - l.monthlyPayment * l.monthsPaid)} ر.س</p>
                  </div>
                  <span className="text-sm font-bold text-gold">{fmt(l.monthlyPayment)} ر.س</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
        {/* Amount */}
        <motion.div variants={itemVariants} className="mt-3">
          <label className="text-sm text-cream-muted block mb-1.5">المبلغ المستلم (ر.س)</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full py-3 px-4 rounded-xl outline-none text-lg font-bold text-center" style={{ background: '#111D32', border: '2px solid #D4AF37', color: '#F5F0E0' }} dir="ltr" />
          {selectedLoan && (
            <button onClick={() => setAmount(selectedLoan.monthlyPayment.toString())} className="mt-1 text-xs" style={{ color: '#D4AF37' }}>تعيين قيمة القسط ({fmt(selectedLoan.monthlyPayment)} ر.س)</button>
          )}
        </motion.div>
        {/* Method */}
        <motion.div variants={itemVariants} className="mt-3">
          <label className="text-sm text-cream-muted block mb-1.5">طريقة الدفع</label>
          <div className="flex gap-2">
            {([['cash', 'كاش'], ['transfer', 'تحويل'], ['bank', 'بنكي']] as const).map(([key, label]) => (
              <button key={key} onClick={() => setMethod(key)} className="flex-1 py-2 rounded-xl text-sm font-semibold"
                style={{ background: method === key ? '#D4AF37' : '#111D32', color: method === key ? '#0A1628' : '#A3956B', border: method === key ? '2px solid #B8960E' : '2px solid rgba(212, 175, 55, 0.2)' }}>{label}</button>
            ))}
          </div>
        </motion.div>
        <motion.div variants={itemVariants} className="mt-3">
          <label className="text-sm text-cream-muted block mb-1.5">ملاحظات</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full py-3 px-4 rounded-xl outline-none text-sm resize-none" style={{ background: '#111D32', border: '2px solid rgba(212, 175, 55, 0.3)', color: '#F5F0E0', minHeight: '60px' }} placeholder="اختياري..." />
        </motion.div>
        <motion.div variants={itemVariants} className="mt-4 mb-2">
          <button onClick={handleSubmit} disabled={!borrowerId || !loanId || !amount} className="w-full py-3.5 rounded-full font-bold text-base text-center"
            style={{ background: success ? '#059669' : '#D4AF37', color: success ? '#fff' : '#0A1628', border: success ? '4px solid #047857' : '4px solid #B8960E', opacity: !borrowerId || !loanId || !amount ? 0.5 : 1 }}>
            {success ? 'تم تسجيل الدفعة!' : 'تأكيد التحصيل'}
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
