/**
 * Phase 1.3 — live Express app: success + error responses use JSON envelope (no DB).
 */
import assert from "node:assert/strict";
import process from "node:process";
import request from "supertest";
import app from "../src/app.js"; // cwd: server/

async function main() {
  const h = await request(app).get("/api/v1/health");
  assert.equal(h.status, 200);
  assert.equal(h.body?.success, true);
  assert.ok(Object.prototype.hasOwnProperty.call(h.body || {}, "data"));

  const nf = await request(app).get("/api/v1/__contract_missing_route__/xyz");
  assert.equal(nf.status, 404);
  assert.equal(nf.body?.success, false);
  assert.ok(typeof nf.body?.message === "string");

  console.log("Phase 1 HTTP API envelope smoke PASSED");
}

main().catch((e) => {
  console.error("Phase 1 HTTP API envelope smoke FAILED:", e);
  process.exit(1);
});
