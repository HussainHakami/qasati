import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { fmt } from '@/lib/format';
import { sendWhatsAppAuto } from '@/lib/whatsapp';
import { screenVariantsLeft, itemVariants } from '@/lib/animation';
import ScreenHeader from '@/components/ScreenHeader';
import { LoanStatusBadge } from '@/components/StatusBadge';
import ConfirmModal from '@/components/ConfirmModal';
import InfoCard from '@/components/InfoCard';

export default function LoanDetailScreen() {
  const { screenState, loans, borrowers, payments, navigateBack, navigateToBorrower, receivePayment, deleteLoan, updateLoan, fillTemplate, autoReminderSettings, addToast } = useApp();
  const [showDelete, setShowDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [editProduct, setEditProduct] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editMonths, setEditMonths] = useState('');
  const [editInterest, setEditInterest] = useState('');
  const [editDueDay, setEditDueDay] = useState(1);
  const [editNotes, setEditNotes] = useState('');

  const loan = loans.find(l => l.id === screenState.loanId);
  if (!loan) return <motion.div variants={screenVariantsLeft} initial="hidden" animate="visible" exit="exit" className="h-full flex items-center justify-center"><p className="text-cream-muted">العقد غير موجود</p></motion.div>;

  const borrower = borrowers.find(b => b.id === loan.borrowerId);
  const loanPayments = payments.filter(p => p.loanId === loan.id);
  const progress = (loan.monthsPaid / loan.monthsTotal) * 100;

  // Calculations
  const totalContractValue = (loan.monthlyPayment * (loan.monthsTotal - 1)) + loan.lastPayment;
  const profit = totalContractValue - loan.amount;
  const remainingMonths = loan.monthsTotal - loan.monthsPaid;
  const remaining = remainingMonths > 1 ? (loan.monthlyPayment * (remainingMonths - 1)) + loan.lastPayment : remainingMonths === 1 ? loan.lastPayment : 0;
  const collectedSoFar = (loan.monthlyPayment * Math.min(loan.monthsPaid, loan.monthsTotal - 1)) + (loan.monthsPaid >= loan.monthsTotal ? loan.lastPayment : 0);
  const actualProfit = collectedSoFar > loan.amount ? collectedSoFar - loan.amount : 0;

  // Edit calculations
  const editTotalContract = useMemo(() => { const amt = parseInt(editAmount) || 0; const rate = parseFloat(editInterest) || 0; return Math.round(amt * (1 + rate / 100)); }, [editAmount, editInterest]);
  const editMonthlyPayment = useMemo(() => { const m = parseInt(editMonths) || 1; return editTotalContract && m ? Math.floor(editTotalContract / m) : 0; }, [editTotalContract, editMonths]);
  const editLastPayment = useMemo(() => { const m = parseInt(editMonths) || 1; return editTotalContract && m ? editTotalContract - (editMonthlyPayment * (m - 1)) : 0; }, [editTotalContract, editMonthlyPayment, editMonths]);
  const editExpectedProfit = useMemo(() => (parseInt(editAmount) || 0) > 0 ? editTotalContract - parseInt(editAmount) : 0, [editTotalContract, editAmount]);

  const handlePay = async () => {
    setIsPaying(true);
    setTimeout(async () => {
      receivePayment({ loanId: loan.id, borrowerId: loan.borrowerId, borrowerName: loan.borrowerName, amount: loan.monthlyPayment, method: 'cash', notes: '' });
      if (borrower && autoReminderSettings.whatsappApiKey) {
        const message = fillTemplate('tmpl-confirm', { name: borrower.name, product: loan.productName, amount: fmt(loan.monthlyPayment), date: new Date().toLocaleDateString('ar-SA') });
        const ok = await sendWhatsAppAuto(borrower.phone, message, autoReminderSettings.whatsappApiKey);
        addToast(`تم ${ok ? 'إرسال تأكيد السداد' : 'التحصيل ولكن فشل إرسال واتساب'} لـ ${borrower.name}`, ok ? 'success' : 'error');
      }
      setIsPaying(false);
    }, 600);
  };

  const openEdit = () => {
    setEditProduct(loan.productName); setEditAmount(loan.amount.toString()); setEditMonths(loan.monthsTotal.toString());
    setEditInterest(loan.interestRate.toString()); setEditDueDay(loan.dueDay || 1); setEditNotes(loan.notes || ''); setShowEdit(true);
  };

  const handleSave = () => {
    const amount = parseInt(editAmount); const months = parseInt(editMonths); const interest = parseFloat(editInterest);
    if (!editProduct.trim() || isNaN(amount) || amount <= 0 || isNaN(months) || months < 1) return;
    updateLoan(loan.id, { productName: editProduct.trim(), amount, monthlyPayment: editMonthlyPayment, monthsTotal: months, interestRate: isNaN(interest) ? 0 : interest, dueDay: editDueDay, notes: editNotes.trim() || undefined });
    setShowEdit(false); addToast('تم تعديل بيانات العقد بنجاح', 'success');
  };

  return (
    <motion.div variants={screenVariantsLeft} initial="hidden" animate="visible" exit="exit" className="h-full flex flex-col overflow-hidden">
      <ScreenHeader title="تفاصيل العقد" onBack={navigateBack} action={
        <button onClick={openEdit} className="p-2 rounded-full" style={{ background: '#111D32', border: '2px solid rgba(212, 175, 55, 0.3)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
        </button>
      } />

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {/* Product & Borrower */}
        <motion.div variants={itemVariants} className="flex flex-col items-center mt-2">
          <h2 className="text-lg font-bold text-cream">{loan.productName}</h2>
          <button onClick={() => borrower && navigateToBorrower(borrower.id)} className="flex items-center gap-2 mt-1">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'linear-gradient(135deg, #D4AF37, #B8960E)', color: '#0A1628' }}>{loan.borrowerName.charAt(0)}</div>
            <span className="text-sm text-gold">{loan.borrowerName}</span>
          </button>
          <span className="mt-2"><LoanStatusBadge status={loan.status} /></span>
        </motion.div>

        {/* Progress Ring */}
        <motion.div variants={itemVariants} className="mt-4 flex justify-center">
          <div className="relative" style={{ width: 140, height: 140 }}>
            <svg width="140" height="140" viewBox="0 0 140 140" className="transform -rotate-90">
              <circle cx="70" cy="70" r="60" fill="none" stroke="#1A2D4A" strokeWidth="10" />
              <motion.circle cx="70" cy="70" r="60" fill="none" stroke={loan.status === 'overdue' ? '#DC2626' : '#D4AF37'} strokeWidth="10" strokeLinecap="round" strokeDasharray={2 * Math.PI * 60}
                initial={{ strokeDashoffset: 2 * Math.PI * 60 }} animate={{ strokeDashoffset: 2 * Math.PI * 60 * (1 - progress / 100) }} transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] as const }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-gold">{Math.round(progress)}%</span>
              <span className="text-xs text-cream-muted">تم السداد</span>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={itemVariants} className="mt-4 grid grid-cols-2 gap-3">
          <InfoCard label="مبلغ العقد" value={`${fmt(loan.amount)} ر.س`} />
          <InfoCard label="القسط الشهري" value={`${fmt(loan.monthlyPayment)} ر.س`} gold />
          <InfoCard label="عدد الأشهر" value={`${loan.monthsTotal} شهر`} />
          <InfoCard label="الأقساط المسددة" value={`${loan.monthsPaid} / ${loan.monthsTotal}`} />
          <InfoCard label="المتبقي" value={`${fmt(remaining)} ر.س`} accent />
          {loan.interestRate > 0 && <InfoCard label="نسبة الفائدة" value={`${loan.interestRate}%`} />}
          <InfoCard label="الربح المتوقع" value={`${fmt(profit)} ر.س`} gold />
          <InfoCard label="القسط الأخير" value={`${fmt(loan.lastPayment)} ر.س`} gold />
          {actualProfit > 0 && <InfoCard label="الربح المحقق" value={`${fmt(actualProfit)} ر.س`} accent />}
          <InfoCard label="إجمالي العقد" value={`${fmt(totalContractValue)} ر.س`} />
          <InfoCard label="تاريخ البدء" value={loan.startDate} />
          <InfoCard label="القسط القادم" value={loan.nextDueDate} />
        </motion.div>

        {/* Notes */}
        {loan.notes && (
          <motion.div variants={itemVariants} className="mt-3 p-3 rounded-xl" style={{ background: '#111D32', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
            <p className="text-xs text-cream-muted mb-1">ملاحظات</p>
            <p className="text-sm text-cream">{loan.notes}</p>
          </motion.div>
        )}

        {/* Pay Button */}
        {loan.status !== 'paid' && (
          <motion.div variants={itemVariants} className="mt-4">
            <motion.button onClick={handlePay} disabled={isPaying} className="w-full py-3 rounded-full font-bold text-base flex items-center justify-center gap-2"
              style={{ background: isPaying ? '#1A2D4A' : '#D4AF37', color: isPaying ? '#A3956B' : '#0A1628' }} whileTap={!isPaying ? { scale: 0.95 } : undefined}>
              {isPaying ? <motion.div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.6, ease: 'linear' }} /> : <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg> تحصيل القسط ({fmt(loan.monthlyPayment)} ر.س)</>}
            </motion.button>
          </motion.div>
        )}

        {/* Delete */}
        <motion.div variants={itemVariants} className="mt-3">
          <button onClick={() => setShowDelete(true)} className="w-full py-2.5 rounded-full text-sm font-bold" style={{ background: '#111D32', color: '#DC2626', border: '2px solid #DC2626' }}>حذف العقد</button>
        </motion.div>

        {/* Payment History */}
        <motion.div variants={itemVariants} className="mt-4">
          <h3 className="text-sm font-bold text-cream mb-2">سجل الدفعات</h3>
          {loanPayments.map(p => (
            <div key={p.id} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: 'rgba(212, 175, 55, 0.08)' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(5, 150, 105, 0.1)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-cream">{fmt(p.amount)} ر.س</p>
                <p className="text-xs text-cream-muted">{p.date} | {p.method === 'cash' ? 'كاش' : p.method === 'transfer' ? 'تحويل' : 'بنكي'}</p>
              </div>
            </div>
          ))}
          {loanPayments.length === 0 && <p className="text-xs text-cream-muted text-center py-4">لا توجد دفعات</p>}
        </motion.div>
      </div>

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5" style={{ background: 'rgba(10, 22, 40, 0.92)' }} onClick={() => setShowEdit(false)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: '#111D32', border: '2px solid #D4AF37' }} onClick={e => e.stopPropagation()}>
            <div className="p-4" style={{ background: 'rgba(212, 175, 55, 0.08)' }}><h2 className="text-base font-bold text-gold text-center">تعديل بيانات العقد</h2></div>
            <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
              <EditInput label="اسم المنتج *" value={editProduct} onChange={setEditProduct} />
              <EditInput label="المبلغ (ر.س) *" value={editAmount} onChange={setEditAmount} type="number" />
              <div className="grid grid-cols-3 gap-2">
                <PreviewBox label="القسط الشهري" value={fmt(editMonthlyPayment)} />
                <PreviewBox label="القسط الأخير" value={fmt(editLastPayment)} />
                <PreviewBox label="إجمالي العقد" value={fmt(editTotalContract)} accent />
              </div>
              {editExpectedProfit > 0 && <div className="w-full py-2 px-3 rounded-xl text-xs text-center" style={{ background: 'rgba(5, 150, 105, 0.08)', color: '#059669' }}>الربح: {fmt(editExpectedProfit)} ر.س</div>}
              <div className="grid grid-cols-2 gap-2">
                <EditInput label="عدد الأشهر *" value={editMonths} onChange={setEditMonths} type="number" />
                <EditInput label="نسبة الفائدة %" value={editInterest} onChange={setEditInterest} type="number" step="0.1" />
              </div>
              <EditInput label="يوم الاستحقاق (1-30)" value={editDueDay.toString()} onChange={v => { const val = parseInt(v); if (!isNaN(val) && val >= 1 && val <= 30) setEditDueDay(val); }} type="number" />
              <EditInput label="ملاحظات" value={editNotes} onChange={setEditNotes} textarea />
            </div>
            <div className="p-3 flex gap-2">
              <button onClick={() => setShowEdit(false)} className="flex-1 py-3 rounded-xl font-bold text-sm" style={{ background: '#1A2D4A', color: '#A3956B' }}>إلغاء</button>
              <button onClick={handleSave} disabled={!editProduct.trim() || !editAmount || !editMonths} className="flex-1 py-3 rounded-xl font-bold text-sm"
                style={{ background: !editProduct.trim() || !editAmount || !editMonths ? '#1A2D4A' : '#D4AF37', color: !editProduct.trim() || !editAmount || !editMonths ? '#A3956B' : '#0A1628' }}>حفظ</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmModal show={showDelete} title="تأكيد الحذف" message={`حذف عقد ${loan.productName} لـ ${loan.borrowerName}؟`} confirmLabel="حذف" icon="delete"
        onConfirm={() => { deleteLoan(loan.id); navigateBack(); }} onCancel={() => setShowDelete(false)} />
    </motion.div>
  );
}

function EditInput({ label, value, onChange, type, step, textarea }: { label: string; value: string; onChange: (v: string) => void; type?: string; step?: string; textarea?: boolean }) {
  return (
    <div>
      <label className="text-xs text-cream-muted block mb-1">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} className="w-full py-2 px-3 rounded-xl outline-none text-xs resize-none" style={{ background: '#0A1628', border: '1px solid rgba(212, 175, 55, 0.2)', color: '#F5F0E0', minHeight: '50px' }} />
      ) : (
        <input type={type || 'text'} step={step} value={value} onChange={e => onChange(e.target.value)} className="w-full py-2.5 px-3 rounded-xl outline-none text-sm text-left" style={{ background: '#0A1628', border: '1px solid rgba(212, 175, 55, 0.2)', color: '#F5F0E0' }} dir="ltr" />
      )}
    </div>
  );
}

function PreviewBox({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <label className="text-xs text-cream-muted block mb-1">{label}</label>
      <div className="w-full py-2.5 px-2 rounded-xl text-sm font-bold text-center" style={{ background: '#111D32', border: `1px solid ${accent ? '#059669' : '#D4AF37'}`, color: accent ? '#059669' : '#D4AF37' }}>{value}</div>
    </div>
  );
}
