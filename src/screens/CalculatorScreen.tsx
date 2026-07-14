import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { screenVariants, itemVariants } from '@/lib/animation';
import { fmt } from '@/lib/format';
const durations = [3, 6, 9, 12, 18, 24];
export default function CalculatorScreen() {
  const [amount, setAmount] = useState('10000');
  const [duration, setDuration] = useState(12);
  const [interestRate, setInterestRate] = useState('5');
  const [calcType, setCalcType] = useState<'flat' | 'declining'>('flat');
  const result = useMemo(() => {
    const principal = parseFloat(amount) || 0;
    const rate = parseFloat(interestRate) || 0;
    const months = duration;
    if (principal <= 0) return null;
    if (calcType === 'flat') {
      // Fixed interest: profit = principal * rate%
      const profit = Math.round(principal * rate / 100);
      const total = principal + profit;
      const monthly = total / months;
      const monthlyPrincipal = principal / months;
      const monthlyProfit = profit / months;
      return {
        monthly, total, profit,
        schedule: Array.from({ length: Math.min(months, 6) }, (_, i) => ({
          month: i + 1, payment: monthly, principal: monthlyPrincipal, interest: monthlyProfit
        }))
      };
    } else {
      // Declining balance
      const monthlyPrincipal = principal / months;
      const monthlyRate = rate / 100 / 12;
      const schedule = [];
      let balance = principal;
      let total = 0;
      for (let i = 0; i < months; i++) {
        const interestPayment = balance * monthlyRate;
        const payment = monthlyPrincipal + interestPayment;
        schedule.push({ month: i + 1, payment, principal: monthlyPrincipal, interest: interestPayment });
        total += payment;
        balance -= monthlyPrincipal;
      }
      return { monthly: schedule[0]?.payment || 0, total, profit: total - principal, schedule: schedule.slice(0, 6) };
    }
  }, [amount, duration, interestRate, calcType]);
  return (
    <motion.div variants={screenVariants} initial="hidden" animate="visible" exit="exit" className="h-full flex flex-col overflow-hidden">
      <motion.div variants={itemVariants} className="px-5 pt-4 pb-2">
        <h1 className="font-kufi text-xl font-bold text-gold">حاسبة الربح</h1>
        <p className="text-xs text-cream-muted">احسب أرباح العقود</p>
      </motion.div>
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <motion.div variants={itemVariants} className="mt-2">
          <label className="text-sm text-cream-muted block mb-1.5">مبلغ العقد (ر.س)</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full py-3 px-4 rounded-xl outline-none text-lg font-bold text-center" style={{ background: '#111D32', border: '2px solid #D4AF37', color: '#F5F0E0' }} dir="ltr" />
        </motion.div>
        <motion.div variants={itemVariants} className="mt-3">
          <label className="text-sm text-cream-muted block mb-1.5">نسبة الفائدة %</label>
          <input type="number" value={interestRate} onChange={e => setInterestRate(e.target.value)} className="w-full py-2.5 px-4 rounded-xl outline-none text-sm text-center" style={{ background: '#111D32', border: '2px solid rgba(212, 175, 55, 0.3)', color: '#F5F0E0' }} dir="ltr" />
        </motion.div>
        <motion.div variants={itemVariants} className="mt-3">
          <label className="text-sm text-cream-muted block mb-1.5">مدة التقسيط</label>
          <div className="flex gap-2 flex-wrap">
            {durations.map(d => (
              <button key={d} onClick={() => setDuration(d)} className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                style={{ background: duration === d ? '#D4AF37' : '#111D32', color: duration === d ? '#0A1628' : '#A3956B', border: duration === d ? '2px solid #B8960E' : '2px solid rgba(212, 175, 55, 0.2)' }}>{d} شهر</button>
            ))}
          </div>
        </motion.div>
        <motion.div variants={itemVariants} className="mt-3">
          <label className="text-sm text-cream-muted block mb-1.5">نوع الفائدة</label>
          <div className="flex gap-2">
            <button onClick={() => setCalcType('flat')} className="flex-1 py-2 rounded-xl text-sm font-semibold" style={{ background: calcType === 'flat' ? '#D4AF37' : '#111D32', color: calcType === 'flat' ? '#0A1628' : '#A3956B', border: calcType === 'flat' ? '2px solid #B8960E' : '2px solid rgba(212, 175, 55, 0.2)' }}>ثابتة</button>
            <button onClick={() => setCalcType('declining')} className="flex-1 py-2 rounded-xl text-sm font-semibold" style={{ background: calcType === 'declining' ? '#D4AF37' : '#111D32', color: calcType === 'declining' ? '#0A1628' : '#A3956B', border: calcType === 'declining' ? '2px solid #B8960E' : '2px solid rgba(212, 175, 55, 0.2)' }}>متناقصة</button>
          </div>
        </motion.div>
        {result && (
          <motion.div variants={itemVariants} className="mt-4 p-4 rounded-xl" style={{ background: '#111D32', border: '2px solid #D4AF37' }}>
            <div className="grid grid-cols-3 gap-3 text-center mb-3">
              <div><p className="text-xs text-cream-muted">القسط الشهري</p><p className="text-lg font-bold text-gold">{fmt(result.monthly)}</p></div>
              <div><p className="text-xs text-cream-muted">إجمالي المبلغ</p><p className="text-lg font-bold text-cream">{fmt(result.total)}</p></div>
              <div><p className="text-xs text-cream-muted">الربح</p><p className="text-lg font-bold" style={{ color: '#059669' }}>{fmt(result.profit)}</p></div>
            </div>
            <p className="text-xs text-cream-muted mb-2">جدول الأقساط (أول 6 أشهر)</p>
            <div className="space-y-1">
              {result.schedule.map(s => (
                <div key={s.month} className="flex items-center justify-between py-1.5 px-2 rounded-lg" style={{ background: '#0A1628' }}>
                  <span className="text-xs text-cream-muted">شهر {s.month}</span>
                  <span className="text-xs font-bold text-gold">{fmt(s.payment)} ر.س</span>
                  <span className="text-xs text-cream-muted">رأس: {fmt(s.principal)} | فايدة: {fmt(s.interest)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
