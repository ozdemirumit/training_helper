const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
require('./launcher.js');
const source = fs.readFileSync('content.js', 'utf8');
const start = source.indexOf('  async function mainTick()');
const end = source.indexOf('  function findNext()', start);
async function scenario(labels, blocked = false, sessionExtra = {}, headingText = '') {
  let clicks = 0, messages = [];
  const buttons = labels.map(innerText => ({innerText, click(){clicks++;}}));
  const win = {}; win.top = win;
  const context = {window:win, session:{phase:'launch',...sessionExtra}, selector:'', controls:'button',
    L:{...global.EgitimLauncher, rows:()=>[], current:()=>null},
    visible:()=>true, disabled:()=>blocked, note:()=>{},
    document:{querySelectorAll:selector=>selector==='button'?buttons:headingText?[{innerText:headingText}]:[]},
    chrome:{runtime:{async sendMessage(msg){messages.push(msg);return {ok:true};}}}};
  await vm.runInNewContext(source.slice(start,end) + '\nmainTick();', context);
  return {clicks,messages};
}
(async()=>{
  const result = await scenario(['Devam']);
  assert.equal(result.clicks,1,'Devam opens without a recognized course row');
  assert.equal(result.messages[0].type,'launching');
  assert.equal((await scenario(['Başla'])).clicks,1);
  assert.equal((await scenario(['Devam'],true)).clicks,0,'disabled launch is not clicked');
  assert.equal((await scenario(['Devam','Başla'])).clicks,0,'ambiguous controls are not clicked');
  assert.equal((await scenario(['Kaydet'])).clicks,0);
  const next = {selectedAt:Date.now()-10000, lesson:'2.3.yeni eğitim'};
  const nextResult = await scenario(['Başla'],false,next);
  assert.equal(nextResult.clicks,1,'next course launches without rediscovering its list row');
  assert.equal(nextResult.messages[0].lesson,next.lesson,'selected course identity is retained');
  assert.equal((await scenario(['Başla'],false,{...next,selectedAt:Date.now()})).clicks,0,'wait for new details to load');
  assert.equal((await scenario(['Başla'],false,next,'2.2.Eski eğitim')).clicks,0,'old visible heading must not be launched');
  assert.equal((await scenario(['Başla'],false,next,'2.3.Yeni eğitim')).clicks,1);
  console.log('Main-page launch without course row checks passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
