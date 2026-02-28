// server/prodEntry.ts
import { createServer, request as httpRequest } from "http";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
process.env.PROD_ENTRY = "1";
var port = parseInt(process.env.PORT || "5000", 10);
var workerPort = port + 1;
var workerReady = false;
var OK_HTML = `<!DOCTYPE html><html><head><title>AgencyBoost</title><meta http-equiv="refresh" content="3"></head><body><p>Loading...</p></body></html>`;
function sendOk(res) {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(OK_HTML);
}
function proxyToWorker(req, res) {
  const opts = {
    hostname: "127.0.0.1",
    port: workerPort,
    path: req.url || "/",
    method: req.method || "GET",
    headers: { ...req.headers, host: `127.0.0.1:${workerPort}` }
  };
  const proxyReq = httpRequest(opts, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });
  proxyReq.on("error", () => {
    sendOk(res);
  });
  proxyReq.setTimeout(5e3, () => {
    proxyReq.destroy();
    sendOk(res);
  });
  req.pipe(proxyReq, { end: true });
}
var server = createServer((req, res) => {
  if (workerReady) {
    proxyToWorker(req, res);
  } else {
    sendOk(res);
  }
});
server.listen(port, "0.0.0.0", () => {
  console.log(
    `${(/* @__PURE__ */ new Date()).toISOString()} [prodEntry] Listening on port ${port} - health checks active`
  );
  const dir = dirname(fileURLToPath(import.meta.url));
  const workerScript = join(dir, "appWorker.js");
  const child = spawn(process.execPath, [workerScript], {
    env: {
      ...process.env,
      PORT: String(workerPort),
      PROD_ENTRY: "1"
    },
    stdio: ["ignore", "inherit", "inherit", "ipc"]
  });
  child.on("message", (msg) => {
    if (msg === "ready") {
      workerReady = true;
      console.log(
        `${(/* @__PURE__ */ new Date()).toISOString()} [prodEntry] Worker ready on port ${workerPort}, proxying requests`
      );
    }
  });
  child.on("exit", (code) => {
    console.error(`[prodEntry] Worker exited with code ${code}, shutting down`);
    process.exit(1);
  });
});
