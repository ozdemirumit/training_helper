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
  const closeLabel = el => [el.innerText, el.textContent, el.value, el.getAttribute('aria-label'), el.getAttribute('data-acc-text'), el.getAttribute('data-label'), el.getAttribute('alt'), el.title]
    .some(text => typeof text === 'string' && text.trim().toLocaleLowerCase('tr-TR') === 'kapat');
  function closeTargets(doc, visible) {
    const nodes = [...doc.querySelectorAll('*')];
    for (let index = 0; index < nodes.length; index++) {
      if (nodes[index].shadowRoot) nodes.push(...nodes[index].shadowRoot.querySelectorAll('*'));
    }
    const targets = nodes
      .filter(el => visible(el) && closeLabel(el))
      .map(el => {
        let target = el.closest('button,a,[role="button"],[onclick],.slide-object,.button') || el.closest('g') || el;
        // Text overlays often ignore pointer events while their enclosing shape
        // receives the click. Do not discard the label before finding that shape.
        while (target.parentElement && getComputedStyle(target).pointerEvents === 'none') target = target.parentElement;
        return target;
      }).filter(el => el !== doc.body && el !== doc.documentElement);
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
  const mediaAttempts = new WeakSet();
  const overlayAttempts = new WeakSet();
  const playbackErrors = new WeakMap();
  function clickPlay(el) {
    const rect = el.getBoundingClientRect();
    const options = {bubbles:true,cancelable:true,composed:true,view:window,
      clientX:rect.left+rect.width/2,clientY:rect.top+rect.height/2,button:0};
    if (typeof el.focus === 'function') el.focus({preventScroll:true});
    for (const type of ['pointerdown','mousedown','pointerup','mouseup','click']) {
      const pressed = type.endsWith('down');
      const event = type.startsWith('pointer') && typeof PointerEvent !== 'undefined'
        ? new PointerEvent(type,{...options,buttons:pressed?1:0,pointerId:1,pointerType:'mouse',isPrimary:true})
        : new MouseEvent(type,{...options,buttons:pressed?1:0});
      el.dispatchEvent(event);
    }
  }
  async function startPlayback(doc, visible) {
    const media = [...doc.querySelectorAll('video,audio')].filter(visible);
    if (media.some(el => !el.paused && !el.ended)) return '';
    const overlays = [...doc.querySelectorAll('.vjs-big-play-button,.mejs__overlay-button,.mejs-overlay-button,.plyr__control--overlaid,[data-plyr="play"],button,[role="button"]')]
      .filter(el => visible(el) && !blocked(el) && (el.matches('.vjs-big-play-button,.mejs__overlay-button,.mejs-overlay-button,.plyr__control--overlaid') ||
        [el.getAttribute('aria-label'),el.getAttribute('title'),el.textContent].some(text => /^(play|play video|start playback|oynat|videoyu oynat|oynatmayı başlat)$/i.test((text || '').trim()))));
    if (media.some(el => el.currentTime > 0 || el.ended)) return ''; // Respect an intentional pause; never replay finished media.
    if (overlays.length === 1 && !overlayAttempts.has(overlays[0])) {
      overlayAttempts.add(overlays[0]); clickPlay(overlays[0]);
      return 'Oynat düğmesine basıldı — oynatmanın başlaması bekleniyor.';
    }
    for (const el of media) {
      if (mediaAttempts.has(el)) {
        if (playbackErrors.has(el)) return playbackErrors.get(el);
        continue;
      }
      mediaAttempts.add(el);
      let timer;
      try {
        await Promise.race([el.play(), new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Playback timeout')),4000);})]);
        return 'Eğitim videosu başlatıldı.';
      } catch {
        const message = 'Oynatma başlamadı: tarayıcı engeli veya yükleme sorunu. Ortadaki Oynat düğmesine bir kez gerçek fareyle basın.';
        playbackErrors.set(el,message); return message;
      } finally { clearTimeout(timer); }
    }
    return '';
  }
  globalThis.EgitimDetector = { blocked, isNext, hasHint, shortcutHint, decide, contentFinished, congratulations, closeLabel, closeTargets, completionText, clickClose, clickPlay, startPlayback };
})();
