/* SPILLPUNKT – OPPFØRSEL
    HTML: innhold og struktur. CSS: utseende. JavaScript: klikk og data.
    Dette er en lokal prototype: svar sendes ikke til en server og lagres
    ikke etter at siden lastes på nytt. Tallene under er eksempeldata.
   Skriptet lastes med defer i HTML (eller nederst i body), så elementene finnes før koden kjører.
   Brukes både i Spillpunkt2.html (forhåndsvisning) og på forside_kart.html. */

// 1. ELEMENTER FRA HTML
// querySelector finner ett element. # betyr id, mens . betyr class.
const card = document.querySelector('.poll-card');
const intro = document.querySelector('#poll-intro');
const question = document.querySelector('#poll-question');
const questionTitle = document.querySelector('#question-title');
const form = document.querySelector('#poll-form');
const results = document.querySelector('#poll-results');
const reopen = document.querySelector('.poll-reopen');
const startButton = document.querySelector('#poll-start');
const closeButton = document.querySelector('.poll-close');
const finishButton = document.querySelector('.poll-finish');
const answerText = document.querySelector('#poll-answer');
const countText = document.querySelector('#poll-count');
const bars = document.querySelector('#poll-bars');
const resultPanel = document.querySelector('#poll-result-panel');
const resultTemplate = document.querySelector('#poll-result-template');

// querySelectorAll finner alle fanene. [...] gjør samlingen til en liste.
const tabs = [...card.querySelectorAll('[role="tab"]')];
const weekButtons = [...document.querySelectorAll('.poll-week')];

// 2. DEMODATA OG VALGT SVAR
// Rekkefølgen følger value="0", "1", "2" og "3" på radioknappene i HTML.
const labels = [
  'Felles forståelse',
  'Tidlig involvering',
  'Raske tilbakemeldinger',
  'Tydelige avklaringer',
];

// all = hele Bouvet, team = mitt team. values inneholder prosentene.
const demoResults = {
  all: { count: 428, values: [38, 29, 21, 12] },
  team: { count: 21, values: [20, 52, 18, 10] },
};

// null betyr at brukeren ennå ikke har valgt et svar.
let answer = null;

// DEMOMÅNED: fire spill, der uke 36 er nåværende uke og 37 kommer senere.
// Endre denne verdien når neste spill skal bli tilgjengelig.
// Bruker samme eksempelspørsmål for alle ukene foreløpig.
const currentWeek = 36;
let selectedWeek = currentWeek;
const answersByWeek = new Map();

function selectWeek(week) {
  selectedWeek = week;
  answer = answersByWeek.get(week) ?? null;
  weekButtons.forEach(button => {
    const buttonWeek = Number(button.dataset.week);
    const completed = answersByWeek.has(buttonWeek);
    button.disabled = buttonWeek > currentWeek;
    button.setAttribute('aria-pressed', String(buttonWeek === week));
    button.setAttribute('aria-label', `Uke ${buttonWeek}${button.disabled ? ', ikke tilgjengelig ennå' : completed ? ', fullført' : ''}`);
  });
  // Behold pilen i knappen; oppdater bare tekstnoden foran den.
  startButton.firstChild.textContent = 'Gå til ukens avstemming ';
}

weekButtons.forEach(button => {
  button.addEventListener('click', () => selectWeek(Number(button.dataset.week)));
});

// 3. BYGG ÉN RESULTATRAD FRA HTML-MALEN
function createResultRow(label, index, percentage) {
  // cloneNode(true) kopierer malen med alle elementene inni.
  const row = resultTemplate.content.firstElementChild.cloneNode(true);
  const track = row.querySelector('.poll-track');
  const isAnswer = index === answer;

  // textContent fyller tekst uten å lage HTML inne i JavaScript.
  row.querySelector('.poll-result-name').textContent = label;
  row.querySelector('.poll-result-percent').textContent = `${percentage}%`;
  row.querySelector('.poll-answer-tag').hidden = !isAnswer;
  row.classList.toggle('is-answer', isAnswer);

  // Skjermlesere får navn og tallverdi for søylen.
  track.setAttribute('aria-label', label);
  track.setAttribute('aria-valuenow', percentage);

  // Bare bredden kommer fra data. Farge, høyde og form ligger i CSS.
  track.querySelector('span').style.width = `${percentage}%`;
  return row;
}

