import {
  initializeApp
} from "./chunk-D4E7GVBE.js";
import "./chunk-DE7YTT24.js";
import "./chunk-XGULHHIG.js";
import "./chunk-BGP47S4B.js";
import "./chunk-J7LMZFT5.js";
import "./chunk-CCJIO6G5.js";
import "./chunk-RKCHQFS5.js";
import "./chunk-HLZDHAIF.js";
import "./chunk-PQ4E2HEU.js";
import "./chunk-PURZOVFD.js";
import "./chunk-A2LSYPNF.js";
import "./chunk-OV3OKPTG.js";
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
