import {
  initializeApp
} from "./chunk-33L5JMFH.js";
import "./chunk-DE7YTT24.js";
import "./chunk-3WUYI2M4.js";
import "./chunk-BGP47S4B.js";
import "./chunk-OGJ6IOK6.js";
import "./chunk-DOA47B6D.js";
import "./chunk-RKCHQFS5.js";
import "./chunk-HLZDHAIF.js";
import "./chunk-PQ4E2HEU.js";
import "./chunk-IP5H7FGN.js";
import "./chunk-7Y6UFD5W.js";
import "./chunk-M4JPHEPD.js";
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
