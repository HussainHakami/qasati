import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { payments } from "../db/schema";
import { getDb } from "./queries/connection";
import { eq } from "drizzle-orm";

export const paymentRouter = createRouter({
  list: publicQuery
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.select().from(payments).where(eq(payments.userId, input.userId));
    }),

  create: publicQuery
    .input(z.object({
      userId: z.string(),
      loanId: z.string(),
      borrowerId: z.string(),
      borrowerName: z.string(),
      amount: z.number(),
      method: z.enum(["cash", "transfer", "bank"]).default("cash"),
      date: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(payments).values({
        userId: input.userId,
        loanId: input.loanId,
        borrowerId: input.borrowerId,
        borrowerName: input.borrowerName,
        amount: input.amount,
        method: input.method,
        date: input.date,
        notes: input.notes || null,
      });
      return { id: Number(result[0].insertId) };
    }),
});
