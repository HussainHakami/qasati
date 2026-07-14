import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { generateMonthlyReport } from "@/lib/pdf";
import { screenVariants } from "@/lib/animation";
export default function ReportScreen() {
  const { borrowers, loans, payments, currentUser, navigateBack } = useApp();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const filteredPayments = useMemo(() => {
    const [year, month] = selectedMonth.split("-");
    return payments.filter(p => {
      const d = new Date(p.date);
      return d.getFullYear() === parseInt(year) && d.getMonth() === parseInt(month) - 1;
    });
  }, [payments, selectedMonth]);
  const totalLoaned = loans.reduce((s, l) => s + l.amount, 0);
  const totalCollected = filteredPayments.reduce((s, p) => s + p.amount, 0);
  const activeLoans = loans.filter(l => l.status === "active" || l.status === "overdue");
  const totalRemaining = activeLoans.reduce((s, l) => {
    const remainingMonths = l.monthsTotal - l.monthsPaid;
    if (remainingMonths <= 0) return s;
    return s + (l.monthlyPayment * (remainingMonths - 1) + l.lastPayment);
  }, 0);
  const totalContract = loans.reduce((s, l) => s + (l.monthlyPayment * (l.monthsTotal - 1) + l.lastPayment), 0);
  const totalProfit = totalContract - totalLoaned;
  const handleDownloadPDF = () => {
    const [year, month] = selectedMonth.split("-");
    const monthLabel = `${monthNames[parseInt(month) - 1]} ${year}`;
    const doc = generateMonthlyReport(
      currentUser?.name || "مستخدم",
      currentUser?.businessName || "",
      monthLabel,
      loans,
      filteredPayments,
      borrowers,
    );
    doc.save(`qasati-report-${selectedMonth}.pdf`);
  };
  return (
    <motion.div variants={screenVariants} initial="hidden" animate="visible" exit="exit" className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-2">
        <button onClick={navigateBack} className="p-2 rounded-full" style={{ background: "#111D32", border: "2px solid rgba(212, 175, 55, 0.3)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <h1 className="font-kufi text-xl font-bold text-gold flex-1">التقرير الشهري</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {/* Month selector */}
        <div className="mt-2">
          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="w-full py-2.5 px-3 rounded-xl outline-none text-sm"
            style={{ background: "#0A1628", border: "1px solid rgba(212, 175, 55, 0.2)", color: "#F5F0E0" }}
          />
        </div>
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <StatCard label="إجمالي العقود" value={`${totalLoaned.toLocaleString("ar-SA")} ر.س`} />
          <StatCard label="إجمالي المحصل" value={`${totalCollected.toLocaleString("ar-SA")} ر.س`} gold />
          <StatCard label="المبالغ المستحقة" value={`${totalRemaining.toLocaleString("ar-SA")} ر.س`} accent />
          <StatCard label="الربح المتوقع" value={`${totalProfit.toLocaleString("ar-SA")} ر.س`} gold />
          <StatCard label="العملاء" value={borrowers.length.toString()} />
          <StatCard label="العقود النشطة" value={activeLoans.length.toString()} accent />
        </div>
        {/* Download PDF */}
        <button
          onClick={handleDownloadPDF}
          className="w-full mt-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
          style={{ background: "#D4AF37", color: "#0A1628" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          تحميل التقرير PDF
        </button>
        {/* Preview table */}
        <div className="mt-4">
          <h3 className="text-sm font-bold text-cream mb-2">العقود النشطة</h3>
          {activeLoans.map(l => (
            <div key={l.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: "rgba(212, 175, 55, 0.08)" }}>
              <div>
                <p className="text-sm text-cream">{l.borrowerName} — {l.productName}</p>
                <p className="text-xs text-cream-muted">{l.monthsPaid}/{l.monthsTotal} قسط</p>
              </div>
              <span className="text-sm font-bold text-gold">{l.monthlyPayment.toLocaleString("ar-SA")} ر.س/شهر</span>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <h3 className="text-sm font-bold text-cream mb-2">الدفعات ({filteredPayments.length})</h3>
          {filteredPayments.map(p => (
            <div key={p.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: "rgba(212, 175, 55, 0.08)" }}>
              <div>
                <p className="text-sm text-cream">{p.borrowerName}</p>
                <p className="text-xs text-cream-muted">{p.date}</p>
              </div>
              <span className="text-sm font-bold text-gold">+{p.amount.toLocaleString("ar-SA")} ر.س</span>
            </div>
          ))}
          {filteredPayments.length === 0 && <p className="text-xs text-cream-muted text-center py-4">لا توجد دفعات هذا الشهر</p>}
        </div>
      </div>
    </motion.div>
  );
}
function StatCard({ label, value, gold, accent }: { label: string; value: string; gold?: boolean; accent?: boolean }) {
  return (
    <div className="p-3 rounded-xl text-center" style={{ background: "#111D32", border: "1px solid rgba(212, 175, 55, 0.1)" }}>
      <p className="text-xs text-cream-muted mb-1">{label}</p>
      <p className="text-sm font-bold" style={{ color: gold ? "#D4AF37" : accent ? "#059669" : "#F5F0E0" }}>{value}</p>
    </div>
  );
}
