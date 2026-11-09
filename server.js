// Lunchlåda: sälj överbliven skolmat i stället för att slänga den.
// Inga beroenden. Kräver Node.js 22.5 eller senare.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");

// ---------- Inställningar (allt kommer från .env / miljövariabler) ----------
try { // liten .env-läsare så att man bara behöver redigera en textfil
  for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}
const E = process.env;
const cfg = {
  port: +E.PORT || 3000,
  school: E.SCHOOL_NAME || "Vår skola",
  lang: E.LANGUAGE === "en" ? "en" : "sv",
  currency: E.CURRENCY || "kr",
  adminPassword: E.ADMIN_PASSWORD || "",
  accessCode: E.ACCESS_CODE || "",
  paymentNote: E.PAYMENT_NOTE || "",
  eligibility: E.ELIGIBILITY_TEXT || "",
  cutoff: E.CUTOFF_MINUTES === undefined ? 30 : +E.CUTOFF_MINUTES,
  maxPerPerson: +E.MAX_PER_PERSON || 2,
  kgPerPortion: +E.KG_PER_PORTION || 0.4,
  retentionDays: +E.RETENTION_DAYS || 30,
};
if (cfg.adminPassword.length < 8) {
  console.error("Ange ADMIN_PASSWORD (minst 8 tecken) i filen .env. Se README.md.");
  process.exit(1);
}

// ---------- Databas ----------
fs.mkdirSync(path.join(__dirname, "data"), { recursive: true });
const db = new DatabaseSync(path.join(__dirname, "data", "lunchlada.db"));
db.exec(`
CREATE TABLE IF NOT EXISTS listings(
  id INTEGER PRIMARY KEY, date TEXT NOT NULL, dish TEXT NOT NULL, qty INTEGER NOT NULL,
  price INTEGER NOT NULL, from_t TEXT NOT NULL, to_t TEXT NOT NULL, allergens TEXT NOT NULL DEFAULT '[]',
  created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS reservations(
  id INTEGER PRIMARY KEY, listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  name TEXT NOT NULL, contact TEXT NOT NULL, qty INTEGER NOT NULL, price INTEGER NOT NULL,
  code TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'reserved', created INTEGER NOT NULL,
  UNIQUE(listing_id, contact));
PRAGMA foreign_keys=ON;`);

const secretFile = path.join(__dirname, "data", "secret");
if (!fs.existsSync(secretFile)) fs.writeFileSync(secretFile, crypto.randomBytes(32).toString("hex"), { mode: 0o600 });
const SECRET = fs.readFileSync(secretFile, "utf8");

// ---------- Hjälpfunktioner ----------
const pad = n => String(n).padStart(2, "0");
const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
const mins = t => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const isClosed = l => nowMin() >= mins(l.from_t) - cfg.cutoff;
const ALLERGENS = ["gluten","crustaceans","eggs","fish","peanuts","soy","milk","nuts","celery","mustard","sesame","sulphites","lupin","molluscs"];
const sign = v => crypto.createHmac("sha256", SECRET).update(v).digest("hex");
const safeEq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const hits = new Map(); // enkel begränsning av antal försök (i minnet)
const limited = (ip, key, max, windowMs) => {
  const k = key + ip, now = Date.now(), arr = (hits.get(k) || []).filter(t => now - t < windowMs);
  arr.push(now); hits.set(k, arr); return arr.length > max;
};
const isAdmin = req => {
  const m = /(?:^|;\s*)admin=([^;]+)/.exec(req.headers.cookie || "");
  if (!m) return false;
  const [exp, sig] = decodeURIComponent(m[1]).split(".");
  return +exp > Date.now() && safeEq(sig || "", sign("admin" + exp));
};
const send = (res, code, body, type = "application/json; charset=utf-8", extra = {}) => {
  res.writeHead(code, { "Content-Type": type, "X-Content-Type-Options": "nosniff", "Referrer-Policy": "same-origin", "Cache-Control": "no-store", ...extra });
  res.end(type.startsWith("application/json") ? JSON.stringify(body) : body);
};
const readJson = req => new Promise((ok, fail) => {
  let s = ""; req.on("data", c => { s += c; if (s.length > 20000) { req.destroy(); fail(new Error("too big")); } });
  req.on("end", () => { try { ok(s ? JSON.parse(s) : {}); } catch (e) { fail(e); } });
});
const clean = (s, n) => String(s ?? "").trim().replace(/\s+/g, " ").slice(0, n);
const taken = id => db.prepare("SELECT COALESCE(SUM(qty),0) n FROM reservations WHERE listing_id=? AND status!='cancelled'").get(id).n;
const listingView = l => ({ id: l.id, dish: l.dish, qty: l.qty, price: l.price, from: l.from_t, to: l.to_t,
  allergens: JSON.parse(l.allergens), left: l.qty - taken(l.id), closed: isClosed(l) });

