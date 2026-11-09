# Innan ni säljer mat

Programmet är bara ett verktyg. Reglerna för att sälja mat skiljer sig mellan länder och
kommuner, och ni ansvarar själva för att följa dem. Gör det här först.

1. **Fråga er livsmedelskontroll.** I Sverige är det kommunens miljökontor eller motsvarande
   livsmedelskontroll, och Livsmedelsverkets vägledning. Fråga om det är tillåtet att sälja
   överbliven mat i er verksamhet och på vilka villkor (temperaturer, förpackning, märkning,
   försäljning samma dag, vem som får köpa).
2. **Bestäm vem som är säljare.** Maten tillhör oftast skolans huvudman (till exempel kommunen).
   Få deras godkännande och kom överens om vem som tar emot betalningen.
3. **Kontrollera allergenrutinen.** Varje låda ska ange de av EU:s 14 allergener som finns i den.
   Köket måste kontrollera uppgifterna mot receptet varje dag. Checklistan i programmet är en
   påminnelse, inte en juridisk garanti.
4. **Bestäm vem som får köpa.** Använd `ACCESS_CODE` och `ELIGIBILITY_TEXT` för att begränsa
   försäljningen, till exempel till vårdnadshavare och personal. Eleverna får oftast redan en
   kostnadsfri skolmåltid.
5. **Integritet (GDPR).** Programmet sparar ett förnamn och en e-postadress eller ett
   telefonnummer per reservation och raderar dem efter `RETENTION_DAYS` (30 dagar som standard).
   Lägg till en kort integritetspolicy på er egen webbplats, informera ert dataskyddsombud och
   kör servern på en plats som ni själva kontrollerar.
6. **Betalning.** Programmet hanterar inga betalningar. Köparen betalar i skolköket när lådan
   hämtas, med det som köket redan tar emot, och personalen markerar lådan som betald och
   utlämnad. Kom överens med skolans huvudman om hur pengarna hanteras och bokförs.
7. **Tillgänglighet.** Offentliga webbplatser kan behöva uppfylla tillgänglighetskrav (WCAG).
   Testa med en skärmläsare innan ni startar.
