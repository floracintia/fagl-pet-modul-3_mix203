/* KVAKK! QUIZ – OPPFØRSEL
   Egen fil for spill 1. HTML inneholder strukturen, CSS styrer utseendet.
   Dette er fire eksempelspørsmål; ingen svar sendes til en server. */

// 1. ELEMENTER – id-ene viser til elementer i Spillpunkt1.html.
const quizCard = document.querySelector('.quiz-card');
const quizIntro = document.querySelector('#quiz-intro');
const quizPlay = document.querySelector('#quiz-play');
const quizResult = document.querySelector('#quiz-result');
const quizForm = document.querySelector('#quiz-form');
const quizAnswers = document.querySelector('#quiz-answers');
const quizTemplate = document.querySelector('#quiz-answer-template');
const quizQuestion = document.querySelector('#quiz-question');
const quizCounter = document.querySelector('#quiz-counter');
const quizTimer = document.querySelector('#quiz-timer');
const quizFeedback = document.querySelector('#quiz-feedback');
const quizCourse = document.querySelector('#quiz-course');
const quizRunner = document.querySelector('#quiz-runner');
const quizDuck = document.querySelector('#quiz-duck');
const quizMarkers = [...document.querySelectorAll('.quiz-markers li')];
const quizAction = document.querySelector('#quiz-action');
const quizActionLabel = document.querySelector('#quiz-action-label');
const quizActionIcon = document.querySelector('#quiz-action-icon');
const quizReopen = document.querySelector('#quiz-reopen');

// 2. SPØRSMÅL – correct er indeks: 0 = A, 1 = B, 2 = C.
const quizQuestions = [
  {
    question: 'Hva er hovedmålet med godt visuelt hierarki?',
    options: ['Skape flere farger', 'Vise hva som er viktigst', 'Fylle tomrom'],
    correct: 1,
  },
  {
    question: 'Hvorfor tester vi en prototype med brukere?',
    options: ['For å oppdage problemer tidlig', 'For å slippe å gjøre endringer', 'For å velge flest mulig funksjoner'],
    correct: 0,
  },
  {
    question: 'Hva gjør en knapp enklere å forstå?',
    options: ['At den bare har en farge', 'At den er skjult til du peker på den', 'At teksten sier hva som skjer'],
    correct: 2,
  },
  {
    question: 'Hva er et godt første steg i en designprosess?',
    options: ['Bestemme alle detaljene', 'Forstå brukernes behov', 'Lage den ferdige løsningen'],
    correct: 1,
  },
];

// 3. SPILLTILSTAND – ett poeng og ett hopp per riktig svar.
let quizIndex = 0;
let quizScore = 0;
let quizChecked = false;
let quizFinished = false;
let quizStartedAt = 0;
let quizElapsed = 0;
let quizClock = null;

// Fire ukespill. Uke 37 er et fremtidig spill i denne demonstrasjonen.
const quizCurrentWeek = 36;
const quizWeeks = [...document.querySelectorAll('.quiz-weeks button')];
quizWeeks.forEach(button => {
  button.disabled = Number(button.dataset.week) > quizCurrentWeek;
  button.addEventListener('click', () => {
    quizWeeks.forEach(week => week.setAttribute('aria-pressed', String(week === button)));
  });
});

// 4. KLOKKE – måler tid under spillet, uten noen tidsgrense.
function formatQuizTime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function updateQuizClock() {
  quizElapsed = performance.now() - quizStartedAt;
  quizTimer.textContent = formatQuizTime(quizElapsed);
}

// 5. TEGN SPØRSMÅLET – strukturen kopieres fra HTML-malen.
function renderQuizQuestion() {
  const current = quizQuestions[quizIndex];
  quizChecked = false;
  quizQuestion.textContent = current.question;
  quizCounter.textContent = `SPØRSMÅL ${String(quizIndex + 1).padStart(2, '0')} / 04`;
  quizFeedback.textContent = '';
  quizActionLabel.textContent = 'Sjekk svaret';
  quizActionIcon.textContent = '→';
  quizAction.disabled = true;

  const rows = current.options.map((text, index) => {
    const row = quizTemplate.content.firstElementChild.cloneNode(true);
    row.querySelector('input').value = index;
    row.querySelector('.quiz-letter').textContent = ['A', 'B', 'C'][index];
    row.querySelector('.quiz-answer-text').textContent = text;
    return row;
  });
  quizAnswers.replaceChildren(...rows);
  quizQuestion.focus();
  quizCard.scrollTop = 0;
}

// Bare løypeposisjonen styres av data. Form, farger og animasjon ligger i CSS.
function updateQuizCourse() {
  quizRunner.style.left = `${quizScore / quizQuestions.length * 100}%`;
  quizMarkers.forEach((marker, index) => marker.classList.toggle('is-current', index === quizScore));
  quizCourse.setAttribute('aria-label', `Anden står på steg ${quizScore} av 4`);
}

