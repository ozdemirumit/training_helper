(() => {
  const normalize = text => (text || '').replace(/İ/g,'i').toLowerCase().replace(/\s+/g,' ').trim();
  const launchLabel = text => /^(?:başla|başlat|devam|devam et|eğitime başla|eğitime devam et)$/.test(normalize(text));
  const name = text => normalize(text).split(/e-eğitim|eğitim\s*[-–]|min\./)[0].trim();
  function sameLesson(a, b) {
    const left = name(a), right = name(b);
    if (!left || !right) return false;
    const code = text => text.match(/^(\d+(?:\.\d+)+)(?=[.\s]|$)/)?.[1];
    const x = code(left), y = code(right);
    return x && y ? x === y : left === right;
  }
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
  function detail(button, doc, visible) {
    // Read the course card surrounding the launch control, regardless of the
    // HTML tag used for its title. Never pick a title from the adjacent list.
    for (let parent = button?.parentElement; parent && parent !== doc.body; parent = parent.parentElement) {
      const titles = [...parent.querySelectorAll('h1,h2,h3,h4,h5,h6,div,span,strong,p')]
        .filter(el => visible(el) && /^\s*\d+(?:\.\d+)+[.\s]/.test(el.innerText || '') && (el.innerText || '').length < 350)
        .map(el => name(el.innerText));
      const unique = titles.filter((title,index) => !titles.slice(0,index).some(other => sameLesson(other,title)));
      if (unique.length === 1) return unique[0];
      if (unique.length > 1) break;
    }
    const headings = [...doc.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(el => visible(el) && /^\s*\d+(?:\.\d+)+[.\s]/.test(el.innerText || ''));
    return headings.length === 1 ? name(headings[0].innerText) : '';
  }
  globalThis.EgitimLauncher = {normalize, launchLabel, name, sameLesson, locked, completed, rows, current, detail};
})();
