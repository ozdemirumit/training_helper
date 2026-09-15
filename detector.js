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
  const congratulations = text => /tebrikler/i.test(text || '') && /bölümünü?\s+tamamladınız/i.test(text || '');
  const closeLabel = el => [el.innerText, el.textContent, el.value, el.getAttribute('aria-label'), el.title]
    .some(text => typeof text === 'string' && text.trim().toLocaleLowerCase('tr-TR') === 'kapat');
  function closeTargets(doc, visible) {
    const targets = [...doc.querySelectorAll('button,a,[role="button"],input,div,span,svg text,svg tspan,[aria-label]')]
      .filter(el => visible(el) && closeLabel(el))
      .map(el => el.closest('button,a,[role="button"],[onclick]') || el.closest('g') || el);
    const unique = [...new Set(targets)].filter(el => visible(el) && !blocked(el));
    return unique.filter(el => !unique.some(other => other !== el && other.contains(el)));
  }
  function completionText(doc, visible) {
    const svgText = [...doc.querySelectorAll('svg text,svg [aria-label]')].filter(visible)
      .map(el => el.textContent || el.getAttribute('aria-label') || '').join(' ');
    return (doc.body?.innerText || '') + ' ' + svgText;
  }
  function clickClose(el) {
    if (typeof el.click === 'function') { el.click(); return; }
    // SVG groups have no HTMLElement.click(). Dispatch a bubbling click so
    // the player's group/delegated handler can receive it.
    const rect = el.getBoundingClientRect();
    el.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, composed:true,
      view:window, clientX:rect.left+rect.width/2, clientY:rect.top+rect.height/2, button:0}));
  }
  globalThis.EgitimDetector = { blocked, isNext, hasHint, shortcutHint, decide, contentFinished, congratulations, closeLabel, closeTargets, completionText, clickClose };
})();
