const fs = require('fs'), vm = require('vm'), assert = require('assert');
const base = require('path').resolve(__dirname, '..') + '/';
const ctx = vm.createContext({console, Date, Math, Promise, setTimeout, clearTimeout, setInterval:()=>0, clearInterval:()=>{}, localStorage:{getItem:()=>null,setItem:()=>{}}, document:{}, URLSearchParams});
ctx.window=ctx;
for(const f of ['data/masters.js','data/adb.js','data/imgdb.js','data/baseline.js','app/engine.js','data/component.js','app/ui.js','app/pages.js','app/reference.js']) vm.runInContext(fs.readFileSync(base+f,'utf8'),ctx,{filename:f});
vm.runInContext(`Engine.boot(); window.App={S:{folds:{},sub:'',fold:()=>{}},go:()=>{},openDistrict:()=>{},setStage:()=>{},openLens:()=>{}};`,ctx);

vm.runInContext(`Engine.set({role:'dm',dm:'East Godavari',path:[]});`,ctx);
assert.equal(vm.runInContext(`Engine.L.state.path[0]`,ctx),'East Godavari');
vm.runInContext(`Engine.set({path:['Guntur'],dm:'Guntur',pvDist:'Guntur'});`,ctx);
assert.equal(vm.runInContext(`Engine.L.state.dm`,ctx),'East Godavari');
assert.equal(vm.runInContext(`Engine.L.state.path[0]`,ctx),'East Godavari');
assert.equal(vm.runInContext(`Engine.L.state.pvDist`,ctx),'East Godavari');
assert.equal(vm.runInContext(`Engine.peek({path:[]}).dm`,ctx),'East Godavari');
for(const [page,module,args] of [['overview','overview',[]],['chainAll','overview',[]],['district','overview',['all']],['finance','fin',[]],['stock','overview',[]],['incidents','alerts',[]],['voice','alerts',[]],['intel','intel',[]]]){
 ctx.page=page;ctx.mod=module;ctx.args=args;
 const html=vm.runInContext(`Engine.set({module:mod,stage:'all'});Pages[page](Engine.render(),...args).body`,ctx);
 const leaks=vm.runInContext(`D.map(d=>d.name).filter(n=>n!==Engine.L.state.dm)`,ctx).filter(n=>html.includes(n));
 assert.deepEqual(leaks,[],page+' other district names');console.log('District scope: '+page);
}
for(const sub of ['overview','compare','ranking','param','reports']){
 ctx.sub=sub;
 const html=vm.runInContext(`Engine.set({module:'prep',prepView:sub});Pages.prep(Engine.render(),sub).body`,ctx);
 const leaks=vm.runInContext(`D.map(d=>d.name).filter(n=>n!==Engine.L.state.dm)`,ctx).filter(n=>html.includes(n));
 assert.deepEqual(leaks,[],sub+' preparedness other district names');console.log('District scope: preparedness '+sub);
}
console.log('District Manager path, district assignment, temporary views and report scope guards passed.');
