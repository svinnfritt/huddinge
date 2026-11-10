# Lunchlåda

**Låt skolköket sälja överbliven mat som billiga lunchlådor i stället för att slänga den.**

- Köket lägger upp dagens överskott: maträtt, antal portioner, pris, hämtningstid och allergener.
- Vårdnadshavare och personal reserverar en låda i mobilen och får en hämtkod.
- Köparen betalar i skolköket när lådan hämtas. Köket markerar lådan som betald och utlämnad,
  och programmet räknar ut hur mycket matsvinn ni har undvikit.

Inga konton hos andra företag. Ingen databasserver. Ett litet program och en datamapp.
Fungerar på svenska och engelska. Gratis och öppen källkod (MIT-licens).

> **Läs [docs/BEFORE-YOU-SELL-FOOD.md](docs/BEFORE-YOU-SELL-FOOD.md) innan ni börjar sälja.**
> Regler om livsmedelssäkerhet, allergener och personuppgifter gäller, och ni ansvarar själva för att följa dem.

---

## Prova demon (fiktiv data)

Vill du bara titta på hur det ser ut? Öppna `preview.html` i webbläsaren — en statisk
sida med fiktiv data som visar både köpar- och köksvyn. Ingen server eller Node krävs.

Vill du i stället klicka dig runt i det riktiga programmet? Kör de här två raderna i projektmappen:

```
node demo.js
node server.js
```

`demo.js` fyller databasen med fiktiva lunchlådor och reservationer för en skola som
heter Stenbockens skola, så att du direkt kan bläddra bland lådor, reservera och logga
in i köket utan att skriva in något själv. Öppna `http://localhost:3000`. Om ingen
`.env` finns skapar skriptet en med ett demolösenord och skriver ut det.

Ta bort demodata när du är klar — då raderas bara de utbud som demon skapade, inte något
du lagt in själv:

```
node demo.js --clear
```

## Kom igång på 10 minuter (med Docker)

Ni behöver en dator eller server som alltid är på, med [Docker](https://docs.docker.com/get-docker/) installerat.

1. **Ladda ner** projektet (gröna knappen "Code" på GitHub, sedan "Download ZIP") och packa upp det.
2. **Skapa inställningsfilen.** Kopiera `.env.example` till en ny fil som heter `.env`.
   Öppna `.env` i en textredigerare och ändra minst `ADMIN_PASSWORD` och `SCHOOL_NAME`.
3. **Starta.** Kör det här i projektmappen:
   ```
   docker compose up -d
   ```
4. **Öppna** `http://localhost:3000` (eller `http://<serverns-adress>:3000`).
   Klicka på **Köket**, logga in med ert `ADMIN_PASSWORD` och lägg upp ert första utbud.

Det var allt. Stäng av med `docker compose down`. Uppdatera genom att ladda ner den nya versionen,
behålla er `.env` och mappen `data`, och köra `docker compose up -d --build`.

### Gör det säkert på öppna internet (HTTPS)

Lösenord får aldrig skickas med vanlig `http` över internet. Enklaste sättet:

1. Peka ett domännamn (till exempel `lunch.minskola.se`) mot er server.
2. Öppna `docker-compose.https.yml` och byt ut `lunch.myschool.se` mot ert domännamn.
3. Kör `docker compose -f docker-compose.https.yml up -d`.

Ett gratis certifikat hämtas och förnyas automatiskt. Om er IT-avdelning redan har en
reverse proxy eller webbserver kan ni i stället peka den mot port 3000.

## Inget Docker? Kör med Node.js

Installera [Node.js 22.5 eller senare](https://nodejs.org) och kör sedan i projektmappen:

```
node server.js
```

Ingen `npm install` behövs eftersom projektet inte har några beroenden. För att programmet ska
fortsätta köra när ni stänger terminalen kan ni använda en tjänstehanterare som `systemd` eller `pm2`.

## Andra sätt att driftsätta

Alla leverantörer som kör en Docker-container eller Node.js och ger er en **beständig disk**
fungerar (till exempel Fly.io, Railway, Render eller en liten hyrd server). Koppla disken till
`/app/data` och ange värdena från `.env.example` som miljövariabler. Utan beständig disk
försvinner datan varje gång programmet startar om.

## Inställningar

Allt ställs in i `.env`. Se [.env.example](.env.example), där varje rad är kommenterad.

| Inställning | Vad den gör |
|---|---|
| `ADMIN_PASSWORD` | Köksinloggning (obligatorisk, minst 8 tecken) |
| `SCHOOL_NAME`, `LANGUAGE`, `CURRENCY` | Namn, språk (`sv` eller `en`) och valuta |
| `ACCESS_CODE` | Valfri kod som köpare måste ange. Dela bara ut den till vårdnadshavare och personal |
| `ELIGIBILITY_TEXT` | Meddelande till köpare, till exempel vem som får köpa |
| `PAYMENT_NOTE` | Valfri egen betalningstext (standard: betala i skolköket vid hämtning) |
| `CUTOFF_MINUTES`, `MAX_PER_PERSON` | När reservationen stänger och max antal per person |
| `RETENTION_DAYS` | Antal dagar innan köparnas namn och kontaktuppgifter raderas |
| `TZ` | Er tidszon, så att hämtningstider och stängning blir rätt |

## Daglig användning

> Steg-för-steg för kökspersonal finns i [docs/USER-GUIDE.md](docs/USER-GUIDE.md).

1. Köket: **Köket**, logga in, fyll i formuläret, bekräfta checklistan för livsmedelssäkerhet och tryck **Publicera**.
2. Köpare: öppna sidan, tryck **Reservera**, anteckna koden.
3. Vid hämtning: köparen visar koden och betalar i köket. Hitta koden i köksvyn och tryck
   **Betald och utlämnad**. Lådor som aldrig hämtas förblir obetalda, och ni kan trycka **Avboka** på dem.
4. Tryck **Exportera CSV** när som helst för egen statistik eller rapportering.

## Säkerhetskopiering

Allt ligger i mappen `data/` (en SQLite-fil). Kopiera mappen regelbundet. Återställ genom att lägga tillbaka den.

## Så fungerar det (för den nyfikne)

- `server.js`: hela backenden (cirka 200 rader, inga beroenden, Nodes inbyggda SQLite).
- `public/index.html`: hela gränssnittet, inklusive svenska och engelska texter.
- Överförsäljning förhindras med en databastransaktion, så två personer kan inte ta den sista lådan.
- Köksinloggningen är en signerad cookie. Inloggning och reservationer har begränsning av antal försök.

Kör den automatiska kontrollen med `npm test`.

## Begränsningar i den här första versionen

- Betalning sker i köket (kontant, kortterminal eller vad köket redan använder). Programmet
  registrerar den men hanterar inga betalningar.
- Köpare identitetskontrolleras inte. `ACCESS_CODE` är bara en enkel delad hemlighet. Lägg till
  BankID eller liknande om ni behöver riktig identitetskontroll.
- Ett kök per installation. Kör en kopia per skola (var och en med egen `data/` och port).
- Bara svenska och engelska. Lägg till ett språk genom att kopiera ett block i `public/index.html`.

## Bidra

Ärenden och pull requests är välkomna, särskilt översättningar, förbättrad tillgänglighet och
erfarenheter från skolor. Håll det enkelt: inget byggsteg och inga beroenden.

## Licens

MIT. Använd, ändra och dela fritt.
