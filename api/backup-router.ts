import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { borrowers, loans, payments } from "../db/schema";
import { eq } from "drizzle-orm";

export const backupRouter = createRouter({
  // Export all user data as JSON
  export: authedQuery
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [b, l, p] = await Promise.all([
        db.select().from(borrowers).where(eq(borrowers.userId, input.userId)),
        db.select().from(loans).where(eq(loans.userId, input.userId)),
        db.select().from(payments).where(eq(payments.userId, input.userId)),
      ]);
      return {
        version: "2.0",
        app: "qasati-lender",
        exportDate: new Date().toISOString(),
        data: { borrowers: b, loans: l, payments: p },
      };
    }),

  // Import data (merge with existing)
  import: authedQuery
    .input(z.object({
      userId: z.string(),
      data: z.object({
        borrowers: z.array(z.any()).optional(),
        loans: z.array(z.any()).optional(),
        payments: z.array(z.any()).optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { borrowers: bList, loans: lList, payments: pList } = input.data;

      let importedB = 0, importedL = 0, importedP = 0;

      if (bList && bList.length > 0) {
        for (const b of bList) {
          await db.insert(borrowers).values({
            userId: input.userId,
            name: b.name || "",
            phone: b.phone || "",
            idNumber: b.idNumber || null,
            address: b.address || null,
            avatar: b.avatar || null,
            rating: b.rating || "average",
            notes: b.notes || null,
          });
          importedB++;
        }
      }

      if (lList && lList.length > 0) {
        for (const l of lList) {
          await db.insert(loans).values({
            userId: input.userId,
            borrowerId: l.borrowerId || "",
            borrowerName: l.borrowerName || "",
            productName: l.productName || "",
            amount: l.amount || 0,
            monthlyPayment: l.monthlyPayment || 0,
            lastPayment: l.lastPayment || 0,
            monthsTotal: l.monthsTotal || 0,
            monthsPaid: l.monthsPaid || 0,
            startDate: l.startDate || "",
            nextDueDate: l.nextDueDate || "",
            dueDay: l.dueDay || 1,
            interestRate: l.interestRate || 0,
            status: l.status || "active",
            notes: l.notes || null,
          });
          importedL++;
        }
      }

      if (pList && pList.length > 0) {
        for (const p of pList) {
          await db.insert(payments).values({
            userId: input.userId,
            loanId: p.loanId || "",
            borrowerId: p.borrowerId || "",
            borrowerName: p.borrowerName || "",
            amount: p.amount || 0,
            method: p.method || "cash",
            date: p.date || new Date().toISOString().split("T")[0],
            notes: p.notes || null,
          });
          importedP++;
        }
      }

      return { importedB, importedL, importedP };
    }),

  // Get backup history
  history: authedQuery
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [bCount, lCount, pCount] = await Promise.all([
        db.select({ count: { $count: borrowers.id } }).from(borrowers).where(eq(borrowers.userId, input.userId)),
        db.select({ count: { $count: loans.id } }).from(loans).where(eq(loans.userId, input.userId)),
        db.select({ count: { $count: payments.id } }).from(payments).where(eq(payments.userId, input.userId)),
      ]);
      return {
        borrowers: bCount[0]?.count || 0,
        loans: lCount[0]?.count || 0,
        payments: pCount[0]?.count || 0,
        lastBackup: new Date().toISOString(),
      };
    }),
});
