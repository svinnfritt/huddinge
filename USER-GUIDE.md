# Användarguide för köket

Den här guiden är för dig som jobbar i skolköket och använder Lunchlåda för att sälja
överbliven mat som lunchlådor. Du behöver inte kunna något om datorer — bara följa
stegen nedan.

> **Först:** regler för livsmedelssäkerhet, allergener och personuppgifter gäller innan ni
> säljer mat. Läs [BEFORE-YOU-SELL-FOOD.md](./BEFORE-YOU-SELL-FOOD.md) tillsammans med
> den som ansvarar för skolans matsal.

## Innan du börjar

Du behöver två saker av den som har satt upp systemet:

1. **Adressen** till sidan (till exempel `http://lunch.minskola.se` eller `http://localhost:3000`).
2. **Kökslösenordet** (det som kallas `ADMIN_PASSWORD`).

Använd en telefon, surfplatta eller dator. Ha fliken **Köket** öppen under hela
lunchserveringen så att du hör och ser när nya beställningar kommer in.

---

## Snabbstart (minimum)

1. Öppna sidan → fliken **Köket** → skriv lösenordet → **Logga in**.
2. Fyll i **Lägg upp överbliven mat** → bocka i allergener och säkerhetschecklistan → **Publicera**.
3. När någon hämtar en låda: leta rätt på deras **hämtkod**, ta betalt i köket, tryck **Betald och utlämnad**.
4. Ändå inte hämtad? Tryck **Avboka**.
5. Klart för dagen? Tryck **Logga ut**.

Det är hela dagliga rutinen. Detaljerna följer nedan.

---

## 1. Logga in i köket

1. Öppna sidan i webbläsaren.
2. Tryck på fliken **Köket** högst upp.
3. Skriv kökslösenordet och tryck **Logga in**.

Du förblir inloggad i cirka 12 timmar. Tryck **Logga ut** när dagen är slut, så att ingen
annan kan råka använda köksvyn på din enhet.

---

## 2. Lägg upp överbliven mat

Under **Lägg upp överbliven mat** fyller du i:

| Fält | Vad du fyller i |
|---|---|
| **Maträtt** | Namnet på rätten, till exempel "Pasta bolognese". |
| **Antal** | Hur många portioner/lådor du har över. |
| **Pris** | Pris per låda i er valuta (till exempel 30). |
| **Hämtas från / till** | Tidsfönstret när lådorna kan hämtas, till exempel 13:15–14:00. |
| **Allergener i rätten (EU:s 14)** | Bocka i de allergener som finns i rätten. Finns inget av dem, låt alla vara obockade — då visas "Inga av de 14 allergenerna angivna". |
| **Livsmedelssäkerhet** | Bocka i alla tre punkterna (se nedan). |

**Säkerhetschecklistan** (du måste bocka i alla tre innan du kan publicera):

1. Maten har inte serverats och har hållits varm (60 °C eller mer) eller kyld (8 °C eller mindre).
2. Lådorna är i rena förpackningar märkta med maträtt, allergener och datum.
3. Allergenuppgifterna är kontrollerade mot receptet idag.

Tryck **Publicera**. Lådorna visas direkt för köparna. Du kan lägga upp flera rätter —
varje rätt blir ett eget utbud i listan.

Tips: lägg upp utbuden på morgonen innan lunch, så att vårdnadshavare och personal
hinner reservera i tid.

---

## 3. Följ med när beställningar kommer in

Du behöver inte ladda om sidan. Köksvyn uppdateras automatiskt ungefär var 30:e sekund.

När en ny beställning kommer in:

- Du hör en kort signal (ett "ding-ding").
- Den nya raden i tabellen blinkar grönt en kort stund.
- Om du befinner dig på fliken **Hämta lunch** visas en röd siffra på fliken **Köket** —
  det är antal nya beställningar som väntar. Tryck på **Köket** för att se dem, då
  försvinner siffran.

Bra att veta om ljudet:

- Ljudet fungerar bara om du har öppnat fliken **Köket** minst en gång (webbläsaren
  blockerar ljud tills du har klickat i sidan). Öppna köksvyn när du börjar dagen.
