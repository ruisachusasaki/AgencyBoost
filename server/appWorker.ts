import { initializeApp, getApp } from "./index.js";

const port = parseInt(process.env.PORT || '5001', 10);

async function start() {
  await initializeApp();
  
  if (process.send) {
    process.send("ready");
  }
}

start().catch((err) => {
  console.error("Worker failed to start:", err);
  process.exit(1);
});
