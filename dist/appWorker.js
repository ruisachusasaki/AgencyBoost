import {
  initializeApp
} from "./chunk-Z5S77L2D.js";
import "./chunk-DE7YTT24.js";
import "./chunk-2DSUFU7E.js";
import "./chunk-BGP47S4B.js";
import "./chunk-HVWCMIYT.js";
import "./chunk-FUVSLXCF.js";
import "./chunk-RKCHQFS5.js";
import "./chunk-HLZDHAIF.js";
import "./chunk-PQ4E2HEU.js";
import "./chunk-REZ7S6RE.js";
import "./chunk-XQ7M2YTJ.js";
import "./chunk-6MVV6LMJ.js";
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
