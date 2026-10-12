/* UI components: pure functions from view-model fragments to HTML strings. */
window.UI = (function () {
  'use strict';
  const E = window.Engine;
  const GREENS = { '#DCEAF6': '#e3efe4', '#B3D0EA': '#bbd9bf', '#7FAED8': '#86bd8c', '#3F7DB8': '#4e9a57', '#1A4F86': '#1f5e23', '#dceaf6': '#e3efe4', '#b3d0ea': '#bbd9bf', '#7faed8': '#86bd8c', '#3f7db8': '#4e9a57', '#1a4f86': '#1f5e23' };
  const green = function (c) { return GREENS[c] || c; };
  // Remove instructional clauses ("click …") so labels stay factual.
  const crisp = function (s) { if (!s) return s; return String(s).replace(/\s*[·;]\s*click[^·.;]*[.]?/gi, '').replace(/(^|\.\s+)click[^.]*\.?/gi, '$1').replace(/\s*·\s*$/, '').trim(); };
  const esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  const on = function (fn, ev) { const id = E.bind(fn); return id === '' ? '' : ' data-' + (ev || 'on') + '="' + id + '"'; };
  const toneOf = function (cls) { cls = String(cls || ''); return /\bbad\b/.test(cls) ? 'bad' : /\bwarn\b/.test(cls) ? 'warn' : /\bgood\b/.test(cls) ? 'good' : ''; };
  const statusWord = { good: 'On track', warn: 'Watch', bad: 'Act now', '': '—' };
  const STAGE_META = {
    proc: { num: '01', label: 'Procurement', short: 'Procurement', color: 'var(--st-proc)', icon: 'sprout' },
    cmr: { num: '02', label: 'Processing (CMR)', short: 'CMR · milling', color: 'var(--st-cmr)', icon: 'mill' },
    s1: { num: '03', label: 'Transportation (Stage-I)', short: 'Stage-I · godown → MLS', color: 'var(--st-s1)', icon: 'truck' },
    s2: { num: '04', label: 'Distribution (Stage-II)', short: 'Stage-II · MLS → FPS', color: 'var(--st-s2)', icon: 'shop' },
    stor: { num: '05', label: 'Storage', short: 'Storage · godowns', color: 'var(--st-stor)', icon: 'warehouse' }
  };
  const ICONS = {
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    chain: '<circle cx="5" cy="12" r="2.2"/><circle cx="12" cy="12" r="2.2"/><circle cx="19" cy="12" r="2.2"/><path d="M7.2 12h2.6M14.2 12h2.6"/>',
    map: '<path d="M3 6.5 9 4l6 2.5 6-2.5v13l-6 2.5-6-2.5-6 2.5z"/><path d="M9 4v15M15 6.5v13"/>',
    rupee: '<path d="M7 5h10M7 9h10M7 5c5 0 7 1.5 7 4s-2 4-7 4h0l7 7"/>',
    check: '<path d="M4 12.5 9.5 18 20 6.5"/>',
    alert: '<path d="M12 3 2.5 20h19z"/><path d="M12 10v4M12 17.5v.5"/>',
    voice: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
    brain: '<path d="M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0-2 3 3 3 0 0 0 2 3v1a3 3 0 0 0 3 3h3V4zM15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 2 3 3 3 0 0 1-2 3v1a3 3 0 0 1-3 3h-3V4z"/>',
    sprout: '<path d="M12 21V11"/><path d="M12 11c0-4 3-6 7-6 0 4-3 6-7 6z"/><path d="M12 14c0-3-2.5-5-6-5 0 3 2.5 5 6 5z"/>',
    mill: '<path d="M4 20h16"/><path d="M6 20V9l6-4 6 4v11"/><path d="M10 20v-5h4v5"/>',
    truck: '<path d="M2 7h12v9H2z"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="6" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>',
    shop: '<path d="M3 9 5 4h14l2 5"/><path d="M3 9h18v3a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 14v6h14v-6"/>',
    warehouse: '<path d="M3 20V9l9-5 9 5v11"/><path d="M7 20v-7h10v7"/><path d="M7 16h10"/>',
    farmer: '<circle cx="12" cy="7" r="3"/><path d="M5 21v-3a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v3"/>',
    family: '<circle cx="8" cy="7" r="2.5"/><circle cx="16" cy="7" r="2.5"/><path d="M3 20v-3a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v3M13 20v-3a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v3"/>',
    camera: '<path d="M3 8h13v9H3z"/><path d="M16 11l5-2v7l-5-2"/>',
    gps: '<circle cx="12" cy="11" r="3"/><path d="M12 21s-7-6-7-10a7 7 0 0 1 14 0c0 4-7 10-7 10z"/>',
    image: '<path d="M3 5h18v14H3z"/><path d="m5 17 5-6 4 4 2-2 3 4"/><circle cx="16" cy="9" r="1.5"/>',
    news: '<path d="M4 5h13v14H4z"/><path d="M17 8h3v9a2 2 0 0 1-2 2"/><path d="M7 9h7M7 12h7M7 15h4"/>',
    play: '<path d="M4 5h16v14H4z"/><path d="m10 9 5 3-5 3z"/>',
    inbox: '<path d="M3 13h5l2 3h4l2-3h5"/><path d="M5 5h14l2 8v6H3v-6z"/>',
    ask: '<path d="M4 5h16v11H9l-5 4z"/><path d="M10 9.5a2 2 0 1 1 3 1.7c-.6.4-1 .8-1 1.6M12 14.5v.3"/>',
    back: '<path d="m14 6-6 6 6 6"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    search: '<circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/>',
    download: '<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M4 20h16"/>',
    chev: '<path d="m9 6 6 6-6 6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7.5v.5"/>',
    bolt: '<path d="M13 3 4 14h6l-1 7 9-11h-6z"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/>',
    share: '<circle cx="6" cy="12" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="m8 11 8-4M8 13l8 4"/>',
    grid: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.5M4 12h.5M4 18h.5"/>',
    sheaf: '<path d="M12 22V9"/><path d="M12 9c0-4 2-7 5-8 0 4-2 7-5 8z"/><path d="M12 9c0-4-2-7-5-8 0 4 2 7 5 8z"/><path d="M12 14c0-3 2-5 5-6 0 3-2 5-5 6z"/><path d="M12 14c0-3-2-5-5-6 0 3 2 5 5 6z"/>'
  };
  const icon = function (name, cls) { return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || ICONS.info) + '</svg>'; };

  /* ---- small atoms ---- */
  const dot = function (t) { return '<span class="dot ' + (t || '') + '"></span>'; };
  const status = function (t) { t = toneOf(t); return '<span class="status ' + t + '">' + dot(t) + statusWord[t] + '</span>'; };
  const pill = function (text, cls) { return '<span class="pill ' + (cls || '') + '">' + esc(text) + '</span>'; };
  const btn = function (label, fn, cls, ico) { return '<button class="btn ' + (cls || '') + '"' + on(fn) + '>' + (ico ? icon(ico) : '') + esc(label) + '</button>'; };
  const link = function (label, fn, cls) { return '<button class="lnk ' + (cls || '') + '"' + on(fn) + '>' + esc(label) + '</button>'; };
  const chips = function (list, cls) { return '<div class="chips ' + (cls || '') + '">' + (list || []).map(function (c) { const onCls = /\bon\b/.test(c.cls || '') ? ' on' : ''; return '<button class="chip' + onCls + '"' + on(c.pick) + '>' + esc(c.label) + (c.rm ? '<span class="x"' + on(c.rm) + '>×</span>' : '') + '</button>'; }).join('') + '</div>'; };
  const seg = function (list, cls) { return '<div class="seg ' + (cls || '') + '">' + (list || []).map(function (c) { const onCls = c.on || /\bon\b/.test(c.cls || '') ? ' on' : ''; return '<button class="segb' + onCls + '"' + on(c.pick) + '>' + esc(c.label) + '</button>'; }).join('') + '</div>'; };
  const select = function (opts, val, fn, cls, valKey, labKey) {
    valKey = valKey || 'v'; labKey = labKey || 'l';
    return '<select class="sel ' + (cls || '') + '"' + on(fn, 'change') + '>' + (opts || []).map(function (o) { const v = typeof o === 'string' ? o : (o[valKey] !== undefined ? o[valKey] : o.name); const l = typeof o === 'string' ? o : (o[labKey] !== undefined ? o[labKey] : o.name); return '<option value="' + esc(v) + '"' + (String(v) === String(val) ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select>';
  };
  const empty = function (text) { return '<div class="empty">' + esc(text) + '</div>'; };
  const sectionHead = function (title, sub, right) { sub = crisp(sub); return '<div class="sh"><div><h3>' + esc(title) + '</h3>' + (sub ? '<p class="sub">' + esc(sub) + '</p>' : '') + '</div>' + (right ? '<div class="shr">' + right + '</div>' : '') + '</div>'; };
  const card = function (inner, cls, attrs) { return '<section class="card ' + (cls || '') + '"' + (attrs || '') + '>' + inner + '</section>'; };

  /* ---- KPI tile (fixed anatomy) ---- */
  const tile = function (k, opts) {
    opts = opts || {};
    const t = toneOf(k.vcls);
    const pctM = String(k.value).match(/^(-?\d+(?:\.\d+)?)%$/);
    const w = pctM ? Math.max(2, Math.min(100, Math.round(parseFloat(pctM[1])))) : null;
    return '<button class="tile ' + (opts.cls || '') + (k.open ? ' open' : '') + '"' + on(k.info) + ' title="' + esc((k.rep ? 'Reported figure · ' : '') + (k._info && k._info.def || '')) + '">' +
      '<div class="tl">' + (opts.icon ? icon(opts.icon, 'tic') : '') + '<span class="tlab">' + esc(({ 'Procurement target achieved': 'Paddy procurement · target achieved', 'CMR delivered': 'Rice processing (CMR) · delivered', 'Godown utilisation': 'Stocks available · capacity utilised', 'Stage-I moved': 'Transportation · Stage-I plan achieved', 'Stage-II to FPS': 'Distribution (FPS) · allotment delivered' })[k.label] || k.label) + '</span></div>' +
      '<div class="tv ' + t + '">' + esc(k.value) + '</div>' +
      '<div class="ts">' + esc(k.sub) + '</div>' +
      '<div class="tf">' + (w !== null ? '<span class="bar"><i class="' + t + '" style="width:' + w + '%"></i></span>' : '<span class="bar none"></span>') + status(t) + '</div>' +
      '</button>';
  };
  const tiles = function (list, opts) { opts = opts || {}; return '<div class="tiles ' + (opts.cls || '') + '">' + (list || []).map(function (k, i) { return tile(k, { icon: opts.icons ? opts.icons[i] : null }); }).join('') + '</div>'; };

  /* ---- KPI table (framework scorecard list) ---- */
  // Indicator cards retain every source value and callback without forcing a wide table on small screens.
  const indicatorText = value => { const text = String(value == null ? '' : value)
    .replace(/\bAvg\b/g, 'Average').replace(/\bSLA\b/g, 'the prescribed service time')
    .replace(/\bGLT\b/g, 'Gunny, labour and transport').replace(/\bPPCs\b/g, 'procurement centres').replace(/\bPPC\b/g, 'procurement centre')
    .replace(/\bRSKs\b/g, 'procurement centres').replace(/\bRSK\b/g, 'procurement centre')
    .replace(/\be-BG\b/g, 'electronic bank guarantee').replace(/\bCMR\b/g, 'custom milled rice')
    .replace(/\bLMT\b/g, 'lakh metric tonnes').replace(/\bMT\b/g, 'metric tonnes').replace(/\bCr\b/g, 'crore')
    .replace(/\bpts\b/g, 'percentage points').replace(/(\d+) h\b/g, '$1 hours').replace(/\bQR\b/g, 'quick response code')
    .replace(/\bKPIs\b/g, 'performance indicators').replace(/\bKPI list\b/g, 'performance indicators');
    return text.charAt(0).toUpperCase()+text.slice(1);
  };
  const kpiTable = function (sec, opts) {
    opts = opts || {};
    const items = sec.items || [];
    const title = indicatorText(opts.title || sec.title);
    const body = '<div class="indicator-grid">' + items.map(function (it) {
      const t = toneOf(it.vcls), word = {good:'On track',warn:'Needs monitoring',bad:'Requires attention','':'Status not assigned'}[t];
      const exists = value => value != null && String(value).trim() !== '' && String(value).trim() !== '—';
      const target = exists(it.target), variance = exists(it.variance);
      const provenance = it.tag === 'Illustrative' ? 'Illustrative data' : it.tag === 'Reported' ? 'Reported data' : it.tag === 'Proposed' ? 'Proposed indicator' : (it.tag || 'Source classification not supplied');
      return '<article class="indicator-card '+t+'"><div class="indicator-top"><span class="indicator-reference">'+esc(String(it.n || '').replace(/^KPI\b/, 'Key performance indicator'))+'</span><span class="indicator-status '+t+'">'+dot(t)+esc(word)+'</span></div><h4>'+esc(indicatorText(it.name))+'</h4><div class="indicator-reading"><span>'+(/District target achievement/i.test(it.name)?'Achievement range across districts':'Current result')+'</span><strong>'+esc(indicatorText(it.value))+'</strong></div>'+(it.detail ? '<p class="indicator-context">'+esc(indicatorText(it.detail))+'</p>' : '')+(target || variance ? '<dl class="indicator-comparison">'+(target?'<div><dt>Target</dt><dd>'+esc(indicatorText(it.target))+'</dd></div>':'')+(variance?'<div><dt>Difference from target</dt><dd class="'+toneOf(it.varCls)+'">'+esc(indicatorText(it.variance))+'</dd></div>':'')+'</dl>':'')+'<div class="indicator-provenance"><span>'+esc(provenance)+'</span><span>'+esc(it.fresh || 'Update time not supplied')+'</span></div>'+ (typeof it.info === 'function' ? btn('View definition and supporting records',it.info,'xs ghost') : '<span class="note">Supporting records are not available.</span>')+'</article>';
    }).join('')+'</div>';
    const inner = (opts.bare ? '' : sectionHead(title, indicatorText(sec.sub), opts.right || '')) + '<p class="indicator-section-note">'+items.length+' indicators. Targets and differences are displayed where the source supplies them. Open an indicator to review its definition and supporting records.</p>' + body;
    return opts.bare ? '<div class="kpitable intuitive-indicators">'+inner+'</div>' : card(inner,'kpitable intuitive-indicators '+(opts.cls || ''));
  };

  /* ---- generic data table from the baseline table view-model ---- */
  const dataTable = function (t, opts) {
    opts = opts || {};
    if (!t) return '';
    const cols = t.cols || [];
    const rows = (t.rows || []).slice(0, opts.max || 1000);
    const head = '<thead><tr>' + cols.map(function (c, i) { return '<th class="' + (i === 0 ? 'first' : /txt/.test(c.cls || '') ? 'txt' : 'r') + '"' + (c.pick ? on(c.pick) : '') + (c.tip ? ' title="' + esc(c.tip) + '"' : '') + '>' + esc(c.label) + '</th>'; }).join('') + '</tr></thead>';
    const body = rows.map(function (r) {
      const first = '<td class="first' + (r.canDrill ? ' drill' : '') + '"' + (r.canDrill ? on(r.drill) : '') + '>' + (r.lvl ? '<span class="ind" style="width:' + (r.lvl * 14) + 'px"></span>' : '') + (r.arrow ? '<span class="arrow">' + esc(r.arrow) + '</span>' : '') + esc(String(r.name).replace(/^[▸▾\s ]+/, '')) + (r.pill ? pill(r.pill, r.pillCls) : '') + (r.hasInc ? r.incs.map(function (x) { return '<button class="inclink ' + (x.cls || '') + '" title="' + esc(x.tip) + '"' + on(x.go) + '>' + esc(x.id) + '</button>'; }).join('') : '') + '</td>';
      const cells = (r.cells || []).map(function (c) { const txt = /\btxt\b/.test(c.cls || ''); return '<td class="' + (txt ? 'txt ' : 'r ') + toneOf(c.cls) + '"' + (c.tip ? ' title="' + esc(c.tip) + '"' : '') + (c.pick ? on(c.pick) : '') + '>' + esc(c.v) + (c.sub ? '<div class="csub">' + esc(c.sub) + '</div>' : '') + '</td>'; }).join('');
      const act = r.hasAct ? '<td class="r"><button class="btn xs"' + on(r.act) + '>Act</button></td>' : '';
      let html = '<tr>' + first + cells + act + '</tr>';
      if (r.hasSub && r.sub && r.sub.rows && r.sub.rows.length) { html += '<tr class="subrow"><td colspan="' + (cols.length + (r.hasAct ? 1 : 0)) + '">' + dataTable(r.sub, { nested: true }) + '</td></tr>'; }
      return html;
    }).join('');
    const foot = t.hasTotal && t.total && t.total.length ? '<tfoot><tr><td class="first">' + esc(t.totalLabel || 'Total') + '</td>' + t.total.map(function (c) { return '<td class="r ' + toneOf(c.cls) + '">' + esc(c.v) + '</td>'; }).join('') + '</tr></tfoot>' : '';
    const tools = (t.hasQ ? '<label class="search">' + icon('search') + '<input type="search" placeholder="' + esc(t.qPh) + '" value="' + esc(t.q) + '"' + on(t.onQ, 'input') + ' data-fkey="' + esc(opts.key || t.title) + '"></label>' : '') +
      (t.hasChips ? chips(t.chips) : '') + (t.hasSel ? select(t.selOpts, t.selVal, t.onSel) : '') +
      (t.download && !opts.nested && !opts.noCsv ? '<button class="btn xs ghost"' + on(t.download) + '>' + icon('download') + 'CSV</button>' : '');
    const note = (crisp(t.note) ? '<p class="note">' + esc(crisp(t.note)) + '</p>' : '') + (t.count ? '<p class="note">' + esc(t.count) + '</p>' : '');
    const table = '<div class="tw"><table class="dt' + (opts.nested ? ' nested' : '') + (opts.compact ? ' compact' : '') + '">' + head + '<tbody>' + body + '</tbody>' + foot + '</table></div>' + (t.noMatch ? empty(t.noMatchText) : '') + (t.empty ? empty(t.emptyMsg || 'No records') : '') + (t.rows && t.rows.length > rows.length ? '<p class="note">Showing ' + rows.length + ' of ' + t.rows.length + '</p>' : '');
    if (opts.bare) return (tools ? '<div class="tools">' + tools + '</div>' : '') + table + note;
    return card(sectionHead(opts.title || t.title, opts.sub !== undefined ? opts.sub : '', tools) + note + table, 'tablecard ' + (opts.cls || ''));
  };

  /* ---- bar list (ranked) ---- */
  const bars = function (list, opts) {
    opts = opts || {};
    return '<div class="bars ' + (opts.cls || '') + '">' + (list || []).map(function (b) { const t = b.c === '#D8714F' ? 'bad' : b.c === '#E0AE4F' ? 'warn' : b.c === '#5B8FD0' ? 'good' : ''; const cc = !t && b.c && /^(var\(|#)/.test(b.c) ? ';background:' + esc(b.c) : ''; return '<div class="brow"' + (b.go ? on(b.go) : '') + '><span class="bl">' + esc(b.label) + '</span><span class="bb"><i class="' + t + '" style="width:' + Math.max(2, Math.min(100, b.w || 0)) + '%' + cc + '"></i></span><span class="bv">' + esc(b.v) + '</span></div>'; }).join('') + '</div>';
  };

  /* ---- value-chain strip (the stage spine, physical order) ---- */
  const FLOW_STAGE = ['', 'proc', 'cmr', 'stor', 's1', 's2', ''];
  const FLOW_ICON = ['farmer', 'sprout', 'mill', 'warehouse', 'truck', 'shop', 'family'];
  const flowStrip = function (flow, opts) {
    opts = opts || {};
    return '<div class="flow ' + (opts.cls || '') + '">' + (flow || []).map(function (f, i) {
      const t = toneOf(f.barCls); const stg = FLOW_STAGE[i]; const m = STAGE_META[stg];
      return '<button class="fn ' + (f.cls && /\bon\b/.test(f.cls) ? 'on ' : '') + t + '" style="--sc:' + (m ? m.color : 'var(--ink-3)') + '"' + on(f.go) + ' title="' + esc(f.tip) + '">' +
        '<div class="fh">' + icon(FLOW_ICON[i], 'fic') + (m ? '<span class="snum">' + m.num + '</span>' : '') + '</div>' +
        '<div class="flab">' + esc(f.label) + '</div><div class="fval">' + esc(f.value) + '</div><div class="funit">' + esc(f.unit) + '</div>' +
        '<div class="fpct ' + t + '"><span class="bar"><i class="' + t + '" style="width:' + f.w + '%"></i></span><b>' + esc(f.pctTxt) + '</b> <span>' + esc(f.base) + '</span></div>' +
        (f.hasSt ? '<div class="fst ' + toneOf(f.stCls) + '">' + esc(f.st) + '</div>' : '') +
        '</button>' + (i < flow.length - 1 ? '<span class="farrow"></span>' : '');
    }).join('') + '</div>';
  };

  /* ---- stage stepper ---- */
  const stepper = function (cur, go, opts) {
    opts = opts || {};
    const items = [{ k: 'all', num: '', label: 'All stages' }].concat(['proc', 'cmr', 's1', 's2', 'stor'].map(function (k) { return Object.assign({ k: k }, STAGE_META[k]); }));
    return '<nav class="stepper" aria-label="Stages">' + items.map(function (s) { return '<button class="step' + (cur === s.k ? ' on' : '') + '" style="--sc:' + (s.color || 'var(--green-700)') + '"' + on(function () { go(s.k); }) + '>' + (s.num ? '<span class="snum">' + s.num + '</span>' : icon('chain', 'sic')) + '<span>' + esc(s.label) + '</span></button>'; }).join('') + '</nav>';
  };

  /* ---- choropleth map from baseline map tiles ---- */
  const mapSvg = function (map, opts) {
    opts = opts || {};
    const tiles = (map.tiles || []).map(function (t) { return '<path d="' + t.d + '" fill="' + green(t.bg) + '" class="dist' + (t.sel ? ' sel' : '') + '"' + on(t.pick) + '><title>' + esc(t.name + ' · ' + t.val) + '</title></path>'; }).join('');
    const labels = opts.labels === false ? '' : (map.tiles || []).map(function (t) { return '<text x="' + t.lx + '%" y="' + t.ly + '%" fill="' + t.fg + '" class="mlab">' + esc(t.val) + '</text>'; }).join('');
    return '<div class="mapwrap"><svg viewBox="0 0 800 820" class="apmap" preserveAspectRatio="xMidYMid meet">' + tiles + labels + '</svg>' +
      (map.hasScale ? '<div class="mscale"><span>' + esc(map.lo) + '</span><i></i><span>' + esc(map.hi) + '</span><em>' + esc(map.metricLabel) + '</em></div>' : '') + '</div>';
  };

  /* ---- line chart (season / preparedness forecast) from baseline path data ---- */
  const lineChart = function (c) {
    if (!c || !c.has) return '';
    return '<div class="lc"><div class="lcbox"><svg viewBox="0 0 1000 282" preserveAspectRatio="none" class="lcsvg">' +
      '<path d="' + c.dGrid + '" class="grid"/>' + (c.dBand ? '<path d="' + c.dBand + '" class="band"/>' : '') + (c.hasH ? '<path d="' + c.dH + '" class="hline"/>' : '') +
      (c.dPlan ? '<path d="' + c.dPlan + '" class="plan"/>' : '') + (c.dAlt ? '<path d="' + c.dAlt + '" class="alt"/>' : '') + '<path d="' + c.dAct + '" class="act"/>' + (c.dFc ? '<path d="' + c.dFc + '" class="fc"/>' : '') +
      (c.vl || []).map(function (v) { return '<path d="' + v.d + '" class="vl"/>'; }).join('') + '</svg>' +
      (c.yt || []).map(function (y) { return '<span class="yt" style="top:' + y.top + '%">' + esc(y.label) + '</span>'; }).join('') +
      (c.xt || []).map(function (x) { return '<span class="xt" style="left:' + x.left + '%">' + esc(x.label) + '</span>'; }).join('') +
      (c.vl || []).map(function (v) { return '<span class="vlab" style="left:' + v.left + '%">' + esc(v.label) + '</span>'; }).join('') +
      (c.hasH ? '<span class="hlab" style="top:' + c.hTop + '%">' + esc(c.hLabel) + '</span>' : '') +
      (c.marks || []).map(function (m) { return '<span class="mark" style="left:' + m.left + '%;top:' + m.top + '%">' + esc(m.label) + '</span>'; }).join('') +
      '</div><div class="legend">' + (c.legend || []).map(function (l) { return '<span class="' + esc(l.cls) + '">' + esc(l.label) + '</span>'; }).join('') + '</div>' + (c.note ? '<p class="note">' + esc(c.note) + '</p>' : '') + '</div>';
  };

  /* ---- monthly new vs resolved bars ---- */
  const trendBars = function (it) {
    if (!it || !it.bars || !it.bars.length) return '';
    const max = Math.max.apply(null, it.bars.map(function (b) { return Math.max(b.n, b.r); }).concat([1]));
    return '<div class="tb">' + it.bars.map(function (b) { return '<div class="tbm" title="' + esc(b.tip) + '"' + on(b.go) + '><div class="tbb"><i class="n" style="height:' + Math.round(b.n / max * 100) + '%"></i><i class="r" style="height:' + Math.round(b.r / max * 100) + '%"></i></div><span>' + esc(b.m) + '</span></div>'; }).join('') + '</div><div class="legend"><span class="lg-n">New</span><span class="lg-r">Resolved</span></div>';
  };

  const facts = function (list, cls) { return '<dl class="facts ' + (cls || '') + '">' + (list || []).map(function (f) { return '<div><dt>' + esc(f.k) + '</dt><dd>' + esc(f.v) + '</dd></div>'; }).join('') + '</dl>'; };

  return { esc: esc, crisp: crisp, green: green, on: on, icon: icon, dot: dot, status: status, pill: pill, btn: btn, link: link, chips: chips, seg: seg, select: select, empty: empty, sectionHead: sectionHead, card: card, tile: tile, tiles: tiles, kpiTable: kpiTable, dataTable: dataTable, bars: bars, flowStrip: flowStrip, stepper: stepper, mapSvg: mapSvg, lineChart: lineChart, trendBars: trendBars, facts: facts, toneOf: toneOf, STAGE_META: STAGE_META };
})();
