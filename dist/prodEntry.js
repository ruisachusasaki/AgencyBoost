// server/prodEntry.ts
import { createServer, request as httpRequest } from "http";
import { fork } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
process.env.PROD_ENTRY = "1";
var port = parseInt(process.env.PORT || "5000", 10);
var appPort = port + 1;
var appReady = false;
function proxyRequest(req, res) {
  const proxyReq = httpRequest(
    {
      hostname: "127.0.0.1",
      port: appPort,
      path: req.url,
      method: req.method,
      headers: req.headers
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    }
  );
  proxyReq.on("error", () => {
    res.writeHead(503, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "starting" }));
  });
  req.pipe(proxyReq, { end: true });
}
var server = createServer((req, res) => {
  if (appReady) {
    proxyRequest(req, res);
    return;
  }
  const url = req.url?.split("?")[0];
  if (url === "/" || url === "/health" || url === "/api/health" || url === "/_health") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<!DOCTYPE html><html><body>OK</body></html>");
    return;
  }
  res.writeHead(503, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: "starting" }));
});
server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
  const ts = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${ts} [express] serving on port ${port} (health check ready)`);
  const dir = dirname(fileURLToPath(import.meta.url));
  const child = fork(join(dir, "appWorker.js"), [], {
    env: { ...process.env, PORT: String(appPort), NODE_ENV: "production", PROD_ENTRY: "1" },
    stdio: ["pipe", "inherit", "inherit", "ipc"]
  });
  child.on("message", (msg) => {
    if (msg === "ready") {
      appReady = true;
      const readyTs = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      });
      console.log(`${readyTs} [express] \u2705 Application fully initialized, proxying requests`);
    }
  });
  child.on("exit", (code) => {
    console.error(`Application worker exited with code ${code}, restarting...`);
    process.exit(1);
  });
});
