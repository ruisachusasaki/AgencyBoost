import { createServer } from "http";

process.env.PROD_ENTRY = "1";

const port = parseInt(process.env.PORT || '5000', 10);

let appHandler: any = null;

const server = createServer((req, res) => {
  if (!appHandler) {
    if (req.url === '/' || req.url === '/health' || req.url === '/api/health' || req.url === '/_health') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<!DOCTYPE html><html><body>OK</body></html>');
      return;
    }
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'starting' }));
    return;
  }
  appHandler(req, res);
});

server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
  const ts = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });
  console.log(`${ts} [express] serving on port ${port} (health check ready)`);

  setTimeout(() => {
    import("./index.js").then((mod) => {
      if (mod && mod.initializeApp) {
        mod.initializeApp(server).then(() => {
          appHandler = mod.getApp();
          console.log(`${new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true })} [express] ✅ Application fully initialized`);
        });
      }
    }).catch(err => {
      console.error("Failed to load application:", err);
    });
  }, 0);
});
