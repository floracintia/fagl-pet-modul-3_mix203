// Fagløpet – kartet kan dras litt rundt med musen/fingeren eller flyttes med piltastene.
// Sidemenyen og headeren står fast; bare laget inne i .kart-visning (bildet + stoppene) flytter seg.

const visning = document.querySelector('.kart-visning');
const bilde = document.querySelector('.kart-bilde');
const lag = document.querySelector('.kart-lag'); // bildet + stoppene, flyttes sammen

// Hvor mye større enn visningen kartet er – bestemmer hvor langt man kan dra (1.25 = 25 % ekstra)
const EKSTRA_PLASS = 1.25;

const kart = { skala: 1, x: 0, y: 0 };

function begrens(verdi, min, maks) {
  return Math.min(maks, Math.max(min, verdi));
}

function tegn() {
  const bredde = bilde.naturalWidth * kart.skala;
  const hoyde = bilde.naturalHeight * kart.skala;
  // Hold kartet innenfor kantene, så det aldri blir tomrom
  kart.x = begrens(kart.x, visning.clientWidth - bredde, 0);
  kart.y = begrens(kart.y, visning.clientHeight - hoyde, 0);
  // Laget får kartets størrelse, så stoppene (i prosent) havner på riktig sted,
  // men selve knappene beholder sin størrelse
  lag.style.width = `${bredde}px`;
  lag.style.height = `${hoyde}px`;
  lag.style.transform = `translate(${kart.x}px, ${kart.y}px)`;
}

// Skaler kartet så det dekker visningen med litt ekstra, sentrert sideveis og med toppen synlig
function sentrer() {
  const dekk = Math.max(visning.clientWidth / bilde.naturalWidth, visning.clientHeight / bilde.naturalHeight);
  kart.skala = dekk * EKSTRA_PLASS;
  kart.x = (visning.clientWidth - bilde.naturalWidth * kart.skala) / 2;
  kart.y = 0;
  tegn();
}

// ---------- Dra med musen (eller fingeren) ----------

let forrige = null;

visning.addEventListener('pointerdown', hendelse => {
  // Klikk på en knapp på kartet skal ikke starte dra-bevegelsen
  if (hendelse.target.closest('a, button, .kort, .toppliste')) return;
  forrige = { x: hendelse.clientX, y: hendelse.clientY };
  visning.setPointerCapture(hendelse.pointerId);
  visning.classList.add('drar');
});

visning.addEventListener('pointermove', hendelse => {
  if (!forrige) return;
  kart.x += hendelse.clientX - forrige.x;
  kart.y += hendelse.clientY - forrige.y;
  forrige = { x: hendelse.clientX, y: hendelse.clientY };
  tegn();
});

function slipp() {
  forrige = null;
  visning.classList.remove('drar');
}
visning.addEventListener('pointerup', slipp);
visning.addEventListener('pointercancel', slipp);

// ---------- To fingre på styreflaten / musehjul ----------
// Dra med to fingre på styreflaten for å flytte kartet i alle retninger.
// Med vanlig musehjul: rull = opp/ned, Shift + rull = til sidene.

visning.addEventListener('wheel', hendelse => {
  hendelse.preventDefault(); // hindrer at siden selv scroller eller zoomer

  // Klyp (pinch) på styreflaten kommer som ctrlKey + wheel. Kartet zoomer ikke, så vi ignorerer det.
  if (hendelse.ctrlKey) return;

  // Noen mus oppgir avstand i linjer i stedet for piksler
  const faktor = hendelse.deltaMode === 1 ? 16 : 1;
  let dx = hendelse.deltaX * faktor;
  let dy = hendelse.deltaY * faktor;

  // Shift + musehjul = flytt sideveis
  if (hendelse.shiftKey && dx === 0) {
    dx = dy;
    dy = 0;
  }

  kart.x -= dx;
  kart.y -= dy;
  tegn();
}, { passive: false });

// ---------- Piltaster ----------

visning.addEventListener('keydown', hendelse => {
  const steg = 60;
  const flytt = { ArrowLeft: [steg, 0], ArrowRight: [-steg, 0], ArrowUp: [0, steg], ArrowDown: [0, -steg] }[hendelse.key];
  if (!flytt) return;
  hendelse.preventDefault();
  kart.x += flytt[0];
  kart.y += flytt[1];
  tegn();
});

// ---------- Infoboks ved GameStop ----------
// Krysset skjuler boksen. Den kan vises igjen når musen har forlatt stoppet.

// Bare stopp som har en infoboks
document.querySelectorAll('.gamestop-stopp:has(.gamestop-kort)').forEach(stopp => {
  // Boksen vises til høyre, men flyttes til venstre hvis den ville gått utenfor kartet
  function velgSide() {
    const kortBredde = stopp.querySelector('.gamestop-kort').offsetWidth;
    const plassTilHoyre = visning.getBoundingClientRect().right - stopp.getBoundingClientRect().right;
    stopp.classList.toggle('til-venstre', plassTilHoyre < kortBredde);

    // Boksen står midt på knappen i høyden, men flyttes opp/ned hvis den ville gått utenfor
    const kortHoyde = stopp.querySelector('.gamestop-kort').offsetHeight;
    const midt = stopp.getBoundingClientRect().top + 57; // midten av den runde knappen
    const ramme = visning.getBoundingClientRect();
    stopp.classList.toggle('til-topp', ramme.bottom - midt < kortHoyde / 2);
    stopp.classList.toggle('til-bunn', midt - ramme.top < kortHoyde / 2);
  }
  stopp.addEventListener('mouseenter', velgSide);
  stopp.addEventListener('focusin', velgSide);

  stopp.querySelector('.kort-lukk').addEventListener('click', () => {
    stopp.classList.add('lukket');
    document.activeElement.blur();
  });
  stopp.addEventListener('mouseleave', () => stopp.classList.remove('lukket'));
});

// ---------- Start ----------

window.addEventListener('resize', sentrer);

if (bilde.complete) sentrer();
else bilde.addEventListener('load', sentrer);
