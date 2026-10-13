const {JSDOM}=require('jsdom');
const fs=require('node:fs');
const path=require('node:path');
function fixture(html,script,stored={}){
  const dom=new JSDOM(html,{url:'https://pire.test',runScripts:'outside-only'});
  const {window}=dom;const pending=[];const observers=[];
  window.setTimeout=callback=>{pending.push(callback);return pending.length};
  window.requestAnimationFrame=callback=>{pending.push(callback);return pending.length};
  window.MutationObserver=class{constructor(callback){observers.push(callback)}observe(){}disconnect(){}};
  Object.defineProperty(window.document,'readyState',{value:'complete'});
  for(const [key,value] of Object.entries(stored))window.localStorage.setItem(key,value);
  window.eval(fs.readFileSync(path.join(__dirname,'../..',script),'utf8'));
  function flush(){let count=0;while(pending.length){if(++count>50)throw new Error('Unbounded scheduling');pending.shift()()}}
  flush();return {window,document:window.document,flush,mutate(){observers.forEach(callback=>callback([]));flush()},close(){window.close()}};
}
module.exports={fixture};
