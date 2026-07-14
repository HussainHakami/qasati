import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { borrowers } from "../db/schema";
import { getDb } from "./queries/connection";
import { eq, and } from "drizzle-orm";

export const borrowerRouter = createRouter({
  list: publicQuery
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.select().from(borrowers).where(eq(borrowers.userId, input.userId));
    }),

  create: publicQuery
    .input(z.object({
      userId: z.string(),
      name: z.string(),
      phone: z.string(),
      idNumber: z.string().optional(),
      address: z.string().optional(),
      rating: z.enum(["trusted", "average", "late"]).default("average"),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(borrowers).values({
        userId: input.userId,
        name: input.name,
        phone: input.phone,
        idNumber: input.idNumber || null,
        address: input.address || null,
        avatar: null,
        rating: input.rating,
        notes: input.notes || null,
      });
      return { id: Number(result[0].insertId) };
    }),

  delete: publicQuery
    .input(z.object({ id: z.string(), userId: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(borrowers).where(
        and(eq(borrowers.id, Number(input.id)), eq(borrowers.userId, input.userId))
      );
      return { success: true };
    }),
});
