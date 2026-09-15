let queue = Promise.resolve();
const notifyTab = (id, message) => id == null ? Promise.resolve() : chrome.tabs.sendMessage(id, message).catch(() => {});
const isPlayer = url => /\/scorm_player\.aspx(?:\?|$)/i.test(url || '');
const isMain = url => /\/main\/activity\//i.test(url || '');
async function adopt(session) {
  if (!session?.running || session.phase !== 'opening') return session;
  const parent = await chrome.tabs.get(session.mainTabId);
  const candidates = (await chrome.tabs.query({})).filter(tab => tab.openerTabId === session.mainTabId &&
    isPlayer(tab.url) && new URL(tab.url).origin === new URL(parent.url).origin);
  if (candidates.length !== 1) return session;
  session = { ...session, tabId: candidates[0].id, phase: 'player' };
  await chrome.storage.session.set({session});
  await notifyTab(session.tabId, {type:'refresh'});
  return session;
}
async function handle(msg, sender) {
  let {session} = await chrome.storage.session.get('session');
  const id = sender.tab?.id;
  if (id == null) return {};
  if (msg.type === 'start') {
    const tab = await chrome.tabs.get(id);
    if (session?.running && [session.tabId, session.mainTabId].includes(id)) session.focus = !!msg.focus;
    else session = {tabId:id, mainTabId:isMain(tab.url) ? id : null, phase:isMain(tab.url) ? 'launch' : 'player', running:true, focus:!!msg.focus};
    await chrome.storage.session.set({session});
    await notifyTab(id, {type:'refresh'});
  }
  if (msg.type === 'state') {
    session = await adopt(session);
    return {session: session && [session.tabId, session.mainTabId].includes(id) ? {...session, role:id === session.mainTabId ? 'main' : 'player'} : null};
  }
  if (msg.type === 'launching' && session?.running && id === session.mainTabId && ['launch','next'].includes(session.phase)) {
    session = {...session, phase:'opening', closingByPlayer:false, launchAt:Date.now(), lesson:msg.lesson || session.lesson || '', tabId:id};
    await chrome.storage.session.set({session});
    session = await adopt(session);
    return {ok:session.phase === 'opening'};
  }
  if (msg.type === 'nextSelected' && session?.running && id === session.mainTabId && session.phase === 'next') {
    await chrome.storage.session.set({session:{...session, phase:'launch', lesson:msg.lesson, selectedAt:Date.now()}});
    return {ok:true};
  }
  if (msg.type === 'contentFinished' && session?.running && id === session.tabId && session.phase === 'player') {
    const mainTabId = session.mainTabId;
    if (mainTabId != null) await chrome.storage.session.set({session:{...session, tabId:mainTabId, phase:'next', finishedAt:Date.now()}});
    else await chrome.storage.session.remove('session');
    await chrome.tabs.remove(id);
    if (mainTabId != null) {
      const parent = await chrome.tabs.update(mainTabId, {active:true});
      if (session.focus) await chrome.windows.update(parent.windowId, {focused:true});
      await notifyTab(mainTabId, {type:'refresh'});
    }
    return {closed:true};
  }
  if (msg.type === 'prepareClose' && session?.running && id === session.tabId && session.phase === 'player') {
    await chrome.storage.session.set({session:{...session, closingByPlayer:true}});
    return {ok:true};
  }
  if (msg.type === 'stop' && session && [session.tabId, session.mainTabId].includes(id)) {
    await chrome.storage.session.remove('session');
    for (const target of new Set([session.tabId, session.mainTabId])) {
      await notifyTab(target, {type:'cancelPick'}); await notifyTab(target, {type:'refresh'});
    }
  }
  if (msg.type === 'selectNext') await notifyTab(id, {type:'pick'});
  if (msg.type === 'selectClose') await notifyTab(id, {type:'pickClose'});
  if (msg.type === 'picked') await notifyTab(id, {type:'cancelPick'});
  if (msg.type === 'progress' && session?.running && id === session.tabId && typeof msg.text === 'string') {
    await chrome.tabs.sendMessage(id, {type:'progress', text:msg.text.slice(0,200)}, {frameId:0}).catch(() => {});
  }
  if (msg.type === 'focus' && session?.running && session.focus && id === session.tabId && session.phase === 'player') {
    await chrome.tabs.update(id, {active:true}); await chrome.windows.update(sender.tab.windowId, {focused:true});
  }
  return {};
}
chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  queue = queue.then(() => handle(msg,sender)).then(reply, error => reply({error:error.message}));
  return true;
});
chrome.tabs.onRemoved.addListener(tabId => {
  queue = queue.then(async () => {
    const {session} = await chrome.storage.session.get('session');
    if (session?.running && session.closingByPlayer && session.tabId === tabId && session.mainTabId != null) {
      const mainTabId = session.mainTabId;
      await chrome.storage.session.set({session:{...session, tabId:mainTabId, phase:'next', finishedAt:Date.now(), closingByPlayer:false}});
      const parent = await chrome.tabs.update(mainTabId,{active:true});
      if (session.focus) await chrome.windows.update(parent.windowId,{focused:true});
      await notifyTab(mainTabId,{type:'refresh'});
      return;
    }
    if (session && [session.tabId, session.mainTabId].includes(tabId)) {
      await chrome.storage.session.remove('session');
      await notifyTab(session.mainTabId, {type:'refresh'});
    }
  }).catch(() => {});
});
