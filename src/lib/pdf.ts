import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Loan, Payment, Borrower } from "@/types";

export function generateMonthlyReport(
  userName: string,
  businessName: string,
  month: string,
  loans: Loan[],
  payments: Payment[],
  borrowers: Borrower[],
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // RTL support
  doc.setR2L(true);

  // Header
  doc.setFontSize(20);
  doc.setTextColor(212, 175, 55); // Gold
  doc.text("قسطي — تقرير شهري", 105, 20, { align: "center" });

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`${businessName || userName} — ${month}`, 105, 30, { align: "center" });

  // Summary stats
  const totalLoaned = loans.reduce((s, l) => s + l.amount, 0);
  const totalCollected = payments.reduce((s, p) => s + p.amount, 0);
  const activeLoans = loans.filter(l => l.status === "active" || l.status === "overdue");
  const totalRemaining = activeLoans.reduce((s, l) => s + (l.monthlyPayment * (l.monthsTotal - l.monthsPaid)), 0);
  const totalContract = loans.reduce((s, l) => s + (l.monthlyPayment * (l.monthsTotal - 1) + l.lastPayment), 0);
  const totalProfit = totalContract - totalLoaned;

  const stats = [
    ["إجمالي العقود", `${totalLoaned.toLocaleString("ar-SA")} ر.س`],
    ["إجمالي المحصل", `${totalCollected.toLocaleString("ar-SA")} ر.س`],
    ["المبالغ المستحقة", `${totalRemaining.toLocaleString("ar-SA")} ر.س`],
    ["إجمالي العقود", `${totalContract.toLocaleString("ar-SA")} ر.س`],
    ["الربح المتوقع", `${totalProfit.toLocaleString("ar-SA")} ر.س`],
    ["عدد العملاء", borrowers.length.toString()],
    ["العقود النشطة", activeLoans.length.toString()],
  ];

  autoTable(doc, {
    startY: 40,
    head: [["البيان", "القيمة"]],
    body: stats,
    theme: "grid",
    headStyles: { fillColor: [212, 175, 55], textColor: [10, 22, 40], fontStyle: "bold" },
    styles: { font: "helvetica", halign: "center" },
    alternateRowStyles: { fillColor: [248, 248, 248] },
  });

  // Active loans table
  const activeLoanRows = activeLoans.map(l => [
    l.borrowerName,
    l.productName,
    `${l.amount.toLocaleString("ar-SA")}`,
    `${l.monthlyPayment.toLocaleString("ar-SA")}`,
    `${l.monthsPaid}/${l.monthsTotal}`,
    l.nextDueDate,
    l.status === "overdue" ? "متأخر" : "نشط",
  ]);

  if (activeLoanRows.length > 0) {
    autoTable(doc, {
      startY: (doc as any).lastAutoTable?.finalY + 10 || 100,
      head: [["العميل", "المنتج", "المبلغ", "القسط", "السداد", "الاستحقاق", "الحالة"]],
      body: activeLoanRows,
      theme: "grid",
      headStyles: { fillColor: [10, 22, 40], textColor: [212, 175, 55], fontStyle: "bold" },
      styles: { font: "helvetica", halign: "center", fontSize: 9 },
      columnStyles: { 6: { cellWidth: 20 } },
    });
  }

  // Payments table
  const paymentRows = payments.slice(0, 20).map(p => [
    p.borrowerName,
    `${p.amount.toLocaleString("ar-SA")}`,
    p.date,
    p.method === "cash" ? "كاش" : p.method === "transfer" ? "تحويل" : "بنكي",
  ]);

  if (paymentRows.length > 0) {
    autoTable(doc, {
      startY: (doc as any).lastAutoTable?.finalY + 10 || 100,
      head: [["العميل", "المبلغ", "التاريخ", "الطريقة"]],
      body: paymentRows,
      theme: "grid",
      headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: "bold" },
      styles: { font: "helvetica", halign: "center", fontSize: 9 },
    });
  }

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text(`تم إنشاء هذا التقرير بتاريخ ${new Date().toLocaleDateString("ar-SA")} بواسطة تطبيق قسطي`, 105, 280, { align: "center" });

  return doc;
}
