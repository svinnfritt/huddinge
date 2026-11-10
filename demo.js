// Lunchlåda — demo: fyll databasen med fiktiva lunchlådor och reservationer.
// Inga beroenden. Kräver Node.js 22.5 eller senare (samma som server.js).
//
// Användning:
//   node demo.js          fyll i fiktiv demodata för idag och skriv ut instruktioner
//   node demo.js --clear  ta bort demodata (egna utbud och reservationer påverkas inte)
//
// Skriptet skriver direkt till data/lunchlada.db (samma databas som server.js läser)
// och skapar en .env med ett demolösenord om ingen .env finns, så att server.js kan
// starta direkt efteråt. Vilka id:n som hör till demon sparas i data/demo.json och
// raderas tillsammans med tillhörande reservationer (FK CASCADE) vid --clear eller
// vid nästa körning, så att egna utbud aldrig röras.

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
let DatabaseSync;
try { ({ DatabaseSync } = require("node:sqlite")); }
catch { console.error("demo.js behöver Node.js 22.5 eller senare (saknar node:sqlite)."); process.exit(1); }

const ROOT = __dirname;
const ENV_FILE = path.join(ROOT, ".env");
const ENV_EX = path.join(ROOT, ".env.example");
const DATA_DIR = path.join(ROOT, "data");
const DB_FILE = path.join(DATA_DIR, "lunchlada.db");
const MARKER = path.join(DATA_DIR, "demo.json");

// Fiktiva maträtter. groups = [status, antal rader, portioner per rad].
// "collected" = betald och utlämnad (räknas i statistiken), "reserved" = reserverad,
// "cancelled" = avbokad (räknas inte mot antal kvar).
const PLAN = [
  { dish: "Pasta bolognese",         qty: 24, price: 30, allergens: ["gluten", "milk"],                  off: 0,  win: 60,
    groups: [["reserved", 2, 2], ["reserved", 1, 1], ["collected", 1, 2], ["collected", 1, 1]] },
  { dish: "Fiskpinnar med potatis",  qty: 18, price: 35, allergens: ["fish", "gluten", "eggs"],          off: 15, win: 75,
    groups: [["reserved", 2, 2], ["collected", 1, 2]] },
  { dish: "Tomatsoppa (vegan)",      qty: 30, price: 25, allergens: [],                                  off: 0,  win: 45,
    groups: [["reserved", 1, 2], ["reserved", 1, 1], ["collected", 1, 1], ["cancelled", 1, 1]] },
  { dish: "Köttbullar med gräddsås",  qty: 20, price: 40, allergens: ["gluten", "eggs", "milk", "celery"], off: 30, win: 90,
    groups: [["reserved", 2, 1]] },
  { dish: "Pannkakor med sylt",      qty: 15, price: 30, allergens: ["gluten", "eggs", "milk"],          off: 45, win: 105,
    groups: [["reserved", 3, 2], ["reserved", 1, 1], ["collected", 3, 2], ["collected", 1, 1]] },
  { dish: "Kycklingcurry med ris",   qty: 10, price: 35, allergens: [],                                 off: 60, win: 120,
    groups: [["collected", 3, 2], ["reserved", 2, 2]] },
];

// Fiktiva förnamn till reservationerna.
const NAMES = ["Anna", "Erik", "Sofia", "Johan", "Maria", "Per", "Lena", "Nils", "Karin", "Bo",
  "Eva", "Lars", "Mia", "Anders", "Siv", "Gustav", "Ingrid", "Oskar", "Astrid", "Björn",
  "Greta", "Alva", "Lina", "Saga", "Aron", "Tuva", "Matteus", "Maja", "Frida", "Daniel"];

const pad = n => String(n).padStart(2, "0");
const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const mins = t => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

// ---------- .env ----------
// Läs ett värde ur .env om filen finns.
function envValue(key) {
  if (!fs.existsSync(ENV_FILE)) return undefined;
  for (const line of fs.readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && m[1] === key) return m[2].replace(/^["']|["']$/g, "");
  }
  return undefined;
}

// Skapa en .env från .env.example med ett demolösenord om ingen .env finns, så att
// server.js kan starta. Returnerar lösenordet om vi skapade filen, annars null.
function ensureEnv() {
  if (fs.existsSync(ENV_FILE)) return null;
  let tpl = fs.existsSync(ENV_EX) ? fs.readFileSync(ENV_EX, "utf8") : "";
  const pw = "demo-lunchlada";
  tpl = tpl.replace(/^ADMIN_PASSWORD=.*/m, `ADMIN_PASSWORD=${pw}`);
  tpl = tpl.replace(/^SCHOOL_NAME=.*/m, "SCHOOL_NAME=Stenbockens skola");
  fs.writeFileSync(ENV_FILE, tpl, { mode: 0o600 });
  return pw;
}

// ---------- databas ----------
function openDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new DatabaseSync(DB_FILE);
  // Samma schema som server.js (CREATE TABLE IF NOT EXISTS), så demon fungerar även
  // innan server.js har körts en första gång.
  db.exec(`
CREATE TABLE IF NOT EXISTS listings(
  id INTEGER PRIMARY KEY, date TEXT NOT NULL, dish TEXT NOT NULL, qty INTEGER NOT NULL,
  price INTEGER NOT NULL, from_t TEXT NOT NULL, to_t TEXT NOT NULL, allergens TEXT NOT NULL DEFAULT '[]',
  created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS reservations(
  id INTEGER PRIMARY KEY, listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  name TEXT NOT NULL, contact TEXT NOT NULL, qty INTEGER NOT NULL, price INTEGER NOT NULL,
  code TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'reserved', created INTEGER NOT NULL,
  UNIQUE(listing_id, contact));`);
  db.exec("PRAGMA foreign_keys=ON");
  db.exec("PRAGMA busy_timeout=5000");
  return db;
}

