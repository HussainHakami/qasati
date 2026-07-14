import { Hono } from "hono";
import { cors } from "hono/cors";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./api/root";
import { db } from "./db/connection";

const app = new Hono();

app.use("*", cors({ origin: "*", allowMethods: ["GET", "POST"], allowHeaders: ["Content-Type", "x-user-id"] }));

app.use("/trpc/*", async (c) => {
  const userId = c.req.header("x-user-id");
  return fetchRequestHandler({
    endpoint: "/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext: () => Promise.resolve({ db, userId }),
  });
});

app.get("/health", (c) => c.json({ ok: true, time: new Date().toISOString() }));

export default app;
