/* Reference-led presentation. Every figure is read from the retained PTG model.
   The five reference images provide composition and decoration, never data. */
(function () {
  'use strict';
  const P = window.Pages, U = window.UI, E = window.Engine;
  const legacy = Object.assign({}, P), esc = U.esc, on = U.on, icon = U.icon;
  const A = () => window.App;
  const COLORS = ['var(--st-proc)', 'var(--st-cmr)', 'var(--st-stor)', 'var(--st-s1)', 'var(--st-s2)', 'var(--st-fps)'];
  const KEYS = ['proc', 'cmr', 'stor', 's1', 's2', 'fps'];
  const NAMES = ['Procurement', 'Processing (CMR)', 'Storage', 'Transportation', 'Distribution (FPS)', 'Beneficiary service'];
  const ICONS = ['sprout', 'mill', 'warehouse', 'truck', 'shop', 'family'];
  const scope = () => (E.L.state.path || [])[0] || '';
  const vals = () => scope() ? distVals(scope()) : stateVals();
  const goStage = k => { const st = k === 'fps' ? 's2' : k; if (A().S.section === 'districts' && scope()) A().setStage(st); else A().go('chain', st); };
  const panel = (title, sub, body, link, fn, cls) => U.card(U.sectionHead(title, sub, link ? U.btn(link, fn, 'xs ghost') : '') + body, 'ref-panel ' + (cls || ''));
  const details = (title, body, note) => '<details class="ref-details"><summary>' + icon('grid') + '<span>' + esc(title) + '</span><small>' + esc(note || 'KPIs, district data, entities and source records') + '</small>' + icon('chev') + '</summary><div class="detail-content">' + body + '</div></details>';
  const pool = v => E.L.kpiPool(v);
  // Use the model's public KPI opener through its generated tile, preserving full definitions and drills.
  const kpiAction = key => {
    const pp = E.peek({module: key === 'pay' || key === 'paid' ? 'fin' : 'overview', stage: 'all', pivot: false});
    const label = pool(vals())[key] && pool(vals())[key].label;
    const found = pp && pp.page.kpis.find(k => k.label === label);
    if (found && found.info) return found.info;
    return () => goStage(key === 'pay' || key === 'paid' ? 'proc' : key);
  };
  const status = v => {
    const measures = [tone(v.procPct,.95,.8),tone(v.pay24,.9,.8),tone(v.cmrPct,.6,.45),tone(v.s1Pct,.9,.8),tone(v.s2Pct,.85,.7),v.cap ? tone(v.util,.85,.93,false):'',tone(v.p1,0,2,false),tone(v.vehDev/(v.veh||1),.02,.04,false),v.cams ? tone(v.camOnline,.95,.9):''];
    const labels = ['Procurement below target','Farmer payments delayed','CMR delivery behind obligation','Stage-I movement below plan','FPS receipts below allotment','Godown capacity under pressure','Critical incidents open','GPS route exceptions','CCTV availability below target'];
    const bad = measures.filter(t=>t==='bad').length, warn=measures.filter(t=>t==='warn').length;
    const available=measures.filter(Boolean).length;
    return {tone:bad>=4?'bad':bad||warn>=3?'warn':'good',bad,warn,score:available?Math.round((available-bad-warn*.5)/available*100):null,issues:labels.filter((_,i)=>measures[i]==='bad').concat(labels.filter((_,i)=>measures[i]==='warn'))};
  };
  const words = {good:'On track',warn:'Needs monitoring',bad:'Requires attention','':'No data'};
  const legend = () => '<div class="ref-legend">' + ['good','warn','bad'].map(t=>'<span>'+U.dot(t)+words[t]+'</span>').join('')+'</div>';
  const districts = () => D.map(d=>({name:d.name,v:distVals(d.name),h:status(distVals(d.name))}));
  const METRICS = {
    overall:{label:'Overall health',value:v=>status(v).score/100,tone:v=>status(v).tone},
    procPct:{label:'Procurement',value:v=>v.procPct,tone:v=>tone(v.procPct,.95,.8)},
    cmrPct:{label:'Processing',value:v=>v.cmrPct,tone:v=>tone(v.cmrPct,.6,.45)},
    util:{label:'Stocks',value:v=>v.util,tone:v=>v.cap?tone(v.util,.85,.93,false):'',lower:true},
    s2Pct:{label:'Distribution',value:v=>v.s2Pct,tone:v=>tone(v.s2Pct,.85,.7)},
    service:{label:'Service',value:v=>v.distPct,tone:v=>tone(v.distPct,.9,.8)},
    pay24:{label:'Payments within 24 h',value:v=>v.pay24,tone:v=>tone(v.pay24,.9,.8)}
  };
  const metric = () => METRICS[A().S.refMetric] ? A().S.refMetric : 'overall';
  const metricTabs = () => U.seg(Object.keys(METRICS).filter(k=>k!=='pay24').map(k=>({label:METRICS[k].label,on:metric()===k,pick:()=>{A().S.refMetric=k;E.invalidate();}})), 'ref-tabs');
  const map = (vm, key, focus) => {
    const m=METRICS[key]||METRICS.overall, col={good:'var(--ok)',warn:'var(--watch)',bad:'var(--attn)','':'var(--nodata-bg)'};
    let box='0 0 760 649';
    if(focus && MAPD[focus]) {const ns=MAPD[focus].d.match(/-?\d+(?:\.\d+)?/g).map(Number),xs=ns.filter((_,i)=>i%2===0),ys=ns.filter((_,i)=>i%2===1);const x=Math.min(...xs),y=Math.min(...ys);box=[x-15,y-15,Math.max(...xs)-x+30,Math.max(...ys)-y+30].join(' ');}
    const paths=vm.map.tiles.filter(t=>!focus||t.name===focus).map(t=>'<path tabindex="0" role="button" aria-label="Open '+esc(t.name)+' district" d="'+t.d+'" fill="'+col[m.tone(distVals(t.name))]+'"'+on(()=>A().openDistrict(t.name))+'><title>'+esc(t.name+' · '+words[m.tone(distVals(t.name))]+' · '+pct(m.value(distVals(t.name))))+'</title></path>').join('');
    const names=focus?'<text x="'+MAPD[focus].cx+'" y="'+MAPD[focus].cy+'" class="focus-label">'+esc(focus)+'</text>':['Srikakulam','Vizianagaram','Visakhapatnam','East Godavari','Krishna','Guntur','NTR','Kurnool','YSR Kadapa','Anantapur','Chittoor','Nellore'].filter(n=>MAPD[n]).map(n=>'<text x="'+MAPD[n].cx+'" y="'+MAPD[n].cy+'">'+esc(n)+'</text>').join('');
    return '<div class="ref-map'+(focus?' focused':'')+'"><svg viewBox="'+box+'" aria-label="Andhra Pradesh district performance map">'+paths+names+'</svg><span class="map-credit">PTG district boundaries · '+esc(m.label)+'</span></div>';
  };
  const rank = (list,key,top,n) => {
    const m=METRICS[key]||METRICS.overall;
    const rows=list.slice().sort((a,b)=>(m.value(b.v)-m.value(a.v))*(m.lower?-1:1)*(top?1:-1)).slice(0,n||5);
    return '<div class="ref-ranks">'+rows.map((r,i)=>'<button class="ref-rank"'+on(()=>r.pick?r.pick():A().openDistrict(r.name))+'><span class="rank-num">'+(top?i+1:list.length-i)+'</span><span>'+esc(r.name)+'</span><span class="rank-track"><i class="'+m.tone(r.v)+'" style="width:'+Math.max(2,Math.min(100,m.value(r.v)*100))+'%"></i></span><b>'+pct(m.value(r.v))+'</b></button>').join('')+'</div>';
  };
  const headlines = (v,vm) => {
    const data=[['Paddy procurement',fmtMT(v.procured),pct(v.procPct)+' of '+fmtMT(v.target)+' target',v.procPct],['Rice processing (CMR)',fmtMT(v.cmrDel),pct(v.cmrPct)+' of '+fmtMT(v.cmrDue)+' due',v.cmrPct],['Stocks available',fmtMT(v.stock),pct(v.util)+' of capacity utilised',v.util],['Transportation',pct(v.s1Pct),'Stage-I movement against plan',v.s1Pct],['Distribution (FPS)',pct(v.s2Pct),'FPS receipts against allotment',v.s2Pct],['Beneficiary service',fmtMT(v.dist),pct(v.distPct)+' of FPS receipts distributed',v.distPct]];
    return '<div class="ref-headlines">'+data.map((x,i)=>'<button class="ref-kpi stage-'+i+'"'+on(kpiAction(KEYS[i]))+'><span class="ref-kpi-icon">'+icon(ICONS[i])+'</span><span class="ref-kpi-main"><span class="ref-kpi-label">'+esc(x[0])+'</span><strong>'+esc(x[1])+'</strong><small>'+esc(x[2])+'</small></span><span class="ref-progress"><i style="width:'+Math.min(100,x[3]*100)+'%"></i></span></button>').join('')+'</div>';
  };
  const chain = (v,photos) => {
    const data=[['Farmers & RSKs',fmtMT(v.procured)+' / '+fmtMT(v.target),pct(v.procPct)+' of target',[['Active centres',fmtN(v.ppcAct)],['Farmers registered',fmtN(v.regFarm)],['Pending payments',fmtCr(v.pending)]]],['Mills & conversion',fmtMT(v.cmrDel)+' / '+fmtMT(v.cmrDue),pct(v.cmrPct)+' of CMR due',[['Active mills',fmtN(v.millsAct)],['CMR pending',fmtMT(v.cmrShort)],['Mill anomalies',fmtN(v.millAnom)]]],['Godowns & stocks',fmtMT(v.stock),pct(v.util)+' of capacity',[['Total capacity',fmtMT(v.cap)],['Aged > 6 months',pct(v.aged/(v.stock||1))],['CCTV online',pct(v.camOnline)]]],['Movement & delivery',fmtMT(v.s1Moved),pct(v.s1Pct)+' of Stage-I plan',[['Trip completion',pct(v.tripPct)],['GPS exceptions',fmtN(v.vehDev)],['In transit',fmtN(v.transit)+' trucks']]],['FPS allocation & lifting',fmtMT(v.s2Fps),pct(v.s2Pct)+' of allotment',[['Lifted from MLS',fmtMT(v.s2Lift)],['Inspections pending',fmtN(v.insp)],['Fair price shops',fmtN(v.fps)]]],['Entitlement & grievances',fmtMT(v.dist),pct(v.distPct)+' of FPS receipts',[['Ration cards registered',fmtN(v.cards)],['Open grievances',fmtN(v.grvOpen)],['Stock-out days',fmtN(v.stockout)]]]];
    const tones=[tone(v.procPct,.95,.8),tone(v.cmrPct,.6,.45),tone(v.util,.85,.93,false),tone(v.s1Pct,.9,.8),tone(v.s2Pct,.85,.7),tone(v.distPct,.9,.8)];
    return '<div class="ref-chain '+(photos?'with-photos':'compact-chain')+'">'+data.map((x,i)=>'<button class="ref-stage stage-'+i+'"'+on(()=>goStage(KEYS[i]))+'><span class="ref-stage-head">'+icon(ICONS[i])+'<span><b>'+(i+1)+'. '+NAMES[i]+'</b><small>'+x[0]+'</small></span>'+U.dot(tones[i])+'</span>'+(photos?'<span class="stage-photo photo-'+i+'" role="img" aria-label="Illustration of '+NAMES[i]+' from the design reference"></span>':'')+'<strong>'+esc(x[1])+'</strong><small>'+esc(x[2])+'</small>'+(photos?'<span class="ref-stage-rows">'+x[3].map(r=>'<span><span>'+esc(r[0])+'</span><b>'+esc(r[1])+'</b></span>').join('')+'</span>':'')+'</button>').join('')+'</div>';
  };
  const performance = (vm) => {const key=metric(),ds=districts(),m=METRICS[key];return panel('District performance','',metricTabs()+legend()+'<div class="ref-map-ranks">'+map(vm,key)+'<div><h4>Top districts <small>('+m.label+')</small></h4>'+rank(ds,key,true,5)+'<h4>Districts to review</h4>'+rank(ds,key,false,3)+'</div></div>','View all districts →',()=>A().go('districts'));};
  const alerts = (vm) => {
    const p=vm.page;const items=(p.feed||[]).slice(0,5);
    const rows=items.map(x=>'<button class="ref-alert"'+on(x.go)+'><span class="alert-symbol '+(x.prio==='Critical'?'bad':'warn')+'">!</span><span><b>'+esc(x.title)+'</b><small>'+esc(x.meta)+'</small></span>'+icon('chev')+'</button>').join('');
    return panel('Critical alerts & interventions','Open issues · '+(scope()||'all districts'),rows||U.empty('No open issues in this view.'),'View all →',()=>A().go('incidents'),'alert-panel');
  };
  const trend = () => {
    const av=E.peek({module:'alerts',stage:'all',pivot:false});const c=av.page.itrend;
    return panel('Key trends','Incidents raised and resolved · '+c.period,U.trendBars(c)+'<div class="trend-foot"><span><b>'+esc(c.metrics[0].v)+'</b> raised</span><span><b>'+esc(c.metrics[1].v)+'</b> resolved</span><span><b>'+esc(c.metrics[2].v)+'</b> median resolution</span></div><p class="note">From the PTG incident model; historical dates include the source model’s estimates.</p>','Explore →',()=>A().go('incidents'));
  };
  const strips = v => {
    const rows=[['Financial overview', [['Farmer payments made',fmtCr(v.paid)],['Pending payments',fmtCr(v.pending)],['Miller BGs held',fmtCr(v.bg)]],'finance'],['Preparedness & compliance',[['Preparedness',pct(v.prep)],['CCTV online',pct(v.camOnline)],['Active centres',pct(v.ppcPct)]],'prep'],['Grievances & public service',[['Open grievances',fmtN(v.grvOpen)],['Category A',fmtN(v.grvA)],['FPS stock-out days',fmtN(v.stockout)]],'voice']];
    return '<div class="ref-bottom">'+rows.map((x,j)=>panel(x[0],'','<div class="ref-mini">'+x[1].map((r,i)=>'<button class="stage-'+((j*2+i)%6)+'"'+on(()=>A().go(x[2]))+'>'+icon(j===0?'rupee':j===1?'check':'voice')+'<span><b>'+esc(r[1])+'</b><small>'+esc(r[0])+'</small></span></button>').join('')+'</div>','View details →',()=>A().go(x[2]))).join('')+'</div>';
  };
  P.overview = vm => {
    const v=vals(),old=legacy.overview(vm);
    return {title:'Executive Overview',sub:'From farmer to beneficiary · state performance and priorities',rail:'',body:'<div class="reference-screen overview-screen">'+headlines(v,vm)+panel('End-to-end supply chain performance','From farmer to beneficiary · '+(scope()||'Andhra Pradesh'),chain(v,true),'View detailed value chain →',()=>A().go('chain'))+'<div class="ref-overview-grid">'+performance(vm)+trend()+alerts(vm)+'</div>'+strips(v)+'</div>'+details('Explore all operational insights',old.body,'Additional KPIs, work queue, pending quantities and district status')};
  };
  const attention = list => '<div class="tw"><table class="dt ref-attention"><thead><tr><th>District</th><th>Status</th><th>Key issues</th><th>Action status</th></tr></thead><tbody>'+list.map(x=>{
    const acts=(E.L.state.actLog||[]).filter(e=>e.dn===x.name&&e.status!=='Done');const act=acts[0];
    return '<tr><td><button class="lnk"'+on(()=>A().openDistrict(x.name))+'>'+esc(x.name)+'</button></td><td>'+U.dot(x.h.tone)+'</td><td>'+esc(x.h.issues.slice(0,2).join('; ')||'Measures within thresholds')+'</td><td><span class="astat '+(act?'on':'')+'">'+esc(act?(/Escalated/.test(act.decision)?'Intervention in progress':'Action initiated'):'No action recorded')+'</span></td></tr>';
  }).join('')+'</tbody></table></div>';
  P.districts = vm => {
    const ds=districts(),c={good:ds.filter(x=>x.h.tone==='good').length,warn:ds.filter(x=>x.h.tone==='warn').length,bad:ds.filter(x=>x.h.tone==='bad').length};
    const filter=A().S.healthFilter||'all';const rows=ds.filter(x=>filter==='all'?x.h.tone!=='good':x.h.tone===filter).sort((a,b)=>b.h.bad-a.h.bad||b.h.warn-a.h.warn);
    const cards=[['good',c.good,'Districts on track','Measures within thresholds or limited risks','map'],['warn',c.warn,'Districts need monitoring','Specific issues in one or more areas','alert'],['bad',c.bad,'Districts require attention','Four or more measures below threshold','alert'],['',ds.filter(x=>x.h.bad>=7).length,'Widespread exceptions','Seven or more measures; included in attention count','news']];
    const tiles='<div class="ref-health-tiles">'+cards.map(x=>'<button class="ref-health '+x[0]+'"'+on(()=>{A().S.healthFilter=x[0]||'bad';E.invalidate();})+'>'+icon(x[4])+'<span><strong>'+x[1]+'</strong><b>'+x[2]+'</b><small>'+x[3]+'</small></span></button>').join('')+'</div>';
    const table=panel('Districts requiring attention','',U.seg([{label:'All exceptions',on:filter==='all',pick:()=>{A().S.healthFilter='all';E.invalidate();}},{label:'Needs monitoring ('+c.warn+')',on:filter==='warn',pick:()=>{A().S.healthFilter='warn';E.invalidate();}},{label:'Requires attention ('+c.bad+')',on:filter==='bad',pick:()=>{A().S.healthFilter='bad';E.invalidate();}}])+attention(rows.slice(0,10)),'View all districts →',()=>{A().S.healthFilter='all';A().S.folds['ref.allDistricts']=true;E.invalidate();});
    const insights=panel('Key insights','Across nine operational measures','<div class="ref-insights">'+cards.map(x=>'<button'+on(()=>{A().S.healthFilter=x[0]||'bad';E.invalidate();})+'>'+icon(x[4])+'<span><b class="'+x[0]+'">'+x[1]+' '+x[2].toLowerCase()+'</b><small>'+x[3]+'</small></span></button>').join('')+'</div>');
    return {title:'District Intelligence',sub:'Overall district-wise view across the entire supply chain',rail:'',body:'<div class="reference-screen">'+tiles+'<div class="ref-two">'+panel('District supply chain health','Overall status across nine operational measures',map(vm,'overall')+legend())+table+'</div><div class="ref-three">'+insights+trend()+alerts(vm)+'</div></div><details class="ref-details"'+(A().S.folds['ref.allDistricts']?' open':'')+'><summary>'+icon('map')+'All districts · full performance and action status</summary><div class="detail-content">'+attention(ds)+'</div></details>'+details('District measures and source records',legacy.districts(vm).body)};
  };
  const stageBars = v => {
    const data=[v.procPct,v.cmrPct,v.util,v.s1Pct,v.s2Pct,v.distPct];return '<div class="ref-stage-chart"><div class="chart-lines"><span>100%</span><span>75%</span><span>50%</span><span>25%</span></div>'+data.map((n,i)=>'<button'+on(()=>goStage(KEYS[i]))+'><b>'+pct(n)+'</b><span class="chart-bar"><i style="height:'+Math.max(2,Math.min(100,n*100))+'%;background:'+COLORS[i]+'"></i></span><small>'+['Procurement','CMR','Stocks','Transport','FPS','Service'][i]+'</small></button>').join('')+'</div><p class="note">Target / due / capacity / plan / allotment / FPS receipts</p>';
  };
  const districtTabs = k => U.seg([{label:'District overview',on:k==='all',pick:()=>A().setStage('all')}].concat(KEYS.slice(0,5).map((st,i)=>({label:NAMES[i],on:k===st,pick:()=>A().setStage(st)}))).concat([{label:'Financials',pick:()=>A().openLens('finance')},{label:'Grievances',pick:()=>A().openLens('voice')},{label:'Preparedness & compliance',pick:()=>A().openLens('prep')}]),'district-tabs');
  P.district = (vm,k) => {
    const dn=scope(),v=vals();if(k!=='all'||!vm.page.isHome)return legacy.district(vm,k);
    const h=status(v),ms=mandalsOf(dn).map(m=>({name:m.name,v:m.v,pick:()=>{E.set({path:[dn,m.id],stage:'proc',module:'overview'});E.invalidate();}}));
    const dh=panel('District at a glance','Selected district boundary','<div class="ref-glance">'+map(vm,'overall',dn)+U.facts([{k:'Mandals',v:fmtN(ms.length)},{k:'Ration shops (FPS)',v:fmtN(v.fps)},{k:'Ration cards registered',v:fmtN(v.cards)},{k:'Rice mills',v:fmtN(v.mills)}])+'</div>','View mandal-wise performance →',()=>{A().S.folds['ref.mandals']=true;E.invalidate();});
    const highlights=panel('Key highlights','Priorities for district review','<div class="ref-insights">'+h.issues.slice(0,4).map((x,i)=>'<button'+on(()=>A().openLens('intel'))+'>'+icon(i===0?'alert':'bolt')+'<span><b>'+esc(x)+'</b><small>Review the measure and supporting records</small></span>'+icon('chev')+'</button>').join('')+'</div>');
    const table='<div class="tw"><table class="dt"><thead><tr><th>Stage</th><th>Reference quantity</th><th>Actual</th><th>Progress / utilisation</th></tr></thead><tbody>'+[[v.target,v.procured,v.procPct],[v.cmrDue,v.cmrDel,v.cmrPct],[v.cap,v.stock,v.util],[v.s1Plan,v.s1Moved,v.s1Pct],[v.s2Allot,v.s2Fps,v.s2Pct],[v.s2Fps,v.dist,v.distPct]].map((r,i)=>'<tr><td><button class="lnk"'+on(()=>goStage(KEYS[i]))+'>'+NAMES[i]+'</button></td><td>'+fmtMT(r[0])+'</td><td>'+fmtMT(r[1])+'</td><td>'+pct(r[2])+'</td></tr>').join('')+'</tbody></table></div>';
    const g=grievOf(dn),closed=g.filter(x=>!x.open).length;const grv=panel('Grievances','PGRS & IVRS',donut([['Resolved',closed,'var(--ok)'],['Open ≤ 7 days',g.filter(x=>x.open&&x.ageH<=168).length,'var(--watch)'],['Open > 7 days',g.filter(x=>x.open&&x.ageH>168).length,'var(--attn)']],fmtN(g.length),'grievances'), 'View register →',()=>A().openLens('voice'));
    return {title:dn,sub:'District Deep Dive · operational performance, service and interventions',rail:'',body:'<div class="reference-screen district-screen"><div class="ref-district-heading"><span class="score '+h.tone+'">Overall score: '+h.score+'%</span><span class="astat '+(h.tone==='bad'?'bad':'on')+'">'+words[h.tone]+'</span><small>Key issues: '+esc(h.issues.slice(0,3).join(' | ')||'Measures within thresholds')+'</small></div>'+headlines(v,vm)+districtTabs(k)+'<div class="ref-district-grid">'+dh+panel('Value chain performance','Progress vs each stage’s reference quantity',stageBars(v))+highlights+'</div>'+panel('Supply chain flow',dn+' · quantities from the PTG model',chain(v,false))+'<div class="ref-district-grid">'+panel('Stage-wise performance details','',table)+panel('Mandal-wise performance','Procurement achievement', '<h4>Top 5 mandals</h4>'+rank(ms,'procPct',true,5)+'<h4>Mandals to review</h4>'+rank(ms,'procPct',false,3),'View all →',()=>{A().S.folds['ref.mandals']=true;E.invalidate();})+grv+'</div></div><details class="ref-details"'+(A().S.folds['ref.mandals']?' open':'')+'><summary>'+icon('map')+'Mandal → site → source record</summary><div class="detail-content">'+rank(ms,'procPct',true,ms.length)+'</div></details>'+details('Open issues, interventions and detailed district records',legacy.district(vm,k).body)};
  };
  function donut(rows,total,label) {
    const sum=rows.reduce((a,r)=>a+r[1],0)||1;let offset=0;
    const arcs=rows.map(r=>{const n=r[1]/sum*100;const circle='<circle cx="60" cy="60" r="46" fill="none" stroke="'+r[2]+'" stroke-width="17" pathLength="100" stroke-dasharray="'+n+' '+(100-n)+'" stroke-dashoffset="'+(-offset)+'" transform="rotate(-90 60 60)"/>';offset+=n;return circle;}).join('');
    return '<div class="ref-donut"><div><svg viewBox="0 0 120 120">'+arcs+'</svg><span><b>'+esc(total)+'</b><small>'+esc(label)+'</small></span></div><ul>'+rows.map(r=>'<li><i style="background:'+r[2]+'"></i><span>'+esc(r[0])+'</span><b>'+fmtN(r[1],r[1]%1?2:0)+'</b></li>').join('')+'</ul></div>';
  }
  P.finance = vm => {
    if(E.L.state.stage!=='all')return legacy.finance(vm);
    const v=vals(),ds=scope()?districts().filter(x=>x.name===scope()):districts();let ftos=[];ds.forEach(x=>{ftos=ftos.concat(finBatches(x.name));});const pend=ftos.filter(x=>x.group!=='Credited');
    const groups={};pend.forEach(x=>{groups[x.group]=(groups[x.group]||0)+x.amt;});const colors=['var(--st-s2)','var(--st-s1)','var(--attn)','var(--st-stor)'];
    const stats=[['Procurement value',fmtCr(v.valueCr),'Paddy purchased at MSP','rupee'],['Farmer payments made',fmtCr(v.paid),pct(v.payVal)+' of procurement value','check'],['Pending farmer payments',fmtCr(v.pending),fmtN(v.farmersPend)+' farmers awaiting payment','news'],['Miller bank guarantees',fmtCr(v.bg),'Held against CMR obligations','mill'],['Payment timeliness',pct(v.pay24),'Farmers paid within 24 hours','gps']];
    const hero='<div class="ref-finance-kpis">'+stats.map((x,i)=>'<button class="ref-finance-kpi stage-'+i+'"'+on(i===2?kpiAction('pay'):i===1?kpiAction('paid'):()=>A().setStage(i===3?'cmr':'proc'))+'>'+icon(x[3])+'<span><b>'+x[0]+'</b><strong>'+x[1]+'</strong><small>'+x[2]+'</small></span></button>').join('')+'</div>';
    const flow='<div class="ref-money-flow">'+[['Procurement value',fmtCr(v.valueCr),'Paddy purchased at MSP','rupee'],['Paid to farmers',fmtCr(v.paid),pct(v.payVal)+' of value','family'],['Paid within 24 h',fmtCr(v.pay24W),'Subset of farmer payments','check'],['Pending payments',fmtCr(v.pending),fmtN(v.farmersPend)+' farmers','alert']].map((x,i)=>'<button class="stage-'+i+'"'+on(kpiAction(i===3?'pay':'paid'))+'>'+icon(x[3])+'<b>'+x[0]+'</b><strong>'+x[1]+'</strong><small>'+x[2]+'</small></button>').join('')+'</div>';
    const payRows=ds.slice().sort((a,b)=>b.v.pending-a.v.pending).slice(0,7);
    const variance='<div class="tw"><table class="dt"><thead><tr><th>District</th><th>Paid (₹ Cr)</th><th>Pending (₹ Cr)</th></tr></thead><tbody>'+payRows.map(x=>'<tr><td><button class="lnk"'+on(()=>A().openDistrict(x.name))+'>'+esc(x.name)+'</button></td><td>'+fmtN(x.v.paid,2)+'</td><td class="bad">'+fmtN(x.v.pending,2)+'</td></tr>').join('')+'</tbody></table></div>';
    const byStatus=Object.keys(groups).map((g,i)=>[g,groups[g],colors[i%4]]);
    const age=[['0–24 hours',0,24],['24–48 hours',24,48],['2–7 days',48,168],['Over 7 days',168,Infinity]].map((r,i)=>{const n=pend.filter(f=>f.hAgo>=r[1]&&f.hAgo<r[2]).length;return {label:r[0],w:n/(pend.length||1)*100,v:fmtN(n)+' FTOs',c:colors[i]};});
    const analysis=panel('Pending payments analysis','FTO register · ₹ Cr',donut(byStatus,fmtCr(pend.reduce((a,f)=>a+f.amt,0)),'uncredited FTOs')+'<h4>Ageing of uncredited FTOs</h4>'+U.bars(age)+'<p class="note">Register totals and summary payment totals are separate source measures.</p>','View FTO records →',()=>{A().S.folds['ref.finDetails']=true;E.invalidate();});
    const payBars=U.bars([['Within 24 h',v.pay24,'var(--ok)'],['24–48 h',v.pay2448,'var(--watch)'],['Over 48 h',v.payLate,'var(--attn)']].map(x=>({label:x[0],w:x[1]*100,v:pct(x[1]),c:x[2]})));
    const liabilities=U.bars([['Gunny, labour & transport',v.transPend,'var(--st-proc)'],['Miller incidental charges',v.hamPend,'var(--st-cmr)'],['Storage charges',v.storCh,'var(--st-stor)']].map(x=>({label:x[0],w:x[1]/Math.max(v.transPend,v.hamPend,v.storCh)*100,v:fmtCr(x[1]),c:x[2]})));
    const insights='<div class="ref-insights">'+[['rupee',fmtN(v.farmersPend)+' farmers awaiting payment',fmtCr(v.pending)+' pending in the summary'],['alert',ds.filter(x=>x.v.pay24<.8).length+' districts below 80% payment timeliness','Review the slowest payment districts'],['mill',fmtCr(v.bg)+' in miller bank guarantees','Review cover against outstanding CMR'],['bolt','Review pending bills and rejected FTOs','Open the supporting records before taking action']].map(x=>'<button'+on(()=>A().openLens('intel'))+'>'+icon(x[0])+'<span><b>'+x[1]+'</b><small>'+x[2]+'</small></span></button>').join('')+'</div>';
    return {title:'Financial Intelligence',sub:'Procurement payments, liabilities and financial performance across districts',rail:'',body:'<div class="reference-screen finance-screen">'+hero+'<div class="ref-finance-top">'+panel('Financial flow overview','From paddy procurement value to farmer payment · ₹ Cr',flow)+panel('Farmer payment performance','Payment time bands · share of payments',payBars,'Review payment records →',()=>{A().S.folds['ref.finDetails']=true;E.invalidate();})+'</div><div class="ref-finance-grid">'+panel('District-wise payment performance','Farmers paid within 24 hours',map(vm,'pay24')+legend())+panel('Top payment exceptions','Highest pending farmer payments',variance)+analysis+panel('Key financial indicators','Season to date',liabilities)+panel('Key insights & actions','From the available financial records',insights,'View all →',()=>A().openLens('intel'))+'</div></div><details class="ref-details"'+(A().S.folds['ref.finDetails']?' open':'')+'><summary>'+icon('rupee')+'Financial records · FTOs, charges, guarantees and district details</summary><div class="detail-content">'+legacy.finance(vm).body+'</div></details>'};
  };
  P.chainAll = vm => ({title:'Value Chain Performance',sub:'State-wide performance across the supply chain · choose a stage to investigate',rail:'',body:'<div class="reference-screen">'+headlines(vals(),vm)+panel('Value chain flow','Procurement → processing → storage → transport → FPS → beneficiary',chain(vals(),true))+panel('Performance against reference quantity','Each bar uses its stage-specific denominator',stageBars(vals()))+'</div>'+legacy.chainAll(vm).body});
  P.stock = vm => ({title:'Stock & Movement',sub:'Stock position, storage capacity and movement through the distribution chain',rail:'',body:'<div class="reference-screen">'+headlines(vals(),vm)+'<div class="ref-two">'+panel('Stock position by district','Current stock as a share of capacity',map(vm,'util')+legend(),'Explore storage →',()=>A().go('chain','stor'))+panel('Movement performance','Stage-I transport and Stage-II delivery',stageBars(vals()),'GPS exceptions →',()=>A().go('incidents','all','gps'))+'</div>'+panel('Supply chain movement','Choose a stage to view sites, trips and source records',chain(vals(),false))+'</div>'+details('Storage, movement and stock records',legacy.stage(E.peek({module:'overview',stage:'stor',pivot:false}),'stor','records').body)});
  P.guide = vm => ({title:'Dashboard Flow for the Commissioner',sub:'From state overview to insights, to action — a logical and intuitive flow',rail:'',body:'<div class="ref-journey">'+[['Executive Overview','Understand state performance and priorities','overview'],['Value Chain Performance','Identify the stage and investigate bottlenecks','chain'],['District Intelligence','Find districts requiring attention and why','districts'],['Financial Intelligence','Review payment delays, liabilities and guarantees','finance'],['District Deep Dive','Open a district, then investigate mandals and sites','districts'],['Stock & Movement','Trace stock, transport and delivery exceptions','stock'],['Service & Compliance','Review service delivery, grievances and inspections','voice'],['Decisions & Interventions','Examine evidence, record action and follow up','intel']].map((x,i)=>'<button class="journey-card"'+on(()=>i===4?A().openDistrict('Vizianagaram'):A().go(x[2]))+'><span>'+(i+1)+'</span>'+icon(['home','chain','map','rupee','map','warehouse','voice','bolt'][i])+'<h3>'+x[0]+'</h3><p>'+x[1]+'</p><small>Open view →</small></button>').join('')+'</div>'+panel('The investigation path','Every layer keeps its operational context','<div class="investigation-path"><span>State overview</span>→<span>Stage</span>→<span>District</span>→<span>Mandal</span>→<span>Site / transaction</span>→<span>Evidence & action</span></div>')});
  ['overview', 'districts', 'district', 'finance', 'chainAll', 'stock'].forEach(name => {
    const reference = P[name];
    P[name] = function (vm) {
      if (vm.sEmpty && vm.sEmpty.on) return { title: vm.sEmpty.title, sub: '', body: '', rail: '' };
      if ((E.L.state.seasons || []).length || E.L.state.season === 'custom') {
        const source = legacy[name] || legacy.chainAll;
        return source.apply(P, arguments);
      }
      return reference.apply(P, arguments);
    };
  });
})();
