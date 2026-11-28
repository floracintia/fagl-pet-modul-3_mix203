// Fagløpet – felles komponenter (sidemeny og header) som brukes på alle sider.
// Bruk på en side:
//   <div data-komponent="sidemeny"></div>
//   <div data-komponent="header"></div>
//   <script src="komponenter.js"></script>
// Plassholderne byttes ut med ferdig HTML når skriptet kjører.

const menyvalg = [
  { tekst: 'Hjem',      ikon: 'hjem',      lenke: './hjem.html', side: 'hjem.html' },
  { tekst: 'Meldinger', ikon: 'meldinger', lenke: '#' },
  { tekst: 'Aktivitet', ikon: 'aktivitet', lenke: '#' },
  { tekst: 'Filer',     ikon: 'filer',     lenke: './bibliotek.html', side: 'bibliotek.html' },
  { tekst: 'Verktøy',   ikon: 'verktoy',   lenke: '#' },
  { tekst: 'Admin',     ikon: 'admin',     lenke: '#' },
];

// Normaliser URL-en slik rutevalg også virker med undermapper og avsluttende /.
function normaliserSide(sti) {
  const filnavn = decodeURIComponent(sti).replace(/\/+$/, '').split('/').pop();
  // GitHub Pages for prosjektrepoer serverer startsiden under /repo-navn/.
  // En siste URL-del uten filendelse er derfor rotmappen, ikke en egen side.
  return !filnavn || !filnavn.includes('.') ? 'index.html' : filnavn;
}

const gjeldendeSide = normaliserSide(location.pathname);
// Alle disse sidene tilhører Anden-universet og deler samme aktive markering.
const andenSider = new Set([
  'index.html',
  // Behold støtte for den gamle kart-URL dersom den fortsatt er i bruk.
  'forside_kart.html',
  'bibliotek.html',
  'Spillpunkt1.html',
  'Spillpunkt2.html',
]);
const erAndenSide = andenSider.has(gjeldendeSide);

function lagSidemeny() {
  const knapper = menyvalg.map(valg => {
    const erAktiv = valg.side === gjeldendeSide;
    return `
      <a class="sidemeny-knapp${erAktiv ? ' er-aktiv' : ''}" href="${valg.lenke}"${erAktiv ? ' aria-current="page"' : ''}>
        <span class="sidemeny-ikon-boks">
          <img class="sidemeny-ikon" src="bilder/ikoner/${valg.ikon}.svg" width="20" height="20" alt="">
        </span>
        <span class="sidemeny-tekst">${valg.tekst}</span>
      </a>`;
  }).join('');

  return `
    <nav class="sidemeny" aria-label="Hovedmeny">
      <a class="arbeidsomraade" href="#" aria-label="Fagløp arbeidsområde">0</a>
      ${knapper}
      <a class="avatar" href="index.html" aria-label="Til kartet"${erAndenSide ? ' aria-current="page"' : ''}>
        <img src="bilder/anden.png" alt="">
      </a>
      <div class="sidemeny-bunn">
        <button class="sidemeny-rund" type="button" aria-label="Opprett ny">
          <img src="bilder/ikoner/pluss.svg" width="20" height="20" alt="">
        </button>
        <button class="sidemeny-rund" type="button" aria-label="Mørk modus">
          <img src="bilder/ikoner/mane.svg" width="20" height="20" alt="">
        </button>
        <button class="profil" type="button" aria-label="Din profil">
          <img src="bilder/ikoner/profil.svg" alt="">
          <span class="profil-status" aria-hidden="true">z</span>
        </button>
      </div>
    </nav>`;
}

function lagHeader() {
  return `
    <header class="topplinje">
      <div class="topplinje-navigasjon">
        <button class="topplinje-knapp" type="button" aria-label="Tilbake">←</button>
        <button class="topplinje-knapp" type="button" aria-label="Fram">→</button>
        <button class="topplinje-knapp" type="button" aria-label="Historikk">◷</button>
      </div>
      <label class="sokefelt">
        <img src="bilder/ikoner/sok.svg" width="16" height="16" alt="">
        <input type="search" placeholder="Søk">
      </label>
    </header>`;
}

const komponenter = { sidemeny: lagSidemeny, header: lagHeader };

document.querySelectorAll('[data-komponent]').forEach(plassholder => {
  const lag = komponenter[plassholder.dataset.komponent];
  if (lag) plassholder.outerHTML = lag();
});
