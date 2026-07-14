import type { Plugin } from "vite";
import type { IncomingMessage } from "http";
import app from "./server";

function getRawBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

export function trpcPlugin(): Plugin {
  return {
    name: "trpc-server",
    configureServer(server) {
      server.middlewares.use("/trpc", async (req, res, _next) => {
        const url = new URL(req.url || "/", `http://${req.headers.host}`);
        const bodyData = req.method !== "GET" && req.method !== "HEAD" ? await getRawBody(req) : undefined;
        const request = new Request(url.toString(), {
          method: req.method,
          headers: new Headers(Object.entries(req.headers).map(([k, v]) => [k, String(v)])),
          body: bodyData,
        });
        const response = await app.fetch(request);
        res.statusCode = response.status;
        response.headers.forEach((v, k) => res.setHeader(k, v));
        res.end(await response.text());
      });
      server.middlewares.use("/health", async (_req, res) => {
        res.end(JSON.stringify({ ok: true }));
      });
    },
  };
}
