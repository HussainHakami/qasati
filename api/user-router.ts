import { z } from "zod";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export const userRouter = createRouter({
  // List all users (admin only)
  list: adminQuery.query(async () => {
    const db = getDb();
    return db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      lastSignInAt: users.lastSignInAt,
    }).from(users);
  }),

  // Update user role (admin only)
  updateRole: adminQuery
    .input(z.object({
      userId: z.number(),
      role: z.enum(["user", "admin"]),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(users)
        .set({ role: input.role })
        .where(eq(users.id, input.userId));
      return { success: true };
    }),

  // Get current user stats
  stats: adminQuery.query(async () => {
    const db = getDb();
    const allUsers = await db.select().from(users);
    return {
      totalUsers: allUsers.length,
      adminCount: allUsers.filter(u => u.role === "admin").length,
      userCount: allUsers.filter(u => u.role === "user").length,
      recentUsers: allUsers
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10),
    };
  }),
});
