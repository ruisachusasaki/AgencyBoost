import { createServer } from "http";
import type { IncomingMessage, ServerResponse } from "http";

process.env.PROD_ENTRY = "1";

const port = parseInt(process.env.PORT || "5000", 10);

const STARTUP_HTML = `<!DOCTYPE html><html><head><title>AgencyBoost</title><meta http-equiv="refresh" content="3"></head><body><p>Loading...</p></body></html>`;

let expressApp: any = null;

function handler(req: IncomingMessage, res: ServerResponse) {
  if (expressApp) {
    return expressApp(req, res);
  }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(STARTUP_HTML);
}

const server = createServer(handler);

server.listen({ port, host: "0.0.0.0" }, () => {
  const ts = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${ts} [express] serving on port ${port} (health check ready)`);

  setImmediate(async () => {
    try {
      const mod = await import("./index.js");
      expressApp = mod.getApp();
      await mod.initializeApp(server);
      console.log(
        `${new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })} [express] ✅ Application fully initialized`
      );
    } catch (err) {
      console.error("Failed to initialize application:", err);
      process.exit(1);
    }
  });
});
