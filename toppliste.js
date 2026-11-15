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

// ---------- Lokal, dynamisk toppliste ----------
// Poengmodellen lastes med defer. Vent til den er klar før første visning.
// Motstanderne er faste eksempler; eget lag bruker samme lagring som levelhjørnet.
document.addEventListener('DOMContentLoaded', () => {
  const demoPoints = [0, 18, 12, 8, 4];
  const lists = [
    { element: document.querySelector('.toppliste-liste'), prefix: 'toppliste' },
    { element: document.querySelector('.stor-liste'), prefix: 'stor' },
  ].map(list => ({
    ...list,
    rows: [...list.element.children].map((row, index) => ({ row, index })),
  }));
  const currentMonth = document.querySelector('.aar-liste .aar-rad');

  function updateLeaderboard() {
    const stats = window.TeamPoints.getStats();
    const avatar = document.querySelector('[data-team-avatar]').getAttribute('src');
    // Behold innbyrdes rekkefølge ved lik poengsum, uten tilfeldige hopp.
    const ranking = demoPoints.map((points, index) => ({
      index, points: index === 0 ? stats.points : points,
    })).sort((a, b) => b.points - a.points || a.index - b.index);

    lists.forEach(({ element, prefix, rows }) => {
      ranking.forEach((team, position) => {
        const { row } = rows[team.index];
        const isLocal = team.index === 0;
        const rank = position + 1;
        row.classList.toggle(`${prefix}-rad--forst`, rank === 1);
        row.classList.toggle('toppliste-eget-lag', isLocal);
        const badge = row.querySelector('.toppliste-plass');
        badge.className = `toppliste-plass toppliste-plass--${rank}${prefix === 'stor' ? ' stor-plass' : ''}`;
        badge.textContent = rank;
        row.querySelector(`.${prefix}-poeng b`).textContent = team.points;
        if (isLocal) {
          row.querySelector(`.${prefix}-navn`).textContent = 'Team Hufflepuffs · Ditt lag';
          const image = row.querySelector('img');
          image.src = avatar;
          image.classList.add('toppliste-lokal-figur');
          image.removeAttribute('style');
          row.setAttribute('aria-label', `Ditt lag, Team Hufflepuffs, plass ${rank}, ${team.points} poeng`);
        }
        // Flytt eksisterende HTML-rad; illustrasjoner og øvrig innhold beholdes.
        element.append(row);
      });
    });
    // Årstotalen summerer eksempelpoeng fra tidligere måneder og lokale novemberpoeng.
    const historyPoints = [...document.querySelectorAll('[data-team-history-points]')]
      .reduce((total, month) => total + Number(month.dataset.teamHistoryPoints), 0);
    document.querySelector('[data-team-year-points]').textContent = historyPoints + stats.points;

    // Pågående måned viser lederen, mens tidligere måneder beholder eksempeldata.
    const leader = lists[1].rows[ranking[0].index].row;
    currentMonth.querySelector('.aar-lag').textContent = leader.querySelector('.stor-navn').textContent;
    const leaderImage = leader.querySelector('img');
    const yearImage = currentMonth.querySelector('.stor-and img');
    yearImage.src = leaderImage.getAttribute('src');
    yearImage.style.cssText = leaderImage.style.cssText;
    yearImage.classList.toggle('toppliste-lokal-figur', ranking[0].index === 0);
    const trophy = currentMonth.querySelector('.aar-poeng img');
    currentMonth.querySelector('.aar-poeng').replaceChildren(trophy, ` ${ranking[0].points} p`);
  }

  // «Se ditt bidrag» er foreløpig en statisk knapp uten klikkhandling.
  window.addEventListener('team:updated', updateLeaderboard);
  window.addEventListener('storage', updateLeaderboard);
  document.querySelector('#team-stats-refresh').addEventListener('click', updateLeaderboard);
  window.addEventListener('pageshow', updateLeaderboard);
  updateLeaderboard();
});
