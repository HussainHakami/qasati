import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { db } from "../db/connection";

const t = initTRPC.context<{ db: typeof db; userId?: string | null }>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const authedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) throw new Error("Unauthorized");
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});
