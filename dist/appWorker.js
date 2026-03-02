import {
  initializeApp
} from "./chunk-CGPUOXD6.js";
import "./chunk-EEKLC7FT.js";
import "./chunk-DE7YTT24.js";
import "./chunk-46WYM26U.js";
import "./chunk-BGP47S4B.js";
import "./chunk-JDCZN476.js";
import "./chunk-WUZZVJDA.js";
import "./chunk-RKCHQFS5.js";
import "./chunk-HLZDHAIF.js";
import "./chunk-PQ4E2HEU.js";
import "./chunk-642RPZLH.js";
import "./chunk-ZB5IQ3XV.js";
import "./chunk-AOJ6JAV4.js";
import "./chunk-MLKGABMK.js";

// server/appWorker.ts
var port = parseInt(process.env.PORT || "5001", 10);
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
