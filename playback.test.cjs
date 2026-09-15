const assert=require('node:assert/strict');
require('./detector.js');
const start=global.EgitimDetector.startPlayback;
(async()=>{
 let calls=0;
 const video={paused:true,ended:false,currentTime:0,async play(){calls++;}};
 const doc={querySelectorAll:selector=>selector==='video,audio'?[video]:[]};
 assert.match(await start(doc,()=>true),/başlatıldı/);
 await start(doc,()=>true); assert.equal(calls,1,'no repeated play calls');
 const paused={...video,currentTime:12};
 await start({querySelectorAll:selector=>selector==='video,audio'?[paused]:[]},()=>true);
 assert.equal(calls,1,'user pause respected');
 const rejected={...video,async play(){throw new Error('NotAllowedError');}};
 assert.match(await start({querySelectorAll:selector=>selector==='video,audio'?[rejected]:[]},()=>true),/Oynatma başlamadı/);
 console.log('Playback start, single attempt, intentional pause and rejection checks passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
