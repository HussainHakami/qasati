import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { fmt } from '@/lib/format';
import { screenVariants, itemVariants } from '@/lib/animation';
import ScreenHeader from '@/components/ScreenHeader';
import FormField from '@/components/FormField';

const durations = [3, 6, 9, 12, 18, 24];

export default function AddLoanScreen() {
  const { navigateBack, addLoan, borrowers } = useApp();
  const [borrowerId, setBorrowerId] = useState<string>(borrowers[0]?.id ?? '');
  const [productName, setProductName] = useState('');
  const [amount, setAmount] = useState('');
  const [monthsTotal, setMonthsTotal] = useState(12);
  const [interestRate, setInterestRate] = useState('0');
  const [dueDay, setDueDay] = useState(1);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const totalContract = useMemo(() => {
    const amt = parseFloat(amount) || 0;
    return Math.round(amt * (1 + (parseFloat(interestRate) || 0) / 100));
  }, [amount, interestRate]);

  const monthlyPayment = useMemo(() => totalContract && monthsTotal ? Math.floor(totalContract / monthsTotal) : 0, [totalContract, monthsTotal]);
  const lastPayment = useMemo(() => totalContract && monthsTotal ? totalContract - (monthlyPayment * (monthsTotal - 1)) : 0, [totalContract, monthlyPayment, monthsTotal]);
  const profit = useMemo(() => (parseFloat(amount) || 0) > 0 ? totalContract - parseFloat(amount) : 0, [totalContract, amount]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!borrowerId) e.borrower = 'اختر العميل';
    if (!productName.trim()) e.product = 'اسم المنتج مطلوب';
    if (!amount || parseFloat(amount) <= 0) e.amount = 'المبلغ مطلوب';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const borrower = borrowers.find(b => b.id === borrowerId);
    addLoan({ borrowerId, borrowerName: borrower?.name || '', productName: productName.trim(), amount: parseFloat(amount), monthsTotal, monthsPaid: 0, startDate: new Date().toISOString().split('T')[0], nextDueDate: '', dueDay, interestRate: parseFloat(interestRate) || 0, notes });
    setSuccess(true);
    setTimeout(() => { setSuccess(false); navigateBack(); }, 1200);
  };

  return (
    <motion.div variants={screenVariants} initial="hidden" animate="visible" exit="exit" className="h-full flex flex-col overflow-hidden">
      <ScreenHeader title="عقد جديد" onBack={navigateBack} />
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {/* Borrower Select */}
        <motion.div variants={itemVariants} className="mt-2">
          <label className="text-sm text-cream-muted block mb-1.5">العميل *</label>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {borrowers.map(b => (
              <button key={b.id} onClick={() => setBorrowerId(b.id)} className="w-full flex items-center gap-3 p-2.5 rounded-xl text-right transition-all"
                style={{ background: borrowerId === b.id ? 'rgba(212, 175, 55, 0.15)' : '#111D32', border: borrowerId === b.id ? '2px solid #D4AF37' : '2px solid transparent' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'linear-gradient(135deg, #D4AF37, #B8960E)', color: '#0A1628' }}>{b.name.charAt(0)}</div>
                <div className="flex-1"><p className="text-sm font-bold text-cream">{b.name}</p><p className="text-xs text-cream-muted">{b.phone}</p></div>
              </button>
            ))}
          </div>
        </motion.div>

        <FormField label="المنتج/الوصف *" value={productName} onChange={setProductName} error={errors.product} />
        <FormField label="مبلغ العقد (ر.س) *" value={amount} onChange={setAmount} error={errors.amount} dir="ltr" type="number" />

        <motion.div variants={itemVariants} className="mt-3">
          <label className="text-sm text-cream-muted block mb-1.5">مدة التقسيط</label>
          <div className="flex gap-2 flex-wrap">
            {durations.map(d => (
              <button key={d} onClick={() => setMonthsTotal(d)} className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                style={{ background: monthsTotal === d ? '#D4AF37' : '#111D32', color: monthsTotal === d ? '#0A1628' : '#A3956B', border: monthsTotal === d ? '2px solid #B8960E' : '2px solid rgba(212, 175, 55, 0.2)' }}>{d} شهر</button>
            ))}
          </div>
        </motion.div>

        <FormField label="نسبة الفائدة %" value={interestRate} onChange={setInterestRate} dir="ltr" type="number" />

        {/* Due Day */}
        <motion.div variants={itemVariants} className="mt-3">
          <label className="text-sm text-cream-muted block mb-1.5">يوم الاستحقاق الشهري (1-30)</label>
          <div className="flex items-center gap-3">
            <button onClick={() => setDueDay(Math.max(1, dueDay - 1))} className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: '#111D32', border: '2px solid #D4AF37', color: '#D4AF37' }}>-</button>
            <input type="number" min={1} max={30} value={dueDay} onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1 && v <= 30) setDueDay(v); }}
              className="flex-1 py-2.5 rounded-xl outline-none text-lg font-bold text-center" style={{ background: '#111D32', border: '2px solid #D4AF37', color: '#F5F0E0' }} dir="ltr" />
            <button onClick={() => setDueDay(Math.min(30, dueDay + 1))} className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: '#111D32', border: '2px solid #D4AF37', color: '#D4AF37' }}>+</button>
          </div>
        </motion.div>

        {/* Preview */}
        {amount && parseFloat(amount) > 0 && (
          <motion.div variants={itemVariants} className="mt-4 p-4 rounded-xl" style={{ background: '#111D32', border: '2px solid #D4AF37' }}>
            <p className="text-xs text-cream-muted mb-2">معاينة العقد</p>
            <div className="grid grid-cols-2 gap-2">
              <Preview label="القسط الشهري" value={`${fmt(monthlyPayment)} ر.س`} gold />
              <Preview label="القسط الأخير" value={`${fmt(lastPayment)} ر.س`} gold />
              <Preview label="إجمالي العقد" value={`${fmt(totalContract)} ر.س`} />
              <Preview label={profit >= 0 ? 'الربح' : 'الخسارة'} value={`${fmt(Math.abs(profit))} ر.س`} accent />
            </div>
          </motion.div>
        )}

        <FormField label="ملاحظات" value={notes} onChange={setNotes} textarea rows={2} placeholder="شروط أو ملاحظات..." />

        <motion.div variants={itemVariants} className="mt-4 mb-2">
          <button onClick={handleSubmit} className="w-full py-3.5 rounded-full font-bold text-base text-center transition-all"
            style={{ background: success ? '#059669' : '#D4AF37', color: success ? '#fff' : '#0A1628', border: success ? '4px solid #047857' : '4px solid #B8960E' }}>
            {success ? 'تم إضافة العقد!' : 'إضافة العقد'}
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}

function Preview({ label, value, gold, accent }: { label: string; value: string; gold?: boolean; accent?: boolean }) {
  return (
    <div className="text-center">
      <p className="text-xs text-cream-muted">{label}</p>
      <p className="text-sm font-bold" style={{ color: gold ? '#D4AF37' : accent ? '#059669' : '#F5F0E0' }}>{value}</p>
    </div>
  );
}