- Ha volymen uppe — se till att enheten inte är i tyst läge.

---

## 4. Lämna ut och ta betalt vid hämtning

1. Köparen visar sin **hämtkod** — en fyrsiffra kod, till exempel 4821.
2. Leta upp koden i tabellen under **Dagens utbud och reservationer**. Kontrollera att
   namnet stämmer.
3. Ta betalt i köket med det ni redan använder (kontant, kortterminal, etc.). Programmet
   hanterar inga betalningar — det bara noterar att lådan är utlämnad.
4. Tryck **Betald och utlämnad** på den raden. Statusen ändras och räknas in i statistiken.

Om någon har reserverat men inte hämtar lådan: tryck **Avboka** på raden. Avbokade
lådor räknas inte, och maten kan ges till någon annan eller hanteras enligt era rutiner.

---

## 5. Ta bort ett utbud

Om du råkade ange fel, eller om maten tog slut, tryck **Ta bort** på utbudets rad.
Bekräfta när du får frågan. Alla reservationer som hör till utbudet tas bort också.

> Det finns inget sätt att ändra ett publicerat utbud i den här versionen. Rätta till
> ett fel genom att ta bort utbudet och lägga upp det på nytt.

---

## 6. Se statistiken

Längst upp i köksvyn finns tre rutor:

- **portioner utlämnade totalt** — hur många lådor som har markerats Betald och utlämnad.
- **matsvinn undvikit** — uppskattad vikt mat (i kg) som ni har räddat, baserat på antalet
  utlämnade portioner.
- **intäkt från utlämnade lådor** — summan pengar från utlämnade lådor.

Siffrorna uppdateras när du markerar lådor som utlämnade.

---

## 7. Exportera CSV

Tryck **Exportera CSV** för att ladda ner en fil med alla reservationer (datum, maträtt,
antal, pris och status). Använd den för egen statistik, bokföring eller rapportering.

---

## 8. Logga ut

Tryck **Logga ut** när lunchserveringen är klar. Nästa gång behöver du lösenordet igen.

---

## Bra att veta

- **Översäljning går inte.** Två personer kan inte ta den sista lådan — programmet låser
  automatiskt så att man inte kan sälja fler än som finns.
- **Reservationen stänger i förväg.** Ingen kan reservera precis vid hämtning; den stänger
  en stund innan (vanligtvis 30 minuter före att hämtningen börjar).
- **Max per person.** En köpare kan reservera högst ett visst antal lådor per utbud
  (vanligtvis 2).
- **Köparen bekräftar allergener.** Innan någon kan reservera måste de bocka i att de har
  läst allergeninformationen och förstår att lådan ska ätas samma dag.
- **Personuppgifter raderas.** Köparnas namn och kontaktuppgifter raderas automatiskt efter
  en tid (vanligtvis 30 dagar). Endast siffrorna sparas för statistiken.
- **Betalt och utlämnad = klart.** Det är den statusen som räknas som såld/utlämnad i
  statistiken. "Reserverad" betyder att någon har bokat men inte hämtat ännu.

---

## Vanliga frågor

**Jag hör ingen signal.** Öppna fliken Köket minst en gång och säkerställ att volymen är
på. Vissa webbläsare blockerar ljud tills du har klickat i sidan.

**En köpare har tappat sin hämtkod.** Sök efter personens förnamn i tabellen — koden står
bredvid varje reservation.

**Jag angav fel allergener.** Tryck Ta bort på utbudet och lägg upp det på nytt med rätt
allergener. Kontrollera alltid mot dagens recept.

**Någon har reserverat men köket är stängt.** Tryck Avboka på raden.

**Statistiken stämmer inte.** Kontrollera att du har markerat utlämnade lådor som
"Betald och utlämnad". Endast de räknas som utlämnade.

**Sidan fungerar inte alls.** Ladda om sidan. Blir det inte bättre, fråga den som har satt
upp systemet (de kan kolla att servern är igång och inställningarna i `.env` stämmer).