// 4. VIS RESULTATENE FOR EN GRUPPE
function showResults(scope) {
  const data = demoResults[scope];
  countText.textContent = `${data.count} anonyme svar`;

  // map lager en rad per svar. replaceChildren erstatter de gamle radene.
  const rows = labels.map((label, index) => {
    return createResultRow(label, index, data.values[index]);
  });
  bars.replaceChildren(...rows);

  // Marker aktiv fane. Bare aktiv fane inngår i den vanlige Tab-rekkefølgen.
  const activeTabIndex = scope === 'all' ? 0 : 1;
  tabs.forEach((tab, index) => {
    const selected = index === activeTabIndex;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });

  resultPanel.setAttribute('aria-labelledby', tabs[activeTabIndex].id);

}

// 5. GÅ FRA INTRODUKSJON TIL SPØRSMÅL
startButton.addEventListener('click', () => {
  intro.hidden = true;
  question.hidden = false;
  // Fullførte uker viser resultatet. Andre uker starter med et tomt skjema.
  form.hidden = answer !== null;
  results.hidden = answer === null;
  if (answer === null) {
    form.reset();
  } else {
    answerText.textContent = labels[answer];
    showResults('all');
  }

  // Flytt tastaturfokus til overskriften og rull til toppen av kortet.
  questionTitle.focus();
  card.scrollTop = 0;
});

// 6. SEND INN VALGET OG VIS RESULTATER
// required i HTML sørger for at brukeren velger et svar før submit utløses.
form.addEventListener('submit', event => {
  // Hindre skjemaets standardoppførsel, som ellers laster siden på nytt.
  event.preventDefault();

  // FormData leser radioknappen med name="answer". Number gjør verdien til et tall.
  answer = Number(new FormData(form).get('answer'));
  answersByWeek.set(selectedWeek, answer);
  // Registrer deltakelse når stemmen er sendt inn.
  window.TeamPoints?.award('play', `poll:demo-month:${selectedWeek}`);
  answerText.textContent = labels[answer];
  form.hidden = true;
  results.hidden = false;
  showResults('all');
  questionTitle.focus();
  card.scrollTop = 0;
});

// 7. BYTT MELLOM FANENE MED MUS ELLER TASTATUR
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => {
    showResults(index === 0 ? 'all' : 'team');
  });

  tab.addEventListener('keydown', event => {
    const navigationKeys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!navigationKeys.includes(event.key)) return;
    event.preventDefault();

    // Home velger første fane, End siste. Piltastene bytter mellom de to.
    let nextIndex;
    if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = 1;
    } else {
      nextIndex = 1 - index;
    }

    showResults(nextIndex === 0 ? 'all' : 'team');
    tabs[nextIndex].focus();
  });
});

// 8. LUKK OG ÅPNE KORTET
closeButton.addEventListener('click', () => card.close());
finishButton.addEventListener('click', () => card.close());

// Åpne kortet fra starten (ukevalget).
// showModal gir dialogen fokus og hindrer klikk på innhold bak kortet.
function openPoll() {
  intro.hidden = false;
  question.hidden = true;
  selectWeek(selectedWeek);
  card.showModal();
}

// close utløses også når brukeren trykker Escape i dialogen.
card.addEventListener('close', () => {
  // Forhåndsvisningen (Spillpunkt2.html) har en knapp for å åpne kortet igjen.
  if (reopen) {
    reopen.hidden = false;
    reopen.focus();
  }

  // Kartet kan lytte etter poll:close.
  card.dispatchEvent(new CustomEvent('poll:close', { bubbles: true }));
});

if (reopen) {
  reopen.addEventListener('click', () => {
    reopen.hidden = true;
    openPoll();
  });
}

// På kartet: «Spill nå» (#poll-open) og alle lenker til #poll-game åpner meningsmålingen.
document.querySelectorAll('#poll-open, a[href="#poll-game"]').forEach(opener => {
  opener.addEventListener('click', event => {
    event.preventDefault(); // hindrer at lenken hopper/endrer adressen
    openPoll();
  });
});

// 9. OPPSTART – sett opp ukene.
selectWeek(selectedWeek);
// I forhåndsvisningen vises kortet med en gang. På kartet venter det på «Spill nå».
if (document.body.classList.contains('poll-preview')) card.showModal();
