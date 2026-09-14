(() => {
  const blocked = el => {
    for (let node = el; node; node = node.parentElement) {
      const classes = typeof node.className === 'string' ? node.className : node.getAttribute('class') || '';
      if (node.disabled === true || node.hasAttribute('disabled') || node.hasAttribute('inert') ||
          node.getAttribute('aria-disabled') === 'true' || node.getAttribute('data-disabled') === 'true' ||
          /(?:^|[\s_-])(?:disabled|inactive|locked)(?:$|[\s_-])/i.test(classes) ||
          getComputedStyle(node).pointerEvents === 'none') return true;
    }
    return false;
  };
  const forwardLabel = text => /(?:^|[\s_(-])(?:next|sonraki|ileri|ilerle|ilerlet|ilerlemek)(?:$|[\s_):.-])/u.test((text || '').replace(/İ/g, 'i').toLowerCase());
  const shortcutHint = text => forwardLabel(text) && /ctrl\s*\+\s*alt\s*\+\s*\./i.test(text || '');
  function labels(el) {
    const values = ['title', 'aria-label', 'data-original-title', 'data-bs-original-title',
      'data-tooltip', 'data-tooltip-content', 'data-title'].map(name => el.getAttribute(name));
    for (const name of ['aria-describedby', 'aria-labelledby']) {
      for (const id of (el.getAttribute(name) || '').split(/\s+/).filter(Boolean)) {
        values.push(el.ownerDocument?.getElementById(id)?.textContent);
      }
    }
    return values.filter(Boolean);
  }
  const hasHint = el => labels(el).some(shortcutHint);
  const isNext = el => [el.id, el.textContent, ...labels(el)].some(forwardLabel);
  // A click remains latched until the player actually enters another blocked/playback state.
  function decide(state, input) {
    if (input.blocked) return { ...state, armed: true, latched: false, readySince: 0, click: false };
    const ready = input.selected || state.armed || input.complete || input.ended;
    const readySince = ready ? (state.readySince || input.now) : 0;
    const click = ready && !state.latched && input.now - readySince >= 1500 && input.now - state.lastClick >= 5000;
    return { ...state, readySince, click, armed: click ? false : state.armed,
      latched: click ? true : state.latched, lastClick: click ? input.now : state.lastClick };
  }
  const contentFinished = text => (text || '').replace(/\s+/g, ' ').trim()
    .includes('İçerik sona erdi. Bu pencereyi kapatabilirsiniz');
  globalThis.EgitimDetector = { blocked, isNext, hasHint, shortcutHint, decide, contentFinished };
})();
