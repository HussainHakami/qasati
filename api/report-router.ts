import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { borrowers, loans, payments } from "../db/schema";
import { eq, and, sql } from "drizzle-orm";

export const reportRouter = createRouter({
  // Monthly report data
  monthly: authedQuery
    .input(z.object({
      userId: z.string(),
      year: z.number(),
      month: z.number(),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const monthStr = `${input.year}-${String(input.month).padStart(2, "0")}`;

      const [allLoans, allPayments] = await Promise.all([
        db.select().from(loans).where(eq(loans.userId, input.userId)),
        db.select().from(payments).where(eq(payments.userId, input.userId)),
      ]);

      const monthPayments = allPayments.filter(p => p.date.startsWith(monthStr));
      const totalCollected = monthPayments.reduce((s, p) => s + (p.amount || 0), 0);
      const activeLoans = allLoans.filter(l => l.status === "active" || l.status === "overdue");
      const totalRemaining = activeLoans.reduce((s, l) => {
        const remaining = (l.monthlyPayment || 0) * ((l.monthsTotal || 0) - (l.monthsPaid || 0));
        return s + remaining;
      }, 0);

      return {
        month: monthStr,
        totalLoaned: allLoans.reduce((s, l) => s + (l.amount || 0), 0),
        totalCollected,
        totalRemaining,
        activeLoans: activeLoans.length,
        paidLoans: allLoans.filter(l => l.status === "paid").length,
        overdueLoans: allLoans.filter(l => l.status === "overdue").length,
        paymentCount: monthPayments.length,
        payments: monthPayments,
      };
    }),

  // Dashboard summary
  dashboard: authedQuery
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [allLoans, allPayments, allBorrowers] = await Promise.all([
        db.select().from(loans).where(eq(loans.userId, input.userId)),
        db.select().from(payments).where(eq(payments.userId, input.userId)),
        db.select().from(borrowers).where(eq(borrowers.userId, input.userId)),
      ]);

      const totalLoaned = allLoans.reduce((s, l) => s + (l.amount || 0), 0);
      const totalCollected = allPayments.reduce((s, p) => s + (p.amount || 0), 0);
      const activeLoans = allLoans.filter(l => l.status === "active" || l.status === "overdue");
      const totalRemaining = activeLoans.reduce((s, l) => {
        const remaining = (l.monthlyPayment || 0) * ((l.monthsTotal || 0) - (l.monthsPaid || 0));
        return s + remaining;
      }, 0);

      return {
        totalLoaned,
        totalCollected,
        totalRemaining,
        activeLoans: activeLoans.length,
        overdueLoans: allLoans.filter(l => l.status === "overdue").length,
        paidLoans: allLoans.filter(l => l.status === "paid").length,
        borrowerCount: allBorrowers.length,
        totalProfit: totalCollected > totalLoaned ? totalCollected - totalLoaned : 0,
      };
    }),

  // Top borrowers by payment
  topBorrowers: authedQuery
    .input(z.object({ userId: z.string(), limit: z.number().default(5) }))
    .query(async ({ input }) => {
      const db = getDb();
      const allPayments = await db.select().from(payments).where(eq(payments.userId, input.userId));
      const borrowerTotals: Record<string, { name: string; total: number }> = {};
      for (const p of allPayments) {
        if (!borrowerTotals[p.borrowerId]) {
          borrowerTotals[p.borrowerId] = { name: p.borrowerName || "", total: 0 };
        }
        borrowerTotals[p.borrowerId].total += p.amount || 0;
      }
      return Object.values(borrowerTotals)
        .sort((a, b) => b.total - a.total)
        .slice(0, input.limit);
    }),
});
