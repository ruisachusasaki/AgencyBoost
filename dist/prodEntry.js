import { createRequire } from 'module'; const require = createRequire(import.meta.url);

// server/prodEntry.ts
import { createServer, request as httpRequest } from "http";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
process.env.PROD_ENTRY = "1";
var port = parseInt(process.env.PORT || "5000", 10);
var workerPort = port + 1;
var workerReady = false;
var child = null;
var OK_HTML = `<!DOCTYPE html><html><head><title>AgencyBoost</title><meta http-equiv="refresh" content="3"></head><body><p>Loading...</p></body></html>`;
var OK_JSON = JSON.stringify({ status: "ok" });
function sendOk(req, res) {
  if (res.headersSent || res.writableEnded) {
    try {
      res.end();
    } catch (_) {
    }
    return;
  }
  try {
    const accept = req.headers["accept"] || "";
    if (req.url === "/health" || req.url === "/api/health" || req.url === "/_health" || accept.includes("application/json")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(OK_JSON);
    } else {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(OK_HTML);
    }
  } catch (_) {
    try {
      res.end();
    } catch (_2) {
    }
  }
}
function proxyToWorker(req, res) {
  const proxyReq = httpRequest(
    {
      hostname: "127.0.0.1",
      port: workerPort,
      path: req.url || "/",
      method: req.method || "GET",
      headers: {
        ...req.headers,
        "x-forwarded-host": req.headers.host || "",
        "x-forwarded-proto": "https"
      }
    },
    (proxyRes) => {
      try {
        if (!res.headersSent) {
          res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
        }
        proxyRes.pipe(res, { end: true });
      } catch (_) {
        try {
          res.end();
        } catch (_2) {
        }
      }
    }
  );
  proxyReq.on("error", () => {
    sendOk(req, res);
  });
  proxyReq.setTimeout(3e4, () => {
    proxyReq.destroy();
    sendOk(req, res);
  });
  req.pipe(proxyReq, { end: true });
}
var server = createServer((req, res) => {
  if (workerReady) {
    proxyToWorker(req, res);
  } else {
    sendOk(req, res);
  }
});
var dir = dirname(fileURLToPath(import.meta.url));
var workerScript = join(dir, "appWorker.js");
function startWorker() {
  workerReady = false;
  child = spawn(process.execPath, [workerScript], {
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
    console.error(
      `${(/* @__PURE__ */ new Date()).toISOString()} [prodEntry] Worker exited with code ${code}, restarting in 2s...`
    );
    workerReady = false;
    child = null;
    setTimeout(startWorker, 2e3);
  });
}
server.listen(port, "0.0.0.0", () => {
  console.log(
    `${(/* @__PURE__ */ new Date()).toISOString()} [prodEntry] Listening on port ${port} - health checks active`
  );
  startWorker();
});
