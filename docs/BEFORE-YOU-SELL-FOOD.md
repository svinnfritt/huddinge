# Before you sell any food

This software is only a tool. Rules about selling food differ by country and municipality,
and you are responsible for following them. Do these things first.

1. **Ask your food safety authority.** In Sweden that is the municipality's environmental/food
   inspection office (miljökontoret) and Livsmedelsverket's guidance. Ask whether selling
   leftover meals is allowed in your setup, and under what conditions (temperatures, packaging,
   labeling, same-day sale, who may buy).
2. **Settle who the seller is.** The food usually belongs to the school owner (for example the
   municipality). Get their approval, and agree who receives the payments.
3. **Check the allergen process.** Every box must list the 14 EU allergens that apply. The kitchen
   must verify them against the recipe every day. The checklist in the app is a reminder,
   not a legal guarantee.
4. **Decide who may buy.** Use `ACCESS_CODE` and `ELIGIBILITY_TEXT` to limit sales, for example to
   guardians and staff. Pupils usually already get a free meal.
5. **Privacy (GDPR).** The app stores a first name and an email or phone number per reservation and
   erases them after `RETENTION_DAYS` (default 30). Add a short privacy notice on your own site,
   tell your data protection officer, and host the server somewhere you control.
6. **Payments.** The app does not process payments. Buyers pay in the school kitchen when they
   collect the box, using whatever the kitchen already accepts, and staff mark the box as paid
   and collected. Agree with the school owner how the money is handled and accounted for.
7. **Accessibility.** Public-sector websites may have to meet accessibility requirements (WCAG).
   Test with a screen reader before launch.