// Radera tidigare demodata via sparade id:n. FK CASCADE tar bort reservationerna.
function clearDemo(db) {
  let ids = [];
  if (fs.existsSync(MARKER)) {
    try { ids = JSON.parse(fs.readFileSync(MARKER, "utf8")).listings || []; } catch {}
  }
  if (ids.length) {
    const del = db.prepare("DELETE FROM listings WHERE id=?");
    for (const id of ids) del.run(id);
  }
  try { fs.unlinkSync(MARKER); } catch {}
}

// Hämtningstid: bas 2 timmar framåt (så utbuden inte stänger direkt), +off minuter,
// fönster win minuter. Använd riktig Date-aritmetik så midnatt hanteras rätt.
function slot(off, win) {
  const f = new Date(Date.now() + (120 + off) * 60000);
  const t = new Date(f.getTime() + win * 60000);
  const fmt = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return { from: fmt(f), to: fmt(t) };
}

function seed(db) {
  const ids = [];
  let ni = 0;
  const insL = db.prepare("INSERT INTO listings(date,dish,qty,price,from_t,to_t,allergens,created) VALUES(?,?,?,?,?,?,?,?)");
  const insR = db.prepare("INSERT INTO reservations(listing_id,name,contact,qty,price,code,status,created) VALUES(?,?,?,?,?,?,?,?)");
  for (const d of PLAN) {
    const { from, to } = slot(d.off, d.win);
    const lid = Number(insL.run(today(), d.dish, d.qty, d.price, from, to, JSON.stringify(d.allergens), Date.now()).lastInsertRowid);
    ids.push(lid);
    for (const [status, count, q] of d.groups) {
      for (let i = 0; i < count; i++) {
        const name = NAMES[ni++ % NAMES.length];
        insR.run(lid, name, `${name.toLowerCase()}@exempel.se`, q, d.price,
          String(crypto.randomInt(1000, 10000)), status, Date.now());
      }
    }
  }
  fs.writeFileSync(MARKER, JSON.stringify({ listings: ids, created: Date.now() }, null, 2));
  return ids.length;
}

// Räkna ihop vad statistiken i köksvyn kommer att visa.
function summary() {
  let collected = 0, reserved = 0, revenue = 0, rows = 0;
  for (const d of PLAN) {
    for (const [status, count, q] of d.groups) {
      rows += count;
      const n = count * q;
      if (status === "collected") { collected += n; revenue += n * d.price; }
      else if (status === "reserved") reserved += n;
    }
  }
  return { collected, reserved, revenue, rows };
}

// ---------- huvudprogram ----------
const clear = process.argv.includes("--clear");
const db = openDb();

if (clear) {
  clearDemo(db);
  console.log("✓ Demodata borttagen. Egna utbud och reservationer påverkas inte.");
  db.close();
  process.exit(0);
}

const pw = ensureEnv();   // skapa .env om den saknas (behövs för att server.js ska starta)
clearDemo(db);            // fräscha upp: ta bort tidigare demodata först
const n = seed(db);

const kgPer = +(envValue("KG_PER_PORTION") || 0.4);
const cur = envValue("CURRENCY") || "kr";
const school = envValue("SCHOOL_NAME") || "Stenbockens skola";
const port = +(envValue("PORT") || 3000);
const s = summary();

// Vänlig varning om klockan är så sent att hämtningstiderna slagit runt midnatt
// (då visas utbuden som stängda och man kan inte reservera).
const firstFrom = mins(slot(0, 60).from);
const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
const lateNote = firstFrom < nowMin - 60
  ? "\n  (Obs: klockan är sent, så hämtningstiderna kan ligga tidigare än nu och\n   vissa utbud visas som stängda. Kör demon på dagen för att kunna reservera.)\n"
  : "";

console.log(`
✓ Demodata skapat för ${school} (${today()})
  ${n} maträtter, ${s.rows} fiktiva reservationer
  ${s.collected} portioner utlämnade · ${(s.collected * kgPer).toFixed(1)} kg matsvinn undvikit
  ${s.reserved} portioner reserverade (väntar) · ${s.revenue} ${cur} i intäkt${lateNote}

Starta servern och titta runt:

    node server.js

Öppna http://localhost:${port} i webbläsaren.
• Fliken "Hämta lunch": bläddra bland lådor, tryck Reservera och få en hämtkod.
• Fliken "Köket": logga in och se dagens utbud, reservationer och statistik.
${pw ? `• Kökslösenord (demo): ${pw}` : "• Kökslösenord: det som står i din .env (ADMIN_PASSWORD)."}

Ta bort demodata när du är klar (egna utbud röras inte):

    node demo.js --clear
`);

db.close();
