const fs = require('fs'), vm = require('vm'), assert = require('assert');
const base = require('path').resolve(__dirname, '..') + '/';
const ctx = vm.createContext({console, Date, Math, Promise, setTimeout, clearTimeout, setInterval:()=>0, clearInterval:()=>{}, localStorage:{getItem:()=>null,setItem:()=>{}}, document:{}, URLSearchParams});
ctx.window=ctx;
for(const f of ['data/masters.js','data/adb.js','data/imgdb.js','data/baseline.js','app/engine.js','data/component.js','app/ui.js','app/pages.js','app/reference.js']) vm.runInContext(fs.readFileSync(base+f,'utf8'),ctx,{filename:f});
vm.runInContext(`Engine.boot(); window.App={S:{folds:{},sub:'',fold:()=>{}},go:()=>{},openDistrict:()=>{},setStage:()=>{},openLens:()=>{}};`,ctx);


vm.runInContext(fs.readFileSync(base+'app/dashboard-chat.js','utf8'),ctx);
const run=s=>vm.runInContext(s,ctx);
for(const d of run('D.map(d=>d.name)')){ctx.d=d;run("Engine.set({role:'comm',path:[d]})");assert(run("DashboardChat.answer('payments')").startsWith(d+': '));}
run("Engine.set({role:'dm',dm:'East Godavari',path:['Guntur']})");assert(run("DashboardChat.answer('payments')").startsWith('East Godavari: '));
run("Engine.set({path:[Engine.L.state.dm,mandalsOf(Engine.L.state.dm)[0].id]})");assert.equal(run('DashboardChat.context().level'),'Mandal');assert(run("DashboardChat.answer('payments').includes('linked')"));
run("Engine.set({path:Engine.L.state.path.concat(entsOf(Engine.L.state.path[1],'proc')[0].id)})");assert.equal(run('DashboardChat.context().level'),'Facility');for(const t of ['health','payments','procurement','processing','storage','movement','incidents','action'])assert(!/undefined|NaN/.test(run('DashboardChat.answer('+JSON.stringify(t)+')')));
run("DashboardChat.send('payments')");assert(run("DashboardChat.body().includes('farmer payment position')"));
run("Engine.set({path:[Engine.L.state.dm],chatOpen:true,rxRec:Engine.L.incRec(incidentsOf(Engine.L.state.dm)[0])})");assert.equal(run('DashboardChat.context().level'),'Record');assert(run("DashboardChat.answer('incidents').includes('Current status')"));
console.log('Passed: questions for all 28 districts, District Manager restriction, mandal, facility, record contexts and source-data answers.');
