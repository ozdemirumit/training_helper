const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
let listener, session, removed = [], notifications = [], onRemoved;
let tabs = [{id:1,url:'https://tomdigital.myenocta.com/tomdigital/eep/main/activity/1069',windowId:10}];
const chrome = {
 runtime:{onMessage:{addListener(fn){listener=fn;}}},
 storage:{session:{async get(){return {session};},async set(value){session=value.session;},async remove(){session=undefined;}}},
 tabs:{onRemoved:{addListener(fn){onRemoved=fn;}},async get(id){return tabs.find(t=>t.id===id);},async query(){return tabs;},async remove(id){removed.push(id);},async update(id){return tabs.find(t=>t.id===id);},async sendMessage(id,msg){notifications.push([id,msg.type]);}},
 windows:{async update(){}}
};
vm.runInNewContext(fs.readFileSync('background.js','utf8'),{chrome,URL,Date,Set});
const send=(type,id=1,extra={})=>new Promise(resolve=>listener({type,...extra},{tab:tabs.find(t=>t.id===id)||{id}},resolve));
(async()=>{
 await send('start',1,{focus:true}); assert.equal(session.phase,'launch');
 await send('launching',1,{lesson:'2.2.test'}); assert.equal(session.phase,'opening');
 tabs.push({id:7,openerTabId:99,url:'https://tomdigital.myenocta.com/tomdigital/eep/scorm_player.aspx?pageID=3',windowId:20});
 assert.equal((await send('state',7)).session,null,'unrelated popup is not adopted');
 tabs.push({id:42,openerTabId:1,url:'https://tomdigital.myenocta.com/tomdigital/eep/scorm_player.aspx?pageID=4',windowId:30});
 assert.equal((await send('state',42)).session.role,'player'); assert.equal(session.tabId,42);
 assert.equal((await send('state',1)).session.role,'main');
 await send('contentFinished',7); assert.deepEqual(removed,[]);
 await send('contentFinished',42); assert.deepEqual(removed,[42]); assert.equal(session.phase,'next'); assert.equal(session.tabId,1);
 tabs=tabs.filter(t=>t.id!==42);
 await send('nextSelected',1,{lesson:'2.3.test'}); assert.equal(session.phase,'launch');
 await send('launching',1,{lesson:'2.3.test'}); assert.equal(session.phase,'opening');
 tabs.push({id:43,openerTabId:1,url:'https://tomdigital.myenocta.com/tomdigital/eep/scorm_player.aspx?pageID=5',windowId:31});
 await send('state',43); await send('stop',1); assert.equal(session,undefined);
 assert.ok(notifications.some(([id,type])=>id===43&&type==='cancelPick'));
 await send('contentFinished',43); assert.deepEqual(removed,[42],'stopped session cannot close popup');
 await send('start',1,{focus:true});
 const result=await send('launching',1,{lesson:'2.3.test'}); assert.equal(result.ok,false,'existing popup prevents another launch click');
 assert.equal(session.tabId,43);
 await send('prepareClose',43); onRemoved(43); await send('state',1);
 assert.equal(session.phase,'next','player close resumes main workflow');
 assert.equal(session.tabId,1);
 console.log('Main/popup handoff, unrelated popup, completion, next lesson, stop and duplicate launch checks passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
