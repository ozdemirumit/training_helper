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
  const barStates = new WeakMap();
  function timerDone(text) {
    const match = (text || '').match(/(\d{1,2}:\d{2}(?::\d{2})?)\s*\/\s*(\d{1,2}:\d{2}(?::\d{2})?)/);
    const seconds = value => value.split(':').reduce((sum,n)=>sum*60+Number(n),0);
    return !!match && seconds(match[2]) > 0 && seconds(match[1]) >= seconds(match[2]);
  }
  function redColor(value) {
    const parts = (value || '').match(/[\d.]+/g)?.map(Number);
    return !!parts && parts.length >= 3 && (parts.length < 4 || parts[3] > .2) && parts[0] > 150 && parts[0] > parts[1]*1.5 && parts[0] > parts[2]*1.2;
  }
  function barInfo(next) {
    for (let bar=next.parentElement,depth=0; bar && depth<6; bar=bar.parentElement,depth++) {
      const text=bar.innerText || '';
      if (text.length>700) break;
      if (/\d+:\d+\s*\/\s*\d+:\d+/.test(text) && /(?:^|\s)\d+\s*\/\s*\d+(?:\s|$)/.test(text)) return bar;
    }
    return null;
  }
  function barReady(next,bar) {
    const text=bar.innerText || '';
    const page=text.match(/(?:^|\s)(\d+\s*\/\s*\d+)(?:\s|$)/)?.[1] || '';
    let state=barStates.get(next);
    if (!state || state.page!==page || !timerDone(text)) state={page,red:false};
    for(let node=next;node && node!==bar;node=node.parentElement) {
      const style=getComputedStyle(node);
      if(redColor(style.backgroundColor)) state.red=true;
    }
    barStates.set(next,state);
    return timerDone(text) && state.red;
  }
  function findBarNext(doc,visible) {
    const playerControl = doc.querySelector('#gonext');
    if (playerControl && visible(playerControl)) return playerControl;
    const playerArrow = doc.querySelector('#gonextImage');
    if (playerArrow && visible(playerArrow)) return playerArrow;
    const counters=[...doc.querySelectorAll('span,div,p')].filter(el=>visible(el) && /^\s*\d+\s*\/\s*\d+\s*$/.test(el.textContent || ''));
    for(const counter of counters) {
      const box=counter.getBoundingClientRect();
      const candidates=[...doc.querySelectorAll('button,a,[role="button"],[tabindex]')].filter(el=>{
        if(!visible(el)) return false;
        const rect=el.getBoundingClientRect();
        return rect.left>=box.right-2 && rect.left-box.right<90 && Math.abs((rect.top+rect.height/2)-(box.top+box.height/2))<20 && rect.width<100;
      });
      if(candidates.length===1 && barInfo(candidates[0])) return candidates[0];
    }
    return null;
  }
  const shineStates = new WeakMap();
  function shineReady(next) {
    const shine = next.querySelector('#nextShine');
    if (!shine || !shine.getClientRects().length) { shineStates.delete(next); return false; }
    const style = getComputedStyle(shine);
    if (style.display === 'none' || style.visibility !== 'visible') { shineStates.delete(next); return false; }
    if (Number(style.opacity) > 0.05) shineStates.set(next,true);
    return shineStates.get(next) === true;
  }
  globalThis.EgitimDetector = { blocked, isNext, hasHint, shortcutHint, decide, contentFinished, congratulations, closeLabel, closeTargets, completionText, clickClose, clickPlay, startPlayback, timerDone, redColor, barInfo, barReady, findBarNext, shineReady };
})();
