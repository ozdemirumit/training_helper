const status = document.querySelector('#status');
document.querySelector('#version').textContent = `v${chrome.runtime.getManifest().version}`;
let tab;
async function init() {
  [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const { session } = await chrome.storage.session.get('session');
  const related = session && [session.tabId, session.mainTabId].includes(tab.id);
  if (related) document.querySelector('#focus').checked = session.focus;
  status.textContent = session?.running && related ? 'Çalışıyor' : 'Durdu';
}
async function run(action) {
  try { await action(); } catch { status.textContent = 'Eğitim penceresini açıp sayfayı yenileyin ve tekrar deneyin.'; }
}
document.querySelector('#start').onclick = () => run(async () => {
  const result = await chrome.tabs.sendMessage(tab.id, {type:'command', action:'start', focus:document.querySelector('#focus').checked}, {frameId:0});
  if (result?.error) throw new Error(result.error);
  status.textContent = 'Çalışıyor — sayfanın tamamlanması bekleniyor.';
});
document.querySelector('#stop').onclick = () => run(async () => {
  await chrome.tabs.sendMessage(tab.id, {type:'command', action:'stop'}, {frameId:0});
  status.textContent = 'Durduruldu';
});
document.querySelector('#select').onclick = () => run(async () => {
  await chrome.tabs.sendMessage(tab.id, { type: 'pick' });
  window.close();
});
init().catch(() => { status.textContent = 'Etkin eğitim penceresi bulunamadı.'; });
