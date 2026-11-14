// Fagløpet – kartet kan dras litt rundt med musen/fingeren eller flyttes med piltastene.
// Sidemenyen og headeren står fast; bare bildet inne i .kart-visning flytter seg.

const visning = document.querySelector('.kart-visning');
const bilde = document.querySelector('.kart-bilde');

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
  bilde.style.transform = `translate(${kart.x}px, ${kart.y}px) scale(${kart.skala})`;
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

// ---------- Start ----------

window.addEventListener('resize', sentrer);

if (bilde.complete) sentrer();
else bilde.addEventListener('load', sentrer);
