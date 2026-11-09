// Startar servern på en temporär port och kör hela reservationsflödet. Kör: npm test
const { spawn } = require("node:child_process");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path");
const assert = require("node:assert/strict");
const port = 3919, base = `http://localhost:${port}`;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ll-"));
fs.cpSync(path.join(__dirname, ".."), tmp, { recursive: true, filter: s => !/data|\.env$|node_modules/.test(s) });
const srv = spawn("node", ["server.js"], { cwd: tmp, env: { ...process.env, PORT: port, ADMIN_PASSWORD: "testpassword", ACCESS_CODE: "abc", NODE_NO_WARNINGS: "1", CUTOFF_MINUTES: "0" } });
const J = async (p, body, cookie, method) => {
  const r = await fetch(base + p, { method: method || (body ? "POST" : "GET"), headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { s: r.status, j: await r.json().catch(() => ({})), h: r.headers };
};
(async () => {
  await new Promise(r => setTimeout(r, 1200));
  assert.equal((await J("/api/admin/overview")).s, 401, "admin needs login");
  assert.equal((await J("/api/admin/login", { password: "wrong" })).s, 401);
  const login = await J("/api/admin/login", { password: "testpassword" });
  const cookie = login.h.get("set-cookie").split(";")[0];
  const d = new Date(Date.now() + 3 * 3600e3), t = n => `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
  const early = new Date(); early.setHours(23, 0); const late = new Date(); late.setHours(23, 30);
  assert.equal((await J("/api/admin/listings", { dish: "Soup", qty: 3, price: 30, from: "23:58", to: "23:59", allergens: ["milk"] }, cookie)).s, 400, "safety required");
  assert.equal((await J("/api/admin/listings", { dish: "Soup", qty: 3, price: 30, from: "23:58", to: "23:59", allergens: ["milk"], safety: true }, cookie)).s, 200);
  const L = (await J("/api/listings")).j; assert.equal(L.length, 1); assert.equal(L[0].left, 3);
  const res = (o) => J("/api/reserve", { listingId: L[0].id, name: "Anna", contact: "a@x.se", qty: 2, accessCode: "abc", ack: true, ...o });
  assert.equal((await res({ accessCode: "no" })).s, 403, "access code");
  assert.equal((await res({ ack: false })).s, 400, "ack");
  assert.equal((await res({ qty: 3 })).s, 400, "max per person");
  const ok = await res({}); assert.equal(ok.s, 200); assert.equal(ok.j.total, 60);
  assert.equal((await res({})).j.error, "duplicate");
  assert.equal((await res({ contact: "b@x.se", qty: 2 })).j.error, "soldout", "no overselling");
  assert.equal((await res({ contact: "c@x.se", qty: 1 })).s, 200);
  assert.equal((await J("/api/listings")).j[0].left, 0);
  const mine = (await J("/api/mine", { contact: "a@x.se" })).j; assert.equal(mine[0].code, ok.j.code);
  const ov = (await J("/api/admin/overview", null, cookie)).j; const rid = ov.listings[0].reservations[0].id;
  await J("/api/admin/reservations/" + rid, { status: "collected" }, cookie);
  const ov2 = (await J("/api/admin/overview", null, cookie)).j; assert.equal(ov2.collected, 2); assert.equal(ov2.kg, 0.8);
  console.log("Alla kontroller godkända.");
})().catch(e => { console.error("MISSLYCKADES:", e.message); process.exitCode = 1; }).finally(() => { srv.kill(); fs.rmSync(tmp, { recursive: true, force: true }); });
