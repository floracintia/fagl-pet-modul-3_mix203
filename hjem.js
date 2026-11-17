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
    status.textContent = 'Artikkelen er delt. 5 poeng lagt til lagpotten!';
  }

  if (window.TeamPoints.has('chatShare', articleId)) showShared();

  // Fem mynter lander etter tur. Telleren står stille ved anden, så den er lesbar.
  function animateReward(start, end) {
    cancelReward();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const elements = new Set();
    const animations = [];
    const timers = [];
    let cancelled = false;
    let received = 0;
    function addElement(className) {
      const element = document.createElement('span');
      element.className = className;
      element.setAttribute('aria-hidden', 'true');
      document.body.append(element);
      elements.add(element);
      return element;
    }
    cancelReward = () => {
      cancelled = true;
      animations.forEach(animation => animation.cancel());
      timers.forEach(clearTimeout);
      elements.forEach(element => element.remove());
      duck.classList.remove('poeng-mottatt');
    };
    const counter = addElement('mynt-teller');
    counter.style.left = `${end.right + 10}px`;
    counter.style.top = `${Math.max(12, end.top + end.height / 2 - 27)}px`;
    counter.innerHTML = '<span class="teller-mynt">★</span><span><b>+0</b><small>POENG TIL LAGET</small></span>';
    const amount = counter.querySelector('b');
    function land() {
      if (cancelled) return;
      received += 1;
      amount.textContent = `+${received}`;
      counter.classList.add('har-poeng');
      if (!reducedMotion) {
        const tick = amount.animate([
          { transform: 'translateY(5px) scale(.85)', opacity: .5 },
          { transform: 'translateY(-2px) scale(1.18)', opacity: 1, offset: .6 },
          { transform: 'translateY(0) scale(1)', opacity: 1 }
        ], { duration: 240, easing: 'ease-out' });
        tick.finished.catch(() => { /* Angre stopper også telleren. */ });
        animations.push(tick);
        duck.classList.remove('poeng-mottatt');
        void duck.offsetWidth;
        duck.classList.add('poeng-mottatt');
      }
      if (received === 5) {
        counter.classList.add('ferdig');
        timers.push(setTimeout(() => {
          counter.classList.add('forsvinner');
          timers.push(setTimeout(cancelReward, reducedMotion ? 0 : 300));
        }, 2200));
      }
    }
    if (reducedMotion) {
      received = 4;
      land();
      return;
    }
    const originX = start.left + start.width / 2;
    const originY = start.top + start.height / 2;
    const dx = end.left + end.width / 2 - originX;
    const dy = end.top + end.height / 2 - originY;
    for (let i = 0; i < 5; i += 1) {
      const coin = addElement('flyvende-mynt');
      coin.innerHTML = '<span>★</span>';
      coin.style.left = `${originX - 18}px`;
      coin.style.top = `${originY - 18}px`;
      const flight = coin.animate([
        { transform: 'translate(0, 0) scale(.5) rotate(-20deg)', opacity: 0 },
        { transform: `translate(${16 + i * 5}px, -55px) scale(1.15) rotate(15deg)`, opacity: 1, offset: .18 },
        { transform: `translate(${dx * .45}px, ${Math.min(dy, 0) - 100}px) scale(1) rotate(-15deg)`, opacity: 1, offset: .52 },
        { transform: `translate(${dx}px, ${dy}px) scale(.65) rotate(15deg)`, opacity: 1 }
      ], { duration: 1250, delay: i * 180, easing: 'ease-in-out', fill: 'both' });
      animations.push(flight);
      flight.finished.then(() => {
        coin.remove();
        elements.delete(coin);
        land();
      }).catch(() => { /* Angre avbryter mynter som fortsatt er på vei. */ });
    }
  }

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
    status.textContent = 'Artikkelen er delt. +5 poeng! Du kan angre i 10 sekunder.';
    undoTimer = setTimeout(() => {
      const undoHadFocus = document.activeElement === undo;
      undo.hidden = true;
      undoDeadline = 0;
      if (undoHadFocus) share.focus();
      status.textContent = 'Artikkelen er delt. 5 poeng lagt til lagpotten!';
    }, 10000);
    animateReward(start, end);

  });

  undo.addEventListener('click', () => {
    if (!undoDeadline || Date.now() >= undoDeadline) return;
    clearTimeout(undoTimer);
    undoDeadline = 0;
    cancelReward();
    window.TeamPoints.undoChatShare(articleId);
    undo.hidden = true;
    share.disabled = false;
    share.textContent = 'Del til Kvakkit (5p🏅)';
    dismiss.hidden = false;
    status.textContent = 'Delingen er angret. De 5 poengene er trukket tilbake.';
    share.focus();
  });

  dismiss.addEventListener('click', () => {
    share.hidden = true;
    dismiss.hidden = true;
    status.textContent = 'Helt i orden! Artikkelen er ikke delt.';
  });
})();
