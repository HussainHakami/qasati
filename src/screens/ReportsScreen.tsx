import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { fmt } from '@/lib/format';
import { screenVariants, itemVariants } from '@/lib/animation';
import ScreenHeader from '@/components/ScreenHeader';
import InfoCard from '@/components/InfoCard';

export default function ReportsScreen() {
  const { loans, borrowers, payments } = useApp();

  const stats = useMemo(() => {
    const totalLoaned = loans.reduce((s, l) => s + l.amount, 0);
    const totalCollected = payments.reduce((s, p) => s + p.amount, 0);
    const totalRemaining = loans.filter(l => l.status === 'active' || l.status === 'overdue').reduce((s, l) => {
      const remainingMonths = l.monthsTotal - l.monthsPaid;
      if (remainingMonths <= 0) return s;
      return s + (l.monthlyPayment * (remainingMonths - 1) + l.lastPayment);
    }, 0);
    const totalProfit = loans.reduce((s, l) => {
      const collected = payments.filter(p => p.loanId === l.id).reduce((sum, p) => sum + p.amount, 0);
      return s + (collected >= l.amount ? collected - l.amount : 0);
    }, 0);

    // Monthly data
    const monthly: Record<string, number> = {};
    payments.forEach(p => { const key = p.date.substring(0, 7); monthly[key] = (monthly[key] || 0) + p.amount; });
    const monthlyLabels = Object.keys(monthly).sort().slice(-6);
    const monthlyValues = monthlyLabels.map(k => monthly[k]);
    const maxVal = Math.max(...monthlyValues, 1);

    const borrowerTotals = borrowers.map(b => ({
      ...b, totalPaid: payments.filter(p => p.borrowerId === b.id).reduce((s, p) => s + p.amount, 0),
    })).sort((a, b) => b.totalPaid - a.totalPaid).slice(0, 5);

    const active = loans.filter(l => l.status === 'active').length;
    const overdue = loans.filter(l => l.status === 'overdue').length;
    const paid = loans.filter(l => l.status === 'paid').length;

    return { totalLoaned, totalCollected, totalRemaining, totalProfit, monthlyLabels, monthlyValues, maxVal, borrowerTotals, active, overdue, paid };
  }, [loans, borrowers, payments]);

  const formatMonth = (m: string) => { const [y, month] = m.split('-'); return new Date(parseInt(y), parseInt(month) - 1).toLocaleDateString('ar-SA', { month: 'short' }); };

  return (
    <motion.div variants={screenVariants} initial="hidden" animate="visible" exit="exit" className="h-full flex flex-col overflow-hidden">
      <ScreenHeader title="التقارير" />
      <motion.p variants={itemVariants} className="px-5 text-xs text-cream-muted -mt-1 mb-1">تحليل أداء عقودك</motion.p>
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {/* Summary Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 mt-2">
          <InfoCard label="إجمالي العقود" value={`${fmt(stats.totalLoaned)} ر.س`} gold />
          <InfoCard label="إجمالي المحصل" value={`${fmt(stats.totalCollected)} ر.س`} accent />
          <InfoCard label="المبالغ المستحقة" value={`${fmt(stats.totalRemaining)} ر.س`} danger />
          <InfoCard label="صافي الربح" value={`${fmt(Math.max(0, stats.totalProfit))} ر.س`} />
        </motion.div>

        {/* Status Breakdown */}
        <motion.div variants={itemVariants} className="mt-4 p-4 rounded-xl" style={{ background: '#111D32', border: '1px solid rgba(212, 175, 55, 0.15)' }}>
          <h3 className="text-sm font-bold text-cream mb-3">توزيع حالة العقود</h3>
          <div className="flex items-center gap-4">
            {[
              { label: 'نشط', count: stats.active, color: '#059669' },
              { label: 'متأخر', count: stats.overdue, color: '#DC2626' },
              { label: 'مغلق', count: stats.paid, color: '#2563EB' },
            ].map(s => (
              <div key={s.label} className="flex-1">
                <div className="flex justify-between text-xs mb-1"><span className="text-cream-muted">{s.label}</span><span className="text-gold">{s.count}</span></div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1A2D4A' }}>
                  <div className="h-full rounded-full" style={{ width: `${loans.length ? (s.count / loans.length) * 100 : 0}%`, background: s.color }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Monthly Bar Chart */}
        <motion.div variants={itemVariants} className="mt-4 p-4 rounded-xl" style={{ background: '#111D32', border: '1px solid rgba(212, 175, 55, 0.15)' }}>
          <h3 className="text-sm font-bold text-cream mb-3">التحصيل الشهري</h3>
          <div className="flex items-end gap-3" style={{ height: '120px' }}>
            {stats.monthlyLabels.map((label, i) => {
              const h = (stats.monthlyValues[i] / stats.maxVal) * 100;
              return (
                <div key={label} className="flex-1 flex flex-col items-center justify-end gap-1">
                  <span className="text-gold" style={{ fontSize: '9px' }}>{fmt(stats.monthlyValues[i])}</span>
                  <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} className="w-full rounded-t-md" style={{ background: 'linear-gradient(to top, #D4AF37, #E5C84B)', minHeight: '4px' }} />
                  <span className="text-cream-muted" style={{ fontSize: '10px' }}>{formatMonth(label)}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Top Borrowers */}
        <motion.div variants={itemVariants} className="mt-4">
          <h3 className="text-sm font-bold text-cream mb-2">أفضل العملاء</h3>
          {stats.borrowerTotals.map((b, i) => (
            <div key={b.id} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: 'rgba(212, 175, 55, 0.08)' }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: i === 0 ? '#D4AF37' : i === 1 ? '#A3956B' : i === 2 ? '#B8763A' : '#1A2D4A', color: '#0A1628' }}>{i + 1}</div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'linear-gradient(135deg, #D4AF37, #B8960E)', color: '#0A1628' }}>{b.name.charAt(0)}</div>
              <div className="flex-1"><p className="text-sm font-medium text-cream">{b.name}</p></div>
              <span className="text-sm font-bold text-gold">{fmt(b.totalPaid)} ر.س</span>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
