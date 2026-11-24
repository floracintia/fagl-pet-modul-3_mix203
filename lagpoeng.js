/* LAGPOENG – felles poengmodell for kart, bibliotek og spill.
   Lokal prototype for ett lag i denne nettleseren. En delt lagkonto og
   synkronisering mellom kolleger må senere kobles til en server. */
(() => {
  const storageKey = 'faglopet-team-activity-v1';
  const rewards = { read: 1, play: 2, share: 3, chatShare: 3 };
  const thresholds = [0, 10, 25, 45, 70, 100, 140];
  // Samme eksempelmotstandere brukes på kartet og i topplisten.
  const demoTeams = [
    { name: 'AlphaOmega', points: 18, image: 'and-safari.png' },
    { name: 'Diamond', points: 12, image: 'and-rocker.png' },
    { name: 'Bezzerwizzers', points: 8, image: 'and-afterski.png' },
    { name: 'Flowerpower', points: 4, image: 'and-hawaii.png' },
  ];
  const avatarFiles = ['Property 1=Default level 1 klovn.svg', 'Property 1=level2.svg', 'Property 1=level3.svg', 'Property 1=level4.svg', 'Property 1=level5.svg', 'Property 1=level6.svg', 'Property 1=level7.svg'];
  const getAvatar = level => `assets/${avatarFiles[level - 1]}`;

  // Hvert nivå er en sjettedel av ruten. Poeng mellom nivåene gir små skritt.
  // Ved 140 poeng (nivå 7) er laget i mål; videre poeng endrer bare rangeringen.
  function getJourney(points) {
    points = Math.max(0, Number(points) || 0);
    const level = thresholds.filter(start => points >= start).length;
    const fraction = level === 7 ? 0 : (points - thresholds[level - 1]) / (thresholds[level] - thresholds[level - 1]);
    return { level, progress: Math.min(1, (level - 1 + fraction) / 6) };
  }
  let activities = {};

  // 1. LAGRING – behold aktivitet mellom besøk. Siden fungerer også uten lagring.
  function readStorage() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) activities = saved;
    } catch { /* Bruk minnet hvis nettleseren ikke tillater lokal lagring. */ }
  }
  readStorage();

  function getStats() {
    const counts = { read: 0, play: 0, share: 0, chatShare: 0 };
    Object.values(activities).forEach(type => {
      if (Object.hasOwn(rewards, type)) counts[type] += 1;
    });
    const points = counts.read + counts.play * 2 + counts.share * 3 + counts.chatShare * rewards.share;
    counts.share += counts.chatShare;
    const level = thresholds.filter(start => points >= start).length;
    const start = thresholds[level - 1];
    // Siste nivå fylles fra 140 til 199. Det finnes ikke noe nivå 8.
    const target = thresholds[level] ?? 199;
    const progress = Math.min(100, (points - start) / (target - start) * 100);
    return { counts, points, level, target, progress, remaining: Math.max(0, target - points) };
  }

  // Stabil id hindrer doble poeng ved omspilling eller av/på av «Lest».
  function award(type, id) {
    if (!Object.hasOwn(rewards, type) || typeof id !== 'string' || !id) return false;
    readStorage();
    const key = `${type}:${id}`;
    if (Object.hasOwn(activities, key)) return false;
    activities[key] = type;
    try { localStorage.setItem(storageKey, JSON.stringify(activities)); } catch { /* Kun minne. */ }
    window.dispatchEvent(new CustomEvent('team:updated'));
    return true;
  }
  // Angre bare den aktuelle chatdelingen; andre aktiviteter beholdes.
  function undoChatShare(id) {
    readStorage();
    const key = `chatShare:${id}`;
    if (!Object.hasOwn(activities, key)) return false;
    delete activities[key];
    try { localStorage.setItem(storageKey, JSON.stringify(activities)); } catch { /* Kun minne. */ }
    window.dispatchEvent(new CustomEvent('team:updated'));
    return true;
  }
  window.TeamPoints = { award, undoChatShare, getStats, getJourney, getAvatar, demoTeams, has: (type, id) => Object.hasOwn(activities, `${type}:${id}`) };

  // 2. KOMPONENTEN – markup ligger i HTML, stilene i lagpoeng.css.
  function render() {
    const stats = getStats();
    document.querySelectorAll('[data-team-level]').forEach(el => { el.textContent = `Nivå ${stats.level}`; });
    document.querySelectorAll('[data-team-points]').forEach(el => { el.textContent = stats.points; });
    document.querySelectorAll('[data-team-target]').forEach(el => { el.textContent = stats.target; });
    document.querySelectorAll('[data-team-remaining]').forEach(el => {
      el.textContent = stats.level === 7 ? 'Maksnivå nådd' : `${stats.remaining} poeng igjen`;
    });
    document.querySelectorAll('[data-team-next]').forEach(el => {
      el.textContent = stats.level === 7 ? 'Maksnivå 7' : `Nivå ${stats.level + 1}`;
    });
    document.querySelectorAll('[data-team-progress]').forEach(el => { el.value = stats.progress; });
    Object.entries(stats.counts).forEach(([type, count]) => {
      document.querySelectorAll(`[data-team-count="${type}"]`).forEach(el => { el.textContent = count; });
    });
    document.querySelectorAll('[data-team-avatar]').forEach(el => {
      el.src = getAvatar(stats.level);
    });
    const trigger = document.querySelector('#team-level-button');
    if (trigger) trigger.setAttribute('aria-label', `Lagets statistikk. Nivå ${stats.level}, ${stats.points} poeng`);
  }

  // 3. BIBLIOTEK – lesing gir 1 poeng når «Lest» hukes av.
  document.querySelectorAll('.article-card').forEach(card => {
    const checkbox = card.querySelector('.read-check');
    const id = card.querySelector('.open-link')?.getAttribute('href');
    if (!checkbox || !id) return;
    checkbox.checked = window.TeamPoints.has('read', id);
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) award('read', id);
    });
  });

  // 4. ÅPNE/LUKKE – dialog støtter også Escape og returnerer fokus til knappen.
  const dialog = document.querySelector('#team-stats');
  const trigger = document.querySelector('#team-level-button');
  trigger?.addEventListener('click', () => { render(); dialog.showModal(); });
  document.querySelector('#team-stats-close')?.addEventListener('click', () => dialog.close());
  document.querySelector('#team-stats-refresh')?.addEventListener('click', () => { readStorage(); render(); });
  dialog?.addEventListener('close', () => trigger.focus());
  window.addEventListener('team:updated', render);
  window.addEventListener('storage', event => {
    if (event.key === storageKey || event.key === null) { readStorage(); render(); }
  });
  render();
})();
