// Statisk chatdemo. Delingen bruker samme lokale lagpott som kartet.
(() => {
  const share = document.querySelector('#del-artikkel');
  const dismiss = document.querySelector('#avvis-deling');
  const status = document.querySelector('#deling-status');
  const undo = document.querySelector('#angre-deling');
  let undoDeadline = 0;
  let undoTimer;
  let cancelReward = () => {};
  const articleId = 'hjem-building-ai-habits';
  const duck = document.querySelector('.sidemeny .avatar');
  document.querySelector('.sokefelt input').placeholder = 'Faglig – påfyll';

  function showShared() {
    share.disabled = true;
    share.textContent = '✓ Delt til Kvakkit';
    dismiss.hidden = true;
    status.textContent = 'Artikkelen er delt. 3 poeng lagt til lagpotten!';
  }

  if (window.TeamPoints.has('chatShare', articleId)) showShared();

  share.addEventListener('click', async () => {
    if (!window.TeamPoints.award('chatShare', articleId)) {
      showShared();
      return;
    }
    const start = share.getBoundingClientRect();
    const end = duck.getBoundingClientRect();
    showShared();
    undoDeadline = Date.now() + 10000;
    undo.hidden = false;
    status.textContent = 'Artikkelen er delt. +3 poeng! Du kan angre i 10 sekunder.';
    undoTimer = setTimeout(() => {
      const undoHadFocus = document.activeElement === undo;
      undo.hidden = true;
      undoDeadline = 0;
      if (undoHadFocus) share.focus();
      status.textContent = 'Artikkelen er delt. 3 poeng lagt til lagpotten!';
    }, 10000);
    cancelReward();
    cancelReward = window.PointReward.play(start, end);

  });

  undo.addEventListener('click', () => {
    if (!undoDeadline || Date.now() >= undoDeadline) return;
    clearTimeout(undoTimer);
    undoDeadline = 0;
    cancelReward();
    const start = duck.getBoundingClientRect();
    const end = undo.getBoundingClientRect();
    window.TeamPoints.undoChatShare(articleId);
    window.PointReward.play(start, end, 3, 'subtract');
    undo.hidden = true;
    share.disabled = false;
    share.textContent = 'Del til Kvakkit (3p🏅)';
    dismiss.hidden = false;
    status.textContent = 'Delingen er angret. De 3 poengene er trukket tilbake.';
    share.focus();
  });

  dismiss.addEventListener('click', () => {
    share.hidden = true;
    dismiss.hidden = true;
    status.textContent = 'Helt i orden! Artikkelen er ikke delt.';
  });
})();
