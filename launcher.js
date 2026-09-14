(() => {
  const normalize = text => (text || '').replace(/İ/g,'i').toLowerCase().replace(/\s+/g,' ').trim();
  const launchLabel = text => /^(?:başla|başlat|devam|devam et|eğitime başla|eğitime devam et)$/.test(normalize(text));
  const name = text => normalize(text).split(/e-eğitim|eğitim\s*[-–]|min\./)[0].trim();
  const marked = (el, pattern) => [el, ...el.querySelectorAll('[class],[title],[aria-label],[data-status]')].some(node =>
    pattern.test([node.getAttribute('class'),node.getAttribute('title'),node.getAttribute('aria-label'),node.getAttribute('data-status')].join(' ')));
  const locked = el => marked(el, /(?:^|[\s_-])(?:lock|locked|kilitli|disabled)(?:$|[\s_-])/i) ||
    [...el.querySelectorAll('.material-icons,.material-symbols-outlined')].some(n => /^lock(?:_outline)?$/.test(n.textContent.trim()));
  const completed = el => marked(el, /(?:^|[\s_-])(?:completed|complete|tamamlandı|check-circle|check_circle|fa-check|icon-check)(?:$|[\s_-])/i);
  function rows(doc) {
    const candidates = [...doc.querySelectorAll('li,tr,a,div,[role="treeitem"]')].filter(el => {
      const text = el.innerText || '';
      return text.length < 600 && /^\s*\d+(?:\.\d+)+[.\s]/.test(text) && /e-eğitim/i.test(text);
    });
    return candidates.filter(el => !candidates.some(other => other !== el && el.contains(other)));
  }
  function current(doc, items) {
    const headings = [...doc.querySelectorAll('h1,h2,h3,h4')].map(el => name(el.innerText));
    return items.find(el => el.matches('[aria-current="true"],.active,.selected') ||
      headings.some(title => title.length > 8 && name(el.innerText).startsWith(title)));
  }
  globalThis.EgitimLauncher = {normalize, launchLabel, name, locked, completed, rows, current};
})();
