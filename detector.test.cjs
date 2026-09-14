const assert = require('node:assert/strict');
global.getComputedStyle = node => ({ pointerEvents: node.pointerEvents || 'auto' });
require('./detector.js');
const { blocked, isNext, hasHint, shortcutHint, decide } = global.EgitimDetector;
function element(attrs = {}, parentElement = null) {
  return { parentElement, className: attrs.class || '', id: attrs.id || '', title: attrs.title || '', textContent: attrs.text || '',
    getAttribute: key => attrs[key] ?? null, hasAttribute: key => key in attrs };
}
for (const attrs of [{disabled:''}, {'aria-disabled':'true'}, {'data-disabled':'true'}, {class:'ui-state-disabled'}, {class:'btn inactive'}, {class:'next_locked'}]) {
  assert.equal(blocked(element({}, element(attrs))), true, JSON.stringify(attrs));
}
assert.equal(blocked(element({class:'next enabled'})), false);
assert.equal(isNext(element({id:'unrelated-id', title:'Sonraki sayfa'})), true);
assert.equal(isNext(element({id:'player-next'})), true);
assert.equal(isNext(element({title:'Önceki sayfa'})), false);
let state = {armed:false, latched:false, lastClick:0, readySince:0};
state = decide(state, {blocked:true, now:10000});
state = decide(state, {blocked:false, now:12000});
assert.equal(state.click, false);
state = decide(state, {blocked:false, now:14000});
assert.equal(state.click, true, 'disabled to enabled advances');
state = decide(state, {blocked:false, selected:true, now:30000});
assert.equal(state.click, false, 'unchanged enabled button must not click repeatedly');
state = decide(state, {blocked:true, now:31000});
state = decide(state, {blocked:false, now:33000});
state = decide(state, {blocked:false, now:35000});
assert.equal(state.click, true, 'next disabled/enabled cycle advances');
state = {armed:false, latched:false, lastClick:0, readySince:0};
state = decide(state, {blocked:false, selected:true, now:10000});
state = decide(state, {blocked:false, selected:true, now:12000});
assert.equal(state.click, true, 'explicitly selected already enabled button advances');
console.log('Detector checks passed');
for (const attribute of ['title', 'aria-label', 'data-original-title', 'data-bs-original-title', 'data-tooltip', 'data-tooltip-content']) {
  const el = element({ [attribute]: 'İlerlemek için Ctrl + Alt + .' });
  assert.equal(isNext(el), true, attribute);
  assert.equal(hasHint(el), true, attribute);
}
assert.equal(isNext(element({title:'İlerle'})), true);
assert.equal(isNext(element({title:'İlerlet'})), true);
assert.equal(shortcutHint('Geri dönmek için Ctrl + Alt + ,'), false);
assert.equal(shortcutHint('Ctrl + Alt + .'), false, 'shortcut alone is not a forward label');
const described = element({'aria-describedby':'hint1'});
described.ownerDocument = {getElementById: id => id === 'hint1' ? {textContent:'İlerlet için ctrl+alt+.'} : null};
assert.equal(hasHint(described), true);
state = {armed:false, latched:false, lastClick:0, readySince:0};
state = decide(state, {blocked:false, selected:false, complete:false, ended:false, now:10000});
state = decide(state, {blocked:false, selected:false, complete:false, ended:false, now:20000});
assert.equal(state.click, false, 'finding a tooltip alone does not prove completion');
state = decide(state, {blocked:true, selected:true, complete:true, ended:true, now:22000});
assert.equal(state.click, false, 'disabled button wins over completion signals');
console.log('Tooltip and completion checks passed');
assert.equal(global.EgitimDetector.contentFinished('İçerik sona erdi. Bu pencereyi kapatabilirsiniz.'), true);
assert.equal(global.EgitimDetector.contentFinished('İçerik sona erdi.\n Bu pencereyi   kapatabilirsiniz'), true);
assert.equal(global.EgitimDetector.contentFinished('İçerik sona erdi.'), false);
assert.equal(global.EgitimDetector.contentFinished('Şimdi sonraki sayfaya ilerleyebilirsiniz.'), false);
console.log('End-of-content message checks passed');
