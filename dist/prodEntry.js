// server/prodEntry.ts
import { createServer } from "http";
process.env.PROD_ENTRY = "1";
var port = parseInt(process.env.PORT || "5000", 10);
var STARTUP_HTML = `<!DOCTYPE html><html><head><title>AgencyBoost</title><meta http-equiv="refresh" content="3"></head><body><p>Loading...</p></body></html>`;
var expressApp = null;
function handler(req, res) {
  if (expressApp) {
    return expressApp(req, res);
  }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(STARTUP_HTML);
}
var server = createServer(handler);
server.listen({ port, host: "0.0.0.0" }, () => {
  const ts = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${ts} [express] serving on port ${port} (health check ready)`);
  setImmediate(async () => {
    try {
      const mod = await import("./index.js");
      expressApp = mod.getApp();
      await mod.initializeApp(server);
      console.log(
        `${(/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true
        })} [express] \u2705 Application fully initialized`
      );
    } catch (err) {
      console.error("Failed to initialize application:", err);
      process.exit(1);
    }
  });
});
