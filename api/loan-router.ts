import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { loans } from "../db/schema";
import { getDb } from "./queries/connection";
import { eq, and } from "drizzle-orm";

export const loanRouter = createRouter({
  list: publicQuery
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.select().from(loans).where(eq(loans.userId, input.userId));
    }),

  create: publicQuery
    .input(z.object({
      userId: z.string(),
      borrowerId: z.string(),
      borrowerName: z.string(),
      productName: z.string(),
      amount: z.number(),
      monthlyPayment: z.number(),
      lastPayment: z.number(),
      monthsTotal: z.number(),
      startDate: z.string(),
      nextDueDate: z.string(),
      dueDay: z.number(),
      interestRate: z.number().default(0),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(loans).values({
        userId: input.userId,
        borrowerId: input.borrowerId,
        borrowerName: input.borrowerName,
        productName: input.productName,
        amount: input.amount,
        monthlyPayment: input.monthlyPayment,
        lastPayment: input.lastPayment,
        monthsTotal: input.monthsTotal,
        monthsPaid: 0,
        startDate: input.startDate,
        nextDueDate: input.nextDueDate,
        dueDay: input.dueDay,
        interestRate: input.interestRate,
        notes: input.notes || null,
        status: "active",
      });
      return { id: Number(result[0].insertId) };
    }),

  delete: publicQuery
    .input(z.object({ id: z.string(), userId: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(loans).where(
        and(eq(loans.id, Number(input.id)), eq(loans.userId, input.userId))
      );
      return { success: true };
    }),
});
