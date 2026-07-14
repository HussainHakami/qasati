import { db } from "./connection";
import { users, borrowers, loans, payments, messageTemplates, autoReminders } from "./schema";

async function seed() {
  const userId = "demo_user";

  // User
  await db.insert(users).values({
    id: userId, name: "أحمد التجريبي", phone: "0500000000",
    email: "demo@qasati.sa", businessName: "مؤسسة التجريبي",
    role: "user", createdAt: new Date(),
  }).onConflictDoNothing();

  // Borrowers
  const bs = [
    { id: "b1", userId, name: "خالد السبيعي", phone: "0501234567", idNumber: "1098765432", address: "الرياض، حي النسيم", rating: "trusted" as const, notes: "عميل منتظم" },
    { id: "b2", userId, name: "فهد العتيبي", phone: "0559876543", idNumber: "1122334455", address: "جدة، حي الصفا", rating: "average" as const, notes: "" },
    { id: "b3", userId, name: "سعد القحطاني", phone: "0544567890", idNumber: "2233445566", address: "الدمام، حي الفيصلية", rating: "trusted" as const, notes: "دفعات مبكرة" },
    { id: "b4", userId, name: "ناصر الدوسري", phone: "0567890123", idNumber: "3344556677", address: "الرياض، حي الملز", rating: "late" as const, notes: "يتأخر أحياناً" },
    { id: "b5", userId, name: "عبدالله المطيري", phone: "0532109876", idNumber: "4455667788", address: "مكة، حي العزيزية", rating: "trusted" as const, notes: "" },
  ];
  for (const b of bs) await db.insert(borrowers).values(b).onConflictDoNothing();

  // Loans (with correct calculations)
  const ls = [
    // 5500, 0%, 12mo → total=5500, floor(5500/12)=458, last=5500-458*11=462
    { id: "l1", userId, borrowerId: "b1", borrowerName: "خالد السبيعي", productName: "آيفون 15 برو ماكس", amount: 5500, monthlyPayment: 458, lastPayment: 462, monthsTotal: 12, monthsPaid: 8, startDate: "2025-10-01", nextDueDate: "1 أغسطس 2026", dueDay: 1, interestRate: 0, status: "active" as const, notes: "" },
    // 8500, 5%, 12mo → total=8925, floor(8925/12)=743, last=8925-743*11=752
    { id: "l2", userId, borrowerId: "b2", borrowerName: "فهد العتيبي", productName: "ماك بوك برو M3", amount: 8500, monthlyPayment: 743, lastPayment: 752, monthsTotal: 12, monthsPaid: 3, startDate: "2026-04-01", nextDueDate: "1 أغسطس 2026", dueDay: 1, interestRate: 5, status: "active" as const, notes: "" },
    // 4000, 0%, 12mo → total=4000, floor(4000/12)=333, last=4000-333*11=337
    { id: "l3", userId, borrowerId: "b3", borrowerName: "سعد القحطاني", productName: "طقم كنب مودرن", amount: 4000, monthlyPayment: 333, lastPayment: 337, monthsTotal: 12, monthsPaid: 11, startDate: "2025-08-01", nextDueDate: "1 أغسطس 2026", dueDay: 1, interestRate: 0, status: "active" as const, notes: "" },
    // 5000, 8%, 10mo → total=5400, floor(5400/10)=540, last=5400-540*9=540
    { id: "l4", userId, borrowerId: "b4", borrowerName: "ناصر الدوسري", productName: 'تلفزيون سامسونج 75"', amount: 5000, monthlyPayment: 540, lastPayment: 540, monthsTotal: 10, monthsPaid: 2, startDate: "2026-05-15", nextDueDate: "15 أغسطس 2026", dueDay: 15, interestRate: 8, status: "overdue" as const, notes: "" },
    // 2500, 0%, 6mo → total=2500, floor(2500/6)=416, last=2500-416*5=420
    { id: "l5", userId, borrowerId: "b5", borrowerName: "عبدالله المطيري", productName: "سماعات AirPods Max", amount: 2500, monthlyPayment: 416, lastPayment: 420, monthsTotal: 6, monthsPaid: 6, startDate: "2026-01-01", nextDueDate: "—", dueDay: 1, interestRate: 0, status: "paid" as const, notes: "" },
    // 4500, 0%, 6mo → total=4500, floor(4500/6)=750, last=4500-750*5=750
    { id: "l6", userId, borrowerId: "b1", borrowerName: "خالد السبيعي", productName: "آيباد برو", amount: 4500, monthlyPayment: 750, lastPayment: 750, monthsTotal: 6, monthsPaid: 4, startDate: "2026-03-01", nextDueDate: "1 أغسطس 2026", dueDay: 1, interestRate: 0, status: "active" as const, notes: "" },
  ];
  for (const l of ls) await db.insert(loans).values(l).onConflictDoNothing();

  // Payments
  const ps = [
    { id: "p1", userId, loanId: "l1", borrowerId: "b1", borrowerName: "خالد السبيعي", amount: 459, date: "2025-11-01", method: "cash" as const, notes: "" },
    { id: "p2", userId, loanId: "l1", borrowerId: "b1", borrowerName: "خالد السبيعي", amount: 459, date: "2025-12-01", method: "transfer" as const, notes: "" },
    { id: "p3", userId, loanId: "l1", borrowerId: "b1", borrowerName: "خالد السبيعي", amount: 459, date: "2026-01-01", method: "cash" as const, notes: "" },
    { id: "p4", userId, loanId: "l2", borrowerId: "b2", borrowerName: "فهد العتيبي", amount: 744, date: "2026-05-01", method: "cash" as const, notes: "" },
    { id: "p5", userId, loanId: "l4", borrowerId: "b4", borrowerName: "ناصر الدوسري", amount: 540, date: "2026-06-15", method: "cash" as const, notes: "" },
  ];
  for (const p of ps) await db.insert(payments).values(p).onConflictDoNothing();

  // Default templates
  const ts = [
    { id: "tmpl-remind", userId, name: "تذكير بالقسط", subject: "تذكير واتساب", body: "السلام عليكم {name} 👋\n\nتذكير بقسطك المستحق على: {product}\nالمبلغ: {amount} ر.س\nتاريخ الاستحقاق: {date}\n\nيرجى التسديد في الموعد. شكراً لتعاونكم 🙏" },
    { id: "tmpl-confirm", userId, name: "تأكيد السداد", subject: "تأكيد سداد", body: "السلام عليكم {name} 👋\n\nتم استلام دفعتك بقيمة: {amount} ر.س\nللقرض: {product}\nالتاريخ: {date}\n\nشكراً لالتزامك بالسداد 🙏" },
  ];
  for (const t of ts) await db.insert(messageTemplates).values(t).onConflictDoNothing();

  // Default reminder settings
  await db.insert(autoReminders).values({
    id: "ar1", userId, enabled: false, daysBefore: 1, templateId: "tmpl-remind",
  }).onConflictDoNothing();

  console.log("Seed complete!");
}

seed().catch(console.error);
