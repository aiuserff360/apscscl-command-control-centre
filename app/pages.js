/* Page renderers: each returns { title, sub, body, rail } built from the baseline view-model. */
window.Pages = (function () {
  'use strict';
  const E = window.Engine, U = window.UI, esc = U.esc, on = U.on, icon = U.icon, card = U.card, sh = U.sectionHead;
  const SM = U.STAGE_META;
  const STAGE_KEYS = ['proc', 'cmr', 's1', 's2', 'stor'];
  const GLANCE_OF = { proc: 'rsk', cmr: 'mill', stor: 'godown', s2: 'mls', s1: 'mls' };
  const fnOf = function (o) { for (let i = 1; i < arguments.length; i++) { if (o && typeof o[arguments[i]] === 'function') return o[arguments[i]]; } for (const k in o) if (typeof o[k] === 'function') return o[k]; return null; };
  const A = function () { return window.App; };


  /* ---------- Reference-layout building blocks ---------- */
  const TONE_WORD = { good: 'On track', warn: 'At risk', bad: 'Needs attention', '': 'No data' };
  const MAP_TONE = { procPct: function (v) { return tone(v.procPct, 0.95, 0.8); }, pay24: function (v) { return tone(v.pay24, 0.9, 0.8); }, cmrPct: function (v) { return tone(v.cmrPct, 0.6, 0.45); }, util: function (v) { return v.cap ? tone(v.util, 0.85, 0.93, false) : ''; }, s2Pct: function (v) { return tone(v.s2Pct, 0.85, 0.7); }, alerts: function (v) { return tone(v.p1, 0, 2, false); }, prep: function (v) { return v.prepNA ? '' : tone(v.prep, 0.7, 0.5); } };
  const MAP_VAL = { procPct: function (v) { return v.procPct; }, pay24: function (v) { return v.pay24; }, cmrPct: function (v) { return v.cmrPct; }, util: function (v) { return v.cap ? v.util : null; }, s2Pct: function (v) { return v.s2Pct; }, alerts: function (v) { return v.alerts; }, prep: function (v) { return v.prepNA ? null : v.prep; } };
  const MAP_FMT = { alerts: function (x) { return fmtN(x); } };
  const ABBR = {}; D.forEach(function (d) { ABBR[d.name] = d.abbr; });
  const scopeVals = function () { const dn = (E.L.state.path || [])[0]; return dn ? distVals(dn) : stateVals(); };
  // Overall district health: how many of the 9 overview measures sit below threshold.
  const MEASURES = [['Procurement vs target', function (v) { return tone(v.procPct, 0.95, 0.8); }], ['Farmers paid within 24 h', function (v) { return tone(v.pay24, 0.9, 0.8); }], ['CMR delivered', function (v) { return tone(v.cmrPct, 0.6, 0.45); }], ['Stage-I moved', function (v) { return tone(v.s1Pct, 0.9, 0.8); }], ['Stage-II to FPS', function (v) { return tone(v.s2Pct, 0.85, 0.7); }], ['Godown utilisation', function (v) { return v.cap ? tone(v.util, 0.85, 0.93, false) : ''; }], ['Critical incidents', function (v) { return tone(v.p1, 0, 2, false); }], ['GPS route deviations', function (v) { return tone(v.vehDev / (v.veh || 1), 0.02, 0.04, false); }], ['CCTV online', function (v) { return v.cams ? tone(v.camOnline, 0.95, 0.9) : ''; }]];
  const health = function (v) { const bad = [], warn = []; MEASURES.forEach(function (m) { const t = m[1](v); if (t === 'bad') bad.push(m[0]); else if (t === 'warn') warn.push(m[0]); }); const status = bad.length >= 4 ? 'bad' : (bad.length || warn.length >= 3) ? 'warn' : 'good'; return { bad: bad, warn: warn, status: status, score: Math.round((MEASURES.length - bad.length - warn.length * 0.5) / MEASURES.length * 100) }; };
  const districtHealth = function () { return D.map(function (d) { const v = distVals(d.name); const h = health(v); return { name: d.name, v: v, h: h }; }); };
  const openDecisionsFor = function (dn) { return (E.L.state.actLog || []).filter(function (e) { return e.dn === dn && e.status !== 'Done'; }); };
  const actionStatus = function (dn) { const l = openDecisionsFor(dn); if (!l.length) return ['No action recorded', '']; const e = l[0]; return [/Escalated/.test(e.decision) ? 'Intervention in progress' : 'Action initiated', e.decision]; };

  // Six value-chain stage tiles in the physical order of the chain.
  const chainTiles = function (v, inDistrict) {
    const pool = E.L.kpiPool(v);
    const T = [
      { n: '1', t: 'Procurement', s: 'Farmers & RSKs', ico: 'sprout', head: fmtMT(v.procured) + ' / ' + fmtMT(v.target), sub: pct(v.procPct) + ' of target', tone: tone(v.procPct, 0.95, 0.8), rows: [['Active centres', fmtN(v.ppcAct), ''], ['Farmers registered', fmtN(v.regFarm), ''], ['Pending payments', fmtCr(v.pending), tone(v.pending / (v.valueCr || 1), 0.001, 0.01, false)]], go: 'proc' },
      { n: '2', t: 'Processing (CMR)', s: 'Mills & conversion', ico: 'mill', head: fmtMT(v.cmrDel) + ' / ' + fmtMT(v.cmrDue), sub: pct(v.cmrPct) + ' of CMR due', tone: tone(v.cmrPct, 0.6, 0.45), rows: [['Active mills', fmtN(v.millsAct), ''], ['CMR pending', fmtMT(v.cmrShort), tone(v.cmrPct, 0.6, 0.45)], ['Mill anomalies', fmtN(v.millAnom), tone(v.millAnom, 2, 8, false)]], go: 'cmr' },
      { n: '3', t: 'Storage', s: 'Godowns & stocks', ico: 'warehouse', head: fmtMT(v.stock), sub: pct(v.util) + ' of capacity', tone: v.cap ? tone(v.util, 0.85, 0.93, false) : '', rows: [['Total capacity', fmtMT(v.cap), ''], ['Aged > 6 months', pct(v.aged / (v.stock || 1)), tone(v.aged / (v.stock || 1), 0.08, 0.14, false)], ['CCTV online', pct(v.camOnline), v.cams ? tone(v.camOnline, 0.95, 0.9) : '']], go: 'stor' },
      { n: '4', t: 'Transportation', s: 'Stage-I · godown to MLS', ico: 'truck', head: fmtMT(v.s1Moved), sub: pct(v.s1Pct) + ' of Stage-I plan', tone: tone(v.s1Pct, 0.9, 0.8), rows: [['Trip completion', pct(v.tripPct), tone(v.tripPct, 0.6, 0.4)], ['GPS exceptions', fmtN(v.vehDev), tone(v.vehDev / (v.veh || 1), 0.02, 0.04, false)], ['In transit', fmtN(v.transit) + ' trucks', '']], go: 's1' },
      { n: '5', t: 'Distribution (FPS)', s: 'Stage-II · MLS to FPS', ico: 'shop', head: fmtMT(v.s2Fps), sub: pct(v.s2Pct) + ' of allotment', tone: tone(v.s2Pct, 0.85, 0.7), rows: [['Lifted from MLS', fmtMT(v.s2Lift), ''], ['Inspections pending', fmtN(v.insp), tone(v.insp, 5, 20, false)], ['Fair price shops', fmtN(v.fps), '']], go: 's2' },
      { n: '6', t: 'Beneficiary service', s: 'Entitlement & grievances', ico: 'family', head: fmtN(v.cards / 100000, 1) + ' lakh', sub: 'registered ration cards', tone: tone(v.distPct, 0.9, 0.8), rows: [['Rice distributed (% of FPS receipts)', pct(v.distPct), tone(v.distPct, 0.9, 0.8)], ['Open grievances', fmtN(v.grvOpen), tone(v.grvOpen, 10, 30, false)], ['Critical incidents', fmtN(v.p1), tone(v.p1, 0, 2, false)], ['FPS stock-out days', fmtN(v.stockout), tone(v.stockout, 5, 15, false)]], go: 's2' }
    ];
    return '<div class="ctiles">' + T.map(function (x) {
      return '<button class="ctile"' + on(function () { A().go('chain', x.go); }) + '><div class="cth">' + icon(x.ico, 'cic') + '<div><div class="ctt">' + x.n + '. ' + esc(x.t) + '</div><div class="cts">' + esc(x.s) + '</div></div><span class="dot ' + x.tone + '" title="' + TONE_WORD[x.tone] + '"></span></div>' +
        '<div class="ctv ' + x.tone + '">' + esc(x.head) + '</div><div class="ctl">' + esc(x.sub) + '</div>' +
        '<div class="ctr">' + x.rows.map(function (r) { return '<div><span>' + esc(r[0]) + '</span><b class="' + (r[2] || '') + '">' + esc(r[1]) + '</b></div>'; }).join('') + '</div></button>';
    }).join('') + '</div>';
  };
  const statusLegend = function () { return '<div class="slegend"><span><i class="dot good"></i>On track</span><span><i class="dot warn"></i>At risk</span><span><i class="dot bad"></i>Needs attention</span></div>'; };
  // Status map coloured by the KPI threshold of the selected metric.
  const statusMap = function (vm, opts) {
    opts = opts || {}; const m = vm.map; const f = MAP_TONE[m.metric] || MAP_TONE.procPct; const COL = { good: '#2e7d32', warn: '#d39a22', bad: '#c0392b', '': '#cfd8d0' };
    const tiles = m.tiles.map(function (t) { const tn = f(distVals(t.name)) || ''; return '<path d="' + t.d + '" fill="' + COL[tn] + '" class="dist' + (t.sel ? ' sel' : '') + '"' + on(t.pick) + '><title>' + esc(t.name + ' · ' + t.val + ' · ' + TONE_WORD[tn]) + '</title></path>'; }).join('');
    const labels = opts.labels === false ? '' : m.tiles.map(function (t) { return '<text x="' + t.lx + '%" y="' + t.ly + '%" class="mlab2">' + esc(ABBR[t.name] || t.name) + '</text>'; }).join('');
    return '<div class="mapwrap' + (opts.small ? ' small' : '') + '"><svg viewBox="0 0 800 820" class="apmap" preserveAspectRatio="xMidYMid meet">' + tiles + labels + '</svg></div>';
  };
  const rankList = function (list, metric, top, n) {
    const val = MAP_VAL[metric] || MAP_VAL.procPct; const tn = MAP_TONE[metric] || MAP_TONE.procPct; const fmt = MAP_FMT[metric] || pct; const lowerBetter = metric === 'alerts' || metric === 'util';
    const rows = list.filter(function (x) { return val(x.v) !== null; }).sort(function (a, b) { return (val(b.v) - val(a.v)) * (lowerBetter ? -1 : 1) * (top ? 1 : -1); }).slice(0, n || 5);
    const max = Math.max.apply(null, rows.map(function (x) { return Math.abs(val(x.v)); }).concat([1e-9]));
    return '<div class="bars">' + rows.map(function (x, i) { const t = tn(x.v); const w = metric === 'alerts' ? val(x.v) / max * 100 : val(x.v) * 100; return '<div class="brow"' + on(function () { A().openDistrict(x.name); }) + '><span class="bl"><span class="rk">' + (top ? i + 1 : list.length - i) + '</span>' + esc(x.name) + '</span><span class="bb"><i class="' + t + '" style="width:' + Math.max(2, Math.min(100, Math.round(w))) + '%"></i></span><span class="bv">' + esc(fmt(val(x.v))) + '</span></div>'; }).join('') + '</div>';
  };
  // District performance panel: status counts, status map, top and bottom districts on the selected metric.
  const districtPerformance = function (vm, opts) {
    opts = opts || {}; const m = vm.map; const dh = districtHealth(); const f = MAP_TONE[m.metric] || MAP_TONE.procPct;
    const cnt = { good: 0, warn: 0, bad: 0, '': 0 }; dh.forEach(function (x) { cnt[f(x.v) || '']++; });
    const counts = '<div class="scount"><span><i class="dot good"></i>On track (' + cnt.good + ')</span><span><i class="dot warn"></i>At risk (' + cnt.warn + ')</span><span><i class="dot bad"></i>Needs attention (' + cnt.bad + ')</span>' + (cnt[''] ? '<span><i class="dot"></i>No data (' + cnt[''] + ')</span>' : '') + '</div>';
    const tabs = U.chips(m.metrics.map(function (x) { return { label: x.label, cls: x.v === m.metric ? 'on' : '', pick: function () { m.onMetric({ target: { value: x.v } }); } }; }), 'mtabs');
    return card(sh('District performance', '', U.btn('View all districts →', function () { A().go('districts'); }, 'xs ghost')) + tabs + counts +
      '<div class="dpgrid"><div>' + statusMap(vm, { labels: false }) + '</div><div><div class="small" style="font-weight:700;margin-bottom:6px">Top districts <span class="muted" style="font-weight:400">· ' + esc(m.metricLabel) + '</span></div>' + rankList(dh, m.metric, true, 5) + '<div class="small" style="font-weight:700;margin:12px 0 6px">Bottom districts</div>' + rankList(dh, m.metric, false, 5) + '</div></div>', opts.cls);
  };
  // Key alerts: the baseline's exception list, one line each, time-stamped where the record has an age.
  const keyAlerts = function (p, opts) {
    opts = opts || {}; const items = (p.rp && p.rp.items) || []; const feed = (p.feed || []);
    const lines = items.slice(0, opts.n || 4).map(function (it) { return '<div class="kal"' + on(it.go) + '><span class="ai ' + U.toneOf(it.dot) + '"></span><div><div class="at">' + esc(it.text) + '</div><div class="am">' + esc(it.meta) + '</div></div></div>'; })
      .concat(feed.slice(0, opts.feedN === undefined ? 3 : opts.feedN).map(function (f) { return '<div class="kal"' + on(f.go) + '><span class="ai ' + (f.prio === 'Critical' ? 'bad' : 'warn') + '"></span><div><div class="at">' + esc(f.title) + '</div><div class="am">' + esc(f.meta) + '</div></div></div>'; }));
    return card(sh('Key alerts & interventions', '', U.btn('View all →', function () { A().go('incidents'); }, 'xs ghost')) + '<div class="kals">' + (lines.join('') || U.empty('No exceptions right now.')) + '</div>' + (p.queue ? '<div style="margin-top:10px">' + U.btn('Open the incident queue', function () { A().go('incidents'); }, 'sm') + '</div>' : ''), opts.cls);
  };
  // Trend panel: the baseline's season chart when a season lens is on, else the preparedness forecast and ranked bars.
  const trendPanel = function (p, vm) {
    const sc = p.sChart && p.sChart.has ? p.sChart : null;
    const pr = (p.prio || [])[0];
    const body = sc ? '<div class="small" style="font-weight:700">' + esc(sc.title.split(' · ')[0]) + '</div>' + U.lineChart(sc) :
      (pr ? '<div class="small" style="font-weight:700;margin-bottom:6px">' + esc(pr.title) + '</div>' + U.bars(pr.bars.slice(0, 6)) + '<p class="note">' + esc(pr.src) + '</p>' : '');
    const more = (p.prio || []).slice(sc ? 0 : 1).map(function (x) { return { label: x.title.split(' — ')[0], pick: x.go }; });
    return card(sh(sc ? 'Key trends' : 'Performance highlights', sc ? 'Progress over time' : 'District comparisons', '') + body + (more.length ? '<div class="chips" style="margin-top:10px">' + more.map(function (c) { return '<button class="chip"' + on(c.pick) + '>' + esc(c.label) + ' →</button>'; }).join('') + '</div>' : ''));
  };
  const stripCard = function (title, items, goLabel, goFn, opts) {
    opts = opts || {};
    return card(sh(title, '', U.btn(goLabel, goFn, 'xs ghost')) + '<div class="sstrip">' + items.map(function (k) { return '<div class="si"' + (k.info ? on(k.info) : '') + ' title="' + esc(k.sub || '') + '"><div class="v ' + U.toneOf(k.vcls) + '">' + esc(k.value) + '</div><div class="l">' + esc(k.label) + '</div><div class="l2">' + esc(k.sub || '') + '</div></div>'; }).join('') + '</div>', opts.cls);
  };
  // Clean "districts needing attention" rendering: name, status, measures below threshold as chips, action status.
  const attentionTable = function (list, lvl) {
    const rows = list.filter(function (x) { return x.h.bad.length || x.h.warn.length >= 3; }).sort(function (a, b) { return b.h.bad.length - a.h.bad.length || b.h.warn.length - a.h.warn.length; });
    if (!rows.length) return U.empty('No ' + lvl.toLowerCase() + ' requires review under the current thresholds.');
    const chipsOf = function (h) { const bad = h.bad.slice(0, 3).map(function (b) { return '<span class="mchip bad">' + esc(b) + '</span>'; }); const rest = h.bad.length > 3 ? ['<span class="mchip">+' + (h.bad.length - 3) + ' more</span>'] : h.warn.slice(0, 3 - h.bad.length).map(function (b) { return '<span class="mchip warn">' + esc(b) + '</span>'; }); return bad.concat(rest).join(''); };
    return '<div class="tw"><table class="dt compact at"><thead><tr><th class="first">' + esc(lvl) + '</th><th class="txt">Status</th><th class="txt">Below threshold</th><th class="txt">Action status</th></tr></thead><tbody>' + rows.map(function (x) { const a = actionStatus(x.name); return '<tr><td class="first drill"' + on(function () { A().openDistrict(x.name); }) + '>' + esc(x.name) + '</td><td class="txt"><span class="status ' + x.h.status + '">' + U.dot(x.h.status) + TONE_WORD[x.h.status] + '</span></td><td class="txt"><div class="small" style="font-weight:600">' + x.h.bad.length + ' of ' + MEASURES.length + ' measures</div><span class="mchips">' + chipsOf(x.h) + '</span></td><td class="txt"><span class="astat ' + (a[0] === 'No action recorded' ? '' : 'on') + '">' + esc(a[0]) + '</span></td></tr>'; }).join('') + '</tbody></table></div>';
  };
    const weakestTable = function (ov) {
    if (!ov || !ov.weak) return '';
    return '<div class="tw"><table class="dt compact"><thead><tr><th class="first">Measure</th><th class="txt">District requiring review</th><th class="r">Value</th></tr></thead><tbody>' + ov.weak.map(function (w) { return '<tr><td class="first">' + esc(w.label) + '</td><td class="txt drill"' + on(w.go) + '>' + esc(w.name) + '</td><td class="r ' + U.toneOf(w.cls) + '"><b>' + esc(w.v) + '</b></td></tr>'; }).join('') + '</tbody></table></div>';
  };
  const pendFlow = function (ov) {
    if (!ov || !ov.pend) return '';
    return '<div class="pflow">' + ov.pend.map(function (p) { return '<div class="pf"' + on(p.go) + ' title="' + esc(p.tip) + '"><div class="pfh"><b>' + esc(p.stage) + '</b><span>' + esc(p.label) + '</span></div><div class="pfb"><span class="bar"><i class="warn" style="width:' + p.w + '%"></i></span><b>' + esc(p.qty) + '</b></div><div class="pfm">' + esc(p.share) + ' of base · most pending ' + esc(p.high) + '</div></div>'; }).join('') + '</div><p class="note">' + esc(ov.pendNote.split('.')[0]) + '.</p>';
  };
  const finFlow = function (v) {
    const steps = [['Value of paddy procured', fmtCr(v.valueCr), '', 'at MSP'], ['Paid to farmers', fmtCr(v.paid), tone(v.farmPaidPct, 0.99, 0.95), pct(v.payVal) + ' of value'], ['Paid within 24 h', fmtCr(v.pay24W), tone(v.pay24, 0.9, 0.8), pct(v.pay24) + ' of payments'], ['Pending to farmers', fmtCr(v.pending), tone(v.pending / (v.valueCr || 1), 0.001, 0.01, false), fmtN(v.farmersPend) + ' farmers']];
    return '<div class="fflow">' + steps.map(function (x) { return '<div class="ff"><div class="ffl">' + esc(x[0]) + '</div><div class="ffv ' + (x[2] || '') + '">' + esc(x[1]) + '</div><div class="ffs">' + esc(x[3]) + '</div></div>'; }).join('') + '</div>';
  };
  // Stage-wise performance versus target as a bar chart (district deep dive).
  const stageBars = function (v) {
    const S = [['Procurement', v.procPct, tone(v.procPct, 0.95, 0.8)], ['CMR', v.cmrPct, tone(v.cmrPct, 0.6, 0.45)], ['Storage', v.cap ? v.util : 0, v.cap ? tone(v.util, 0.85, 0.93, false) : ''], ['Transport', v.s1Pct, tone(v.s1Pct, 0.9, 0.8)], ['FPS', v.s2Pct, tone(v.s2Pct, 0.85, 0.7)], ['Service', v.distPct, tone(v.distPct, 0.9, 0.8)]];
    return '<div class="vbars">' + S.map(function (x) { const h = Math.max(2, Math.min(100, Math.round(x[1] * 100))); return '<div class="vb"><div class="vbv ' + x[2] + '">' + pct(x[1]) + '</div><div class="vbb"><i class="' + x[2] + '" style="height:' + h + '%"></i><em></em></div><div class="vbl">' + esc(x[0]) + '</div></div>'; }).join('') + '</div><p class="note">Bars show procurement against target, CMR delivered against due, stock against capacity, transport against plan, FPS receipts against allotment and rice distributed against FPS receipts. Storage shows occupancy; line = 100% of each reference quantity.</p>';
  };
  const stageTable = function (v, inDistrict) {
    const rows = [['Procurement', fmtMT(v.target), fmtMT(v.procured), v.procPct, tone(v.procPct, 0.95, 0.8), 'proc'], ['Processing (CMR)', fmtMT(v.cmrDue), fmtMT(v.cmrDel), v.cmrPct, tone(v.cmrPct, 0.6, 0.45), 'cmr'], ['Storage', fmtMT(v.cap), fmtMT(v.stock), v.util, v.cap ? tone(v.util, 0.85, 0.93, false) : '', 'stor'], ['Transportation', fmtMT(v.s1Plan), fmtMT(v.s1Moved), v.s1Pct, tone(v.s1Pct, 0.9, 0.8), 's1'], ['Distribution', fmtMT(v.s2Allot), fmtMT(v.s2Fps), v.s2Pct, tone(v.s2Pct, 0.85, 0.7), 's2'], ['Beneficiary service', fmtMT(v.s2Fps), fmtMT(v.dist), v.distPct, tone(v.distPct, 0.9, 0.8), 's2']];
    return '<div class="tw"><table class="dt compact"><thead><tr><th class="first">Stage</th><th class="r">Reference quantity</th><th class="r">Actual</th><th class="r">Progress / utilisation</th><th class="txt">Status</th></tr></thead><tbody>' + rows.map(function (r) { return '<tr><td class="first drill"' + on(function () { if (inDistrict) A().setStage(r[5]); else A().go('chain', r[5]); }) + '>' + esc(r[0]) + '</td><td class="r">' + esc(r[1]) + '</td><td class="r">' + esc(r[2]) + '</td><td class="r"><span class="bar" style="width:70px;margin-right:6px"><i class="' + r[4] + '" style="width:' + Math.min(100, Math.round(r[3] * 100)) + '%"></i></span><b class="' + r[4] + '">' + pct(r[3]) + '</b></td><td class="txt"><span class="status ' + r[4] + '">' + U.dot(r[4]) + TONE_WORD[r[4]] + '</span></td></tr>'; }).join('') + '</tbody></table></div>';
  };

  /* ---------- progressive disclosure ---------- */
  // A section that is always on the page but closed until asked for. `meta` is the factual count shown in the header.
  const fold = function (key, title, meta, body, opts) {
    opts = opts || {}; const S = A().S; const open = S.folds[key] !== undefined ? !!S.folds[key] : !!opts.open;
    return '<section class="card fold' + (open ? ' open' : '') + '"><div class="fh" role="button" tabindex="0"' + on(function () { S.fold(key, !open); }) + '><span class="fchev">' + icon('chev') + '</span><span class="ft">' + esc(title) + '</span>' + (meta ? '<span class="fm">' + esc(meta) + '</span>' : '') + (opts.right ? '<span class="fr">' + opts.right + '</span>' : '') + '</div>' + (open ? '<div class="fb">' + body + '</div>' : '') + '</section>';
  };
  const foldGroup = function (list) { return '<div class="folds">' + list.join('') + '</div>'; };

  /* ---------- shared fragments ---------- */
  const aisumCard = function (p) {
    if (!p || !p.aisum || !p.aisum.has) return '';
    return card('<h3>' + icon('bolt') + ' Insights & actions</h3><p class="lead">' + esc(p.aisum.lead) + '</p><div class="alist">' + p.aisum.items.map(function (it) { return '<div class="aitem"' + on(it.go) + '><span class="ai ' + U.toneOf(it.cls) + '"></span><div><div class="at">' + esc(it.text) + '</div><div class="am">' + esc(it.cta) + ' →</div></div></div>'; }).join('') + '</div>' + (p.aisum.open ? '<div style="margin-top:8px">' + U.btn('Open Intelligence', p.aisum.open, 'sm ghost', 'brain') + '</div>' : ''), 'flat');
  };
  const rpCard = function (p) {
    if (!p || !p.rp || !p.rp.items || !p.rp.items.length) return '';
    return card('<h3>' + esc(p.rp.title) + '</h3><p class="sub muted small">' + esc(p.rp.sub) + '</p><div class="alist" style="margin-top:8px">' + p.rp.items.map(function (it) { return '<div class="aitem"' + on(it.go) + '><span class="ai ' + U.toneOf(it.dot) + '"></span><div><div class="at">' + esc(it.text) + '</div><div class="am">' + esc(it.meta) + '</div></div></div>'; }).join('') + '</div>', 'flat');
  };
  const briefCard = function (p) {
    if (!p || !p.brief || !p.brief.btn) return '';
    const b = p.brief;
    return card('<h3>Since your last visit</h3><p class="sub muted small">' + esc(b.sub) + '</p>' + (b.loading ? '<p class="note">Checking the records…</p>' : b.has ? '<div class="alist" style="margin-top:8px">' + b.items.map(function (it) { return '<div class="aitem"' + on(it.go) + '><span class="ai ' + U.toneOf(it.cls || it.dot) + '"></span><div><div class="at">' + esc(it.text) + '</div><div class="am">' + esc(it.meta || '') + '</div></div></div>'; }).join('') + '</div>' : '<p class="note">Nothing new needs your attention since your last visit.</p>') + (b.loading ? '<div style="margin-top:6px">' + U.btn('Check now', b.open, 'xs ghost', 'refresh') + '</div>' : ''), 'flat');
  };
  const rail = function (p, extra) { return (extra || '') + (p.rp && p.rp.items && p.rp.items.length ? keyAlerts(p, { feedN: 0 }) : ''); };

  const feedList = function (feed) { return '<div class="alist">' + (feed || []).map(function (f) { return '<div class="aitem"' + on(f.go) + '><span class="ai ' + (f.prio === 'Critical' ? 'bad' : f.prio === 'High' ? 'warn' : '') + '"></span><div><div class="at">' + U.pill(f.prio, f.pcls) + ' ' + esc(f.title) + '</div><div class="am">' + esc(f.meta) + '</div></div></div>'; }).join('') + '</div>'; };
  const queueBlock = function (q, opts) {
    opts = opts || {};
    if (!q) return '';
    const rows = (q.rows || []).slice(0, opts.max || 40);
    return U.chips(q.tabs) + '<div class="qwrap"><div class="q head"><span>Incident</span><span>Title</span><span>Severity</span><span>Owner</span><span>Location</span><span>Age</span><span>SLA</span></div>' +
      rows.map(function (r) { return '<div class="q"' + on(r.view) + '><span class="id">' + esc(r.id) + '</span><span>' + esc(r.title) + '</span><span>' + U.pill(r.sev, r.sev) + '</span><span class="own ' + (/un/.test(r.ocls) ? 'un' : '') + '">' + esc(r.owner) + '</span><span>' + esc(r.loc) + '</span><span>' + esc(r.age) + '</span><span class="sla ' + U.toneOf(r.slacls) + '">' + esc(r.sla) + '</span></div>'; }).join('') +
      '</div>' + (q.none ? U.empty('Nothing in this queue right now.') : '') + '<div class="tools" style="margin-top:8px;justify-content:space-between"><span class="note">' + esc(q.more || q.note) + '</span>' + U.btn('View all', q.all, 'xs') + '</div>';
  };
  const pendBlock = function (ov) {
    if (!ov || !ov.pend) return '';
    return '<div class="pendwrap"><div class="pend" style="font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--ink-3);cursor:default"><span>Stage</span><span>Waiting for</span><span class="qty">Pending</span><span>Share</span><span>Most pending</span></div>' +
      ov.pend.map(function (p) { return '<div class="pend"' + on(p.go) + ' title="' + esc(p.tip) + '"><span class="st">' + esc(p.stage) + '</span><span>' + esc(p.label) + '</span><span class="qty">' + esc(p.qty) + '</span><span><span class="bar"><i class="warn" style="width:' + p.w + '%"></i></span> ' + esc(p.share) + '</span><span class="hi">' + esc(p.high) + '</span></div>'; }).join('') +
      '</div>' + (ov.na && ov.na.length ? '<p class="note">' + ov.na.map(function (x) { return esc(x.label || x); }).join(' · ') + '</p>' : '') + '<p class="note">' + esc(ov.pendNote) + '</p>';
  };
  const attnBlock = function (ov) {
    if (!ov) return '';
    return '<div>' + (ov.hasAttn ? ov.attn.map(function (a) { return '<div class="attn"' + on(a.go) + '><div><b>' + esc(a.name) + '</b><div class="s">' + esc(a.stages) + '</div></div><span class="c">' + esc(a.count) + '</span></div>'; }).join('') : U.empty(ov.noAttnTxt)) + '</div>';
  };
  const weakBlock = function (ov) {
    if (!ov || !ov.weak) return '';
    return '<div>' + ov.weak.map(function (w) { return '<div class="wk"' + on(w.go) + '><span class="muted">' + esc(w.label) + '</span><span class="n">' + esc(w.name) + '</span><span class="v ' + U.toneOf(w.cls) + '">' + esc(w.v) + '</span></div>'; }).join('') + '</div>';
  };
  const matrixBlock = function (ov) {
    if (!ov || !ov.cols) return '';
    const ms = ov.ms;
    const ctl = '<div class="tools">' + U.btn(ms.label, ms.toggle, 'sm') + U.btn('All ' + (ov.lvl === 'District' ? 'districts' : 'mandals'), ms.all, 'xs ghost') + U.btn('Needing attention', ms.attn, 'xs ghost') + U.btn('Clear', ms.none, 'xs ghost') + '</div>' +
      (ms.open ? '<div class="chips" style="margin-bottom:8px">' + ms.opts.map(function (o) { return '<button class="chip' + (o.on ? ' on' : '') + '"' + on(o.pick) + '>' + esc(o.name) + '</button>'; }).join('') + U.btn('Done', ms.close, 'xs primary') + '</div>' : '');
    const head = '<thead><tr><th class="first">' + esc(ov.lvl) + '</th>' + ov.cols.map(function (c) { return '<th title="' + esc(c.tip) + '">' + esc(c.label) + '<br><span style="font-weight:400;text-transform:none;letter-spacing:0">' + esc(c.unit) + '</span></th>'; }).join('') + '</tr></thead>';
    const body = ov.hasRows ? ov.rows.map(function (r) { return '<tr><td class="first"' + (r.pick ? on(r.pick) : '') + '>' + esc(r.name) + '</td>' + r.cells.map(function (c) { return '<td class="' + U.toneOf(c.cls) + '" title="' + esc(c.tip) + '"' + on(c.pick) + '>' + esc(c.v) + '</td>'; }).join('') + '</tr>'; }).join('') : '<tr><td colspan="' + (ov.cols.length + 1) + '">' + U.empty(ov.emptyTxt) + '</td></tr>';
    const foot = ov.hasRows ? '<tfoot><tr><td class="first">' + esc(ov.totLbl) + '</td>' + ov.total.map(function (c) { return '<td>' + esc(c.v) + '</td>'; }).join('') + '</tr><tr><td class="first">Below threshold</td>' + ov.redCnt.map(function (c) { return '<td class="bad">' + esc(c.v) + '</td>'; }).join('') + '</tr></tfoot>' : '';
    return ctl + '<div class="tw"><table class="mx">' + head + '<tbody>' + body + '</tbody>' + foot + '</table></div><p class="note">' + esc(ov.mxNote) + '</p>';
  };
  const mapCard = function (vm, opts) {
    opts = opts || {}; const m = vm.map;
    const ctl = '<div class="tools">' + U.select(m.metrics, m.metric, m.onMetric, '', 'v', 'label') + (m.canPick ? U.select([{ v: '', l: 'No facility points' }].concat([['mill', 'Rice mills'], ['rsk', 'RSKs'], ['mls', 'MLS points'], ['godown', 'Buffer godowns']].map(function (x) { return { v: x[0], l: x[1] }; })), m.ptsVal, m.onPts) : '') + (m.hasSel ? U.btn('Back to state view', m.clear, 'xs ghost') : '') + '</div>';
    return card(sh(opts.title || 'Andhra Pradesh — choose a district', m.hint, '') + ctl + U.mapSvg(m) + (m.pts.on ? '<p class="note">' + esc(m.pts.note) + ' ' + U.link('View list', m.pts.list) + '</p>' : '') + (m.nd ? '<p class="note">' + esc(m.ndText) + '</p>' : ''), opts.cls);
  };
  const strip = function (list) {
    return '<div class="strip">' + list.map(function (k) { return '<div class="si"' + on(k.info) + ' title="' + esc(k.sub) + '"><div class="l">' + esc(k.label) + '</div><div class="v ' + U.toneOf(k.vcls) + '">' + esc(k.value) + '</div><div class="l2">' + esc(k.sub) + '</div></div>'; }).join('') + '</div>';
  };
  const scoresBlock = function (scores, opts) { return (scores || []).map(function (s) { return U.kpiTable(s, opts); }).join(''); };
  const rxBlock = function (list) {
    return (list || []).map(function (x) {
      const body = x.open ? ((x.views && x.views.length ? U.seg(x.views) : '') + (x.hasChips ? U.chips(x.chips) : '') + (x.empty ? U.empty(x.emptyMsg) : U.dataTable(x.t, { bare: true, key: x.key })) + (x.count ? '<p class="note">' + esc(x.count) + '</p>' : '') + '<p class="note">' + esc(x.src) + '</p>') : '';
      return card(sh(x.title, x.sub, U.btn(x.toggleLabel, x.toggle, 'sm' + (x.open ? '' : ' primary'))) + body, 'records');
    }).join('');
  };
  const extras = function (p) {
    let h = '';
    if (p.hasDetail && p.detail) { const d = p.detail; h += card(sh(d.title, d.src) + '<div class="grid"><div class="c6">' + U.facts(d.facts) + (d.gpsNote ? '<p class="note">' + esc(d.gpsNote) + '</p>' : '') + (d.cam ? '<div class="feed" style="margin-top:8px"><div class="fv">' + icon('camera') + '<span class="ts">' + esc(d.camTs) + '</span></div><div class="fb"><b>' + esc(d.cam) + '</b></div></div>' : '') + '</div><div class="c6">' + (d.steps && d.steps.length ? '<div class="small" style="font-weight:700;margin-bottom:4px">Record trail</div><ul class="steps">' + d.steps.map(function (st) { return '<li class="' + (/pending|todo|wait/.test(st.cls || '') ? 'pending' : '') + '"><b>' + esc(st.label) + '</b> <span class="m">' + esc(st.meta) + '</span></li>'; }).join('') + '</ul>' : '') + (d.planned ? '<svg viewBox="0 0 300 140" style="width:100%;max-height:160px;background:var(--green-50);border-radius:8px"><polyline points="' + esc(d.planned) + '" fill="none" stroke="#9aa" stroke-dasharray="4 3" stroke-width="2"/><polyline points="' + esc(d.actual) + '" fill="none" stroke="' + esc(d.trailColor) + '" stroke-width="2.5"/></svg><div class="legend"><span class="lg-plan">Planned route</span><span>Actual</span></div>' : '') + '</div></div>'); }
    if (p.hasTiles && p.tiles && p.tiles.length) h += card(sh(p.tilesTitle) + '<div class="feeds">' + p.tiles.map(function (t) { return '<div class="feed"' + on(t.go) + '><div class="fv">' + icon('camera') + '<span class="badge">' + esc(t.badge) + '</span><span class="ts">' + esc(t.ts) + '</span></div><div class="fb"><b>' + esc(t.site) + '</b>' + esc(t.event) + '</div></div>'; }).join('') + '</div>');
    if (p.hasPrep && p.prep && p.prep.length) h += card(sh(p.prepTitle) + '<div class="bars">' + p.prep.map(function (x) { return '<div class="brow"' + on(x.pick || x.go) + '><span class="bl">' + esc(x.name || x.label) + '</span><span class="bb"><i class="' + U.toneOf(x.cls) + '" style="width:' + (x.w || 0) + '%"></i></span><span class="bv">' + esc(x.pctTxt || x.v || '') + '</span></div>'; }).join('') + '</div>');
    if (p.hasFacts && p.facts && p.facts.length) h += card(sh(p.factsTitle) + U.facts(p.facts));
    return h;
  };
  const chartCard = function (p, title) { return p.hasChart ? card(sh(title || p.chart.title, p.chart.src) + U.bars(p.chart.bars)) : ''; };

  /* ---------- Executive Overview ---------- */
  const overview = function (vm) {
    const p = vm.page; const v = scopeVals(); const dn0 = (E.L.state.path || [])[0];
    const fin = E.peek({ module: 'fin', stage: 'all', pivot: false, kpiOpen: null });
    const prep = E.peek({ module: 'prep', stage: 'all', pivot: false, kpiOpen: null });
    const al = E.peek({ module: 'alerts', stage: 'all', pivot: false, kpiOpen: null });
    const fpsP = E.peek({ module: 'glance', glance: 'fps', stage: 'all', pivot: false, kpiOpen: null });
    const headline = [p.kpis[0], p.kpis[2], p.kpis[5], p.kpis[3], p.kpis[4], fpsP ? fpsP.page.kpis.filter(function (k) { return /Distributed/.test(k.label); })[0] || p.kpis[6] : p.kpis[6]].filter(Boolean);
    const others = p.kpis.filter(function (k) { return headline.indexOf(k) < 0; });
    const first =
      '<div class="hero">' + U.tiles(headline, { cls: 'six', icons: ['sprout', 'mill', 'warehouse', 'truck', 'shop', 'family'] }) + '</div>' +
      card(sh('End-to-end supply chain performance', 'From farmer to beneficiary · ' + (dn0 || 'all districts') + ' · season to date', statusLegend() + U.btn('View detailed value chain →', function () { A().go('chain', 'all'); }, 'sm')) + chainTiles(v, !!dn0)) +
      '<div class="grid"><div class="c5">' + districtPerformance(vm) + '</div><div class="c4">' + trendPanel(p, vm) + '</div><div class="c3">' + keyAlerts(p) + '</div></div>' +
      '<div class="grid">' +
        '<div class="c4">' + stripCard('Financial overview', fin ? fin.page.kpis.slice(0, 4) : [], 'View details →', function () { A().go('finance'); }) + '</div>' +
        '<div class="c4">' + stripCard('Preparedness & compliance', prep ? [prep.page.kpis[0], prep.page.kpis[1], prep.page.kpis[2], prep.page.kpis[4]] : [], 'View details →', function () { A().go('prep'); }) + '</div>' +
        '<div class="c4">' + stripCard('Grievances & public service', [{ label: 'Open grievances', value: fmtN(v.grvOpen), sub: 'PGRS + IVRS', vcls: tone(v.grvOpen, 300, 900, false) }, { label: 'Category A', value: fmtN(v.grvA), sub: 'highest priority', vcls: '' }, { label: 'Critical incidents', value: fmtN(v.p1), sub: fmtN(v.alerts) + ' open in total', vcls: tone(v.p1, 0, 2, false) }, { label: 'FPS stock-out days', value: fmtN(v.stockout), sub: 'this month', vcls: tone(v.stockout, 100, 300, false) }], 'View details →', function () { A().go('voice'); }) + '</div>' +
      '</div>';
    const rest = foldGroup([
      fold('ov.kpis', 'Additional performance indicators', others.map(function (k) { return k.label + ' ' + k.value; }).join(' · '), U.tiles(others, { cls: 'three' })),
      fold('ov.alerts', 'Incident work queue', p.queue ? p.queue.tabs.map(function (t) { return t.label; }).join(' · ') : '', p.queue ? queueBlock(p.queue, { max: 10 }) : '', { right: U.btn('Incidents', function () { A().go('incidents'); }, 'xs ghost') }),
      fold('ov.attn', 'Districts needing attention', (p.ov.hasAttn ? p.ov.attn.length : 0) + ' districts below threshold on 4 or more of 9 measures', attentionTable(districtHealth(), 'District') + '<div class="small" style="font-weight:700;margin:14px 0 6px">Weakest district by measure</div>' + weakestTable(p.ov), { right: U.btn('District Intelligence', function () { A().go('districts'); }, 'xs ghost') }),
      fold('ov.pending', 'Pending quantity by stage', p.ov.pend.length + ' stages · ' + p.ov.asOf, pendFlow(p.ov)),
      fold('ov.matrix', p.ov.mxTitle, p.ov.mxSub, matrixBlock(p.ov)),
      fold('ov.brief', 'Since your last visit', p.brief.loading ? 'Checking…' : (p.brief.has ? p.brief.items.length + ' changes in the last 24 hours' : 'Nothing new'), p.brief.loading ? '<p class="note">Checking the records…</p>' + U.btn('Check now', p.brief.open, 'xs ghost', 'refresh') : p.brief.has ? '<div class="alist">' + p.brief.items.map(function (it) { return '<div class="aitem"' + on(it.go) + '><span class="ai ' + U.toneOf(it.cls || it.dot) + '"></span><div><div class="at">' + esc(it.text) + '</div></div></div>'; }).join('') + '</div>' : U.empty('Nothing new since your last visit.')),
      fold('ov.quick', 'Quick view', (p.scores[0] ? p.scores[0].items.length + ' KPIs' : '') + ' · actual, target, variance, freshness', scoresBlock(p.scores, { title: 'Quick view', bare: true }))
    ]);
    return { title: 'Executive Overview', sub: 'Snapshot of the entire supply chain, key numbers and alerts · ' + (p.flowScope || 'Andhra Pradesh'), body: first + rest, rail: '' };
  };

  /* ---------- Value chain · all stages ---------- */
  const chainAll = function (vm) {
    const p = vm.page;
    const cards = STAGE_KEYS.map(function (k) {
      const sp = E.peek({ module: 'overview', stage: k, pivot: false, kpiOpen: null });
      if (!sp) return '';
      const m = SM[k];
      return '<div class="card stagecard" style="--sc:' + m.color + '"><div class="sch"><span class="snum">' + m.num + '</span><h3>' + esc(m.label) + '<span class="scs">' + esc(sp.page.title) + '</span></h3></div><div class="ks">' + sp.page.kpis.slice(0, 4).map(function (kk) { return '<div class="k"' + on(function () { A().go('chain', k); }) + '><div class="l">' + esc(kk.label) + '</div><div class="v ' + U.toneOf(kk.vcls) + '">' + esc(kk.value) + '</div><div class="s">' + esc(kk.sub) + '</div></div>'; }).join('') + '</div><div style="margin-top:8px;display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><span class="note" style="margin:0;min-width:0">' + esc(sp.page.sub.replace(/^Source: /, '')) + '</span><span style="flex:none">' + U.link('Open →', function () { A().go('chain', k); }) + '</span></div></div>';
    }).join('');
    const body = U.stepper('all', function (k) { A().go('chain', k); }) +
      card(sh('Paddy-to-beneficiary flow', 'Physical order of the chain') + U.flowStrip(p.flow)) +
      '<div class="grid" style="margin-top:12px"><div class="c12"><div class="stagegrid">' + cards + '</div></div>' +
      '<div class="c6">' + card(sh('Pending quantity by stage', p.ov.asOf) + pendBlock(p.ov)) + '</div>' +
      '<div class="c6">' + card(sh('Districts requiring review by measure', 'Lowest district on each of the 9 measures') + weakestTable(p.ov)) + '</div>' +
      '</div>' + foldGroup([fold('vc.attn', 'Districts needing attention', (p.ov.hasAttn ? p.ov.attn.length : 0) + ' districts below threshold on 4 or more of 9 measures', attentionTable(districtHealth(), 'District')), fold('vc.matrix', p.ov.mxTitle, p.ov.mxSub, matrixBlock(p.ov))]);
    return { title: 'Value Chain Performance', sub: 'Performance by stage against target, plan, capacity or allotment', body: body, rail: rail(p) };
  };

  /* ---------- Stage page (01–05), also used inside a district ---------- */
  const stage = function (vm, k, sub) {
    const p = vm.page; const m = SM[k]; const S = A().S;
    const inDistrict = (vm.crumbs || []).length > 1;
    const tabs = [['', 'Overview'], ['districts', inDistrict ? 'Mandals' : 'Districts'], ['entities', { proc: 'RSKs / PPCs', cmr: 'Rice mills', stor: 'Buffer godowns', s2: 'MLS points & FPS', s1: 'Routes & trips' }[k]], ['incidents', 'Incidents'], ['records', 'Records']];
    const tabBar = U.seg(tabs.map(function (t) { return { label: t[1], on: (sub || '') === t[0], pick: function () { A().setSub(t[0]); } }; }));
    let body = '';
    if (p.hasDetail) {
      body = extras(p) + (p.hasTable ? U.dataTable(p.table, { title: p.table.title, sub: p.table.note }) : '') + (p.hasT2 ? U.dataTable(p.t2, { max: 60 }) : '') + rxBlock(p.rx);
    } else if (!sub) {
      body = (p.showFlow ? card(sh('Position in the chain', '') + U.flowStrip(p.flow)) : '') +
        '<div class="grid" style="margin:12px 0"><div class="c8">' + U.tiles(p.kpis, { cls: p.kpis.length > 4 ? 'three' : 'two' }) + '</div><div class="c4 stack">' + chartCard(p) + extras(p) + '</div></div>' +
        scoresBlock(p.scores) + foldGroup([(p.hasT2 ? fold('st.t2.' + k, p.t2.title, p.t2.note, U.dataTable(p.t2, { bare: true, max: 40 })) : ''), (inDistrict && p.hasTable ? fold('st.tbl.' + k, p.table.title, p.table.note, U.dataTable(p.table, { bare: true }), { open: true }) : '')]);
    } else if (sub === 'districts') {
      body = '<div class="grid"><div class="c8">' + U.dataTable(p.table, { title: p.table.title }) + '</div><div class="c4">' + chartCard(p) + '</div></div>';
    } else if (sub === 'entities') {
      const gk = GLANCE_OF[k] || 'rsk';
      const g = E.peek({ module: 'glance', glance: gk, stage: 'all', pivot: false, kpiOpen: null });
      let extra = '';
      if (k === 's2') { const g2 = E.peek({ module: 'glance', glance: 'fps', stage: 'all', pivot: false, kpiOpen: null }); if (g2) extra = card(sh(g2.page.title, g2.page.sub) + U.tiles(g2.page.kpis, { cls: 'four' })) + scoresBlock(g2.page.scores) + U.dataTable(g2.page.table, { title: g2.page.table.title }); }
      if (k === 's1') { body = '<div class="grid"><div class="c12">' + rxBlock(p.rx) + '</div></div>'; }
      else body = (g ? card(sh(g.page.title, g.page.sub) + U.tiles(g.page.kpis, { cls: 'four' })) + scoresBlock(g.page.scores) + U.dataTable(g.page.table, { title: g.page.table.title }) : '') + extra;
    } else if (sub === 'incidents') {
      const al = E.peek({ module: 'alerts', stage: k, pivot: false, kpiOpen: null });
      body = al ? ('<div style="margin-bottom:12px">' + U.tiles(al.page.kpis, { cls: 'four' }) + '</div>' + card(sh(al.page.isel.title, al.page.isel.note, U.btn(al.page.isel.viewLabel, al.page.isel.viewAll, 'xs')) + iselRows(al.page.isel)) + U.dataTable(al.page.t2, { title: 'Incident types in this stage', max: 60 })) : '';
    } else if (sub === 'records') {
      body = rxBlock(p.rx) + (p.hasT2 ? U.dataTable(p.t2, { max: 60 }) : '') + (!p.rx.length && !p.hasT2 ? U.empty('Records for this stage open from the KPI cards (Data by district) and the district table.') : '');
    }
    const head = (inDistrict ? '' : U.stepper(k, function (x) { A().go('chain', x); })) + '<div class="tools" style="justify-content:space-between"><div>' + tabBar + '</div><span class="note" style="margin:0">' + esc(p.sub || '') + (p.hasPeriod ? ' · ' + esc(p.period) : '') + '</span></div>';
    return { title: m.num + ' · ' + m.label, sub: p.title, body: head + body, rail: rail(p) };
  };
  const iselRows = function (isel) {
    return '<div class="isgrid" style="margin-bottom:10px">' + isel.stages.map(function (s, i) { const k = STAGE_KEYS[i]; return '<div class="isc" style="--sc:' + SM[k].color + '"><div class="small muted">' + esc(s.label) + '</div><div class="n">' + esc(s.total) + '</div><div class="sv">' + s.sev.map(function (v) { return '<span class="svb ' + esc(v.cls.replace('svb ', '')) + '">' + esc(v.t) + '</span>'; }).join('') + '</div>' + s.pts.map(function (pt) { return '<div class="pt' + (pt.on ? ' on' : '') + '"' + on(pt.pick) + '><span>' + (pt.hasK ? esc(pt.arrow) + ' ' : '') + esc(pt.name) + '</span><b>' + esc(pt.n) + '</b></div>'; }).join('') + '</div>'; }).join('') + '</div>' +
      (isel.hasSel ? U.chips(isel.chips.map(function (c) { return { label: c.label, cls: 'on', pick: c.rm }; })) + U.btn('Clear', isel.clear, 'xs ghost') : '') +
      '<div class="tw"><table class="dt compact"><thead><tr>' + isel.cols.map(function (c, i) { return '<th class="' + (i < 7 ? 'txt' : 'r') + '">' + esc(c.label) + '</th>'; }).join('') + '</tr></thead><tbody>' + isel.rows.map(function (r) { return '<tr><td class="first drill"' + on(r.go) + '>' + esc(r.name) + '</td>' + r.cells.map(function (c, i) { return '<td class="' + (i === 6 ? 'r ' : 'txt ') + U.toneOf(c.cls) + '">' + esc(c.v) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div><p class="note">' + esc(isel.count) + '</p>';
  };

  /* ---------- District Intelligence ---------- */
  const districts = function (vm) {
    const p = vm.page; const dh = districtHealth();
    const c = { good: dh.filter(function (x) { return x.h.status === 'good'; }).length, warn: dh.filter(function (x) { return x.h.status === 'warn'; }).length, bad: dh.filter(function (x) { return x.h.status === 'bad'; }).length };
    const tiles = '<div class="tiles four hero">' + [['good', c.good, 'Districts on track', 'No measure below threshold', 'check'], ['warn', c.warn, 'Districts need monitoring', 'Some measures below threshold or several at risk', 'alert'], ['bad', c.bad, 'Districts require attention', 'Four or more measures below threshold', 'alert'], ['', dh.filter(function (x) { return x.h.bad.length >= 7; }).length, 'Districts with widespread exceptions', 'Seven or more measures below threshold; included in attention count', 'info']].map(function (t) { return '<div class="tile"><div class="tl">' + icon(t[4], 'tic') + '<span class="tlab">' + esc(t[2]) + '</span></div><div class="tv ' + t[0] + '">' + t[1] + '</div><div class="ts">' + esc(t[3]) + '</div></div>'; }).join('') + '</div>';
    const m = vm.map;
    const mapCardV = card(sh('District performance', 'Status for the selected measure · ' + m.metricLabel, U.select(m.metrics, m.metric, m.onMetric, '', 'v', 'label')) + statusMap(vm) + statusLegend());
    const table = card(sh('Districts requiring attention', '', U.btn('View all districts →', function () { A().S.fold('di.all', true); }, 'xs ghost')) + attentionTable(dh, 'District'));
    const insights = card(sh('Key insights', '') + '<div class="kals">' + [['good', c.good + ' districts are on track', 'Stable supply chain and service performance.'], ['warn', c.warn + ' districts need monitoring', 'Some measures below threshold or several at risk.'], ['bad', c.bad + ' districts require attention', 'Four or more measures below threshold; intervention needed.'], ['', dh.filter(function (x) { return x.h.bad.length >= 7; }).length + ' districts with widespread exceptions', 'Seven or more measures below threshold; review operational impact.']].map(function (x) { return '<div class="kal"><span class="ai ' + x[0] + '"></span><div><div class="at">' + esc(x[1]) + '</div><div class="am">' + esc(x[2]) + '</div></div></div>'; }).join('') + '</div>');
    const recent = card(sh('Recent developments', 'Since your last visit') + (p.brief && p.brief.has ? '<div class="kals">' + p.brief.items.slice(0, 6).map(function (it) { return '<div class="kal"' + on(it.go) + '><span class="ai ' + U.toneOf(it.cls || it.dot) + '"></span><div><div class="at">' + esc(it.text) + '</div></div></div>'; }).join('') + '</div>' : '<p class="note">' + esc(p.brief && p.brief.loading ? 'Checking the records…' : 'Nothing new since your last visit.') + '</p>'));
    const body = tiles + '<div class="grid"><div class="c6">' + mapCardV + '</div><div class="c6">' + table + '</div><div class="c4">' + insights + '</div><div class="c4">' + card(sh('Districts requiring review by measure', '') + weakestTable(p.ov)) + '</div><div class="c4">' + recent + '</div></div>' +
      foldGroup([fold('di.all', 'All districts · ' + p.table.title, p.table.rows.length + ' districts', U.dataTable(p.table, { bare: true })), fold('di.matrix', p.ov.mxTitle, p.ov.mxSub, matrixBlock(p.ov))]);
    return { title: 'District Intelligence', sub: 'Overall district-wise view across the entire supply chain', body: body, rail: '' };
  };
  const district = function (vm, k) {
    const p = vm.page; const S = A().S; const dn = (E.L.state.path || [])[0]; const v = distVals(dn); const h = health(v);
    const tabs = U.stepper(k, function (x) { A().setStage(x); });
    if (k !== 'all') { const st = stage(vm, k, S.sub); return { title: esc(dn) + ' · ' + st.title, sub: '', body: tabs + st.body, rail: st.rail }; }
    if (!p.isHome) { return { title: p.title, sub: '', body: tabs + extras(p) + (p.kpis.length ? U.tiles(p.kpis, { cls: 'six' }) : '') + (p.hasTable ? U.dataTable(p.table, { title: p.table.title, sub: p.table.note }) : '') + (p.hasT2 ? U.dataTable(p.t2, { max: 60 }) : '') + scoresBlock(p.scores) + rxBlock(p.rx), rail: rail(p) }; }
    const head = '<div class="dhead"><div><span class="score ' + h.status + '" title="Summary of nine operational measures; at-risk measures receive half credit.">Supply-chain score: ' + h.score + '%</span><span class="status ' + h.status + '">' + U.dot(h.status) + TONE_WORD[h.status] + '</span></div><div class="small muted">Key issues: ' + (h.bad.concat(h.warn).slice(0, 4).join(' | ') || 'none') + '</div></div>';
    const fpsP = E.peek({ module: 'glance', glance: 'fps', stage: 'all', pivot: false, kpiOpen: null });
    const headline = [p.kpis[0], p.kpis[2], p.kpis[5], p.kpis[3], p.kpis[4], fpsP ? fpsP.page.kpis.filter(function (k2) { return /Distributed/.test(k2.label); })[0] || p.kpis[6] : p.kpis[6]].filter(Boolean);
    const others = p.kpis.filter(function (k2) { return headline.indexOf(k2) < 0; });
    const mandals = mandalsOf(dn).map(function (m) { return { name: m.name, v: m.v, h: health(m.v), id: m.id }; });
    const mc = { good: mandals.filter(function (x) { return x.h.status === 'good'; }).length, warn: mandals.filter(function (x) { return x.h.status === 'warn'; }).length, bad: mandals.filter(function (x) { return x.h.status === 'bad'; }).length };
    const glance = card(sh('District at a glance', '') + '<div class="grid dpg"><div class="c5">' + statusMap(vm, { small: true, labels: false }) + '</div><div class="c7">' + U.facts([{ k: 'Mandals', v: fmtN(mandals.length) }, { k: 'Ration shops (FPS)', v: fmtN(v.fps) }, { k: 'Ration cards', v: fmtN(v.cards) }, { k: 'Farmers registered', v: fmtN(v.regFarm) }, { k: 'Rice mills', v: fmtN(v.mills) }, { k: 'Buffer godowns', v: fmtN(v.godowns) }]) + '<div class="scount" style="margin-top:10px"><span><i class="dot good"></i>On track (' + mc.good + ')</span><span><i class="dot warn"></i>At risk (' + mc.warn + ')</span><span><i class="dot bad"></i>Needs attention (' + mc.bad + ')</span></div><div style="margin-top:8px">' + U.link('View mandal-wise performance →', function () { A().S.fold('dd.mandals', true); }) + '</div></div></div>');
    const perf = card(sh('Value chain performance', 'Progress against target, due, plan and allotment · storage occupancy') + stageBars(v));
    const HV = { 'Procurement vs target': [pct(v.procPct), 'of target'], 'Farmers paid within 24 h': [pct(v.pay24), 'of payments'], 'CMR delivered': [pct(v.cmrPct), 'of CMR due'], 'Stage-I moved': [pct(v.s1Pct), 'of plan'], 'Stage-II to FPS': [pct(v.s2Pct), 'of allotment'], 'Godown utilisation': [pct(v.util), 'of capacity'], 'Critical incidents': [fmtN(v.p1), 'open'], 'GPS route deviations': [fmtN(v.vehDev), 'vehicles off route'], 'CCTV online': [pct(v.camOnline), 'of cameras'] };
    const hlItems = h.bad.map(function (m) { return ['bad', m]; }).concat(h.warn.map(function (m) { return ['warn', m]; })).slice(0, 6);
    const hl = card(sh('Key highlights', 'Measures below threshold') + (hlItems.length ? '<div class="kals">' + hlItems.map(function (x) { return '<div class="kal"><span class="ai ' + x[0] + '"></span><div><div class="at">' + esc(HV[x[1]][0]) + ' · ' + esc(x[1]) + '</div><div class="am">' + esc(HV[x[1]][1]) + '</div></div></div>'; }).join('') + '</div>' : U.empty('All measures on track.')));
    const flow = card(sh('Supply chain flow', dn + ' · season to date', statusLegend()) + chainTiles(v, true));
    const grv = (function () { const g = grievOf(dn); const open = g.filter(function (x) { return x.open; }).length; const resolved = g.length - open; const late = g.filter(function (x) { return x.open && x.ageH > 168; }).length; return card(sh('Grievances', 'PGRS and IVRS') + '<div class="metrics" style="grid-template-columns:repeat(3,1fr)"><div class="metric"><div class="l">Total</div><div class="v">' + fmtN(g.length) + '</div></div><div class="metric"><div class="l">Open</div><div class="v warn">' + fmtN(open) + '</div></div><div class="metric"><div class="l">Open > 7 days</div><div class="v bad">' + fmtN(late) + '</div></div></div><p class="note">' + fmtN(resolved) + ' resolved · ' + pct(resolved / (g.length || 1)) + '</p>'); })();
    const stageTbl = card(sh('Stage-wise performance details', '') + stageTable(v, true));
    const mandalTB = card(sh('Mandal-wise performance', vm.map.metricLabel) + '<div class="small" style="font-weight:700;margin-bottom:6px">Top 5 mandals</div>' + rankList(mandals, vm.map.metric, true, 5).replace(/data-on="\d+"/g, '') + '<div class="small" style="font-weight:700;margin:12px 0 6px">Bottom 5 mandals</div>' + rankList(mandals, vm.map.metric, false, 5).replace(/data-on="\d+"/g, ''));
    const issues = card(sh('Open issues & interventions', '', U.btn('View all →', function () { A().go('incidents'); }, 'xs ghost')) + (function () { const l = incidentsOf(dn).filter(function (x) { return x.prio === 'P1' || x.prio === 'P2'; }).slice(0, 6); const acts = openDecisionsFor(dn); return l.length ? '<div class="tw"><table class="dt compact"><thead><tr><th class="first">Issue</th><th class="txt">Stage</th><th class="txt">Age</th><th class="txt">Status</th></tr></thead><tbody>' + l.map(function (x) { return '<tr><td class="first">' + esc(x.title) + '</td><td class="txt">' + esc(STAGE_NAME[x.stage]) + ' · ' + esc(x.ent) + '</td><td class="txt">' + (x.ageH >= 24 ? Math.round(x.ageH / 24) + ' days' : Math.round(x.ageH) + ' h') + '</td><td class="txt"><span class="astat ' + (x.status === 'Escalated' ? 'bad' : x.status === 'In progress' ? 'on' : '') + '">' + esc(x.status) + '</span></td></tr>'; }).join('') + '</tbody></table></div>' + (acts.length ? '<p class="note">' + acts.length + ' decision' + (acts.length > 1 ? 's' : '') + ' open for this district in the decision log.</p>' : '') : U.empty('No high or critical incidents open.'); })());
    const body = tabs + head + '<div class="hero">' + U.tiles(headline, { cls: 'six', icons: ['sprout', 'mill', 'warehouse', 'truck', 'shop', 'family'] }) + '</div>' +
      '<div class="grid"><div class="c5">' + glance + '</div><div class="c4">' + perf + '</div><div class="c3">' + hl + '</div></div>' + flow +
      '<div class="grid"><div class="c5">' + stageTbl + '</div><div class="c4">' + mandalTB + '</div><div class="c3">' + grv + '</div></div>' + issues +
      foldGroup([
        fold('dd.kpis', 'Additional performance indicators', others.map(function (k2) { return k2.label + ' ' + k2.value; }).join(' · '), U.tiles(others, { cls: 'three' })),
        fold('dd.mandals', p.table.title, mandals.length + ' mandals', attentionTable(mandals, 'Mandal') + '<div style="margin-top:12px">' + U.dataTable(p.table, { bare: true }) + '</div>'),
        fold('dd.queue', 'Incident work queue', p.queue ? p.queue.tabs.map(function (t) { return t.label; }).join(' · ') : '', p.queue ? queueBlock(p.queue, { max: 10 }) : ''),
        fold('dd.pending', 'Pending quantity by stage', p.ov.pend.length + ' stages', pendFlow(p.ov)),
        fold('dd.matrix', p.ov.mxTitle, p.ov.mxSub, matrixBlock(p.ov)),
        fold('dd.quick', 'Quick view', (p.scores[0] ? p.scores[0].items.length + ' KPIs' : ''), scoresBlock(p.scores, { bare: true }))
      ]);
    return { title: dn + ' · District Deep Dive', sub: 'Operational performance, farmer payments and open interventions', body: body, rail: '' };
  };

  /* ---------- Financial Intelligence ---------- */
  const finance = function (vm) {
    const p = vm.page; const st = E.L.state.stage; const v = scopeVals(); const dn0 = (E.L.state.path || [])[0];
    const chips = U.chips([{ k: 'all', label: 'All stages' }].concat(STAGE_KEYS.map(function (k) { return { k: k, label: SM[k].num + ' ' + SM[k].label }; })).map(function (c) { return { label: c.label, cls: st === c.k ? 'on' : '', pick: function () { A().setStage(c.k); } }; }));
    // Pending payments analysis from the FTO register.
    const dns = dn0 ? [dn0] : D.map(function (d) { return d.name; });
    let ftos = []; dns.forEach(function (d) { ftos = ftos.concat(finBatches(d)); });
    const pend = ftos.filter(function (f) { return f.group !== 'Credited'; });
    const byG = {}; pend.forEach(function (f) { byG[f.group] = (byG[f.group] || 0) + f.amt; });
    const ageB = [['0–24 h', 0, 24], ['24–48 h', 24, 48], ['2–7 days', 48, 168], ['> 7 days', 168, 1e9]].map(function (b) { const n = pend.filter(function (f) { return f.hAgo >= b[1] && f.hAgo < b[2]; }).length; return { label: b[0], w: Math.round(n / (pend.length || 1) * 100), v: fmtN(n), c: b[1] >= 168 ? '#D8714F' : b[1] >= 48 ? '#E0AE4F' : '#5B8FD0' }; });
    const why = {}; pend.filter(function (f) { return f.why; }).forEach(function (f) { why[f.why] = (why[f.why] || 0) + 1; });
    const pendCard = card(sh('Pending payments analysis', fmtN(pend.length) + ' FTOs not yet credited · ' + fmtCr(pend.reduce(function (a, f) { return a + f.amt; }, 0))) + '<div class="grid"><div class="c6"><div class="small" style="font-weight:700;margin-bottom:6px">By status</div>' + U.bars(Object.keys(byG).sort(function (a, b) { return byG[b] - byG[a]; }).map(function (g) { return { label: g, w: Math.round(byG[g] / (Math.max.apply(null, Object.keys(byG).map(function (x) { return byG[x]; })) || 1) * 100), v: fmtCr(byG[g]), c: g === 'Rejected' || g === 'Failed' ? '#D8714F' : '#5B8FD0' }; })) + '</div><div class="c6"><div class="small" style="font-weight:700;margin-bottom:6px">Ageing</div>' + U.bars(ageB) + (Object.keys(why).length ? '<div class="small" style="font-weight:700;margin:10px 0 6px">Rejection reasons</div>' + U.bars(Object.keys(why).sort(function (a, b) { return why[b] - why[a]; }).map(function (w) { return { label: w, w: Math.round(why[w] / (why[Object.keys(why)[0]] || 1) * 100), v: fmtN(why[w]), c: '#D8714F' }; })) : '') + '</div></div>');
    // District-wise utilisation: paid within 24 h status map + top variances.
    const dh = districtHealth();
    const varRows = dh.map(function (x) { return x; }).sort(function (a, b) { return b.v.pending - a.v.pending; }).slice(0, 6);
    const mapV = card(sh('District-wise payment performance', 'Farmers paid within 24 hours') + statusMap(Object.assign({}, vm, { map: Object.assign({}, vm.map, { metric: 'pay24' }) }), {}) + statusLegend());
    const varCard = card(sh('Districts with highest pending payments', 'Farmer payments · ₹ Cr') + '<div class="tw"><table class="dt compact"><thead><tr><th class="first">District</th><th class="r">Paid</th><th class="r">Pending</th><th class="r">Paid ≤ 24 h</th></tr></thead><tbody>' + varRows.map(function (x) { return '<tr><td class="first drill"' + on(function () { A().openDistrict(x.name); }) + '>' + esc(x.name) + '</td><td class="r">' + fmtCr(x.v.paid) + '</td><td class="r"><span class="bar" style="width:60px;margin-right:6px"><i class="bad" style="width:' + Math.round(x.v.pending / (varRows[0].v.pending || 1) * 100) + '%"></i></span><b>' + fmtCr(x.v.pending) + '</b></td><td class="r ' + tone(x.v.pay24, 0.9, 0.8) + '">' + pct(x.v.pay24) + '</td></tr>'; }).join('') + '</tbody></table></div>');
    const ind = card(sh('Key financial indicators', 'Season to date') + '<div class="sstrip">' + [['Procurement value', fmtCr(v.valueCr), 'paddy at MSP'], ['Miller bank guarantees', fmtCr(v.bg), 'held against CMR'], ['GLT charges pending', fmtCr(v.transPend), 'gunny, labour, transport'], ['Miller incidental charges', fmtCr(v.hamPend), 'pending settlement'], ['Storage charges', fmtCr(v.storCh), 'this season']].map(function (x) { return '<div class="si"><div class="v">' + esc(x[1]) + '</div><div class="l">' + esc(x[0]) + '</div><div class="l2">' + esc(x[2]) + '</div></div>'; }).join('') + '</div>');
    const body = '<div class="tools" style="justify-content:space-between"><div>' + chips + '</div><span class="note" style="margin:0">' + esc(p.sub) + '</span></div>' +
      '<div class="hero">' + U.tiles(p.kpis, { cls: p.kpis.length > 4 ? 'six' : 'four' }) + '</div>' +
      '<div class="grid"><div class="c7">' + card(sh('Farmer payment flow', 'From paddy procurement value to payments credited · ₹ Cr') + finFlow(v)) + '</div><div class="c5">' + (p.sChart && p.sChart.has ? card(sh(p.sChart.title.split(' · ')[0], p.sChart.sub) + U.lineChart(p.sChart)) : pendCard) + '</div>' +
      '<div class="c5">' + mapV + '</div><div class="c4">' + varCard + '</div><div class="c3">' + (p.sChart && p.sChart.has ? pendCard : ind) + '</div>' +
      (p.sChart && p.sChart.has ? '<div class="c12">' + ind + '</div>' : '') + '</div>' +
      foldGroup([
        fold('fin.kpis', p.scores[0] ? p.scores[0].title : 'Detailed performance indicators', p.scores[0] ? p.scores[0].items.length + ' KPIs' : '', scoresBlock(p.scores, { bare: true }), { open: true }),
        fold('fin.dist', p.table.title, p.table.rows.length + ' rows', '<div class="grid"><div class="c8">' + U.dataTable(p.table, { bare: true }) + '</div><div class="c4">' + (p.hasChart ? '<div class="small" style="font-weight:700;margin-bottom:6px">' + esc(p.chart.title) + '</div>' + U.bars(p.chart.bars) : '') + '</div></div>')
      ]) + rxBlock(p.rx);
    return { title: 'Financial Intelligence', sub: 'Procurement value, farmer payments, liabilities and charges across districts', body: body, rail: '' };
  };

  /* ---------- Preparedness ---------- */
  const prep = function (vm) {
    const p = vm.page; const u = p.prepUI;
    const views = U.seg(u.views);
    const ctl = '<div class="tools" style="justify-content:space-between"><div>' + views + '</div><div class="tools" style="margin:0">' + (u.canDist ? '<label class="small muted">District ' + U.select([{ v: '', l: 'All districts' }].concat((vm.distF.opts || []).map(function (d) { return { v: d.name, l: d.name }; })), u.distSel, u.onDist) + '</label>' : '') + '<label class="small muted">Parameter ' + U.select([{ v: '-1', l: 'All parameters' }].concat(u.paramChips.map(function (c, i) { return { v: String(i), l: c.label }; })), u.paramSel, u.onParam) + '</label>' + U.seg(u.sortBtns) + '</div></div>';
    const bands = '<div class="chips" style="margin:6px 0 10px"><span class="bchip good">Good · 70% and above</span><span class="bchip mod">Moderate · 50–69%</span><span class="bchip att">Needs attention · below 50%</span><span class="bchip na">No data</span><span class="note" style="margin:0">Display bands, not official targets</span></div>';
    let body = '';
    if (u.isOverview) {
      body = '<div class="grid"><div class="c6">' + card(sh('Top risks', 'Lowest-completion parameters · ' + u.scopeName) + u.topRisks.map(function (r) { return '<div class="attn"' + on(r.pick) + ' title="' + esc(r.tip) + '"><div><b>' + esc(r.name) + '</b><div class="s">' + esc(r.numden) + ' · ' + esc(r.fresh) + '</div></div><span><b class="' + U.toneOf(r.bandCls.replace('att', 'bad').replace('mod', 'warn')) + '">' + esc(r.pctTxt) + '</b> <span class="bchip ' + esc(r.bandCls.replace('bchip ', '')) + '">' + esc(r.bandTxt) + '</span></span></div>'; }).join('')) + '</div>' +
        '<div class="c6">' + card(sh(u.attnTitle, 'Overall readiness below 50%') + u.distAttn.map(function (d) { return '<div class="attn"' + on(d.pick) + '><div><b>' + esc(d.name) + '</b><div class="s">' + esc(d.meta) + '</div>' + (d.open && d.hasP ? '<div class="s">' + d.params.map(function (q) { return esc(q.name) + ' ' + esc(q.pctTxt); }).join(' · ') + '</div>' : '') + '</div><span><b>' + esc(d.pctTxt) + '</b> <span class="bchip ' + esc(d.bandCls.replace('bchip ', '')) + '">' + esc(d.bandTxt) + '</span> ' + U.btn('Act', d.act, 'xs') + '</span></div>'; }).join('') + (u.distAttn.length ? '' : U.empty('Nothing here needs attention.'))) + '</div>' +
        '<div class="c12">' + card(sh(p.prepChart.title, p.prepChart.sub) + U.lineChart(p.prepChart)) + '</div>' +
        '<div class="c12">' + card(sh('All 17 parameters', u.scopeName + ' · actual, completion and data freshness') + '<div class="pgrid17">' + u.grid.map(function (g) { return '<div class="pp"' + on(g.pick) + ' title="' + esc(g.tip) + '"><div class="pn"><span>' + esc(g.n) + '</span><span class="bchip ' + esc(g.bandCls.replace('bchip ', '')) + '">' + esc(g.bandTxt) + '</span></div><div class="pname">' + esc(g.name) + '</div><div class="pv">' + esc(g.pctTxt) + '</div><span class="bar"><i style="width:' + g.w + '%;" class="' + (g.bandCls.indexOf('good') > 0 ? 'good' : g.bandCls.indexOf('mod') > 0 ? 'warn' : g.bandCls.indexOf('att') > 0 ? 'bad' : '') + '"></i></span><div class="pnd">' + esc(g.numden) + '</div>' + (g.hasExtra ? '<div class="pnd">' + esc(g.extra) + '</div>' : '') + '<div class="pnd">' + esc(g.fresh) + '</div></div>'; }).join('') + '</div>') + '</div></div>';
    } else if (u.isCompare) {
      body = card(sh(u.rk.eyebrow, u.rk.head) + '<div class="metrics">' + u.rk.kpis.map(function (k) { return '<div class="metric"><div class="v">' + esc(k.v) + '</div><div class="l">' + esc(k.l) + '</div></div>'; }).join('') + '</div><p class="note">Ranked by ' + esc(u.rk.sortedName) + ' · cell = completion % and rank</p><div class="tw"><table class="rk"><thead><tr><th>#</th><th style="text-align:left">District</th>' + u.rk.cols.map(function (c) { return '<th class="' + (/sorted/.test(c.cls) ? 'sorted' : '') + '" title="' + esc(c.tip) + '"' + on(c.pick) + '>' + esc(c.label) + '</th>'; }).join('') + '</tr></thead><tbody>' + u.rk.rows.map(function (r) { return '<tr><td>' + esc(r.rank) + '</td><td class="first"' + on(r.pick) + '>' + esc(r.name) + '</td><td class="g"><b>' + esc(r.score) + '</b><span class="sub">' + esc(r.srank) + '</span></td>' + r.cells.map(function (c) { return '<td class="' + esc(c.cls.replace('rkc ', '')) + '">' + esc(c.v) + '<span class="sub">' + esc(c.sub) + '</span></td>'; }).join('') + '</tr>'; }).join('') + '</tbody><tfoot><tr><td></td><td class="first">State</td><td><b>' + esc(u.rk.state.score) + '</b></td>' + u.rk.state.cells.map(function (c) { return '<td>' + esc(c.v) + '</td>'; }).join('') + '</tr></tfoot></table></div><p class="note">' + esc(u.rk.note) + '</p>');
    } else if (u.isRanking) {
      body = card(sh('Ranking by parameter', 'Districts ranked high to low on each parameter', U.btn(u.rkSel.label, u.rkSel.toggle, 'sm')) + (u.rkSel.open ? '<div class="chips" style="margin-bottom:8px">' + u.rkSel.opts.map(function (o) { return '<button class="chip' + (o.on ? ' on' : '') + '"' + on(o.pick) + '>' + esc(o.name) + '</button>'; }).join('') + U.btn('All', u.rkSel.all, 'xs ghost') + U.btn('Done', u.rkSel.close, 'xs primary') + '</div>' : '') + '<div class="grid">' + u.rkc.map(function (c) { return '<div class="c4"><div class="card flat"><div class="sh"><div><h3 style="cursor:pointer"' + on(c.pick) + '>' + esc(c.title) + '</h3><p class="sub">' + esc(c.state) + '</p></div></div>' + (c.has ? '<div class="bars">' + c.rows.slice(0, 10).map(function (r) { return '<div class="brow"' + on(r.pick) + '><span class="bl">' + esc(r.rank) + ' ' + esc(r.name) + '</span><span class="bb"><i class="' + (r.bcls.indexOf(' g') > 0 ? 'good' : r.bcls.indexOf(' m') > 0 ? 'warn' : 'bad') + '" style="width:' + r.w + '%"></i></span><span class="bv">' + esc(r.pct) + '</span></div>'; }).join('') + (c.rows.length > 10 ? '<p class="note">' + (c.rows.length - 10) + ' more · click the title</p>' : '') + '</div>' : U.empty('No reports yet for this parameter.')) + '</div></div>'; }).join('') + '</div>');
    } else if (u.isParam) {
      const q = u.p;
      body = (u.hasParam ? card('<div class="crumbs">' + u.pCrumbs.map(function (c) { return (c.sep ? '<span class="sep">›</span>' : '') + '<button' + (c.dis ? ' disabled' : '') + on(c.go) + '>' + esc(c.label) + '</button>'; }).join('') + '</div><div class="sh"><div><h3>' + esc(q.title) + '</h3><p class="sub">' + esc(q.def) + '</p></div><div class="shr"><span class="bchip ' + esc(q.bandCls.replace('bchip ', '')) + '">' + esc(q.bandTxt) + '</span></div></div><div class="kv">' + esc(q.pctTxt) + '</div>' + U.facts(q.facts) + '<div class="formula" style="margin-top:10px"><b>Formula</b><span>' + esc(q.formula) + '</span>' + (q.hasExtra ? '<b>Also</b><span>' + esc(q.extra) + '</span>' : '') + (q.hasEquip ? '<b>Equipment</b><span>' + esc(q.equip) + '</span>' : '') + '</div>') + U.dataTable(u.pTable, { title: u.pTable.title, sub: u.pTable.note }) : card(sh('Parameter detail', 'Select a parameter') + U.chips(u.paramChips)));
    } else if (u.isReports) {
      body = card(sh('Reports', u.rptNeedDist ? 'Choose a district for RSK-wise and mill-wise reports' : '', U.seg(u.rptBtns)) + (u.hasRpt ? U.dataTable(u.rpt, { bare: true }) : U.empty('Select a district to run this report.')));
    }
    return { title: 'Preparedness', sub: 'Kharif 2026-27 · 17 parameters · snapshot of 29 Sep 2026', body: '<div style="margin-bottom:10px">' + U.tiles(p.kpis, { cls: 'six' }) + '</div>' + ctl + bands + body, rail: rail(p) };
  };

  /* ---------- Incidents & Monitoring ---------- */
  const chainMatrix = function (ch) {
    if (!ch || !ch.stepT || !ch.stepT.rows.length) return '';
    const typeOf = function (r) { return String((r.cells[0] || {}).v || '').toLowerCase(); };
    const steps = '<div class="chainmx">' + ch.stepT.rows.map(function (r) { const t = typeOf(r); const c = r.cells; return '<div class="chs ' + (t.indexOf('place') >= 0 ? 'place' : t.indexOf('move') >= 0 ? 'move' : t.indexOf('hand') >= 0 ? 'hand' : 'gate') + '"' + on(r.drill) + '><div class="t">' + esc(c[0].v) + '</div><div class="nm">' + esc(r.name) + '</div><div class="v">' + esc(c[1] ? c[1].v : '') + '</div>' + (c[2] && c[2].v && c[2].v !== '0' && c[2].v !== '—' ? '<div class="c">' + esc(c[2].v) + ' critical</div>' : '') + '</div>'; }).join('') + '</div>';
    const off = '<div class="grid" style="margin-top:10px">' + ch.off.map(function (o) { return '<div class="c4"><div class="chs gate"' + on(o.pick) + '><div class="t">Off the chain</div><div class="nm">' + esc(o.name) + '</div><div class="v">' + esc(o.open) + '</div><div class="small muted">' + esc(o.what) + '</div></div></div>'; }).join('') + '</div>';
    const step = ch.step && ch.step.has ? card('<div class="sh"><div><h3>' + esc(ch.step.title) + '</h3><p class="sub">' + esc(ch.step.sub) + '</p></div><div class="shr">' + U.btn('Open the records', ch.step.open, 'xs') + U.btn('Back to the whole chain', ch.step.close, 'xs ghost') + '</div></div><p class="small" style="margin-bottom:8px">' + esc(ch.step.what) + '</p>' + (ch.step.hasRules ? U.dataTable(ch.step.t, { bare: true, compact: true }) : U.empty('No incident rule is placed on this step yet, so there is no data feed for it.')), 'flat') : '';
    return '<div class="tools">' + U.seg(ch.lensBtns) + '<span class="small muted">Break each step by</span>' + U.seg(ch.splBtns) + '<span class="note" style="margin:0 0 0 auto">' + esc(ch.count) + '</span></div>' + steps + off + (ch.empty ? U.empty(ch.emptyTxt) : '') + (step ? '<div style="margin-top:10px">' + step + '</div>' : '');
  };
  const incidents = function (vm) {
    // Incident links may carry a district/record path; the work queue uses the root model.
    const p = (E.L.state.path || []).length ? E.peek({module: 'alerts', stage: E.L.state.stage, path: [], pivot: false}).page : vm.page;
    const home = E.peek({ module: 'overview', stage: 'all', pivot: false, kpiOpen: null });
    const body = '<div class="hero">' + U.tiles(p.kpis, { cls: 'four' }) + '</div>' +
      (home && home.page.queue ? card(sh('Incident work queue', home.page.queue.note) + queueBlock(home.page.queue, { max: 10 })) : '') +
      foldGroup([
        fold('inc.trend', 'Incident trends', p.itrend.period + ' · ' + p.itrend.scope, '<div class="grid"><div class="c4"><div class="metrics" style="grid-template-columns:1fr 1fr">' + p.itrend.metrics.map(function (m) { return '<div class="metric"' + on(m.go) + ' title="' + esc(m.calc) + '"><div class="l">' + esc(m.l) + '</div><div class="v">' + esc(m.v) + '</div></div>'; }).join('') + '</div></div><div class="c8">' + U.trendBars(p.itrend) + '<p class="note">' + esc(p.itrend.liveNote) + '</p></div></div>', { open: true }),
        fold('inc.stage', p.isel.title, p.isel.count, iselRows(p.isel), { open: true, right: U.btn(p.isel.viewLabel, p.isel.viewAll, 'xs ghost') }),
        fold('inc.chain', 'Where in the chain', p.chain.count, chainMatrix(p.chain)),
        fold('inc.types', p.t2.title, p.t2.count, U.dataTable(p.t2, { bare: true, max: 87 })),
        fold('inc.dist', p.table.title, p.table.rows.length + ' districts', '<div class="grid"><div class="c8">' + U.dataTable(p.table, { bare: true }) + '</div><div class="c4">' + (p.hasChart ? '<div class="small" style="font-weight:600;margin-bottom:6px">' + esc(p.chart.title) + '</div>' + U.bars(p.chart.bars) : '') + '</div></div>')
      ]);
    return { title: 'Incidents & Monitoring', sub: p.sub, body: body, rail: rail(p) };
  };
  const feedPage = function (vm, kind) {
    const p = vm.page; let extra = '';
    if (kind === 'cctv') extra = card(sh(p.tilesTitle, 'Flagged by video analytics') + '<div class="feeds">' + p.tiles.map(function (t) { return '<div class="feed"' + on(t.go) + '><div class="fv">' + icon('camera') + '<span class="badge">' + esc(t.badge) + '</span><span class="ts">' + esc(t.ts) + '</span></div><div class="fb"><b>' + esc(t.site) + '</b>' + esc(t.event) + '</div></div>'; }).join('') + '</div>');
    if (kind === 'image' && p.imgRef.has) extra = card(sh('What Good, Average, Bad and Unidentifiable look like', 'Reference photos from the image analysis', U.chips(p.imgRef.seas)) + '<div class="imgref">' + p.imgRef.ex.map(function (e) { const t = e.tag.toLowerCase(); return '<figure><img src="' + e.src + '" alt="' + esc(e.tag) + '"><figcaption><span class="imgtag ' + (t === 'average' ? 'avg' : t === 'unidentifiable' ? 'unid' : t) + '">' + esc(e.tag) + '</span>' + esc(e.text) + '</figcaption></figure>'; }).join('') + '</div><p class="note">' + esc(p.imgRef.note) + '</p>');
    if (p.hasDetail) extra = extras(p) + extra;
    const body = '<div style="margin-bottom:12px">' + U.tiles(p.kpis, { cls: p.kpis.length > 4 ? 'six' : 'four' }) + '</div>' + extra +
      '<div class="grid" style="margin-top:12px">' + (p.scores.length ? '<div class="c7">' + scoresBlock(p.scores) + '</div><div class="c5">' + chartCard(p) + '</div>' : (p.hasChart ? '<div class="c12">' + chartCard(p) + '</div>' : '')) +
      (p.hasT2 ? '<div class="c12">' + U.dataTable(p.t2, { title: p.t2.title, sub: p.t2.note, max: 60 }) + '</div>' : '') +
      '<div class="c12">' + U.dataTable(p.table, { title: p.table.title, sub: p.table.note }) + '</div><div class="c12">' + rxBlock(p.rx) + '</div></div>';
    return { title: p.title, sub: p.sub, body: body, rail: rail(p) };
  };

  /* ---------- Service & Public Voice ---------- */
  const voice = function (vm) {
    const al = E.peek({ module: 'alerts', stage: 'all', pivot: false, kpiOpen: null });
    const fps = E.peek({ module: 'glance', glance: 'fps', stage: 'all', pivot: false, kpiOpen: null });
    const p = al ? al.page : vm.page;
    const grv = p.kpis.filter(function (k) { return /Grievance|Avg age/.test(k.label); });
    const body = '<div style="margin-bottom:12px">' + U.tiles(grv.concat(fps ? fps.page.kpis : []), { cls: 'six' }) + '</div>' +
      '<div class="grid"><div class="c7">' + scoresBlock(p.scores) + '</div><div class="c5">' + (fps ? scoresBlock(fps.page.scores) + card(sh('Fair price shops', '') + U.dataTable(fps.page.table, { bare: true, compact: true, max: 28 })) : '') + '</div>' +
      '<div class="c12">' + rxBlock(p.rx) + '</div></div>';
    return { title: 'Service & Compliance', sub: 'FPS service, grievances, compliance indicators and media coverage', body: body, rail: rail(vm.page) };
  };
  const press = function (vm) {
    const P = vm.page.press;
    const today = '<div class="today"><div class="t"><div class="l">Clippings today</div><div class="v">' + esc(P.today.all) + '</div><div class="s"><button class="pws good"' + on(P.today.openPos) + '>Positive ' + esc(P.today.pos) + '</button><button class="pws bad"' + on(P.today.openNeg) + '>Negative ' + esc(P.today.neg) + '</button><button class="pws neu"' + on(P.today.openNeu) + '>Neutral ' + esc(P.today.neu) + '</button></div></div><div class="t" style="cursor:pointer"' + on(P.today.openAdv) + '><div class="l">Advisories raised</div><div class="v">' + esc(P.today.adv) + '</div><div class="small muted">today</div></div><div class="t" style="cursor:pointer"' + on(P.today.openRej) + '><div class="l">Rejoinders issued</div><div class="v">' + esc(P.today.rej) + '</div><div class="small muted">today</div></div></div>';
    const filters = '<div class="tools" style="margin-top:10px"><label class="search">' + icon('search') + '<input type="search" placeholder="Search headlines or text…" value="' + esc(P.q) + '"' + on(P.onQ, 'input') + ' data-fkey="pressq"></label>' + U.btn('Search', P.search, 'sm primary') + U.chips(P.presets) + '<label class="small muted">From <input type="date" class="sel" value="' + esc(P.fromV) + '"' + on(P.onFrom, 'change') + '></label><label class="small muted">To <input type="date" class="sel" value="' + esc(P.toV) + '"' + on(P.onTo, 'change') + '></label>' + U.seg(P.views) + '</div>' +
      '<div class="tools">' + U.chips(P.sents) + U.select(P.dept.opts, P.dept.val, P.dept.onChange) + U.select(P.paper.opts, P.paper.val, P.paper.onChange) + U.select(P.section.opts, P.section.val, P.section.onChange) + '<label class="small"><input type="checkbox"' + (P.needs ? ' checked' : '') + on(P.togNeeds, 'change') + '> Needs action</label><label class="small"><input type="checkbox"' + (P.hand ? ' checked' : '') + on(P.togHand, 'change') + '> Cut by hand</label>' + (P.isF ? U.btn('Clear', P.clear, 'xs ghost') : '') + '</div>';
    const items = P.none ? U.empty('No clippings match these filters.') : P.isList ? '<div class="tw"><table class="dt compact"><thead><tr><th class="txt">Sentiment</th><th class="txt">ID</th><th class="txt">Headline</th><th class="txt">Paper · section</th><th class="txt">Date</th><th class="txt">Dept</th><th class="txt">Action</th></tr></thead><tbody>' + P.items.map(function (c) { return '<tr><td class="txt"><span class="pws ' + esc(c.scls.replace('pws ', '')) + '">' + esc(c.sent) + '</span></td><td class="first drill"' + on(c.open) + '>' + esc(c.id) + '</td><td class="txt">' + esc(c.head) + '</td><td class="txt">' + esc(c.paper + ' · ' + c.sec) + '</td><td class="txt">' + esc(c.date) + '</td><td class="txt">' + esc(c.dept) + '</td><td class="txt">' + esc(c.actTxt) + '</td></tr>'; }).join('') + '</tbody></table></div>' :
      '<div class="pgrid">' + P.items.map(function (c) { return '<div class="pc ' + esc(c.scls.replace('pws ', '')) + (c.unread ? ' unread' : '') + '"' + on(c.open) + '><div class="pm"><span><span class="pws ' + esc(c.scls.replace('pws ', '')) + '">' + esc(c.sent) + '</span> ' + (c.needs ? '<span class="pws bad">needs action</span>' : '') + '</span><span>' + esc(c.id) + '</span></div><div class="small muted">' + esc(c.paper) + ' · ' + esc(c.sec) + ' · ' + esc(c.date) + '</div><div class="ph2">' + esc(c.head) + '</div><div class="pai"><b>AI</b>' + esc(c.ai) + '</div><div class="pf"><span class="tag">' + esc(c.dept) + '</span><span>' + esc(c.locs) + '</span>' + (c.hasAct ? '<span class="good">✓ ' + esc(c.actTxt) + '</span>' : '') + '</div></div>'; }).join('') + '</div>';
    const pager = '<div class="tools" style="justify-content:space-between;margin-top:10px"><span class="note" style="margin:0">Showing ' + esc(P.range) + '</span><div>' + U.btn('← Previous', P.prev, 'xs' + (P.prevDis ? ' ghost' : '')) + ' ' + U.btn('Next →', P.next, 'xs' + (P.nextDis ? ' ghost' : '')) + '</div></div>';
    const head = sh('Press Watch · AI-read', P.scope + ' · ' + P.count + ' articles in this result · ' + P.papersN + ' newspapers · ' + P.needsN + ' need attention', U.btn('Refresh', P.refresh, 'xs', 'refresh') + (P.hasUnread ? U.btn(P.unreadTxt + ' · show', P.openUnread, 'xs gold') + U.btn('Mark all read', P.markRead, 'xs ghost') : ''));
    const body = card(head + '<p class="note" style="margin:0 0 10px">Sample clippings until the press-clipping feed is connected.</p>' + today + filters + items + pager);
    return { title: 'Service & Compliance · Press Watch', sub: vm.page.sub, body: body, rail: rail(vm.page) };
  };
  const youtube = function (vm) {
    const Y = vm.page.yt;
    const vid = function (v) { return '<div class="vc"' + on(v.open) + '><img src="' + esc(v.thumb) + '" alt="" loading="lazy"><div class="vb"><div class="small"><span class="pws ' + esc(v.scls.replace('pws ', '')) + '">' + esc(v.s) + '</span> <span class="muted">' + esc(v.ch) + ' · ' + esc(v.dur) + '</span></div><div class="vt">' + esc(v.t) + '</div><div class="small muted">' + esc(v.date) + ' · ' + esc(v.stats) + '</div><div class="pai small"><b>AI</b>' + esc(v.why) + '</div></div></div>'; };
    const body = card(sh('YouTube watch · AI-read', Y.scope + ' · ' + Y.count + ' videos in this result · ' + Y.views + ' views · ' + Y.comments + ' comments', '') + '<p class="note" style="margin:0 0 10px">' + esc(Y.chNote) + ' · ' + esc(Y.apN) + ' AP videos of ' + esc(Y.totalFile) + ' scanned</p>' +
      '<div class="tools"><label class="search">' + icon('search') + '<input type="search" placeholder="Search videos…" value="' + esc(Y.q) + '"' + on(Y.onQ, 'input') + ' data-fkey="ytq"></label>' + U.btn('Search', Y.search, 'sm primary') + U.chips(Y.presets) + U.seg(Y.sorts) + U.chips(Y.sents) + U.select(Y.chOpts, Y.chVal, Y.onCh) + (Y.isF ? U.btn('Clear', Y.clear, 'xs ghost') : '') + '</div>' +
      (Y.none ? U.empty('No videos match these filters.') : Y.isTop ? '<div class="sh"><h3>' + esc(Y.topTitle) + '</h3>' + U.btn('View all ' + Y.allN + ' videos →', Y.showAll, 'xs') + '</div><div class="vgrid">' + Y.top.map(vid).join('') + '</div>' : '<div class="sh"><h3>All videos · ' + esc(Y.count) + '</h3>' + U.btn('← Back to latest', Y.showTop, 'xs') + '</div><div class="vgrid">' + Y.items.map(vid).join('') + '</div>'));
    return { title: 'Service & Compliance · YouTube watch', sub: vm.page.sub, body: body, rail: rail(vm.page) };
  };

  /* ---------- Intelligence & Decisions ---------- */
  const intel = function (vm, sub) {
    const I = vm.page.intel;
    if (sub === 'log' && I.isMain) { I.showLog(); }
    if (sub !== 'log' && I.isLog) { I.showMain(); }
    let body = '';
    if (sub === 'log') {
      body = card(sh('Decision log · ' + I.logN, 'Decisions and escalations, newest first', U.select(I.logF.stages, I.logF.stage, I.logF.onStage, '', 'v', 'l') + U.select(I.logF.mods, I.logF.mod, I.logF.onMod, '', 'v', 'l') + (I.logF.isF ? U.btn('Clear', I.logF.clear, 'xs ghost') : '')) +
        (I.hasLog ? '<div class="tw"><table class="logt"><thead><tr><th>Action</th><th>When</th><th>Record</th><th>Stage · module</th><th>Decision</th><th>Suggested action</th><th>Owner</th><th>Status</th><th></th></tr></thead><tbody>' + I.log.map(function (e) { return '<tr><td><button class="lnk"' + on(e.open) + '>' + esc(e.id) + '</button></td><td>' + esc(e.when) + '</td><td>' + esc(e.rec) + '</td><td>' + esc(e.stg) + ' · ' + esc(e.mod) + '</td><td><b>' + esc(e.decision) + '</b></td><td>' + esc(e.action) + '</td><td>' + esc(e.owner) + '</td><td>' + esc(e.status) + '</td><td>' + (e.done ? U.btn('Mark done', e.done, 'xs') : '') + ' ' + (e.undo ? U.btn('Undo', e.undo, 'xs ghost') : '') + '</td></tr>'; }).join('') + '</tbody></table></div>' : U.empty(I.logEmpty)));
    } else {
      const ask = card(sh('Ask Intelligence', I.scope, I.hasCtx ? U.btn('End this chat', I.endCtx, 'xs ghost') : (I.hasMsgs ? U.btn('Clear', I.clearChat, 'xs ghost') : '')) + (I.hasCtx ? '<p class="note">New chat about: ' + esc(I.ctxTitle) + '</p>' : '') +
        '<form class="askbar"' + on(function (e) { e.preventDefault(); I.onSubmit(e); }, 'submit') + '><input placeholder="Ask about payments, incidents, CMR, godowns, trips…" value="' + esc(I.input) + '"' + on(I.onInput, 'input') + ' data-fkey="intelq">' + U.btn('Ask', function (e) { I.onSubmit(e); }, 'primary') + '</form>' +
        (I.hasMsgs ? '<div class="chat" style="margin-top:10px">' + I.msgs.map(function (m) { return '<div class="msg' + (m.me ? ' me' : '') + '">' + esc(m.text) + (m.hasBars ? '<div class="mb">' + U.bars(m.bars) + '</div>' : '') + (m.hasAct ? '<div class="mb">' + U.btn(m.actLabel, m.act, 'xs') + '</div>' : '') + (m.hasOpts ? '<div class="mb chips">' + m.opts.map(function (o) { return '<button class="chip"' + on(o.pick) + '>' + esc(o.label) + '</button>'; }).join('') + '</div>' : '') + (m.hasMeta ? '<div class="mm">' + esc(m.meta) + '</div>' : '') + '</div>'; }).join('') + '</div>' : '') +
        '<div class="small muted" style="margin-top:10px">' + esc(I.faqLabel) + '</div>' + U.chips(I.faqs.map(function (f) { return { label: f.q, pick: f.ask }; })));
      const ins = card(sh('Most relevant now', '') + '<div class="ins">' + I.insights.map(function (i) { return '<div class="i"><div class="l">' + esc(i.l) + '</div><div class="v ' + U.toneOf(i.cls) + '">' + esc(i.v) + '</div><div class="s">' + esc(i.s) + '</div><div class="a">' + U.link('Drill down ›', i.go) + U.btn('Act', i.act, 'xs') + '</div></div>'; }).join('') + '</div>');
      const recs = card(sh('What to act on', 'Ranked by urgency') + '<div class="stack" style="gap:8px">' + I.recs.map(function (r) { return '<div class="rec ' + esc(r.sev) + '"><div class="rh"' + on(r.toggle) + '><span class="rn">' + esc(r.n) + '</span><span class="ra">' + esc(r.area) + '</span><span class="rt">' + esc(r.title) + '</span><span style="margin-left:auto" class="muted">' + esc(r.arrow) + '</span></div>' + (r.open ? '<div class="rb"><div><div class="lab">Suggested action</div><div style="font-weight:600">' + esc(r.act) + '</div></div><div><button class="lnk"' + on(r.toggleWhy) + '>' + esc(r.whyLabel) + '</button>' + (r.whyOpen ? '<ul class="why">' + r.why.map(function (w) { return '<li>' + esc(w.t) + (w.hasInc ? ' <span class="inclink">' + esc(w.incN) + '</span>' : '') + ' <button class="lnk small"' + on(w.ask) + '>Ask follow-up ›</button></li>'; }).join('') + '</ul>' : '') + '</div>' + (r.hasWhere ? '<div><div class="lab">Where</div>' + U.chips(r.where.map(function (w) { return { label: w.t }; })) + '</div>' : '') + '<div class="small muted">Owner: ' + esc(r.owner) + ' · By: ' + esc(r.by) + ' · Expected: ' + esc(r.effect) + '</div><div class="tools" style="margin:0">' + U.btn('Act', r.doAct, 'sm primary') + U.btn('View records', r.view, 'sm') + U.btn('Details', r.details, 'sm') + U.btn('Ask more', r.ask, 'sm') + '</div></div>' : '') + '</div>'; }).join('') + '</div>');
      body = '<div class="grid"><div class="c12">' + ask + '</div><div class="c12">' + ins + '</div><div class="c12">' + recs + '</div></div>';
    }
    return { title: 'Decisions & Interventions', sub: 'Suggested actions with reasoning, from the integrated records', body: body, rail: '' };
  };
  const inbox = function (vm) {
    const B = vm.page.inbox;
    const body = card(sh('Inbox · District Manager, ' + B.dn, 'Escalations, assignments and advisories', (B.hasUnread ? U.btn('Mark all read', B.markAll, 'xs') : '')) +
      '<div class="metrics">' + B.tiles.map(function (t) { return '<div class="metric' + (/on/.test(t.cls) ? ' on' : '') + '"' + on(t.pick) + '><div class="v">' + esc(t.n) + '</div><div class="l">' + esc(t.label) + '</div></div>'; }).join('') + '</div>' +
      '<div class="tools"><label class="search">' + icon('search') + '<input type="search" placeholder="Search the inbox…" value="' + esc(B.q) + '"' + on(B.onQ, 'input') + ' data-fkey="inboxq"></label>' + U.chips(B.types) + '</div>' +
      (B.none ? U.empty(B.noneText) : '<div class="stack" style="gap:6px">' + B.items.map(function (it) { return '<div class="ib' + (/unread/.test(it.cls) ? ' unread' : '') + '"' + on(it.open) + '><span class="dot ' + (it.dot ? 'bad' : '') + '"></span><div><div class="ibk ' + U.toneOf(it.kcls) + '">' + esc(it.kind) + ' <span class="muted">from ' + esc(it.from) + ' · ' + esc(it.when) + '</span></div><div class="ibs">' + esc(it.subject) + '</div><div class="ibl">' + esc(it.line) + '</div>' + (it.hasReply ? '<div class="ibl good">↳ ' + esc(it.reply) + '</div>' : '') + '</div><div class="ibm"><b>' + esc(it.status) + '</b><br>' + esc(it.meta) + '</div></div>'; }).join('') + '</div>'));
    return { title: 'Inbox', sub: 'District Manager, ' + B.dn, body: body, rail: '' };
  };

  /* ---------- Pivot (reports) ---------- */
  const pivot = function (vm) {
    const P = vm.pv;
    const body = card(sh('Pivot table builder', P.summary, U.btn('Close', vm.togglePivot, 'xs ghost', 'close')) +
      '<div class="tools">' + U.chips(P.dsBtns.map(function (b) { return { label: b.label, cls: b.on || /on/.test(b.cls || '') ? 'on' : '', pick: b.pick }; })) + U.select([{ v: '', l: 'All districts' }].concat(P.distOpts.map(function (d) { return { v: d.name, l: d.name }; })), P.distVal, P.onDist) + U.btn('Clear all', P.clearAll, 'xs ghost') + '</div>' +
      '<div class="tools"><span class="small muted">Presets</span>' + U.chips(P.presets.map(function (p) { return { label: p.label || p.name || p.n || '', cls: p.cls, pick: p.pick }; })) + '</div>' +
      '<div class="tools"><span class="small muted">Fields</span>' + U.chips(P.fields.map(function (f) { return { label: f.label, cls: f.cls, pick: f.pick }; })) + (P.hasPick ? '<span class="small">Add <b>' + esc(P.pick) + '</b> to:</span>' + U.btn('Filters', P.addF, 'xs') + U.btn('Columns', P.addC, 'xs') + U.btn('Rows', P.addR, 'xs') + U.btn('Cancel', P.cancelPick, 'xs ghost') : '') + '</div>' +
      '<div class="pv"><div class="zones">' + P.zones.map(function (z) { return '<div class="zone"><b>' + esc(z.label) + '</b>' + U.chips((z.items || z.chips || []).map(function (c) { return { label: c.label, rm: c.rm, pick: c.pick }; })) + '</div>'; }).join('') + '</div>' +
      (P.hasFPanel ? '<div class="card flat"><b>Filter: ' + esc(P.fField) + '</b>' + U.chips(P.fVals.map(function (v) { return { label: v.label, cls: v.on ? 'on' : '', pick: v.pick }; })) + U.btn('Show all', P.fAll, 'xs ghost') + U.btn('Done', P.fClose, 'xs primary') + '</div>' : '') +
      '<div class="tools"><span class="small">' + esc(P.rowsLabel) + '</span>' + U.btn('Expand all', P.expandAll, 'xs ghost') + U.btn('Collapse all', P.collapseAll, 'xs ghost') + U.btn('Swap rows ↔ columns', P.swap, 'xs ghost') + '<input class="sel" placeholder="View name" value="' + esc(P.name) + '"' + on(P.onName, 'input') + ' data-fkey="pvname">' + U.btn('Save view', P.save, 'xs') + U.btn('Download CSV', P.download, 'xs', 'download') + U.btn('Share', P.share, 'xs', 'share') + '<span class="note" style="margin:0">' + esc(P.msg) + '</span></div>' +
      '<div class="tw"><table class="pvt"><thead><tr>' + P.head.map(function (h) { return '<th>' + esc(h.label) + '</th>'; }).join('') + '</tr></thead><tbody>' + P.body.map(function (r) { return '<tr><td class="first" style="padding-left:' + (8 + (r.lvl || 0) * 14) + 'px"' + on(r.toggle || r.pick) + '>' + esc((r.arrow || '') + ' ' + (r.label || r.name || '')) + '</td>' + (r.cells || []).map(function (c) { return '<td' + (c.pick ? on(c.pick) : '') + '>' + esc(c.v) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody><tfoot><tr><td>Total</td>' + P.total.map(function (c) { return '<td>' + esc(c.v) + '</td>'; }).join('') + '</tr></tfoot></table></div>' +
      (P.hasRecs ? '<div class="card flat" style="margin-top:10px">' + sh(P.rec.title, P.rec.note, U.btn('Close', P.closeRecs, 'xs ghost')) + U.dataTable(P.rec, { bare: true, compact: true, max: 60 }) + '</div>' : '') + '</div>');
    return { title: 'Reports', sub: 'Pivot analysis over the integrated records', body: body, rail: '' };
  };

  return { overview: overview, chainAll: chainAll, stage: stage, districts: districts, district: district, finance: finance, prep: prep, incidents: incidents, feedPage: feedPage, voice: voice, press: press, youtube: youtube, intel: intel, inbox: inbox, pivot: pivot, rail: rail, GLANCE_OF: GLANCE_OF, STAGE_KEYS: STAGE_KEYS };
})();
