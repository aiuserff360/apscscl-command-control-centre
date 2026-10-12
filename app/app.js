/* App shell: navigation (top-down IA), routing, event delegation and drawers. */
window.App = (function () {
  'use strict';
  const E = window.Engine, U = window.UI, P = window.Pages, esc = U.esc, on = U.on, icon = U.icon;
  const SM = U.STAGE_META;
  const S = { section: 'overview', stage: 'all', sub: '', rail: true, lastKey: '', scrollTop: false, hashing: false, folds: (function () { try { return JSON.parse(localStorage.getItem('ccc.folds') || '{}') || {}; } catch (e) { return {}; } })() };
  S.fold = function (key, open) { S.folds[key] = open; try { localStorage.setItem('ccc.folds', JSON.stringify(S.folds)); } catch (e) {} };
  const SECTIONS = [
    { k: 'overview', label: 'Executive Overview', icon: 'home' },
    { k: 'chain', label: 'Value Chain Performance', icon: 'chain' },
    { k: 'districts', label: 'District Intelligence', icon: 'map' },
    { k: 'stock', label: 'Stock & Movement', icon: 'warehouse' },
    { k: 'finance', label: 'Financial Intelligence', icon: 'rupee' },
    { k: 'prep', label: 'Preparedness', icon: 'check' },
    { k: 'incidents', label: 'Incidents & Monitoring', icon: 'alert' },
    { k: 'voice', label: 'Service & Compliance', icon: 'voice' },
    { k: 'intel', label: 'Decisions & Interventions', icon: 'brain' }
  ];
  const SUBS = {
    incidents: [['', 'Incidents'], ['cctv', 'CCTV records'], ['gps', 'GPS tracking'], ['image', 'Image analyser']],
    voice: [['', 'Grievances & service'], ['press', 'Press Watch'], ['youtube', 'YouTube watch']],
    intel: [['', 'Insights & actions'], ['log', 'Decision log'], ['inbox', 'Inbox']],
    prep: [['', 'Executive overview'], ['compare', 'District ranking'], ['ranking', 'By parameter'], ['param', 'Parameter detail'], ['reports', 'Reports']]
  };
  const MOD_OF_SUB = { incidents: { '': 'alerts', cctv: 'cctv', gps: 'gps', image: 'img' }, voice: { '': 'alerts', press: 'news', youtube: 'yt' } };
  const GL_STAGE = { rsk: 'proc', mill: 'cmr', godown: 'stor', mls: 's2', fps: 's2' };
  const root = document.getElementById('root');

  /* ---------- navigation: my IA → baseline state ---------- */
  const basePath = function () { const s = E.L.state; return s.role === 'dm' ? [s.dm] : []; };
  const applyNav = function () {
    const s = E.L.state; const st = { pivot: false, kpiOpen: null };
    const keep = (s.path || []).slice(0, 1);
    switch (S.section) {
      case 'overview': st.module = 'overview'; st.stage = 'all'; st.path = basePath(); break;
      case 'chain': st.module = 'overview'; st.stage = S.stage; st.path = basePath(); if (S.sub === 'entities' && S.stage === 'all') S.sub = ''; break;
      case 'districts': st.module = 'overview'; st.stage = S.stage; st.path = s.path && s.path.length ? s.path : basePath(); break;
      case 'stock': st.module = 'overview'; st.stage = 'all'; st.path = keep; break;
      case 'guide': st.module = 'overview'; st.stage = 'all'; st.path = basePath(); break;
      case 'finance': st.module = 'fin'; st.stage = S.stage; st.path = keep; break;
      case 'prep': st.module = 'prep'; st.stage = 'all'; st.prepView = S.sub || 'overview'; st.path = keep; break;
      case 'incidents': st.module = MOD_OF_SUB.incidents[S.sub] || 'alerts'; st.stage = S.stage; st.path = keep; break;
      case 'voice': st.module = MOD_OF_SUB.voice[S.sub] || 'alerts'; st.stage = 'all'; st.path = keep; break;
      case 'intel': st.module = S.sub === 'inbox' && s.role === 'dm' ? 'inbox' : 'intel'; st.stage = 'all'; st.path = keep; break;
    }
    E.set(st);
    S.lastKey = stateKey();
  };
  const stateKey = function () { const s = E.L.state; return [s.module, s.stage, (s.path || []).join('|'), s.glance, s.prepView, s.role, s.pivot].join('#'); };
  /* baseline state → my IA (after a baseline closure navigated) */
  const sync = function () {
    const key = stateKey(); if (key === S.lastKey) return; S.lastKey = key;
    const s = E.L.state; const m = s.module; const p = s.path || []; const depth = s.role === 'dm' ? Math.max(0, p.length - 1) : p.length;
    if (s.pivot) { S.section = 'reports'; return; }
    if (S.section === 'reports') S.section = 'overview';
    if (m === 'overview') {
      if (depth >= 1 || (s.role === 'dm' && p.length >= 1 && S.section !== 'overview' && S.section !== 'chain')) { S.section = 'districts'; S.stage = s.stage; if (s.stage === 'all') S.sub = ''; }
      else if (s.stage !== 'all') { S.section = 'chain'; S.stage = s.stage; if (S.sub === 'entities') S.sub = ''; }
      else if (S.section !== 'chain' && S.section !== 'districts') { S.section = 'overview'; S.stage = 'all'; S.sub = ''; }
      else { S.stage = 'all'; S.sub = ''; }
    }
    else if (m === 'glance') { S.section = depth >= 1 ? 'districts' : 'chain'; S.stage = GL_STAGE[s.glance] || 'proc'; S.sub = 'entities'; }
    else if (m === 'fin') { S.section = 'finance'; S.stage = s.stage; S.sub = ''; }
    else if (m === 'prep') { S.section = 'prep'; S.sub = s.prepView && s.prepView !== 'overview' ? s.prepView : ''; }
    else if (m === 'alerts') { if (S.section !== 'voice') { S.section = 'incidents'; S.sub = ''; } S.stage = s.stage; }
    else if (m === 'cctv' || m === 'gps' || m === 'img') { S.section = 'incidents'; S.sub = { cctv: 'cctv', gps: 'gps', img: 'image' }[m]; S.stage = s.stage; }
    else if (m === 'news') { S.section = 'voice'; S.sub = 'press'; }
    else if (m === 'yt') { S.section = 'voice'; S.sub = 'youtube'; }
    else if (m === 'intel') { S.section = 'intel'; if (S.sub !== 'log') S.sub = ''; }
    else if (m === 'inbox') { S.section = 'intel'; S.sub = 'inbox'; }
  };
  const go = function (section, stage, sub) {
    S.section = section; S.stage = stage || 'all'; S.sub = sub || ''; S.scrollTop = true; S.push = true;
    if (section !== 'districts') E.set({ path: basePath() });
    applyNav(); E.invalidate();
  };
  const setStage = function (k) { S.stage = k; if (S.section === 'chain' && S.sub === 'entities') S.sub = ''; applyNav(); E.invalidate(); };
  const setSub = function (sub) { S.sub = sub; applyNav(); E.invalidate(); };
  const openLens = function (section) { const dn = (E.L.state.path || [])[0]; S.section = section; S.stage = 'all'; S.sub = ''; S.scrollTop = true; S.push = true; E.set({ path: dn ? [dn] : basePath() }); applyNav(); E.invalidate(); };
  const openDistrict = function (name) { S.section = 'districts'; S.stage = 'all'; S.sub = ''; S.scrollTop = true; E.set({ path: [name] }); applyNav(); E.invalidate(); };

  /* ---------- hash routing ---------- */
  const hashFor = function () {
    const s = E.L.state; const p = s.path || []; const d = p[0];
    const q = d && S.section !== 'districts' && s.role !== 'dm' ? '?d=' + encodeURIComponent(d) : '';
    switch (S.section) {
      case 'overview': return '#/overview' + q;
      case 'chain': return '#/chain/' + S.stage + (S.sub ? '/' + S.sub : '') + q;
      case 'districts': return '#/districts' + (d ? '/' + encodeURIComponent(d) + (S.stage !== 'all' ? '/' + S.stage + (S.sub ? '/' + S.sub : '') : '') : '') + (p.length > 1 ? '?at=' + encodeURIComponent(JSON.stringify(p.slice(1))) : '');
      case 'finance': return '#/finance' + (S.stage !== 'all' ? '/' + S.stage : '') + q;
      case 'reports': return '#/reports' + q;
      default: return '#/' + S.section + (S.sub ? '/' + S.sub : '') + q;
    }
  };
  const readHash = function () {
    const raw = (location.hash || '#/overview').replace(/^#\/?/, ''); const qi = raw.indexOf('?'); const h = qi >= 0 ? raw.slice(0, qi) : raw; const qs = qi >= 0 ? raw.slice(qi + 1) : '';
    const qd = (qs.match(/(?:^|&)d=([^&]*)/) || [])[1]; const parts = h.split('/').map(decodeURIComponent);
    if (qd && E.L.state.role !== 'dm') E.set({ path: [decodeURIComponent(qd)] }); else if (parts[0] !== 'districts') E.set({ path: basePath() });
    const sec = parts[0] || 'overview'; S.sub = ''; S.stage = 'all';
    if (!SECTIONS.some(function (x) { return x.k === sec; }) && sec !== 'reports' && sec !== 'guide') { S.section = 'overview'; }
    else S.section = sec;
    if (sec === 'chain') { S.stage = SM[parts[1]] ? parts[1] : 'all'; S.sub = parts[2] || ''; }
    else if (sec === 'districts') { if (parts[1]) { let tail = []; try { const a = new URLSearchParams(qs).get('at'); if (a) { const parsed = JSON.parse(a); if (Array.isArray(parsed) && parsed.every(x => typeof x === 'string')) tail = parsed.slice(0, 3); } } catch (e) {} E.set({ path: [E.L.state.role === 'dm' ? E.L.state.dm : parts[1]].concat(tail) }); S.stage = SM[parts[2]] ? parts[2] : 'all'; S.sub = parts[3] || ''; } else E.set({ path: basePath() }); }
    else if (sec === 'finance') { S.stage = SM[parts[1]] ? parts[1] : 'all'; }
    else if (sec === 'reports') { E.set({ pivot: true }); return; }
    else { S.sub = parts[1] || ''; }
    applyNav();
  };
  const writeHash = function () { const h = hashFor(); if (location.hash !== h) { S.hashing = true; if (S.push) history.pushState(null, '', h); else history.replaceState(null, '', h); S.hashing = false; } S.push = false; };
  window.addEventListener('popstate', function () { if (S.hashing) return; readHash(); E.invalidate(); });

  /* ---------- shell ---------- */
  const banner = function (vm) {
    const s = E.L.state;
    return '<header class="banner"><div class="brand"><div class="emblem">' + icon('sheaf') + '</div><div><h1>APSCSCL</h1><div class="bl">Andhra Pradesh State Civil Supplies Corporation Limited</div><div class="bl2">Government of Andhra Pradesh</div></div></div>' +
      '<div class="tagline"><svg class="art" viewBox="0 0 600 78" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dff0f8"/><stop offset="1" stop-color="#f7fbf3"/></linearGradient></defs><rect width="600" height="78" fill="url(#sky)"/><circle cx="520" cy="22" r="11" fill="#f6d27a"/><path d="M0 62 Q80 40 160 58 T320 56 T480 60 T600 54 V78 H0Z" fill="#cfe6c2"/><path d="M0 70 Q100 58 200 68 T400 66 T600 68 V78 H0Z" fill="#a9d39a"/><path d="M250 62 L262 34 L274 62Z M262 34 L262 26" fill="#c8b58a" stroke="#a68a55" stroke-width="1"/><path d="M300 62 L316 28 L332 62Z M316 28 L316 20" fill="#d6c39a" stroke="#a68a55" stroke-width="1"/><path d="M282 62 L288 46 L294 62Z" fill="#c8b58a"/></svg><span style="position:relative">Command Control Centre<small>Food Security for a Prosperous Andhra Pradesh</small></span></div>' +
      '<div class="government-brand"><span class="gseal">' + icon('sheaf') + '</span><span><b>Government of</b><b>Andhra Pradesh</b></span><span class="pf">' + icon('sprout') + '<span>People First<br>Service Always</span></span></div>' +
      '<div class="bright">' + U.btn('Ask', vm.chatOpen ? vm.closeChat : vm.openChat, 'sm gold', 'ask') + U.btn('Reports', vm.togglePivot, 'sm ghost', 'grid') +
      '<div class="role"><span class="av">' + (s.role === 'dm' ? 'DM' : 'C') + '</span><div><select' + on(vm.onRole, 'change') + '>' + vm.roleBtns.filter(function (b) { return b.label !== 'Head office'; }).map(function (b) { return '<option value="' + esc(b.label === 'Commissioner' ? 'comm' : 'dm') + '"' + (b.on ? ' selected' : '') + '>' + esc(b.label) + '</option>'; }).join('') + '</select>' + (vm.isDM ? '<div class="sub"><select' + on(vm.onDm, 'change') + '>' + vm.distF.opts.map(function (d) { return '<option' + (d.name === vm.dm ? ' selected' : '') + '>' + esc(d.name) + '</option>'; }).join('') + '</select></div>' : '<div class="sub">APSCSCL</div>') + '</div></div></div></header>';
  };
  const nav = function (vm) {
    const s = E.L.state; const inboxN = vm.isDM ? (vm.leftItems.filter(function (x) { return x.sk === 'inbox'; })[0] || {}).num : '';
    return '<nav class="nav"><div class="nl">Command Control Centre</div>' + SECTIONS.map(function (x) {
      const onCls = S.section === x.k ? ' on' : '';
      let subs = '';
      if (S.section === x.k && SUBS[x.k]) subs = '<div class="sub">' + SUBS[x.k].filter(function (t) { return !(x.k === 'intel' && t[0] === 'inbox' && !vm.isDM); }).map(function (t) { return '<button class="' + (S.sub === t[0] ? 'on' : '') + '"' + on(function () { go(x.k, 'all', t[0]); }) + '>' + esc(t[1]) + (t[0] === 'inbox' && inboxN ? ' <span class="cnt">' + esc(inboxN) + '</span>' : '') + '</button>'; }).join('') + '</div>';
      if (S.section === x.k && x.k === 'chain') subs = '<div class="sub">' + [['all', 'All stages']].concat(P.STAGE_KEYS.map(function (k) { return [k, SM[k].num + ' · ' + SM[k].label]; })).map(function (t) { return '<button class="' + (S.stage === t[0] ? 'on' : '') + '"' + on(function () { go('chain', t[0]); }) + '>' + esc(t[1]) + '</button>'; }).join('') + '</div>';
      return '<button class="ni' + onCls + '"' + on(function () { go(x.k, x.k === 'chain' ? S.stage : 'all'); }) + '>' + icon(x.icon) + '<span>' + esc(x.label) + '</span>' + (x.k === 'intel' && inboxN ? '<span class="cnt">' + esc(inboxN) + '</span>' : '') + '</button>' + subs;
    }).join('') + '<div class="nav-utility">' + U.btn('Dashboard guide', function () { go('guide'); }, 'xs ghost', 'chain') + U.btn('Reports & pivot', vm.togglePivot, 'xs ghost', 'grid') + '</div><div class="foot"><b>Annadhanam<br>Aarogyam<br>Samruddhi<br>Andhra Pradesh</b></div></nav>';
  };
  const filterbar = function (vm) {
    const seas = vm.seas;
    const seasPop = seas.open ? '<div class="card flat" style="position:absolute;z-index:5;margin-top:6px;min-width:300px"><div class="small muted" style="margin-bottom:6px">Marketing seasons · select one or more</div>' + seas.groups.map(function (g) { return '<div class="small" style="margin:4px 0"><b>' + esc(g.year) + '</b> ' + U.chips(g.items.map(function (it) { return { label: it.name + (it.sub ? ' · ' + it.sub : ''), cls: it.on ? 'on' : '', pick: it.pick }; })) + '</div>'; }).join('') + '<div class="tools" style="margin-top:8px">' + U.btn('All seasons', seas.all, 'xs' + (/on/.test(seas.allCls) ? ' primary' : '')) + U.btn('Custom date & time…', seas.custom, 'xs' + (/on/.test(seas.custCls) ? ' primary' : '')) + U.btn('Clear', seas.clear, 'xs ghost') + U.btn('Done', seas.close, 'xs primary') + '</div></div>' : '';
    const custom = vm.isCustom ? '<div class="f"><span class="fl">From</span><span class="fv"><input type="datetime-local" class="sel" value="' + esc(vm.dtFrom) + '"' + on(vm.onFrom, 'change') + '></span></div><div class="f"><span class="fl">To</span><span class="fv"><input type="datetime-local" class="sel" value="' + esc(vm.dtTo) + '"' + on(vm.onTo, 'change') + '></span></div>' : '';
    const dist = vm.distF.show || true ? '<div class="f"><span class="fl">District</span><span class="fv">' + (vm.isDM ? esc(vm.dm) : U.select([{ v: '', l: 'All districts' }].concat(vm.distF.opts.map(function (d) { return { v: d.name, l: d.name }; })), (E.L.state.path || [])[0] || '', function (e) { const v = e.target.value; if (v) openDistrict(v); else { E.set({ path: [] }); if (S.section === 'districts') { S.stage = 'all'; S.sub = ''; } applyNav(); } })) + '</span></div>' : '';
    const stageF = S.section === 'incidents' ? '<div class="f"><span class="fl">Stage</span><span class="fv">' + U.select([{ v: 'all', l: 'All stages' }].concat(P.STAGE_KEYS.map(function (k) { return { v: k, l: SM[k].num + ' ' + SM[k].label }; })), S.stage, function (e) { setStage(e.target.value); }) + '</span></div>' : '';
    return '<div class="filterbar"><div class="f" style="position:relative"><span class="fl">Marketing season</span><span class="fv"><button class="lnk"' + on(seas.toggle) + '>' + esc(seas.label) + ' ▾</button></span>' + seasPop + '</div>' + custom + dist + stageF +
      '<div class="f"><span class="fl">Period</span><span class="fv small">' + esc((vm.pctx.chips[0] || {}).t || '').replace(/^Season \/ period: /, '') + '</span></div>' +
      (seas.hasChips || vm.isCustom || (E.L.state.path || []).length ? U.btn('Clear filters', vm.clearFilters, 'xs ghost', 'close') : '') +
      '<div class="upd"><span class="live"></span>' + esc(vm.pctx.updated) + U.btn('Refresh', vm.refresh.go, 'xs ghost', 'refresh') + (vm.refresh.hasNote ? '<span>' + esc(vm.refresh.note) + '</span>' : '') + '</div></div>';
  };
  const crumbs = function (vm) {
    const sec = SECTIONS.filter(function (x) { return x.k === S.section; })[0];
    const items = [{ label: 'Command Control Centre', go: function () { go('overview'); } }];
    if (sec && sec.k !== 'overview') items.push({ label: sec.label, go: function () { go(sec.k); } });
    if (S.section === 'chain' && S.stage !== 'all') items.push({ label: SM[S.stage].num + ' ' + SM[S.stage].label, go: function () { go('chain', S.stage); } });
    (vm.crumbs || []).forEach(function (c, i) { if (i === 0 && (S.section === 'overview' || S.section === 'chain' || S.section === 'districts')) return; if (i === 0) return; items.push({ label: c.label, go: c.go, dis: c.dis }); });
    if (S.section === 'districts' && S.stage !== 'all') items.push({ label: SM[S.stage].num + ' ' + SM[S.stage].label, dis: true });
    return '<div class="crumbs">' + items.map(function (c, i) { return (i ? '<span class="sep">›</span>' : '') + '<button' + (c.dis || i === items.length - 1 ? ' disabled' : '') + on(c.go) + '>' + esc(c.label) + '</button>'; }).join('') + '</div>';
  };
  const subTabs = function () {
    if (!SUBS[S.section] || S.section === 'prep') return '';
    const list = SUBS[S.section].filter(function (t) { return !(S.section === 'intel' && t[0] === 'inbox' && E.L.state.role !== 'dm'); });
    return U.seg(list.map(function (t) { return { label: t[1], on: S.sub === t[0], pick: function () { go(S.section, 'all', t[0]); } }; }));
  };

  const page = function (vm) {
    const s = E.L.state; const p = (s.path || []); const depth = s.role === 'dm' ? Math.max(0, p.length - 1) : p.length;
    if (s.pivot) return P.pivot(vm);
    switch (S.section) {
      case 'overview': return P.overview(vm);
      case 'chain': return S.stage === 'all' ? P.chainAll(vm) : P.stage(vm, S.stage, S.sub);
      case 'districts': return depth >= 1 || (s.role === 'dm' && p.length) ? P.district(vm, S.stage) : P.districts(vm);
      case 'stock': return P.stock(vm);
      case 'guide': return P.guide(vm);
      case 'finance': return P.finance(vm);
      case 'prep': return P.prep(vm);
      case 'incidents': return S.sub ? P.feedPage(vm, S.sub) : P.incidents(vm);
      case 'voice': return S.sub === 'press' ? P.press(vm) : S.sub === 'youtube' ? P.youtube(vm) : P.voice(vm);
      case 'intel': return S.sub === 'inbox' ? P.inbox(vm) : P.intel(vm, S.sub);
    }
    return P.overview(vm);
  };

  /* ---------- drawers ---------- */
  const drawerShell = function (title, sub, body, right, close, cls) {
    return '<div class="scrim"' + on(close) + '></div><aside class="drawer ' + (cls || '') + '"><div class="dh"><div><h2>' + title + '</h2>' + (sub ? '<div class="ds">' + sub + '</div>' : '') + '</div><div class="dr">' + (right || '') + U.btn('Close', close, 'sm ghost', 'close') + '</div></div><div class="db">' + body + '</div></aside>';
  };
  const kinfoDrawer = function (vm) {
    const k = vm.kinfo; if (!k.has) return '';
    const body = '<div><div class="kv">' + esc(k.value) + '</div><div class="muted">' + esc(k.sub) + '</div><div class="note">' + esc(k.ctx) + '</div></div>' +
      '<div class="formula"><b>Formula</b><span>' + esc(k.calc) + '</span>' + (k.hasWorked ? '<b>With current data</b><span>' + esc(k.worked) + '</span>' : '') + '<b>What it tells you</b><span>' + esc(k.def) + '</span><b>Drill path</b><span>' + esc(k.drill) + '</span></div>' +
      (k.hasAi ? '<div class="aibox"><b>AI summary</b>' + esc(k.ai) + '<div class="note">Written from the incident records behind this KPI</div></div>' : '') +
      U.seg(k.tabs) +
      (k.isData && k.data.has ? '<div>' + (k.hasQ || true ? '<div class="tools"><label class="search">' + icon('search') + '<input type="search" placeholder="Search districts, mandals and sites in this KPI…" value="' + esc(k.q) + '"' + on(k.onQ, 'input') + ' data-fkey="kinfoq"></label>' + (k.canDownload ? U.btn('Download CSV', k.download, 'xs ghost', 'download') : '') + '</div>' : '') + '<p class="note" style="margin:0 0 6px">' + esc(k.data.note) + '</p>' + U.dataTable(k.data, { bare: true, compact: true, noCsv: true }) + '</div>' : '') +
      (k.isAbout ? U.facts(k.facts) + (k.bars && k.bars.length ? '<div><div class="small" style="font-weight:700;margin-bottom:6px">' + esc(k.barsTitle) + '</div>' + U.bars(k.bars) + '</div>' : '') : '') +
      (k.hasRec ? '<div>' + U.btn(k.recLabel, k.toggleRec, 'sm') + (k.recOpen ? '<div style="margin-top:8px"><p class="note">' + esc(k.rec.note) + '</p>' + U.dataTable(k.rec, { bare: true, compact: true, max: 100 }) + '</div>' : '') + '</div>' : '');
    return drawerShell('<span class="tag">' + esc(k.group) + '</span> ' + esc(k.title), '', body, U.btn('Act', k.act, 'sm primary', 'bolt') + (k.hasGo ? U.btn(k.goLabel, k.go, 'sm') : ''), k.close);
  };
  const rxDrawer = function (vm) {
    if (!vm.hasRx) return ''; const r = vm.rx;
    const lk = function (l) { return l.isHref ? '<a class="btn sm" href="' + esc(l.href || '#') + '" target="_blank" rel="noopener">' + esc(l.label) + '</a>' : U.btn(l.label, l.go || l.pick || l.open, 'sm'); };
    const body =
      (r.incId ? IncidentUI.brief(r) : '') +
      (r.hasAi ? '<div class="aibox"><b>' + esc(r.aiLabel || 'AI summary') + '</b>' + esc(r.ai) + (r.aiSrc ? '<div class="note">' + esc(r.aiSrc) + '</div>' : '') + '</div>' : '') +
      (r.hasFacts ? U.facts(r.facts.map(f => ({...f, v: String(f.v).replace(/^1 hours$/, '1 hour')}))) : '') +
      (r.hasImg ? '<img src="' + esc(r.img) + '" alt="" style="max-width:100%;border-radius:8px">' + (r.imgDur ? '<div class="note">' + esc(r.imgDur) + '</div>' : '') : '') +
      (r.hasPg ? '<div><img src="' + r.pgImg + '" alt="" style="max-width:100%;border:1px solid var(--line);border-radius:8px"><div class="note">' + esc(r.pgTag) + '</div></div>' : '') +
      (r.hasSrc ? '<div class="card flat"><div class="small" style="font-weight:700">' + esc(r.srcLabel) + '</div><p class="small">' + esc(r.src) + '</p></div>' : '') +
      (r.hasCmt ? '<div class="card flat"><div class="small" style="font-weight:700">' + esc(r.cmtTitle) + '</div><p class="small">' + esc(r.cmtBody) + '</p>' + U.bars(r.cmtBars) + (r.cmtThemes.length ? U.chips(r.cmtThemes.map(function (t) { return { label: t.label || t }; })) : '') + (r.cmtSamples || []).map(function (c) { return '<p class="small muted">“' + esc(c.text || c) + '”</p>'; }).join('') + '</div>' : '') +
      (r.hasIncs ? '<div><div class="small" style="font-weight:700;margin-bottom:4px">Incidents raised on this record</div>' + r.incs.map(function (i) { return '<div class="aitem"' + on(i.go || i.open) + '><span class="ai ' + (i.cls && /p1/.test(i.cls) ? 'bad' : 'warn') + '"></span><div><div class="at">' + esc(i.id) + ' · ' + esc(i.title || i.tip || '') + '</div></div></div>'; }).join('') + '</div>' : '') +
      (r.hasWhy ? '<div><button class="lnk"' + on(r.toggleWhy) + '>' + esc(r.whyLabel) + '</button>' + (r.whyOpen ? '<ul class="why">' + r.whyList.map(function (w) { return '<li>' + esc(w.t || w) + '</li>'; }).join('') + '</ul>' : '') + '</div>' : '') +
      (r.hasLayers ? IncidentUI.layers(r) : '') +
      (r.hasSteps ? '<div><div class="small" style="font-weight:700;margin-bottom:4px">Record trail</div><ul class="steps">' + r.steps.map(function (st) { return '<li class="' + (/pending|todo/.test(st.cls || '') ? 'pending' : '') + '"><b>' + esc(st.label) + '</b> <span class="m">' + esc(st.meta) + '</span></li>'; }).join('') + '</ul></div>' : '') +
      (r.hasList ? '<div class="alist">' + r.list.map(function (x) { return '<div class="aitem"' + on(x.go || x.open || x.pick) + '><div><div class="at">' + esc(x.label || x.title || x.name || '') + '</div><div class="am">' + esc(x.meta || x.sub || '') + '</div></div></div>'; }).join('') + '</div>' : '') +
      (r.hasTbl ? U.dataTable(r.tbl, { bare: true, compact: true, max: 100 }) + (r.tbl.count ? '<p class="note">' + esc(r.tbl.count) + '</p>' : '') : '') +
      (r.hasActs ? '<div class="card flat"><div class="small" style="font-weight:700">Recent actions and decisions · ' + esc(r.actsN) + '</div>' + r.acts.map(function (a) { return '<div class="small">' + esc(a.text || a.label || JSON.stringify(a)) + '</div>'; }).join('') + '</div>' : '') +
      (r.hasRej ? '<div class="form card flat"><b>' + esc(r.rejTitle) + '</b><p class="note">' + esc(r.rejNote) + '</p>' + (r.rejIsAdv ? '<label>Send to<input value="' + esc(r.rejTo) + '"' + on(r.onRejTo, 'input') + ' data-fkey="rejto"></label>' : '') + '<label>Text<textarea' + on(r.onRejText, 'input') + ' data-fkey="rejtext">' + esc(r.rejText) + '</textarea></label><label>Issued by<input value="' + esc(r.rejBy) + '"' + on(r.onRejBy, 'input') + ' data-fkey="rejby"></label><div class="tools">' + U.btn(r.rejBtn || 'Send', r.sendRej, 'sm primary') + U.btn('Cancel', r.cancelRej, 'sm ghost') + '</div></div>' : '') +
      (r.hasReopen ? '<div class="form card flat"><b>Reopen this incident</b><label>Reason<input value="' + esc(r.reopenWhy) + '"' + on(r.onReopenWhy, 'input') + ' data-fkey="reopen"></label><div class="tools">' + U.btn('Confirm', r.confirmReopen, 'sm danger') + U.btn('Cancel', r.cancelReopen, 'sm ghost') + '</div></div>' : '') +
      (r.hasLinks ? '<div class="tools">' + (r.lks || r.links).map(lk).join('') + '</div>' : '');
    return drawerShell(esc(r.title), esc(r.sub), body, (r.hasBack ? U.btn(r.backLabel || 'Back', r.goBack, 'sm ghost', 'back') : '') + U.btn(r.incId ? 'Review action' : (r.actLabel || 'Act'), r.act, 'sm primary', 'bolt') + U.btn(r.incId ? 'Ask about this incident' : 'Ask about this record', r.askMore, 'sm'), vm.closeRx);
  };
  const actDrawer = function (vm) {
    const a = vm.act; if (!a.has) return '';
    let body = '<div class="note">' + esc(a.where) + '</div>' + (a.hasCtx ? U.facts(a.ctxFacts, 'inline') : '');
    if (a.isDone) body += '<div class="done"><b>' + esc(a.doneTitle) + '</b><p>' + esc(a.doneText) + '</p><div class="tools" style="margin-top:8px">' + U.btn('Undo', a.undo, 'sm ghost') + U.btn('Open decision log', a.toLog, 'sm') + '</div></div>';
    else if (a.hasEsc) body += '<div class="form card flat"><b>Escalate to ' + esc(a.escTo) + '</b><div class="small muted">Action to put forward</div>' + a.escSugs.map(function (s) { return '<label class="small"><input type="radio" name="escsug"' + (/on/.test(s.cls) ? ' checked' : '') + on(s.pick, 'change') + '> ' + esc(s.label) + '</label>'; }).join('') + '<label>Remarks<textarea' + on(a.escOn.remarks, 'input') + ' data-fkey="escrem">' + esc(a.esc.remarks) + '</textarea></label><div class="grid"><label class="c4">Priority<select' + on(a.escOn.prio, 'change') + '>' + ['Normal', 'High', 'Urgent'].map(function (p) { return '<option' + (a.esc.prio === p ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select></label><label class="c4">Respond by<input type="date" value="' + esc(a.esc.due) + '"' + on(a.escOn.due, 'change') + '></label><label class="c4">Copy to<input value="' + esc(a.esc.cc) + '"' + on(a.escOn.cc, 'input') + ' data-fkey="esccc"></label></div><div class="tools">' + U.btn('Send', a.escSend, 'sm primary') + U.btn('Cancel', a.escCancel, 'sm ghost') + '</div></div>';
    else body += '<div class="stack" style="gap:8px">' + a.sugs.map(function (s) { return '<div class="sug' + (/main/.test(s.cls) ? ' main' : '') + '"><div class="rank">' + esc(s.rank) + '</div><div class="act">' + esc(s.act) + '</div><div class="meta"><span>Owner: ' + esc(s.owner) + '</span><span>By: ' + esc(s.by) + '</span><span>Expected: ' + esc(s.effect) + '</span></div><button class="lnk"' + on(s.toggleWhy) + '>' + esc(s.whyLabel) + '</button>' + (s.whyOpen ? '<ul class="why">' + s.why.map(function (w) { return '<li>' + esc(w.t) + '</li>'; }).join('') + '</ul>' : '') + (s.canDecide ? '<div class="tools" style="margin-top:8px">' + U.btn('Decide', s.decide, 'sm primary') + '</div>' : '') + '</div>'; }).join('') + '</div>' +
      '<div class="tools">' + (a.canEscDM ? U.btn('Escalate to ' + a.dmLabel, a.escDM, 'sm') : '') + U.btn('Escalate to Head office', a.escHO, 'sm') + U.btn('Remind me later', a.later, 'sm ghost') + '</div>';
    return drawerShell('Act · ' + esc(a.title), '', body, '', a.close, 'narrow');
  };
  const chatDrawer = function (vm) {
    if (!vm.chatOpen) return '';
    const body = '<div class="chat">' + vm.chatMsgs.map(function (m) { return '<div class="msg' + (m.cls === 'me' ? ' me' : '') + '">' + esc(m.text) + (m.hasBars ? '<div class="mb">' + U.bars(m.bars) + '</div>' : '') + (m.hasAct ? '<div class="mb">' + U.btn(m.actLabel, m.act, 'xs') + '</div>' : '') + '</div>'; }).join('') + '</div>' +
      '<div>' + U.link(vm.sugLabel, vm.toggleSugs) + (vm.sugHidden ? '' : U.chips(vm.chatSugs.map(function (s) { return { label: s.text, pick: s.ask }; }))) + '</div>' +
      '<form class="askbar"' + on(function (e) { e.preventDefault(); vm.onChatSubmit(e); }, 'submit') + '><input placeholder="Ask in English or తెలుగు…" value="' + esc(vm.chatInput) + '"' + on(vm.onChatInput, 'input') + ' data-fkey="chatq">' + U.btn('Send', function (e) { vm.onChatSubmit(e); }, 'primary') + '</form>' +
      '<div class="tools">' + U.btn('Open Intelligence', vm.goAsk, 'xs ghost', 'brain') + '</div>';
    return drawerShell('Ask Assistant', esc(vm.roleTitle), body, '', vm.closeChat, 'narrow');
  };
  const modal = function (vm) {
    if (!vm.hasModal) return ''; const m = vm.modal;
    const body = (m.body ? '<p class="small">' + esc(m.body) + '</p>' : '') + (m.text ? '<textarea class="sel" style="width:100%;min-height:120px" readonly>' + esc(m.text) + '</textarea>' : '') + (m.isShare ? '<div class="form"><label>Load a view code<input value="' + esc(vm.shareIn) + '"' + on(vm.onShareIn, 'input') + ' data-fkey="sharein"></label><div class="tools">' + U.btn('Copy', vm.copyModal, 'sm') + U.btn('Load code', vm.applyShare, 'sm primary') + '</div></div>' : '') + (m.msg ? '<p class="note">' + esc(m.msg) + '</p>' : '');
    return drawerShell(esc(m.title), '', body, '', vm.closeModal, 'narrow');
  };

  /* ---------- render ---------- */
  const render = function () {
    if (!E.ready) return;
    E.resetFns(); sync();
    const vm = E.render();
    const pg = page(vm);
    const railHtml = S.rail && pg.rail ? pg.rail : '';
    const head = '<div class="ph"><div><h2>' + pg.title + '</h2>' + (pg.sub ? '<div class="pm">' + esc(pg.sub) + '</div>' : '') + '</div><div class="pr">' + subTabs() + (pg.rail ? U.btn(S.rail ? 'Hide insights' : 'Insights', function () { S.rail = !S.rail; }, 'sm ghost', 'bolt') : '') + '</div></div>';
    const sb = vm.sBanner.on ? '<div class="sbanner"><b>' + esc(vm.sBanner.title) + '</b><span>' + esc(vm.sBanner.desc) + '</span>' + U.btn('Show all seasons', vm.sBanner.clear, 'xs ghost') + '</div>' : '';
    const sEmpty = vm.sEmpty.on ? '<div class="card" style="margin-bottom:12px"><h3>' + esc(vm.sEmpty.title) + '</h3><p class="small">' + esc(vm.sEmpty.text) + '</p>' + (vm.sEmpty.hasAlt ? U.btn(vm.sEmpty.altLabel, vm.sEmpty.alt, 'sm') : '') + '</div>' : '';
    const main = filterbar(vm) + crumbs(vm) + head + sb + sEmpty + (railHtml ? '<div class="withrail"><div class="stack">' + pg.body + '</div><aside class="rail">' + railHtml + '</aside></div>' : '<div class="stack">' + pg.body + '</div>');
    const html = banner(vm) + '<div class="frame">' + nav(vm) + '<main class="main view-' + S.section + '">' + main + '</main></div>' + kinfoDrawer(vm) + rxDrawer(vm) + actDrawer(vm) + chatDrawer(vm) + modal(vm);
    const y = window.scrollY; const ae = document.activeElement; const fkey = ae && ae.dataset ? ae.dataset.fkey : null; let selPos = null; try { selPos = ae && ae.selectionStart; } catch (e) {}
    root.innerHTML = html;
    if (S.scrollTop) { window.scrollTo(0, 0); S.scrollTop = false; } else window.scrollTo(0, y);
    if (fkey) { const el = root.querySelector('[data-fkey="' + fkey.replace(/"/g, '') + '"]'); if (el) { el.focus(); if (selPos !== null && selPos !== undefined) { try { el.setSelectionRange(selPos, selPos); } catch (e) {} } } }
    writeHash();
  };

  /* ---------- events ---------- */
  root.addEventListener('click', function (e) {
    const el = e.target.closest('[data-on]'); if (!el) return;
    if (el.tagName === 'SELECT' || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'FORM') return;
    if (el.tagName === 'A') return;
    e.preventDefault(); E.call(el.dataset.on, e); E.invalidate();
  });
  root.addEventListener('change', function (e) { const el = e.target.closest('[data-change]'); if (!el) return; E.call(el.dataset.change, e); E.invalidate(); });
  root.addEventListener('input', function (e) { const el = e.target.closest('[data-input]'); if (!el) return; E.call(el.dataset.input, e); E.invalidate(); });
  root.addEventListener('submit', function (e) { const el = e.target.closest('[data-submit]'); if (!el) return; e.preventDefault(); E.call(el.dataset.submit, e); E.invalidate(); });
  document.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][data-on]')) { e.preventDefault(); E.call(e.target.dataset.on, e); E.invalidate(); return; } if (e.key === 'Escape') { const vm = E.vm; if (!vm) return; if (vm.act.has) vm.act.close(); else if (vm.hasRx) vm.closeRx(); else if (vm.kinfo.has) vm.kinfo.close(); else if (vm.chatOpen) vm.closeChat(); else if (vm.hasModal) vm.closeModal(); E.invalidate(); } });
  window.addEventListener('hashchange', function () { if (S.hashing) return; readHash(); E.invalidate(); });

  /* ---------- boot ---------- */
  E.onChange(render);
  E.boot();
  readHash(); E.invalidate();
  return { S: S, go: go, setStage: setStage, setSub: setSub, openDistrict: openDistrict, openLens: openLens, render: render };
})();
