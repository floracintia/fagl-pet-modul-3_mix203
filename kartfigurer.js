/* KARTFIGURER – lagene følger veien fra Fløyen til biblioteket.
   Koordinatene er prosent av kart.png, slik at figurer og kart skaleres sammen.
   Poeng, nivågrenser og eksempelmotstandere hentes fra lagpoeng.js. */
(() => {
  const container = document.querySelector('.kart-figurer');
  if (!container || !window.TeamPoints) return;
  const model = window.TeamPoints;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // 1. Punkter langs midten av veien, fra fjelltoppen til plassen foran biblioteket.
  const route = [
    [65.5, 11], [67, 13], [66.5, 14.5], [65.2, 16], [65.8, 17.5],
    [68.5, 19.5], [69, 21], [68, 23], [66, 25], [65.7, 26.5],
    [67, 28.5], [67.5, 30], [66, 31.3], [62, 32.5], [59.5, 34],
    [58.7, 35.5], [59.3, 37.5], [60.8, 40], [60.7, 42], [59, 44.5],
    [55, 47.5], [51, 50], [49, 53], [48.8, 56], [47.5, 58.5],
    [44, 61], [40, 63], [36, 66], [33, 69.5], [32, 72.5],
    [33, 75.5], [36, 78.5], [40, 80], [45, 80], [51, 78.5],
    [57, 77.8], [62, 78.7], [68, 80.7], [74, 82], [79, 82], [83, 82.5],
  ];
  // Mål lengden i kartets proporsjoner, så korte og lange segmenter får jevn fart.
  const distances = [0];
  route.slice(1).forEach((point, index) => {
    const previous = route[index];
    distances.push(distances[index] + Math.hypot(point[0] - previous[0], (point[1] - previous[1]) * 971 / 1620));
  });
  const totalDistance = distances.at(-1);

  function positionAt(progress) {
    const distance = Math.max(0, Math.min(1, progress)) * totalDistance;
    let index = 1;
    while (index < route.length - 1 && distances[index] < distance) index++;
    const fraction = (distance - distances[index - 1]) / (distances[index] - distances[index - 1]);
    return route[index - 1].map((value, axis) => value + (route[index][axis] - value) * fraction);
  }

  // 2. Opprett ett lagmerke per lag. Små sideforskyvninger gir plass til flere ender.
  const teams = [
    { name: 'Team Hufflepuffs', local: true, lane: 0 },
    ...model.demoTeams.map((team, index) => ({ ...team, imageFile: team.image, lane: [-0.6, 0.6, -0.9, 0.9][index] })),
  ];
  teams.forEach(team => {
    const element = document.createElement(team.local ? 'button' : 'span');
    element.className = `kart-figur${team.local ? ' kart-figur--lokal' : ''}`;
    if (team.local) {
      element.type = 'button';
      element.addEventListener('click', () => document.querySelector('#team-level-button').click());
    } else {
      element.tabIndex = 0;
      element.setAttribute('role', 'img');
    }
    // Piltaster på en figur skal ikke samtidig dra kartet bak den.
    element.addEventListener('keydown', event => event.stopPropagation());
    const image = document.createElement('img');
    image.alt = '';
    image.draggable = false;
    const info = document.createElement('span');
    info.className = 'kart-figur-info';
    info.setAttribute('aria-hidden', 'true');
    element.append(image, info);
    if (team.local) {
      const tag = document.createElement('span');
      tag.className = 'kart-figur-etikett';
      tag.textContent = 'Ditt lag';
      tag.setAttribute('aria-hidden', 'true');
      element.append(tag);
    }
    container.append(element);
    Object.assign(team, { element, image, info, progress: 0, animation: 0 });
  });

  function draw(team, progress) {
    team.progress = progress;
    const [x, y] = positionAt(progress);
    team.element.style.left = `${x + team.lane}%`;
    team.element.style.top = `${y}%`;
    // Dybde: liten figur ved Fløyen, større figur nær forgrunnen.
    const depth = Math.max(0, Math.min(1, (y - 11) / 71.5));
    team.element.style.width = `${1.8 + depth * 2.2}%`;
    team.element.style.zIndex = String(Math.round(y * 10));
  }

  // 3. Beveg egen figur langs veien, også gjennom svingene, ved nye poeng.
  function move(team, target, animate) {
    cancelAnimationFrame(team.animation);
    const start = team.progress;
    if (!animate || reducedMotion.matches || Math.abs(target - start) < 0.00001) {
      draw(team, target);
      return;
    }
    const started = performance.now();
    const duration = 1200;
    function frame(now) {
      const fraction = Math.min(1, (now - started) / duration);
      const eased = fraction * fraction * (3 - 2 * fraction);
      draw(team, start + (target - start) * eased);
      if (fraction < 1) team.animation = requestAnimationFrame(frame);
    }
    team.animation = requestAnimationFrame(frame);
  }

  const lastPositionKey = 'faglopet-kart-siste-fremdrift';
  let previousProgress = null;
  try {
    const saved = sessionStorage.getItem(lastPositionKey);
    if (saved !== null && Number.isFinite(Number(saved))) previousProgress = Math.max(0, Math.min(1, Number(saved)));
  } catch { /* Figuren fungerer også uten nettleserlagring. */ }

  function update(animate = true) {
    teams.forEach(team => {
      const points = team.local ? model.getStats().points : team.points;
      const journey = model.getJourney(points);
      team.image.src = team.local ? model.getAvatar(journey.level) : `bilder/toppliste/${team.imageFile}`;
      const text = `${team.name}${team.local ? ' · Ditt lag' : ' · Eksempellag'} · ${points} poeng · Nivå ${journey.level}${journey.level === 7 ? ' · I mål!' : ''}`;
      team.info.textContent = text;
      team.element.setAttribute('aria-label', text);
      move(team, journey.progress, animate && team.local);
      if (team.local) {
        try { sessionStorage.setItem(lastPositionKey, String(journey.progress)); } catch { /* Kun minne. */ }
      }
    });
  }
  // Ved retur fra biblioteket starter egen figur på sist viste sted og går frem til ny plass.
  if (previousProgress !== null) draw(teams[0], previousProgress);
  update(previousProgress !== null);
  window.addEventListener('team:updated', () => update());
  window.addEventListener('storage', () => update());
  window.addEventListener('pageshow', () => update());
  document.querySelector('#team-stats-refresh')?.addEventListener('click', () => update());
})();