function animateQuizDuck(correct) {
  quizDuck.classList.remove('quiz-duck-hop', 'quiz-duck-shake');
  // Ny layout lar samme animasjon starte på nytt ved to like svar på rad.
  void quizDuck.offsetWidth;
  quizDuck.classList.add(correct ? 'quiz-duck-hop' : 'quiz-duck-shake');
}

// 6. START OG OMSTART – nullstill alt og vis første spørsmål.
function startQuiz() {
  clearInterval(quizClock);
  quizIndex = 0;
  quizScore = 0;
  quizElapsed = 0;
  quizFinished = false;
  quizIntro.hidden = true;
  quizResult.hidden = true;
  quizPlay.hidden = false;
  quizCourse.hidden = false;
  quizAction.hidden = false;
  quizDuck.classList.remove('quiz-duck-hop', 'quiz-duck-shake');
  // Ingen bevegelse tilbake til start når en ny runde begynner.
  quizRunner.style.transition = 'none';
  updateQuizCourse();
  void quizRunner.offsetWidth;
  quizRunner.style.removeProperty('transition');
  quizStartedAt = performance.now();
  updateQuizClock();
  quizClock = setInterval(updateQuizClock, 1000);
  renderQuizQuestion();
}

document.querySelector('#quiz-start').addEventListener('click', startQuiz);
quizForm.addEventListener('change', () => { quizAction.disabled = false; });

// 7. SJEKK SVARET – lås svarene slik at samme spørsmål ikke kan gi flere poeng.
function checkQuizAnswer() {
  const selected = quizForm.querySelector('input:checked');
  if (!selected || quizChecked) return;
  const current = quizQuestions[quizIndex];
  const selectedIndex = Number(selected.value);
  const correct = selectedIndex === current.correct;
  quizChecked = true;
  if (correct) quizScore += 1;

  [...quizAnswers.children].forEach((row, index) => {
    row.querySelector('input').disabled = true;
    const status = row.querySelector('.quiz-answer-status');
    if (index === current.correct) {
      row.classList.add('is-correct');
      status.textContent = 'Riktig svar';
    } else if (index === selectedIndex) {
      row.classList.add('is-wrong');
      status.textContent = 'Ditt svar';
    }
  });

  quizFeedback.textContent = correct
    ? 'Riktig! Anden hopper ett steg frem.'
    : 'Ikke helt! Anden blir stående. Riktig svar er markert.';
  updateQuizCourse();
  animateQuizDuck(correct);
  quizActionLabel.textContent = quizIndex === quizQuestions.length - 1 ? 'Se resultatet' : 'Neste spørsmål';
  // Flytt fokus fra den låste radioknappen til veien videre.
  quizAction.focus();
}

// 8. RESULTAT – behold anden på steget som tilsvarer antall riktige.
function finishQuiz() {
  updateQuizClock();
  clearInterval(quizClock);
  quizFinished = true;
  quizPlay.hidden = true;
  quizResult.hidden = false;
  document.querySelector('#quiz-score-text').textContent = `${quizScore} av ${quizQuestions.length} riktig`;
  document.querySelector('#quiz-final-time').textContent = `Tid: ${formatQuizTime(quizElapsed)}`;
  document.querySelector('#quiz-result-message').textContent = quizScore === 4 ? 'Full pott – anden er i mål!' : 'Aldri gi opp – prøv gjerne igjen!';
  quizActionLabel.textContent = 'Spill igjen';
  quizActionIcon.textContent = '↻';
  document.querySelector('#quiz-result-title').focus();
  quizCard.scrollTop = 0;
}

// Samme knapp sjekker svar, går videre eller starter en ny runde.
quizForm.addEventListener('submit', event => event.preventDefault());
quizAction.addEventListener('click', event => {
  event.preventDefault();
  if (quizFinished) {
    startQuiz();
  } else if (!quizChecked) {
    checkQuizAnswer();
  } else if (quizIndex < quizQuestions.length - 1) {
    quizIndex += 1;
    renderQuizQuestion();
  } else {
    finishQuiz();
  }
});

// 9. LUKKING – stopp klokken og la forhåndsvisningen åpnes på nytt.
document.querySelector('.quiz-card .game-card-close').addEventListener('click', () => quizCard.close());
quizCard.addEventListener('close', () => {
  clearInterval(quizClock);
  quizReopen.hidden = false;
  quizReopen.focus();
  quizCard.dispatchEvent(new CustomEvent('quiz:close', { bubbles: true }));
});
quizReopen.addEventListener('click', () => {
  quizReopen.hidden = true;
  quizIntro.hidden = false;
  quizPlay.hidden = true;
  quizResult.hidden = true;
  quizCourse.hidden = true;
  quizAction.hidden = true;
  quizCard.showModal();
});

// 10. OPPSTART – viser overlayet direkte i denne separate forhåndsvisningen.
quizCard.showModal();
