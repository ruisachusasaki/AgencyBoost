import {
  initializeApp
} from "./chunk-NCE3UNYU.js";
import "./chunk-DE7YTT24.js";
import "./chunk-MLXNLHMN.js";
import "./chunk-BGP47S4B.js";
import "./chunk-MKQPBRW5.js";
import "./chunk-YEJKCSPA.js";
import "./chunk-RKCHQFS5.js";
import "./chunk-HLZDHAIF.js";
import "./chunk-PQ4E2HEU.js";
import "./chunk-LPGLOMNK.js";
import "./chunk-4MQK3SLY.js";
import "./chunk-R7TIMQIC.js";
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
