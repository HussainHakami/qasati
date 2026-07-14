import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { router, publicProcedure } from "./trpc";
import { db } from "../db/connection";
import { borrowers, loans, payments, notifications, messageTemplates, autoReminders } from "../db/schema";

export const appRouter = router({
  borrower: router({
    list: publicProcedure.input(z.object({ userId: z.string() })).query(async ({ input }) => {
      return db.select().from(borrowers).where(eq(borrowers.userId, input.userId));
    }),
    create: publicProcedure.input(z.object({
      userId: z.string(), name: z.string(), phone: z.string(),
      idNumber: z.string().optional(), address: z.string().optional(),
      rating: z.enum(["trusted", "average", "late"]).optional(), notes: z.string().optional(),
    })).mutation(async ({ input }) => {
      const id = `b${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const result = await db.insert(borrowers).values({ ...input, id }).returning();
      return result[0];
    }),
    update: publicProcedure.input(z.object({
      id: z.string(), userId: z.string(),
      data: z.object({ name: z.string().optional(), phone: z.string().optional(), rating: z.enum(["trusted", "average", "late"]).optional(), idNumber: z.string().optional(), address: z.string().optional(), notes: z.string().optional() }).passthrough(),
    })).mutation(async ({ input }) => {
      await db.update(borrowers).set(input.data).where(and(eq(borrowers.id, input.id), eq(borrowers.userId, input.userId)));
      return { success: true };
    }),
    delete: publicProcedure.input(z.object({ id: z.string(), userId: z.string() })).mutation(async ({ input }) => {
      await db.delete(borrowers).where(and(eq(borrowers.id, input.id), eq(borrowers.userId, input.userId)));
      return { success: true };
    }),
  }),

  loan: router({
    list: publicProcedure.input(z.object({ userId: z.string() })).query(async ({ input }) => {
      return db.select().from(loans).where(eq(loans.userId, input.userId)).orderBy(desc(loans.createdAt));
    }),
    create: publicProcedure.input(z.object({
      userId: z.string(), borrowerId: z.string(), borrowerName: z.string(),
      productName: z.string(), amount: z.number(), monthlyPayment: z.number(),
      lastPayment: z.number(), monthsTotal: z.number(), startDate: z.string(),
      nextDueDate: z.string(), dueDay: z.number(), interestRate: z.number().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ input }) => {
      const id = `l${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const result = await db.insert(loans).values({ ...input, id, status: "active" as const, monthsPaid: 0 }).returning();
      return result[0];
    }),
    update: publicProcedure.input(z.object({
      id: z.string(), userId: z.string(), data: z.record(z.string(), z.any()),
    })).mutation(async ({ input }) => {
      await db.update(loans).set(input.data as any).where(and(eq(loans.id, input.id), eq(loans.userId, input.userId)));
      return { success: true };
    }),
    delete: publicProcedure.input(z.object({ id: z.string(), userId: z.string() })).mutation(async ({ input }) => {
      await db.delete(loans).where(and(eq(loans.id, input.id), eq(loans.userId, input.userId)));
      return { success: true };
    }),
  }),

  payment: router({
    list: publicProcedure.input(z.object({ userId: z.string() })).query(async ({ input }) => {
      return db.select().from(payments).where(eq(payments.userId, input.userId)).orderBy(desc(payments.createdAt));
    }),
    create: publicProcedure.input(z.object({
      userId: z.string(), loanId: z.string(), borrowerId: z.string(),
      borrowerName: z.string(), amount: z.number(), method: z.enum(["cash", "transfer", "bank"]).optional(),
      date: z.string(), notes: z.string().optional(),
    })).mutation(async ({ input }) => {
      const id = `p${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const result = await db.insert(payments).values({ ...input, id }).returning();
      // Update loan
      const loan = await db.select().from(loans).where(eq(loans.id, input.loanId));
      if (loan[0]) {
        const newMonthsPaid = loan[0].monthsPaid + 1;
        await db.update(loans).set({
          monthsPaid: newMonthsPaid,
          status: newMonthsPaid >= loan[0].monthsTotal ? "paid" : "active",
        }).where(eq(loans.id, input.loanId));
      }
      return result[0];
    }),
    delete: publicProcedure.input(z.object({ id: z.string(), userId: z.string() })).mutation(async ({ input }) => {
      await db.delete(payments).where(and(eq(payments.id, input.id), eq(payments.userId, input.userId)));
      return { success: true };
    }),
  }),

  notification: router({
    list: publicProcedure.input(z.object({ userId: z.string() })).query(async ({ input }) => {
      return db.select().from(notifications).where(eq(notifications.userId, input.userId)).orderBy(desc(notifications.createdAt));
    }),
    markRead: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
      await db.update(notifications).set({ read: true }).where(eq(notifications.id, input.id));
      return { success: true };
    }),
  }),

  template: router({
    list: publicProcedure.input(z.object({ userId: z.string() })).query(async ({ input }) => {
      return db.select().from(messageTemplates).where(eq(messageTemplates.userId, input.userId));
    }),
    create: publicProcedure.input(z.object({ userId: z.string(), name: z.string(), subject: z.string(), body: z.string() })).mutation(async ({ input }) => {
      const id = `tmpl${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const result = await db.insert(messageTemplates).values({ ...input, id }).returning();
      return result[0];
    }),
    update: publicProcedure.input(z.object({ id: z.string(), data: z.record(z.string(), z.any()) })).mutation(async ({ input }) => {
      await db.update(messageTemplates).set(input.data as any).where(eq(messageTemplates.id, input.id));
      return { success: true };
    }),
    delete: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
      await db.delete(messageTemplates).where(eq(messageTemplates.id, input.id));
      return { success: true };
    }),
  }),

  reminder: router({
    get: publicProcedure.input(z.object({ userId: z.string() })).query(async ({ input }) => {
      const result = await db.select().from(autoReminders).where(eq(autoReminders.userId, input.userId));
      return result[0] ?? null;
    }),
    update: publicProcedure.input(z.object({
      userId: z.string(), enabled: z.boolean().optional(),
      daysBefore: z.number().optional(), templateId: z.string().optional(),
      whatsappApiKey: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { userId, ...data } = input;
      const existing = await db.select().from(autoReminders).where(eq(autoReminders.userId, userId));
      if (existing.length === 0) {
        const id = `ar${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        await db.insert(autoReminders).values({ id, userId, enabled: data.enabled ?? false, daysBefore: data.daysBefore ?? 1, templateId: data.templateId ?? null, whatsappApiKey: data.whatsappApiKey ?? null });
      } else {
        await db.update(autoReminders).set(data).where(eq(autoReminders.userId, userId));
      }
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
