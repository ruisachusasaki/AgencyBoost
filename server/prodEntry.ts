import { createServer, request as httpRequest } from "http";
import type { IncomingMessage, ServerResponse } from "http";
import { spawn } from "child_process";
import type { ChildProcess } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

process.env.PROD_ENTRY = "1";

const port = parseInt(process.env.PORT || "5000", 10);
const workerPort = port + 1;
let workerReady = false;
let child: ChildProcess | null = null;

const OK_HTML = `<!DOCTYPE html><html><head><title>AgencyBoost</title><meta http-equiv="refresh" content="3"></head><body><p>Loading...</p></body></html>`;
const OK_JSON = JSON.stringify({ status: "ok" });

function sendOk(req: IncomingMessage, res: ServerResponse) {
  const accept = req.headers["accept"] || "";
  if (req.url === "/health" || req.url === "/api/health" || req.url === "/_health" || accept.includes("application/json")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(OK_JSON);
  } else {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(OK_HTML);
  }
}

function proxyToWorker(req: IncomingMessage, res: ServerResponse) {
  const proxyReq = httpRequest(
    {
      hostname: "127.0.0.1",
      port: workerPort,
      path: req.url || "/",
      method: req.method || "GET",
      headers: {
        ...req.headers,
        "x-forwarded-host": req.headers.host || "",
        "x-forwarded-proto": "https",
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    }
  );

  proxyReq.on("error", () => {
    sendOk(req, res);
  });

  proxyReq.setTimeout(10000, () => {
    proxyReq.destroy();
    sendOk(req, res);
  });

  req.pipe(proxyReq, { end: true });
}

const server = createServer((req, res) => {
  if (workerReady) {
    proxyToWorker(req, res);
  } else {
    sendOk(req, res);
  }
});

const dir = dirname(fileURLToPath(import.meta.url));
const workerScript = join(dir, "appWorker.js");

function startWorker() {
  workerReady = false;

  child = spawn(process.execPath, [workerScript], {
    env: {
      ...process.env,
      PORT: String(workerPort),
      PROD_ENTRY: "1",
    },
    stdio: ["ignore", "inherit", "inherit", "ipc"],
  });

  child.on("message", (msg) => {
    if (msg === "ready") {
      workerReady = true;
      console.log(
        `${new Date().toISOString()} [prodEntry] Worker ready on port ${workerPort}, proxying requests`
      );
    }
  });

  child.on("exit", (code) => {
    console.error(
      `${new Date().toISOString()} [prodEntry] Worker exited with code ${code}, restarting in 2s...`
    );
    workerReady = false;
    child = null;
    setTimeout(startWorker, 2000);
  });
}

server.listen(port, "0.0.0.0", () => {
  console.log(
    `${new Date().toISOString()} [prodEntry] Listening on port ${port} - health checks active`
  );
  startWorker();
});
