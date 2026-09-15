(() => {
  const version = chrome.runtime.getManifest().version;
  const mainPage = /\/main\/activity\//i.test(location.pathname);
  const L = EgitimLauncher;
  let session = null, chosen = null, selector = '', picking = false, hoverCandidate = null;
  let gate = { armed: false, latched: false, lastClick: 0, readySince: 0 }, busy = false;
  let previousComplete = false, previousEnded = false, lastStatus = '';
  let finishSince = 0;
  let closeClicked = false;
  let pickClose = false, closeSelection = null;
  let banner, panel, focusInput;
  const key = `next:${location.origin}${location.pathname}`;
  const visible = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  const disabled = EgitimDetector.blocked;
  const controls = 'button,a,[role="button"],input[type="button"],[onclick],[tabindex]';
  const actionable = el => el.closest(controls) || el;
  function report(text) {
    note(text);
    if (window !== window.top && text !== lastStatus) chrome.runtime.sendMessage({ type: 'progress', text }).catch(() => {});
    lastStatus = text;
  }
  function note(text) {
    if (!banner) {
      if (window === window.top) createPanel();
      else {
      banner = document.createElement('div');
      banner.style.cssText = 'position:fixed;top:8px;right:8px;z-index:2147483647;background:#17324d;color:white;padding:10px 14px;border-radius:8px;font:13px system-ui;pointer-events:none;max-width:310px';
      document.documentElement.append(banner);
      }
    }
    banner.textContent = text;
  }
  function createPanel() {
    panel = document.createElement('div');
    panel.style.cssText = 'position:fixed!important;top:8px!important;right:8px!important;z-index:2147483647!important;display:block!important';
    const root = panel.attachShadow({ mode: 'closed' });
    root.innerHTML = `<style>
      :host{all:initial}section{width:265px;background:#17324d;color:white;padding:12px;border-radius:10px;font:13px system-ui;box-shadow:0 3px 16px #0004}
      p{margin:0 0 10px}label{display:block;margin:8px 0}button{font:inherit;border:0;border-radius:5px;padding:8px;margin:3px 2px;cursor:pointer;background:#eef5ff;color:#17324d}small{display:block;line-height:1.4;margin-top:8px}
      </style><section><header style="font-weight:600;margin-bottom:10px">Eğitim İlerletici <span data-version style="font-size:12px;white-space:nowrap"></span></header><p role="status"></p><label><input type="checkbox" checked> Pencereyi önde tut</label><div><button data-action="start">Başlat</button><button data-action="stop">Durdur</button><button data-action="selectNext">İleri düğmesini seç</button></div><small>Odak açıkken eğitim yeniden öne gelir. Esc: durdur.</small></section>`;
    root.querySelector('[data-version]').textContent = `v${version}`;
    const notice = document.createElement('small');
    notice.textContent = 'Test amaçlıdır. Yalnızca izinli ortamlarda kullanın. Eğitim yükümlülükleri kullanıcıya aittir; garanti verilmez. Ayrıntılar: SORUMLULUK.md.';
    root.querySelector('section').append(notice);
    if (mainPage) root.querySelector('[data-action="selectNext"]').textContent = 'Mevcut eğitim satırını seç';
    else {
      const closePicker = document.createElement('button');
      closePicker.dataset.action = 'selectClose'; closePicker.textContent = 'Kapat düğmesini seç';
      root.querySelector('[data-action="selectNext"]').after(closePicker);
    }
    banner = root.querySelector('p');
    focusInput = root.querySelector('input');
    root.addEventListener('click', async event => {
      const button = event.target.closest('button');
      if (!button) return;
      try {
        const result = await chrome.runtime.sendMessage({ type: button.dataset.action, focus: focusInput.checked });
        if (result?.error) throw new Error(result.error);
        if (button.dataset.action !== 'selectNext') await refresh();
      } catch { note('Eklenti yenilendi. Eğitim penceresini yenileyin.'); }
    });
    focusInput.addEventListener('change', async () => {
      if (session?.running) await chrome.runtime.sendMessage({ type: 'start', focus: focusInput.checked });
    });
    document.documentElement.append(panel);
  }
  async function refresh() {
    const result = await chrome.runtime.sendMessage({ type: 'state' });
    if (result.error) throw new Error(result.error);
    const wasRunning = session?.running;
    session = result.session;
    if (focusInput && session) focusInput.checked = session.focus;
    if (!session?.running) { gate = { armed: false, latched: false, lastClick: 0, readySince: 0 }; finishSince = 0; closeClicked = false; }
    if (!wasRunning && session?.running) { gate.lastClick = Date.now(); report('Çalışıyor — ileri düğmesi kontrol ediliyor.'); }
    if (window === window.top && !picking && !session?.running) note('Durdu');
  }
  async function mainTick() {
    if (window !== window.top) return;
    if (session.phase === 'player') { note('Eğitim popup’ta sürüyor. Bitince sıradaki eğitim kontrol edilecek.'); return; }
    if (session.phase === 'opening') {
      note(Date.now() - session.launchAt > 12000 ? 'Popup açılmadı veya eşleşmedi. Sitenin Başla/Devam düğmesine bir kez basın; Chrome popup iznini kontrol edin.' : 'Eğitim popup’ı bekleniyor…');
      return;
    }
    const items = L.rows(document).filter(visible);
    let current = L.current(document, items);
    if (!current && selector) {
      const selected = document.querySelector(selector);
      current = items.find(row => row === selected || row.contains(selected) || selected?.contains(row));
    }
    if (session.phase === 'next') {
      if (Date.now() - session.finishedAt < 5000) { note('Ana sayfanın tamamlanma bilgisini güncellemesi bekleniyor.'); return; }
          const launchButtons = [...document.querySelectorAll(controls)].filter(el => visible(el) && !disabled(el) &&
            L.launchLabel(el.innerText || el.value || el.getAttribute('aria-label') || el.title));
          const detailLesson = launchButtons.length === 1 ? L.detail(launchButtons[0],document,visible) : '';
        // The platform (or user) may already have selected the next lesson.
        // A different identified detail page can launch without locating the old row.
        if (detailLesson && session.lesson && !L.sameLesson(detailLesson, session.lesson)) {
          if (launchButtons.length === 1) {
            const result = await chrome.runtime.sendMessage({type:'launching', lesson:detailLesson});
            if (result.ok) { launchButtons[0].click(); note('Yeni eğitim algılandı — popup bekleniyor.'); }
            return;
          }
        }
        const matches = items.map((row,index) => L.sameLesson(row.innerText,session.lesson) ? index : -1).filter(index => index >= 0);
        const index = matches.length === 1 ? matches[0] : -1;
        if (index < 0) { note('Ders listesi güncellenmesi bekleniyor. Yeni eğitimi açarsanız otomatik devam eder; Durdur/Başlat gerekmez.'); return; }
      if (!L.completed(items[index])) { note('Ana listedeki tamamlandı işareti bekleniyor. Minimum süre veya sayfa yenilemesi gerekebilir.'); return; }
      let next = items.slice(index + 1).find(row => !L.completed(row));
      if (!next) { note('Açık listede sıradaki eğitim yok. Diğer konu grubunu açabilirsiniz.'); return; }
      if (L.locked(next) || disabled(next)) { note('Sıradaki eğitim kilitli; açılması bekleniyor.'); return; }
      const target = next.matches(controls) ? next : next.querySelector(controls) || next;
      if (typeof target.click !== 'function') { note('Sıradaki eğitim satırı seçilemiyor.'); return; }
      const result = await chrome.runtime.sendMessage({type:'nextSelected', lesson:L.name(next.innerText)});
      if (result.ok) { target.click(); note('Sıradaki eğitim seçildi — Başla/Devam bekleniyor.'); }
      return;
    }
    if (session.phase !== 'launch') return;
      if (session.selectedAt && Date.now() - session.selectedAt < 3000) {
      note('Seçilen eğitimin ayrıntıları bekleniyor.'); return;
    }
      const buttons = [...document.querySelectorAll(controls)].filter(el => visible(el) && !disabled(el) &&
        L.launchLabel(el.innerText || el.value || el.getAttribute('aria-label') || el.title));
      if (buttons.length !== 1) { note('Tek bir Başla/Devam düğmesi bulunamadı. Eğitim ayrıntısını açın.'); return; }
      // The site's enabled launch control is sufficient to open the content.
      // Row identification is optional here; it is needed only for later list navigation.
          const detailLesson = L.detail(buttons[0],document,visible);
            if (session.selectedAt && detailLesson && !L.sameLesson(detailLesson, session.lesson)) {
          note('Yeni eğitimin başlığı yükleniyor — Başla düğmesi bekleniyor.'); return;
        }
          const lesson = session.selectedAt ? session.lesson : detailLesson || (current ? L.name(current.innerText) : session.lesson || '');
      const result = await chrome.runtime.sendMessage({type:'launching', lesson});
    if (result.ok) { buttons[0].click(); note('Başla/Devam tıklandı — popup bekleniyor.'); }
  }
  function findNext() {
    if (chosen?.isConnected && visible(chosen)) return chosen;
    if (selector) { try { const el = document.querySelector(selector); if (visible(el)) return actionable(el); } catch {} }
    if (hoverCandidate?.isConnected && visible(hoverCandidate)) return hoverCandidate;
    const candidates = [...document.querySelectorAll(`${controls},[title],[aria-label],[aria-describedby],[data-original-title],[data-bs-original-title],[data-tooltip],[data-tooltip-content],[data-title]`)]
      .filter(el => visible(el) && !el.closest('[role="tooltip"]'));
    const hint = candidates.find(EgitimDetector.hasHint);
    if (hint) return actionable(hint);
    return candidates.filter(el => el.matches(controls)).find(EgitimDetector.isNext);
  }
  // Some players create their tooltip only after real mouseover. Associate it
  // with the hovered control, never with unrelated text elsewhere on the page.
  document.addEventListener('mouseover', event => {
    if (!(event.target instanceof Element) || event.target === panel) return;
    const target = actionable(event.target);
    if (!target.matches(controls)) return;
    setTimeout(() => {
      if (!target.isConnected || !target.matches(':hover')) return;
      const ownHint = EgitimDetector.hasHint(target);
      const tooltip = [...document.querySelectorAll('[role="tooltip"],.tooltip,.ui-tooltip')]
        .some(el => visible(el) && EgitimDetector.shortcutHint(el.textContent));
      if (ownHint || tooltip) {
        hoverCandidate = target;
        if (session?.running) report('İpucundan ileri düğmesi bulundu — etkinleşmesi bekleniyor.');
      }
    }, 700);
  }, true);
  function path(el) {
    if (el.id) return `#${CSS.escape(el.id)}`;
    const parts = [];
    while (el && el !== document.documentElement) {
      const siblings = [...el.parentElement.children].filter(x => x.tagName === el.tagName);
      parts.unshift(`${el.localName}:nth-of-type(${siblings.indexOf(el) + 1})`);
      el = el.parentElement;
    }
    return 'html > ' + parts.join(' > ');
  }
  document.addEventListener('click', async event => {
    if (event.target === panel) return;
    if (!picking) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (pickClose) {
      const target = actionable(event.target);
      const rect = target.getBoundingClientRect();
      closeSelection = {selector:path(target), x:(event.clientX-rect.left)/rect.width, y:(event.clientY-rect.top)/rect.height};
      picking = false; pickClose = false; closeClicked = false;
      await chrome.storage.local.set({[key + ':close']:closeSelection});
      await chrome.runtime.sendMessage({type:'picked'});
      note('Kapat seçildi. Otomasyon çalışırken tamamlanma ekranında kullanılacak.');
      return;
    }
    chosen = mainPage ? L.rows(document).find(row => row.contains(event.target)) || actionable(event.target) : actionable(event.target);
    selector = path(chosen); picking = false;
    gate = { armed: disabled(chosen), latched: false, lastClick: Date.now(), readySince: 0 };
    await chrome.storage.local.set({ [key]: selector });
    await chrome.runtime.sendMessage({ type: 'picked' });
    note('Düğme seçildi. Sağ üstteki Başlat’a basın.');
  }, true);
  document.addEventListener('keydown', async event => {
    if (event.key !== 'Escape') return;
    picking = false;
    await chrome.runtime.sendMessage({ type: 'stop' });
    session = null;
    note('Durduruldu');
  }, true);
  chrome.runtime.onMessage.addListener((msg, sender, reply) => {
    if (msg.type === 'command' && window === window.top) {
      chrome.runtime.sendMessage({type:msg.action, focus:msg.focus}).then(reply, error => reply({error:error.message}));
      return true;
    }
    if (msg.type === 'progress' && window === window.top && session?.running && !picking) note(msg.text);
    if (msg.type === 'cancelPick') { picking = false; if (panel) note('Düğme seçimi kapandı. Başlat ile devam edebilirsiniz.'); else { if (banner) banner.remove(); banner = null; } }
    if (msg.type === 'pick') { picking = true; note(mainPage ? 'Listede şu an açık eğitimin satırına tıklayın. Esc: iptal' : 'Sağ alttaki sonraki sayfa düğmesine tıklayın. Esc: iptal'); }
    if (msg.type === 'pickClose') { picking = true; pickClose = true; note('Ekrandaki Kapat düğmesine tıklayın. Esc: iptal'); }
    if (msg.type === 'pick' || msg.type === 'cancelPick') pickClose = false;
    if (msg.type === 'refresh') refresh();
    reply({ ok: true });
  });
  chrome.storage.local.get(key).then(data => { selector = data[key] || ''; });
  chrome.storage.local.get(key + ':close').then(data => { closeSelection = data[key + ':close'] || null; });
  setInterval(async () => {
    if (busy) return;
    busy = true;
    try {
      await refresh();
      if (!session?.running || picking) return;
      if (session.role === 'main') { await mainTick(); return; }
      const text = document.body && visible(document.body) ? document.body.innerText : '';
      if (EgitimDetector.congratulations(EgitimDetector.completionText(document, visible))) {
        let selectedClose = null;
        if (closeSelection) { try { selectedClose = document.querySelector(closeSelection.selector); } catch {} }
        if (!visible(selectedClose) || (selectedClose && disabled(selectedClose))) selectedClose = null;
        const closeButtons = selectedClose ? [selectedClose] : EgitimDetector.closeTargets(document, visible);
        if (closeButtons.length === 1 && !closeClicked) {
          const result = await chrome.runtime.sendMessage({type:'prepareClose'});
          if (result.ok) {
            if (selectedClose) {
              const rect = selectedClose.getBoundingClientRect();
              selectedClose.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,composed:true,view:window,button:0,
                clientX:rect.left+rect.width*closeSelection.x,clientY:rect.top+rect.height*closeSelection.y}));
            } else EgitimDetector.clickClose(closeButtons[0]);
            closeClicked = true;
          }
        }
        report(closeClicked ? 'Kapat tıklaması gönderildi — oynatıcının kapanışı bekleniyor.' : `Bölüm tamamlandı — ${closeButtons.length} Kapat bulundu. Bulunamadıysa panelden Kapat düğmesini seçin.`);
        return;
      }
      if (EgitimDetector.contentFinished(text)) {
        if (!finishSince) finishSince = Date.now();
        report('Eğitim bitti — pencere kapatılıyor. Esc: iptal');
        if (Date.now() - finishSince >= 3000) {
          const result = await chrome.runtime.sendMessage({ type: 'contentFinished' });
          if (result?.error) report('Pencere kapatılamadı; elle kapatabilirsiniz.');
        }
        return;
      }
      finishSince = 0;
      const playbackStatus = await EgitimDetector.startPlayback(document, visible);
      if (playbackStatus) { report(playbackStatus); return; }
      if (window === window.top && session.focus) await chrome.runtime.sendMessage({ type: 'focus' });
      const next = findNext();
      if (!visible(next)) {
        if (window !== window.top || !document.querySelector('iframe')) report('İleri düğmesi bulunamadı. İleri düğmesini seç seçeneğini kullanın.');
        return;
      }
      const complete = /şimdi sonraki sayfaya ilerleyebilirsiniz/i.test(text);
      const videos = [...document.querySelectorAll('video,audio')].filter(visible);
      const ended = videos.length > 0 && videos.every(media => media.ended);
      if ((previousComplete && !complete) || (previousEnded && !ended)) gate.latched = false;
      previousComplete = complete; previousEnded = ended;
      // Do not act on assessment screens.
      if ([...document.querySelectorAll('input[type="radio"], [role="radio"]')].some(visible)) { report('Değerlendirme: yanıtınızı kendiniz seçin.'); return; }
      const blocked = disabled(next);
      const explicitlySelected = chosen === next || (!!selector && next.matches(selector));
      gate = EgitimDetector.decide(gate, { blocked, selected: explicitlySelected, complete, ended, now: Date.now() });
      if (!gate.click) {
        report(blocked ? 'İleri düğmesi pasif — anlatımın bitmesi bekleniyor.' : gate.latched ? 'İleri düğmesine tıklandı — yeni sayfa bekleniyor.' : 'İleri düğmesi bulundu — etkinlik/bitiş kontrol ediliyor.');
        return;
      }
      if (typeof next.click !== 'function') { report('İleri düğmesinin dış çerçevesini yeniden seçin.'); return; }
      if (session.focus) window.focus();
      next.click();
      report('İleri düğmesine tıklandı — yeni sayfa bekleniyor.');
    } catch (error) { if (banner) banner.textContent = 'Bağlantı kesildi; eğitim sayfasını yenileyin.'; }
    finally { busy = false; }
  }, 1500);
})();
