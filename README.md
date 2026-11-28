# fagl-pet-modul-3_mix203
eksamen

## Lagets nivå og poeng

Åpne `index.html` og trykk på nivåvisningen nederst til høyre.
HTML for komponenten ligger i kartfilen, utseendet i `lagpoeng.css`,
og poengberegning og oppdatering i `lagpoeng.js`.

- Lest artikkel: 1 poeng når «Lest» hukes av i biblioteket.
- Deltatt i spill: 2 poeng ved innsendt avstemming eller fullført quiz.
- Delt artikkel: 3 poeng. Når deling er implementert, kall
  `window.TeamPoints.award('share', artikkelId)` etter vellykket deling.
  Å åpne delingsknappen gir ikke poeng.

Samme aktivitet med samme id telles bare én gang. Omspilling gir derfor
ikke nye poeng. Spill-id-ene bruker foreløpig en demomåned; bruk faktisk
måned og uke når månedlige spill kobles til data.

Nivågrenser: 0, 10, 25, 45, 70, 100 og 140 poeng. Fremdriften regnes fra
starten av gjeldende nivå til neste nivå. Nivå 7 er siste nivå og søylen
fylles til 199 poeng uten å opprette nivå 8.

Dette er en lokal prototype med localStorage, ikke statistikk som er delt
mellom flere kolleger. Bruk samme lokale webserver/origin for alle sidene
for å dele nettleserlagringen på tvers av kart, bibliotek og spill.
