import { authRouter } from "./auth-router";
import { borrowerRouter } from "./borrower-router";
import { loanRouter } from "./loan-router";
import { paymentRouter } from "./payment-router";
import { backupRouter } from "./backup-router";
import { reportRouter } from "./report-router";
import { whatsappRouter } from "./whatsapp-router";
import { userRouter } from "./user-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  borrower: borrowerRouter,
  loan: loanRouter,
  payment: paymentRouter,
  backup: backupRouter,
  report: reportRouter,
  whatsapp: whatsappRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
