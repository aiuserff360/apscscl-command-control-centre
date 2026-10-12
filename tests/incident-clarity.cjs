const fs = require('fs'), vm = require('vm'), assert = require('assert');
const base = require('path').resolve(__dirname, '..') + '/';
const ctx = vm.createContext({console, Date, Math, Promise, setTimeout, clearTimeout, setInterval:()=>0, clearInterval:()=>{}, localStorage:{getItem:()=>null,setItem:()=>{}}, document:{}, URLSearchParams});
ctx.window=ctx;
for(const f of ['data/masters.js','data/adb.js','data/imgdb.js','data/baseline.js','app/engine.js','data/component.js','app/ui.js','app/pages.js','app/reference.js']) vm.runInContext(fs.readFileSync(base+f,'utf8'),ctx,{filename:f});
vm.runInContext(`Engine.boot(); window.App={S:{folds:{},sub:'',fold:()=>{}},go:()=>{},openDistrict:()=>{},setStage:()=>{},openLens:()=>{}};`,ctx);


vm.runInContext(`Engine.set({module:'alerts',stage:'all',path:[]});App.S.folds['inc.chain']=true;`,ctx);
let page=vm.runInContext('Engine.render().page',ctx);
let html=vm.runInContext("Pages.incidents(Engine.render()).body",ctx);
const cards=[...html.matchAll(/<button class="chs (?:place|move|hand|gate)"[^>]*>([\s\S]*?)<\/button>/g)];
assert.equal(cards.length,page.chain.stepT.rows.length);
page.chain.stepT.rows.forEach((row,i)=>{const c=row.cells,card=cards[i][1];if(/^\d[\d,]*$/.test(String(c[2].v))){assert(card.includes('<b>'+c[2].v+'</b>'),'incident count');assert(card.includes(c[3].v+' critical incidents'),'critical count');}else{assert(card.includes('Not available'));assert(!card.includes('critical incidents'));}assert(card.includes('chain-explanation'));});
assert(!html.includes('Off the chain'));assert(!html.includes('no data yet critical'));assert(!html.includes('stock point point'));assert(html.includes('A repeated identifier alone does not establish misconduct'));
vm.runInContext(`Engine.set({path:['East Godavari']});`,ctx);html=vm.runInContext('Pages.incidents(Engine.render()).body',ctx);assert(!html.includes('28 districts'));
console.log('Passed: incident/rule/critical column mapping, missing-data semantics, step explanations, district context and clear monitoring descriptions.');
