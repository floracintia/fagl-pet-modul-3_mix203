// Fagløpet – stor toppliste (statistikk)
// «Se statistikk» i den lille topplisten åpner en dialog med tre faner:
// Månedens, Ditt team og Årsoversikt. Kartet bak blir uskarpt (se components.css).

const topplisteDialog = document.querySelector('#toppliste-stor');
const topplisteApne = document.querySelector('#toppliste-apne');
const topplisteLukk = topplisteDialog.querySelector('.stor-lukk');
const topplisteTittel = topplisteDialog.querySelector('#stor-tittel');
const topplisteFaner = [...topplisteDialog.querySelectorAll('[role="tab"]')];

// ---------- Bytt fane ----------

function velgFane(valgt) {
  topplisteFaner.forEach(fane => {
    const erValgt = fane === valgt;
    fane.classList.toggle('aktiv', erValgt); // lilla bakgrunn (components.css)
    fane.setAttribute('aria-selected', String(erValgt)); // for skjermlesere
    fane.tabIndex = erValgt ? 0 : -1;
    document.getElementById(fane.getAttribute('aria-controls')).hidden = !erValgt;
  });
  // Overskriften endres etter fanen (står i data-tittel i HTML)
  topplisteTittel.textContent = valgt.dataset.tittel;
}

topplisteFaner.forEach((fane, indeks) => {
  fane.addEventListener('click', () => velgFane(fane));

  // Piltaster flytter mellom fanene
  fane.addEventListener('keydown', hendelse => {
    const steg = { ArrowRight: 1, ArrowLeft: -1 }[hendelse.key];
    if (!steg) return;
    hendelse.preventDefault();
    const neste = topplisteFaner[(indeks + steg + topplisteFaner.length) % topplisteFaner.length];
    velgFane(neste);
    neste.focus();
  });
});

// ---------- Åpne og lukke ----------

topplisteApne.addEventListener('click', () => {
  velgFane(topplisteFaner[0]); // starter alltid på «Månedens»
  topplisteDialog.showModal();
});

topplisteLukk.addEventListener('click', () => topplisteDialog.close());

// Klikk på den uskarpe bakgrunnen utenfor boksen lukker også
topplisteDialog.addEventListener('click', hendelse => {
  // Bare klikk direkte på dialogen (ikke på knapper inni) kan være på bakgrunnen
  if (hendelse.target !== topplisteDialog) return;
  const boks = topplisteDialog.getBoundingClientRect();
  const utenfor = hendelse.clientX < boks.left || hendelse.clientX > boks.right ||
                  hendelse.clientY < boks.top || hendelse.clientY > boks.bottom;
  if (utenfor) topplisteDialog.close();
});
