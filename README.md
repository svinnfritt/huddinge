# Lunchlåda

**Let your school kitchen sell leftover food as cheap lunchboxes instead of throwing it away.**

- The kitchen posts today's leftovers: dish, portions, price, pickup time, allergens.
- Guardians and staff reserve a box on their phone and get a pickup code.
- Buyers pay in the school kitchen when they collect the box. The kitchen marks it as paid and collected, and the app counts the food waste you avoided.

No accounts with other companies. No database server. One small program and one data folder.
Works in Swedish and English. Free and open source (MIT license).

> **Read [docs/BEFORE-YOU-SELL-FOOD.md](docs/BEFORE-YOU-SELL-FOOD.md) before you start selling.**
> Food safety, allergen and privacy rules apply, and you are responsible for following them.

---

## Set it up in 10 minutes (with Docker)

You need a computer or server that is always on, with [Docker](https://docs.docker.com/get-docker/) installed.

1. **Download** this project (green "Code" button on GitHub, then "Download ZIP") and unzip it.
2. **Make your settings file.** Copy `.env.example` to a new file named `.env`.
   Open `.env` in a text editor and at least change `ADMIN_PASSWORD` and `SCHOOL_NAME`.
3. **Start it.** In the project folder, run:
   ```
   docker compose up -d
   ```
4. **Open** `http://localhost:3000` (or `http://<server-address>:3000`).
   Click **Kitchen** (or **Köket**), log in with your `ADMIN_PASSWORD` and add your first listing.

That's it. To stop it: `docker compose down`. To update it: download the new version, keep your
`.env` and `data` folder, and run `docker compose up -d --build`.

### Make it safe for the public internet (HTTPS)

Passwords must never travel over plain `http` on the internet. The easy way:

1. Point a domain name (for example `lunch.myschool.se`) at your server.
2. Open `docker-compose.https.yml` and replace `lunch.myschool.se` with your domain.
3. Run `docker compose -f docker-compose.https.yml up -d`.

A free certificate is fetched and renewed automatically. If your IT department already has a
reverse proxy or web server, point it at port 3000 instead.

## No Docker? Run it with Node.js

Install [Node.js 22.5 or newer](https://nodejs.org), then in the project folder:

```
node server.js
```

No `npm install` is needed because the project has zero dependencies. To keep it running after
you close the terminal, use a service manager such as `systemd` or `pm2`.

## Other hosting options

Any host that runs a Docker container or Node.js and gives you a **persistent disk** works
(for example Fly.io, Railway, Render, or a small VPS). Mount the disk at `/app/data` and set the
values from `.env.example` as environment variables. Without a persistent disk, your data is lost on every restart.

## Settings

Everything is configured in `.env`. See [.env.example](.env.example); every line is commented.

| Setting | What it does |
|---|---|
| `ADMIN_PASSWORD` | Kitchen login (required, 8+ characters) |
| `SCHOOL_NAME`, `LANGUAGE`, `CURRENCY` | Name, language (`sv` or `en`), currency label |
| `ACCESS_CODE` | Optional code buyers must enter. Hand it out to guardians and staff only |
| `ELIGIBILITY_TEXT` | Message shown to buyers, for example who may buy |
| `PAYMENT_NOTE` | Optional custom payment text (default: pay in the school kitchen at pickup) |
| `CUTOFF_MINUTES`, `MAX_PER_PERSON` | Reservation cutoff and per-person limit |
| `RETENTION_DAYS` | Days before buyer names and contacts are erased |
| `TZ` | Your time zone, so pickup times and cutoffs are correct |

## Daily use

1. Kitchen: **Kitchen**, log in, fill in the form, confirm the food-safety checklist, **Publish**.
2. Buyers: open the site, **Reserve**, write down the code, pay.
3. At pickup: the buyer shows the code and pays in the kitchen. Find the code in the kitchen view and press **Paid and collected**. Boxes never collected stay unpaid, so you can press **Cancel** on them.
4. Press **Export CSV** any time for your own statistics or reporting.

## Backups

Everything is in the `data/` folder (one SQLite file). Copy that folder regularly. To restore, put it back.

## How it works (for the curious)

- `server.js`: the whole backend (about 200 lines, no dependencies, Node's built-in SQLite).
- `public/index.html`: the whole front end, including Swedish and English texts.
- Overselling is prevented with a database transaction, so two people cannot take the last box.
- Admin login is a signed cookie; login and reservations are rate limited.

Run the automated check with `npm test`.

## Limits of this first version

- Payment is handled in the kitchen (cash, card terminal or whatever the kitchen already uses). The app records it but does not process payments.
- Buyers are not verified. `ACCESS_CODE` is a simple shared secret. Add BankID or similar if you need real identity checks.
- One kitchen per installation. Run one copy per school (each with its own `data/` and port).
- Only Swedish and English. Add a language by copying one block in `public/index.html`.

## Contributing

Issues and pull requests are welcome, especially translations, accessibility fixes and
experience reports from schools. Keep it simple: no build step, no dependencies.

## License

MIT. Use it, change it, share it.