// ---------- Vägar (API) ----------
async function api(req, res, url) {
  const ip = req.socket.remoteAddress;
  const route = `${req.method} ${url.pathname}`;

  if (route === "GET /api/config") return send(res, 200, {
    school: cfg.school, lang: cfg.lang, currency: cfg.currency, needsAccessCode: !!cfg.accessCode,
    paymentNote: cfg.paymentNote, eligibility: cfg.eligibility,
    cutoff: cfg.cutoff, maxPerPerson: cfg.maxPerPerson, allergens: ALLERGENS, admin: isAdmin(req) });

  if (route === "GET /api/listings") {
    const rows = db.prepare("SELECT * FROM listings WHERE date=? ORDER BY from_t").all(today());
    return send(res, 200, rows.map(listingView));
  }

  if (route === "POST /api/reserve") {
    if (limited(ip, "r", 15, 600000)) return send(res, 429, { error: "rate" });
    const b = await readJson(req);
    const name = clean(b.name, 60), contact = clean(b.contact, 80).toLowerCase(), qty = Math.floor(+b.qty);
    if (!name || !contact || !(qty >= 1 && qty <= cfg.maxPerPerson)) return send(res, 400, { error: "invalid" });
    if (!b.ack) return send(res, 400, { error: "ack" });
    if (cfg.accessCode && !safeEq(clean(b.accessCode, 60), cfg.accessCode)) return send(res, 403, { error: "access" });
    const l = db.prepare("SELECT * FROM listings WHERE id=? AND date=?").get(+b.listingId, today());
    if (!l) return send(res, 404, { error: "gone" });
    if (isClosed(l)) return send(res, 409, { error: "closed" });
    const code = String(crypto.randomInt(1000, 10000));
    try { // SQLite skriver en i taget, så det går inte att sälja fler lådor än som finns
      db.exec("BEGIN IMMEDIATE");
      if (db.prepare("SELECT 1 FROM reservations WHERE listing_id=? AND contact=? AND status!='cancelled'").get(l.id, contact)) { db.exec("ROLLBACK"); return send(res, 409, { error: "duplicate" }); }
      db.prepare("DELETE FROM reservations WHERE listing_id=? AND contact=? AND status='cancelled'").run(l.id, contact);
      if (taken(l.id) + qty > l.qty) { db.exec("ROLLBACK"); return send(res, 409, { error: "soldout" }); }
      db.prepare("INSERT INTO reservations(listing_id,name,contact,qty,price,code,created) VALUES(?,?,?,?,?,?,?)")
        .run(l.id, name, contact, qty, l.price, code, Date.now());
      db.exec("COMMIT");
    } catch (e) {
      try { db.exec("ROLLBACK"); } catch {}
      return send(res, 409, { error: /UNIQUE/.test(String(e)) ? "duplicate" : "failed" });
    }
    return send(res, 200, { code, total: l.price * qty });
  }

  if (route === "POST /api/mine") {
    if (limited(ip, "m", 30, 600000)) return send(res, 429, { error: "rate" });
    const b = await readJson(req), contact = clean(b.contact, 80).toLowerCase();
    const rows = db.prepare(`SELECT r.code,r.qty,r.status,l.dish,l.from_t,l.to_t FROM reservations r JOIN listings l ON l.id=r.listing_id
      WHERE r.contact=? AND l.date=? AND r.status!='cancelled'`).all(contact, today());
    return send(res, 200, rows);
  }

  if (route === "POST /api/admin/login") {
    if (limited(ip, "l", 8, 600000)) return send(res, 429, { error: "rate" });
    const b = await readJson(req);
    if (!safeEq(String(b.password || ""), cfg.adminPassword)) return send(res, 401, { error: "login" });
    const exp = Date.now() + 12 * 3600 * 1000;
    return send(res, 200, { ok: true }, undefined, { "Set-Cookie": `admin=${encodeURIComponent(exp + "." + sign("admin" + exp))}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${req.headers["x-forwarded-proto"] === "https" ? "; Secure" : ""}` });
  }
  if (route === "POST /api/admin/logout")
    return send(res, 200, { ok: true }, undefined, { "Set-Cookie": "admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0" });

  if (url.pathname.startsWith("/api/admin/")) {
    if (!isAdmin(req)) return send(res, 401, { error: "login" });
    if (route === "GET /api/admin/overview") {
      const ls = db.prepare("SELECT * FROM listings WHERE date=? ORDER BY from_t").all(today()).map(l => ({
        ...listingView(l), reservations: db.prepare("SELECT id,name,contact,qty,code,status FROM reservations WHERE listing_id=? AND status!='cancelled' ORDER BY id").all(l.id) }));
      const s = db.prepare("SELECT COALESCE(SUM(qty),0) n, COALESCE(SUM(qty*price),0) rev FROM reservations WHERE status='collected'").get();
      return send(res, 200, { listings: ls, collected: s.n, revenue: s.rev, kg: +(s.n * cfg.kgPerPortion).toFixed(1) });
    }
    if (route === "POST /api/admin/listings") {
      const b = await readJson(req);
      const dish = clean(b.dish, 100), qty = Math.floor(+b.qty), price = Math.floor(+b.price);
      const from = /^\d\d:\d\d$/.test(b.from) ? b.from : "", to = /^\d\d:\d\d$/.test(b.to) ? b.to : "";
      const al = (Array.isArray(b.allergens) ? b.allergens : []).filter(a => ALLERGENS.includes(a));
      if (!dish || !(qty > 0 && qty <= 500) || !(price >= 0 && price <= 1000) || !from || !to || mins(to) <= mins(from)) return send(res, 400, { error: "invalid" });
      if (!b.safety) return send(res, 400, { error: "safety" });
      db.prepare("INSERT INTO listings(date,dish,qty,price,from_t,to_t,allergens,created) VALUES(?,?,?,?,?,?,?,?)")
        .run(today(), dish, qty, price, from, to, JSON.stringify(al), Date.now());
      return send(res, 200, { ok: true });
    }
    let m = /^\/api\/admin\/listings\/(\d+)$/.exec(url.pathname);
    if (m && req.method === "DELETE") { db.prepare("DELETE FROM listings WHERE id=?").run(+m[1]); return send(res, 200, { ok: true }); }
    m = /^\/api\/admin\/reservations\/(\d+)$/.exec(url.pathname);
    if (m && req.method === "POST") {
      const b = await readJson(req);
      if (!["reserved", "collected", "cancelled"].includes(b.status)) return send(res, 400, { error: "invalid" });
      db.prepare("UPDATE reservations SET status=? WHERE id=?").run(b.status, +m[1]);
      return send(res, 200, { ok: true });
    }
    if (route === "GET /api/admin/export.csv") {
      const rows = db.prepare(`SELECT l.date,l.dish,r.qty,r.price,r.status FROM reservations r JOIN listings l ON l.id=r.listing_id ORDER BY l.date,l.id`).all();
      const sv = { reserved: "reserverad", paid: "betald", collected: "utlämnad", cancelled: "avbokad" };
      const csv = "datum,maträtt,portioner,pris_per_portion,status\n" + rows.map(r => [r.date, `"${r.dish.replace(/"/g, '""')}"`, r.qty, r.price, sv[r.status] || r.status].join(",")).join("\n");
      return send(res, 200, csv, "text/csv; charset=utf-8", { "Content-Disposition": "attachment; filename=lunchlada.csv" });
    }
  }
  return send(res, 404, { error: "not found" });
}

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml" };
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://x");
    if (url.pathname.startsWith("/api/")) return await api(req, res, url);
    const file = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    const full = path.join(__dirname, "public", path.normalize(file));
    if (!full.startsWith(path.join(__dirname, "public")) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) return send(res, 404, "Not found", "text/plain");
    send(res, 200, fs.readFileSync(full), TYPES[path.extname(full)] || "application/octet-stream", { "Cache-Control": "no-cache" });
  } catch (e) { console.error(e); send(res, 500, { error: "server" }); }
}).listen(cfg.port, () => console.log(`Lunchlåda körs på http://localhost:${cfg.port}`));

// ---------- Integritet: radera namn och kontaktuppgifter efter RETENTION_DAYS, behåll siffrorna ----------
const purge = () => db.prepare(`UPDATE reservations SET name='', contact='deleted-'||id WHERE created < ? AND name!=''`)
  .run(Date.now() - cfg.retentionDays * 86400000);
purge(); setInterval(purge, 6 * 3600 * 1000);
