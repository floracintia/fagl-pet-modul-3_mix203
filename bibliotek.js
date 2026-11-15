/* BIBLIOTEK – søk, filtre, lesestatus og delingsvindu.
   Lastes etter lagpoeng.js og etter at HTML-innholdet er opprettet. */
(() => {
  // 1. DOM-elementer og lokal tilstand.
  const searchInput = document.querySelector('#article-search');
  const filters = [...document.querySelectorAll('.filter')];
  const cards = [...document.querySelectorAll('.article-card')];
  const emptyState = document.querySelector('#empty-state');
  const modal = document.querySelector('#share-modal');
  const openModalButton = document.querySelector('#open-share-modal');
  const closeModalButton = document.querySelector('#close-share-modal');
  const comment = document.querySelector('#share-comment');
  const commentCount = document.querySelector('#comment-count');
  const readStorageKey = 'faglopet-bibliotek-lesestatus';
  let readStatus = {};
  let activeCategory = 'alle';
  let activeReadFilter = 'alle';

  // 2. Gjenopprett lest-status separat for hvert artikkelkort.
  try {
    readStatus = JSON.parse(localStorage.getItem(readStorageKey) || '{}');
    if (!readStatus || typeof readStatus !== 'object' || Array.isArray(readStatus)) readStatus = {};
  } catch {
    readStatus = {};
  }
  cards.forEach((card) => {
    card.querySelector('.read-check').checked = Boolean(readStatus[card.dataset.articleId]);
  });

  // 3. Marker aktive filtre visuelt og for skjermlesere.
  function updateFilterButtons() {
    filters.forEach((button) => {
      const filter = button.dataset.filter;
      const selected = filter === 'alle'
        ? activeCategory === 'alle' && activeReadFilter === 'alle'
        : filter === 'lest'
          ? activeReadFilter === filter
          : activeCategory === filter;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }

  // 4. Et kort vises bare når det matcher søk, kategori og lest-filter samtidig.
  function updateArticles() {
    const query = searchInput.value.trim().toLocaleLowerCase('nb');
    let visibleCount = 0;
    cards.forEach((card) => {
      const text = `${card.dataset.title} ${card.textContent} ${card.dataset.tags}`.toLocaleLowerCase('nb');
      const matchesQuery = !query || text.includes(query);
      const isRead = card.querySelector('.read-check').checked;
      const matchesCategory = activeCategory === 'alle' || card.dataset.tags.split(' ').includes(activeCategory);
      const matchesRead = activeReadFilter === 'alle' || isRead;
      const visible = matchesQuery && matchesCategory && matchesRead;
      card.hidden = !visible;
      if (visible) visibleCount++;
    });
    emptyState.classList.toggle('visible', visibleCount === 0);
  }

  // 5. Brukerhandlinger: filtrering, søk og lagring av lest-status.
  // lagpoeng.js registrerer lesepoengene; her lagres selve avhukingen.
  filters.forEach((button) => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    if (filter === 'alle') {
      activeCategory = 'alle';
      activeReadFilter = 'alle';
    } else if (filter === 'lest') {
      activeReadFilter = filter;
    } else {
      activeCategory = filter;
    }
    updateFilterButtons();
    updateArticles();
  }));
  searchInput.addEventListener('input', updateArticles);
  document.querySelectorAll('.read-check').forEach((checkbox) => checkbox.addEventListener('change', () => {
    const card = checkbox.closest('.article-card');
    readStatus[card.dataset.articleId] = checkbox.checked;
    try {
      localStorage.setItem(readStorageKey, JSON.stringify(readStatus));
    } catch {
      // Lese-filteret fungerer også hvis nettleseren blokkerer lokal lagring.
    }
    updateArticles();
  }));

  // 6. Åpne og lukke delingsvinduet. Fokus returneres til deleknappen.
  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    openModalButton.focus();
  }
  openModalButton.addEventListener('click', () => {
    modal.hidden = false;
    document.body.classList.add('modal-open');
    document.querySelector('#article-url').focus();
  });
  closeModalButton.addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !modal.hidden) closeModal(); });
  comment.addEventListener('input', () => { commentCount.textContent = `${comment.value.length}/240`; });
  // 7. Deling gir 3 poeng gjennom den felles poengmodellen i lagpoeng.js.
  // Skjemaets påkrevde URL-felt valideres av nettleseren før submit.
  document.querySelector('#share-form').addEventListener('submit', (event) => {
    event.preventDefault();
    // Samme artikkellenke gir bare poeng én gang, også etter et nytt besøk.
    const articleUrl = new URL(document.querySelector('#article-url').value.trim());
    articleUrl.hash = '';
    window.TeamPoints.award('share', articleUrl.href);
    closeModal();
  });
})();
