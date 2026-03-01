import {
  initializeApp
} from "./chunk-QDHH4DFA.js";
import "./chunk-DE7YTT24.js";
import "./chunk-XQCTUAJE.js";
import "./chunk-BGP47S4B.js";
import "./chunk-YMV4DRJ4.js";
import "./chunk-D2IYK7YY.js";
import "./chunk-RKCHQFS5.js";
import "./chunk-HLZDHAIF.js";
import "./chunk-PQ4E2HEU.js";
import "./chunk-6OAURZ7F.js";
import "./chunk-FTHNYZTW.js";
import "./chunk-ZQT7LNUZ.js";
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
