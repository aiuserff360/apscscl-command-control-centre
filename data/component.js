class Component extends DCLogic {
  state = { inboxRead: (function () { try { return JSON.parse(window.localStorage.getItem('ucc.inboxRead') || '{}') || {}; } catch (e) { return {}; } })(), inboxSys: (function () { try { return JSON.parse(window.localStorage.getItem('ucc.inboxSys') || '{}') || {}; } catch (e) { return {}; } })(), intelOpen: null, act: null, actLog: readActLog(), intelMsgs: [], intelInput: '', lay: readLay(), editMode: false, addOpen: false, role: 'comm', /* only the Commissioner view is offered */ dm: 'East Godavari', transposed: false, stage: 'all', module: 'overview', glance: 'rsk', path: [], season: readSeas().season, seasons: readSeas().seasons, seasOpen: false, showDist: false, period: 'season', dtFrom: '', dtTo: '', mapMetric: '', pivot: false, kpiOpen: null, kpiRec: false, mxSel: null, mxOpen: false, scExp: {}, prepView: 'overview', prepParam: -1, prepSort: 'asc', prepRpt: 'dist', prepMandal: null, mapHover: null, pvData: 'inc', pvRows: ['Category', 'Subcategory'], pvCols: [], pvF: [], pvFV: {}, pvVals: ['n', 'open', 'res'], pvExp: {}, pvPick: null, pvOpenF: null, pvSel: null, pvName: '', pvMsg: '', saved: [], chatOpen: false, chatMsgs: null, chatInput: '', modal: null, shareIn: '' };

  componentDidMount() {
    try { const lv = parseInt(window.localStorage.getItem('ucc.lastVisit') || '', 10); this.setState({ lastVisit: isNaN(lv) ? null : lv }); window.localStorage.setItem('ucc.lastVisit', String(Date.now())); } catch (e) {}
    try { const raw = window.localStorage.getItem('ucc-views'); if (raw) this.setState({ saved: JSON.parse(raw) }); } catch (e) {}
  }

  persist(saved) { try { window.localStorage.setItem('ucc-views', JSON.stringify(saved)); } catch (e) {} }

  windowH() {
    const s = this.state; const now = new Date(); const sinceMid = now.getHours() + now.getMinutes() / 60;
    if (s.season === 'custom') { const f = s.dtFrom ? (now - new Date(s.dtFrom)) / 3600000 : Infinity; const t = s.dtTo ? (now - new Date(s.dtTo)) / 3600000 : 0; return [Math.max(0, t), f]; }
    return [0, Infinity];
  }
  inWin(ageH) { const w = this.windowH(); return ageH >= w[0] && ageH <= w[1]; }
  basePath() { return this.state.role === 'dm' ? [this.state.dm] : []; }
  curPath() { const s = this.state; let p = s.path.slice(); if (s.role === 'dm' && p[0] !== s.dm) p = [s.dm]; return p; }
  go(stage, module, path) { const p = path || this.curPath().slice(0, 1); this.setState({ stage: stage, module: module, pivot: false, kpiOpen: null, path: p.length ? p : this.basePath() }); }
  pvFor(mode) { const ds = PV_FOR_MODE[mode] || 'proc'; if (ds === this.state.pvData) return {}; const pr = PV_PRESETS[ds][0]; return { pvData: ds, pvRows: pr.rows.slice(), pvCols: pr.cols.slice(), pvVals: pr.vals.slice(), pvF: Object.keys(pr.f), pvFV: Object.assign({}, pr.f), pvExp: {}, pvSel: null, pvName: '' }; }
  drill(id) { this.setState({ path: this.curPath().concat([id]), pivot: false, kpiOpen: null }); }


  /* ---------- record explorers (one section each, per tab) ---------- */
  rxFor(mode, path, stage) {
    const self = this; const s = this.state; const depth = path.length;
    const T = function (x, t) { return Object.assign(C(x, t || ''), { cls: 'txt' }); };
    const N = function (x, t) { return C(fmtN(x), t); };
    const MT1 = function (x, t) { return C(fmtN(x, 1), t); };
    const dns = depth ? [path[0]] : D.map(function (d) { return d.name; });
    const stageTab = mode === 's1' || mode === 's2' || mode === 'stor' || mode === 'fin';
    const mid = stageTab && depth >= 2 ? path[1] : null;
    const scope = mid ? (LBL[mid] || path[1]) : depth ? path[0] : 'Andhra Pradesh';
    const inS = function (r) { return !mid || r.mid === mid; };
    const inW = function (h) { return h === null || h === undefined || self.inWin(h); };
    const gather = function (fn) { let out = []; dns.forEach(function (dn) { out = out.concat(fn(dn)); }); return out.filter(inS); };
    const group = function (list, keyFn) { const o = {}; const order = []; list.forEach(function (r) { const k = keyFn(r); if (!(k in o)) { o[k] = []; order.push(k); } o[k].push(r); }); return order.map(function (k) { return { k: k, l: o[k] }; }); };
    const sum = function (l, f) { return l.reduce(function (a, r) { return a + ((typeof f === 'string' ? r[f] : f(r)) || 0); }, 0); };
    const cnt = function (l, f) { return l.filter(f).length; };
    const open = function (kind, r) { return function () { self.setState({ rxRec: self.rxBack(self.rxRecord(kind, r)) }); }; };
    const asOf = new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const X = [];
    if (depth > (stageTab ? 2 : 1)) return X;

    if (mode === 's1') {
      const intra = gather(s1Intra).filter(function (r) { return inW(r.dispH); });
      const allX = s1Inter().filter(function (r) { return inW(r.dispH); });
      const inter = allX.filter(function (r) { return (!depth || r.dn === path[0] || r.toDn === path[0]) && inS(r); });
      const outX = inter.filter(function (r) { return !depth || r.dn === path[0]; });
      const all = intra.concat(outX);
      const qtyCols = function (l) { return [N(l.length), MT1(sum(l, 'qty')), MT1(sum(l, 'recv')), MT1(sum(l, function (r) { return r.status === 'In transit' ? r.qty : 0; })), MT1(sum(l, 'short'), sum(l, 'short') > 0.003 * sum(l, 'qty') ? 'warn' : ''), N(cnt(l, function (r) { return r.onTime; }))]; };
      const QL = ['Consignments', 'Dispatched (MT)', 'Received (MT)', 'In transit (MT)', 'Short / damaged (MT)', 'Received within schedule'];
      X.push({ key: 's1rec', title: 'Stage-I movement records · ' + scope, sub: 'Dispatch and receipt records behind the Stage-I KPIs · buffer godown → MLS point, and inter-district by road and rail · as of ' + asOf,
        src: 'Fields per KPI framework §4 (KPIs 22–30): mode, route, consignment, destination, dispatch and receipt quantities and times, transporter. Intra-district road trips add up to the Stage-I quantity moved; inter-district consignments are listed under KPIs 26–30 and shown by originating district.',
        views: [
          { k: 'mode', label: 'By mode', build: function () { const g = [['Road · within district', intra], ['Road · inter-district', outX.filter(function (r) { return r.mode === 'Road'; })], ['Rail · inter-district', outX.filter(function (r) { return r.mode === 'Rail'; })]]; return { labels: ['Mode'].concat(QL), rows: g.map(function (x) { return { name: x[0], cells: qtyCols(x[1]) }; }), total: qtyCols(all), note: 'Counts and quantities only; the on-time and shortage rates stay in the KPI list above.' }; } },
          { k: 'route', label: 'By route', build: function () { const g = group(all, function (r) { return r.route + '|' + r.mode; }); return { labels: ['Route', 'Mode', 'Distance', 'Transporter'].concat(QL), rows: g.map(function (x) { const r0 = x.l[0]; return { name: r0.route, cells: [T(r0.mode), C(r0.km + ' km'), T(r0.transporter)].concat(qtyCols(x.l)) }; }), total: [C(''), C(''), C('')].concat(qtyCols(all)) }; } },
          { k: 'inter', label: 'Inter-district', build: function () { const g = group(inter, function (r) { return r.dn + '→' + r.toDn + '|' + r.mode; }); return { labels: ['From → to district', 'Mode', 'Direction'].concat(QL), rows: g.map(function (x) { const r0 = x.l[0]; return { name: r0.dn + ' → ' + r0.toDn, cells: [T(r0.mode), T(!depth ? '—' : r0.dn === path[0] ? 'Outbound' : 'Inbound')].concat(qtyCols(x.l)) }; }), total: [C(''), C('')].concat(qtyCols(inter)), empty: !inter.length, emptyMsg: 'No inter-district consignments for ' + scope + ' in this period.' }; } },
          { k: 'dest', label: 'By destination', build: function () { const g = group(all, function (r) { return r.to; }); return { labels: ['Destination', 'District', 'Origins'].concat(QL), rows: g.map(function (x) { return { name: x.k, cells: [T(x.l[0].toDn), N(group(x.l, function (r) { return r.from; }).length)].concat(qtyCols(x.l)) }; }), total: [C(''), C('')].concat(qtyCols(all)) }; } },
          { k: 'freight', label: 'Freight by route & transporter', build: function () { const g = group(all.filter(function (r) { return r.status !== 'In transit'; }), function (r) { return r.route + '|' + r.transporter; }); const del = all.filter(function (r) { return r.status !== 'In transit'; }); return { labels: ['Route', 'Transporter', 'Mode', 'Tariff basis', 'Rate (₹/MT)', 'Delivered (MT)', 'Freight (₹ lakh)', 'Per quintal (₹)'], rows: g.map(function (x) { const r0 = x.l[0]; const q = sum(x.l, 'recv'), f = sum(x.l, 'freight'); return { name: r0.route, cells: [T(r0.transporter), T(r0.mode), T(r0.band), N(r0.rate), MT1(q), C(fmtN(f / 1e5, 2)), C(fmtN(f / (q * 10 || 1), 1))] }; }), total: [C(''), C(''), C(''), C(''), MT1(sum(del, 'recv')), C(fmtN(sum(del, 'freight') / 1e5, 2)), C(fmtN(sum(del, 'freight') / (sum(del, 'recv') * 10 || 1), 1))], note: 'Road rates from the Stage-I tariff (five distance bands per district); rail is freight only, handling excluded. Freight is shown for delivered quantity.' }; } },
          { k: 'recs', label: 'Dispatch & receipt records', filter: 'status', build: function (fv) { const l = all.filter(function (r) { return !fv || r.status === fv; }); return { labels: ['Consignment', 'Mode', 'Route', 'Transporter', 'Vehicle / rake', 'Dispatched', 'Qty (MT)', 'Received', 'Received (MT)', 'Short (MT)', 'Status'], rows: l.map(function (r) { return { name: r.id, f: r.status, cells: [T(r.mode), T(r.route), T(r.transporter), T(r.vehicle), C(fmtDT(r.dispH)), MT1(r.qty), C(r.recvH === null ? '—' : fmtDT(r.recvH)), MT1(r.recv), MT1(r.short, r.short > 0.002 * r.qty ? 'warn' : ''), T(r.status, r.status === 'Received' ? 'good' : r.status === 'In transit' ? '' : 'warn')], drill: open('s1', r) }; }), filterSrc: all.map(function (r) { return r.status; }) }; } }
        ] });
    }

    if (mode === 's2') {
      const all = gather(s2Dels).filter(function (r) { return inW(r.dispH); });
      const cols = function (l) { return [N(l.length), MT1(sum(l, 'qty')), MT1(sum(l, 'delivered')), MT1(sum(l, 'ackQ')), N(cnt(l, function (r) { return r.status.indexOf('awaiting') >= 0; }), cnt(l, function (r) { return r.status.indexOf('awaiting') >= 0; }) ? 'warn' : ''), N(cnt(l, function (r) { return r.onTime && r.inFull && r.delivered; }))]; };
      const CL = ['Deliveries', 'Dispatched (MT)', 'Delivered (MT)', 'Acknowledged (MT)', 'Awaiting ePoS ack', 'On time & in full'];
      X.push({ key: 's2rec', title: 'Stage-II delivery records · ' + scope, sub: 'MLS point → fair price shop · dispatch, delivery and ePoS acknowledgement as separate records · as of ' + asOf,
        src: 'Fields per KPI framework §5 (KPIs 31–35): destination, transporter, delivery, receipt confirmation. Dispatched adds up to the quantity lifted from MLS points; delivered adds up to the quantity delivered to FPS.',
        views: [
          { k: 'dest', label: 'By destination mandal', build: function () { const g = group(all, function (r) { return r.mid; }); return { labels: ['Destination mandal', 'District', 'FPS served'].concat(CL), rows: g.map(function (x) { return { name: x.l[0].mandal, cells: [T(x.l[0].dn), N(group(x.l, function (r) { return r.fps; }).length)].concat(cols(x.l)) }; }), total: [C(''), N(all.length)].concat(cols(all)) }; } },
          { k: 'fps', label: 'By FPS', build: function () { return { labels: ['FPS', 'Mandal', 'MLS point', 'Transporter', 'Last dispatch', 'Dispatched (MT)', 'Delivered (MT)', 'Acknowledged (MT)', 'Status'], rows: all.map(function (r) { return { name: r.fps, cells: [T(r.mandal), T(r.mls), T(r.transporter), C(fmtDT(r.dispH)), MT1(r.qty), MT1(r.delivered), MT1(r.ackQ), T(r.status, r.status === 'Acknowledged' ? 'good' : r.status === 'In transit' ? '' : 'warn')], drill: open('s2', r) }; }) }; } },
          { k: 'trans', label: 'By transporter', build: function () { const g = group(all, function (r) { return r.transporter; }); return { labels: ['Transporter', 'MLS points served', 'FPS served'].concat(CL).concat(['Short at FPS (MT)']), rows: g.map(function (x) { return { name: x.k, cells: [N(group(x.l, function (r) { return r.mls; }).length), N(x.l.length)].concat(cols(x.l)).concat([MT1(sum(x.l, function (r) { return r.delivered - r.ackQ > 0 && r.ackH !== null ? r.delivered - r.ackQ : 0; }))]) }; }), total: [C(''), N(all.length)].concat(cols(all)).concat([MT1(sum(all, function (r) { return r.delivered - r.ackQ > 0 && r.ackH !== null ? r.delivered - r.ackQ : 0; }))]) }; } },
          { k: 'ack', label: 'Delivery → acknowledgement', filter: 'status', build: function (fv) { const l = all.filter(function (r) { return !fv || r.status === fv; }); return { labels: ['Delivery', 'FPS', 'MLS point', 'Vehicle', 'Challan', 'Dispatched', 'Delivered', 'ePoS acknowledged', 'Delivery → ack', 'Qty (MT)', 'Ack qty (MT)', 'Status'], rows: l.map(function (r) { return { name: r.id, f: r.status, cells: [T(r.fps), T(r.mls), T(r.vehicle), T(r.challan), C(fmtDT(r.dispH)), C(r.delH === null ? '—' : fmtDT(r.delH)), C(r.ackH === null ? '—' : fmtDT(r.ackH)), C(r.ackH === null ? (r.delH === null ? '—' : 'open ' + fmtH(r.delH)) : fmtH(r.delH - r.ackH), r.ackH === null && r.delH > 24 ? 'bad' : ''), MT1(r.qty), MT1(r.ackQ), T(r.status, r.status === 'Acknowledged' ? 'good' : r.status === 'In transit' ? '' : 'warn')], drill: open('s2', r) }; }), filterSrc: all.map(function (r) { return r.status; }) }; } }
        ] });
      X.push(this.rxVerif('s2', gather(verifReg).filter(function (r) { return r.et === 's2'; }), scope, depth, path));
    }

    if (mode === 'stor') {
      const gb = gather(godownBook); const lots = gather(lotsOf);
      const sc = function (l) { const b = sum(l, 'book'), p = sum(l, 'phys'); return [MT1(b), MT1(p), C((p - b >= 0 ? '+' : '') + fmtN(p - b, 1), Math.abs(p - b) > 0.0025 * b ? 'bad' : '')]; };
      X.push({ key: 'stbook', title: 'Stocktake & stock ledger · ' + scope, sub: 'Per buffer godown · physical versus book, monthly movement and usable capacity · as of ' + asOf,
        src: 'Fields per KPI framework §3 (KPIs 16–18) and the stack-ledger / book-balance / physical-verification evidence in the control register. Book stock adds up to the stock held; usable capacity adds up to the capacity used for utilisation.',
        views: [
          { k: 'take', label: 'Physical vs book', build: function () { return { labels: ['Godown', 'District', 'Mandal', 'Last stocktake', 'Book (MT)', 'Physical (MT)', 'Variance (MT)', 'Variance %', 'Within ±0.25%'], rows: gb.map(function (g) { const vv = (g.phys - g.book) / (g.book || 1); return { name: g.name, cells: [T(g.dn), T(g.mandal), C(fmtD(g.lastTake)), MT1(g.book), MT1(g.phys), C((vv >= 0 ? '+' : '') + fmtN(g.phys - g.book, 1)), C(fmtN(vv * 100, 2) + '%', Math.abs(vv) > 0.0025 ? 'bad' : ''), T(Math.abs(vv) > 0.0025 ? 'No' : 'Yes', Math.abs(vv) > 0.0025 ? 'bad' : 'good')], drill: open('godown', g) }; }), total: [C(''), C(''), C('')].concat(sc(gb)).concat([C(''), C('')]) }; } },
          { k: 'move', label: 'Opening → closing', build: function () { const tot = [MT1(sum(gb, 'open')), MT1(sum(gb, 'rec')), MT1(sum(gb, 'iss')), MT1(sum(gb, 'book')), MT1(sum(gb, 'phys')), C(fmtN(sum(gb, 'phys') - sum(gb, 'book'), 1))]; return { labels: ['Godown', 'District', 'Opening (MT)', 'Receipts (MT)', 'Issues (MT)', 'Closing book (MT)', 'Closing physical (MT)', 'Loss / gain (MT)'], rows: gb.map(function (g) { const lg = g.phys - g.book; return { name: g.name, cells: [T(g.dn), MT1(g.open), MT1(g.rec), MT1(g.iss), MT1(g.book), MT1(g.phys), C((lg >= 0 ? '+' : '') + fmtN(lg, 1), Math.abs(lg) > 0.0025 * g.book ? 'bad' : '')], drill: open('godown', g) }; }), total: [C('')].concat(tot), note: 'This month: opening + receipts − issues = closing book. Loss / gain = closing physical − closing book.' }; } },
          { k: 'cap', label: 'Usable capacity', build: function () { return { labels: ['Godown', 'District', 'Sanctioned (MT)', 'Not usable (MT)', 'Reason', 'Usable (MT)', 'Occupied (MT)', 'Free (MT)'], rows: gb.map(function (g) { return { name: g.name, cells: [T(g.dn), MT1(g.usable + g.blocked), MT1(g.blocked, g.blocked ? 'warn' : ''), T(g.blockWhy || '—'), MT1(g.usable), MT1(g.book), MT1(Math.max(0, g.usable - g.book), g.usable - g.book < 0.07 * g.usable ? 'warn' : '')], drill: open('godown', g) }; }), total: [C(''), MT1(sum(gb, function (g) { return g.usable + g.blocked; })), MT1(sum(gb, 'blocked')), C(''), MT1(sum(gb, 'usable')), MT1(sum(gb, 'book')), MT1(sum(gb, function (g) { return Math.max(0, g.usable - g.book); }))] }; } }
        ] });
      const ageBand = function (a) { return a <= 90 ? '0–90 days' : a <= LOT_TARGET_D ? '91–180 days' : a <= 365 ? '181–365 days (beyond target)' : 'Over a year (beyond target)'; };
      X.push({ key: 'stlots', title: 'Lot register · ' + scope, sub: 'Every lot with its location, age and movement history · click a lot for its trail · as of ' + asOf,
        src: 'Fields per KPI framework §3 (KPIs 19–20): lot, commodity, location, age and movement records. Lots beyond the 180-day target storage period add up to the aged stock figure.',
        views: [
          { k: 'lots', label: 'Lots', filter: 'band', build: function (fv) { const l = lots.filter(function (x) { return !fv || ageBand(x.age) === fv; }); return { labels: ['Lot', 'Godown', 'Location', 'Commodity', 'Crop year', 'From mill', 'Qty (MT)', 'Age', 'Last movement', 'Records'], rows: l.map(function (x) { return { name: x.id, f: ageBand(x.age), cells: [T(x.godown), T(x.loc), T(x.commodity), T(x.crop), T(x.mill), MT1(x.qty), C(x.age + ' d', x.aged ? 'bad' : x.age > 120 ? 'warn' : ''), T(x.lastType + ' · ' + x.lastMv + ' d ago'), T(x.complete ? 'Complete' : 'Location / movement missing', x.complete ? 'good' : 'bad')], drill: open('lot', x) }; }), filterSrc: lots.map(function (x) { return ageBand(x.age); }) }; } },
          { k: 'age', label: 'By age band', build: function () { const B = ['0–90 days', '91–180 days', '181–365 days (beyond target)', 'Over a year (beyond target)']; return { labels: ['Age band', 'Lots', 'Qty (MT)', 'Godowns holding'], rows: B.map(function (b) { const l = lots.filter(function (x) { return ageBand(x.age) === b; }); return { name: b, cells: [N(l.length), MT1(sum(l, 'qty'), b.indexOf('beyond') >= 0 && l.length ? 'bad' : ''), N(group(l, function (x) { return x.gid; }).length)] }; }), total: [N(lots.length), MT1(sum(lots, 'qty')), N(gb.length)] }; } },
          { k: 'loc', label: 'By godown', build: function () { const g = group(lots, function (x) { return x.gid; }); return { labels: ['Godown', 'District', 'Lots', 'Qty (MT)', 'Beyond target (MT)', 'Oldest lot', 'Lots missing records'], rows: g.map(function (x) { const l = x.l; return { name: l[0].godown, cells: [T(l[0].dn), N(l.length), MT1(sum(l, 'qty')), MT1(sum(l, function (y) { return y.aged ? y.qty : 0; })), C(Math.max.apply(null, l.map(function (y) { return y.age; })) + ' d'), N(cnt(l, function (y) { return !y.complete; }), cnt(l, function (y) { return !y.complete; }) ? 'bad' : '')] }; }), total: [C(''), N(lots.length), MT1(sum(lots, 'qty')), MT1(sum(lots, function (y) { return y.aged ? y.qty : 0; })), C(''), N(cnt(lots, function (y) { return !y.complete; }))] }; } }
        ] });
      X.push(this.rxVerif('stor', gather(verifReg).filter(function (r) { return r.et === 'stor'; }), scope, depth, path));
    }

    if (mode === 'fin' && (stage === 'all' || stage === 'proc')) {
      const fb = gather(finBatches).filter(function (b) { return inW(b.hAgo); }); const ib = gather(incBills).filter(function (b) { return inW(b.hAgo); });
      const GRP = ['Pending', 'Sent to bank', 'Rejected', 'Failed', 'Credited'];
      const crd = (function () { let n = 0, a = 0; const by = {}; dns.forEach(function (dn) { let c = finCredited(dn); if (mid) { const mm = mandalById(mid); c = mm ? { n: Math.round(mm.v.farmers - mm.v.farmersPend), amt: mm.v.paid } : c; } n += c.n; a += c.amt; by[dn] = c; }); return { n: n, amt: a, by: by }; })();
      X.push({ key: 'finfto', title: 'Farmer payments · individual FTOs · ' + scope, sub: 'One FTO per farmer, from generation to bank credit · FTOs not yet credited add up to farmer payments pending · as of ' + asOf,
        src: 'Statuses as carried in the payment feed: generated, pending bank verification, processing, credited; rejected and failed FTOs carry the bank response and failure reason (control register PDS-R117). Credited FTOs are counted one per farmer paid.',
        views: [
          { k: 'st', label: 'By status', build: function () { const rows = PAY_ST.map(function (p) { if (p[1] === 'Credited') return { name: p[0], cells: [T(p[1]), N(crd.n), C(fmtCr(crd.amt)), C('—')], drill: self.ftoStatusPop(dns, p, null, mid) }; const l = fb.filter(function (b) { return b.status === p[0]; }); return { name: p[0], cells: [T(p[1]), N(l.length), C(fmtCr(sum(l, 'amt'))), C(l.length ? fmtH(Math.max.apply(null, l.map(function (b) { return b.hAgo; }))) : '—', l.length ? 'warn' : '')], drill: l.length ? self.ftoStatusPop(dns, p, l, mid) : null }; }); return { labels: ['FTO status (source)', 'Group', 'FTOs (farmers)', 'Amount', 'Oldest'], rows: rows, total: [C(''), N(fb.length + crd.n), C(fmtCr(sum(fb, 'amt') + crd.amt)), C('')] }; } },
          { k: 'all', label: 'All FTOs', build: function () { const T0 = { n: 0, cr: 0, nc: 0, amt: 0 }; const rows = dns.map(function (dn) { const k = { n: 0, cr: 0, nc: 0, amt: 0 }; entsOfDistrict(dn, 'proc').filter(function (e) { return !mid || e.mid === mid; }).forEach(function (e) { const x = ftoCountRsk(e); ['n', 'cr', 'nc', 'amt'].forEach(function (q) { k[q] += x[q]; T0[q] += x[q]; }); }); return { name: dn, cells: [N(k.n), N(k.cr), N(k.nc, k.nc ? 'warn' : ''), C(fmtCr(k.amt))], drill: self.ftoDrill(dn) }; }); return { labels: ['District', 'FTOs (one per farmer)', 'Credited', 'Not yet credited', 'Amount'], rows: rows, total: [N(T0.n), N(T0.cr), N(T0.nc), C(fmtCr(T0.amt))] }; } },
          { k: 'fto', label: 'FTOs not yet credited', filter: 'status', build: function (fv) { const l = fb.filter(function (b) { return !fv || b.status === fv; }); return { labels: ['FTO', 'Farmer', 'PPC', 'Mandal', 'District', 'Generated', 'Amount (₹ lakh)', 'Status', 'Bank response / reason'], rows: l.map(function (b) { return { name: b.id, f: b.status, cells: [T(b.farmer), T(b.ppc), T(b.mandal), T(b.dn), C(fmtDT(b.hAgo)), C(fmtN(b.amt * 100, 2)), T(b.status, b.group === 'Rejected' || b.group === 'Failed' ? 'bad' : 'warn'), T(b.resp)], drill: open('fto', b) }; }), filterSrc: fb.map(function (b) { return b.status; }) }; } },
          { k: 'dist', label: 'By district', build: function () { return { labels: ['District'].concat(GRP.map(function (x) { return x + ' (₹ Cr)'; })), rows: dns.map(function (dn) { const l = fb.filter(function (b) { return b.dn === dn; }); return { name: dn, cells: GRP.map(function (gr) { const v = gr === 'Credited' ? crd.by[dn].amt : sum(l.filter(function (b) { return b.group === gr; }), 'amt'); return C(fmtN(v, 2), v > 0 && (gr === 'Rejected' || gr === 'Failed') ? 'bad' : ''); }), drill: null }; }), total: GRP.map(function (gr) { return C(fmtN(gr === 'Credited' ? crd.amt : sum(fb.filter(function (b) { return b.group === gr; }), 'amt'), 2)); }) }; } }
        ] });
      const BND = ['Within 24 h', '24–48 h', 'Beyond 48 h'];
      X.push({ key: 'fininc', title: 'Gunny, labour & transport payments · ' + scope, sub: 'Bill-level records with FTO and bank response · as of ' + asOf,
        src: 'Fields per KPI framework §1 (KPI 8): payment type (gunny, labour, transport), bill, payment time band, by district; FTO covers gunny, labour and transport payments (glossary).',
        views: [
          { k: 'type', label: 'By type', build: function () { const rows = INC_TYPES.map(function (t) { const l = ib.filter(function (b) { return b.type === t[0]; }); return { name: t[0], cells: [N(l.length), C(fmtL(sum(l, 'amt')))].concat(BND.map(function (bd) { return N(cnt(l, function (b) { return b.band === bd; })); })).concat([N(cnt(l, function (b) { return b.status !== 'Paid'; }), cnt(l, function (b) { return b.status !== 'Paid'; }) ? 'warn' : ''), C(fmtL(sum(l.filter(function (b) { return b.status !== 'Paid'; }), 'amt')))]) }; }); return { labels: ['Payment type', 'Bills', 'Amount', 'Paid within 24 h', 'Paid in 24–48 h', 'Paid beyond 48 h', 'Not yet paid', 'Unpaid amount'], rows: rows, total: [N(ib.length), C(fmtL(sum(ib, 'amt')))].concat(BND.map(function (bd) { return N(cnt(ib, function (b) { return b.band === bd; })); })).concat([N(cnt(ib, function (b) { return b.status !== 'Paid'; })), C(fmtL(sum(ib.filter(function (b) { return b.status !== 'Paid'; }), 'amt')))]) }; } },
          { k: 'bills', label: 'Bill records', filter: 'status', build: function (fv) { const l = ib.filter(function (b) { return !fv || b.status === fv; }); return { labels: ['Bill', 'Type', 'Payee', 'PPC', 'District', 'Bill date', 'Amount (₹ lakh)', 'FTO', 'Status', 'Paid in', 'Bank response'], rows: l.map(function (b) { return { name: b.id, f: b.status, cells: [T(b.type), T(b.payee), T(b.ppc), T(b.dn), C(fmtDT(b.hAgo)), C(fmtN(b.amt, 2)), T(b.fto || '—'), T(b.status, b.status === 'Paid' ? 'good' : b.status === 'Rejected by bank' ? 'bad' : 'warn'), C(b.payH === null ? '—' : fmtH(b.payH), b.payH > 48 ? 'bad' : b.payH > 24 ? 'warn' : ''), T(b.resp || '—')], drill: open('bill', b) }; }), filterSrc: ib.map(function (b) { return b.status; }) }; } }
        ] });
    }

    if (mode === 'alerts') {
      const gv = gather(grievOf).filter(function (g) { return (stage === 'all' || g.stage === stage) && inW(g.ageH); });
      const SLA = 'Resolution SLA used here (POC setting, replace with the notified grievance policy): critical 24 h, high 72 h, medium 7 days, low 14 days.';
      const kc = function (l) { const due = l.filter(function (g) { return g.dueNow; }); return [N(l.length), N(cnt(l, function (g) { return g.ackH !== null; })), N(cnt(l, function (g) { return g.resH !== null; })), N(cnt(l, function (g) { return g.valH !== null; })), N(cnt(l, function (g) { return g.closeH !== null; })), N(due.length), N(cnt(due, function (g) { return g.within; })), N(cnt(l, function (g) { return g.overdue; }), cnt(l, function (g) { return g.overdue; }) ? 'bad' : '')]; };
      const KL = ['Received', 'Acknowledged', 'Resolved', 'Validated', 'Closed', 'Due by now', 'Resolved & validated in SLA', 'Overdue, not validated'];
      X.push({ key: 'grv', title: 'Grievance register · ' + scope, sub: 'PGRS and IVRS grievances · acknowledgement, resolution, validation and closure are separate events · as of ' + asOf,
        src: 'Fields per KPI framework §1 (KPI 13: by type, RSK and district) and the grievance controls (case ID, channel, timestamps, action, confirmation). ' + SLA,
        views: [
          { k: 'reg', label: 'Register', filter: 'state', build: function (fv) { const l = gv.filter(function (g) { return !fv || g.state === fv; }); return { labels: ['Grievance', 'Type', 'Channel', 'District', 'Mandal', 'RSK / FPS', 'Received', 'SLA due', 'Acknowledged', 'Resolved', 'Validation', 'Closed', 'In SLA'], rows: l.map(function (g) { return { name: g.id, f: g.state, cells: [T(g.type), T(g.channel), T(g.dn), T(g.mandal), T(g.anchor), C(fmtDT(g.ageH)), C(fmtDT(g.dueH), g.overdue ? 'bad' : ''), C(g.ackH === null ? '—' : fmtDT(g.ackH)), C(g.resH === null ? '—' : fmtDT(g.resH)), T(g.valid + (g.valH !== null ? ' · ' + fmtDT(g.valH) : ''), g.valid === 'Validated' ? 'good' : g.valid.indexOf('Rejected') === 0 ? 'bad' : 'warn'), C(g.closeH === null ? '—' : fmtDT(g.closeH)), T(!g.dueNow && g.valH === null ? 'Not yet due' : g.within ? 'Yes' : 'No', g.within ? 'good' : !g.dueNow ? '' : 'bad')], drill: open('grv', g) }; }), filterSrc: gv.map(function (g) { return g.state; }) }; } },
          { k: 'type', label: 'By type', build: function () { const g = group(gv, function (x) { return x.type; }); return { labels: ['Grievance type'].concat(KL), rows: g.map(function (x) { return { name: x.k, cells: kc(x.l) }; }), total: kc(gv) }; } },
          { k: 'rsk', label: 'By RSK / FPS', build: function () { const g = group(gv, function (x) { return x.dn + '|' + x.anchor; }); return { labels: ['RSK / FPS', 'District', 'Mandal'].concat(KL), rows: g.map(function (x) { return { name: x.l[0].anchor, cells: [T(x.l[0].dn), T(x.l[0].mandal)].concat(kc(x.l)) }; }), total: [C(''), C('')].concat(kc(gv)) }; } },
          { k: 'dist', label: 'By district', build: function () { const g = group(gv, function (x) { return x.dn; }); return { labels: ['District'].concat(KL), rows: g.map(function (x) { return { name: x.k, cells: kc(x.l), drill: null }; }), total: kc(gv) }; } }
        ] });
    }

    if (mode === 'cctv') {
      const filt = function (c) { return stage === 'all' || c.stage === stage || (stage === 's2' && c.stage === 's1'); };
      let cams = [], evs = []; dns.forEach(function (dn) { const x = camExtra(dn); cams = cams.concat(x.cams.filter(filt)); evs = evs.concat(x.events.filter(function (e) { return filt(e.cam); })); });
      X.push({ key: 'cammap', title: 'Camera-to-site mapping · ' + scope, sub: 'Every camera with its site, position and last-seen time · as of ' + asOf,
        src: 'Site and camera position as recorded in the camera register (gate, weighbridge, stack yard, loading bay); last seen = last heartbeat received from the recorder.',
        views: [
          { k: 'site', label: 'By site', build: function () { const g = group(cams, function (c) { return c.dn + '|' + c.site; }); return { labels: ['Site', 'Site type', 'District', 'Mandal', 'Cameras', 'Offline', 'Positions covered', 'Oldest last-seen'], rows: g.map(function (x) { const l = x.l; const o = cnt(l, function (c) { return c.status === 'Offline'; }); return { name: l[0].site, cells: [T(l[0].siteType), T(l[0].dn), T(l[0].mandal), N(l.length), N(o, o ? 'bad' : ''), T(group(l, function (c) { return c.view; }).map(function (v) { return v.k; }).join(', ')), C(fmtDT(Math.max.apply(null, l.map(function (c) { return c.seenH; }))), o ? 'bad' : '')] }; }) }; } },
          { k: 'cams', label: 'Cameras', filter: 'status', build: function (fv) { const l = cams.filter(function (c) { return !fv || c.status === fv; }); return { labels: ['Camera', 'Site', 'Site type', 'Position', 'District', 'Mandal', 'Status', 'Last seen'], rows: l.map(function (c) { return { name: c.id, f: c.status, cells: [T(c.site), T(c.siteType), T(c.view), T(c.dn), T(c.mandal), T(c.status, c.status === 'Online' ? 'good' : 'bad'), C(c.status === 'Online' ? fmtDT(c.seenH) + ' · live' : fmtDT(c.seenH) + ' · ' + fmtH(c.seenH) + ' ago', c.status === 'Online' ? '' : 'bad')], drill: open('cam', c) }; }), filterSrc: cams.map(function (c) { return c.status; }) }; } }
        ] });
      X.push({ key: 'camev', title: 'Flagged-event review · ' + scope, sub: 'Events from video analytics with review status and the record each review led to · click to open the linked incident or record',
        src: 'Review status and links come from the command-centre review log. A link is shown only where the review recorded one; record IDs not loaded in this view are shown as text.',
        views: [
          { k: 'ev', label: 'Events', filter: 'review', build: function (fv) { const l = evs.filter(function (e) { return !fv || e.review === fv; }); return { labels: ['Event', 'Detected', 'Camera', 'Site', 'District', 'Event type', 'Review status', 'Reviewed by', 'Linked incident / record'], rows: l.map(function (e) { return { name: e.id, f: e.review, cells: [C(fmtDT(e.atH)), T(e.cam.id), T(e.site), T(e.dn), T(e.event), T(e.review, e.review === 'Not reviewed' ? 'bad' : e.review === 'Under review' ? 'warn' : 'good'), T(e.by || '—'), T(e.link ? e.link.label : '—')], drill: open('camev', e) }; }), filterSrc: evs.map(function (e) { return e.review; }), filterOrder: CAM_REVIEW }; } },
          { k: 'st', label: 'By review status', build: function () { return { labels: ['Review status', 'Events', 'Sites', 'Linked to incident', 'Linked to record'], rows: CAM_REVIEW.map(function (r) { const l = evs.filter(function (e) { return e.review === r; }); return { name: r, cells: [N(l.length), N(group(l, function (e) { return e.site; }).length), N(cnt(l, function (e) { return e.link && e.link.kind === 'inc'; })), N(cnt(l, function (e) { return e.link && e.link.kind !== 'inc'; }))] }; }), total: [N(evs.length), C(''), N(cnt(evs, function (e) { return e.link && e.link.kind === 'inc'; })), N(cnt(evs, function (e) { return e.link && e.link.kind !== 'inc'; }))] }; } }
        ] });
    }

    if (mode === 'gps') {
      let tr = []; dns.forEach(function (dn) { tr = tr.concat(tripsOf(dn).filter(function (t) { return stage === 'all' || t.stage === stage; })); });
      const feed = dns.map(function (dn) { return gpsFeedMin(dn); }); const fmax = Math.max.apply(null, feed);
      X.push({ key: 'gpstrip', title: 'Trip links · ' + scope, sub: 'Each tracked trip with its vehicle, route and the dispatch, receipt and acknowledgement records · GPS feed last received ' + (dns.length > 1 ? 'between 1 and ' + fmax + ' min ago across districts' : feed[0] + ' min ago'),
        src: 'Vehicle and route from the GPS feed; dispatch, receipt and acknowledgement numbers from the stage records for that leg. A record is shown only once it exists in the source.',
        views: [
          { k: 'links', label: 'Trip → records', filter: 'trip', build: function (fv) { const l = tr.filter(function (t) { return !fv || t.trip === fv; }); return { labels: ['Trip', 'Vehicle', 'Leg', 'Route', 'Dispatch record', 'Departed', 'Receipt record', 'Reached', 'Acknowledgement', 'Trip state'], rows: l.map(function (t) { return { name: t.id, f: t.trip, cells: [T(t.veh.plate), T(STAGE_NAME[t.stage]), T(t.route), T(t.dDoc || '—'), C(t.depH === null ? '—' : fmtDT(t.depH)), T(t.rDoc || '—'), C(t.recH === null ? '—' : fmtDT(t.recH)), T(t.aDoc || (t.recH === null ? '—' : 'Awaiting'), t.aDoc ? 'good' : t.recH === null ? '' : 'warn'), T(t.trip, t.trip === 'Completed' ? 'good' : t.trip.indexOf('Not started') === 0 ? 'bad' : '')], drill: open('trip', t) }; }), filterSrc: tr.map(function (t) { return t.trip; }) }; } },
          { k: 'states', label: 'Device, vehicle & trip states', build: function () { const g = group(tr, function (t) { return t.dn; }); const cols = function (l) { return [N(l.length), N(cnt(l, function (t) { return t.offline; }), cnt(l, function (t) { return t.offline; }) ? 'bad' : ''), N(cnt(l, function (t) { return t.idle; })), N(cnt(l, function (t) { return t.trip.indexOf('Not started') === 0; }), cnt(l, function (t) { return t.trip.indexOf('Not started') === 0; }) ? 'warn' : '')]; }; return { labels: ['District', 'Vehicles tracked', 'Device offline (no ping > 30 min)', 'Idle (online, stationary, no active trip)', 'Trip not started (past scheduled start)', 'Source update'], rows: g.map(function (x) { return { name: x.k, cells: cols(x.l).concat([C(gpsFeedMin(x.k) + ' min ago')]) }; }), total: cols(tr).concat([C('')]), note: 'Three separate states: a device that stopped reporting, a vehicle that reports but has no trip, and a scheduled trip whose vehicle has not left.' }; } },
          { k: 'exc', label: 'State exceptions', filter: 'vstate', build: function (fv) { const l = tr.filter(function (t) { return (t.offline || t.idle || t.trip.indexOf('Not started') === 0) && (!fv || t.vstate === fv); }); return { labels: ['Vehicle', 'District', 'Leg', 'Device', 'Last ping', 'Vehicle state', 'Trip state', 'Scheduled start'], rows: l.map(function (t) { return { name: t.veh.plate, f: t.vstate, cells: [T(t.dn), T(STAGE_NAME[t.stage]), T(t.offline ? 'Offline' : 'Online', t.offline ? 'bad' : 'good'), C(t.pingMin >= 60 ? fmtH(t.pingMin / 60) + ' ago' : fmtN(t.pingMin, 0) + ' min ago'), T(t.vstate), T(t.trip), C(t.schedStart)], drill: open('trip', t) }; }), filterSrc: tr.filter(function (t) { return t.offline || t.idle || t.trip.indexOf('Not started') === 0; }).map(function (t) { return t.vstate; }) }; } }
        ] });
    }
    return X.filter(Boolean);
  }

  briefFor(dn, sk) {
    const self = this; const s = this.state;
    const lv = s.lastVisit || (Date.now() - 24 * 3600000); const hrs = Math.max(1, (Date.now() - lv) / 3600000);
    const msg = function (text, bars, label, act) { return { text: text, bars: bars || [], actLabel: label || '', act: act || null }; };
    const T = function (x, t) { return Object.assign(C(x, t || ''), { cls: 'txt' }); };
    const dns = dn ? [dn] : D.map(function (d) { return d.name; });
    let inc = []; dns.forEach(function (d) { inc = inc.concat(incidentsOf(d)); });
    const crit = inc.filter(function (i) { return i.prio === 'P1' && i.ageH <= hrs; });
    const items = {};
    items.crit = { n: crit.length, tone: 'bad', text: fmtN(crit.length) + ' critical incident' + (crit.length === 1 ? '' : 's') + ' raised since your last visit' + (crit.length ? ' · ' + crit.slice(0, 2).map(function (i) { return i.title + ' (' + i.dn + ')'; }).join('; ') : ''), go: function () { self.tablePopup('Critical incidents since your last visit', 'Raised in the last ' + fmtH(hrs), ['Incident', 'Title', 'District', 'Mandal', 'Stage', 'Status', 'Age'], crit.map(function (i) { return { name: i.id, cells: [T(i.title), T(i.dn), T(i.mandal), T(STAGE_NAME[i.stage]), T(i.status, i.status === 'Escalated' ? 'bad' : ''), C(i.ageH + ' h')] }; }), null, 'critical-since-last-visit'); } };
    const Q = { pay: 'payment batches rejected or failed', grv: 'grievances overdue sla', mill: 'mills overdue cmr', ack: 'deliveries awaiting epos acknowledgement', lots: 'lots aged beyond target', ver: 'verification overdue', trips: 'trips not completed', cams: 'cameras offline' };
    const AREA = { crit: 'Critical incidents', pay: 'Farmer FTOs', grv: 'Grievances', mill: 'Rice mills · CMR', ack: 'Stage-II deliveries', lots: 'Storage lots', ver: 'Physical verification', trips: 'GPS trips', cams: 'CCTV cameras' };
    items.crit.area = AREA.crit;
    { const nw = inc.filter(function (i) { return i.prio !== 'P1' && i.ageH <= hrs; });
      items.alerts = { area: 'New alerts', n: nw.length, tone: 'warn', text: fmtN(nw.length) + ' new alert' + (nw.length === 1 ? '' : 's') + ' raised since your last visit' + (nw.length ? ' · ' + nw.slice(0, 2).map(function (i) { return i.title + ' (' + i.dn + ')'; }).join('; ') : ''), go: function () { self.tablePopup('Alerts since your last visit', 'Raised in the last ' + fmtH(hrs) + ' · critical ones are listed separately', ['Incident', 'Alert', 'Severity', 'District', 'Mandal', 'Status', 'Age'], nw.map(function (i) { return { name: i.id, cells: [T(i.title), T(SEV[i.prio]), T(i.dn), T(i.mandal), T(i.status), C(i.ageH + ' h')], drill: function () { self.setState({ rxRec: self.rxBack(self.incRec(i)) }); } }; }), null, 'alerts-since-last-visit'); } };
      const gn = inc.filter(function (i) { return i.title === 'Gunny bags exhausted at RSK'; });
      items.gunny = { area: 'Gunny bags', n: gn.length, tone: 'bad', text: fmtN(gn.length) + ' RSK' + (gn.length === 1 ? '' : 's') + ' reported gunny bags exhausted' + (gn.length ? ' · ' + gn.slice(0, 2).map(function (i) { return i.mandal + ' (' + i.dn + ')'; }).join('; ') : ''), go: function () { self.tablePopup('Gunny bags exhausted at RSKs', 'Open alerts · procurement at these RSKs stops until gunnies are positioned', ['Incident', 'Mandal', 'District', 'Severity', 'Status', 'Age'], gn.map(function (i) { return { name: i.id, cells: [T(i.mandal), T(i.dn), T(SEV[i.prio]), T(i.status), C(i.ageH + ' h')], drill: function () { self.setState({ rxRec: self.rxBack(self.incRec(i)) }); } }; }), null, 'gunny-exhausted'); } }; }
    Object.keys(Q).forEach(function (k) { const m = self.answerRecords(Q[k], dn, msg); if (!m) return; const n = parseInt((m.text.match(/^[\d,]+/) || ['0'])[0].replace(/,/g, ''), 10) || 0; items[k] = { area: AREA[k], n: n, tone: n ? (k === 'pay' || k === 'grv' || k === 'mill' ? 'bad' : 'warn') : 'good', text: m.text.split('. ')[0].replace(/\.$/, ''), go: m.act }; });
    const ORD = { proc: ['crit', 'alerts', 'gunny', 'pay', 'grv', 'trips', 'ver'], mill: ['crit', 'alerts', 'mill', 'trips', 'ack', 'lots'], between: ['crit', 'alerts', 'lots', 'ver', 'ack', 'cams'], all: ['crit', 'alerts', 'gunny', 'pay', 'mill', 'grv', 'ack', 'lots', 'trips', 'ver', 'cams'] };
    const list = (ORD[sk] || ORD.all).map(function (k) { return items[k]; }).filter(function (x) { return x && x.n > 0; }).slice(0, 8).map(function (x) { return { area: x.area, n: x.n, tone: x.tone, text: x.text, dot: 'bdot ' + x.tone, go: x.go }; });
    const openAll = function () { self.setState({ rxRec: { title: 'Since your last visit', sub: (s.lastVisit ? 'Last visit ' + fmtDT((Date.now() - s.lastVisit) / 3600000) : 'First visit on this browser · last 24 hours') + ' · ' + (dn || 'Andhra Pradesh') + ' · click a line for its records', facts: [], steps: [], links: [], list: list.map(function (x) { return { area: x.area, text: x.text, dot: 'bdot ' + x.tone, go: function () { x.go(); } }; }) } }); };
    const openAllOld = function () { self.tablePopup('Since your last visit', (s.lastVisit ? 'Last visit ' + fmtDT((Date.now() - s.lastVisit) / 3600000) : 'First visit on this browser · last 24 hours') + ' · ' + (dn || 'Andhra Pradesh') + ' · click a line for its records', ['Area', 'Count', 'What needs your attention', 'Records'], list.map(function (x) { return { name: x.area, cells: [C(fmtN(x.n), x.tone === 'bad' ? 'bad' : 'warn'), Object.assign(C(x.text.replace(/^[\d,]+ /, '')), { cls: 'txt' }), Object.assign(C('View →'), { cls: 'txt' })], drill: function () { x.go(); } }; }), null, 'since-last-visit'); };
    return { btn: true, n: list.length, open: openAll, items: list, has: list.length > 0, none: list.length === 0, loading: false, sub: (s.lastVisit ? 'Last visit ' + fmtDT((Date.now() - s.lastVisit) / 3600000) : 'First visit on this browser · showing the last 24 hours') + ' · ' + (dn || 'Andhra Pradesh') + ' · ordered for ' + (SEASONS[sk] || SEASONS.all).short + ' · click a line for its records' };
  }
  rxVerif(et, reg, scope, depth, path) {
    const self = this;
    const T = function (x, t) { return Object.assign(C(x, t || ''), { cls: 'txt' }); };
    const N = function (x, t) { return C(fmtN(x), t); };
    const month = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    const dayD = function (d) { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); };
    const cnt = function (l, f) { return l.filter(f).length; };
    const cols = function (l) { const c = cnt(l, function (r) { return r.status === 'Completed'; }); return [N(l.length), N(c), N(cnt(l, function (r) { return r.status === 'Scheduled'; })), N(cnt(l, function (r) { return r.status.indexOf('Overdue') === 0; }), cnt(l, function (r) { return r.status.indexOf('Overdue') === 0; }) ? 'bad' : ''), C(c + ' of ' + l.length)]; };
    const grp = function (l, k) { const o = {}, ord = []; l.forEach(function (r) { const x = r[k]; if (!o[x]) { o[x] = []; ord.push(x); } o[x].push(r); }); return ord.map(function (x) { return { k: x, l: o[x] }; }); };
    return { key: 'verif' + et, title: 'Physical verification · scheduled vs completed · ' + month + ' · ' + scope, sub: (et === 's2' ? 'MLS points' : 'Buffer godowns') + ' scheduled for physical verification this month, from the inspection register',
      src: 'KPI framework ' + (et === 's2' ? '§5 KPI 36–37' : '§3 KPI 16') + ': locations physically verified during the month against locations scheduled, with physical versus book stock at the verification.',
      views: [
        { k: 'sum', label: 'By ' + (depth ? 'mandal' : 'district'), build: function () { const g = grp(reg, depth ? 'mandal' : 'dn'); return { labels: [depth ? 'Mandal' : 'District', 'Scheduled', 'Completed', 'Still scheduled', 'Overdue', 'X of Y'], rows: g.map(function (x) { return { name: x.k, cells: cols(x.l), drill: null }; }), total: cols(reg) }; } },
        { k: 'list', label: 'Location list', filter: 'status', build: function (fv) { const l = reg.filter(function (r) { return !fv || r.status === fv; }); return { labels: ['Location', 'Type', 'District', 'Mandal', 'Scheduled', 'Verified on', 'Verified by', 'Book (MT)', 'Physical (MT)', 'Variance', 'Status'], rows: l.map(function (r) { const vv = r.phys === null ? null : (r.phys - r.book) / (r.book || 1); return { name: r.loc, f: r.status, cells: [T(r.type), T(r.dn), T(r.mandal), C(dayD(r.schedDay)), C(r.doneDay ? dayD(r.doneDay) : '—'), T(r.by || '—'), C(fmtN(r.book, 1)), C(r.phys === null ? '—' : fmtN(r.phys, 1)), C(vv === null ? '—' : fmtN(vv * 100, 2) + '%', vv !== null && Math.abs(vv) > 0.0025 ? 'bad' : ''), T(r.status, r.status === 'Completed' ? 'good' : r.status === 'Scheduled' ? '' : 'bad')] }; }), filterSrc: reg.map(function (r) { return r.status; }) }; } }
      ] };
  }

  rxBack(rec) { if (rec && this.state.rxRec && rec !== this.state.rxRec) rec.back = this.state.rxRec; return rec; }
  /* ---------- Incident case file, layer by layer ---------- */
  incLayers(i) {
    const self = this; const s = this.state; const c = incCat(i); const OWN = { proc: 'Procurement wing', cmr: 'CMR cell', s1: 'Transport cell', s2: 'Distribution wing', stor: 'Storage wing' };
    const R = function (k, v, links) { return { k: k, v: v, links: links || [], hasLinks: !!(links && links.length) }; };
    const incL = function (ids, more) { const l = ids.slice(0, 4).map(function (id) { const x = TX[id]; return { id: id, cls: 'inclink' + (x && x.prio === 'P1' ? ' p1' : ''), go: function () { self.setState({ rxRec: self.rxBack(self.incRec(x)) }); } }; }); if (ids.length > 4) l.push({ id: '+' + (ids.length - 4) + ' more', cls: 'inclink more', go: more }); return l; };
    const lk = function (label, fn) { return [{ id: label, cls: 'inclink lk', go: fn }]; };
    const incTable = function (title, l) { return function () { self.tablePopup(title, fmtN(l.length) + ' incidents · click one for its case file', ['Incident ID', 'Incident', 'Severity', 'Mandal', 'District', 'Status', 'Age'], l.map(function (x) { const T = function (y) { return Object.assign(C(y), { cls: 'txt' }); }; return { name: x.id, cells: [T(x.title), T(SEV[x.prio]), T(x.mandal), T(x.dn), T(x.status), C(x.ageH + ' h')], drill: function () { self.setState({ rxRec: self.rxBack(self.incRec(x)) }); } }; }), null, 'incidents'); }; };
    const ev = incEvidence(i);
    /* 1 */ const L1 = [R('Incident', i.id + ' · ' + i.title), R('Where', i.mandal + ' mandal, ' + i.dn + ' district'), R('Stage · point', STAGE_NAME[i.stage] + ' · ' + i.ent + (i.mv ? ' · ' + i.mv : '')), R('Severity', SEV[i.prio] + ' · ' + i.why), R('Status', i.status + (i.escTo ? ' · escalated to ' + i.escTo : '') + ' · ' + i.ageH + ' h old'), R('Raised by', SRC[i.src] || i.src), R('AI summary', incAiOne(i))];
    /* 2 */ let skipped = 0; const L2 = []; ev.forEach(function (r) { L2.push(R(r[0], r[1])); if (!INC_LINK_K[r[0]]) return;
      incLinksFor(r[1], i.dn).forEach(function (id) { const j = TX[id]; const why = incAffects(i, j, r[0]); if (!why) { if (j && j.id !== i.id) skipped++; return; }
        L2.push(R('↳ ' + j.id, j.title + ' · ' + SEV[j.prio] + ' · ' + j.status + ' · ' + j.ageH + ' h old · ' + j.mandal + '. ' + why, [{ id: 'Open ' + j.id, cls: 'inclink' + (j.prio === 'P1' ? ' p1' : ''), go: function () { self.setState({ rxRec: self.rxBack(self.incRec(j)) }); } }])); }); });
    const n2 = skipped ? skipped + ' other incident' + (skipped === 1 ? '' : 's') + ' share' + (skipped === 1 ? 's' : '') + ' one of these records but ' + (skipped === 1 ? 'is' : 'are') + ' at a different stage, so ' + (skipped === 1 ? 'it does' : 'they do') + ' not bear on this incident and ' + (skipped === 1 ? 'is' : 'are') + ' not shown.' : '';
    /* 3 */ const L3 = [R('Rule on this dashboard', incRule(i.code, i.title))].concat(c ? [R('Catalogue rule', c.id + ' · ' + c.name), R('The test', c.rule || '—'), R('Could be innocent if', c.innocent || '—'), R('Rule source', c.source || '—'), R('Data it needs', (c.dataNeeded || '—') + (c.dataState ? ' · ' + c.dataState : ''))] : [R('Catalogue rule', 'Not in the anomaly catalogue; the rule above is as configured on this dashboard.')]);
    /* 4 */ let L4 = []; let n4 = '';
    if (c) { const all = adbFor(c.id); const here = all.filter(function (r) { return r.dn === i.dn; }); const fd = all[0] ? ADB.feeds[all[0].feed] : null;
      if (!all.length) n4 = 'No feed sample has records for rule ' + c.id + ' yet' + (c.dataState ? ' (' + c.dataState.toLowerCase() + ')' : '') + '. When the feed is connected its records appear here.';
      else { L4.push(R('Feed', (ADB_FEEDN[all[0].feed] || all[0].feed) + (fd ? ' · ' + fd.scope + (fd.asof ? ' · as of ' + fd.asof : '') : ''))); L4.push(R('Records for this rule', fmtN(here.length) + ' in ' + i.dn + ' · ' + fmtN(all.length) + ' statewide', lk('List all ' + fmtN(all.length), function () { self.feedList(c, all, i); })));
        (here.length ? here : []).slice(0, 5).forEach(function (r) { L4.push(R(r.id, adbEnt(r) + ' · ' + r.act + (r.vr ? ' (' + r.vr + ')' : '') + ' · ' + (ADB_SEAS[r.season] || r.season || ''), lk('Open record', function () { self.openFeedRec(r); }))); });
        if (!here.length) n4 = 'The feed sample has no ' + c.id + ' records in ' + i.dn + '; the statewide records are listed above.'; } }
    else n4 = 'This incident type has no matching catalogue rule, so there is no feed record to show.';
    /* 5 */ const imp = incImpacts(i); const g = incImpGroup(i);
    const same = incidentsOf(i.dn).filter(function (x) { return x.title === i.title && x.id !== i.id; }); const sameM = same.filter(function (x) { return x.mandal === i.mandal; });
    let sameS = []; D.forEach(function (d) { sameS = sameS.concat(incidentsOf(d.name).filter(function (x) { return x.title === i.title; })); });
    let onRec = []; ev.forEach(function (r) { if (INC_LINK_K[r[0]]) incLinksFor(r[1], i.dn).forEach(function (id) { if (id !== i.id && onRec.indexOf(id) < 0 && incAffects(i, TX[id], r[0])) onRec.push(id); }); });
    let recs = []; try { self._buildingAi = true; recs = self.buildIntel([i.dn]).intel.recs.filter(function (r) { return (IMP_REC[i.stage] || []).indexOf(r.key) >= 0 || (r.key === 'inc' && i.prio === 'P1') || (r.key === 'gps' && i.src === 'GPS'); }); } catch (e) { recs = []; } self._buildingAi = false;
    const logs = (s.actLog || []).filter(function (e) { const b = (e.rec || '') + ' ' + (e.where || '') + ' ' + (e.remarks || ''); return b.indexOf(i.id) >= 0 || ev.some(function (r) { return INC_LINK_K[r[0]] && r[1].length > 5 && b.indexOf(incKey(r[1]).slice(0, 18)) >= 0 && b.toUpperCase().indexOf(incKey(r[1])) >= 0; }); });
    const press = pressClips().filter(function (x) { return x.district === i.dn && (IMP_PRESS[g] || /./).test(x.head + ' ' + x.text); });
    const L5 = imp.map(function (m) { return R('Measure · ' + m[0], m[1] + ' in ' + i.dn + ' · ' + m[2]); })
      .concat([R('Other incidents that affect it', onRec.length ? fmtN(onRec.length) + ' incident' + (onRec.length === 1 ? '' : 's') : 'None', onRec.length ? incL(onRec, incTable('Incidents on the same records as ' + i.id, onRec.map(function (id) { return TX[id]; }))) : [])])
      .concat([R('Same incident type', fmtN(sameM.length) + ' more in ' + i.mandal + ' · ' + fmtN(same.length) + ' more in ' + i.dn + ' · ' + fmtN(sameS.length) + ' statewide', same.length ? lk('List ' + i.dn, incTable(i.title + ' · ' + i.dn, same)) : [])])
      .concat(recs.length ? recs.map(function (r) { return R('Decision it feeds', r.title + ' (' + r.area + ')', lk('Open in Intelligence', function () { self.askMore({ title: r.title, dn: i.dn, recKey: r.key, why: r.why.map(function (w) { return w.t; }), action: r.act, recSugs: r.sugs, facts: [{ k: 'Owner', v: r.owner }, { k: 'By', v: r.by }] }); })); }) : [R('Decision it feeds', 'No open Intelligence recommendation covers this stage in ' + i.dn + ' right now.')])
      .concat([R('Decision log', logs.length ? fmtN(logs.length) + ' decision' + (logs.length === 1 ? '' : 's') + ' recorded on this incident or its records' : 'No decision recorded yet', logs.length ? lk('Open', function () { self.setState({ rxRec: null, module: 'intel', stage: 'all', pivot: false, intelTab: 'log' }); }) : [])])
      .concat([R('Press', press.length ? fmtN(press.length) + ' clipping' + (press.length === 1 ? '' : 's') + ' on this topic in ' + i.dn + ' (sample feed)' : 'No clipping on this topic in ' + i.dn, press.length ? lk('List', function () { self.pwList('Clippings on this topic · ' + i.dn, press); }) : [])])
      .concat(c && c.exposure ? [R('Exposure', c.exposure)] : []).concat(c && c.catching ? [R('What it is catching', c.catching)] : [])
      .concat(c && c.riskTitle ? [R('Risk register', c.risk + ' · ' + c.riskTitle)] : [])
      .concat(audFor(c).map(function (a) { return R('CAG audit finding ' + a.n + ' · ' + a.cat, a.desc + (a.fin ? ' · ' + a.fin : '')); }));
    /* 6 */ const L6 = [R('Recommended action', c && c.action ? c.action : 'Verify on the ground with the records in layer 2, then close or escalate.'), R('Answered by', c ? c.ownerOffice + ' · within ' + c.sla : OWN[i.stage]), R('Owner on this dashboard', OWN[i.stage] + ' · response time ' + (SEV_RESP_H[i.prio] || 72) + ' h for ' + SEV[i.prio])];
    const defs = [[1, 'What happened', 'the incident as raised', L1, ''], [2, 'Records behind it', fmtN(ev.length) + ' records · with the other incidents that affect this one', L2, n2], [3, 'Why it was flagged', c ? 'catalogue rule ' + c.id : 'dashboard rule', L3, ''], [4, 'Source records in the feed', c ? 'APSCSCL API sample' : 'not available', L4, n4], [5, 'What it is impacting', 'measures, linked incidents, decisions, press, audit', L5, ''], [6, 'What to do', c ? c.ownerOffice : OWN[i.stage], L6, '']];
    const LO = s.lyrOpen || {};
    return defs.map(function (d) { const k = i.id + '|' + d[0]; const op = k in LO ? LO[k] : (d[0] === 1 || d[0] === 5); return { n: d[0], title: d[1], sub: d[2], rows: d[3], hasRows: d[3].length > 0, note: d[4], hasNote: !!d[4], open: op, arrow: op ? '▾' : '▸', cls: 'lyr' + (op ? ' on' : ''), toggle: function () { const o = Object.assign({}, self.state.lyrOpen || {}); o[k] = !op; self.setState({ lyrOpen: o }); },
      ask: function () { self.askMore({ title: i.id + ' · ' + d[1], dn: i.dn, incId: i.id, layer: d[0] }); } }; });
  }
  feedList(c, l, i) {
    const self = this; const T = function (x, t) { return Object.assign(C(x, t || ''), { cls: 'txt' }); };
    this.tablePopup('Feed records · ' + c.id + ' · ' + c.subName, fmtN(l.length) + ' records statewide' + (i ? ' · ' + fmtN(l.filter(function (r) { return r.dn === i.dn; }).length) + ' in ' + i.dn : '') + ' · from the APSCSCL API sample', ['Record', 'Entity', 'District', 'Mandal', 'Expected', 'Actual', 'Season', 'Date'], l.map(function (r) { return { name: r.id, cells: [T(adbEnt(r)), T(r.dn), T(r.mandal), T(r.exp), T(r.act + (r.vr ? ' (' + r.vr + ')' : ''), 'bad'), T(ADB_SEAS[r.season] || r.season || 'Stock position'), T(r.date)], drill: function () { self.openFeedRec(r); } }; }), null, 'feed-' + c.id, null, [{ k: 'Rule', v: c.id + ' · ' + c.name }, { k: 'Test', v: c.rule || '' }]);
  }
  openFeedRec(r) {
    const self = this; const c = ADB.cat[r.t]; const fd = ADB.feeds[r.feed] || {}; const facts = [{ k: 'Record', v: r.id }, { k: 'Rule', v: r.t + ' · ' + (c ? c.name : '') }, { k: 'Expected', v: r.exp || '—' }, { k: 'Actual', v: r.act + (r.vr ? ' (' + r.vr + ')' : '') }, { k: 'Where', v: r.mandal + ', ' + r.dn }, { k: 'Season', v: ADB_SEAS[r.season] || r.season || 'Stock position' }, { k: 'Event date', v: r.date }, { k: 'Feed', v: (ADB_FEEDN[r.feed] || r.feed) + (fd.asof ? ' · as of ' + fd.asof : '') }];
    let steps = []; let tbl = null; const T = function (x, t) { return Object.assign(C(x, t || ''), { cls: 'txt' }); };
    if (r.feed === 'PROC') { const tcId = /^TC-/.test(r.ref) ? r.ref : null; const ff = ADB.fto.filter(function (f) { return f[11] === (tcId || (ADB.fto.filter(function (x) { return x[0] === r.ref; })[0] || [])[11]); }); const t = ADB_TC[tcId || (ff[0] || [])[11]];
      if (t) { facts.push({ k: 'Truck chit', v: t.id + ' · vehicle ' + t.veh }, { k: 'Mill', v: adbT(t.millName) + ' · ' + t.millMandal }, { k: 'Load', v: t.tq + ' qtl · ' + t.tbags + ' bags' }, { k: 'Distance', v: t.plan + ' km planned · ' + t.gps + ' km GPS trace' });
        const h = (Date.parse(t.ack.replace(' ', 'T')) - Date.parse(t.gen.replace(' ', 'T'))) / 36e5; const f0 = ff[0] || [];
        steps = [['Procured', f0[2]], ['Gunny lorry allocated', f0[10]], ['Truck chit generated', t.gen], ['Mill acknowledged (' + fmtN(h, 1) + ' h)', t.ack, h > ADB.params.ackHours], ['Trip closed at geo-fence', t.close], ['FTO generated for the farmers', f0[9]]].filter(function (x) { return x[1]; }).map(function (x) { return { label: x[0], meta: x[1], cls: 'step ' + (x[2] ? 'bad' : 'done') }; });
        tbl = this.table('FTOs on this truck chit', 'Farmer names are masked', ['FTO', 'Farmer', 'Procured (qtl)', 'Bags', 'Amount (₹)', 'FTO date', 'Pay status'], ff.map(function (f) { return { name: f[0], cells: [T(f[1]), C(fmtN(f[4], 1)), C(fmtN(f[6])), C(fmtN(f[7])), T(f[9]), T(f[8] || '—')] }; }), null, '', 'fto-' + t.id); tbl.count = fmtN(ff.length) + ' FTOs'; } }
    if (r.feed === 'MILL') { const m = ADB_MILL[r.mill]; if (m) { facts.push({ k: 'Mill', v: adbMill(r.mill) }, { k: 'First paddy acknowledged', v: m[2] }, { k: 'First CMR delivery', v: m[3] }, { k: 'Gap', v: fmtN(m[4], 1) + ' days' }); if (m[5] != null) { const due = m[5] * 0.67; facts.push({ k: 'Paddy acknowledged', v: fmtN(m[5], 1) + ' MT' }, { k: 'CMR delivered', v: fmtN(m[6], 1) + ' MT' }, { k: 'CMR due at 67% out-turn', v: fmtN(due, 1) + ' MT · balance ' + fmtN(Math.max(0, due - m[6]), 1) + ' MT' }); } } }
    if (r.feed === 'STORAGE') { const g = ADB_GD[r.godown]; if (g) facts.push({ k: 'Godown', v: g.name + ' · ' + g.mandal }, { k: 'Hired capacity', v: fmtN(g.cap) + ' MT' }, { k: 'Stock held', v: fmtN(g.bal, 1) + ' MT' }, { k: 'Utilisation', v: fmtN(g.util * 100, 1) + '% (rule: under 50%)' }, { k: 'Unused hired space', v: fmtN(Math.round(g.cap - g.bal)) + ' MT' }); }
    if (c) facts.push({ k: 'Could be innocent if', v: c.innocent || '—' }, { k: 'Recommended action', v: c.action || '—' });
    this.setState({ rxRec: { back: this.state.rxRec || null, rec1: true, title: r.id + ' · ' + (c ? c.subName : r.t), sub: 'Feed record · ' + (ADB_FEEDN[r.feed] || r.feed) + ' · ' + r.mandal + ', ' + r.dn, facts: facts, steps: steps, tbl: tbl, links: [] } });
  }
  /* ---------- Ask more: open a new Intelligence chat seeded with what the person was looking at ---------- */
  askMore(ctx) {
    const self = this; const i = ctx.incId ? TX[ctx.incId] : null;
    const mo = ctx.media ? this.mediaObj(ctx.media) : null;
    const ly = i && ctx.layer ? this.incLayers(i)[ctx.layer - 1] : mo && ctx.layer ? this.mediaLayers(ctx.media)[ctx.layer - 1] : null;
    const about = i ? i.id + ' · ' + (ly ? ly.title.toLowerCase() : i.title) : mo ? (mo.k === 'clip' ? 'the clipping "' + mo.title + '"' : 'the video "' + mo.title + '"') + (ly ? ' · ' + ly.title.toLowerCase() : '') : ctx.title;
    const prompt = 'Ask more about this: ' + about;
    const follow = mo ? ['Do the records support this report?', 'What is it impacting?', 'What should we do?', 'Other coverage on this topic', 'Show the source'] : i ? ['What is this impacting?', 'Why was it flagged?', 'What should we do, and who owns it?', 'Show the records behind it', 'Is it happening elsewhere?', 'Could it be innocent?', 'Which audit finding does it relate to?'] : ['Why?', 'What should we do?', 'Which incidents are behind this?', 'Show the records'].concat(ctx.dn ? ['How is ' + ctx.dn + ' doing overall?'] : []);
    self._aiFrom = { module: this.state.module, stage: this.state.stage, path: (this.state.path || []).slice() }; self._ctxView = ctx.view || null;
    const keep = { media: ctx.media || null, title: mo ? mo.title : ctx.title || about, dn: ctx.dn || (i ? i.dn : mo ? mo.dn : null), incId: ctx.incId || null, layer: ctx.layer || null, recKey: ctx.recKey || null, why: ctx.why || [], action: ctx.action || '', facts: (ctx.facts || []).slice(0, 10), incIds: ctx.incIds || [], hint: ctx.hint || null, sugs: follow, recSugs: ctx.recSugs || null };
    const reply = this.ctxBrief(keep);
    this.setState({ module: 'intel', stage: 'all', pivot: false, intelTab: 'main', intelOpen: null, rxRec: null, kpiOpen: null, act: null, path: keep.dn ? [keep.dn] : [], intelCtx: keep, intelInput: '', intelMsgs: [{ me: true, text: prompt }, reply] });
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
  }
  /* incidents behind a chat topic: every why line plus the title, merged, most urgent first */
  ctxIncs(x) {
    const self = this; const h = x.hint || { dn: x.dn, key: x.recKey }; const seen = {}; const out = [];
    [x.title].concat(x.why || []).forEach(function (t) { self.whyIncs(String(t || ''), h).forEach(function (id) { if (!seen[id]) { seen[id] = 1; out.push(id); } }); });
    const order = { P1: 0, P2: 1, P3: 2, P4: 3 }; return out.filter(function (id) { return TX[id]; }).sort(function (a, b) { return order[TX[a].prio] - order[TX[b].prio] || TX[b].ageH - TX[a].ageH; });
  }
  /* the Act context for whatever the chat is about */
  ctxActCtx(x) {
    const i = x.incId ? TX[x.incId] : null;
    if (x.media) { const m = this.mediaObj(x.media); if (m) { const chk = mediaCheck(mediaTopic(m.text), m.dn, m.mandal); return { name: (m.k === 'clip' ? m.id + ' · ' : 'YouTube · ') + m.title, where: (m.paper || '') + (m.dn ? ' · ' + m.dn : ''), dn: m.dn, facts: [{ k: m.k === 'clip' ? 'Clipping' : 'Video', v: m.id }, { k: 'Sentiment (AI read)', v: m.sent }, { k: 'Records check', v: chk.verdict }], rec: { sugs: mediaSugs(m, chk) } }; } }
    if (i) return { name: i.id + ' · ' + i.title, where: i.mandal + ', ' + i.dn, dn: i.dn, facts: [{ k: 'Incident', v: i.id }, { k: 'Severity', v: SEV[i.prio] }, { k: 'Status', v: i.status }, { k: 'Age', v: i.ageH + ' h' }, { k: 'Stage', v: STAGE_NAME[i.stage] }] };
    if (x.recSugs && x.recSugs.length) return { name: x.title, where: 'Intelligence · ' + (x.dn || 'Andhra Pradesh'), dn: x.dn, facts: x.facts || [], rec: { sugs: x.recSugs } };
    return { name: x.title, where: x.dn || 'Andhra Pradesh', dn: x.dn, facts: (x.facts || []).concat((x.why || []).slice(0, 2).map(function (w) { return { k: 'Why', v: w }; })) };
  }
  /* first answer in a new chat: details, suggested actions, and options to act */
  ctxBrief(x) {
    const self = this; const i = x.incId ? TX[x.incId] : null; const out = [];
    const mo = x.media ? this.mediaObj(x.media) : null;
    if (mo) { const L = this.mediaLayers(x.media); out.push((mo.k === 'clip' ? mo.id + ' · ' : 'YouTube · ') + mo.title); out.push((mo.paper || '') + (mo.dn ? ' · ' + (mo.mandal ? mo.mandal + ', ' : '') + mo.dn : '') + ' · sentiment ' + mo.sent + ' (AI read)');
      const rows = x.layer ? L[x.layer - 1].rows : [].concat(L[0].rows.filter(function (r) { return /AI summary|Sentiment/.test(r.k); }), L[3].rows, L[4].rows.filter(function (r) { return /Reach|coverage|Decision|YouTube/.test(r.k); }));
      out.push(''); out.push(x.layer ? 'Layer ' + x.layer + ' · ' + L[x.layer - 1].title + ':' : 'Details:'); rows.slice(0, 9).forEach(function (r) { out.push('• ' + r.k + ': ' + r.v); }); }
    else if (i) { const L = this.incLayers(i); const c = incCat(i);
      out.push(i.id + ' · ' + i.title); out.push(i.mandal + ', ' + i.dn + ' · ' + SEV[i.prio] + ' · ' + i.status + ' · ' + i.ageH + ' h old' + (c ? ' · catalogue rule ' + c.id : ''));
      const pickRows = x.layer ? L[x.layer - 1].rows : [].concat(L[0].rows.filter(function (r) { return r.k === 'AI summary'; }), L[2].rows.filter(function (r) { return /Catalogue rule|Could be innocent/.test(r.k); }), L[4].rows.filter(function (r) { return /^Measure|Same incident type|Other incidents/.test(r.k); }));
      out.push(''); out.push(x.layer ? 'Layer ' + x.layer + ' · ' + L[x.layer - 1].title + ':' : 'Details:'); pickRows.slice(0, 9).forEach(function (r) { out.push('• ' + r.k + ': ' + r.v); });
      if (x.layer && L[x.layer - 1].hasNote) out.push('• ' + L[x.layer - 1].note);
    } else {
      out.push(x.title); if (x.facts && x.facts.length) { out.push(''); out.push('Details:'); x.facts.slice(0, 8).forEach(function (f) { out.push('• ' + f.k + ': ' + f.v); }); }
      if (x.why && x.why.length) { out.push(''); out.push('Why:'); x.why.slice(0, 5).forEach(function (w) { out.push('• ' + w); }); }
      const ids = x.incIds && x.incIds.length ? x.incIds : this.ctxIncs(x); if (ids.length) { out.push(''); out.push('Incidents behind it: ' + ids.slice(0, 5).join(', ') + (ids.length > 5 ? ' and ' + (ids.length - 5) + ' more' : '')); }
    }
    const o = this.chatOpts(x); out.push(''); out.push('Suggested actions:'); o.res.sugs.slice(0, 3).forEach(function (g, k) { out.push((k + 1) + '. ' + g.act + ' · ' + g.owner + (g.by && g.by !== '—' ? ', ' + g.by : '')); });
    out.push(''); out.push('Choose an option below, or ask a follow-up.');
    return { me: false, text: out.join('\n'), opts: o.opts, meta: 'Based on: the records on this dashboard · ' + this.ctxInfo().updated };
  }
  chatOpts(x) {
    const self = this; const ac = this.ctxActCtx(x); const res = actSuggest(ac); const i = x.incId ? TX[x.incId] : null;
    const take = res.sugs.slice(0, 2).filter(function (g) { return g.owner !== '—'; }).map(function (g, k) { return { label: (k === 0 ? 'Take suggested action' : 'Take action 2') + ' · assign to ' + g.owner, cls: 'btn sm' + (k === 0 ? ' blue' : ''), go: function () { self.chatDecide(ac, res, 'Decided', g); } }; });
    const dm = !x.dn && !i ? 'District Managers concerned' : res.dm; const isDMv = this.state.role === 'dm';
    const opts = take.filter(function (o) { return !isDMv || !/District Manager/.test(o.label); }).concat(isDMv ? [] : [{ label: 'Escalate to ' + dm, cls: 'btn sm', go: function () { self.chatDecide(ac, res, 'Escalated to ' + dm, res.sugs[0]); } }]).concat([ { label: 'Escalate to Head office', cls: 'btn sm', go: function () { self.chatDecide(ac, res, 'Escalated to Head office', res.sugs[0]); } }, { label: 'Remind me later', cls: 'btn sm', go: function () { self.chatDecide(ac, res, 'Remind me later', res.sugs[0]); } }, { label: 'More options (remarks, priority, due date)…', cls: 'btn sm', go: function () { self.openAct(ac); } }])
      .concat(i ? [{ label: 'Open the case file', cls: 'lnkb', go: function () { self.setState({ rxRec: self.incRec(i) }); } }] : self._ctxView ? [{ label: 'View the records', cls: 'lnkb', go: self._ctxView }] : []);
    const mo = x.media ? this.mediaObj(x.media) : null;
    if (mo && mo.k === 'clip') { const c = mo.c; const pre = []; if (!this.pwAdv()[c.id]) pre.push({ label: 'Raise advisory now', cls: 'btn sm blue', go: function () { const to = 'District Collector, ' + c.district; self.pwRaiseAdv(c, 'Advisory on press report: "' + c.head + '" (' + c.paper + ', ' + pwDay(c.at) + '). Please check, act where needed and report back within 24 hours.', 'Information & PR cell', to); self.setState({ rxRec: null, intelMsgs: (self.state.intelMsgs || []).concat([{ me: true, text: 'Raise advisory now' }, { me: false, text: 'Advisory recorded against ' + c.id + ' and sent to ' + to + '. It counts in Advisories raised on Press Watch and is in the decision log.', opts: [{ label: 'Open the clipping', cls: 'lnkb', go: function () { self.pwOpen(c); } }] }]).slice(-14) }); } }); if (!this.pwRej()[c.id]) pre.push({ label: 'Issue rejoinder…', cls: 'btn sm', go: function () { self.pwOpen(c); self.setState({ rxRec: Object.assign({}, self.state.rxRec, { rejForm: true, rejKind: 'rej', rejText: self.state.rxRec.rejDraft || '', rejBy: 'Information & PR cell' }) }); } }); pre.push({ label: 'Open the clipping', cls: 'lnkb', go: function () { self.pwOpen(c); } }); opts.unshift.apply(opts, pre.slice(0, 2)); opts.push(pre[pre.length - 1]); }
    if (mo && mo.k === 'yt') opts.push({ label: 'Open the video record', cls: 'lnkb', go: function () { self.ytOpen(mo.v); } });
    return { res: res, opts: opts };
  }
  chatDecide(ac, res, decision, sug) {
    const self = this; const log = (this.state.actLog || readActLog()).slice();
    const id = 'ACT-' + pad((log.reduce(function (m, x) { const k = parseInt(String(x.id).replace(/\D/g, ''), 10) || 0; return Math.max(m, k); }, 0)) + 1, 4);
    const inc = (String(ac.name).match(/INC-[A-Z]+-\d{4}(?!\d)/) || [])[0];
    const e = { byRole: this.state.role, stage: inc && TX[inc] ? TX[inc].stage : 'all', mod: 'Intelligence', id: id, at: Date.now(), rec: ac.name, kind: res.kind, where: ac.where || '', dn: res.dn || ac.dn || '', decision: decision, action: sug ? sug.act : '', owner: decision === 'Decided' ? (sug ? sug.owner : '') : decision === 'Remind me later' ? 'You' : decision.replace('Escalated to ', ''), by: sug ? sug.by : '', status: 'Open', remarks: 'From the Intelligence chat', prio: '', cc: '', facts: (ac.facts || []).slice(0, 8).map(function (f) { return { k: String(f.k), v: String(f.v) }; }) };
    log.unshift(e); saveActLog(log);
    const txt = id + ' · ' + decision + (sug ? '\n' + sug.act : '') + '\n' + (decision === 'Decided' ? 'Assigned to ' + e.owner + (e.by && e.by !== '—' ? ' · ' + e.by : '') + '.' : decision === 'Remind me later' ? 'Kept as a reminder.' : 'Sent with the record and the suggested action so they can decide.') + ' It is in the decision log.';
    const msgs = (this.state.intelMsgs || []).concat([{ me: true, text: decision === 'Decided' ? 'Take this action' : decision }, { me: false, text: txt, opts: [{ label: 'Undo', cls: 'btn sm', go: function () { self.undoAct(id); self.setState({ intelMsgs: (self.state.intelMsgs || []).concat([{ me: false, text: id + ' undone. Nothing is recorded for it now.' }]) }); } }, { label: 'Open the decision log', cls: 'lnkb', go: function () { self.setState({ intelTab: 'log' }); } }] }]).slice(-14);
    this.setState({ actLog: log, intelMsgs: msgs });
  }
  answerCtx(q, x) {
    const self = this; const ql = q.toLowerCase(); const has = function (w) { return w.some(function (z) { return new RegExp('(^|[^a-z])' + z.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(ql); }); };
    const msg = function (text, label, act) { return { text: text, bars: [], actLabel: label || '', act: act || null }; };
    const i = x.incId ? TX[x.incId] : null;
    if (x.media && this.mediaObj(x.media)) { const L = this.mediaLayers(x.media); const fmt = function (l) { return l.map(function (r) { return '• ' + r.k + ': ' + r.v; }).join('\n'); };
      if (has(['support', 'true', 'fact', 'record', 'check', 'correct', 'verify'])) return Object.assign(msg('What the records say:\n' + fmt(L[3].rows)), L[3].rows[0].links.length ? { actLabel: 'the linked incident', act: L[3].rows[0].links[0].go } : {});
      if (has(['impact', 'affect', 'reach'])) return msg(fmt(L[4].rows));
      if (has(['other', 'coverage', 'similar', 'more'])) return msg(fmt(L[4].rows.filter(function (r) { return /coverage|YouTube|Reach/.test(r.k); })));
      if (has(['source', 'text', 'original', 'show'])) return msg(fmt(L[1].rows));
      if (has(['do', 'action', 'next', 'recommend', 'rejoinder', 'advisory'])) { const o = this.chatOpts(x); return Object.assign(msg(fmt(L[5].rows)), { opts: o.opts }); }
      if (has(['why', 'flag', 'topic'])) return msg(fmt(L[2].rows)); }
    if (i) { const c = incCat(i); const ly = this.incLayers(i); const rows = function (n) { return ly[n - 1].rows; }; const fmt = function (l) { return l.map(function (r) { return '• ' + r.k + ': ' + r.v; }).join('\n'); };
      const openI = function () { self.setState({ rxRec: self.incRec(i) }); };
      if (has(['impact', 'affect', 'effect', 'consequence', 'knock'])) return msg('What ' + i.id + ' is impacting:\n' + fmt(rows(5).slice(0, 9)), i.id + ' case file', openI);
      if (has(['innocent', 'false', 'explain', 'genuine', 'legit'])) return msg(c ? 'It could be innocent if: ' + (c.innocent || 'the catalogue gives no innocent explanation.') : 'This incident type has no catalogue rule, so no innocent explanation is recorded.', i.id + ' case file', openI);
      if (has(['audit', 'cag', 'risk'])) { const a = audFor(c); return msg((c && c.riskTitle ? 'Risk register ' + c.risk + ': ' + c.riskTitle + '\n' : '') + (a.length ? a.map(function (z) { return 'CAG finding ' + z.n + ' (' + z.cat + '): ' + z.desc; }).join('\n') : 'No CAG audit finding in the project file matches this rule closely.')); }
      if (has(['elsewhere', 'other', 'similar', 'repeat', 'how many', 'pattern', 'same'])) { const r = rows(5).filter(function (z) { return /Same incident type|Other incidents/.test(z.k); }); return msg(fmt(r), r[0] && r[0].links[0] ? 'linked incidents' : '', r[0] && r[0].links[0] ? r[0].links[0].go : null); }
      if (has(['record', 'evidence', 'proof', 'data', 'show', 'source', 'feed'])) return msg('Records behind ' + i.id + ':\n' + fmt(rows(2)) + (ly[3].rows.length ? '\nFeed: ' + ly[3].rows.slice(0, 2).map(function (r) { return r.k + ' ' + r.v; }).join(' · ') : ''), i.id + ' case file', openI);
      if (has(['do', 'action', 'next', 'recommend', 'fix', 'resolve', 'own', 'who', 'responsible'])) { const o = this.chatOpts(x); return Object.assign(msg(fmt(rows(6)) + '\n\nSuggested actions:\n' + o.res.sugs.slice(0, 3).map(function (g, k) { return (k + 1) + '. ' + g.act + ' · ' + g.owner; }).join('\n')), { opts: o.opts }); }
      if (has(['why', 'flag', 'rule', 'cause', 'reason', 'trigger'])) return msg('Why ' + i.id + ' was flagged:\n' + fmt(rows(3)) + '\n• Severity: ' + i.why, i.id + ' case file', openI);
      if (has(['money', 'exposure', 'cost', 'farmer', 'loss', '₹'])) return msg(fmt(rows(5).filter(function (r) { return /Measure|Exposure|What it is catching/.test(r.k); })));
    } else {
      if (has(['incident', 'behind', 'cause'])) { const ids = x.incIds && x.incIds.length ? x.incIds : this.ctxIncs(x); if (ids.length) { const l = ids.map(function (id) { return TX[id]; }).filter(Boolean); return msg(fmtN(l.length) + ' incident' + (l.length === 1 ? '' : 's') + ' behind this:\n' + l.slice(0, 8).map(function (z) { return '• ' + z.id + ' · ' + z.title + ' · ' + z.mandal + ', ' + z.dn + ' · ' + SEV[z.prio]; }).join('\n'), 'the first incident', function () { self.setState({ rxRec: self.incRec(l[0]) }); }); } return msg('No open incident matches this directly.'); }
      if (has(['why', 'reason'])) return msg(x.why && x.why.length ? x.why.map(function (w) { return '• ' + w; }).join('\n') : 'No reasons were attached to this item.');
      if (has(['do', 'action', 'next', 'recommend'])) { const o = this.chatOpts(x); return Object.assign(msg((x.action ? x.action + '\n\n' : '') + 'Suggested actions:\n' + o.res.sugs.slice(0, 3).map(function (g, k) { return (k + 1) + '. ' + g.act + ' · ' + g.owner; }).join('\n')), { opts: o.opts }); }
      if (has(['record', 'show', 'data']) && self._ctxView) return msg('Opening the records behind ' + x.title + '.', 'the records', self._ctxView);
    }
    return null;
  }
  /* incidents relevant to one "why" line */
  whyIncs(line, hint) {
    hint = hint || {}; const explicit = (line.match(/INC-[A-Z]{2,4}-\d{4}(?!\d)/g) || []).filter(function (id) { return TX[id]; }); if (explicit.length) return explicit; if (hint.incId && TX[hint.incId]) return [hint.incId];
    const K = { cmr: 'cmr', stor: 'stor', s2: 's2', proc: 'proc', prep: 'proc', pay: 'pay', fto: 'pay', gps: 'gps', inc: 'p1' }; const mode = K[hint.key] || null;
    const kw = /gunn/i.test(line) ? /gunn/i : /truck chit/i.test(line) ? /truck chit/i : /\bGPS\b|off route|route/i.test(line) ? /GPS|route|moving away|reached/i : /payment|FTO|paid/i.test(line) ? /pay|FTO|PFMS|bank/i : /godown|utilis/i.test(line) ? /godown|storage|compartment|stack|FIFO|fumig/i : /\bCMR\b|mill/i.test(line) ? /CMR|mill/i : null;
    if (!mode && !kw && !hint.dn) return [];
    if (/^(Sentiment|Cameras exist|Offline cameras)/.test(line) || hint.key === 'cctv' || hint.key === 'press' || hint.key === 'ytneg') return [];
    let dns = DN_BY_LEN.filter(function (d) { return line.indexOf(d) >= 0; }); if (!dns.length && hint.dn) dns = [hint.dn]; if (!dns.length && hint.where) dns = DN_BY_LEN.filter(function (d) { return hint.where.join(' ').indexOf(d) >= 0; }); if (!dns.length) dns = D.map(function (d) { return d.name; });
    const q = (line.match(/"([^"]{8,})"/) || [])[1];
    let l = []; dns.forEach(function (d) { l = l.concat(incidentsOf(d)); });
    l = l.filter(function (x) { if (q) return x.title === q; if (mode === 'p1') return x.prio === 'P1'; if (mode === 'pay') return /pay|FTO|PFMS|bank/i.test(x.title); if (mode === 'gps') return x.src === 'GPS'; if (mode && x.stage !== mode) return false; return !kw || kw.test(x.title); });
    const order = { P1: 0, P2: 1, P3: 2, P4: 3 }; l.sort(function (a, b) { return order[a.prio] - order[b.prio] || b.ageH - a.ageH; });
    return l.map(function (x) { return x.id; });
  }
  whyItems(lines, hint) {
    const self = this; hint = hint || {};
    return (lines || []).map(function (t) { if (PRESS_WHY[t]) { const ids = PRESS_WHY[t]; const yt = /^YT:/.test(ids[0] || ''); const go = function () { self.setState({ act: null }); if (yt) { const vs = YT_AP.filter(function (v) { return ids.indexOf('YT:' + v.id) >= 0; }); if (vs[0]) self.ytOpen(vs[0]); } else { const cl = pressClips().filter(function (c) { return ids.indexOf(c.id) >= 0; }); self.pwList('Clippings behind this reason', cl); } }; return { t: t, incs: [{ id: (yt ? 'Open the video' : 'Open ' + ids.length + ' clipping' + (ids.length === 1 ? '' : 's')), cls: 'inclink lk', go: go }], hasInc: true, incN: yt ? 'YouTube:' : 'Press:', ask: function () { self.askMore({ title: 'Why: ' + t, dn: hint.dn || null, why: [t], action: hint.action || '', facts: hint.facts || [], hint: { dn: hint.dn, key: hint.key, where: hint.where }, recKey: hint.key || null }); } }; } const ids = self.whyIncs(t, hint); const l = ids.slice(0, 3).map(function (id) { const x = TX[id]; return { id: id, cls: 'inclink' + (x.prio === 'P1' ? ' p1' : ''), go: function () { self.setState({ act: null, rxRec: self.state.rxRec ? self.rxBack(self.incRec(x)) : self.incRec(x) }); } }; });
      if (ids.length > 3) l.push({ id: '+' + (ids.length - 3) + ' more', cls: 'inclink more', go: function () { const L = ids.map(function (id) { return TX[id]; }); self.setState({ act: null }); self.tablePopup('Incidents behind: ' + t.slice(0, 80), fmtN(L.length) + ' incidents · priority first', ['Incident ID', 'Incident', 'Severity', 'Mandal', 'District', 'Status', 'Age'], L.map(function (x) { const T = function (y) { return Object.assign(C(y), { cls: 'txt' }); }; return { name: x.id, cells: [T(x.title), T(SEV[x.prio]), T(x.mandal), T(x.dn), T(x.status), C(x.ageH + ' h')], drill: function () { self.setState({ rxRec: self.rxBack(self.incRec(x)) }); } }; }), null, 'incidents'); } });
      return { t: t, incs: l, hasInc: l.length > 0, incN: ids.length ? fmtN(ids.length) + ' incident' + (ids.length === 1 ? '' : 's') + ':' : '', ask: function () { self.askMore({ title: 'Why: ' + t, dn: hint.dn || null, why: [t], action: hint.action || '', facts: hint.facts || [], incIds: ids, hint: { dn: hint.dn, key: hint.key, where: hint.where }, recKey: hint.key || null }); } }; });
  }
  /* ---------- Media case file, layer by layer (clipping or YouTube video) ---------- */
  mediaObj(ref) {
    if (ref.k === 'clip') { const c = pressClips().filter(function (x) { return x.id === ref.id; })[0]; if (!c) return null; return { k: 'clip', id: c.id, c: c, title: c.head, dn: c.district, mandal: c.mandal, sent: c.sent, paper: c.paper, text: c.head + ' ' + c.text }; }
    const v = YT_AP.filter(function (x) { return x.id === ref.id; })[0]; if (!v) return null; return { k: 'yt', id: v.id, v: v, title: v.t, dn: v.dist || null, mandal: null, sent: v.s, paper: v.ch, text: v.t + ' ' + (v.d || '') };
  }
  mediaLayers(ref) {
    const self = this; const s = this.state; const m = this.mediaObj(ref); if (!m) return [];
    const R = function (k, v, links) { return { k: k, v: v, links: links || [], hasLinks: !!(links && links.length) }; };
    const lk = function (label, fn) { return [{ id: label, cls: 'inclink lk', go: fn }]; };
    const incL = function (l) { const out = l.slice(0, 4).map(function (x) { return { id: x.id, cls: 'inclink' + (x.prio === 'P1' ? ' p1' : ''), go: function () { self.setState({ rxRec: self.rxBack(self.incRec(x)) }); } }; }); if (l.length > 4) out.push({ id: '+' + (l.length - 4) + ' more', cls: 'inclink more', go: function () { self.tablePopup('Incidents on this topic', fmtN(l.length) + ' open incidents', ['Incident ID', 'Incident', 'Severity', 'Mandal', 'District', 'Status', 'Age'], l.map(function (x) { const T = function (y) { return Object.assign(C(y), { cls: 'txt' }); }; return { name: x.id, cells: [T(x.title), T(SEV[x.prio]), T(x.mandal), T(x.dn), T(x.status), C(x.ageH + ' h')], drill: function () { self.setState({ rxRec: self.rxBack(self.incRec(x)) }); } }; }), null, 'incidents'); } }); return out; };
    const t = mediaTopic(m.text); const chk = mediaCheck(t, m.dn, m.mandal); const sugs = mediaSugs(m, chk);
    if (m.sent !== 'Bad') { const n = chk.mandal.length || chk.district.length; chk.verdict = 'Not a complaint, so there is nothing to confirm. Related records: ' + (n ? n + ' open incident' + (n === 1 ? '' : 's') + ' on ' + MT[t].name + ' in ' + (chk.mandal.length ? m.mandal : m.dn || 'the state') + '.' : 'no open incident on ' + MT[t].name + (m.dn ? ' in ' + m.dn : '') + '.'); chk.level = 'info'; }
    let L1, L2, L5 = [];
    if (m.k === 'clip') { const c = m.c; const AV = this.pwAdv()[c.id], RJ = this.pwRej()[c.id];
      L1 = [R('Headline', c.head), R('Newspaper', c.paper + ' (' + c.lang + ') · ' + c.section + ', page ' + c.page + ' · ' + pwDay(c.at)), R('Places named (AI read)', c.locs.join(', ')), R('Sentiment (AI read)', c.sent + ' · a read of the tone, not a verified finding'), R('AI summary', c.ai), R('Department (AI tag)', c.dept)];
      L2 = [R('Source text', c.text), R('How it was clipped', c.hand ? 'Cut by hand' : 'Auto-clipped'), R('Clipping ID', c.id)];
      const same = pressClips().filter(function (x) { return x.id !== c.id && x.district === c.district && MT[t].re.test(x.head + ' ' + x.text); });
      L5.push(R('Reach', (c.section === 'Main edition' ? 'Main edition' : c.section) + ', page ' + c.page + ' of a ' + c.lang + ' daily' + (c.page <= 3 ? ' · front pages are read most' : '')));
      L5.push(R('More coverage on this topic in ' + c.district, same.length ? fmtN(same.length) + ' other clipping' + (same.length === 1 ? '' : 's') : 'None', same.length ? lk('List', function () { self.pwList('Coverage on ' + MT[t].name + ' · ' + c.district, same); }) : []));
      L5.push(R('Advisory', pwAdvTxt(AV))); L5.push(R('Rejoinder', pwRejTxt(RJ)));
    } else { const v = m.v; const mc = ytMockComments(v);
      L1 = [R('Title', v.t), R('Channel', v.ch + ' · ' + pwDay(new Date(v.at))), R('Sentiment (AI read of the title)', v.s), R('District named (AI read)', v.dist || 'None identified'), R('Views · likes · comments', fmtN(v.v) + ' · ' + fmtN(v.l) + ' · ' + fmtN(v.c))];
      L2 = [R('Description', (v.d || '—').slice(0, 400) + ((v.d || '').length > 400 ? '…' : '')), R('Comments', mc ? mc.summary + ' (mock data)' : 'No comments yet'), R('Link', v.url, lk('Open on YouTube', function () { try { window.open(v.url, '_blank', 'noopener'); } catch (e) {} }))];
      L5.push(R('Reach', fmtN(v.v) + ' views on ' + v.ch));
    }
    const L3 = [R('Topic (AI read)', MT[t].name), R('Needs action', m.k === 'clip' ? (m.c.needs ? 'Yes · read as Bad and reports something a department can check' : 'No') : (m.sent === 'Bad' ? 'Read as Bad; check before acting' : 'No'))];
    const L4 = [R('Verdict', chk.verdict, chk.mandal.length ? incL(chk.mandal) : chk.district.length ? incL(chk.district) : [])].concat(topicMeasures(t, m.dn).map(function (x) { return R('Measure · ' + x[0], x[1]); }));
    const yv = m.k === 'clip' ? YT_AP.filter(function (v) { return MT[t].re.test(v.t + ' ' + (v.d || '')); }) : pressClips().filter(function (x) { return (!m.dn || x.district === m.dn) && MT[t].re.test(x.head + ' ' + x.text); });
    if (m.k === 'clip') L5.push(R('YouTube on this topic', yv.length ? fmtN(yv.length) + ' video' + (yv.length === 1 ? '' : 's') : 'None', yv.length ? lk('Open the first', function () { self.ytOpen(yv[0]); }) : []));
    else L5.push(R('Newspaper coverage on this topic' + (m.dn ? ' in ' + m.dn : ''), yv.length ? fmtN(yv.length) + ' clipping' + (yv.length === 1 ? '' : 's') : 'None', yv.length ? lk('List', function () { self.pwList('Coverage on ' + MT[t].name, yv); }) : []));
    let recs = []; try { self._buildingAi = true; recs = self.buildIntel(m.dn ? [m.dn] : []).intel.recs.filter(function (r) { return MT[t].keys.indexOf(r.key) >= 0; }); } catch (e) { recs = []; } self._buildingAi = false;
    recs.forEach(function (r) { L5.push(R('Decision it feeds', r.title + ' (' + r.area + ')', lk('Open in Intelligence', function () { self.askMore({ title: r.title, dn: m.dn, recKey: r.key, why: r.why.map(function (w) { return w.t; }), action: r.act, recSugs: r.sugs }); }))); });
    if (!recs.length) L5.push(R('Decision it feeds', 'No open Intelligence recommendation on ' + MT[t].name + (m.dn ? ' in ' + m.dn : '') + ' right now.'));
    L5.push(R('Measures it puts in the public eye', topicMeasures(t, m.dn).map(function (x) { return x[0] + ' ' + x[1]; }).join(' · ')));
    const L6 = sugs.map(function (g, k) { return R((k === 0 ? 'Suggested' : 'Alternative') + ' · ' + g.owner + (g.by && g.by !== '—' ? ', ' + g.by : ''), g.act); });
    const defs = [[1, m.k === 'clip' ? 'What was reported' : 'What the video says', m.k === 'clip' ? m.paper : m.paper, L1, ''], [2, 'The source', m.k === 'clip' ? 'text as printed' : 'description and comments', L2, m.k === 'yt' ? 'Comment figures are mock data until comment text is available.' : ''], [3, 'Why it was flagged', MT[t].name, L3, ''], [4, 'What the records say', chk.level === 'support' ? 'supported' : chk.level === 'partly' ? 'partly supported' : chk.level === 'info' ? 'related records' : 'not supported', L4, 'Checked against open incidents and district figures on this dashboard; press items are sample data.'], [5, 'What it is impacting', 'reach, coverage, decisions, measures', L5, ''], [6, 'What to do', sugs[0].owner, L6, '']];
    const LO = s.lyrOpen || {};
    return defs.map(function (d) { const key = m.id + '|' + d[0]; const op = key in LO ? LO[key] : (d[0] === 4 || d[0] === 5); return { n: d[0], title: d[1], sub: d[2], rows: d[3], hasRows: d[3].length > 0, note: d[4], hasNote: !!d[4], open: op, arrow: op ? '▾' : '▸', cls: 'lyr' + (op ? ' on' : ''), toggle: function () { const o = Object.assign({}, self.state.lyrOpen || {}); o[key] = !op; self.setState({ lyrOpen: o }); }, ask: function () { self.askMore({ media: ref, layer: d[0] }); } }; });
  }
  /* ---------- District Manager inbox: what has been sent to this district's DM ---------- */
  inboxItems(dn) {
    const self = this; const s = this.state; const log = s.actLog || readActLog(); const rd = s.inboxRead || {}; const out = [];
    const toDM = function (e) { const t = (e.decision || '') + ' | ' + (e.owner || '') + ' | ' + (e.cc || ''); return /District Manager/i.test(t) && (t.indexOf(dn) >= 0 || /District Managers concerned|District Managers/i.test(t)); };
    log.forEach(function (e) {
      if (e.byRole === 'dm') return; const inD = e.dn === dn || (e.where || '').indexOf(dn) >= 0 || (e.rec || '').indexOf(dn) >= 0 || /District Managers concerned/.test(e.decision || ''); if (!inD) return;
      let kind = null;
      if (/^Escalated to District Manager/.test(e.decision || '')) kind = 'Escalation';
      else if (e.decision === 'Decided' && /District Manager/.test(e.owner || '')) kind = 'Assigned to you';
      else if (e.decision === 'Advisory raised') kind = 'Press advisory';
      else if (e.decision === 'Rejoinder issued') kind = 'Rejoinder (for information)';
      else if (/District Manager/.test(e.cc || '')) kind = 'Copied to you';
      else if (toDM(e)) kind = 'Assigned to you';
      if (!kind) return;
      const inc = (String(e.rec).match(/INC-[A-Z]+-\d{4}(?!\d)/) || [])[0];
      out.push({ key: e.id, src: 'log', e: e, kind: kind, from: kind === 'Press advisory' || /Rejoinder/.test(kind) ? 'Information & PR cell' : 'Commissioner', at: e.at, subject: e.rec, action: e.action || '', remarks: e.remarks || '', prio: e.prio || '', due: (e.by && e.by !== '—' ? (/^Due /.test(e.by) ? e.by : 'Due: ' + e.by) : ''), status: e.dmStatus || (e.status === 'Done' ? 'Done' : 'New'), incId: inc && TX[inc] ? inc : null, clipId: e.clipId || null, replies: e.replies || [], read: !!(e.dmRead || rd[e.id]) });
    });
    incidentsOf(dn).filter(function (i) { return i.status === 'Escalated' && i.escTo === 'District office'; }).forEach(function (i) {
      const st = (s.inboxSys || {})[i.id] || {}; out.push({ key: 'SYS-' + i.id, src: 'sys', kind: 'Escalated incident', from: 'Incident engine', at: Date.now() - i.ageH * 3600000, subject: i.id + ' · ' + i.title, action: 'Escalated to the district office: ' + i.why, remarks: '', prio: SEV[i.prio], due: 'Respond within ' + (SEV_RESP_H[i.prio] || 72) + ' h', status: st.status || 'New', incId: i.id, clipId: null, replies: st.replies || [], read: !!rd['SYS-' + i.id], i: i });
    });
    return out.sort(function (a, b) { return (a.read === b.read ? 0 : a.read ? 1 : -1) || b.at - a.at; });
  }
  inboxSet(it, patch) {
    if (it.src === 'log') { const l = (this.state.actLog || readActLog()).map(function (x) { return x.id === it.key ? Object.assign({}, x, patch) : x; }); saveActLog(l); this.setState({ actLog: l }); }
    else { const m = Object.assign({}, this.state.inboxSys || {}); m[it.i.id] = Object.assign({}, m[it.i.id] || {}, patch); try { window.localStorage.setItem('ucc.inboxSys', JSON.stringify(m)); } catch (e) {} this.setState({ inboxSys: m }); }
  }
  inboxMarkRead(key) { const r = Object.assign({}, this.state.inboxRead || {}); r[key] = Date.now(); try { window.localStorage.setItem('ucc.inboxRead', JSON.stringify(r)); } catch (e) {} this.setState({ inboxRead: r }); }
  inboxOpen(key) {
    const self = this; const dn = this.state.dm; const it = this.inboxItems(dn).filter(function (x) { return x.key === key; })[0]; if (!it) return; if (!it.read) this.inboxMarkRead(key);
    const when = function (t) { return new Date(t).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); };
    const facts = [{ k: 'Type', v: it.kind }, { k: 'From', v: it.from }, { k: 'Received', v: when(it.at) }, { k: 'Status', v: it.status }].concat(it.prio ? [{ k: 'Priority', v: it.prio }] : []).concat(it.due ? [{ k: 'Deadline', v: it.due.replace(/^Due:? /, '') }] : []).concat(it.action ? [{ k: 'What is asked', v: it.action }] : []).concat(it.remarks ? [{ k: 'Remarks', v: it.remarks }] : []).concat(it.src === 'log' ? (it.e.facts || []).slice(0, 6).map(function (f) { return { k: 'Record · ' + f.k, v: f.v }; }) : []);
    const steps = [{ label: 'Received from ' + it.from, meta: when(it.at), cls: 'step done' }].concat(it.replies.map(function (r) { return { label: (r.done ? 'Marked done · ' : 'Reply · ') + r.by, meta: when(r.at) + ' · ' + r.text, cls: 'step done' }; }));
    const links = [];
    if (it.status === 'New') links.push({ label: 'Acknowledge', go: function () { self.inboxSet(it, it.src === 'log' ? { dmStatus: 'Acknowledged', dmAckAt: Date.now() } : { status: 'Acknowledged', ackAt: Date.now() }); self.inboxOpen(key); } });
    if (it.incId) links.push({ label: 'Open the case file ' + it.incId, go: function () { self.setState({ rxRec: self.rxBack(self.incRec(TX[it.incId])) }); } });
    if (it.clipId) { const c = pressClips().filter(function (x) { return x.id === it.clipId; })[0]; if (c) links.push({ label: 'Open the clipping', go: function () { self.pwOpen(c); } }); }
    this.setState({ rxRec: { title: it.subject, sub: 'Inbox · ' + it.kind + ' · from ' + it.from, facts: facts, steps: steps, links: links, inboxKey: key, incId: null, why: [] } });
  }
  inboxReply(key, text, done) {
    const dn = this.state.dm; const it = this.inboxItems(dn).filter(function (x) { return x.key === key; })[0]; if (!it) return;
    const r = { at: Date.now(), by: 'District Manager, ' + dn, text: (text || '').trim() || (done ? 'Done.' : '—'), done: !!done };
    const patch = it.src === 'log' ? { replies: (it.e.replies || []).concat([r]), dmStatus: done ? 'Done' : (it.status === 'New' ? 'Acknowledged' : it.status) } : { replies: it.replies.concat([r]), status: done ? 'Done' : (it.status === 'New' ? 'Acknowledged' : it.status) };
    if (it.src === 'log' && done) patch.status = 'Done';
    this.inboxSet(it, patch); this.inboxOpen(key);
  }
  buildInbox(path) {
    const self = this; const s = this.state; const dn = s.dm; const all = this.inboxItems(dn);
    const f = s.inboxF || 'all'; const tf = s.inboxT || 'all'; const q = (s.inboxQ || '').trim().toLowerCase();
    const kinds = []; all.forEach(function (x) { if (kinds.indexOf(x.kind) < 0) kinds.push(x.kind); });
    const l = all.filter(function (x) { return (f === 'all' || (f === 'new' ? !x.read : f === 'open' ? x.status === 'New' : x.status !== 'New')) && (tf === 'all' || x.kind === tf) && (!q || (x.subject + ' ' + x.action + ' ' + x.remarks + ' ' + x.kind + ' ' + x.from).toLowerCase().indexOf(q) >= 0); });
    const cnt = function (fn) { return all.filter(fn).length; };
    const when = function (t) { const h = (Date.now() - t) / 3600000; return h < 1 ? Math.max(1, Math.round(h * 60)) + ' min ago' : h < 48 ? Math.round(h) + ' h ago' : Math.round(h / 24) + ' days ago'; };
    const KC = { 'Escalation': 'bad', 'Assigned to you': 'warn', 'Escalated incident': 'bad', 'Press advisory': 'neu', 'Rejoinder (for information)': 'neu', 'Copied to you': 'neu' };
    const box = {
      dn: dn, total: fmtN(all.length),
      tiles: [['new', 'New', cnt(function (x) { return !x.read; })], ['open', 'To acknowledge', cnt(function (x) { return x.status === 'New'; })], ['done', 'Acknowledged', cnt(function (x) { return x.status !== 'New'; })], ['all', 'All', all.length]].map(function (t) { return { label: t[1], n: fmtN(t[2]), cls: 'ibt' + (f === t[0] ? ' on' : ''), pick: function () { self.setState({ inboxF: t[0] }); } }; }),
      types: [{ label: 'All types', cls: 'chip' + (tf === 'all' ? ' on' : ''), pick: function () { self.setState({ inboxT: 'all' }); } }].concat(kinds.map(function (k) { return { label: k + ' · ' + fmtN(cnt(function (x) { return x.kind === k; })), cls: 'chip' + (tf === k ? ' on' : ''), pick: function () { self.setState({ inboxT: k }); } }; })),
      q: s.inboxQ || '', onQ: function (e) { self.setState({ inboxQ: e.target.value }); },
      items: l.map(function (x) { return { cls: 'ibrow' + (x.read ? '' : ' unread'), dot: !x.read, kind: x.kind, kcls: 'ibk ' + (KC[x.kind] || 'neu'), subject: x.subject, line: x.action || x.remarks || '', from: x.from, when: when(x.at), status: x.status, scls: 'ibs ' + (x.status === 'Done' ? 'good' : x.status === 'Acknowledged' ? 'warn' : 'new'), meta: [x.prio ? 'Priority ' + x.prio : '', x.due].filter(Boolean).join(' · '), hasReply: x.replies.length > 0, reply: x.replies.length ? 'Last reply: ' + x.replies[x.replies.length - 1].text : '', open: function () { self.inboxOpen(x.key); } }; }),
      has: l.length > 0, none: l.length === 0, noneText: all.length ? 'Nothing matches these filters.' : 'Nothing has been sent to the District Manager, ' + dn + ' yet. Escalations, assignments and press advisories from the Commissioner will appear here, along with incidents the system escalates to the district office.',
      markAll: function () { const r = Object.assign({}, self.state.inboxRead || {}); all.forEach(function (x) { r[x.key] = Date.now(); }); try { window.localStorage.setItem('ucc.inboxRead', JSON.stringify(r)); } catch (e) {} self.setState({ inboxRead: r }); }, hasUnread: all.some(function (x) { return !x.read; })
    };
    return { title: 'Inbox · District Manager, ' + dn, isInbox: true, inbox: box, kpis: [], scores: [] };
  }
  /* everything recorded against one incident, newest first: decisions, escalations, District Manager acknowledgements, replies and notes */
  incActions(i) {
    const s = this.state; const out = []; const isDMv = s.role === 'dm';
    const who = function (role) { return role === 'dm' ? 'District Manager, ' + i.dn : 'Commissioner'; };
    const short = function (t) { t = String(t || ''); return t.length > 160 ? t.slice(0, 158) + '…' : t; };
    (s.actLog || readActLog()).forEach(function (e) {
      const blob = (e.rec || '') + ' ' + (e.where || '') + ' ' + (e.facts || []).map(function (f) { return f.v; }).join(' '); if (blob.indexOf(i.id) < 0) return;
      out.push({ at: e.at, role: e.byRole || 'comm', who: who(e.byRole), text: e.decision + (e.action ? ': ' + short(e.action) : ''), meta: [e.owner && e.decision === 'Decided' ? 'Owner ' + e.owner : '', e.prio ? 'Priority ' + e.prio : '', e.by && e.by !== '—' ? e.by : '', e.remarks ? 'Remarks: ' + short(e.remarks) : '', 'Status ' + (e.dmStatus || e.status), e.id].filter(Boolean).join(' · '), id: e.id });
      if (e.dmAckAt) out.push({ at: e.dmAckAt, role: 'dm', who: 'District Manager, ' + i.dn, text: 'Acknowledged ' + e.id, meta: '' });
      (e.replies || []).forEach(function (r) { out.push({ at: r.at, role: /District Manager/.test(r.by) ? 'dm' : 'comm', who: r.by, text: (r.done ? 'Marked done: ' : 'Replied: ') + short(r.text), meta: 'On ' + e.id }); });
    });
    const sys = (s.inboxSys || {})[i.id];
    if (sys) { if (sys.ackAt) out.push({ at: sys.ackAt, role: 'dm', who: 'District Manager, ' + i.dn, text: 'Acknowledged the escalation to the district office', meta: '' }); (sys.replies || []).forEach(function (r) { out.push({ at: r.at, role: 'dm', who: r.by, text: (r.done ? 'Marked done: ' : 'Replied: ') + short(r.text), meta: 'On the district-office escalation' }); }); }
    return out.sort(function (a, b) { return b.at - a.at; }).map(function (a) { const wh = new Date(a.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); return Object.assign(a, { when: wh, sub: wh + (a.meta ? ' · ' + a.meta : ''), cls: 'actw ' + (a.role === 'dm' ? 'dm' : 'cm'), who: isDMv && a.role === 'dm' ? 'You · ' + a.who : a.who }); });
  }
  /* ---------- Image analyser page ---------- */
  imgRskRec(r, sk) {
    const self = this; const p = function (x) { return r.t ? fmtN(x / r.t * 100, 1) + '%' : '—'; }; const fl = imgFlag(r); const inc = fl ? imgIncidentsOf(r.dn).filter(function (i) { return i.img && i.img.n === r.n && i.mandal === r.mandal; })[0] : null;
    const facts = [{ k: 'RSK', v: imgRskName(r.n) }, { k: 'Mandal · district', v: r.mandal + ' · ' + r.dn }, { k: 'Season', v: IMG_SEAS[sk] }, { k: 'Photos analysed', v: fmtN(r.t) }, { k: 'Good', v: fmtN(r.good) + ' (' + p(r.good) + ')' }, { k: 'Average', v: fmtN(r.avg) + ' (' + p(r.avg) + ')' }, { k: 'Bad', v: fmtN(r.bad) + ' (' + p(r.bad) + ')' }, { k: 'Unidentifiable', v: fmtN(r.unid) + ' (' + p(r.unid) + ')' }, { k: 'Accuracy (usable)', v: pct(imgAcc(r)) }].concat(r.lorry + r.tractor + r.truck ? [{ k: 'Vehicle types read', v: fmtN(r.lorry) + ' lorries · ' + fmtN(r.tractor) + ' tractors · ' + fmtN(r.truck) + ' trucks' }] : []).concat([{ k: 'Flag', v: fl ? fl + ' — ' + IMG_RULE[fl] : 'Within the normal range' }]);
    this.setState({ rxRec: { back: this.state.rxRec || null, rec1: true, title: imgRskName(r.n), sub: 'Image analyser · ' + r.mandal + ', ' + r.dn + ' · ' + IMG_SEAS[sk], facts: facts, steps: [], links: inc ? [{ label: 'Open incident ' + inc.id, go: function () { self.setState({ rxRec: self.rxBack(self.incRec(inc)) }); } }] : [] } });
  }
  imgRskList(dn, mn, sk) {
    const self = this; const l = imgRsks(sk, dn, mn).sort(function (a, b) { return imgAcc(a) - imgAcc(b); }); const T = function (x, t) { return Object.assign(C(x, t || ''), { cls: 'txt' }); };
    this.tablePopup('RSKs · ' + mn + ', ' + dn, fmtN(l.length) + ' RSKs · ' + IMG_SEAS[sk] + ' · lowest accuracy first · click one for its record', ['RSK', 'Photos', 'Good', 'Average', 'Bad', 'Unidentifiable', 'Accuracy', 'Flag'], l.map(function (r) { const fl = imgFlag(r); return { name: imgRskName(r.n), cells: [C(fmtN(r.t)), C(fmtN(r.good)), C(fmtN(r.avg)), C(fmtN(r.bad), r.bad / (r.t || 1) > 0.3 ? 'bad' : ''), C(fmtN(r.unid), r.unid / (r.t || 1) > 0.3 ? 'bad' : ''), C(pct(imgAcc(r)), imgAcc(r) < 0.5 ? 'bad' : imgAcc(r) < 0.75 ? 'warn' : 'good'), T(sk === 's2026' && fl ? (fl.indexOf('unreadable') > 0 ? 'Incident · unreadable' : 'Incident · poor quality') : '—', fl && sk === 's2026' ? 'bad' : '')], drill: function () { self.imgRskRec(r, sk); } }; }), null, 'image-rsks-' + mn);
  }
  buildImg(path) {
    const self = this; const s = this.state; const sk = s.imgSeas || 's2026'; const dn = path[0] || null;
    const dns = dn ? [dn] : D.map(function (d) { return d.name; }).filter(function (n) { return IMGDB[sk].dist[n]; });
    const tot = dn ? (imgDist(sk, dn) || imgSum([])) : imgSum(dns.map(function (n) { return imgDist(sk, n); }));
    let incs = []; (dn ? [dn] : D.map(function (d) { return d.name; })).forEach(function (n) { incs = incs.concat(imgIncidentsOf(n)); });
    const p = function (x) { return tot.t ? x / tot.t : 0; };
    const k = function (label, value, sub, t, def, calc, key) { const kk = self.mkK(label, value, sub, t, 'img_' + key, { def: def, calc: calc, drill: 'State → district → mandal → RSK' }); return kk; };
    const kpis = [
      k('Photos analysed', fmtN(tot.t), IMG_SEAS[sk] + ' · ' + (dn || 'Andhra Pradesh'), '', 'Vehicle photos captured at RSKs and graded by the AI image analysis.', 'Count of graded photos.', 't'),
      k('Accuracy', pct(imgAcc(tot)), 'usable photos (Good + Average)', tone(imgAcc(tot), 0.75, 0.6), 'Share of photos clear enough to identify the vehicle.', '(Good + Average) ÷ total photos', 'acc'),
      k('Good ratio', pct(p(tot.good)), fmtN(tot.good) + ' sharp, well-lit photos', tone(p(tot.good), 0.5, 0.35), 'Share of photos that are sharp, well lit and show the full vehicle and plate.', 'Good ÷ total photos', 'good'),
      k('Failures', fmtN(tot.bad + tot.unid), pct(p(tot.bad + tot.unid)) + ' bad or unidentifiable', 'warn', 'Photos that cannot be relied on to identify the vehicle.', 'Bad + Unidentifiable', 'fail'),
      k('Unidentifiable', fmtN(tot.unid), pct(p(tot.unid)) + ' blank, dark or unreadable', p(tot.unid) > 0.2 ? 'bad' : 'warn', 'Photos where nothing can be read: blank, dark or otherwise unreadable.', 'Unidentifiable count', 'unid'),
      k('Incidents raised', fmtN(incs.length), fmtN(incs.filter(function (i) { return i.prio === 'P2'; }).length) + ' unreadable · ' + fmtN(incs.filter(function (i) { return i.prio === 'P3'; }).length) + ' poor quality', incs.length ? 'bad' : '', 'Incidents raised from Kharif 2025-26 photos at RSKs with abnormal images.', 'RSKs with 30+ photos where 60% or more are unidentifiable (High), or 60% or more are bad or unidentifiable (Medium).', 'inc')
    ];
    const SPK = { t: function (o) { return o.t; }, acc: function (o) { return imgAcc(o); }, good: function (o) { return o.t ? o.good / o.t : 0; }, fail: function (o) { return o.bad + o.unid; }, unid: function (o) { return o.unid; }, inc: function (o) { return o.inc || 0; } };
    const FMT = { acc: pct, good: pct };
    kpis.forEach(function (kk, i) { const key = ['t', 'acc', 'good', 'fail', 'unid', 'inc'][i];
      kk._info.tab = { cols: [['Photos', 't', 'n'], ['Bad', 'bad', 'n'], ['Unidentifiable', 'unid', 'n']], res: [kk.label, SPK[key], FMT[key] || function (x) { return fmtN(x); }],
        f: function (d) { const o = imgDist(sk, d) || imgSum([]); o.inc = imgIncidentsOf(d).length; return o; },
        fm: function (mid, m) { const o = imgMandalFor(sk, m.dn, m.name); if (!o) return null; o.inc = imgIncidentsOf(m.dn).filter(function (i) { return imgNorm(i.mandal) === imgNorm(m.name); }).length; return o; },
        leaf: function (d, m) { const o = imgMandalFor(sk, d, m.name); return o ? function () { self.imgRskList(d, o.n, sk); } : null; } }; });
    const page = { title: 'Image analyser' + (dn ? ' · ' + dn : ''), sub: 'Source: AI-powered vehicle image analysis · ' + IMG_SEAS[sk], kpis: kpis, scores: [], isImg: true };
    const T = function (x, t) { return Object.assign(C(x, t || ''), { cls: 'txt' }); };
    if (!dn) {
      const rows = dns.map(function (n) { const o = imgDist(sk, n); const ni = imgIncidentsOf(n).length; return { name: n, cells: [C(fmtN(o.t)), C(fmtN(o.good)), C(fmtN(o.avg)), C(fmtN(o.bad)), C(fmtN(o.unid), o.unid / (o.t || 1) > 0.3 ? 'bad' : ''), C(pct(imgAcc(o)), imgAcc(o) < 0.6 ? 'bad' : imgAcc(o) < 0.75 ? 'warn' : 'good'), C(fmtN(ni), ni ? 'bad' : '')], drill: function () { self.drill(n); }, keepDrill: true }; });
      page.hasTable = true; page.table = this.table('District-wise image quality', IMG_SEAS[sk] + ' · click a district for its mandals and RSKs · ' + (D.length - dns.length) + ' districts have no photos in this season', ['District', 'Photos', 'Good', 'Average', 'Bad', 'Unidentifiable', 'Accuracy', 'Incidents'], rows, [C(fmtN(tot.t)), C(fmtN(tot.good)), C(fmtN(tot.avg)), C(fmtN(tot.bad)), C(fmtN(tot.unid)), C(pct(imgAcc(tot))), C(fmtN(incs.length))], 'Andhra Pradesh', 'image-quality-districts');
    } else {
      const ms = imgMandals(sk, dn);
      const rows = ms.map(function (m) { const ni = imgIncidentsOf(dn).filter(function (i) { return i.mandal === m.n; }).length; return { name: m.n + ' ›', cells: [C(fmtN(m.t)), C(fmtN(m.good)), C(fmtN(m.avg)), C(fmtN(m.bad)), C(fmtN(m.unid), m.unid / (m.t || 1) > 0.3 ? 'bad' : ''), C(pct(imgAcc(m)), imgAcc(m) < 0.6 ? 'bad' : imgAcc(m) < 0.75 ? 'warn' : 'good'), C(fmtN(ni), ni ? 'bad' : '')], drill: function () { self.imgRskList(dn, m.n, sk); }, keepDrill: true }; });
      page.hasTable = true; page.table = this.table('Mandal-wise image quality · ' + dn, IMG_SEAS[sk] + ' · click a mandal for its RSKs', ['Mandal', 'Photos', 'Good', 'Average', 'Bad', 'Unidentifiable', 'Accuracy', 'Incidents'], rows, [C(fmtN(tot.t)), C(fmtN(tot.good)), C(fmtN(tot.avg)), C(fmtN(tot.bad)), C(fmtN(tot.unid)), C(pct(imgAcc(tot))), C(fmtN(incs.length))], dn, 'image-quality-' + dn);
      if (!ms.length) page.table.note = 'No vehicle photos for ' + dn + ' in ' + IMG_SEAS[sk] + '.';
    }
    if (incs.length) { const DI = {}; D.forEach(function (d, x) { DI[d.name] = x; });
      const q = (s.imgQ || '').trim().toLowerCase(); const sev = s.imgSev || 'all'; const fd = dn ? '' : (s.imgD || '');
      const il = incs.filter(function (i) { return (sev === 'all' || i.prio === sev) && (!fd || i.dn === fd) && (!q || (i.id + ' ' + i.img.n + ' ' + i.mandal + ' ' + i.dn + ' ' + i.title).toLowerCase().indexOf(q) >= 0); }).sort(function (a, b) { return DI[a.dn] - DI[b.dn] || a.mandal.localeCompare(b.mandal) || a.prio.localeCompare(b.prio); });
      page.hasT2 = true; page.t2 = this.table('Incidents raised from images' + (dn ? ' · ' + dn : ''), 'Kharif 2025-26 · by district, then mandal · click one for its case file', ['Incident', 'Severity', 'RSK', 'Mandal', 'District', 'Photos', 'Unidentifiable', 'Accuracy'], il.slice(0, 300).map(function (i) { return { name: i.id, cells: [T(SEV[i.prio], i.prio === 'P2' ? 'warn' : ''), T(imgRskName(i.img.n)), T(i.mandal), T(i.dn), C(fmtN(i.img.t)), C(pct(i.img.unid / (i.img.t || 1)), 'bad'), C(pct(imgAcc(i.img)), 'bad')], drill: function () { self.setState({ rxRec: self.rxBack(self.incRec(i)) }); }, keepDrill: true }; }), null, '', 'image-incidents');
      if (il.length > 300) page.t2.note = 'First 300 of ' + fmtN(il.length) + ' shown; narrow with the search or filters, or download the CSV.';
      Object.assign(page.t2, { hasQ: true, qPh: 'Search by incident ID, RSK, mandal or district…', q: s.imgQ || '', hasQv: !!(q || sev !== 'all' || fd), onQ: function (e) { self.setState({ imgQ: e.target.value }); }, clearQ: function () { self.setState({ imgQ: '', imgSev: 'all', imgD: '' }); }, count: fmtN(il.length) + ' of ' + fmtN(incs.length) + ' incidents',
        hasChips: true, chips: [['all', 'All severities', incs.length], ['P2', 'High · unreadable', incs.filter(function (i) { return i.prio === 'P2'; }).length], ['P3', 'Medium · poor quality', incs.filter(function (i) { return i.prio === 'P3'; }).length]].map(function (x) { return { label: x[1] + ' · ' + fmtN(x[2]), cls: 'chip' + (sev === x[0] ? ' on' : ''), pick: function () { self.setState({ imgSev: x[0] }); } }; }),
        hasSel: !dn, selVal: fd, onSel: function (e) { self.setState({ imgD: e.target.value }); }, selOpts: [{ v: '', l: 'All districts' }].concat(D.filter(function (d) { return imgIncidentsOf(d.name).length; }).map(function (d) { return { v: d.name, l: d.name + ' · ' + imgIncidentsOf(d.name).length }; })),
        noMatch: !il.length, noMatchText: 'No image incident matches these filters.' }); }
    page.imgRef = { has: true, seas: [['s2026', 'Kharif 2025-26'], ['s2425', 'Kharif 2024-25']].map(function (x) { return { label: x[1], cls: 'chip' + (sk === x[0] ? ' on' : ''), pick: function () { self.setState({ imgSeas: x[0] }); } }; }),
      ex: [['Good', 'Sharp, well-lit, full vehicle and plate visible', 'good'], ['Average', 'Usable, but low light or a partial view', 'warn'], ['Bad', 'Blurred, glare, or obstructed view', 'bad'], ['Unidentifiable', 'Blank, dark, or otherwise unreadable', 'neu']].map(function (x, i) { return { tag: x[0], text: x[1], cls: 'imgtag ' + x[2], src: IMGDB.ex[i] || '' }; }),
      note: 'Accuracy = (Good + Average) ÷ total photos. Incidents are raised from Kharif 2025-26 photos only; Kharif 2024-25 is shown for comparison. The source file holds counts per RSK, not the photos themselves, so incidents point to the RSK, not to a single photo.' };
    return page;
  }
  incRec(i) {
    const ev = incEvidence(i);
    return { rec1: true, incId: i.id, title: i.id + ' · ' + i.title, sub: STAGE_NAME[i.stage] + ' · ' + i.ent + (i.mv ? ' · ' + i.mv : '') + ' · ' + i.mandal + ', ' + i.dn, facts: [{ k: 'Severity', v: SEV[i.prio] }, { k: 'Status', v: i.status + (i.escTo ? ' · to ' + i.escTo : '') }, { k: 'Age', v: i.ageH + ' hours' }, { k: 'Records behind it', v: fmtN(ev.length) }], steps: [], links: [] };
  }
  achFor(dns, scope) {
    const self = this; let ppc = []; dns.forEach(function (dn) { ppc = ppc.concat(entsOfDistrict(dn, 'proc')); });
    const done = ppc.filter(function (e) { return e.v.paid > 0 && e.v.pay24 >= 1; });
    const v = dns.length === 1 ? distVals(dns[0]) : stateVals(); const all = v.pay24 >= 1;
    const T = function (x) { return Object.assign(C(x), { cls: 'txt' }); };
    return { on: true, all: all, title: all ? 'Achievement · every farmer payment in ' + scope + ' was made within 24 hours' : 'Achievement · ' + fmtN(done.length) + ' of ' + fmtN(ppc.length) + ' PPCs paid every farmer within 24 hours',
      text: all ? '100% of farmer payments credited within 24 h of sale.' : scope + ' overall: ' + pct(v.pay24) + ' within 24 h · ' + pct(v.pay2448) + ' in 24–48 h · ' + pct(v.payLate) + ' after 48 h. Reaching 100% within 24 h marks ' + scope + ' as achieved.',
      label: 'View PPCs', go: function () { self.tablePopup('PPCs that paid every farmer within 24 hours · ' + scope, fmtN(done.length) + ' PPCs · all farmer payments credited within 24 h of sale', ['PPC', 'Mandal', 'District', 'Farmers paid', 'Amount paid (₹ Cr)'], done.map(function (e) { return { name: e.name, cells: [T(LBL[e.mid]), T(e.dn), C(fmtN(Math.round(e.v.farmers - e.v.farmersPend))), C(fmtN(e.v.paid, 2))] }; }), null, 'ppc-paid-within-24h'); } };
  }
  rxRecord(kind, r) {
    const self = this;
    const st = function (label, meta, cls) { return { label: label, meta: meta || '', cls: 'step ' + (cls || 'done') }; };
    const go = function (label, fn) { return { label: label, go: function () { self.setState({ rxRec: null }); fn(); } }; };
    if (kind === 's1') return { title: r.id + ' · ' + r.mode + (r.kind === 'inter' ? ' · inter-district' : ''), sub: r.route, facts: [{ k: 'From', v: r.from + ' (' + r.dn + ')' }, { k: 'To', v: r.to }, { k: 'Distance', v: r.km + ' km' }, { k: 'Transporter', v: r.transporter }, { k: 'Vehicle / rake', v: r.vehicle }, { k: 'Dispatched', v: fmtN(r.qty, 2) + ' MT' }, { k: 'Received', v: r.recvH === null ? 'Not yet' : fmtN(r.recv, 2) + ' MT' }, { k: 'Short / damaged', v: fmtN(r.short, 2) + ' MT' }, { k: 'Scheduled transit', v: fmtH(r.sched) }, { k: 'Freight', v: '₹' + fmtN(r.rate) + '/MT · ' + r.band }],
      steps: [st('Dispatched · ' + r.docD, fmtDT(r.dispH)), r.recvH === null ? st('In transit', 'Scheduled within ' + fmtH(r.sched), 'now') : st('Received · ' + r.docR, fmtDT(r.recvH) + ' · transit ' + fmtH(r.transit) + (r.onTime ? ' · within schedule' : ' · late'), r.onTime ? 'done' : 'bad'), r.recvH === null ? st('Receipt and quantity check', 'Pending', '') : st(r.short > 0.002 * r.qty ? 'Short / damaged quantity recorded' : 'Quantity matched', fmtN(r.short, 2) + ' MT short', r.short > 0.002 * r.qty ? 'bad' : 'done')], links: [go('Open GPS tracking for ' + r.dn, function () { self.setState({ module: 'gps', stage: 's1', path: [r.dn], kpiOpen: null }); })] };
    if (kind === 's2') return { title: r.id + ' · ' + r.fps, sub: r.mls + ' → ' + r.fps + ' · ' + r.mandal + ', ' + r.dn, facts: [{ k: 'Transporter', v: r.transporter }, { k: 'Vehicle', v: r.vehicle }, { k: 'Challan', v: r.challan }, { k: 'Dispatched', v: fmtN(r.qty, 2) + ' MT' }, { k: 'Delivered', v: r.delH === null ? 'Not yet' : fmtN(r.delivered, 2) + ' MT' }, { k: 'Acknowledged on ePoS', v: r.ackH === null ? 'Not yet' : fmtN(r.ackQ, 2) + ' MT · ' + r.ackNo }, { k: 'On time / in full', v: r.delH === null ? '—' : (r.onTime ? 'On time' : 'Late') + ' · ' + (r.inFull ? 'in full' : 'short') }],
      steps: [st('Dispatched from ' + r.mls, fmtDT(r.dispH)), r.delH === null ? st('In transit', '', 'now') : st('Delivered at ' + r.fps, fmtDT(r.delH) + ' · ' + fmtH(r.dl) + ' after dispatch', r.onTime ? 'done' : 'bad'), r.delH === null ? st('ePoS acknowledgement', 'Pending', '') : r.ackH === null ? st('Awaiting ePoS acknowledgement', 'Open for ' + fmtH(r.delH), r.delH > 24 ? 'bad' : 'now') : st('Acknowledged on ePoS · ' + r.ackNo, fmtDT(r.ackH) + ' · ' + fmtH(r.delH - r.ackH) + ' after delivery', r.inFull ? 'done' : 'bad')], links: [] };
    if (kind === 'godown') return { title: r.name, sub: r.mandal + ', ' + r.dn, facts: [{ k: 'Last stocktake', v: fmtD(r.lastTake) }, { k: 'Book stock', v: fmtN(r.book, 1) + ' MT' }, { k: 'Physical stock', v: fmtN(r.phys, 1) + ' MT' }, { k: 'Opening (month)', v: fmtN(r.open, 1) + ' MT' }, { k: 'Receipts', v: fmtN(r.rec, 1) + ' MT' }, { k: 'Issues', v: fmtN(r.iss, 1) + ' MT' }, { k: 'Usable capacity', v: fmtN(r.usable, 1) + ' MT' + (r.blocked ? ' (' + fmtN(r.blocked, 1) + ' MT not usable · ' + r.blockWhy + ')' : '') }], steps: [], links: [go('Open this godown', function () { self.setState({ module: 'overview', stage: 'stor', path: [r.dn, r.mid, r.id], kpiOpen: null }); })] };
    if (kind === 'lot') { const hist = [st('Received from ' + r.mill + ' · ' + r.ack, fmtD(r.age)), st('Placed at ' + r.loc, fmtD(r.age))]; if (r.age > 40) hist.push(st('Fumigated', fmtD(Math.round(r.age * 0.6)))); if (r.lastMv < r.age) hist.push(st(r.lastType, fmtD(r.lastMv))); if (!r.complete) hist.push(st('Location or movement entry missing in the stack ledger', 'Traceability gap', 'bad')); return { title: r.id + ' · ' + r.commodity, sub: r.godown + ' · ' + r.mandal + ', ' + r.dn, facts: [{ k: 'Location', v: r.loc }, { k: 'Quantity', v: fmtN(r.qty, 2) + ' MT' }, { k: 'Crop year', v: r.crop }, { k: 'Age', v: r.age + ' days' + (r.aged ? ' · beyond the 180-day target' : '') }, { k: 'Source', v: r.mill + ' · ' + r.ack }, { k: 'Records', v: r.complete ? 'Complete' : 'Incomplete' }], steps: hist, links: [] }; }
    if (kind === 'fto') return { title: r.id + ' · ' + r.status, sub: r.farmer + ' · ' + r.ppc + ' · ' + r.mandal + ', ' + r.dn, facts: [{ k: 'Farmer', v: r.farmer }, { k: 'Amount', v: '₹' + fmtN(r.amt * 100, 2) + ' lakh' }, { k: 'Status group', v: r.group }, { k: 'Bank response', v: r.resp }, { k: 'RSK', v: r.ppc }, { k: 'Mandal', v: r.mandal + ', ' + r.dn }].concat(r.payH ? [{ k: 'Paid in', v: fmtH(r.payH) + (r.payH <= 24 ? ' · within 24 h' : r.payH <= 48 ? ' · 24–48 h' : ' · beyond 48 h') }] : []), steps: [st('FTO generated', fmtDT(r.hAgo)), r.group === 'Pending' ? st('Not yet sent to bank', '', 'now') : st('Sent to bank', fmtDT(r.hAgo - Math.min(4, r.hAgo / 3))), r.group === 'Credited' ? st('Credited · ' + r.resp, fmtDT(r.upd)) : r.group === 'Rejected' || r.group === 'Failed' ? st(r.status + ' · ' + r.resp, fmtDT(r.upd) + ' · correct and re-send', 'bad') : st(r.status, 'Last update ' + fmtDT(r.upd), r.group === 'Pending' ? '' : 'now')], links: [] };
    if (kind === 'bill') return { title: r.id + ' · ' + r.type, sub: r.payee + ' · ' + r.ppc + ', ' + r.dn, facts: [{ k: 'Amount', v: '₹' + fmtN(r.amt, 2) + ' lakh' }, { k: 'FTO', v: r.fto || 'Not generated' }, { k: 'Status', v: r.status }, { k: 'Paid in', v: r.payH === null ? '—' : fmtH(r.payH) + ' · ' + r.band }, { k: 'Bank response', v: r.resp || '—' }], steps: [st('Bill raised', fmtDT(r.hAgo)), r.fto ? st('FTO generated · ' + r.fto, '') : st('Bill pending approval', '', 'now'), r.status === 'Paid' ? st('Paid · ' + r.resp, fmtDT(r.hAgo - r.payH)) : st(r.status, r.resp || '', r.status === 'Rejected by bank' ? 'bad' : 'now')], links: [] };
    if (kind === 'grv') { const hasInc = !!TX[r.id]; return { title: r.id + ' · ' + r.type, sub: r.channel + ' · ' + r.anchor + ' · ' + r.mandal + ', ' + r.dn, facts: [{ k: 'Severity', v: SEV[r.prio] }, { k: 'SLA due', v: fmtDT(r.dueH) + ' (' + GRV_SLA_H[r.prio] + ' h, POC setting)' }, { k: 'State', v: r.state }, { k: 'Validation', v: r.valid }, { k: 'Resolved and validated in SLA', v: !r.dueNow && r.valH === null ? 'Not yet due' : r.within ? 'Yes' : 'No' }],
      steps: [st('Received via ' + r.channel, fmtDT(r.ageH)), r.ackH === null ? st('Acknowledgement', 'Not yet', 'now') : st('Acknowledged', fmtDT(r.ackH)), r.resH === null ? st('Resolution', r.valid === 'Rejected · reopened' ? 'Reopened after validation was rejected' : 'Not yet', r.valid === 'Rejected · reopened' ? 'bad' : '') : st('Resolved', fmtDT(r.resH)), r.valH === null ? st('Validation', r.valid, r.valid === 'Pending validation' ? 'now' : '') : st('Validated', fmtDT(r.valH), r.within ? 'done' : 'bad'), r.closeH === null ? st('Closure', 'Open', '') : st('Closed', fmtDT(r.closeH))], links: hasInc ? [go('Open incident ' + r.id, function () { self.setState({ module: 'alerts', path: [r.dn, r.id], kpiOpen: null }); })] : [] }; }
    if (kind === 'camev') { const links = [go('Open camera ' + r.cam.id, function () { self.setState({ module: 'cctv', path: [r.dn, r.cam.id], kpiOpen: null }); })]; if (r.link && r.link.kind === 'inc') links.push(go('Open incident ' + r.link.id, function () { self.setState({ module: 'alerts', stage: 'all', path: [r.dn, r.link.id], kpiOpen: null }); })); if (r.link && r.link.kind === 's1') links.push({ label: 'Open ' + r.link.label, go: function () { self.setState({ rxRec: self.rxBack(self.rxRecord('s1', r.link.rec)) }); } });
      return { title: r.id + ' · ' + r.event, sub: r.site + ' · ' + r.mandal + ', ' + r.dn, facts: [{ k: 'Camera', v: r.cam.id + ' · ' + r.cam.view }, { k: 'Detected', v: fmtDT(r.atH) }, { k: 'Review status', v: r.review }, { k: 'Reviewed by', v: r.by || '—' }, { k: 'Linked to', v: r.link ? r.link.label : '—' }], steps: [st('Detected by video analytics', fmtDT(r.atH)), r.review === 'Not reviewed' ? st('Awaiting review', '', 'bad') : r.review === 'Under review' ? st('Under review', r.by, 'now') : st(r.review, r.by)], links: links }; }
    if (kind === 'cam') return { title: r.id + ' · ' + r.site, sub: r.mandal + ', ' + r.dn, facts: [{ k: 'Site type', v: r.siteType }, { k: 'Position', v: r.view }, { k: 'Status', v: r.status }, { k: 'Last seen', v: fmtDT(r.seenH) + (r.status === 'Offline' ? ' · ' + fmtH(r.seenH) + ' ago' : ' · live') }, { k: 'Last event', v: r.event || 'None in 24 h' }], steps: [], links: [go('Open camera trail', function () { self.setState({ module: 'cctv', path: [r.dn, r.id], kpiOpen: null }); })] };
    if (kind === 'trip') { const t = r; return { title: t.id + ' · ' + t.veh.plate, sub: STAGE_NAME[t.stage] + ' · ' + t.route, facts: [{ k: 'Vehicle', v: t.veh.plate }, { k: 'Device', v: t.offline ? 'Offline · last ping ' + fmtH(t.pingMin / 60) + ' ago' : 'Online · last ping ' + fmtN(t.pingMin, 1) + ' min ago' }, { k: 'Vehicle state', v: t.vstate }, { k: 'Trip state', v: t.trip }, { k: 'Scheduled start', v: t.schedStart }, { k: 'GPS feed', v: 'Last received ' + gpsFeedMin(t.dn) + ' min ago' }],
      steps: [t.depH === null ? st('Dispatch record', 'Not created · trip not started', t.trip.indexOf('Not started') === 0 ? 'bad' : 'now') : st('Dispatched · ' + t.dDoc, fmtDT(t.depH)), t.recH === null ? st('Receipt record', t.depH === null ? '—' : 'In transit', t.depH === null ? '' : 'now') : st('Received · ' + t.rDoc, fmtDT(t.recH)), t.aDoc ? st('Acknowledged · ' + t.aDoc, fmtDT(t.ackH)) : st('Acknowledgement', t.recH === null ? '—' : 'Awaiting', t.recH === null ? '' : 'now')], links: [go('Open vehicle trail', function () { self.setState({ module: 'gps', path: [t.dn, t.veh.id], kpiOpen: null }); }), go('Open ' + STAGE_NAME[t.stage] + ' tab', function () { self.setState({ module: 'overview', stage: t.stage, path: [t.dn], kpiOpen: null }); })] }; }
    return null;
  }

  rxRender(list, scopeKey) {
    const self = this; const s = this.state; const CAP = 80;
    if (!this._rxCache || this._rxCacheN > 60) { this._rxCache = {}; this._rxCacheN = 0; }
    return list.map(function (x) {
      const vk = (s.rxView || {})[x.key]; const v = x.views.filter(function (y) { return y.k === vk; })[0] || x.views[0];
      const fk = x.key + '|' + v.k; const fv = v.filter ? ((s.rxF || {})[fk] || '') : '';
      const ck = scopeKey + '|' + fk + '|' + fv; if (!self._rxCache[ck]) { const op0 = !!(s.rxOpen || {})[x.key]; if (!op0) return { key: x.key, title: x.title, sub: x.sub, src: x.src, views: [], chips: [], hasChips: false, t: { download: function () {}, cols: [], rows: [], grid: '1fr', hasTotal: false, total: [], totalLabel: '' }, hasRows: false, empty: false, emptyMsg: '', count: '', open: false, closed: true, toggleLabel: 'View records', toggle: function () { const o = Object.assign({}, self.state.rxOpen || {}); o[x.key] = true; self.setState({ rxOpen: o }); } };
      const item = (function () {
      const out = v.build(fv) || { labels: [''], rows: [] };
      const allRows = out.rows;
      const t = self.table(x.title, '', out.labels, allRows.slice(0, CAP), out.total || null, 'Total', x.key + '-' + v.k);
      const esc = function (q) { q = String(q); return /[",\n]/.test(q) ? '"' + q.replace(/"/g, '""') + '"' : q; };
      t.download = function () { const lines = [out.labels.map(esc).join(',')]; allRows.forEach(function (r) { lines.push([r.name].concat(r.cells.map(function (c) { return c.v; })).map(esc).join(',')); }); if (out.total) lines.push(['Total'].concat(out.total.map(function (c) { return c.v; })).map(esc).join(',')); self.offerFile((x.key + '-' + v.k + '-' + x.title).replace(/[^A-Za-z0-9_-]+/g, '-').slice(0, 80) + '.csv', lines.join('\n'), 'Copy records as CSV'); };
      let chips = [];
      if (v.filter && out.filterSrc) {
        const c = {}; out.filterSrc.forEach(function (q) { c[q] = (c[q] || 0) + 1; });
        const keys = (out.filterOrder || Object.keys(c)).filter(function (q) { return c[q]; });
        chips = [{ label: 'All · ' + fmtN(out.filterSrc.length), cls: 'chip' + (!fv ? ' on' : ''), on: !fv, pick: function () { const f = Object.assign({}, self.state.rxF || {}); delete f[fk]; self.setState({ rxF: f }); } }].concat(keys.map(function (q) { return { label: q + ' · ' + fmtN(c[q]), cls: 'chip' + (fv === q ? ' on' : ''), on: fv === q, pick: function () { const f = Object.assign({}, self.state.rxF || {}); f[fk] = q; self.setState({ rxF: f }); } }; }));
      }
      const n = allRows.length;
      return { key: x.key, title: x.title, sub: x.sub, src: x.src,
        views: x.views.map(function (y) { const on = y.k === v.k; return { label: y.label, on: on, cls: on ? 'on' : '', pick: function () { const o = Object.assign({}, self.state.rxView || {}); o[x.key] = y.k; self.setState({ rxView: o }); } }; }),
        chips: chips, hasChips: chips.length > 0, t: t, hasRows: n > 0 && !out.empty, empty: n === 0 || !!out.empty, emptyMsg: out.emptyMsg || (fv ? 'No records with “' + fv + '” in this scope and period.' : 'No records in this scope and period.'),
        count: (n > CAP ? 'Showing ' + CAP + ' of ' + fmtN(n) + ' rows · Download CSV for all' : fmtN(n) + ' row' + (n === 1 ? '' : 's')) + (out.note ? ' · ' + out.note : '') };
      })();
      self._rxCache[ck] = item; self._rxCacheN++; }
      const op = !!(s.rxOpen || {})[x.key];
      return Object.assign({}, self._rxCache[ck], { open: op, closed: !op, toggleLabel: op ? 'Hide records' : 'View records', toggle: function () { const o = Object.assign({}, self.state.rxOpen || {}); o[x.key] = !op; self.setState({ rxOpen: o }); } });
    });
  }

  /* ---------- table popup (records without leaving the page) ---------- */
  tablePopup(title, sub, labels, rows, total, csvName, links, facts) {
    const self = this; const CAP = 300;
    const t = this.table(title, '', labels, rows, total || null, 'Total', csvName); t.all = t.rows; t.rows = t.all.slice(0, CAP);
    const esc = function (q) { q = String(q); return /[",\n]/.test(q) ? '"' + q.replace(/"/g, '""') + '"' : q; };
    t.download = function () { const lines = [labels.map(esc).join(',')]; rows.forEach(function (r) { lines.push([r.name].concat(r.cells.map(function (c) { return c.v; })).map(esc).join(',')); }); if (total) lines.push(['Total'].concat(total.map(function (c) { return c.v; })).map(esc).join(',')); self.offerFile((csvName || 'records').replace(/[^A-Za-z0-9_-]+/g, '-').slice(0, 80) + '.csv', lines.join('\n'), 'Copy records as CSV'); };
    t.count = rows.length > CAP ? 'Showing ' + CAP + ' of ' + fmtN(rows.length) + ' rows · Download CSV for all' : fmtN(rows.length) + ' row' + (rows.length === 1 ? '' : 's');
    const incL = rows.map(function (r) { const id = (String(r.name).match(/INC-[A-Z]+-\d{4}(?!\d)/) || [])[0]; return id && TX[id] && TX[id].prio ? TX[id] : null; }).filter(Boolean);
    this.setState({ rxRec: { ai: incL.length && incL.length >= rows.length / 2 ? incAiList(incL) : '', title: title, sub: sub || '', facts: facts || [], steps: [], links: links || [], tbl: t, back: this.state.rxRec || null } });
  }

  /* ---------- assistant: questions answered from the records ---------- */
  answerRecords(ql, dn, msg) {
    const self = this;
    const dns = dn ? [dn] : D.map(function (d) { return d.name; }); const scope = dn || 'Andhra Pradesh';
    const T = function (x, t) { return Object.assign(C(x, t || ''), { cls: 'txt' }); };
    const has = function (arr) { return arr.some(function (w) { return ql.indexOf(w) >= 0; }); };
    const st = /stage[\s-]*(2|ii)\b|\bs2\b|last[\s-]mile/.test(ql) ? 's2' : /stage[\s-]*(1|i)\b|\bs1\b/.test(ql) ? 's1' : has(['procure', 'paddy', 'rsk', 'ppc']) ? 'proc' : has(['cmr', 'mill']) ? 'cmr' : has(['storage', 'godown']) ? 'stor' : null;
    const stTxt = st ? ' · ' + STAGE_NAME[st] : '';
    const gather = function (fn) { let o = []; dns.forEach(function (d) { o = o.concat(fn(d)); }); return o; };
    const byDist = function (l, f) { const m = {}; l.forEach(function (r) { m[r.dn] = (m[r.dn] || 0) + (f ? f(r) : 1); }); const arr = Object.keys(m).map(function (k) { return { label: k, x: m[k] }; }).sort(function (a, b) { return b.x - a.x; }).slice(0, 5); const mx = arr.length ? arr[0].x : 1; return arr.map(function (a) { return { label: a.label, w: Math.max(3, Math.round(a.x / (mx || 1) * 100)), v: f ? fmtN(a.x, 1) : fmtN(a.x), c: '#5B8FD0' }; }); };
    const notDone = has(['not completed', 'incomplete', 'not complete', 'in transit', 'in-transit', 'still', 'pending', 'running', 'on the road', 'not reached', 'open']);
    /* trips / consignments still on the road */
    if (has(['trip', 'vehicle', 'truck', 'consignment', 'dispatch', 'rake']) && (notDone || has(['how many trips', 'trips']))) {
      if (st === 's1' && has(['consignment', 'dispatch', 'rake'])) {
        const l = gather(s1Intra).concat(s1Inter().filter(function (r) { return dns.indexOf(r.dn) >= 0; })).filter(function (r) { return r.status === 'In transit'; });
        const q = l.reduce(function (a, r) { return a + r.qty; }, 0);
        const rows = l.map(function (r) { return { name: r.id, cells: [T(r.mode), T(r.route), T(r.transporter), C(fmtDT(r.dispH)), C(fmtN(r.qty, 1)), C(fmtH(r.sched))], drill: function () { self.setState({ rxRec: self.rxBack(self.rxRecord('s1', r)) }); } }; });
        return msg(fmtN(l.length) + ' Stage-I consignments are still in transit in ' + scope + ', carrying ' + fmtMT(q) + '. Most by district:', byDist(l), 'Show the ' + fmtN(l.length) + ' records', function () { self.tablePopup('Stage-I consignments in transit · ' + scope, 'Dispatched, not yet received at the destination', ['Consignment', 'Mode', 'Route', 'Transporter', 'Dispatched', 'Qty (MT)', 'Scheduled transit'], rows, null, 's1-in-transit'); });
      }
      const l = gather(tripsOf).filter(function (t) { return (!st || t.stage === st) && t.trip !== 'Completed'; });
      const inT = l.filter(function (t) { return t.trip === 'In transit'; }).length; const ns = l.filter(function (t) { return t.trip.indexOf('Not started') === 0; }).length; const ld = l.length - inT - ns;
      const rows = l.map(function (t) { return { name: t.id, cells: [T(t.veh.plate), T(STAGE_NAME[t.stage]), T(t.route), T(t.trip, t.trip.indexOf('Not started') === 0 ? 'bad' : ''), C(t.depH === null ? '—' : fmtDT(t.depH)), T(t.dDoc || '—'), T(t.offline ? 'Offline' : 'Online', t.offline ? 'bad' : '')], drill: function () { self.setState({ rxRec: self.rxBack(self.rxRecord('trip', t)) }); } }; });
      return msg(fmtN(l.length) + ' tracked trips are not completed in ' + scope + stTxt + ': ' + fmtN(inT) + ' in transit, ' + fmtN(ns) + ' not started past their scheduled start, ' + fmtN(ld) + ' loading. By district:', byDist(l), 'Show the ' + fmtN(l.length) + ' trips', function () { self.tablePopup('Trips not completed · ' + scope + stTxt, 'From the GPS trip register · vehicle, route and dispatch record for each trip', ['Trip', 'Vehicle', 'Leg', 'Route', 'Trip state', 'Departed', 'Dispatch record', 'Device'], rows, null, 'trips-not-completed'); });
    }
    if (has(['acknowledg', 'epos', 'ack ']) && has(['await', 'pending', 'not', 'without', 'missing'])) {
      const l = gather(s2Dels).filter(function (r) { return r.status.indexOf('awaiting') >= 0; }); const q = l.reduce(function (a, r) { return a + r.delivered; }, 0);
      const rows = l.map(function (r) { return { name: r.id, cells: [T(r.fps), T(r.mls), T(r.dn), C(fmtDT(r.delH)), C('open ' + fmtH(r.delH), r.delH > 24 ? 'bad' : ''), C(fmtN(r.qty, 1))], drill: function () { self.setState({ rxRec: self.rxBack(self.rxRecord('s2', r)) }); } }; });
      return msg(fmtN(l.length) + ' Stage-II deliveries in ' + scope + ' reached the FPS but have no ePoS acknowledgement yet (' + fmtMT(q) + '). By district:', byDist(l), 'Show the ' + fmtN(l.length) + ' deliveries', function () { self.tablePopup('Deliveries awaiting ePoS acknowledgement · ' + scope, 'Delivered to FPS, receipt not yet confirmed', ['Delivery', 'FPS', 'MLS point', 'District', 'Delivered', 'Waiting', 'Qty (MT)'], rows, null, 's2-awaiting-ack'); });
    }
    if (has(['batch', 'fto', 'payment', 'paid']) && has(['fail', 'reject', 'return', 'bounce', 'sent to bank', 'not sent', 'stuck', 'pending'])) {
      const want = has(['fail', 'return', 'bounce']) && has(['reject']) ? ['Rejected', 'Failed'] : has(['fail', 'return', 'bounce']) ? ['Failed'] : has(['reject']) ? ['Rejected'] : has(['sent to bank']) ? ['Sent to bank'] : ['Pending', 'Sent to bank', 'Rejected', 'Failed'];
      const l = gather(finBatches).filter(function (b) { return want.indexOf(b.group) >= 0; }); const amt = l.reduce(function (a, b) { return a + b.amt; }, 0);
      const rows = l.map(function (b) { return { name: b.id, cells: [T(b.farmer), T(b.dn), T(b.ppc), T(b.status, b.group === 'Rejected' || b.group === 'Failed' ? 'bad' : 'warn'), T(b.resp), C(fmtN(b.amt * 100, 2))], drill: function () { self.setState({ rxRec: self.rxBack(self.rxRecord('fto', b)) }); } }; });
      return msg(fmtN(l.length) + ' farmer FTOs in ' + scope + ' are ' + want.join(' / ').toLowerCase() + ', worth ' + fmtCr(amt) + ' (one FTO per farmer).', byDist(l), 'Show the ' + fmtN(l.length) + ' FTOs', function () { self.tablePopup('Farmer FTOs · ' + want.join(' / ') + ' · ' + scope, 'Status as carried in the payment feed, with bank response', ['FTO', 'Farmer', 'District', 'PPC', 'Status', 'Bank response / reason', 'Amount (₹ lakh)'], rows, null, 'farmer-ftos'); });
    }
    if (has(['grievance', 'complaint', 'pgrs', 'ivrs']) && has(['overdue', 'sla', 'breach', 'late', 'pending', 'open', 'not resolved', 'validation'])) {
      const l = gather(grievOf).filter(function (g) { return has(['validation']) ? g.valid === 'Pending validation' : has(['overdue', 'sla', 'breach', 'late']) ? g.overdue : g.closeH === null; });
      const rows = l.map(function (g) { return { name: g.id, cells: [T(g.type), T(g.dn), T(g.anchor), T(g.state), C(fmtDT(g.dueH), g.overdue ? 'bad' : '')], drill: function () { self.setState({ rxRec: self.rxBack(self.rxRecord('grv', g)) }); } }; });
      return msg(fmtN(l.length) + ' grievances in ' + scope + (has(['validation']) ? ' are resolved and awaiting validation.' : has(['overdue', 'sla', 'breach', 'late']) ? ' are past their SLA due time without validation.' : ' are still open (not closed).'), byDist(l), 'Show the ' + fmtN(l.length) + ' grievances', function () { self.tablePopup('Grievances · ' + scope, 'Acknowledgement, resolution, validation and closure tracked separately', ['Grievance', 'Type', 'District', 'RSK / FPS', 'State', 'SLA due'], rows, null, 'grievances'); });
    }
    if (has(['camera', 'cctv']) && has(['offline', 'down', 'not working', 'review', 'unreviewed', 'flagged'])) {
      let cams = [], evs = []; dns.forEach(function (d) { const x = camExtra(d); cams = cams.concat(x.cams); evs = evs.concat(x.events); });
      if (has(['review', 'unreviewed', 'flagged'])) { const l = evs.filter(function (e) { return e.review === 'Not reviewed' || e.review === 'Under review'; }); const rows = l.map(function (e) { return { name: e.id, cells: [T(e.event), T(e.site), T(e.dn), T(e.review, e.review === 'Not reviewed' ? 'bad' : 'warn'), C(fmtDT(e.atH))], drill: function () { self.setState({ rxRec: self.rxBack(self.rxRecord('camev', e)) }); } }; }); return msg(fmtN(l.length) + ' flagged CCTV events in ' + scope + ' are not reviewed yet or under review.', byDist(l), 'Show the ' + fmtN(l.length) + ' events', function () { self.tablePopup('Flagged events awaiting review · ' + scope, '', ['Event', 'Event type', 'Site', 'District', 'Review status', 'Detected'], rows, null, 'cctv-events'); }); }
      const l = cams.filter(function (c) { return c.status === 'Offline'; }); const rows = l.map(function (c) { return { name: c.id, cells: [T(c.site), T(c.view), T(c.dn), T(c.mandal), C(fmtDT(c.seenH) + ' · ' + fmtH(c.seenH) + ' ago', 'bad')] }; });
      return msg(fmtN(l.length) + ' cameras are offline in ' + scope + '.', byDist(l), 'Show the ' + fmtN(l.length) + ' cameras', function () { self.tablePopup('Offline cameras · ' + scope, 'With the site and the last time each camera was seen', ['Camera', 'Site', 'Position', 'District', 'Mandal', 'Last seen'], rows, null, 'cameras-offline'); });
    }
    if (has(['mill']) && has(['overdue', 'behind', 'default', 'pending'])) {
      const l = gather(function (d) { return entsOfDistrict(d, 'cmr'); }).filter(function (e) { return millCmr(e).overdue; });
      const rows = l.map(function (e) { const c = millCmr(e); return { name: e.name, cells: [T(e.dn), T(LBL[e.mid]), C(fmtN(c.paddyAgo) + ' d'), C(fmtN(c.due, 1)), C(fmtN(c.ack, 1)), C(fmtN(c.bal, 1), 'bad')] }; });
      return msg(fmtN(l.length) + ' rice mills in ' + scope + ' owe CMR more than 3 months after receiving paddy, with ' + fmtMT(l.reduce(function (a, e) { return a + millCmr(e).bal; }, 0)) + ' pending.', byDist(l), 'Show the ' + fmtN(l.length) + ' mills', function () { self.tablePopup('Mills with overdue CMR · ' + scope, 'Balance pending beyond 3 months of paddy receipt (SoP)', ['Rice mill', 'District', 'Mandal', 'Since paddy receipt', 'CMR due (MT)', 'Acknowledged (MT)', 'Balance (MT)'], rows, null, 'mills-overdue'); });
    }
    if (has(['lot', 'stack']) && has(['old', 'aged', 'ageing', 'beyond', 'missing'])) {
      const miss = has(['missing']); const l = gather(lotsOf).filter(function (x) { return miss ? !x.complete : x.aged; });
      const rows = l.map(function (x) { return { name: x.id, cells: [T(x.godown), T(x.dn), T(x.loc), C(fmtN(x.qty, 1)), C(x.age + ' d', x.aged ? 'bad' : '')], drill: function () { self.setState({ rxRec: self.rxBack(self.rxRecord('lot', x)) }); } }; });
      return msg(fmtN(l.length) + ' lots in ' + scope + (miss ? ' have missing location or movement records.' : ' are held beyond the 180-day target, ' + fmtMT(l.reduce(function (a, x) { return a + x.qty; }, 0)) + ' in all.'), byDist(l), 'Show the ' + fmtN(l.length) + ' lots', function () { self.tablePopup('Lots · ' + scope, '', ['Lot', 'Godown', 'District', 'Location', 'Qty (MT)', 'Age'], rows, null, 'lots'); });
    }
    if (has(['verification', 'inspection', 'verified']) && has(['pending', 'overdue', 'not', 'due'])) {
      const l = gather(verifReg).filter(function (r) { return r.status !== 'Completed' && (!st || r.et === (st === 's2' ? 's2' : 'stor')); });
      const rows = l.map(function (r) { return { name: r.loc, cells: [T(r.type), T(r.dn), T(r.mandal), C('Day ' + r.schedDay), T(r.status, r.status === 'Scheduled' ? '' : 'bad')] }; });
      return msg(fmtN(l.length) + ' locations in ' + scope + ' are not yet physically verified this month (' + fmtN(l.filter(function (r) { return r.status !== 'Scheduled'; }).length) + ' overdue).', byDist(l), 'Show the ' + fmtN(l.length) + ' locations', function () { self.tablePopup('Physical verification pending · ' + scope, '', ['Location', 'Type', 'District', 'Mandal', 'Scheduled', 'Status'], rows, null, 'verification-pending'); });
    }
    return null;
  }

  startDrag(e, el, attr, commit, soft) {
    if (!this.state.editMode) return; /* sections and cards move only in Customise mode */
    if (!e || !el || (e.button !== undefined && e.button !== 0)) return;
    if (e.target && e.target.closest && e.target.closest('.sbtn, .srz, .kctl button')) return;
    const self = this; const x0 = e.clientX, y0 = e.clientY; const grid = el.parentElement; if (!grid) return;
    let ghost = null, tgt = null, after = false, on = false;
    if (!soft && e.preventDefault) e.preventDefault();
    const clear = function () { if (tgt) { tgt.classList.remove('dtgt-b'); tgt.classList.remove('dtgt-a'); } };
    const mv = function (ev) {
      if (!on) {
        if (Math.abs(ev.clientX - x0) + Math.abs(ev.clientY - y0) < 6) return;
        on = true; const r = el.getBoundingClientRect();
        ghost = el.cloneNode(true); ghost.removeAttribute(attr); ghost.classList.add('dghost');
        const st = ghost.style; st.position = 'fixed'; st.left = r.left + 'px'; st.top = r.top + 'px'; st.width = r.width + 'px'; st.height = Math.min(r.height, 360) + 'px'; st.overflow = 'hidden'; st.margin = '0'; st.pointerEvents = 'none'; st.zIndex = '90'; st.order = '0';
        ghost._ox = x0 - r.left; ghost._oy = y0 - r.top; document.body.appendChild(ghost);
        el.classList.add('dsrc'); document.body.classList.add('ucc-dragging');
      }
      if (ev.preventDefault) ev.preventDefault();
      ghost.style.left = (ev.clientX - ghost._ox) + 'px'; ghost.style.top = (ev.clientY - ghost._oy) + 'px';
      let best = null, bd = Infinity;
      Array.prototype.forEach.call(grid.children, function (c) {
        if (c === el || !c.getAttribute || !c.getAttribute(attr)) return;
        const r = c.getBoundingClientRect(); if (!r.width) return;
        const cx = Math.max(r.left, Math.min(ev.clientX, r.right)), cy = Math.max(r.top, Math.min(ev.clientY, r.bottom));
        const d = (cx - ev.clientX) * (cx - ev.clientX) + (cy - ev.clientY) * (cy - ev.clientY);
        if (d < bd) { bd = d; best = c; }
      });
      clear(); tgt = best;
      if (tgt) { const r = tgt.getBoundingClientRect(); const wide = r.width > grid.clientWidth * 0.66; after = wide ? ev.clientY > r.top + r.height / 2 : ev.clientX > r.left + r.width / 2; tgt.classList.add(after ? 'dtgt-a' : 'dtgt-b'); }
      if (ev.clientY < 70) window.scrollBy(0, -16); else if (ev.clientY > window.innerHeight - 70) window.scrollBy(0, 16);
    };
    const up = function () {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      clear(); if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
      el.classList.remove('dsrc'); document.body.classList.remove('ucc-dragging');
      if (on) { self._justDragged = true; setTimeout(function () { self._justDragged = false; }, 120); if (tgt) commit(tgt.getAttribute(attr), after); }
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  }
  /* ---------- Incidents · where in the chain (isometric towers, one per step of the supply chain) ---------- */
  chainFor(list, scopeName) {
    const self = this; const s = this.state;
    const lensK = s.chLens || 'open', splK = s.chSplit || 'none', sel = s.chStep || null;
    const rot = s.chRot || 0, tilt = s.chTilt || 0.453, flip = s.chFlip || 0;
    const LENS = { open: ['All open', function () { return true; }], crit: ['Critical', function (i) { return i.prio === 'P1'; }], esc: ['Escalated', function (i) { return i.status === 'Escalated'; }] };
    const SEVC = { Critical: '#B03A1E', High: '#D9822B', Medium: '#E0B84F', Low: '#9AA8BC' }, STC = { Escalated: '#C8553A', Open: '#2B5FA5', 'In progress': '#7FAED8' };
    const PAL = ['#1F4F86', '#D99A2B', '#5B8FD0', '#C8553A', '#8FB3DA', '#8A6D3B', '#2E7D6B', '#B3A06B', '#6B7A90', '#A3B4C8'];
    const SPL = { none: ['Nothing'], sev: ['Severity', function (i) { return SEV[i.prio]; }, ['Critical', 'High', 'Medium', 'Low'], SEVC], status: ['Status', function (i) { return i.status; }, ['Escalated', 'Open', 'In progress'], STC], src: ['Source', function (i) { return SRC[i.src]; }], dist: ['District', function (i) { return i.dn; }] };
    const inL = list.filter(LENS[lensK] ? LENS[lensK][1] : LENS.open[1]);
    const by = {}; inL.forEach(function (i) { const k = CH_OF[i.title] || 'feed'; (by[k] = by[k] || []).push(i); });
    const SP = SPL[splK] || SPL.none;
    let keys = [];
    if (splK !== 'none') { const tot = {}; inL.forEach(function (i) { const v = SP[1](i); tot[v] = (tot[v] || 0) + 1; }); keys = Object.keys(tot); if (SP[2]) keys = SP[2].filter(function (k) { return tot[k]; }); else if (splK === 'dist') keys = D.map(function (d) { return d.name; }).filter(function (k) { return tot[k]; }); else keys.sort(); if (keys.length > 9) keys = keys.slice(0, 9).concat(['Everything else']); }
    const colOf = {}; keys.forEach(function (k, i) { colOf[k] = (SP[3] && SP[3][k]) || PAL[i % PAL.length]; });
    const keyOf = function (i) { const v = SP[1](i); return keys.indexOf(v) >= 0 ? v : 'Everything else'; };
    /* isometric projection, as in the anomaly dashboard: x runs along the chain, z is height */
    const CA = 64, CTR = 6.5, th = (rot + flip) * Math.PI / 180, cs = Math.cos(th), sn = Math.sin(th);
    const turn = function (x, y) { return [CTR + (x - CTR) * cs - y * sn, (x - CTR) * sn + y * cs]; };
    const cp = function (x, y, z) { const r = turn(x, y); return [(r[0] - r[1]) * CA, (r[0] + r[1]) * CA * tilt - (z || 0)]; };
    const depth = function (x, y) { const r = turn(x, y); return r[0] + r[1]; };
    const FOOT = { gate: [0.22, 0.22], place: [0.25, 0.25], move: [0.30, 0.11], hand: [0.11, 0.30] };
    const BASE = { gate: '#41505D', place: '#2F6B8F', move: '#4F7F9E', hand: '#5E6FA3' };
    const shade = function (hex, f) { const n = parseInt(hex.slice(1), 16); return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(function (v) { return pad(Math.round(v * f).toString(16), 2); }).join(''); };
    const maxN = Math.max(1, Math.max.apply(null, CH_STEPS.map(function (st) { return (by[st.k] || []).length; })));
    const HMAX = 210; const blocks = []; const pts = [];
    const block = function (x, y, z0, z1, wx, wy, fill, extra) {
      const pt = [cp(x - wx, y - wy, z1), cp(x + wx, y - wy, z1), cp(x + wx, y + wy, z1), cp(x - wx, y + wy, z1)];
      const pb = [cp(x - wx, y - wy, z0), cp(x + wx, y - wy, z0), cp(x + wx, y + wy, z0), cp(x - wx, y + wy, z0)];
      const f1 = depth(x + wx, y) > depth(x - wx, y) ? [pb[1], pb[2], pt[2], pt[1]] : [pb[0], pb[3], pt[3], pt[0]];
      const f2 = depth(x, y + wy) > depth(x, y - wy) ? [pb[3], pb[2], pt[2], pt[3]] : [pb[0], pb[1], pt[1], pt[0]];
      pt.concat(pb).forEach(function (p) { pts.push(p); });
      blocks.push(Object.assign({ polys: [f1, f2, pt], fills: [shade(fill, 0.72), shade(fill, 0.55), fill], d: depth(x, y) + z0 / 10000 }, extra || {}));
    };
    const geo = CH_STEPS.map(function (st, i) {
      const l = by[st.k] || []; const n = l.length; const crit = l.filter(function (x) { return x.prio === 'P1'; }).length;
      const h = Math.max(3, Math.sqrt(n / maxN) * HMAX); const f = FOOT[st.t]; const on = sel === st.k;
      const pick = function () { self.setState({ chStep: self.state.chStep === st.k ? null : st.k }); };
      const tip = st.n + ' · ' + (CH_FEED[st.k] ? fmtN(n) + ' ' + (LENS[lensK] || LENS.open)[0].toLowerCase() + (crit ? ' · ' + crit + ' critical' : '') : 'no data feed yet') + ' · click to open';
      const base = on ? '#14202A' : n ? BASE[st.t] : (CH_FEED[st.k] ? '#B8C4CE' : '#DDE3E8');
      if (i > 0) { const pf = FOOT[CH_STEPS[i - 1].t]; block((i - 1 + i) / 2, 0, 0, 2.5, Math.max(0.02, (1 - pf[0] - f[0]) / 2), 0.045, '#C9D3DC', { rib: true }); }
      if (splK === 'none' || !n) block(i, 0, 0, h, f[0], f[1], base, { pick: pick, tip: tip, on: on });
      else { let z = 0; keys.forEach(function (k) { const v = l.filter(function (x) { return keyOf(x) === k; }).length; if (!v) return; const dz = v / n * h; block(i, 0, z, z + dz, f[0], f[1], colOf[k], { pick: pick, tip: st.n + ' · ' + k + ': ' + fmtN(v) + ' · click to open', on: on, slab: true }); z += dz; }); }
      const lab = cp(i, f[1] + 0.30, 0); pts.push([lab[0] - 62, lab[1] + (i % 3) * 60 + 50]); pts.push([lab[0] + 62, lab[1]]);
      return { st: st, i: i, n: n, crit: crit, lab: lab, on: on };
    });
    /* fit everything into the 1140 × 560 drawing */
    const W = 1140, Hh = 560, PADD = 18;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; pts.forEach(function (p) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; });
    const sc = Math.min((W - PADD * 2) / Math.max(1, x1 - x0), (Hh - PADD * 2) / Math.max(1, y1 - y0), 1.9);
    const tx = PADD - x0 * sc + ((W - PADD * 2) - (x1 - x0) * sc) / 2, ty = PADD - y0 * sc + ((Hh - PADD * 2) - (y1 - y0) * sc) / 2;
    const P = function (p) { return [p[0] * sc + tx, p[1] * sc + ty]; };
    const dpath = function (a) { return a.map(function (p, i) { const q = P(p); return (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join('') + 'Z'; };
    const anySel = !!sel;
    const layers = blocks.sort(function (a, b) { return a.d - b.d; }).map(function (b) { return { d1: dpath(b.polys[0]), f1: b.fills[0], d2: dpath(b.polys[1]), f2: b.fills[1], d3: dpath(b.polys[2]), f3: b.fills[2], cls: 'chl' + (b.rib ? ' rib' : '') + (b.slab ? ' slab' : '') + (anySel && !b.on && !b.rib ? ' dim' : ''), pick: b.pick || function () {}, tip: b.tip || '' }; });
    const labels = geo.map(function (g) { const q = P([g.lab[0], g.lab[1] + (g.i % 3) * 60]); const live = CH_FEED[g.st.k] || g.n; return { name: g.st.n, val: live ? fmtN(g.n) + ' ' + ({ open: 'open', crit: 'critical', esc: 'escalated' }[lensK] || 'open') : 'no data yet', valCls: 'chv' + (live ? '' : ' na'), crit: '', hasCrit: false, x: (q[0] / W * 100).toFixed(2), y: (q[1] / Hh * 100).toFixed(2), cls: 'chlab' + (g.on ? ' on' : '') }; });
    const set = function (o) { return function () { self.setState(o); }; };
    const lensBtns = Object.keys(LENS).map(function (k) { const on = lensK === k; return { label: LENS[k][0], on: on, cls: on ? 'on' : '', pick: set({ chLens: k }) }; });
    const splBtns = Object.keys(SPL).map(function (k) { const on = splK === k; return { label: SPL[k][0], on: on, cls: on ? 'on' : '', pick: set({ chSplit: k }) }; });
    const clampR = function (r) { return Math.max(-100, Math.min(15, r)); };
    const tools = { turnL: set({ chRot: clampR(rot - 15) }), turnR: set({ chRot: clampR(rot + 15) }), back: set({ chTilt: Math.min(0.8, tilt + 0.08) }), up: set({ chTilt: Math.max(0.12, tilt - 0.08) }), flip: set({ chFlip: flip ? 0 : 180 }), reset: set({ chRot: 0, chTilt: 0.453, chFlip: 0, chStep: null }),
      drag: function (e) { if (!e || (e.button !== undefined && e.button !== 0)) return; if (e.target && e.target.closest && e.target.closest('path.chp')) return; const x0p = e.clientX, y0p = e.clientY, r0 = self.state.chRot || 0, t0 = self.state.chTilt || 0.453; let raf = 0, last = null; const mv = function (ev) { last = ev; if (raf) return; raf = requestAnimationFrame(function () { raf = 0; if (!last) return; self.setState({ chRot: clampR(r0 + (last.clientX - x0p) * 0.35), chTilt: Math.max(0.12, Math.min(0.8, t0 + (last.clientY - y0p) * 0.002)) }); }); }; const up = function () { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); }; window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); } };
    const legend = keys.map(function (k) { return { label: k, col: colOf[k] }; });
    const T = function (x, t) { return Object.assign(C(x, t || ''), { cls: 'txt' }); };
    const recRows = function (l) { return l.map(function (i) { return { name: i.id, cells: [T(i.title), T(SEV[i.prio], i.prio === 'P1' ? 'bad' : ''), T(i.dn), T(i.mandal), T(SRC[i.src]), T(i.status, i.status === 'Escalated' ? 'bad' : ''), C(i.ageH + ' h')] }; }); };
    const popRecs = function (title, l) { return function () { self.tablePopup(title + ' · ' + scopeName, fmtN(l.length) + ' ' + (LENS[lensK] || LENS.open)[0].toLowerCase() + ' incidents', ['Incident', 'Title', 'Severity', 'District', 'Mandal', 'Source', 'Status', 'Age'], recRows(l), null, 'chain-' + title); }; };
    const allSteps = CH_STEPS.concat(CH_OFFS);
    const stp = sel ? allSteps.filter(function (x) { return x.k === sel; })[0] : null;
    let step = { has: false, title: '', sub: '', what: '', rules: [], open: function () {}, close: function () {}, canOpen: false };
    if (stp) {
      const l = by[stp.k] || []; const titles = Object.keys(CH_OF).filter(function (t) { return CH_OF[t] === stp.k; });
      const rows = titles.map(function (t) { const r = l.filter(function (i) { return i.title === t; }); return { name: t, cells: [T(SRC[(INC_ALL[t] || {}).src] || '—'), T(STAGE_NAME[(INC_ALL[t] || {}).stage] || '—'), C(fmtN(r.length)), C(fmtN(r.filter(function (i) { return i.prio === 'P1'; }).length), r.some(function (i) { return i.prio === 'P1'; }) ? 'bad' : ''), C(fmtN(r.filter(function (i) { return i.status === 'Escalated'; }).length))], drill: r.length ? popRecs(stp.n + ' · ' + t, r) : null }; });
      const tb = this.table(stp.n, '', ['Incident rule', 'Raised by', 'Stage', 'Incidents', 'Critical', 'Escalated'], rows, null, null, 'chain-step');
      step = { has: true, title: stp.n, sub: ({ gate: 'Gate', place: 'Place', move: 'Movement', hand: 'Handover' }[stp.t] || 'Across the chain') + ' · ' + fmtN(l.length) + ' ' + (LENS[lensK] || LENS.open)[0].toLowerCase(), what: stp.what, t: tb, hasRules: rows.length > 0, noRules: !rows.length, canOpen: l.length > 0, open: popRecs(stp.n, l), close: set({ chStep: null }) };
    }
    const stepRows = CH_STEPS.map(function (st) { const l = by[st.k] || []; const live = CH_FEED[st.k] || l.length; return { name: st.n, cells: [T({ gate: 'Gate', place: 'Place', move: 'Movement', hand: 'Handover' }[st.t]), C(fmtN(Object.keys(CH_OF).filter(function (t) { return CH_OF[t] === st.k; }).length)), C(live ? fmtN(l.length) : 'no data yet'), C(live ? fmtN(l.filter(function (i) { return i.prio === 'P1'; }).length) : '', l.some(function (i) { return i.prio === 'P1'; }) ? 'bad' : ''), C(live ? fmtN(l.filter(function (i) { return i.status === 'Escalated'; }).length) : '')], drill: function () { self.setState({ chStep: self.state.chStep === st.k ? null : st.k }); } }; });
    const stepT = this.table('Step by step', '', ['Step', 'What it is', 'Rules', 'Incidents', 'Critical', 'Escalated'], stepRows, null, null, 'chain-steps');
    const off = CH_OFFS.map(function (o) { const l = by[o.k] || []; const on = sel === o.k; return { n: fmtN(l.length), name: o.n, what: o.what, open: l.length ? fmtN(l.length) + ' open' : 'none open', cls: 'chcard' + (on ? ' on' : ''), pick: set({ chStep: on ? null : o.k }) }; });
    const onChain = CH_STEPS.reduce(function (a, st) { return a + (by[st.k] || []).length; }, 0);
    return { count: fmtN(inL.length) + ' ' + (LENS[lensK] || LENS.open)[0].toLowerCase() + ' incidents in ' + scopeName + ' · ' + fmtN(onChain) + ' sit at a step of the chain', lensBtns: lensBtns, splBtns: splBtns, tools: tools, layers: layers, labels: labels, legend: legend, hasLegend: legend.length > 0, step: step, stepT: stepT, showSteps: !sel, off: off, empty: onChain === 0, emptyTxt: 'No incidents of this kind sit at a step of the chain for these filters.' };
  }

  /* ---------- small line chart: actual, plan/target, forecast ---------- */
  lineChart(o) {
    const W = 1000, H = 300, L = 56, Rr = 18, T = 16, B = 34;
    const xs = [], ys = []; (o.series || []).forEach(function (sr) { sr.pts.forEach(function (p) { xs.push(p[0]); ys.push(p[1]); }); }); (o.band || []).forEach(function (p) { xs.push(p[0]); ys.push(p[1]); ys.push(p[2]); });
    if (o.hline) ys.push(o.hline.y);
    const x0 = o.xMin !== undefined ? o.xMin : Math.min.apply(null, xs), x1 = o.xMax !== undefined ? o.xMax : Math.max.apply(null, xs);
    const y0 = o.yMin !== undefined ? o.yMin : Math.min(0, Math.min.apply(null, ys)), y1 = o.yMax !== undefined ? o.yMax : Math.max.apply(null, ys) * 1.08 || 1;
    const X = function (x) { return L + (x - x0) / ((x1 - x0) || 1) * (W - L - Rr); }, Y = function (y) { return T + (1 - (y - y0) / ((y1 - y0) || 1)) * (H - T - B); };
    const path = function (pts) { return pts.length ? pts.map(function (p, i) { return (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1); }).join('') : ''; };
    const S = {}; (o.series || []).forEach(function (sr) { S[sr.k] = path(sr.pts); });
    const band = o.band && o.band.length ? o.band.map(function (p, i) { return (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[2]).toFixed(1); }).join('') + o.band.slice().reverse().map(function (p) { return 'L' + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1); }).join('') + 'Z' : '';
    const yt = []; for (let k = 0; k <= 4; k++) { const v = y0 + (y1 - y0) * k / 4; yt.push({ top: (Y(v) / H * 100).toFixed(2), label: o.yFmt ? o.yFmt(v) : fmtN(v) }); }
    const grid = yt.map(function (t) { const yy = parseFloat(t.top) / 100 * H; return 'M' + L + ' ' + yy.toFixed(1) + 'L' + (W - Rr) + ' ' + yy.toFixed(1); }).join('');
    const vl = (o.vlines || []).map(function (v, k) { return { d: 'M' + X(v.x).toFixed(1) + ' ' + T + 'L' + X(v.x).toFixed(1) + ' ' + (H - B), left: (X(v.x) / W * 100).toFixed(2), label: v.label, top: k % 2 ? 16 : 0 }; });
    const marks = (o.marks || []).map(function (m) { return { left: (X(m.x) / W * 100).toFixed(2), top: (Y(m.y) / H * 100).toFixed(2), label: m.label, cls: 'lcm ' + (m.cls || '') }; });
    return { title: o.title, sub: o.sub || '', dAct: S.act || '', dPlan: S.plan || '', dFc: S.fc || '', dAlt: S.alt || '', dBand: band, dGrid: grid, dH: o.hline ? 'M' + L + ' ' + Y(o.hline.y).toFixed(1) + 'L' + (W - Rr) + ' ' + Y(o.hline.y).toFixed(1) : '', hTop: o.hline ? (Y(o.hline.y) / H * 100).toFixed(2) : '0', hLabel: o.hline ? o.hline.label : '', hasH: !!o.hline, dV1: vl[0] ? vl[0].d : '', dV2: vl[1] ? vl[1].d : '', vl: vl, yt: yt,
      xt: (o.xTicks || []).map(function (t) { return { left: (X(t.x) / W * 100).toFixed(2), label: t.label }; }), marks: marks, legend: o.legend || [], note: o.note || '', has: true };
  }

  seasonChart(sk, v, scopeName) {
    const SH = (SEASONS[sk] || {}).short || '';
    const cum = function (w) { let a = 0; return w.map(function (x) { a += x; return a; }); };
    if (sk === 'proc') {
      const W = MW, CW = cum(W), PW = cum([0.1, 0.3, 0.3, 0.17, 0.09, 0.04]);
      return this.lineChart({ title: 'Procurement progress · ' + SH + ' · ' + scopeName, sub: 'Cumulative paddy procured against the target plan, by month', series: [{ k: 'act', pts: CW.map(function (c, i) { return [i, v.procured * c / CW[CW.length - 1]]; }) }, { k: 'plan', pts: PW.map(function (c, i) { return [i, v.target * c]; }) }], hline: { y: v.target, label: 'Target ' + fmtMT(v.target) }, yMin: 0, yFmt: function (x) { return fmtMT(x); }, xTicks: MONTHS.map(function (m, i) { return { x: i, label: m }; }), marks: [{ x: 5, y: v.procured, label: pct(v.procPct) + ' of target', cls: 'act' }], legend: [{ cls: 'lg-act', label: 'Procured (cumulative)' }, { cls: 'lg-plan', label: 'Target plan' }], note: 'Monthly split follows the season’s arrival pattern; the end point is the procurement figure on the KPI card.' });
    }
    if (sk === 'mill') {
      const wk = 12, pace = v.cmrDel / wk, due = v.cmrDue; const act = [], fc = [];
      for (let i = 0; i <= wk; i++) act.push([i, v.cmrDel * Math.pow(i / wk, 1.15)]);
      for (let i = wk; i <= 20; i++) fc.push([i, Math.min(due, v.cmrDel + pace * (i - wk))]);
      const fin = fc[fc.length - 1][1]; const wkDone = pace ? wk + Math.ceil((due - v.cmrDel) / pace) : null;
      return this.lineChart({ title: 'CMR delivery and forecast · ' + SH + ' · ' + scopeName, sub: 'CMR acknowledged against CMR due, week by week since paddy receipt; dashed = at the current pace', series: [{ k: 'act', pts: act }, { k: 'fc', pts: fc }], hline: { y: due, label: 'CMR due ' + fmtMT(due) }, yMin: 0, yFmt: function (x) { return fmtMT(x); }, vlines: [{ x: wk, label: 'Today' }, { x: 13, label: '3-month deadline' }], xTicks: [0, 4, 8, 12, 16, 20].map(function (w) { return { x: w, label: 'Week ' + w }; }), marks: [{ x: 20, y: fin, label: pct(fin / (due || 1)) + ' by week 20', cls: 'fc' }], legend: [{ cls: 'lg-act', label: 'Acknowledged' }, { cls: 'lg-fc', label: 'Forecast at current pace' }], note: wkDone ? 'At the current pace the remaining ' + fmtMT(due - v.cmrDel) + ' would be acknowledged by week ' + wkDone + (wkDone > 13 ? ', after the 3-month deadline.' : ', within the 3-month deadline.') : '' });
    }
    if (sk === 'between') {
      const iss = v.s2Allot || 1; const act = [], fc = []; const now = 6;
      for (let i = 0; i <= now; i++) act.push([i, Math.min(v.cap * 0.97, v.stock + iss * 0.5 * (now - i))]);
      for (let i = now; i <= 9; i++) fc.push([i, Math.max(0, v.stock - iss * (i - now))]);
      const ML = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
      return this.lineChart({ title: 'Godown stock and forecast · ' + SH + ' · ' + scopeName, sub: 'Stock in buffer godowns against usable capacity; dashed = drawn down at the monthly Stage-II allotment', series: [{ k: 'act', pts: act }, { k: 'fc', pts: fc }], hline: { y: v.cap, label: 'Usable capacity ' + fmtMT(v.cap) }, yMin: 0, yFmt: function (x) { return fmtMT(x); }, vlines: [{ x: now, label: 'Today' }], xTicks: ML.map(function (m, i) { return { x: i, label: m }; }), marks: [{ x: now, y: v.stock, label: pct(v.util) + ' full', cls: 'act' }], legend: [{ cls: 'lg-act', label: 'Stock held' }, { cls: 'lg-fc', label: 'Forecast at allotment rate' }], note: 'Past months are back-filled from today’s stock and the monthly allotment; the forecast assumes no new receipts.' });
    }
    return null;
  }
  startResize(e, el, cols, minSpan, save) {
    if (!this.state.editMode) return;
    if (!e || !el) return;
    if (e.button !== undefined && e.button !== 0) return;
    if (e.preventDefault) e.preventDefault(); if (e.stopPropagation) e.stopPropagation();
    const grid = el.parentElement; if (!grid) return;
    const cs = window.getComputedStyle(grid);
    const inner = grid.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
    const gap = parseFloat(cs.columnGap) || 0;
    const colW = (inner + gap) / cols;
    const r0 = el.getBoundingClientRect();
    const x0 = e.clientX, y0 = e.clientY;
    let span = Math.max(minSpan, Math.min(cols, Math.round((r0.width + gap) / colW))), h = null;
    const prevCol = el.style.gridColumn, prevH = el.style.height;
    el.classList.add('rzing');
    const mv = function (ev) {
      const dx = ev.clientX - x0, dy = ev.clientY - y0;
      span = Math.max(minSpan, Math.min(cols, Math.round((r0.width + dx + gap) / colW)));
      el.style.gridColumn = 'span ' + span;
      if (Math.abs(dy) > 12 || h !== null) { h = Math.max(80, Math.round(r0.height + dy)); el.style.height = h + 'px'; }
    };
    const up = function () {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      el.classList.remove('rzing'); el.style.gridColumn = prevCol; el.style.height = prevH;
      save(span, h);
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  }
  offerFile(filename, text, title) {
    const self = this;
    const fallback = function () { let tried = false; try { const blob = new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8' }); const u = URL.createObjectURL(blob); const an = document.createElement('a'); an.href = u; an.download = filename; document.body.appendChild(an); an.click(); setTimeout(function () { try { document.body.removeChild(an); URL.revokeObjectURL(u); } catch (e2) {} }, 1500); tried = true; } catch (e1) {} self.setState({ modal: { title: title || 'Copy CSV', body: (tried ? 'Your browser was asked to save ' + filename + '. If no file appeared, copy the CSV below' : 'File downloads are not available here, so here is the CSV. Copy it') + ' and paste into Excel or a .csv file.', text: text, msg: '', isShare: false } }); };
    try {
      if (window.claude && typeof window.claude.use === 'function') {
        window.claude.use('downloads').then(function (dl) {
          if (!dl) { fallback(); return; }
          dl.save({ filename: filename, data: text }).then(function () { self.setState({ pvMsg: 'Download started: ' + filename }); }).catch(function (err) { if (err && err.code === 'declined') return; fallback(); });
        }).catch(fallback);
      } else fallback();
    } catch (e) { fallback(); }
  }

  /* ---------- KPI pool ---------- */
  kpiPool(v, go) {
    const self = this;
    const mk = function (label, value, sub, t, to, rep) { return { label: label, value: value, sub: sub, t: t || '', to: to, rep: !!rep }; };
    return {
      proc: mk('Procurement target achieved', pct(v.procPct), fmtN(v.procured) + ' of ' + fmtN(v.target) + ' MT', tone(v.procPct, 0.95, 0.8), ['proc', 'overview'], true),
      gap: mk('Gap to target', fmtN(Math.max(0, v.target - v.procured)) + ' MT', 'remaining to procure', tone(v.procPct, 0.95, 0.8), ['proc', 'overview'], true),
      ppcAct: mk('PPCs active', pct(v.ppcPct), fmtN(v.ppcAct) + ' of ' + fmtN(v.rsk) + ' PPCs', tone(v.ppcPct, 0.9, 0.8), ['proc', 'overview'], true),
      millReady: mk('Mill readiness', pct(v.millReady), fmtN(v.millsAct) + ' of ' + fmtN(v.mills) + ' mills received paddy', tone(v.millReady, 0.85, 0.7), ['cmr', 'overview'], true),
      farmPaid: mk('Farmers paid', fmtN(v.farmPaidPct * 100, 2) + '%', '₹' + fmtN(v.paid, 2) + ' Cr of ₹' + fmtN(v.valueCr, 2) + ' Cr', tone(v.farmPaidPct, 0.99, 0.95), ['proc', 'fin'], true),
      pay24: mk('Paid within 24 hours', pct(v.pay24), v.pay24 >= 1 ? 'Achievement · every farmer paid within 24 h' : '24–48 h: ' + pct(v.pay2448) + ' · over 48 h: ' + pct(v.payLate), v.pay24 >= 1 ? 'good' : tone(v.pay24, 0.9, 0.8), ['proc', 'fin'], true),
      pay: mk('Farmer payments pending', fmtCr(v.pending), fmtN(v.farmersPend) + ' farmers · avg ' + fmtN(v.payDays, 1) + ' days to pay', tone(v.pending / (v.valueCr || 1), 0.05, 0.1, false), ['proc', 'fin']),
      paid: mk('Farmer payments made', fmtCr(v.paid), fmtN(v.farmers - v.farmersPend) + ' farmers paid', '', ['proc', 'fin']),
      farmers: mk('Farmers who sold paddy', fmtN(v.farmers), fmtN(v.farmersPend) + ' still awaiting payment', '', ['proc', 'overview']),
      moist: mk('Avg moisture at RSKs', fmtN(v.moisture, 1) + '%', 'FAQ limit 17%', tone(v.moisture, 16.5, 17, false), ['proc', 'overview']),
      rsk: mk('PPCs (RSK clusters)', fmtN(v.rsk), fmtN(v.ppcAct) + ' have started procuring', '', ['all', 'glance']),
      prep: mk('Season preparedness', pct(v.prep), 'average of 17 parameters', tone(v.prep, 0.7, 0.5), ['all', 'prep']),
      p1: mk('Open critical incidents', fmtN(v.p1), fmtN(v.alerts) + ' open incidents in total', tone(v.p1, 0, 2, false), ['all', 'alerts']),
      tripc: mk('Trip completion', pct(v.tripPct), fmtN(v.tripsC) + ' of ' + fmtN(v.tripsT) + ' trips · ' + fmtN(v.tripsI) + ' in transit', tone(v.tripPct, 0.6, 0.4), ['all', 'gps']),
      gps: mk('Vehicle route deviations', fmtN(v.vehDev), fmtN(v.veh) + ' vehicles tracked today', tone(v.vehDev / (v.veh || 1), 0.02, 0.04, false), ['all', 'gps']),
      cctv: mk('CCTV cameras online', pct(v.camOnline), fmtN(v.camsOff) + ' offline of ' + fmtN(v.cams), tone(v.camOnline, 0.95, 0.9), ['all', 'cctv']),
      cmr: mk('CMR delivered', pct(v.cmrPct), fmtMT(v.cmrDel) + ' of ' + fmtMT(v.cmrDue) + ' due', tone(v.cmrPct, 0.6, 0.45), ['cmr', 'overview']),
      cmrShort: mk('CMR shortfall', fmtMT(v.cmrShort), 'still due from mills', tone(v.cmrPct, 0.6, 0.45), ['cmr', 'overview']),
      mills: mk('Rice mills tagged', fmtN(v.mills), 'delivering CMR this season', '', ['cmr', 'overview']),
      millAnom: mk('Mill anomalies', fmtN(v.millAnom), 'flagged by the anomaly engine', tone(v.millAnom, 2, 8, false), ['cmr', 'alerts']),
      s1: mk('Stage-I moved', pct(v.s1Pct), fmtMT(v.s1Moved) + ' of ' + fmtMT(v.s1Plan) + ' planned', tone(v.s1Pct, 0.9, 0.8), ['s1', 'overview']),
      trips: mk('Stage-I trips', fmtN(v.trips), fmtN(v.transit) + ' trucks in transit now', '', ['s1', 'gps']),
      s1dev: mk('Stage-I deviations', fmtN(v.s1Dev), 'GPS route deviations', tone(v.s1Dev, 3, 10, false), ['s1', 'gps']),
      s2: mk('Stage-II to FPS', pct(v.s2Pct), fmtMT(v.s2Fps) + ' delivered of ' + fmtMT(v.s2Allot), tone(v.s2Pct, 0.85, 0.7), ['s2', 'overview']),
      s2lift: mk('Lifted from MLS', fmtMT(v.s2Lift), 'picked up from MLS points for FPS delivery this month', '', ['s2', 'overview']),
      mls: mk('MLS points', fmtN(v.mls), fmtN(v.insp) + ' inspections pending', tone(v.insp, 5, 20, false), ['s2', 'glance']),
      fps: mk('Distributed to beneficiaries', pct(v.distPct), fmtN(v.cards) + ' ration cards · ' + fmtN(v.fps) + ' FPS', tone(v.distPct, 0.9, 0.8), ['s2', 'overview']),
      stor: mk('Godown utilisation', pct(v.util), fmtMT(v.stock) + ' in ' + fmtMT(v.cap) + ' capacity', tone(v.util, 0.85, 0.93, false), ['stor', 'overview']),
      aged: mk('Stock aged > 6 months', fmtMT(v.aged), pct(v.aged / (v.stock || 1)) + ' of stock', tone(v.aged / (v.stock || 1), 0.08, 0.14, false), ['stor', 'overview']),
      godowns: mk('Buffer godowns', fmtN(v.godowns), fmtMT(v.cap) + ' capacity', '', ['stor', 'overview']),
      bg: mk('Miller bank guarantees', fmtCr(v.bg), 'held against CMR', '', ['cmr', 'fin']),
      trans: mk('GLT charges pending', fmtCr(v.transPend), 'gunny, labour & transport (paddy procurement)', '', ['proc', 'fin']),
      ham: mk('Miller incidental charges', fmtCr(v.hamPend), 'rice mills · pending settlement', '', ['cmr', 'fin']),
      storch: mk('Storage charges', fmtCr(v.storCh), 'this season', '', ['stor', 'fin'])
    };
  }
  mkK(label, value, sub, t, key, extraInfo) {
    const self = this; const I = KINFO[key] || null;
    const info = extraInfo || (I ? { def: I[0], calc: I[1], field: I[2], dir: I[3], fmt: I[4], tone: I[5], go: I[6], drill: I[7] } : { def: '', calc: '', drill: '' });
    const id = 'k:' + label; const open = !!(this.state.kpiOpen && this.state.kpiOpen.id === id);
    return { _info: info, label: label, value: value, sub: sub, rep: false, vcls: 'kv ' + (t || ''), cls: 'kpi' + (open ? ' on' : ''), open: open, info: function () { self.setState({ kpiOpen: open ? null : { id: id, key: key, label: label, value: value, sub: sub, info: info }, kpiRec: false, kQ: '' }); } };
  }
  kpiList(keys, v, priKeys) {
    const self = this; const pool = this.kpiPool(v);
    return keys.map(function (k) {
      const p = pool[k];
      const pri = priKeys ? priKeys.indexOf(k) >= 0 && priKeys.indexOf(k) < 3 : false;
      const kk = self.mkK(p.label, p.value, p.sub, p.t, k); kk.rep = p.rep && self._isState; return kk;
      return { go: function () { if (p.to[1] === 'glance') self.setState({ module: 'glance', glance: p.to[0] === 's2' ? 'mls' : 'rsk', stage: 'all', pivot: false, path: self.curPath().slice(0, 1) }); else self.go(p.to[0], p.to[1]); } };
    });
  }

  /* ---------- page builders ---------- */
  nodeVals(path, depthMax) {
    const p = path.slice(0, depthMax);
    if (p.length === 0) return stateVals();
    if (p.length === 1) return distVals(p[0]);
    const m = mandalById(p[1]); return m ? m.v : distVals(p[0]);
  }
  childrenAt(path, et) {
    if (path.length === 0) return D.map(function (d) { return { id: d.name, name: d.name, v: distVals(d.name) }; });
    if (path.length === 1) return mandalsOf(path[0]);
    return entsOf(path[1], et);
  }
  barsFrom(list, key, dir, fmt, toneFn, n) {
    const arr = list.slice().sort(function (a, b) { return dir * (a.v[key] - b.v[key]); }).slice(0, n || 6);
    const max = Math.max.apply(null, arr.map(function (x) { return Math.abs(x.v[key]); }).concat([1e-9]));
    const isPct = ['procPct', 'cmrPct', 's1Pct', 's2Pct', 'util', 'prep', 'distPct', 'pay24', 'ppcPct', 'millReady', 'kycPct', 'actPct', 'idlePct', 'inactPct', 'tripPct', 'camOnline', 'farmPaidPct', 'payVal', 'psaPct', 'vehApprPct', 'liftPct'].indexOf(key) >= 0 || (key === '_x' && this._pctX);
    return arr.map(function (x) { const t = toneFn(x.v); return { label: x.name, w: Math.max(2, Math.min(100, Math.round((isPct ? x.v[key] : x.v[key] / max) * 100))), v: fmt(x.v[key]), c: TONE_C[t] }; });
  }
  /* ---------- CMR / mill page: obligation, acknowledgement, turnaround, overdue ---------- */
  cmrPage(page, path, depth, scopeName, SE) {
    const self = this;
    const st = depth >= 3 && ENT[path[2]] ? cmrAgg([ENT[path[2]]]) : cmrStatsPath(path.slice(0, 2));
    const asOf = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    page.hasPeriod = true; page.period = 'Reporting period: ' + (SE.short || 'All seasons') + ', season to date · as of ' + asOf + ' · quantities in MT of rice · CMR due = paddy acknowledged at mill × outturn ratio 67% (SoP KMS 2025-26)';
    const k = function (label, value, sub, t, key, info) { return self.mkK(label, value, sub, t, key, info); };
    const D3 = function (f) { return function (dn) { return cmrStatsDist(dn); }; };
    const fm = function (x) { return fmtMT(x); };
    const cards = [
      k('CMR delivered vs obligation', pct(st.pct), fmtMT(st.ack) + ' acknowledged of ' + fmtMT(st.due) + ' due', tone(st.pct, 0.6, 0.45), 'cmrObl', { def: 'CMR acknowledged at the receiving godown against the CMR due from mills. A consignment counts only after the Godown Manager records the CMR truck acknowledgement; dispatched trucks still on the road are not counted.', calc: 'CMR acknowledged ÷ CMR due × 100 · CMR due = paddy acknowledged at the mill × outturn ratio (67% raw rice)', drill: 'Season → district → mandal → mill → consignment', rec: 'mills', tab: { f: D3(), cols: [['CMR due', 'due', 'mt'], ['Acknowledged', 'ack', 'mt']], res: ['% acknowledged', function (o) { return o.ack / (o.due || 1); }, pct, function (x) { return tone(x, 0.6, 0.45); }] } }),
      k('Balance pending', fmtMT(st.bal), fmtMT(st.transit) + ' dispatched, awaiting acknowledgement', st.bal / (st.due || 1) > 0.5 ? 'bad' : 'warn', 'cmrBal', { def: 'CMR still owed by mills: due minus acknowledged. Part of it is already on trucks to godowns (dispatched, awaiting acknowledgement); the rest has not been dispatched yet.', calc: 'CMR due − CMR acknowledged · split into dispatched-awaiting-acknowledgement and not yet dispatched', drill: 'District → mandal → mill', rec: 'mills:pending', tab: { f: D3(), cols: [['CMR due', 'due', 'mt'], ['Acknowledged', 'ack', 'mt'], ['Dispatched, awaiting ACK', 'transit', 'mt']], res: ['Balance pending', function (o) { return o.bal; }, fm] } }),
      k('Milling turnaround', st.turnAvg === null ? 'Data unavailable' : fmtN(st.turnAvg, 1) + ' days', st.turnAvg === null ? 'no mill has both dates yet' : 'paddy receipt → first CMR delivery · ' + fmtN(st.late15) + ' mills over 15 days', st.turnAvg === null ? '' : tone(st.turnAvg, 12, 16, false), 'cmrTurn', { def: 'How long mills take to start returning rice: days from the first paddy acknowledged at the mill to its first CMR delivery. Mills over 15 days are the source system’s 15-day flag.', calc: 'cmr_start_date − paddy_ack_date per mill (RNIT mill feed), averaged over mills that have both dates', drill: 'District → mandal → mill', rec: 'mills:late', tab: { f: D3(), cols: [['Mills with both dates', 'nTurn', 'n'], ['Mills over 15 days', 'late15', 'n']], res: ['Avg turnaround', function (o) { return o.nTurn ? o.turnSum / o.nTurn : null; }, function (x) { return x === null ? 'No data' : fmtN(x, 1) + ' days'; }, function (x) { return x === null ? '' : tone(x, 12, 16, false); }] } }),
      k('Mills with overdue balance', fmtN(st.overdueN), fmtMT(st.overdueQty) + ' pending beyond 3 months of paddy receipt', st.overdueN ? 'bad' : 'good', 'cmrOver', { def: 'Mills that still owe CMR more than three months after they first received paddy. The SoP requires the entire CMR to be delivered within three months of procurement; defaults can lead to bank guarantee invocation and penalty.', calc: 'Count of mills where (today − first paddy acknowledgement) > 90 days and balance pending > 2% of due', drill: 'District → mandal → mill', rec: 'mills:overdue', tab: { f: D3(), cols: [['Mills that received paddy', 'rcv', 'n'], ['Overdue balance', 'overdueQty', 'mt']], res: ['Overdue mills', function (o) { return o.overdueN; }, function (x) { return fmtN(x); }, function (x) { return x ? 'bad' : 'good'; }] } }),
      k('CMR obligation · CSC / FCI', 'Integration required', 'agency-wise obligation not in the source feed', '', 'cmrAgency', { def: 'CMR delivered against obligation separately for the State pool (CSC) and FCI. Millers deliver CMR to APSCSCL and FCI as per allotted targets, but the integrated mill feeds carry only total CMR acknowledged per mill.', calc: 'Per agency: CMR acknowledged ÷ CMR obligation allotted to that agency × 100', drill: 'Agency → district → mill', unavail: 'Integration required. The agency-wise CMR obligation (allotment orders for CSC and FCI) and agency-tagged acknowledgements are not in the integrated feeds, so no split is shown. Once connected, this tab will show due, acknowledged and balance for CSC and FCI separately by district.' })
    ];
    cards.forEach(function (c) { const t = c._info && c._info.tab; if (t) { t.fm = function (mid) { return cmrStatsMandal(mid); }; t.fe = function (e) { return cmrAgg([e]); }; t.et = 'cmr'; } });
    const pool = page.kpis; const by = {}; pool.forEach(function (x) { by[x.label] = x; });
    page.kpis = cards.slice(0, 4).concat([by['Mill readiness'], by['Mill anomalies'], by['Miller bank guarantees'], by['Miller incidental charges']].filter(Boolean));
    page.kpis.forEach(function (x) { if (x.value === 'Integration required' || x.value === 'Data unavailable') x.vcls = 'kv na'; });
    /* outstanding obligations list */
    if (depth <= 2) {
      const mills = depth === 0 ? [].concat.apply([], D.map(function (d) { return entsOfDistrict(d.name, 'cmr'); })) : depth === 1 ? entsOfDistrict(path[0], 'cmr') : entsOf(path[1], 'cmr');
      const od = mills.filter(function (e) { return millCmr(e).overdue; });
      const T = function (x) { return Object.assign(C(x), { cls: 'txt' }); };
      const rows = od.slice(0, 40).map(function (e) { const c = millCmr(e); return { name: e.name, cells: [T(e.dn), T(LBL[e.mid]), C(fmtD(c.paddyAgo)), C(fmtN(c.paddyAgo) + ' d'), C(fmtMT(c.due)), C(fmtMT(c.ack)), C(fmtMT(c.bal), 'bad'), C(fmtMT(c.transit)), Object.assign(C(c.status, 'bad'), { cls: 'txt' })], drill: function () { self.setState({ path: [e.dn, e.mid, e.id], kpiOpen: null }); } }; });
      page.hasT2 = true;
      page.t2 = this.table('Outstanding CMR obligations · overdue mills · ' + scopeName, od.length ? (od.length > 40 ? 'Showing 40 of ' + od.length + ' overdue mills' : od.length + ' overdue mill' + (od.length > 1 ? 's' : '')) + ' in district and mandal order · balance still pending more than 3 months after the mill first received paddy · click a mill to open it' : 'No mill in ' + scopeName + ' has a balance pending beyond 3 months of paddy receipt.', ['Rice mill', 'District', 'Mandal', 'Paddy first received', 'Days since', 'CMR due', 'Acknowledged', 'Balance pending', 'Dispatched, awaiting ACK', 'Status'], rows, null, null, 'cmr-overdue-' + scopeName);
      page.t2.empty = od.length === 0;
    }
    /* mill summary (mill page) */
    if (depth === 3 && ENT[path[2]]) {
      const e = ENT[path[2]]; const c = millCmr(e);
      page.hasFacts = true; page.factsTitle = 'CMR obligation · ' + e.name;
      page.facts = c.rcv ? [
        { k: 'Paddy first received at mill', v: fmtD(c.paddyAgo) + ' (' + c.paddyAgo + ' days ago)' },
        { k: 'First CMR delivery', v: c.started ? fmtD(c.paddyAgo - c.turn) : 'Not started' },
        { k: 'Milling turnaround', v: c.started ? c.turn + ' days' + (c.turn > 15 ? ' · over 15 days' : '') : '—' },
        { k: 'CMR due (OTR 67%)', v: fmtMT(c.due) },
        { k: 'Acknowledged at godown', v: fmtMT(c.ack) + ' · ' + pct(c.ack / (c.due || 1)) },
        { k: 'Dispatched, awaiting ACK', v: fmtMT(c.transit) },
        { k: 'Balance pending', v: fmtMT(c.bal) },
        { k: 'Status', v: c.status }
      ] : [{ k: 'Status', v: 'Paddy not yet received · no CMR obligation' }];
    }
  }
  /* Overview: stage status on the flow nodes (state → districts, district → mandals) */
  flowStatus(flow, kids, depth) {
    const lvl = depth === 0 ? 'district' : 'mandal';
    flow.forEach(function (f) {
      const r = f._r; if (!r) return;
      const ks = kids.filter(function (k) { return !r[4] || k.v[r[4]] > 0; }); if (!ks.length) return;
      const tt = function (k) { return tone(k.v[r[0]], r[1], r[2], r[3]); };
      const bad = ks.filter(function (k) { return tt(k) === 'bad'; }).length, warn = ks.filter(function (k) { return tt(k) === 'warn'; }).length;
      f.hasSt = true;
      f.st = bad ? bad + ' ' + lvl + (bad > 1 ? 's' : '') + ' below' : warn ? warn + ' ' + lvl + (warn > 1 ? 's' : '') + ' to watch' : 'All ' + lvl + 's on track';
      f.stCls = 'pst ' + (bad ? 'bad' : warn ? 'warn' : 'good');
      f.tip = f.tip.replace(' · click to open', '') + ' · ' + ks.length + ' ' + lvl + 's: ' + bad + ' below threshold, ' + warn + ' to watch · click to open';
    });
  }
  overviewStatus(path, v, kids, depth, scopeName, SE) {
    const self = this; const s = this.state;
    const lvl = depth === 0 ? 'District' : 'Mandal'; const lvlS = lvl.toLowerCase();
    const now = new Date(); const asOf = 'Reporting date ' + now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ' · ' + (SE.short || 'All seasons') + ', to date';
    const dnOf = function (k) { return depth === 0 ? k.name : path[0]; };
    const pathOf = function (k, stageMod) { return depth === 0 ? [k.name] : (stageMod ? [path[0], k.id] : [path[0]]); };
    /* ---- pending quantity by stage (only stages with quantities in the source data) ---- */
    const PQ = [
      ['CMR', 'Awaiting milling & CMR delivery', function (x) { return Math.max(0, x.cmrDue - x.cmrDel); }, function (x) { return x.cmrDue; }, 'CMR due', ['cmr', 'overview'], 'CMR due − CMR delivered (TCS CMR delivery)'],
      ['Stage-I', 'Awaiting dispatch to MLS points', function (x) { return Math.max(0, x.s1Plan - x.s1Moved); }, function (x) { return x.s1Plan; }, 'Stage-I plan', ['s1', 'overview'], 'Stage-I planned − moved (TCS Stage-I)'],
      ['Stage-II', 'Awaiting lifting at MLS points', function (x) { return Math.max(0, x.s2Allot - x.s2Lift); }, function (x) { return x.s2Allot; }, 'allotment', ['s2', 'overview'], 'Allotment − lifted from MLS (NIC Stage-II)'],
      ['Stage-II', 'Awaiting receipt at FPS (in transit)', function (x) { return Math.max(0, x.s2Lift - x.s2Fps); }, function (x) { return x.s2Lift; }, 'lifted', ['s2', 'overview'], 'Lifted from MLS − delivered to FPS (NIC Stage-II, ePoS receipt)'],
      ['FPS', 'Awaiting distribution to beneficiaries', function (x) { return Math.max(0, x.s2Fps - x.dist); }, function (x) { return x.s2Fps; }, 'received at FPS', ['all', 'glance'], 'Received at FPS − distributed (NIC ePoS)']
    ];
    const goTo = function (g, k) { return function () { if (g[1] === 'glance') self.setState({ module: 'glance', glance: 'fps', stage: 'all', pivot: false, kpiOpen: null, path: k ? [dnOf(k)] : self.curPath().slice(0, 1) }); else self.go(g[0], g[1], k ? pathOf(k, g[1] === 'overview') : undefined); }; };
    const TT = function (x, t) { return Object.assign(C(x, t || ''), { cls: 'txt' }); };
    /* layered drill: district → mandal → site (mill / route / MLS point / FPS) → site record */
    const PQ_ET = { 'Awaiting milling & CMR delivery': ['cmr', 'Rice mill'], 'Awaiting dispatch to MLS points': ['s1', 'Route'], 'Awaiting lifting at MLS points': ['s2', 'MLS point'], 'Awaiting receipt at FPS (in transit)': ['fps', 'Fair price shop'], 'Awaiting distribution to beneficiaries': ['fps', 'Fair price shop'] };
    const B4 = function (q) { return q[4].charAt(0).toUpperCase() + q[4].slice(1) + ' (MT)'; };
    const pqCells = function (q, vv) { const x = q[2](vv), b = q[3](vv); return [C(fmtN(x)), C(fmtN(b)), C(pct(x / (b || 1)), x / (b || 1) > 0.3 ? 'bad' : x / (b || 1) > 0.15 ? 'warn' : '')]; };
    const pqSite = function (q, dn, m) { const et = PQ_ET[q[1]]; const ents = entsOf(m.id, et[0]).filter(function (e) { return q[3](e.v) > 0; }); if (!ents.length) return null;
      return function () {
        const rows = ents.map(function (e) { const ce = pqCells(q, e.v); return { name: e.name + ' ›', cells: ce, drill: function () { self.setState({ rxRec: { back: self.state.rxRec || null, title: e.name, sub: et[1] + ' · ' + m.name + ', ' + dn + ' · ' + q[0] + ' · ' + q[1], facts: [{ k: 'Pending', v: ce[0].v + ' MT' }, { k: B4(q).replace(' (MT)', ''), v: ce[1].v + ' MT' }, { k: 'Share pending', v: ce[2].v }, { k: 'How it is measured', v: q[6] }].concat(mstFacts(e)), steps: [], links: [] } }); } }; });
        self.tablePopup(q[0] + ' · ' + q[1] + ' · ' + m.name + ', ' + dn, fmtN(ents.length) + ' ' + et[1].toLowerCase() + (ents.length === 1 ? '' : 's') + ' · click one for its record', [et[1], 'Pending (MT)', B4(q), 'Share pending'], rows, pqCells(q, m.v), 'pending-' + q[0] + '-' + m.name);
      }; };
    const pqMandals = function (q, dn) { return function () {
      const rows = mandalsOf(dn).filter(function (m) { return q[3](m.v) > 0; }).map(function (m) { const d = pqSite(q, dn, m); return { name: m.name + (d ? ' ›' : ''), cells: pqCells(q, m.v), drill: d }; });
      self.tablePopup(q[0] + ' · ' + q[1] + ' · ' + dn, q[6] + ' · by mandal · click a mandal for its ' + PQ_ET[q[1]][1].toLowerCase() + 's', ['Mandal', 'Pending (MT)', B4(q), 'Share pending'], rows, pqCells(q, distVals(dn)), 'pending-' + q[0] + '-' + dn);
    }; };
    const pendPop = function (q) { return function () {
      const rows = kids.filter(function (k) { return q[3](k.v) > 0; }).map(function (k) { const d = depth === 0 ? pqMandals(q, k.name) : pqSite(q, path[0], k); return { name: k.name + (d ? ' ›' : ''), cells: pqCells(q, k.v), drill: d }; });
      const tot = q[2](v), b0 = q[3](v);
      self.tablePopup(q[0] + ' · ' + q[1] + ' · ' + scopeName, q[6] + ' · by ' + lvlS + ', in ' + lvlS + ' order · click a ' + lvlS + ' to go down a level, to the individual site record', [lvl, 'Pending (MT)', q[4].charAt(0).toUpperCase() + q[4].slice(1) + ' (MT)', 'Share pending'], rows, [C(fmtN(tot)), C(fmtN(b0)), C(pct(tot / (b0 || 1)))], 'pending-' + q[0], [{ label: 'Open ' + (q[5][1] === 'glance' ? 'fair price shops' : STAGE_NAME[q[5][0]]) + ' tab', go: function () { self.setState({ rxRec: null }); goTo(q[5])(); } }]);
    }; };
    if ((self._lenses || []).length > 1) { const keepPQ = []; self._lenses.forEach(function (L) { (L === 'mill' ? [0, 1] : L === 'between' ? [2, 3, 4] : []).forEach(function (j) { if (keepPQ.indexOf(j) < 0) keepPQ.push(j); }); }); keepPQ.sort(); const p0 = PQ.slice(); PQ.length = 0; keepPQ.forEach(function (j) { PQ.push(p0[j]); }); }
    else if (SE === SEASONS.mill) PQ.splice(2, 3); else if (SE === SEASONS.between) PQ.splice(0, 2);
    const pend = PQ.map(function (q) {
      const tot = q[2](v), base = q[3](v); const sh = tot / (base || 1);
      let hi = null; kids.forEach(function (k) { const x = q[2](k.v); if (!hi || x > hi.x) hi = { name: k.name, x: x }; });
      return { stage: q[0], label: q[1], qty: fmtMT(tot), w: Math.max(1, Math.min(100, Math.round(sh * 100))), share: pct(sh), high: hi ? hi.name + ' · ' + fmtMT(hi.x) : '—', tip: q[6] + ' · ' + pct(sh) + ' of ' + q[4] + ' · click for ' + lvlS + 's, then mandals and sites, down to the record', go: pendPop(q) };
    });
    const na = []; /* rows without source data are not shown */
    /* ---- district × stage matrix ---- */
    const camAt = function (dn) { const l = camerasOf(dn); return { n: l.length, on: l.filter(function (c) { return c.status !== 'Offline'; }).length }; };
    const critAt = function (dn) { return incidentsOf(dn).filter(function (i) { return i.prio === 'P1' && self.inWin(i.ageH); }).length; };
    const devAt = function (dn) { return vehiclesOf(dn).filter(function (x) { return x.status === 'Deviated'; }).length; };
    const rowsRaw = kids.map(function (k) {
      const o = { k: k, v: k.v };
      if (depth === 0) { o.crit = critAt(k.name); o.dev = devAt(k.name); const c = camAt(k.name); o.camN = c.n; o.camOn = c.on; }
      else { o.crit = k.v.p1; o.dev = k.v.vehDev; o.camN = k.v.cams; o.camOn = k.v.cams - k.v.camsOff; }
      o.cam = o.camOn / (o.camN || 1); return o;
    });
    const n0 = function (x) { return fmtN(x); };
    const COLS = [
      ['Procurement vs target', '% of target', function (o) { return o.v.procPct; }, pct, [0.95, 0.8, true], ['proc', 'overview'], 'Paddy procured ÷ procurement target'],
      ['Farmers paid ≤ 24 h', '% of payments', function (o) { return o.v.pay24; }, pct, [0.9, 0.8, true], ['proc', 'fin'], 'Payments credited within 24 h ÷ all farmer payments'],
      ['CMR delivered', '% of CMR due', function (o) { return o.v.cmrDue > 0 ? o.v.cmrPct : null; }, function (x) { return x === null ? '—' : pct(x); }, [0.6, 0.45, true], ['cmr', 'overview'], 'CMR acknowledged ÷ CMR due'],
      ['Stage-I moved', '% of plan', function (o) { return o.v.s1Pct; }, pct, [0.9, 0.8, true], ['s1', 'overview'], 'Moved to MLS points ÷ planned'],
      ['Stage-II to FPS', '% of allotment', function (o) { return o.v.s2Pct; }, pct, [0.85, 0.7, true], ['s2', 'overview'], 'Delivered to FPS ÷ allotment'],
      ['Godown utilisation', '% of capacity', function (o) { return o.v.util; }, pct, [0.85, 0.93, false], ['stor', 'overview'], 'Stock held ÷ godown capacity (higher is tighter)'],
      ['Critical incidents', 'open, count', function (o) { return o.crit; }, n0, [0, 2, false], ['all', 'alerts'], 'Open critical incidents', ' open'],
      ['GPS route deviations', 'vehicles today', function (o) { return o.dev; }, n0, [2, 6, false], ['all', 'gps'], 'Vehicles more than 5 km off route', ' vehicles off route'],
      ['CCTV online', '% of cameras', function (o) { return o.cam; }, pct, [0.95, 0.9, true], ['all', 'cctv'], 'Cameras online ÷ cameras installed']
    ];
    { const OL = { proc: [0, 1, 6, 7], mill: [2, 3, 7, 6], between: [5, 4, 8, 6] }; let ORDC = (self._lenses || []).length > 1 ? [] : SE === SEASONS.proc ? OL.proc : SE === SEASONS.mill ? OL.mill : SE === SEASONS.between ? OL.between : null;
      if (ORDC && !ORDC.length) { self._lenses.forEach(function (L) { OL[L].forEach(function (j) { if (ORDC.indexOf(j) < 0) ORDC.push(j); }); }); ORDC = ORDC.filter(function (j) { return j < 6; }).concat(ORDC.filter(function (j) { return j >= 6; })); } if (ORDC) { const c0 = COLS.slice(); COLS.length = 0; ORDC.forEach(function (j) { COLS.push(c0[j]); }); } }
    const tn = function (c, x) { return tone(x, c[4][0], c[4][1], c[4][2]); };
    const STL = { good: 'On track', warn: 'Watch', bad: 'Below threshold', '': '—' };
    const MET = { 'Procurement vs target': ['proc', 'RSK'], 'Farmers paid ≤ 24 h': ['proc', 'RSK'], 'CMR delivered': ['cmr', 'Rice mill'], 'Stage-I moved': ['s1', 'Route'], 'Stage-II to FPS': ['s2', 'MLS point'], 'Godown utilisation': ['stor', 'Buffer godown'] };
    const oV = function (vv) { return { v: vv, crit: vv.p1, dev: vv.vehDev, cam: (vv.cams - vv.camsOff) / (vv.cams || 1), camN: vv.cams }; };
    const mCells = function (c, o) { const x = c[2](o); const t = x === null ? '' : tn(c, x); return [C(c[3](x), t), TT(STL[t], t)]; };
    const sevC = function (i) { return TT(SEV[i.prio], i.prio === 'P1' ? 'bad' : ''); };
    /* the bottom level of a measure in one mandal: sites with their record, or the incident / vehicle / camera records */
    const measLeaf = function (c, dn, m) {
      const et = MET[c[0]]; const sub = c[6];
      if (et) { const ents = entsOf(m.id, et[0]).filter(function (e) { return c[2](oV(e.v)) !== null; }); if (!ents.length) return null;
        return function () { const rows = ents.map(function (e) { const ce = mCells(c, oV(e.v)); return { name: e.name + ' ›', cells: ce, drill: function () { self.setState({ rxRec: { back: self.state.rxRec || null, title: e.name, sub: et[1] + ' · ' + m.name + ', ' + dn + ' · ' + c[0], facts: [{ k: c[0], v: ce[0].v + ' (' + c[1] + ')' }, { k: 'Status', v: ce[1].v }, { k: 'How it is measured', v: sub }].concat(mstFacts(e)), steps: [], links: [] } }); } }; });
          self.tablePopup(c[0] + ' · ' + m.name + ', ' + dn, sub + ' · ' + fmtN(ents.length) + ' ' + et[1].toLowerCase() + (ents.length === 1 ? '' : 's') + ' · click one for its record', [et[1], c[0] + ' (' + c[1] + ')', 'Status'], rows, mCells(c, oV(m.v)), 'measure-' + c[0] + '-' + m.name); }; }
      if (c[0] === 'Critical incidents') { const l = incidentsOf(dn).filter(function (i) { return i.mandal === m.name && i.prio === 'P1' && self.inWin(i.ageH); }); if (!l.length) return null;
        return function () { self.tablePopup('Critical incidents · ' + m.name + ', ' + dn, fmtN(l.length) + ' open · click one for its records', ['Incident ID', 'Incident', 'Stage · point', 'Severity', 'Status', 'Age'], l.map(function (i) { return { name: i.id, cells: [TT(i.title), TT(STAGE_NAME[i.stage] + ' · ' + i.ent), sevC(i), TT(i.status + (i.escTo ? ' · to ' + i.escTo : '')), C(i.ageH + ' h')], drill: function () { self.setState({ rxRec: self.rxBack(self.incRec(i)) }); } }; }), null, 'critical-' + m.name); }; }
      if (c[0] === 'CCTV online') { const l = camerasOf(dn).filter(function (x) { return x.mandal === m.name; }); if (!l.length) return null;
        return function () { self.tablePopup('Cameras · ' + m.name + ', ' + dn, fmtN(l.length) + ' cameras · click one for its record', ['Camera', 'Site', 'View', 'Status', 'Event', 'Last seen'], l.map(function (x) { return { name: x.id, cells: [TT(x.site), TT(x.view), TT(x.status, x.status === 'Offline' ? 'bad' : 'good'), TT(x.event || '—', x.event ? 'warn' : ''), C(x.ts)], drill: function () { self.setState({ rxRec: { back: self.state.rxRec || null, title: x.id + ' · ' + x.site, sub: x.view + ' · ' + x.mandal + ', ' + dn, facts: [{ k: 'Status', v: x.status }, { k: 'Event', v: x.event || 'None' }, { k: 'Last seen', v: x.ts }, { k: 'Stage', v: STAGE_NAME[x.stage] }], steps: [], links: [] } }); } }; }), null, 'cameras-' + m.name); }; }
      return null;
    };
    const vehPop = function (dn) { const l = vehiclesOf(dn).filter(function (x) { return x.status === 'Deviated'; }); if (!l.length) return null;
      return function () { self.tablePopup('Vehicles off route · ' + dn, 'GPS tracks more than 5 km off the approved route · vehicles are tracked by district · click one for its record', ['Vehicle', 'Leg', 'From', 'To', 'Off route', 'Speed'], l.map(function (x) { return { name: x.plate, cells: [TT(STAGE_NAME[x.stage]), TT(x.from), TT(x.to), C(fmtN(x.dev, 1) + ' km', 'bad'), C(x.speed + ' km/h')], drill: function () { self.setState({ rxRec: { back: self.state.rxRec || null, title: x.plate + ' · off route', sub: x.from + ' → ' + x.to + ' · ' + dn, facts: [{ k: 'Leg', v: STAGE_NAME[x.stage] }, { k: 'Off route by', v: fmtN(x.dev, 1) + ' km' }, { k: 'Distance travelled', v: x.km + ' km' }, { k: 'Speed', v: x.speed + ' km/h' }, { k: 'ETA', v: x.eta }, { k: 'Inside geofence', v: x.geof ? 'Yes' : 'No' }], steps: [], links: [] } }); } }; }), null, 'off-route-' + dn); }; };
    /* a measure in one district: its mandals, each opening into its sites or records */
    const measMandals = function (c, dn) {
      if (c[0] === 'GPS route deviations') return vehPop(dn);
      return function () {
        const rows = mandalsOf(dn).map(function (m) { const d = measLeaf(c, dn, m); return { name: m.name + (d ? ' ›' : ''), cells: mCells(c, oV(m.v)), drill: d }; });
        self.tablePopup(c[0] + ' · ' + dn + ' · by mandal', c[6] + ' · click a mandal for its ' + (MET[c[0]] ? MET[c[0]][1].toLowerCase() + 's' : 'records'), ['Mandal', c[0] + ' (' + c[1] + ')', 'Status'], rows, null, 'measure-' + c[0] + '-' + dn);
      }; };
    const measDrill = function (c, o) { if (depth === 0) return measMandals(c, o.k.name); if (c[0] === 'GPS route deviations') return vehPop(path[0]); return measLeaf(c, path[0], { name: o.k.name, id: o.k.id, v: o.v }); };
    const measPop = function (o) { return function () {
      const rows = COLS.map(function (c) { const x = c[2](o); const t = x === null ? '' : tn(c, x); const d = measDrill(c, o); return { name: c[0] + (d ? ' ›' : ''), cells: [C(c[3](x), t), TT(c[1]), TT(STL[t], t), TT(c[6])], drill: d }; });
      self.tablePopup(o.k.name + ' · status by stage', asOf + ' · same thresholds as the KPI cards · click a measure for its ' + (depth === 0 ? 'mandals, then sites,' : 'sites or records,') + ' down to the record', ['Measure', 'Value', 'Unit', 'Status', 'How it is measured'], rows, null, 'status-' + o.k.name, [{ label: 'Filter the dashboard to ' + o.k.name, go: function () { self.setState({ rxRec: null }); if (depth === 0) self.setState({ path: [o.k.name], kpiOpen: null }); else self.go('proc', 'overview', [path[0], o.k.id]); } }]);
    }; };
    const colPop = function (c) { return function () {
      const rows = rowsRaw.map(function (o) { const x = c[2](o); const t = x === null ? '' : tn(c, x); return { name: o.k.name, cells: [C(c[3](x), t), TT(STL[t], t)], drill: measPop(o) }; });
      self.tablePopup(c[0] + ' · by ' + lvlS + ' · ' + scopeName, c[6] + ' · ' + lvlS + ' order · click a ' + lvlS + ' for all its measures', [lvl, c[0] + ' (' + c[1] + ')', 'Status'], rows, null, 'measure-' + c[0]);
    }; };
    const bad = {};
    rowsRaw.forEach(function (o) { COLS.forEach(function (c, ci) { const xv = c[2](o); if (xv !== null && tn(c, xv) === 'bad') (bad[o.k.name] = bad[o.k.name] || []).push(ci); }); });
    /* row selection: all (default) or any set the user picks */
    const selKey = (depth === 0 ? 'state' : path[0]);
    const selList = s.mxSel && s.mxSel.key === selKey ? s.mxSel.list : [];
    const isOn = function (o) { return selList.indexOf(o.k.name) >= 0; };
    const shownRaw = rowsRaw.filter(isOn);
    const setSel = function (list) { self.setState({ mxSel: { key: selKey, list: list } }); };
    const allNames = rowsRaw.map(function (o) { return o.k.name; });
    const ms = {
      open: !!s.mxOpen, toggle: function () { self.setState({ mxOpen: !self.state.mxOpen }); }, close: function () { self.setState({ mxOpen: false }); },
      label: (lvl + 's: ') + (selList.length === allNames.length ? 'All (' + allNames.length + ')' : selList.length === 0 ? 'None selected' : selList.length === 1 ? selList[0] : selList.length + ' of ' + allNames.length + ' selected'),
      all: function () { setSel(allNames.slice()); }, none: function () { setSel([]); },
      attn: function () { setSel(rowsRaw.filter(function (o) { return (bad[o.k.name] || []).length >= rule; }).map(function (o) { return o.k.name; })); },
      opts: rowsRaw.map(function (o) { const on = isOn(o); return { name: o.k.name, on: on, mark: on ? '✓' : '', cls: 'mso' + (on ? ' on' : ''), pick: function () { const cur = selList.slice(); const i = cur.indexOf(o.k.name); if (i >= 0) cur.splice(i, 1); else cur.push(o.k.name); const ord = allNames.filter(function (n) { return cur.indexOf(n) >= 0; }); setSel(ord); } }; })
    };
    const rows = shownRaw.map(function (o, ri) {
      const z = ri % 2 ? ' z' : '';
      const cells = COLS.map(function (c, ci) { const x = c[2](o); const t = x === null ? '' : tn(c, x);
        return { v: c[3](x), cls: 'td mx ' + t + z, tip: o.k.name + ' · ' + c[0] + ': ' + c[3](x) + ' (' + c[1] + ') · open ' + (c[5][1] === 'overview' ? STAGE_NAME[c[5][0]] : { fin: 'Financials', alerts: 'Incidents', gps: 'GPS tracking', cctv: 'CCTV records' }[c[5][1]]), go: measPop(o) }; });
      return { name: o.k.name, firstCls: 'td first' + z, cells: cells, drill: measPop(o), hasAct: false, act: function () { self.openAct({ name: o.k.name, where: lvl + ' status by stage · ' + scopeName, facts: COLS.map(function (c) { const x = c[2](o); const t = x === null ? '' : tn(c, x); return { k: c[0], v: c[3](x) + (t === 'bad' ? ' · Below threshold' : t === 'warn' ? ' · Watch' : '') }; }), dn: depth === 0 ? o.k.name : path[0] }); } };
    });
    const sum = function (f) { return shownRaw.reduce(function (a, o) { return a + f(o); }, 0); };
    const camN = sum(function (o) { return o.camN; }), camOn = sum(function (o) { return o.camOn; });
    const totO = { v: selList.length < allNames.length ? ratios(sumVals(shownRaw.map(function (o) { return o.v; }))) : v, crit: sum(function (o) { return o.crit; }), dev: sum(function (o) { return o.dev; }), cam: camOn / (camN || 1) };
    const total = COLS.map(function (c) { return { v: c[3](c[2](totO)) }; });
    const redCnt = COLS.map(function (c, ci) { const n = shownRaw.filter(function (o) { const xv = c[2](o); return xv !== null && tn(c, xv) === 'bad'; }).length; return { v: n ? n + ' of ' + shownRaw.length : 'None' }; });
    const weak = COLS.map(function (c) {
      const hiBad = c[4][2] === false; let w = null;
      rowsRaw.forEach(function (o) { const x = c[2](o); if (x === null) return; if (!w || (hiBad ? x > w.x : x < w.x)) w = { o: o, x: x }; });
      return { label: c[0], name: w ? w.o.k.name : '—', v: w ? c[3](w.x) + (c[7] || '') : '', cls: 'wkv ' + (w ? tn(c, w.x) : ''), go: w ? (measDrill(c, w.o) || measPop(w.o)) : colPop(c) };
    });
    const mostBad = rowsRaw.reduce(function (a, o) { return Math.max(a, (bad[o.k.name] || []).length); }, 0); const rule = COLS.length < 9 ? 3 : mostBad >= 4 ? 4 : 3;
    const attn = rowsRaw.filter(function (o) { return (bad[o.k.name] || []).length >= rule; }).map(function (o) { const l = bad[o.k.name]; return { name: o.k.name, stages: l.map(function (ci) { return COLS[ci][0]; }).join(' · '), count: l.length + ' of ' + COLS.length + ' below', go: measPop(o) }; });
    return {
      scope: scopeName, asOf: asOf, highLbl: 'Most pending (' + lvlS + ')', pend: pend, na: na,
      pendNote: 'Quantities in metric tonnes (CMR in tonnes of rice). Share is the pending quantity as a % of the stage base shown in the tooltip. Stage-II figures are for the current allotment month. Click a stage for its ' + lvlS + 's; each opens into ' + (depth === 0 ? 'mandals, then ' : '') + 'sites, down to the site record.',
      attnTitle: lvl + 's needing attention', attnSub: lvl + 's below threshold on ' + rule + ' or more of the ' + COLS.length + ' measures in the table below · listed in ' + lvlS + ' order',
      hasAttn: attn.length > 0, noAttn: attn.length === 0, noAttnTxt: 'No ' + lvlS + ' is below threshold on ' + rule + ' or more measures.', attn: attn, weak: weak,
      mxTitle: lvl + ' status by stage · ' + scopeName, mxSub: asOf + ' · click a name or a value for that ' + lvlS + "'s measures",
      grid: 'minmax(180px, 1.3fr) repeat(' + COLS.length + ', minmax(92px, 1fr))', lvl: lvl, cols: COLS.map(function (c) { return { label: c[0], unit: c[1], tip: c[6] }; }),
      rows: rows, hasRows: rows.length > 0, noRows: rows.length === 0, ms: ms, emptyTxt: 'No ' + lvlS + 's selected yet. Use the ' + lvlS + 's menu above to show all ' + lvlS + 's, those needing attention, or any ' + lvlS + 's you choose.', totLbl: selList.length < allNames.length ? 'Selected ' + lvlS + 's (total)' : scopeName + ' (total)', total: total, redCnt: redCnt,
      mxNote: 'Colours use the same thresholds as the KPI cards. Percentages are calculated from quantities to date; incidents, GPS deviations and CCTV are counted from the same records as their modules' + (depth === 0 ? '' : ' (mandal figures for incidents, GPS and CCTV are allocated from district totals)') + '.'
    };
  }
  flowFor(v, stage) {
    const self = this;
    const HL = { proc: [0, 1], cmr: [2], stor: [3], s1: [4], s2: [5] };
    /* [label, value, what the value is, rate field, rate, rate base, thresholds (good, bad, higher is better), link] */
    const nodes = [
      ['Farmers', fmtN(v.farmers), 'farmers sold paddy', 'farmPaidPct', v.farmPaidPct, 'paid', [0.99, 0.95, true], ['proc', 'fin'], 'farmers'],
      ['Procurement', fmtMT(v.procured), 'paddy procured at PPCs', 'procPct', v.procPct, 'of target', [0.95, 0.8, true], ['proc', 'overview'], 'target'],
      ['Rice mills', fmtMT(v.cmrDel), 'CMR delivered by mills', 'cmrPct', v.cmrPct, 'CMR delivered of due', [0.6, 0.45, true], ['cmr', 'overview'], 'cmrDue'],
      ['Godowns', fmtMT(v.stock), 'in buffer godowns', 'util', v.util, 'of capacity', [0.85, 0.93, false], ['stor', 'overview'], 'cap'],
      ['MLS', fmtMT(v.s1Moved), 'moved to MLS points (Stage-I)', 's1Pct', v.s1Pct, 'of Stage-I plan', [0.9, 0.8, true], ['s1', 'overview'], 's1Plan'],
      ['FPS', fmtMT(v.s2Fps), 'delivered to FPS (Stage-II)', 's2Pct', v.s2Pct, 'of allotment', [0.85, 0.7, true], ['s2', 'overview'], 's2Allot'],
      ['Beneficiaries', fmtN(v.cards / 100000, 1) + ' lakh', 'ration cards served by FPS', 'distPct', v.distPct, 'distributed', [0.9, 0.8, true], ['all', 'glance'], 's2Fps']
    ];
    const hl = HL[stage] || [];
    return nodes.map(function (n, i) {
      const t = tone(n[4], n[6][0], n[6][1], n[6][2]);
      const o = { n: i + 1, num: pad(i + 1, 2), label: n[0], value: n[1], unit: n[2], pctTxt: n[3] === 'farmPaidPct' ? fmtN(n[4] * 100, 2) + '%' : pct(n[4]), base: n[5], w: Math.max(2, Math.min(100, Math.round(n[4] * 100))), barCls: 'fsb ' + (t || 'good'), col: { good: '#2B5FA5', warn: '#D99A2B', bad: '#C8553A' }[t || 'good'], dash: (Math.max(0.02, Math.min(1, n[4])) * 194.8).toFixed(1) + ' 400', i_farmer: i === 0, i_ppc: i === 1, i_mill: i === 2, i_rice: false, i_godown: i === 3, i_truck: i === 4 || i === 5, i_family: i === 6, _r: [n[3], n[6][0], n[6][1], n[6][2], n[8]], hasSt: false, st: '', stCls: 'pst',
        tip: n[0] + ': ' + n[1] + ' ' + n[2] + ' · ' + pct(n[4]) + ' ' + n[5] + ' · click to open', cls: hl.indexOf(i) >= 0 ? 'fn on' : 'fn',
        go: function () { if (n[7][1] === 'glance') self.setState({ module: 'glance', glance: 'fps', stage: 'all', pivot: false, kpiOpen: null, path: self.curPath().slice(0, 1) }); else self.go(n[7][0], n[7][1]); } };
      return o;
    });
  }
  table(title, note, colLabels, rows, total, totalLabel, csvName) {
    const self = this;
    const isTxt = function (i) { return rows.some(function (r) { const c = r.cells && r.cells[i]; return c && /(^| )txt( |$)/.test(c.cls || ''); }); };
    const cols = [{ label: colLabels[0], cls: 'th first' }].concat(colLabels.slice(1).map(function (l, i) { return { label: l, cls: 'th' + (isTxt(i) ? ' txt' : '') }; }));
    const grid = 'minmax(220px, 1.6fr) repeat(' + Math.max(1, colLabels.length - 1) + ', minmax(112px, 1fr))';
    rows.forEach(function (r, i) {
      const z = i % 2 ? ' z' : '';
      r.firstCls = 'td first' + z;
      r.cells = r.cells.map(function (c) { return { v: c.v, cls: 'td ' + (c.cls || '') + ' ' + c.t + z }; });
      r.canDrill = !!r.drill; r.noDrill = !r.drill; r.pillCls = 'pill ' + (r.pill || ''); r.pill = r.pillTxt || r.pill || '';
      { const il = incLinksFor(r.name, (r.hint || '') + ' ' + title + ' ' + r.cells.map(function (c) { return c.v; }).join(' ')); r.hasInc = il.length > 0; r.incs = il.slice(0, 3).map(function (id) { const i = TX[id]; return { id: id, cls: 'inclink ' + (i.prio === 'P1' ? 'p1' : ''), tip: SEV[i.prio] + ' · ' + i.title + ' · ' + i.status, go: function () { self.setState({ rxRec: self.rxBack(self.incRec(i)) }); } }; }).concat(il.length > 3 ? [{ id: '+' + (il.length - 3), cls: 'inclink more', tip: 'More incidents on this record', go: function () { self.tablePopup('Incidents raised on ' + String(r.name).replace(/^[\s\u2003▾▸]+/, '').replace(/\s*›\s*$/, ''), fmtN(il.length) + ' incidents', ['Incident ID', 'Incident', 'Severity', 'Status', 'Age'], il.map(function (id2) { const j = TX[id2]; return { name: j.id, cells: [Object.assign(C(j.title), { cls: 'txt' }), Object.assign(C(SEV[j.prio], j.prio === 'P1' ? 'bad' : ''), { cls: 'txt' }), Object.assign(C(j.status), { cls: 'txt' }), C(j.ageH + ' h')], drill: function () { self.setState({ rxRec: self.rxBack(self.incRec(j)) }); } }; }), null, 'incidents-on-record'); } }] : []); }
      if (r.hasAct === true) { r.act = function () { self.openAct({ name: r.name, where: title, facts: colLabels.slice(1).map(function (l, j) { return { k: l, v: r.cells[j] ? r.cells[j].v : '' }; }) }); }; }
    });
    const tot = total ? total.map(function (c) { return { v: c.v, cls: 'td tot ' + (c.cls || '') }; }) : [];
    const download = function () {
      const esc = function (x) { x = String(x); return /[",\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; };
      const lines = [colLabels.map(esc).join(',')];
      rows.forEach(function (r) { lines.push([r.name].concat(r.cells.map(function (c) { return c.v; })).map(esc).join(',')); });
      if (total) lines.push([totalLabel || 'Total'].concat(total.map(function (c) { return c.v; })).map(esc).join(','));
      self.offerFile((csvName || 'ucc-table').replace(/[^A-Za-z0-9_-]+/g, '-') + '.csv', lines.join('\n'), 'Copy table as CSV');
    };
    return { title: title, note: note, cols: cols, rows: rows, grid: grid, hasTotal: !!total, total: tot, totalLabel: totalLabel || 'Total', download: download, hasQ: false, qPh: '', q: '', onQ: function () {}, clearQ: function () {}, hasQv: false, noMatch: false, noMatchText: '', hasChips: false, chips: [], hasSel: false, selVal: '', onSel: function () {}, selOpts: [] };
  }

  buildStageLike(mode, path, stage, sk) {
    const self = this; const SE = SEASONS[sk];
    const et = mode === 'home' ? 'proc' : mode === 'fin' ? (stage === 'all' ? 'proc' : stage) : mode;
    const depth = path.length;
    if (depth >= 1) mandalsOf(path[0]);
    if (depth >= 2) entsOf(path[1], et);
    if (depth >= 3) txnsOf(path[2]);
    const v = depth >= 3 && ENT[path[2]] ? ENT[path[2]].v : this.nodeVals(path, 2);
    const modeCols = mode === 'fin' ? FIN_SUB[stage === 'all' ? 'all' : stage].map(function (i) { return COLS.fin[i]; }) : COLS[mode];
    const sortK = SORT[mode === 'fin' ? 'fin' : mode];
    const page = { kpis: [], showFlow: false, isHome: mode === 'home' };
    const stInfo = STAGES.filter(function (x) { return x.k === mode; })[0];
    const scopeName = depth === 0 ? 'Andhra Pradesh' : LBL[path[depth - 1]] || path[depth - 1];
    const areaName = depth === 0 ? 'State' : LBL[path[Math.min(depth, 2) - 1]] || path[0];
    if (mode === 'home') { page.title = depth === 0 ? 'State command overview' : areaName + ' — command overview'; page.sub = ''; }
    else if (mode === 'fin') { page.title = 'Financials'; page.sub = MODS[0].src; }
    else { page.title = stInfo.title; page.sub = stInfo.src; }
    if (mode === 'fin' && stage !== 'all') { page.hasFilter = true; page.filter = STAGE_NAME[stage]; }

    /* KPIs */
    let keys;
    if (mode === 'home') keys = this._sid ? SEASONS.all.kpis : SE.kpis;
    else if (mode === 'proc') keys = ['proc', 'gap', 'ppcAct', 'millReady', 'farmPaid', 'pay24', 'trans'];
    else if (mode === 'cmr') keys = ['cmr', 'millReady', 'cmrShort', 'millAnom', 'bg', 'ham'];
    else if (mode === 's1') keys = ['s1', 'trips', 's1dev'];
    else if (mode === 's2') keys = ['s2', 's2lift', 'mls'];
    else if (mode === 'stor') keys = ['stor', 'aged', 'godowns', 'storch'];
    else keys = stage === 'proc' ? ['farmPaid', 'pay24', 'paid', 'pay', 'trans'] : stage === 'cmr' ? ['bg', 'cmr', 'millAnom', 'ham'] : stage === 's1' || stage === 's2' ? ['trips'] : stage === 'stor' ? ['storch', 'stor'] : ['farmPaid', 'pay24', 'paid', 'pay', 'bg', 'trans', 'ham'];
    page.kpis = this.kpiList(keys, v, mode === 'home' ? (this._sid ? SEASONS.all.kpis : SE.kpis) : null);
    if (mode === 'cmr') this.cmrPage(page, path, depth, scopeName, SE);
    if (mode === 's2') {
      const aw = function (l) { const x = l.filter(function (r) { return r.status.indexOf('awaiting') >= 0; }); return { n: x.length, q: x.reduce(function (a, r) { return a + r.delivered; }, 0), del: l.filter(function (r) { return r.delH !== null; }).length }; };
      const scopeL = function () { let l = []; (depth ? [path[0]] : D.map(function (d) { return d.name; })).forEach(function (dn) { l = l.concat(s2Dels(dn)); }); return depth >= 2 ? l.filter(function (r) { return r.mid === path[1]; }) : l; };
      const o = aw(scopeL());
      page.kpis.push(this.mkK('Awaiting ePoS acknowledgement', fmtN(o.n) + ' deliveries', fmtMT(o.q) + ' delivered to FPS, not yet acknowledged', o.n / (o.del || 1) > 0.08 ? 'bad' : o.n ? 'warn' : 'good', 's2ack', { def: 'Stage-II deliveries that reached the fair price shop but have no ePoS receipt confirmation yet. Acknowledgement is a separate event from delivery.', calc: 'Count of deliveries with a delivery time and no ePoS acknowledgement', drill: 'District → mandal → MLS point', tab: { f: function (dn) { return aw(s2Dels(dn)); }, fm: function (mid) { return aw(s2Dels(mid.split('|')[0]).filter(function (r) { return r.mid === mid; })); }, cols: [['Deliveries made', 'del', 'n'], ['Quantity awaiting (MT)', 'q', 'mtn']], res: ['Awaiting acknowledgement', function (x) { return x.n; }, function (x) { return fmtN(x); }] } }));
    }

    /* flow */
    if (mode !== 'fin' && depth < 3) { page.showFlow = true; page.flow = this.flowFor(v, mode === 'home' ? (SE.hotStages && SE.hotStages.length ? SE.hotStages[0] : '') : mode); page.flowScope = scopeName; page.flowNote = 'Ring = progress against each step\'s base (target, plan, capacity or allotment); colour follows the KPI thresholds. Click a step or a stage to open its module.'; const self2 = this; page.flowBands = [['Procurement', 2, 'proc', 'overview'], ['Milling', 2, 'cmr', 'overview'], ['Storage', 1, 'stor', 'overview'], ['Movement', 2, 's1', 'overview'], ['Distribution', 1, 'all', 'glance']].map(function (x) { return { label: x[0], span: x[1], go: function () { if (x[3] === 'glance') self2.setState({ module: 'glance', glance: 'fps', stage: 'all', pivot: false, kpiOpen: null, path: self2.curPath().slice(0, 1) }); else self2.go(x[2], x[3]); } }; }); }

    /* home extras */
    if (mode === 'home' && depth < 2) {
      const kids = this.childrenAt(path, 'proc');
      const lvl = depth === 0 ? 'district' : 'mandal';
      const PR = {
        procPct: { title: 'District target achievement — lowest ' + lvl + 's', src: 'TCS · KPI 10', bars: this.barsFrom(kids, 'procPct', 1, pct, function (x) { return tone(x.procPct, 0.95, 0.8); }), go: ['proc', 'overview'], gl: 'procurement' },
        pending: { title: 'Farmer payments pending — by ' + lvl, src: 'TCS · RNIT financial', bars: this.barsFrom(kids, 'pending', -1, fmtCr, function (x) { return tone(x.pending / (x.valueCr || 1), 0.05, 0.1, false); }), go: ['proc', 'fin'], gl: 'financials' },
        pay24: { title: 'Farmers paid within 24 h — lowest ' + lvl + 's', src: 'TCS payments', bars: this.barsFrom(kids, 'pay24', 1, pct, function (x) { return tone(x.pay24, 0.9, 0.8); }), go: ['proc', 'fin'], gl: 'financials' },
        ppcPct: { title: 'PPCs active — lowest ' + lvl + 's', src: '', bars: this.barsFrom(kids, 'ppcPct', 1, pct, function (x) { return tone(x.ppcPct, 0.9, 0.8); }), go: ['proc', 'overview'], gl: 'procurement' },
        moisture: { title: 'Avg moisture at RSKs — highest ' + lvl + 's', src: 'TCS', bars: this.barsFrom(kids, 'moisture', -1, function (x) { return fmtN(x, 1) + '%'; }, function (x) { return tone(x.moisture, 16.5, 17, false); }), go: ['proc', 'overview'], gl: 'procurement' },
        cmrShort: { title: 'CMR shortfall — by ' + lvl, src: 'TCS · RNIT', bars: this.barsFrom(kids, 'cmrShort', -1, fmtMT, function (x) { return tone(x.cmrPct, 0.6, 0.45); }), go: ['cmr', 'overview'], gl: 'CMR' },
        s1Pct: { title: 'Stage-I movement — lowest ' + lvl + 's', src: 'TCS · Techworks', bars: this.barsFrom(kids, 's1Pct', 1, pct, function (x) { return tone(x.s1Pct, 0.9, 0.8); }), go: ['s1', 'overview'], gl: 'Stage 1' },
        millAnom: { title: 'Mill anomalies — by ' + lvl, src: 'RNIT anomaly engine', bars: this.barsFrom(kids, 'millAnom', -1, function (x) { return fmtN(x); }, function (x) { return tone(x.millAnom, 1, 3, false); }), go: ['cmr', 'alerts'], gl: 'mill alerts' },
        util: { title: 'Godown utilisation — fullest ' + lvl + 's', src: 'TCS', bars: this.barsFrom(kids, 'util', -1, pct, function (x) { return tone(x.util, 0.85, 0.93, false); }), go: ['stor', 'overview'], gl: 'storage' },
        s2Pct: { title: 'Stage-II to FPS — lowest ' + lvl + 's', src: 'NIC', bars: this.barsFrom(kids, 's2Pct', 1, pct, function (x) { return tone(x.s2Pct, 0.85, 0.7); }), go: ['s2', 'overview'], gl: 'Stage 2' },
        prep: { title: 'Readiness for ' + SE.next + ' — lowest ' + lvl + 's', src: 'RNIT preparedness', bars: this.barsFrom(kids, 'prep', 1, pct, function (x) { return tone(x.prep, 0.85, 0.72); }), go: ['all', 'prep'], gl: 'preparedness' }
      };
      page.prio = SE.prio.map(function (k) { const p = PR[k]; return { title: p.title, src: p.src, bars: p.bars, goLabel: p.gl, go: function () { self.go(p.go[0], p.go[1]); } }; });
      page.rp = this.rolePanel(path, v, sk);
      if (sk !== 'all') page.sChart = this.seasonChart(sk, v, scopeName);
      page.feed = this.feedFor(path, 'all'); { const FSM = { proc: ['proc'], mill: ['cmr', 's1'], between: ['stor', 's2'] }; const FS = (this._lenses || []).length > 1 ? [].concat.apply([], this._lenses.map(function (L) { return FSM[L]; })) : FSM[sk]; if (FS) { const f2 = page.feed.filter(function (a) { const inc = TX[a.id] || null; return !inc || FS.indexOf(inc.stage) >= 0; }); if (f2.length) page.feed = f2; } }
      page.ov = this.overviewStatus(path, v, kids, depth, scopeName, SE);
      this.flowStatus(page.flow, kids, depth); { const FN = { proc: [0, 1, 2], mill: [2, 3, 4], between: [3, 4, 5, 6] }[sk]; if (FN) page.flow = page.flow.filter(function (f, i) { return FN.indexOf(i) >= 0; }); }
    }
    if (mode === 'home' && depth >= 2) { page.isHome = false; }

    /* chart for stage pages */
    if (mode !== 'home' && depth < 3) {
      const kids = this.childrenAt(path, et);
      const CH = { proc: ['procPct', 1, pct, function (x) { return tone(x.procPct, 0.95, 0.8); }, '% of target'], cmr: ['cmrShort', -1, fmtMT, function (x) { return tone(x.cmrPct, 0.6, 0.45); }, 'CMR shortfall'], s1: ['s1Pct', 1, pct, function (x) { return tone(x.s1Pct, 0.9, 0.8); }, '% of Stage-I plan moved'], s2: ['s2Pct', 1, pct, function (x) { return tone(x.s2Pct, 0.85, 0.7); }, '% delivered to FPS'], stor: ['util', -1, pct, function (x) { return tone(x.util, 0.85, 0.93, false); }, 'godown utilisation'], fin: ['pending', -1, fmtCr, function (x) { return tone(x.pending / (x.valueCr || 1), 0.05, 0.1, false); }, 'farmer payments pending'] };
      const ch = CH[mode];
      const lvl = depth === 0 ? 'district' : depth === 1 ? 'mandal' : 'entity';
      page.hasChart = true;
      page.chart = { title: 'Ranking by ' + ch[4] + ' — by ' + lvl, src: depth === 0 ? 'Top 10 of ' + D.length + ' districts' : 'Top 10', bars: this.barsFrom(kids, ch[0], ch[1], ch[2], ch[3], 10) };
    }

    /* table / detail */
    if (depth <= 2) {
      let rowsSrc = this.childrenAt(path, et);
      const tcols = mode === 'home' && depth === 2 ? COLS.proc : modeCols;
      const cc = depth < 2 && mode !== 'home' && mode !== 'fin' ? COUNT_COL[mode] : null;
      const ex = depth === 2 ? EXTRA[et] : null;
      const ex2 = depth === 2 && et === 'proc' ? EXTRA.proc2 : null;
      const labels = [depth === 0 ? 'District' : depth === 1 ? 'Mandal' : (et === 'proc' ? 'RSK' : et === 'cmr' ? 'Rice mill' : et === 'stor' ? 'Buffer godown' : et === 's2' ? 'MLS point' : 'Route')].concat(cc ? [cc[0]] : []).concat(tcols.map(function (c) { return c[0]; })).concat(ex ? [ex[0]] : []).concat(ex2 ? [ex2[0]] : []);
      const shown = rowsSrc.slice(0, 40);
      const rows = shown.map(function (x) {
        let cells = (cc ? [C(fmtN(x.v[cc[1]]))] : []).concat(tcols.map(function (c) { return c[1](x.v, x); }));
        if (ex) cells.push(ex[1](x)); if (ex2) cells.push(ex2[1](x));
        return { name: x.name, cells: cells, drill: function () { self.drill(x.id); } };
      });
      const tv = v;
      const total = depth < 2 ? (cc ? [C(fmtN(tv[cc[1]]))] : []).concat(tcols.map(function (c) { return c[1](tv, { scopePath: path }); })) : null;
      const lvlName = depth === 0 ? 'District' : depth === 1 ? 'Mandal' : 'Entity';
      const note = (rowsSrc.length > 40 ? 'Showing 40 of ' + rowsSrc.length + ' · ' : '') + 'Click a name to drill down';
      page.hasTable = true;
      page.table = this.table((depth === 0 ? 'District' : depth === 1 ? 'Mandal' : et === 'proc' ? 'RSK' : et === 'cmr' ? 'Mill' : et === 'stor' ? 'Godown' : et === 's2' ? 'MLS point' : 'Route') + '-wise view' + (depth ? ' · ' + scopeName : ''), note, labels, rows, total, depth === 0 ? 'Andhra Pradesh' : scopeName + ' total', page.title + '-' + scopeName);
    } else if (depth === 3) {
      const tx = txnsOf(path[2]); const e = ENT[path[2]];
      let labels, rows;
      if (e.et === 'proc') { labels = ['Lot', 'Time', 'Farmer', 'Qty (qtl)', 'Moisture', 'Truck', 'Tagged mill', 'Payment']; rows = tx.map(function (t) { return { name: t.name, cells: [C(t.time), Object.assign(C(t.farmer), { cls: 'txt' }), C(fmtN(t.qty, 1)), C(fmtN(t.moist, 1) + '%', tone(t.moist, 16.5, 17, false)), Object.assign(C(t.truck), { cls: 'txt' }), Object.assign(C(t.mill), { cls: 'txt' }), Object.assign(C(t.pay, t.pay === 'Paid' ? 'good' : t.pay.indexOf('Pending') >= 0 ? 'bad' : 'warn'), { cls: 'txt' })], drill: function () { self.drill(t.id); } }; }); }
      else if (e.et === 'cmr') { labels = ['CMR truck chit', 'Dispatched', 'Qty (MT)', 'Truck', 'Destination godown', 'Quality', 'Acknowledgement', 'CMR ACK no.']; rows = tx.map(function (t) { return { name: t.name, cells: [C(t.time), C(fmtN(t.qty, 1)), Object.assign(C(t.truck), { cls: 'txt' }), Object.assign(C(t.dest), { cls: 'txt' }), Object.assign(C(t.quality, t.quality === 'Accepted' ? 'good' : t.quality.indexOf('Rejected') >= 0 ? 'bad' : 'warn'), { cls: 'txt' }), Object.assign(C(t.ackState, t.ack ? 'good' : t.status === 'In transit' ? 'warn' : 'bad'), { cls: 'txt' }), Object.assign(C(t.ackNo), { cls: 'txt' })], drill: function () { self.drill(t.id); } }; }); }
      else if (e.et === 's1' || e.et === 's2') { labels = ['Trip', 'Departed', 'Vehicle', 'Qty (MT)', 'Destination', 'Status', 'GPS']; rows = tx.map(function (t) { return { name: t.name, cells: [C(t.time), Object.assign(C(t.truck), { cls: 'txt' }), C(fmtN(t.qty, 1)), Object.assign(C(t.dest), { cls: 'txt' }), Object.assign(C(t.status, t.status === 'Reached' ? 'good' : t.status === 'In transit' ? '' : 'bad'), { cls: 'txt' }), Object.assign(C(t.gps, t.gps === 'Live' ? 'good' : 'warn'), { cls: 'txt' })], drill: function () { self.drill(t.id); } }; }); }
      else { labels = ['Stack', 'Commodity', 'Qty (MT)', 'Age (days)', 'Last fumigation', 'Status']; rows = tx.map(function (t) { return { name: t.name, cells: [Object.assign(C(t.commodity), { cls: 'txt' }), C(fmtN(t.qty, 1)), C(fmtN(t.age), tone(t.age, 120, 180, false)), C(t.fum + ' days ago', tone(t.fum, 21, 30, false)), Object.assign(C(t.age > 180 ? 'Ageing — rotate' : 'OK', t.age > 180 ? 'bad' : 'good'), { cls: 'txt' })], drill: function () { self.drill(t.id); } }; }); }
      page.hasTable = true;
      page.table = this.table('Transactions · ' + e.name, 'Latest records from the source system · click a record for its full trail with GPS and CCTV evidence', labels, rows, null, null, e.name);
    } else {
      page.hasDetail = true; page.detail = this.txDetail(TX[path[3]]);
    }
    return page;
  }

  txDetail(t) {
    if (!t) return { title: 'Record not found', src: '', facts: [], steps: [], planned: '', actual: '', trailColor: '#2B5FA5', gpsNote: '', cam: '', camTs: '' };
    const e = t.e; const planned = '20,120 80,100 140,86 200,64 250,44 280,30';
    let facts = [], steps = [], deviated = false, cam = '', title = t.name + ' · ' + e.name, src = '';
    const st = function (label, meta, cls) { return { label: label, meta: meta, cls: 'step ' + (cls || 'done') }; };
    if (e.et === 'proc') {
      src = 'TCS · Techworks · Road Vision';
      facts = [{ k: 'Farmer', v: t.farmer }, { k: 'Quantity', v: fmtN(t.qty, 1) + ' qtl' }, { k: 'Moisture', v: fmtN(t.moist, 1) + '%' }, { k: 'Value at MSP', v: '₹' + fmtN(t.qty * MSP / 10) }, { k: 'Truck', v: t.truck }, { k: 'Tagged mill', v: t.mill }, { k: 'Payment', v: t.pay }];
      steps = [st('Farmer registered in e-Crop and slot booked', t.farmer), st('Paddy arrived at ' + e.name + ', token issued', 'Today ' + t.time + ' · RSK gate camera'), st('Moisture tested ' + fmtN(t.moist, 1) + '% and weighed ' + fmtN(t.qty, 1) + ' qtl', t.moist > 17 ? 'Above FAQ 17% — value cut applied' : 'Within FAQ norms', t.moist > 17 ? 'bad' : 'done'), st('Loaded to ' + t.truck, 'GPS trip started'), st('Received at ' + t.mill, 'Acceptance note generated', t.pay === 'Paid' ? 'done' : 'now'), st('Farmer payment', t.pay, t.pay === 'Paid' ? 'done' : t.pay.indexOf('Pending') >= 0 ? 'bad' : 'now')];
      cam = 'No CCTV at RSKs — CCTV covers buffer godowns and MLS points only'; deviated = R(t.id + 'dv') < 0.15;
    } else if (e.et === 'cmr') {
      src = 'TCS CMR · RNIT anomaly engine';
      facts = [{ k: 'Mill', v: e.name }, { k: 'Quantity', v: fmtN(t.qty, 1) + ' MT rice' }, { k: 'Truck', v: t.truck }, { k: 'Destination godown', v: t.dest }, { k: 'Quality check (FAQ)', v: t.status === 'In transit' ? 'Pending · truck not yet at godown' : t.quality }, { k: 'Acknowledgement', v: t.ackState }, { k: 'CMR ACK no.', v: t.ackNo }, { k: 'Counts toward obligation', v: t.ack ? 'Yes · acknowledged' : 'No · not acknowledged' }];
      const atGodown = t.status !== 'In transit';
      steps = [st('Paddy milled against CMR allotment', e.name), st('Truck chit generated and rice loaded', t.time + ' · mill loading-bay camera'), st('Truck ' + t.truck + ' dispatched', 'GPS trip started'), st('Weighment and FAQ check at ' + t.dest, atGodown ? t.quality : 'Awaiting arrival', !atGodown ? 'now' : t.quality === 'Accepted' ? 'done' : t.quality.indexOf('Rejected') >= 0 ? 'bad' : 'done'), st('CMR truck acknowledgement by Godown Manager', t.ack ? t.ackNo + ' · counted toward obligation' : atGodown ? 'Not acknowledged · consignment rejected' : 'Pending · dispatch alone does not count', t.ack ? 'done' : atGodown ? 'bad' : 'now')];
      cam = 'Receiving godown camera · ' + t.dest; deviated = R(t.id + 'dv') < 0.15;
    } else if (e.et === 's1' || e.et === 's2') {
      src = e.et === 's1' ? 'TCS Stage-I · Techworks GPS' : 'NIC Stage-II · Techworks GPS';
      deviated = t.status === 'Deviated';
      facts = [{ k: 'Vehicle', v: t.truck }, { k: 'Quantity', v: fmtN(t.qty, 1) + ' MT' }, { k: 'Departed', v: t.time }, { k: 'Destination', v: t.dest }, { k: 'Status', v: t.status }, { k: 'GPS signal', v: t.gps }];
      steps = [st('Release order generated', e.name), st('Loaded and departed ' + t.time, 'Gate camera at origin'), st(deviated ? 'Route deviation detected' : t.status === 'Halted > 2 h' ? 'Halted over 2 hours' : 'On planned route', deviated ? 'Off route by ' + fmtN(rr(t.id + 'k', 5, 18), 1) + ' km · alert raised to command control centre' : 'GPS tracking', deviated || t.status === 'Halted > 2 h' ? 'bad' : 'done'), st('Arrival at ' + t.dest, t.status === 'Reached' ? 'Unloaded · ePoS / MLS receipt' : 'Pending', t.status === 'Reached' ? 'done' : 'now')];
      cam = 'Origin gate camera · ' + t.truck;
    } else if (e.et === 'stor') {
      src = 'TCS stock accounting · Road Vision';
      facts = [{ k: 'Godown', v: e.name }, { k: 'Commodity', v: t.commodity }, { k: 'Quantity', v: fmtN(t.qty, 1) + ' MT' }, { k: 'Age', v: t.age + ' days' }, { k: 'Last fumigation', v: t.fum + ' days ago' }];
      steps = [st('Stack received via CMR', t.age + ' days ago'), st('Last fumigation', t.fum + ' days ago', t.fum > 30 ? 'bad' : 'done'), st('Physical verification', 'Monthly · Quality control'), st(t.age > 180 ? 'Rotate stock — ageing beyond 6 months' : 'Next dispatch under Stage-I', 'Storage wing', t.age > 180 ? 'bad' : 'now')];
      cam = 'Stack-yard camera · ' + e.name;
    } else {
      src = 'NIC ePoS';
      facts = [{ k: 'Fair price shop', v: e.name }, { k: 'Cards served', v: fmtN(t.cards) }, { k: 'Quantity', v: fmtN(t.qty) + ' kg' }, { k: 'Authentication', v: t.auth }, { k: 'Status', v: t.status }];
      steps = [st('Stock received from MLS point', 'Stage-II'), st('Distribution opened', 'ePoS device online'), st(fmtN(t.cards) + ' cards served', t.auth + ' authentication'), st('Day closed', t.status, t.status === 'Closed' ? 'done' : 'now')];
      cam = 'No CCTV at FPS — ePoS records only';
    }
    return { title: title, src: src, facts: facts, steps: steps, planned: planned, actual: deviated ? '20,120 80,100 110,128 165,124 205,70 250,44 280,30' : '20,121 79,99 141,88 199,62 251,45 280,30', trailColor: deviated ? '#C2502E' : '#2B5FA5', gpsNote: deviated ? 'Deviation highlighted.' : 'No deviation.', cam: cam, camTs: 'Today ' + clock(t.id + 'c', 8, 15) };
  }

  feedFor(path, stage) {
    const self = this;
    const dns = path.length ? [path[0]] : D.map(function (d) { return d.name; });
    let all = []; dns.forEach(function (dn) { all = all.concat(incidentsOf(dn)); });
    const selfW = this; all = all.filter(function (i) { return (stage === 'all' || i.stage === stage) && selfW.inWin(i.ageH); });
    const order = { P1: 0, P2: 1, P3: 2, P4: 3 };
    all.sort(function (a, b) { return order[a.prio] - order[b.prio] || a.ageH - b.ageH; });
    return all.slice(0, 4).map(function (i) { return { prio: SEV[i.prio], pcls: 'pill ' + i.prio, title: i.title, meta: i.dn + ' · ' + i.ageH + ' h', go: function () { self.setState({ stage: 'all', module: 'alerts', pivot: false, path: [i.dn, i.id] }); } }; });
  }

  rolePanel(path, v, sk) {
    const self = this; const role = this.state.role; const SE = SEASONS[sk];
    if (role === 'ho') {
      const now = new Date();
      const ago = function (m) { const d = new Date(now.getTime() - m * 60000); return pad(d.getHours(), 2) + ':' + pad(d.getMinutes(), 2); };
      const P = [['Procurement & payments', 5, 'good', ['proc', 'overview']], ['CMR & Stage-I', 7, 'good', ['cmr', 'overview']], ['Stage-II & FPS distribution', 9, 'good', ['s2', 'overview']], ['Preparedness & anomalies', 17, 'good', ['all', 'prep']], ['Incidents & grievances', 2, 'good', ['all', 'alerts']], ['GPS vehicle tracking', 1, 'good', ['all', 'gps']], ['CCTV', 55, 'warn', ['all', 'cctv']]];
      return { title: 'Data freshness by source', sub: 'Last successful refresh', items: P.map(function (p) { p = [p[0], '', p[1], p[2], p[3]]; return { dot: 'dot ' + p[3], text: p[0], meta: (p[3] === 'warn' ? 'Delayed · ' : 'OK · ') + ago(p[2]), go: function () { self.go(p[4][0], p[4][1]); } }; }) };
    }
    if (role === 'dm') {
      const dn = this.state.dm; const rsks = entsOfDistrict(dn, 'proc'); const mills = entsOfDistrict(dn, 'cmr'); const gd = entsOfDistrict(dn, 'stor');
      const wet = rsks.filter(function (e) { return e.v.moisture > 17; }).length;
      const slow = mills.filter(function (e) { return e.v.cmrPct < 0.45; }).length;
      const aged = gd.filter(function (e) { return e.v.aged / (e.v.stock || 1) > 0.14; }).length;
      const items = [
        { dot: 'dot ' + (wet ? 'bad' : 'good'), text: wet + ' RSKs averaging moisture above 17%', meta: 'Procurement', go: function () { self.go('proc', 'overview'); } },
        { dot: 'dot ' + tone(v.pay24, 0.9, 0.8), text: pct(v.pay24) + ' of farmers paid within 24 h · ' + fmtN(v.farmersPend) + ' still unpaid', meta: 'Financials', go: function () { self.go('proc', 'fin'); } },
        { dot: 'dot ' + (slow ? 'warn' : 'good'), text: slow + ' mills below 45% CMR delivery', meta: 'CMR', go: function () { self.go('cmr', 'overview'); } },
        { dot: 'dot ' + tone(v.p1, 0, 2, false), text: v.p1 + ' critical incidents open in the district', meta: 'Alerts', go: function () { self.go('all', 'alerts'); } },
        { dot: 'dot ' + (aged ? 'warn' : 'good'), text: aged + ' godowns with over 14% stock aged beyond 6 months', meta: 'Storage', go: function () { self.go('stor', 'overview'); } }
      ];
      return { title: "Today's actions — " + dn, sub: 'Ordered for the ' + SE.short.toLowerCase(), items: items };
    }
    const ds = D.map(function (d) { return { name: d.name, v: distVals(d.name) }; });
    const key = SE.map; const worst = ds.slice().sort(function (a, b) { return key === 'util' ? b.v.util - a.v.util : a.v[key] - b.v[key]; })[0];
    let esc = 0; D.forEach(function (d) { incidentsOf(d.name).forEach(function (i) { if (i.prio === 'P1' && i.status === 'Escalated') esc++; }); });
    const slowPay = ds.filter(function (x) { return x.v.pay24 < 0.8; }).length;
    const sv = stateVals();
    let weak = 0, wv = 1; PREP.forEach(function (p, i) { let s = 0; D.forEach(function (d) { s += prepVal(d.name, i); }); s /= D.length; if (s < wv) { wv = s; weak = i; } });
    const MET = { procPct: 'of procurement target', cmrPct: 'CMR delivered', util: 'godown utilisation' };
    return { title: 'Needs your attention', sub: 'Exceptions only · state-wide', items: [
      { dot: 'dot bad', text: worst.name + ' at ' + pct(worst.v[key]) + ' ' + MET[key], meta: 'Lowest district', go: function () { self.go(key === 'procPct' ? 'proc' : key === 'cmrPct' ? 'cmr' : 'stor', 'overview', [worst.name]); } },
      { dot: 'dot ' + (esc ? 'bad' : 'good'), text: esc + ' escalated critical incidents awaiting action', meta: 'Incidents', go: function () { self.go('all', 'alerts', []); } },
      { dot: 'dot ' + (slowPay ? 'warn' : 'good'), text: slowPay + ' districts paying under 80% of farmers within 24 h', meta: 'Financials', go: function () { self.go('proc', 'fin', []); } },
      { dot: 'dot warn', text: fmtN(sv.camsOff) + ' CCTV cameras offline at buffer godowns and MLS points', meta: 'CCTV', go: function () { self.go('all', 'cctv', []); } },
      { dot: 'dot ' + tone(wv, 0.85, 0.72), text: 'Weakest readiness: ' + PREP[weak][0] + ' (' + pct(wv) + ')', meta: SE.next, go: function () { self.go('all', 'prep', []); } }
    ] };
  }

  buildAlerts(path, stage) {
    const self = this; const depth = path.length;
    const sOK = self._seasOK || function () { return true; };
    const filt = function (l) { return l.filter(function (i) { return (stage === 'all' || i.stage === stage) && sOK(i.stage) && self.inWin(i.ageH); }); };
    const dns = depth ? [path[0]] : D.map(function (d) { return d.name; });
    let all = []; dns.forEach(function (dn) { all = all.concat(filt(incidentsOf(dn))); });
    const cnt = function (l, f) { return l.filter(f).length; };
    const open = all.length, p1 = cnt(all, function (i) { return i.prio === 'P1'; }), p2 = cnt(all, function (i) { return i.prio === 'P2'; }), esc = cnt(all, function (i) { return i.status === 'Escalated'; }), pg = (function () { let n = 0; dns.forEach(function (dn) { n += grievOf(dn).filter(function (g) { return g.open && (stage === 'all' || g.stage === stage) && self.inWin(g.ageH); }).length; }); return n; })();
    const avgAge = open ? all.reduce(function (a, i) { return a + i.ageH; }, 0) / open : 0;
    const clF = function (l) { return l.filter(function (f) { return stage === 'all' || f.Category === CATN[stage]; }); };
    let closedN = 0; dns.forEach(function (dn) { closedN += clF(incClosedOf(dn)).length; });
    const k = function (label, value, sub, t, key) { return self.mkK(label, value, sub, t, key); };
    const page = { title: 'Incidents', sub: MODS[2].src, kpis: [k('Open incidents', fmtN(open), 'across ' + dns.length + (dns.length > 1 ? ' districts' : ' district'), '', 'inc_open'), k('Critical', fmtN(p1), 'diversion, fraud or procurement stopped · respond in 4 h', tone(p1, 0, 3, false), 'p1'), k('High', fmtN(p2), 'respond within 24 h', tone(p2, 5, 15, false), 'inc_high'), k('Escalated', fmtN(esc), fmtN(cnt(all, function (i) { return i.escTo === 'District office'; })) + ' to district office · ' + fmtN(cnt(all, function (i) { return i.escTo === 'Head office'; })) + ' to head office', tone(esc, 2, 8, false), 'inc_esc'), k('Closed', fmtN(closedN), 'resolved and closed', 'good', 'inc_closed'), k('Grievances (PGRS + IVRS)', fmtN(pg), 'from farmers & beneficiaries', '', 'inc_grv'), k('Avg age of open items', fmtN(avgAge, 0) + ' h', 'since raised', tone(avgAge, 24, 72, false))] };
    if (stage !== 'all') { page.hasFilter = true; page.filter = STAGE_NAME[stage]; }
    if (depth <= 1) page.chain = this.chainFor(all, depth ? path[0] : 'Andhra Pradesh');
    { const af = function (dn) { const l = filt(incidentsOf(dn)); return { open: l.length, p1: cnt(l, function (i) { return i.prio === 'P1'; }), p2: cnt(l, function (i) { return i.prio === 'P2'; }), esc: cnt(l, function (i) { return i.status === 'Escalated'; }), escD: cnt(l, function (i) { return i.escTo === 'District office'; }), escH: cnt(l, function (i) { return i.escTo === 'Head office'; }), cl: clF(incClosedOf(dn)).length, pg: grievOf(dn).filter(function (g) { return g.open && (stage === 'all' || g.stage === stage) && self.inWin(g.ageH); }).length, age: l.reduce(function (a, i) { return a + i.ageH; }, 0) }; };
      const N = function (k) { return function (o) { return o[k]; }; }; const fn = function (x) { return fmtN(x); };
      const specs = [
        { cols: [['Critical', 'p1', 'n'], ['High', 'p2', 'n'], ['Escalated', 'esc', 'n']], res: ['Open incidents', N('open'), fn] },
        { cols: [['All open incidents', 'open', 'n']], res: ['Critical', N('p1'), fn] },
        { cols: [['All open incidents', 'open', 'n']], res: ['High', N('p2'), fn] },
        { cols: [['To district office', 'escD', 'n'], ['To head office', 'escH', 'n']], res: ['Escalated', N('esc'), fn] },
        { cols: [['Open incidents', 'open', 'n']], res: ['Closed', N('cl'), fn] },
        { cols: [['All open incidents', 'open', 'n']], res: ['Grievances (PGRS + IVRS)', N('pg'), fn] },
        { cols: [['Open items', 'open', 'n'], ['Total hours open', 'age', 'n']], res: ['Avg age', function (o) { return o.age / (o.open || 1); }, function (x) { return fmtN(x, 0) + ' h'; }] }
      ];
      const afm = function (mid, m) { const l = filt(incidentsOf(m.dn)).filter(function (i) { return i.mandal === m.name; }); return { open: l.length, p1: cnt(l, function (i) { return i.prio === 'P1'; }), p2: cnt(l, function (i) { return i.prio === 'P2'; }), esc: cnt(l, function (i) { return i.status === 'Escalated'; }), escD: cnt(l, function (i) { return i.escTo === 'District office'; }), escH: cnt(l, function (i) { return i.escTo === 'Head office'; }), cl: clF(incClosedOf(m.dn)).filter(function (f) { return f.Mandal === m.name; }).length, pg: grievOf(m.dn).filter(function (g) { return g.open && g.mandal === m.name && (stage === 'all' || g.stage === stage) && self.inWin(g.ageH); }).length, age: l.reduce(function (a, i) { return a + i.ageH; }, 0) }; };
      specs.forEach(function (sp, i) { sp.f = af; sp.fm = afm; page.kpis[i]._info.tab = sp; });
      const hi = page.kpis.splice(2, 1)[0]; page.kpis.splice(4, 0, hi); }
    if (depth <= 1) {
      const T2 = function (x, t) { return Object.assign(C(x, t || ''), { cls: 'txt' }); };
      const trows = []; ['proc', 'cmr', 's1', 's2', 'stor'].forEach(function (stg) { (INC_T[stg] || []).forEach(function (t) { const l = all.filter(function (i) { return i.title === t[0]; }); if (stage !== 'all' && stg !== stage) return;
        trows.push({ name: t[0], keepDrill: true, cells: [T2(STAGE_NAME[stg] + ' · ' + t[2]), T2(SEV[SEV_BASE[t[0]] || 'P3'], (SEV_BASE[t[0]] || 'P3') === 'P1' ? 'bad' : (SEV_BASE[t[0]] || 'P3') === 'P2' ? 'warn' : ''), C(fmtN(l.length)), C(fmtN(cnt(l, function (i) { return i.prio === 'P1'; })), cnt(l, function (i) { return i.prio === 'P1'; }) ? 'bad' : ''), C(fmtN(cnt(l, function (i) { return i.status === 'Escalated'; })))],
          drill: l.length ? function () { self.tablePopup(t[0] + (depth ? ' · ' + path[0] : ''), fmtN(l.length) + ' open · priority first', ['Incident', 'Severity', 'District', 'Mandal', 'Status', 'Age'], l.map(function (i) { return { name: i.id, cells: [T2(SEV[i.prio], i.prio === 'P1' ? 'bad' : ''), T2(i.dn), T2(i.mandal), T2(i.status + (i.escTo ? ' · ' + i.escTo : ''), i.status === 'Escalated' ? 'bad' : ''), C(i.ageH + ' h')], drill: function () { self.setState({ rxRec: self.rxBack(self.incRec(i)) }); } }; }), null, 'incident-type'); } : null }); }); });
      const s = this.state; const itq = (s.itQ || '').trim().toLowerCase(); const words = itq.split(/\s+/).filter(Boolean);
      const hay = function (r) { const t = r.name; const c = ADB.map[t] ? ADB.cat[ADB.map[t]] : null; const code = (Object.keys(INC_T).map(function (k) { return INC_T[k].filter(function (x) { return x[0] === t; })[0]; }).filter(Boolean)[0] || [])[3] || ''; return (t + ' ' + r.cells.map(function (x) { return x.v; }).join(' ') + ' ' + code + ' ' + (c ? c.id + ' ' + c.name + ' ' + c.subName : '')).toLowerCase(); };
      const trF = words.length ? trows.filter(function (r) { const h = hay(r); return words.every(function (w) { return h.indexOf(w) >= 0; }); }) : trows;
      const sumc = function (k) { return trF.reduce(function (a, r) { return a + (parseInt(String(r.cells[k].v).replace(/,/g, ''), 10) || 0); }, 0); };
      page.hasT2 = true; page.t2 = this.table('Incident types' + (depth ? ' · ' + path[0] : ''), SEV_RULE + ' Click a type for its records.', ['Incident type', 'Stage · point', 'Severity by type', 'Open', 'Critical now', 'Escalated'], trF, [C(''), C(''), C(fmtN(words.length ? sumc(2) : open)), C(fmtN(words.length ? sumc(3) : p1)), C(fmtN(words.length ? sumc(4) : esc))], words.length ? 'Total · matching types' : 'Total', 'incident-types');
      Object.assign(page.t2, { hasQ: true, qPh: 'Search incident types: name, stage, point, rule code…', q: s.itQ || '', hasQv: !!itq, onQ: function (e) { self.setState({ itQ: e.target.value }); }, clearQ: function () { self.setState({ itQ: '' }); }, noMatch: words.length > 0 && !trF.length, noMatchText: 'No incident type matches "' + (s.itQ || '') + '". Try a word such as gunny, GPS, truck chit, CMR, godown, payment, or a rule code such as A2 or S2-01.', count: fmtN(trF.length) + ' of ' + fmtN(trows.length) + ' types' });
    }
    /* anomalies by stage and point: one button per stage, each with a multi-select of its points (Stage 1 split by movement) */
    if (depth <= 1) {
      const sel = this.state.incSel || {}; const openK = this.state.incOpen || null;
      const keyOf = function (i) { return i.stage + '|' + i.ent + (i.mv ? '|' + i.mv : ''); };
      const treeOf = function (stg) { const o = []; INC_GRP.forEach(function (g) { if (g[0] !== stg) return;
          if (stg === 's1' && g[1] === 'Transport') { const b = stg + '|' + g[1] + '|'; o.push({ k: b + '*', name: 'Transport', kids: [{ k: b + 'inter', name: 'Inter-district', kids: [{ k: b + S1_MV[0], name: 'Road' }, { k: b + S1_MV[1], name: 'Rail' }] }, { k: b + S1_MV[2], name: 'Intra-district' }] }); }
          else o.push({ k: stg + '|' + g[1], name: g[1] }); }); return o; };
      const leaves = function (n) { return n.kids ? [].concat.apply([], n.kids.map(leaves)) : [n]; };
      const optsOf = function (stg) { return [].concat.apply([], treeOf(stg).map(leaves)); };
      const exp = this.state.incExp || {};
      const setSel = function (o) { self.setState({ incSel: o }); };
      const stages = ['proc', 'cmr', 's1', 's2', 'stor'].map(function (stg) {
        const opts = optsOf(stg); const nSel = opts.filter(function (o) { return sel[o.k]; }).length; const isOpen = openK === stg;
        const sl = all.filter(function (i) { return i.stage === stg; }); const SV = [['P1', 'Critical', 'sv1'], ['P2', 'High', 'sv2'], ['P3', 'Medium', 'sv3'], ['P4', 'Low', 'sv4']].map(function (x) { const n = sl.filter(function (i) { return i.prio === x[0]; }).length; return { n: n, t: x[1] + ' ' + n, cls: 'svb ' + x[2], lab: x[1], has: n > 0 }; });
        const pts = (function () { const out = []; const walk = function (nodes, lvl) { nodes.forEach(function (x) { const lv = leaves(x); const nOn = lv.filter(function (y) { return sel[y.k]; }).length; const on = nOn === lv.length; const part = nOn > 0 && !on; const n = sl.filter(function (i) { return lv.some(function (y) { return keyOf(i) === y.k; }); }).length;
            const isExp = !!x.kids && (exp[x.k] !== undefined ? !!exp[x.k] : nOn > 0);
            out.push({ hasK: !!x.kids, arrow: isExp ? '▾' : '▸', rcls: 'isrw lv' + lvl, expand: function () { const e = Object.assign({}, self.state.incExp || {}); e[x.k] = !isExp; self.setState({ incExp: e }); }, name: x.name, n: fmtN(n), on: on, mark: on ? '✓' : part ? '–' : '', cls: 'ispt' + (on ? ' on' : part ? ' part' : '') + (n ? '' : ' zero'), pick: function () { const o = Object.assign({}, self.state.incSel || {}); lv.forEach(function (y) { if (on) delete o[y.k]; else o[y.k] = true; }); const st = { incSel: o }; if (x.kids) { const e = Object.assign({}, self.state.incExp || {}); e[x.k] = !on; st.incExp = e; } self.setState(st); } });
            if (x.kids && isExp) walk(x.kids, lvl + 1); }); }; walk(treeOf(stg), 0); return out; })();
        return { total: fmtN(sl.length), sev: SV.filter(function (v) { return v.has; }), sevTxt: SV.filter(function (v) { return v.has; }).map(function (v) { return v.lab + ' ' + v.n; }).join(' · ') || 'No open incidents', pts: pts, ccls: 'iscard' + (nSel ? ' on' : ''), selTxt: nSel ? nSel + ' of ' + opts.length + ' points selected' : '', hasSelTxt: nSel > 0,
          label: STAGE_NAME[stg], count: nSel ? nSel + ' of ' + opts.length : fmtN(sl.length), open: isOpen,
          cls: 'isb' + (nSel ? ' on' : '') + (isOpen ? ' open' : ''),
          toggle: function () { self.setState({ incOpen: isOpen ? null : stg }); }, close: function () { self.setState({ incOpen: null }); },
          all: function () { const o = Object.assign({}, self.state.incSel || {}); opts.forEach(function (x) { o[x.k] = true; }); setSel(o); },
          none: function () { const o = Object.assign({}, self.state.incSel || {}); opts.forEach(function (x) { delete o[x.k]; }); setSel(o); },
          opts: (function () { const out = []; const walk = function (nodes, lvl) { nodes.forEach(function (x) { const lv = leaves(x); const nOn = lv.filter(function (y) { return sel[y.k]; }).length; const on = nOn === lv.length; const part = nOn > 0 && !on; const isExp = !!exp[x.k];
              out.push({ name: x.name, n: fmtN(all.filter(function (i) { return lv.some(function (y) { return keyOf(i) === y.k; }); }).length), on: on, mark: on ? '✓' : part ? '–' : '', cls: 'mso' + (on || part ? ' on' : ''), rcls: 'isrow lv' + lvl, hasKids: !!x.kids, noKids: !x.kids, arrow: isExp ? '▾' : '▸',
                expand: function () { const e = Object.assign({}, self.state.incExp || {}); if (e[x.k]) delete e[x.k]; else e[x.k] = true; self.setState({ incExp: e }); },
                pick: function () { const o = Object.assign({}, self.state.incSel || {}); lv.forEach(function (y) { if (on) delete o[y.k]; else o[y.k] = true; }); setSel(o); } });
              if (x.kids && isExp) walk(x.kids, lvl + 1); }); }; walk(treeOf(stg), 0); return out; })() };
      });
      const selKeys = Object.keys(sel).filter(function (k) { return sel[k]; });
      const recs = selKeys.length ? all.filter(function (i) { return sel[keyOf(i)]; }) : all;
      const T = function (x, t) { return Object.assign(C(x, t || ''), { cls: 'txt' }); };
      const rowOf = function (i) { return { name: i.id, cells: [T(i.title), T(STAGE_NAME[i.stage] + ' · ' + i.ent + (i.mv ? ' · ' + i.mv : '')), T(SEV[i.prio], i.prio === 'P1' ? 'bad' : i.prio === 'P2' ? 'warn' : ''), T(i.dn), T(i.mandal), T(i.status, i.status === 'Escalated' ? 'bad' : ''), C(i.ageH + ' h')], drill: function () { self.setState({ rxRec: self.rxBack(self.incRec(i)) }); } }; };
      const CAP = 40; const labels = ['Incident ID', 'Incident', 'Stage · point', 'Severity', 'District', 'Mandal', 'Status', 'Age'];
      page.isel = { title: 'Incidents by Stage' + (depth ? ' · ' + path[0] : ''), note: 'Open incidents by stage and point · tick points (you can mix stages) to narrow the records below',
        stages: stages, hasSel: selKeys.length > 0, clear: function () { self.setState({ incSel: {}, incOpen: null }); },
        chips: selKeys.map(function (k) { const p = k.split('|'); return { label: STAGE_NAME[p[0]] + ' · ' + p.slice(1).join(' · ').replace('Inter-district · road', 'Inter-district · Road').replace('Inter-district · rail', 'Inter-district · Rail'), rm: function () { const o = Object.assign({}, self.state.incSel || {}); delete o[k]; setSel(o); } }; }),
        cols: labels.map(function (l, j) { return { label: l, cls: 'th' + (j === 0 ? ' first' : j < labels.length - 1 ? ' txt' : '') }; }), grid: 'minmax(120px,0.8fr) minmax(220px,2.2fr) minmax(150px,1.2fr) repeat(5, minmax(80px,0.7fr))',
        rows: recs.slice(0, CAP).map(function (i) { const r = rowOf(i); return { name: r.name, go: r.drill, cells: r.cells.map(function (c) { return { v: c.v, cls: 'td ' + (c.cls || '') + ' ' + (c.t || '') }; }) }; }),
        count: (selKeys.length ? fmtN(recs.length) + ' records for ' + selKeys.length + ' selected point' + (selKeys.length === 1 ? '' : 's') : fmtN(recs.length) + ' open incidents · all points') + '',
        hasRows: false, noRows: selKeys.length > 0 && recs.length === 0, pickHint: false, hasCount: recs.length > 0, viewLabel: 'View all ' + fmtN(recs.length) + ' incidents →',
        viewAll: function () { self.tablePopup('Incident records' + (depth ? ' · ' + path[0] : ''), selKeys.length ? selKeys.length + ' selected points' : 'All open anomalies', labels, recs.map(rowOf), null, 'anomaly-records'); } };
    }
    if (depth === 0) {
      const rows = D.map(function (d) { const l = filt(incidentsOf(d.name)); return { d: d, l: l }; }).map(function (x) {
        const l = x.l; const oldest = l.reduce(function (a, i) { return Math.max(a, i.ageH); }, 0); const c1 = cnt(l, function (i) { return i.prio === 'P1'; });
        return { name: x.d.name, cells: [C(fmtN(l.length)), C(fmtN(c1), tone(c1, 0, 2, false)), C(fmtN(cnt(l, function (i) { return i.prio === 'P2'; }))), C(fmtN(cnt(l, function (i) { return i.prio === 'P3' || i.prio === 'P4'; }))), C(fmtN(cnt(l, function (i) { return i.status === 'Escalated'; }))), C(oldest + ' h', tone(oldest, 48, 120, false))], drill: function () { self.drill(x.d.name); } };
      });
      page.hasTable = true; page.table = this.table('District-wise view', 'Click a district to see its incidents', ['District', 'Open', 'Critical', 'High', 'Medium / low', 'Escalated', 'Oldest open'], rows, [C(fmtN(open)), C(fmtN(p1)), C(fmtN(p2)), C(fmtN(open - p1 - p2)), C(fmtN(esc)), C('')], 'Andhra Pradesh', 'incidents-by-district');
      page.hasChart = true; page.chart = { title: 'Incidents by source', src: '', bars: Object.keys(SRC).map(function (s) { return { k: s, n: cnt(all, function (i) { return i.src === s; }) }; }).sort(function (a, b) { return b.n - a.n; }).map(function (x, i, arr) { return { label: SRC[x.k], w: Math.round(x.n / (arr[0].n || 1) * 100), v: fmtN(x.n), c: '#5B8FD0' }; }) };
    } else if (depth === 1) {
      const rows = all.slice(0, 60).map(function (i) { return { name: i.id, pill: i.prio, pillTxt: SEV[i.prio], cells: [Object.assign(C(i.title), { cls: 'txt' }), Object.assign(C(STAGE_NAME[i.stage] + ' · ' + i.ent + (i.mv ? ' · ' + i.mv : '')), { cls: 'txt' }), Object.assign(C(SRC[i.src]), { cls: 'txt' }), Object.assign(C(i.mandal), { cls: 'txt' }), Object.assign(C(i.status, i.status === 'Escalated' ? 'bad' : i.status === 'Open' ? 'warn' : ''), { cls: 'txt' }), C(i.ageH + ' h', tone(i.ageH, 24, 72, false))], drill: function () { self.drill(i.id); } }; });
      page.hasTable = true; page.table = this.table('Incidents · ' + path[0], 'Priority first, then oldest · click an incident for its trail and evidence', ['Incident ID', 'Incident', 'Stage · point', 'Source', 'Mandal', 'Status', 'Age'], rows, null, null, 'incidents-' + path[0]);
    } else {
      const i = TX[path[1]] || incidentsOf(path[0])[0];
      const st = function (label, meta, cls) { return { label: label, meta: meta, cls: 'step ' + (cls || 'done') }; };
      const OWN = { proc: 'Procurement wing', cmr: 'CMR cell', s1: 'Transport cell', s2: 'Distribution wing', stor: 'Storage wing' };
      { const ev = incEvidence(i); page.hasT2 = true; page.t2 = this.table('Records behind this incident · ' + i.id, i.title, ['Record', 'Detail'], ev.map(function (r) { return { name: r[0], cells: [Object.assign(C(r[1]), { cls: 'txt' })] }; }), null, '', i.id); }
      page.hasDetail = true; page.deepInc = { on: true, go: function () { self.setState({ rxRec: self.incRec(i) }); } };
      page.detail = { title: i.id + ' · ' + i.title, src: SRC[i.src], facts: [{ k: 'Severity', v: SEV[i.prio] }, { k: 'Why this severity', v: i.why }, { k: 'Stage', v: STAGE_NAME[i.stage] }, { k: 'Point', v: i.ent + (i.mv ? ' · ' + i.mv : '') }, { k: 'Rule', v: incRule(i.code, i.title) }, { k: 'District / mandal', v: i.dn + ' / ' + i.mandal }, { k: 'Source', v: SRC[i.src] }, { k: 'Status', v: i.status + (i.escTo ? ' · to ' + i.escTo : '') }, { k: 'Age', v: i.ageH + ' hours' }, { k: 'Owner', v: OWN[i.stage] }],
        steps: [st('Raised via ' + SRC[i.src], i.ageH + ' h ago'), st('Classified ' + SEV[i.prio].toLowerCase() + ' · ' + i.why, 'Auto-assigned to ' + OWN[i.stage]), st('Acknowledged by district team', 'Within SLA', i.status === 'Open' ? 'now' : 'done'), st('Field verification with GPS and CCTV evidence', 'Evidence attached below', i.status === 'Open' ? '' : i.status === 'Escalated' ? 'bad' : 'now'), st(i.status === 'Escalated' ? 'Escalated to head office' : 'Resolution and closure', i.status, i.status === 'Escalated' ? 'bad' : '')],
        planned: '20,120 80,100 140,86 200,64 250,44 280,30', actual: i.src === 'GPS' ? '20,120 80,100 110,128 165,124 205,70 250,44 280,30' : '20,121 79,99 141,88 199,62 251,45 280,30', trailColor: i.src === 'GPS' ? '#C2502E' : '#2B5FA5', gpsNote: i.src === 'GPS' ? 'Deviation that triggered this alert.' : 'Nearest vehicle trail for context.', cam: i.ent === 'Buffer godown' || i.ent === 'MLS point' ? i.ent + ' camera · ' + i.mandal : 'No CCTV at ' + (i.ent === 'Transport' ? 'vehicles' : i.ent + 's') + ' — CCTV covers buffer godowns and MLS points only', camTs: i.ageH + ' h ago' };
    }
    return page;
  }

  /* ---------- Act: ask Intelligence what to do on a record ---------- */
  openAct(ctx) { this.setState({ act: { ctx: ctx, res: actSuggest(ctx), done: null } }); }
  undoAct(id) { const l = (this.state.actLog || readActLog()).filter(function (x) { return x.id !== id; }); saveActLog(l); const a = this.state.act; this.setState({ actLog: l, act: a && a.done && a.done.id === id ? Object.assign({}, a, { done: null, esc: null }) : a }); }
  logAct(decision, sug, extra) {
    const a = this.state.act; if (!a) return; const r = a.res; const log = (this.state.actLog || readActLog()).slice();
    const id = 'ACT-' + pad((log.reduce(function (m, x) { const k = parseInt(String(x.id).replace(/\D/g, ''), 10) || 0; return Math.max(m, k); }, 0)) + 1, 4); extra = extra || {};
    const st0 = this.state; const incO = (String(r.name).match(/INC-[A-Z]+-\d{4}(?!\d)/) || [])[0]; const stg = incO && TX[incO] ? TX[incO].stage : st0.stage;
    const MODN = { overview: st0.stage === 'all' ? 'Overview' : 'Stage tabs', fin: 'Financials', prep: 'Preparedness', alerts: 'Incidents', cctv: 'CCTV records', gps: 'GPS tracking', intel: 'Intelligence', glance: 'At a glance' };
    const e = { byRole: st0.role, stage: stg || 'all', mod: MODN[st0.module] || st0.module, id: id, at: Date.now(), rec: r.name, kind: r.kind, where: a.ctx.where || '', dn: r.dn || '', decision: decision, action: sug ? sug.act : '', owner: decision === 'Decided' ? (sug ? sug.owner : '') : decision.replace('Escalated to ', ''), by: extra.due ? 'Due ' + extra.due : sug ? sug.by : '', status: 'Open', remarks: extra.remarks || '', prio: extra.prio || '', cc: extra.cc || '', facts: (a.ctx.facts || []).slice(0, 8).map(function (f) { return { k: String(f.k), v: String(f.v) }; }) };
    log.unshift(e); saveActLog(log);
    const txt = decision === 'Decided' ? 'Assigned to ' + e.owner + (e.by && e.by !== '—' ? ' · ' + e.by : '') + '. It is in the decision log on the Intelligence tab.' : decision === 'Remind me later' ? 'It will stay in the decision log on the Intelligence tab as a reminder.' : 'Sent with the record, the suggested action' + (extra && extra.remarks ? ' and your remarks' : '') + ', so they can decide. It is in the decision log on the Intelligence tab.';
    this.setState({ actLog: log, act: Object.assign({}, a, { esc: null, done: { id: id, title: id + ' · ' + decision, text: txt } }) });
  }
  actUI() {
    const self = this; const a = this.state.act;
    if (!a) return { canEscDM: false, hasEsc: false, escTo: '', esc: { remarks: '', prio: 'Normal', due: '', cc: '', pick: 0 }, escOn: { pick: function () {}, remarks: function () {}, prio: function () {}, due: function () {}, cc: function () {} }, escSugs: [], escSend: function () {}, escCancel: function () {}, undo: function () {}, has: false, sugs: [], ctxFacts: [], close: function () {}, stop: function () {}, escDM: function () {}, escHO: function () {}, later: function () {}, isDone: false, notDone: true, doneTitle: '', doneText: '', toLog: function () {}, kind: '', title: '', where: '', dmLabel: '' };
    const r = a.res; const done = !!a.done;
    const actPress = (function () { const blob = String(r.name) + ' ' + (a.ctx.facts || []).map(function (f) { return f.v; }).join(' '); if (/^(CLP-|YouTube)/.test(String(r.name))) return null; const hit = MT_ORDER.filter(function (k) { return MT[k].re.test(blob); }); if (!hit.length) return null; const d = r.dn || a.ctx.dn || null; return (d && pressWhy([hit[0]], [d])) || pressWhy([hit[0]], null); })();
    const isDMv = this.state.role === 'dm'; const sugL = isDMv ? r.sugs.filter(function (g) { return !/^Escalate to District Manager/i.test(g.act); }) : r.sugs;
    return {
      canEscDM: !isDMv, has: true, kind: r.kind, title: r.name, where: a.ctx.where || '', dmLabel: r.dm,
      ctxFacts: (a.ctx.facts || []).filter(function (f) { return f && f.k && String(f.v) !== ''; }).slice(0, 8).map(function (f) { return { k: f.k, v: String(f.v) }; }),
      hasCtx: (a.ctx.facts || []).length > 0,
      sugs: sugL.map(function (g0, i) { const g = Object.assign({}, g0, { why: g0.why.concat(actPress && g0.why.indexOf(actPress) < 0 ? [actPress] : []) }); const wo = !!(a.whyOpen || {})[i]; return { whyOpen: wo, whyLabel: (wo ? '▾ Why' : '▸ Why') + ' · ' + g.why.length + ' reason' + (g.why.length === 1 ? '' : 's'), toggleWhy: function () { const o = Object.assign({}, self.state.act.whyOpen || {}); o[i] = !wo; self.setState({ act: Object.assign({}, self.state.act, { whyOpen: o }) }); }, rank: i === 0 ? 'Suggested' : 'Alternative', cls: 'agc' + (i === 0 ? ' main' : ''), act: g.act, why: wo ? self.whyItems(g.why, { dn: r.dn || a.ctx.dn || actDist(String(a.ctx.name) + ' ' + String(a.ctx.where || '')), key: a.ctx.kpi ? a.ctx.kpi.key : null, action: g.act, facts: a.ctx.facts || [], incId: (String(a.ctx.name) + ' ' + (a.ctx.facts || []).map(function (f) { return f.v; }).join(' ')).match(/INC-[A-Z]{2,4}-\d{4}(?!\d)/) ? (String(a.ctx.name) + ' ' + (a.ctx.facts || []).map(function (f) { return f.v; }).join(' ')).match(/INC-[A-Z]{2,4}-\d{4}(?!\d)/)[0] : null }) : g.why.map(function (w) { return { t: w, incs: [], hasInc: false, incN: '', ask: function () {} }; }), owner: g.owner, by: g.by, effect: g.effect, decide: function () { self.logAct('Decided', g); }, canDecide: !done && g.owner !== '—' }; }),
      escDM: function () { self.setState({ act: Object.assign({}, self.state.act, { esc: { to: r.dm, remarks: '', prio: 'Normal', due: '', cc: '', pick: 0 } }) }); }, escHO: function () { self.setState({ act: Object.assign({}, self.state.act, { esc: { to: 'Head office', remarks: '', prio: 'Normal', due: '', cc: '', pick: 0 } }) }); }, later: function () { self.logAct('Remind me later', r.sugs[0]); },
      hasEsc: !!a.esc && !done, escTo: a.esc ? a.esc.to : '', esc: a.esc || { remarks: '', prio: 'Normal', due: '', cc: '', pick: 0 },
      escSet: function (k) { return function (e) { const o = Object.assign({}, self.state.act.esc); o[k] = k === 'pick' ? parseInt(e.target.value, 10) || 0 : e.target.value; self.setState({ act: Object.assign({}, self.state.act, { esc: o }) }); }; },
      escOn: (function () { const o = {}; ['pick', 'remarks', 'prio', 'due', 'cc'].forEach(function (k) { o[k] = function (e) { const x = Object.assign({}, self.state.act.esc); x[k] = k === 'pick' ? parseInt(e.target.value, 10) || 0 : e.target.value; self.setState({ act: Object.assign({}, self.state.act, { esc: x }) }); }; }); return o; })(),
      escSugs: r.sugs.map(function (g, i) { const on = (a.esc ? a.esc.pick : 0) === i; return { i: String(i), label: (on ? '● ' : '○ ') + (i === 0 ? 'Suggested: ' : 'Alternative: ') + g.act, cls: 'escopt' + (on ? ' on' : ''), pick: function () { self.setState({ act: Object.assign({}, self.state.act, { esc: Object.assign({}, self.state.act.esc, { pick: i }) }) }); } }; }),
      escSend: function () { const x = self.state.act.esc; self.logAct('Escalated to ' + x.to, r.sugs[x.pick] || r.sugs[0], x); }, escCancel: function () { self.setState({ act: Object.assign({}, self.state.act, { esc: null }) }); },
      undo: function () { if (self.state.act && self.state.act.done) self.undoAct(self.state.act.done.id); },
      isDone: done, notDone: !done && !a.esc, doneTitle: done ? a.done.title : '', doneText: done ? a.done.text : '',
      toLog: function () { self.setState({ act: null, rxRec: null, kpiOpen: null, module: 'intel', stage: 'all', pivot: false, logStage: 'all', logMod: 'all', intelTab: 'log' }); },
      close: function () { self.setState({ act: null }); }, stop: function (e) { if (e && e.stopPropagation) e.stopPropagation(); }
    };
  }
  openLogEntry(id) {
    const self = this; const e = (this.state.actLog || readActLog()).filter(function (x) { return x.id === id; })[0]; if (!e) return;
    const facts = [{ k: 'Decision', v: e.decision }, { k: 'When', v: new Date(e.at).toLocaleString('en-IN') }, { k: 'Record', v: e.rec + ' (' + e.kind + ')' }, { k: 'Suggested action', v: e.action || '—' }, { k: 'Owner', v: e.owner || '—' }, { k: 'Deadline', v: e.by || '—' }, { k: 'Status', v: e.status }]
      .concat(e.prio ? [{ k: 'Priority', v: e.prio }] : []).concat(e.remarks ? [{ k: 'Remarks', v: e.remarks }] : []).concat(e.cc ? [{ k: 'Copy to', v: e.cc }] : []).concat(e.dmStatus ? [{ k: 'District Manager status', v: e.dmStatus }] : []).concat((e.replies || []).map(function (r) { return { k: (r.done ? 'Done note · ' : 'Reply · ') + r.by, v: new Date(r.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' · ' + r.text }; })).concat((e.facts || []).map(function (f) { return { k: 'Record · ' + f.k, v: f.v }; }));
    this.setState({ rxRec: { back: this.state.rxRec || null, title: e.id + ' · ' + e.decision, sub: e.where || '', facts: facts, steps: [], links: [{ label: 'Undo this decision', go: function () { self.undoAct(e.id); self.setState({ rxRec: null }); } }].concat(e.status !== 'Done' ? [{ label: 'Mark done', go: function () { const l2 = (self.state.actLog || readActLog()).map(function (x) { return x.id === e.id ? Object.assign({}, x, { status: 'Done' }) : x; }); saveActLog(l2); self.setState({ actLog: l2 }); self.openLogEntry(e.id); } }] : []) } });
  }
  openLog() {
    const self = this; const log = this.state.actLog || readActLog(); const T = function (x, t) { return Object.assign(C(x, t || ''), { cls: 'txt' }); };
    const rows = log.map(function (e) { return { name: e.id, hasAct: false, cells: [T(new Date(e.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })), T(e.rec), T(e.decision, /Escalated/.test(e.decision) ? 'warn' : e.decision === 'Decided' ? 'good' : ''), T(e.owner || '—'), T(e.remarks || '—'), T(e.status, e.status === 'Done' ? 'good' : '')], drill: function () { self.openLogEntry(e.id); } }; });
    this.tablePopup('Decision log', log.length ? fmtN(log.length) + ' decisions and escalations from the Act buttons, newest first · click one for details, Undo or Mark done' : 'No decisions yet. Use Act on any record, table row or KPI.', ['Action', 'When', 'Record', 'Decision', 'Owner', 'Remarks', 'Status'], rows, null, 'decision-log');
  }
  ftoListPop(e, facts, only) {
    const self = this; const l = ftosOfRsk(e).filter(function (b) { return !only || b.group === only; }).slice().sort(function (a, b) { return (a.group === 'Credited' ? 1 : 0) - (b.group === 'Credited' ? 1 : 0) || a.hAgo - b.hAgo; });
    const T = function (x, t) { return Object.assign(C(x, t || ''), { cls: 'txt' }); }; const nc = l.filter(function (b) { return b.group !== 'Credited'; }).length;
    this.tablePopup('Farmer payments · ' + e.name + ', ' + LBL[e.mid], fmtN(l.length) + ' FTOs, one per farmer · ' + fmtN(nc) + ' not yet credited (listed first) · click one for the payment record', ['FTO', 'Farmer', 'Status', 'Bank response / UTR', 'Amount', 'Generated', 'Paid in'],
      l.map(function (b) { return { name: b.id, cells: [T(b.farmer), T(b.status, b.group === 'Credited' ? 'good' : b.group === 'Rejected' || b.group === 'Failed' ? 'bad' : 'warn'), T(b.resp), C(lakh(b.amt)), C(fmtDT(b.hAgo)), C(b.payH ? fmtH(b.payH) : '—', b.payH > 48 ? 'bad' : b.payH > 24 ? 'warn' : '')], drill: function () { self.setState({ rxRec: self.rxBack(self.rxRecord('fto', b)) }); } }; }), null, 'ftos-' + e.name, null, facts || null);
  }
  ftoStatusPop(dns, p, list, mid) {
    const self = this; const T = function (x, t) { return Object.assign(C(x, t || ''), { cls: 'txt' }); };
    if (list) return function () { self.tablePopup('FTOs · ' + p[0], fmtN(list.length) + ' FTOs, one per farmer, oldest first · click one for the payment record', ['FTO', 'Farmer', 'District', 'Mandal', 'RSK', 'Amount', 'Generated', 'Bank response / reason'], list.slice().sort(function (a, b) { return b.hAgo - a.hAgo; }).map(function (b) { TX[b.id] = b; return { name: b.id, cells: [T(b.farmer), T(b.dn), T(b.mandal), T(b.ppc), C(lakh(b.amt)), C(fmtDT(b.hAgo), b.hAgo > 48 ? 'bad' : ''), T(b.resp, b.group === 'Rejected' || b.group === 'Failed' ? 'bad' : '')], drill: function () { self.setState({ rxRec: self.rxBack(self.rxRecord('fto', b)) }); } }; }), null, 'fto-' + p[1]); };
    return function () { self.tablePopup('Credited FTOs · by district', 'One FTO per farmer paid · click a district for its mandals, RSKs and each farmer\'s payment', ['District', 'Credited FTOs', 'Amount'], dns.map(function (dn) { let n = 0, a = 0; entsOfDistrict(dn, 'proc').filter(function (e) { return !mid || e.mid === mid; }).forEach(function (e) { const k = ftoCountRsk(e); n += k.cr; a += k.cr ? e.v.paid : 0; }); return { name: dn, cells: [C(fmtN(n), 'good'), C(fmtCr(a))], drill: self.ftoDrill(dn, 'Credited') }; }), null, 'fto-credited'); };
  }
  ftoDrill(dn, only) {
    const self = this; const T = function (x, t) { return Object.assign(C(x, t || ''), { cls: 'txt' }); };
    const cnt = function (ents) { let n = 0, nc = 0, a = 0; ents.forEach(function (e) { const k = ftoCountRsk(e); n += k.n; nc += k.nc; a += k.amt; }); return [C(fmtN(n)), C(fmtN(n - nc), 'good'), C(fmtN(nc), nc ? 'warn' : ''), C(fmtCr(a))]; };
    return function () {
      self.tablePopup('All farmer payments · ' + dn + ' · by mandal', 'Every FTO, credited or not · click a mandal for its RSKs, an RSK for its farmers, a farmer for the payment record', ['Mandal', 'FTOs', 'Credited', 'Not yet credited', 'Amount'],
        mandalsOf(dn).map(function (m) { const ents = entsOf(m.id, 'proc'); return { name: m.name, cells: cnt(ents), drill: ents.length ? function () {
          self.tablePopup('All farmer payments · ' + m.name + ', ' + dn + ' · by RSK', 'Click an RSK for each farmer\'s payment', ['RSK', 'FTOs', 'Credited', 'Not yet credited', 'Amount'], ents.map(function (e) { return { name: e.name, cells: cnt([e]), drill: function () { self.ftoListPop(e, null, only); } }; }), null, 'ftos-' + m.name);
        } : null }; }), null, 'ftos-' + dn);
    };
  }
  openRecDetail(r) {
    const self = this;
    const from = this._aiFrom; const TABN = { overview: 'Overview', fin: 'Financials', prep: 'Preparedness', alerts: 'Incidents', cctv: 'CCTV records', gps: 'GPS tracking', glance: 'At a glance' };
    this.setState({ rxRec: { why: r.whyRaw || r.why.map(function (w) { return w.t; }), whyHint: { key: r.key, where: r.where.map(function (w) { return w.t; }), action: r.act, dn: this.state.path && this.state.path[0] || null }, title: r.title, sub: 'Intelligence · ' + r.area + ' · what to do', ai: r.act, facts: [{ k: 'Suggested action', v: r.act }].concat(r.hasWhere ? [{ k: 'Where', v: r.where.map(function (w) { return w.t; }).join(', ') }] : []).concat([{ k: 'Owner', v: r.owner }, { k: 'By', v: r.by }, { k: 'Expected', v: r.effect }]), steps: [], links: [{ label: 'View the records behind this', go: function () { r.view(); } }, { label: 'Act: decide or escalate', go: function () { r.doAct(); } }].concat(from ? [{ label: '← Back to ' + (from.module === 'overview' && from.stage !== 'all' ? STAGE_NAME[from.stage] : TABN[from.module] || 'the previous page'), go: function () { self._aiFrom = null; self.setState({ rxRec: null, module: from.module, stage: from.stage, path: from.path, pivot: false }); } }] : []) } });
  }
  /* Overview: incident work queue (critical & overdue, unassigned, nearing SLA) */
  incQueue(path) {
    const self = this; const s = this.state; const dl = path[0] ? [path[0]] : D.map(function (d) { return d.name; }); let inc = [];
    dl.forEach(function (d) { inc = inc.concat(incidentsOf(d).filter(function (i) { return self.inWin(i.ageH) && (!self._seasOK || self._seasOK(i.stage)); })); });
    const OWNS = { proc: 'District procurement officer', cmr: 'CMR cell', s1: 'Transport cell', s2: 'MLS point in-charge', stor: 'Storage wing' };
    const left = function (i) { return (SEV_RESP_H[i.prio] || 72) - i.ageH; };
    const views = {
      crit: { label: 'Critical & overdue', note: 'Critical incidents, and any incident open past its response time (Critical 4 h, High 24 h, Medium 72 h, Low 7 days)', f: function (i) { return i.prio === 'P1' || left(i) < 0; } },
      unas: { label: 'Unassigned', note: 'Status Open: no officer has picked the incident up yet', f: function (i) { return i.status === 'Open'; } },
      near: { label: 'Nearing SLA', note: 'Not yet overdue, but 75% or more of the response time has passed (Critical 4 h, High 24 h, Medium 72 h, Low 7 days), so they breach soon if nobody acts', f: function (i) { const r0 = SEV_RESP_H[i.prio] || 72; return left(i) >= 0 && left(i) <= r0 * 0.25; } }
    };
    const vk = views[s.qView] ? s.qView : 'crit'; const V = views[vk];
    const l = inc.filter(V.f).sort(function (a, b) { return left(a) - left(b); });
    return { tabs: Object.keys(views).map(function (k) { const n = inc.filter(views[k].f).length; return { label: views[k].label + ' · ' + fmtN(n), cls: 'qtab' + (k === vk ? ' on' : ''), pick: function () { self.setState({ qView: k }); } }; }), note: V.note + ' · ' + (path[0] || 'All districts') + ' · live, as of ' + new Date().toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      rows: l.slice(0, 40).map(function (i) { const lf = left(i); return { id: i.id, title: i.title, sev: SEV[i.prio], scls: 'qsev ' + i.prio, owner: i.status === 'Open' ? 'Unassigned' : i.status === 'Escalated' ? i.escTo : OWNS[i.stage], ocls: i.status === 'Open' ? 'qown un' : 'qown', loc: i.mandal + ', ' + i.dn, mod: STAGE_NAME[i.stage] + ' · ' + i.ent, age: hrs(i.ageH), sla: lf < 0 ? 'Overdue ' + hrs(-lf) : lf < 1 ? 'Under 1 h left' : hrs(lf) + ' left', slacls: 'qsla' + (lf < 0 ? ' bad' : ' warn'), view: function () { self.setState({ rxRec: self.incRec(i) }); } }; }),
      more: l.length > 40 ? 'Showing the 40 most urgent of ' + fmtN(l.length) : fmtN(l.length) + ' incident' + (l.length === 1 ? '' : 's'), none: l.length === 0, has: l.length > 0,
      all: function () { self.tablePopup('Incident work queue · ' + V.label, V.note, ['Incident ID', 'Incident', 'Severity', 'Owner', 'Location', 'Module', 'Age', 'SLA'], l.map(function (i) { const lf = left(i); const T = function (x, t) { return Object.assign(C(x, t || ''), { cls: 'txt' }); }; return { name: i.id, cells: [T(i.title), T(SEV[i.prio], i.prio === 'P1' ? 'bad' : ''), T(i.status === 'Open' ? 'Unassigned' : i.status === 'Escalated' ? i.escTo : OWNS[i.stage]), T(i.mandal + ', ' + i.dn), T(STAGE_NAME[i.stage] + ' · ' + i.ent), C(hrs(i.ageH)), C(lf < 0 ? 'Overdue ' + hrs(-lf) : hrs(lf) + ' left', lf < 0 ? 'bad' : 'warn')], drill: function () { self.setState({ rxRec: self.rxBack(self.incRec(i)) }); } }; }), null, 'incident-queue'); } };
  }
  /* Incidents: trends of closed incidents for the selected period */
  incTrends(path, stage) {
    const self = this; const s = this.state; const dl = path[0] ? [path[0]] : D.map(function (d) { return d.name; });
    const SN = { k25: 'Kharif 2025-26', r25: 'Rabi 2025-26', k26: 'Kharif 2026-27', k24: 'Kharif 2024-25', r24: 'Rabi 2024-25' };
    const sel = (s.seasons || []).filter(function (k) { return SN[k]; }).map(function (k) { return SN[k]; });
    const MONTHS = [['Oct', 'Kharif 2025-26', 2025], ['Nov', 'Kharif 2025-26', 2025], ['Dec', 'Kharif 2025-26', 2025], ['Jan', 'Kharif 2025-26', 2026], ['Feb', 'Kharif 2025-26', 2026], ['Mar', 'Kharif 2025-26', 2026], ['Apr', 'Rabi 2025-26', 2026], ['May', 'Rabi 2025-26', 2026], ['Jun', 'Rabi 2025-26', 2026], ['Jul', 'Rabi 2025-26', 2026], ['Aug', 'Rabi 2025-26', 2026], ['Sep', 'Rabi 2025-26', 2026], ['Oct', 'Kharif 2026-27', 2026]];
    const inSel = function (season) { return !sel.length || sel.indexOf(season) >= 0; };
    let cl = []; dl.forEach(function (d) { cl = cl.concat(incClosedOf(d)); }); if (stage !== 'all' && CATN[stage]) cl = cl.filter(function (f) { return f.Category === CATN[stage]; });
    let op = []; dl.forEach(function (d) { op = op.concat(incidentsOf(d)); }); if (stage !== 'all') op = op.filter(function (i) { return i.stage === stage; });
    const mi = function (f) { for (let j = 0; j < MONTHS.length; j++) if (MONTHS[j][0] === f.Month && MONTHS[j][1] === f.Season) return j; return -1; };
    const resolved = MONTHS.map(function () { return 0; }), raised = MONTHS.map(function () { return 0; });
    cl.forEach(function (f) { const j = mi(f); if (j < 0) return; resolved[j]++; const day = 1 + Math.floor(R(f.id + 'cday') * 28); const back = day - f.res >= 1 ? 0 : Math.ceil((f.res - day + 1) / 30); const k = Math.max(0, j - back); raised[k]++; });
    raised[MONTHS.length - 1] += op.length; /* open incidents were all raised this month (oldest is under 7 days) */
    const idx = MONTHS.map(function (m, j) { return j; }).filter(function (j) { return inSel(MONTHS[j][1]); });
    const clP = cl.filter(function (f) { return idx.indexOf(mi(f)) >= 0; });
    const SLA_D = { Critical: 3, High: 5, Medium: 7, Low: 10 };
    const rs = clP.map(function (f) { return f.res; }).sort(function (a, b) { return a - b; }); const med = rs.length ? (rs.length % 2 ? rs[(rs.length - 1) / 2] : (rs[rs.length / 2 - 1] + rs[rs.length / 2]) / 2) : null;
    const inSla = clP.filter(function (f) { return f.res <= (SLA_D[f.Severity] || 7); }).length;
    let gr = []; dl.forEach(function (d) { gr = gr.concat(grievOf(d)); }); if (stage !== 'all') gr = gr.filter(function (g) { return g.stage === stage; }); const reop = gr.filter(function (g) { return g.valid === 'Rejected · reopened'; }); const roI = self.reopenedIds(); const reopC = cl.filter(function (f) { return roI[f.id]; });
    const mx = Math.max.apply(null, idx.map(function (j) { return Math.max(raised[j], resolved[j]); }).concat([1]));
    const period = sel.length ? sel.join(', ') + ' (' + MONTHS[idx[0]][0] + ' ' + MONTHS[idx[0]][2] + ' – ' + MONTHS[idx[idx.length - 1]][0] + ' ' + MONTHS[idx[idx.length - 1]][2] + ')' : 'All seasons · Oct 2025 – Oct 2026';
    const T = function (x, t) { return Object.assign(C(x, t || ''), { cls: 'txt' }); };
    const recPop = function (title, list) { return function () { self.tablePopup(title, fmtN(list.length) + ' closed incidents · ' + period, ['Incident ID', 'Incident', 'District', 'Mandal', 'Severity', 'Season', 'Month', 'Resolved in', 'Within SLA'], list.map(function (f) { const ok = f.res <= (SLA_D[f.Severity] || 7); return { name: f.id, cells: [T(f.title), T(f.District), T(f.Mandal), T(f.Severity), T(f.Season), T(f.Month), C(fmtN(f.res, 1) + ' d'), T(ok ? 'Yes' : 'No', ok ? 'good' : 'bad')], drill: function () { self.setState({ rxRec: self.closedRec(f) }); } }; }), null, 'closed-incidents'); }; };
    const out = {
      period: period, scope: (path[0] || 'All districts') + (stage !== 'all' ? ' · ' + STAGE_NAME[stage] : ''),
      bars: idx.map(function (j) { const sub = cl.filter(function (f) { return mi(f) === j; }); return { m: MONTHS[j][0] + (MONTHS[j][0] === 'Jan' || j === idx[0] ? ' ' + String(MONTHS[j][2]).slice(2) : ''), hn: Math.round(raised[j] / mx * 100), hr: Math.round(resolved[j] / mx * 100), n: raised[j], r: resolved[j], tip: MONTHS[j][0] + ' ' + MONTHS[j][2] + ': ' + raised[j] + ' new, ' + resolved[j] + ' resolved', go: recPop('Resolved in ' + MONTHS[j][0] + ' ' + MONTHS[j][2], sub) }; }),
      metrics: [
        { l: 'New incidents', v: fmtN(idx.reduce(function (a, j) { return a + raised[j]; }, 0)), calc: 'Closed incidents counted in the month they were raised (close date minus days to resolve; close dates are known only to the month, so a close day is assumed, spread evenly across the month), plus incidents open now, all raised this month', go: recPop('Closed incidents · ' + period, clP) },
        { l: 'Resolved', v: fmtN(clP.length), calc: 'Closed incidents, counted in the month they were closed', go: recPop('Resolved incidents · ' + period, clP) },
        { l: 'Median resolution time', v: med === null ? '—' : fmtN(med, 1) + ' days', calc: 'Middle value of days from raised to closed, across the ' + fmtN(clP.length) + ' closed incidents', go: recPop('Closed incidents by resolution time · ' + period, clP.slice().sort(function (a, b) { return b.res - a.res; })) },
        { l: 'Reopened', v: fmtN(reop.length + reopC.length), calc: 'Closed incidents reopened from this dashboard (' + reopC.length + '), plus grievance-linked incidents whose resolution the complainant rejected at validation (' + reop.length + ')', go: function () { self.tablePopup('Reopened incidents', fmtN(reop.length + reopC.length) + ' reopened', ['Record', 'Type', 'Channel / source', 'Place', 'District', 'Mandal', 'State'], reopC.map(function (f) { return { name: f.id, cells: [T(f.title), T('Reopened from dashboard'), T(f.Point || ''), T(f.District), T(f.Mandal), T('Reopened')], drill: function () { self.setState({ rxRec: self.closedRec(f) }); } }; }).concat(reop.map(function (g) { return { name: g.id, cells: [T(g.type), T(g.channel), T(g.anchor), T(g.dn), T(g.mandal), T(g.state)], drill: function () { self.setState({ rxRec: self.rxBack(self.rxRecord('grv', g)) }); } }; })), null, 'reopened'); } }
      ],
      liveNote: 'Open incidents (the cards above) are live and not split by season; these trends use closed incidents in the selected period. Click a figure for its definition.'
    };
    out.metrics.forEach(function (m) { m.def = function () { self.setState({ rxRec: { title: m.l + ' · ' + m.v, sub: 'Incident trends · ' + period + ' · ' + out.scope, facts: [{ k: 'Value', v: m.v }, { k: 'Definition', v: m.calc }, { k: 'Period', v: period }, { k: 'Scope', v: out.scope }], steps: [], links: [{ label: 'Open the records behind this figure', go: m.go }] } }); }; });
    return out;
  }
  reopenedIds() { const m = {}; (this.state.actLog || []).forEach(function (e) { if (e.decision === 'Reopened' && e.incId) m[e.incId] = e; }); return m; }
  closedRec(f, roO) {
    const self = this; const ro = roO !== undefined ? roO : this.reopenedIds()[f.id];
    const facts = Object.keys(f).filter(function (k) { return /^[A-Z]/.test(k) && f[k] !== null && f[k] !== undefined && f[k] !== ''; }).map(function (k) { return { k: k, v: k === 'Status' && ro ? 'Reopened' : String(f[k]) }; }).concat([{ k: 'Resolved in', v: fmtN(f.res, 1) + ' days' }]).concat(ro ? [{ k: 'Reopened', v: new Date(ro.at).toLocaleString('en-IN') + (ro.remarks ? ' · ' + ro.remarks : '') }] : []);
    return { back: this.state.rxRec || null, closedF: f, title: f.id + ' · ' + f.title, sub: (f.Point || '') + ' · ' + f.Mandal + ', ' + f.District + (ro ? ' · reopened' : ' · closed'), facts: facts, steps: [], links: ro ? [{ label: 'Undo reopen', go: function () { self.undoAct(ro.id); self.setState({ rxRec: self.closedRec(f, null) }); } }] : [{ label: 'Reopen this incident', go: function () { self.setState({ rxRec: Object.assign({}, self.state.rxRec, { reopenForm: true, reopenWhy: '' }) }); } }] };
  }
  logReopen(f, why) {
    const log = (this.state.actLog || readActLog()).slice(); const id = 'ACT-' + pad((log.reduce(function (m, x) { const k = parseInt(String(x.id).replace(/\D/g, ''), 10) || 0; return Math.max(m, k); }, 0)) + 1, 4);
    const stg = Object.keys(CATN).filter(function (k) { return CATN[k] === f.Category; })[0] || 'all';
    log.unshift({ id: id, incId: f.id, stage: stg, mod: 'Incidents', at: Date.now(), rec: f.id + ' · ' + f.title, kind: 'Closed incident', where: f.Mandal + ', ' + f.District, dn: f.District, decision: 'Reopened', action: 'Reopen and reassign to the ' + (f['Currently with'] && f['Currently with'] !== 'Closed' ? f['Currently with'] : 'district office'), owner: 'District office, ' + f.District, by: '', status: 'Open', remarks: why || '', prio: '', cc: '', facts: [] });
    saveActLog(log); this.setState({ actLog: log }); this.setState({ rxRec: this.closedRec(f, log[0]) });
  }
  refreshAll() {
    const n = (this.state.refN || 0) + 1; const got = pwPull(n); got.forEach(function (c) { PW_NEW.push(c); });
    Object.keys(M).forEach(function (k) { if (k.indexOf('pw|') === 0) delete M[k]; });
    this._pwRef = new Date(); const t = this._pwRef.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    this.setState({ refN: n, refAt: Date.now(), refNote: 'Refreshed ' + t + ' · ' + (got.length ? got.length + ' new press clipping' + (got.length === 1 ? '' : 's') : 'nothing new') });
  }
  ctxInfo() {
    const s = this.state; const p = this.curPath(); const now = new Date();
    const seas = (s.seasons || []).filter(function (k) { return SEAS_NAME[k]; }).map(function (k) { return SEAS_NAME[k]; });
    const period = s.season === 'custom' ? 'Custom: ' + (s.dtFrom ? new Date(s.dtFrom).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'start') + ' to ' + (s.dtTo ? new Date(s.dtTo).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'now') : seas.length ? seas.join(', ') : 'All seasons (Oct 2025 – Oct 2026)';
    const f = [{ k: 'Season / period', v: period }, { k: 'Stage', v: s.stage === 'all' ? 'All stages' : STAGE_NAME[s.stage] }, { k: 'District', v: p[0] || 'All districts' }].concat(p[1] ? [{ k: 'Mandal', v: LBL[p[1]] || p[1] }] : []);
    const upd = now.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    return { updated: upd, period: period, filters: f, text: f.map(function (x) { return x.k + ': ' + x.v; }).join(' · '), prep: PREP_SNAP_AT ? PREP_SNAP_AT.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '' };
  }
  /* ---------- AI intelligence summary: a quick read of the tab, each insight routes to the Intelligence tab ---------- */
  aiSummary(mode, path, stage) {
    const self = this; const s = this.state; const dn = path[0] || null; const scope = dn || 'Andhra Pradesh';
    const I = this.buildIntel(path.slice(0, 1)).intel; let recBy = {}; I.recs.forEach(function (r) { recBy[r.key] = r; });
    const go = function (key, q) { return function () { self._aiFrom = { module: self.state.module, stage: self.state.stage, path: (self.state.path || []).slice() }; const st = { module: 'intel', stage: 'all', pivot: false, intelTab: 'main', intelOpen: key || null, rxRec: null, kpiOpen: null, act: null, path: path.slice(0, 1), intelCtx: null };
      if (q) { const a = self.answer(q); a.meta = 'Based on: ' + self.ctxInfo().text + ' · records as of ' + self.ctxInfo().updated; st.intelMsgs = (self.state.intelMsgs || []).concat([{ me: true, text: q }, Object.assign({ me: false }, a)]).slice(-12); }
      self.setState(st); if (key) { self._buildingAi = true; const I2 = self.buildIntel(path.slice(0, 1)).intel; self._buildingAi = false; const rr0 = I2.recs.filter(function (x) { return x.key === key; })[0]; if (rr0) self.openRecDetail(rr0); } try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {} }; };
    const out = []; const add = function (sev, text, cta, key, q) { out.push({ cls: 'aii ' + sev, text: text, cta: cta, go: go(key, q) }); };
    const fromRec = function (k, cta) { const r = recBy[k]; if (r) add(r.sev, r.title + ' — ' + r.why0, cta || 'See what to do', k); };
    const stg = mode === 'home' ? (stage === 'all' ? null : stage) : ['proc', 'cmr', 's1', 's2', 'stor'].indexOf(mode) >= 0 ? mode : stage !== 'all' ? stage : null;
    const selS = (s.seasons || []).filter(function (k) { return SEAS_NAME[k]; }); const okSt = function (sg) { return (!stg || sg === stg) && (!selS.length || selS.indexOf(STAGE_SEASON[sg]) >= 0); };
    const KST = { fto: 'proc', pay: 'proc', proc: 'proc', cmr: 'cmr', s2: 's2', stor: 'stor', cctv: 'stor', gps: 's1', prep: 'proc', inc: null };
    I.recs = I.recs.filter(function (r) { const sg = KST[r.key]; return sg === null || sg === undefined || okSt(sg); }); recBy = {}; I.recs.forEach(function (r) { recBy[r.key] = r; });
    const fTxt = [selS.length ? selS.map(function (k) { return SEAS_NAME[k]; }).join(', ') : '', stg ? STAGE_NAME[stg] : '', s.season === 'custom' ? 'custom period' : ''].filter(Boolean).join(' · ');
    const dl = dn ? [dn] : D.map(function (d) { return d.name; }); let inc = []; dl.forEach(function (d) { inc = inc.concat(incidentsOf(d)); });
    inc = inc.filter(function (i) { return okSt(i.stage) && self.inWin(i.ageH); }); const incS = stg ? inc.filter(function (i) { return i.stage === stg; }) : mode === 'cctv' ? inc.filter(function (i) { return i.ent === 'Buffer godown' || i.ent === 'MLS point'; }) : mode === 'gps' ? inc.filter(function (i) { return i.src === 'GPS'; }) : inc; const crit = incS.filter(function (i) { return i.prio === 'P1'; });
    const incLine = function () { if (!incS.length) return; const by = {}; incS.forEach(function (i) { by[i.title] = (by[i.title] || 0) + 1; }); const top = Object.keys(by).sort(function (a, b) { return by[b] - by[a]; })[0];
      add(crit.length ? 'bad' : 'warn', fmtN(incS.length) + ' open incidents' + (stg ? ' in ' + STAGE_NAME[stg] : mode === 'cctv' ? ' at buffer godowns and MLS points' : mode === 'gps' ? ' raised by GPS tracking' : '') + ', ' + fmtN(crit.length) + ' critical; the most common is "' + top + '" (' + by[top] + ').', 'Review incidents', 'inc', crit.length ? 'Show open critical incidents' : null); };
    const v = dn ? distVals(dn) : stateVals();
    let lead = '';
    if (mode === 'home' && stage === 'all') { lead = 'Across ' + scope + ': procurement at ' + pct(v.procPct) + ' of target, ' + pct(v.pay24) + ' of farmers paid within 24 h, CMR ' + pct(v.cmrPct) + ' delivered, godowns ' + pct(v.util) + ' full.'; I.recs.slice(0, 4).forEach(function (r) { add(r.sev, r.title + ' — ' + r.why0, 'See what to do', r.key); }); }
    else if (stg === 'proc' || mode === 'home' && stage === 'proc') { lead = 'Procurement in ' + scope + ' is at ' + pct(v.procPct) + ' of target (' + fmtMT(v.procured) + ' of ' + fmtMT(v.target) + '), with ' + pct(v.pay24) + ' of farmers paid within 24 h.'; fromRec('proc'); fromRec('fto', 'Clear unpaid FTOs'); fromRec('pay'); incLine(); }
    else if (stg === 'cmr') { lead = 'CMR in ' + scope + ': ' + pct(v.cmrPct) + ' delivered against due, ' + fmtMT(Math.max(0, v.cmrDue - v.cmrDel)) + ' still due from mills.'; fromRec('cmr', 'Act on millers'); incLine(); add('warn', 'Ask where CMR is pending, by district and mill.', 'Ask Intelligence', null, 'Where is CMR pending?'); }
    else if (stg === 's1') { lead = 'Stage-I in ' + scope + ': ' + pct(v.s1Pct) + ' of planned stock moved to MLS points.'; incLine(); fromRec('gps', 'Act on off-route vehicles'); add('warn', 'See how many trips are not completed and why.', 'Ask Intelligence', null, 'How many trips are not completed?'); }
    else if (stg === 's2') { lead = 'Stage-II in ' + scope + ': ' + pct(v.s2Pct) + ' of the allotment delivered to fair price shops.'; fromRec('s2', 'Expedite lifting'); { let aw = 0; dl.forEach(function (d) { aw += s2Dels(d).filter(function (r) { return r.status.indexOf('awaiting') >= 0; }).length; }); if (aw) add('warn', fmtN(aw) + ' deliveries reached the shop but have no ePoS acknowledgement yet.', 'Ask Intelligence', null, 'Deliveries awaiting ePoS acknowledgement'); } incLine(); }
    else if (stg === 'stor') { lead = 'Storage in ' + scope + ': godowns ' + pct(v.util) + ' full; ' + fmtMT(v.aged) + ' of stock is older than 6 months.'; fromRec('stor', 'Free up space'); fromRec('cctv', 'Fix cameras'); incLine(); }
    else if (mode === 'fin') { lead = 'Payments in ' + scope + ': ' + pct(v.pay24) + ' of farmers paid within 24 h.'; fromRec('fto', 'Clear unpaid FTOs'); fromRec('pay', 'Speed up payments'); add('warn', 'See how many farmer payments are still not credited, by district.', 'Ask Intelligence', null, 'How many farmer payments (FTOs) are not credited yet?'); }
    else if (mode === 'prep') { const ov = prepOverall(dn); lead = 'Season readiness in ' + scope + ' is ' + (ov === null ? 'not reported' : pct(ov)) + '.'; fromRec('prep', 'Push weak parameters'); add('warn', 'See which districts are least prepared and on which parameters.', 'Ask Intelligence', null, 'Which districts are least prepared for the season?'); }
    else if (mode === 'alerts') { lead = incAiList(inc.filter(function (i) { return stage === 'all' || i.stage === stage; })); fromRec('inc', 'Review critical incidents'); add('warn', 'See which grievances are past their SLA.', 'Ask Intelligence', null, 'Which grievances are overdue?'); }
    else if (mode === 'cctv') { { let cn = 0, off = 0, ev = 0; dl.forEach(function (d) { camerasOf(d).forEach(function (c) { cn++; if (c.status === 'Offline') off++; if (c.event) ev++; }); }); lead = fmtN(cn - off) + ' of ' + fmtN(cn) + ' cameras online at buffer godowns and MLS points in ' + scope + '; ' + fmtN(ev) + ' flagged events to review.'; } fromRec('cctv', 'Fix offline cameras'); incLine(); }
    else if (mode === 'gps') { { let tv = 0, dv = 0, tn = 0; dl.forEach(function (d) { vehiclesOf(d).forEach(function (x) { tv++; if (x.status === 'Deviated') dv++; }); tn += tripsOf(d).filter(function (t) { return t.trip !== 'Completed'; }).length; }); lead = fmtN(tv) + ' vehicles tracked in ' + scope + ' today: ' + fmtN(dv) + ' off route, ' + fmtN(tn) + ' trips not completed.'; } fromRec('gps', 'Act on off-route vehicles'); add('warn', 'See trips not completed, by stage and district.', 'Ask Intelligence', null, 'How many trips are not completed?'); incLine(); }
    else if (mode === 'news') { const t30 = Date.now() - 30 * 86400000; const pc = pressClips().filter(function (c) { return c.at.getTime() >= t30 && (!dn || c.district === dn); }); const nb = pc.filter(function (c) { return c.sent === 'Bad'; }).length, ng = pc.filter(function (c) { return c.sent === 'Good'; }).length; lead = fmtN(pc.length) + ' clippings in the last 30 days (sample data): ' + fmtN(nb) + ' read as Bad, ' + fmtN(ng) + ' as Good (AI read, not verified).'; fromRec('press', 'See what to do'); add('warn', fmtN(pc.filter(function (c) { return c.unread; }).length) + ' recent clippings not yet read.', 'Ask Intelligence', 'press'); }
    else if (mode === 'img') { const sk0 = s.imgSeas || 's2026'; const ds = dn ? [dn] : D.map(function (d) { return d.name; }); const tot = imgSum(ds.map(function (n) { return imgDist(sk0, n); })); let il = []; ds.forEach(function (n) { il = il.concat(imgIncidentsOf(n)); });
      lead = fmtN(tot.t) + ' vehicle photos graded in ' + IMG_SEAS[sk0] + (dn ? ' in ' + dn : '') + ': ' + pct(imgAcc(tot)) + ' usable, ' + pct(tot.t ? tot.unid / tot.t : 0) + ' unidentifiable. ' + fmtN(il.length) + ' incident' + (il.length === 1 ? '' : 's') + ' raised for RSKs with abnormal photos.';
      const w = il.slice().sort(function (a, b) { return imgAcc(a.img) - imgAcc(b.img) || b.img.t - a.img.t; })[0];
      if (w) out.push({ cls: 'aii bad', text: 'Worst RSK: ' + imgRskName(w.img.n) + ', ' + w.mandal + ', ' + w.dn + ' — ' + fmtN(w.img.unid) + ' of ' + fmtN(w.img.t) + ' photos unidentifiable (' + w.id + ').', cta: 'Open the incident', go: function () { self.setState({ rxRec: self.incRec(w) }); } });
      const byD = {}; il.forEach(function (i) { byD[i.dn] = (byD[i.dn] || 0) + 1; }); const top = Object.keys(byD).sort(function (a, b) { return byD[b] - byD[a]; }).slice(0, 3);
      if (!dn && top.length) out.push({ cls: 'aii warn', text: 'Most image incidents are in ' + top.map(function (d) { return d + ' (' + byD[d] + ')'; }).join(', ') + '.', cta: 'Open ' + top[0], go: function () { self.setState({ path: [top[0]] }); } }); }
    else if (mode === 'yt') { lead = fmtN(YT_AP.length) + ' AP videos on news channels from the scan file; ' + fmtN(YT_AP.filter(function (v) { return v.s === 'Bad'; }).length) + ' have titles read as Bad (AI read of the title).'; fromRec('ytneg', 'See what to do'); }
    else if (mode === 'glance') { lead = 'At-a-glance view of ' + scope + '.'; I.recs.slice(0, 3).forEach(function (r) { add(r.sev, r.title + ' — ' + r.why0, 'See what to do', r.key); }); }
    if (!out.length) I.recs.slice(0, 3).forEach(function (r) { add(r.sev, r.title + ' — ' + r.why0, 'See what to do', r.key); });
    if (fTxt) lead = (lead ? lead + ' ' : '') + 'Filtered to ' + fTxt + '.';
    return { lead: lead, items: out.slice(0, 5), has: out.length > 0, open: function () { go(null)(); } };
  }
  /* ---------- Intelligence tab ---------- */
  buildIntel(path) {
    const self = this; const s = this.state; const dn = path[0] || null;
    const dns = dn ? [dn] : D.map(function (d) { return d.name; }); const scope = dn || 'Andhra Pradesh';
    const T = function (x, t) { return Object.assign(C(x, t || ''), { cls: 'txt' }); };
    const v = dn ? distVals(dn) : ratios(sumVals(dns.map(function (d) { return distVals(d); })));
    const units = dn ? mandalsOf(dn).map(function (m) { return { d: m.name, v: m.v }; }) : dns.map(function (d) { return { d: d, v: distVals(d) }; }); const unitW = dn ? 'mandal' : 'district';
    const top = function (f, n, asc) { return units.map(function (u) { return { d: u.d, x: f(u.v) }; }).filter(function (o) { return o.x !== null && !isNaN(o.x); }).sort(function (a, b) { return asc ? a.x - b.x : b.x - a.x; }).slice(0, n || 3); };
    const recs = [];
    const R = function (o) { o.sugs = [{ act: o.act, why: o.why, owner: o.owner, by: o.by, effect: o.effect }]; recs.push(o); };
    /* 1. farmer payments not credited */
    let ftos = []; dns.forEach(function (d) { ftos = ftos.concat(finBatches(d).filter(function (b) { return b.group !== 'Credited'; })); });
    if (ftos.length) {
      const rej = ftos.filter(function (b) { return b.group === 'Rejected' || b.group === 'Failed'; }); const bank48 = ftos.filter(function (b) { return b.group === 'Sent to bank' && b.hAgo > 48; }); const unsent = ftos.filter(function (b) { return b.group === 'Pending'; });
      const amt = ftos.reduce(function (x, b) { return x + b.amt; }, 0); const why = {}; rej.forEach(function (b) { why[b.resp] = (why[b.resp] || 0) + 1; }); const topWhy = Object.keys(why).sort(function (a, b) { return why[b] - why[a]; })[0];
      const byD = {}; ftos.forEach(function (b) { const k = dn ? b.ppc : b.dn; byD[k] = (byD[k] || 0) + 1; }); const where = Object.keys(byD).sort(function (a, b) { return byD[b] - byD[a]; }).slice(0, 4);
      R({ key: 'fto', sev: 'bad', area: 'Financials', title: fmtN(ftos.length) + ' farmer payments (FTOs) not credited · ' + lakh(amt), act: 'Re-send the ' + fmtN(rej.length) + ' rejected / failed FTOs after correcting bank details, chase the bank on ' + fmtN(bank48.length) + ' waiting over 48 h, and sign the ' + fmtN(unsent.length) + ' not yet sent.',
        why: [fmtN(rej.length) + ' were rejected or returned by the bank' + (topWhy ? '; the most common reason is "' + topWhy + '" (' + why[topWhy] + ')' : '') + '.', fmtN(bank48.length) + ' have been with the bank for more than 48 h, past the late-payment line.', fmtN(unsent.length) + ' are generated but not sent to the bank.', 'Most are in ' + where.map(function (d) { return d + ' (' + byD[d] + ')'; }).join(', ') + '.'],
        owner: 'District payments cells', by: 'Within 48 h', effect: 'Every farmer paid; fewer payment grievances', where: where.map(function (d) { return d + ' · ' + byD[d]; }),
        view: function () { self.tablePopup('Farmer payments not credited · ' + scope, 'One FTO per farmer · click Act on a row for what to do with it', ['FTO', 'Farmer', 'District', 'RSK', 'Status', 'Bank response', 'Amount', 'Age'], ftos.sort(function (a, b) { return b.hAgo - a.hAgo; }).map(function (b) { return { name: b.id, cells: [T(b.farmer), T(b.dn), T(b.ppc), T(b.status, b.group === 'Rejected' || b.group === 'Failed' ? 'bad' : 'warn'), T(b.resp), C(lakh(b.amt)), C(hrs(b.hAgo), b.hAgo > 48 ? 'bad' : '')], drill: function () { self.setState({ rxRec: self.rxBack(self.rxRecord('fto', b)) }); } }; }), null, 'fto-not-credited'); } });
    }
    /* 2. critical incidents */
    let inc = []; dns.forEach(function (d) { inc = inc.concat(incidentsOf(d).filter(function (i) { return i.prio === 'P1'; })); });
    if (inc.length) {
      const late = inc.filter(function (i) { return i.status === 'Open' && i.ageH > SEV_RESP_H.P1; }); const byT = {}; inc.forEach(function (i) { byT[i.title] = (byT[i.title] || 0) + 1; }); const tt = Object.keys(byT).sort(function (a, b) { return byT[b] - byT[a]; })[0];
      const byD = {}; inc.forEach(function (i) { const k = dn ? i.mandal + ' mandal' : i.dn; byD[k] = (byD[k] || 0) + 1; }); const where = Object.keys(byD).sort(function (a, b) { return byD[b] - byD[a]; }).slice(0, 4);
      R({ key: 'inc', sev: 'bad', area: 'Incidents', title: fmtN(inc.length) + ' critical incidents open', act: (dn ? 'Review critical incidents with the mandal officers of ' + where.slice(0, 3).join(', ') + ' and the District Manager today,' : 'Review critical incidents with the District Managers of ' + where.slice(0, 3).join(', ') + ' today,') + ' starting with the ' + fmtN(late.length) + ' still unattended past 4 h.',
        why: ['Critical means possible diversion or fraud, or procurement stopped; the response time is 4 h.', fmtN(late.length) + ' are still Open past that time.', 'The most frequent is "' + tt + '" (' + byT[tt] + ').', 'Most are in ' + where.map(function (d) { return d + ' (' + byD[d] + ')'; }).join(', ') + '.'],
        owner: 'Head office with District Managers', by: 'Today', effect: 'Critical incidents attended within 4 h', where: where.map(function (d) { return d + ' · ' + byD[d]; }),
        view: function () { self.tablePopup('Critical incidents · ' + scope, 'Open critical incidents · click Act on a row for what to do', ['Incident ID', 'Incident', 'District', 'Mandal', 'Status', 'Age'], inc.sort(function (a, b) { return b.ageH - a.ageH; }).map(function (i) { return { name: i.id, cells: [T(i.title), T(i.dn), T(i.mandal), T(i.status, i.status === 'Escalated' ? 'bad' : ''), C(i.ageH + ' h', i.ageH > 4 ? 'bad' : '')], drill: function () { self.setState({ rxRec: self.rxBack(self.incRec(i)) }); } }; }), null, 'critical-incidents'); } });
    }
    /* 3. measures against the KPI thresholds, worst districts */
    const M = [
      ['cmr', 'CMR', 'CMR delivered', function (x) { return x.cmrDue > 0 ? x.cmrPct : null; }, 0.45, 'Issue CMR notices to millers with deliveries overdue, with a 7-day cure period; review bank guarantee cover where it is not met.', 'District Managers', 'Notices this week', 'CMR moves to the public distribution system on time', 'cmr'],
      ['stor', 'Storage', 'Godown utilisation', function (x) { return x.cap > 0 ? x.util : null; }, 0.93, 'Divert incoming CMR and Stage-I stock away from the fullest godowns and hire space where the district is above 93%.', 'District offices with the storage wing', 'This week', 'No stock turned away for lack of space', 'stor', true],
      ['s2', 'Stage 2', 'Stage-II delivered to FPS', function (x) { return x.s2Allot > 0 ? x.s2Pct : null; }, 0.7, 'Expedite lifting at MLS points: add trucks on MLS → FPS routes and fix dispatch schedules.', 'MLS point in-charges', 'Within 48 h', 'Shops receive the month\'s allotment in time', 's2'],
      ['pay', 'Financials', 'Farmers paid within 24 h', function (x) { return x.pay24; }, 0.8, 'Shorten FTO signing and bank turnaround in the slowest districts: daily signing slots and bank follow-up at 24 h.', 'District payments cells', 'This week', 'More farmers paid within 24 h', 'pay24'],
      ['proc', 'Procurement', 'Procurement vs target', function (x) { return x.target > 0 ? x.procPct : null; }, 0.8, 'Extend RSK hours and mobilise farmers with harvest dates due this week in the districts furthest from target.', 'District Managers with RSK in-charges', 'This week', 'Procurement closes to target', 'proc'],
      ['prep', 'Preparedness', 'Season preparedness', function (x) { return dn ? null : x.prepN ? x.prep : null; }, 0.5, 'Push the weakest preparedness parameters with their owners before the season opens.', 'Parameter owners via District Managers', 'Plan in 3 days', 'Districts ready on opening day', 'prep']
    ];
    M.forEach(function (m) {
      const hi = !!m[10]; const l = top(m[3], 4, !hi).filter(function (o) { return hi ? o.x > m[4] : o.x < m[4]; }); if (!l.length) return;
      R({ key: m[0], sev: 'warn', area: m[1], title: m[2] + ': ' + l.length + (l.length === 4 ? '+' : '') + ' ' + unitW + (l.length === 1 ? '' : 's') + (hi ? ' above ' : ' below ') + pct(m[4]), act: m[5], why: [m[2] + ' is ' + (hi ? 'above' : 'below') + ' the ' + pct(m[4]) + ' line on the KPI cards in ' + l.map(function (o) { return o.d + ' (' + pct(o.x) + ')'; }).join(', ') + '.', (scope === 'Andhra Pradesh' ? 'The state figure is ' : scope + ' is at ') + pct(v[{ cmr: 'cmrPct', stor: 'util', s2: 's2Pct', pay: 'pay24', proc: 'procPct', prep: 'prep' }[m[0]]]) + '.'],
        owner: m[6], by: m[7], effect: m[8], where: l.map(function (o) { return o.d + ' · ' + pct(o.x); }),
        view: function () { self.tablePopup(m[2] + ' · by ' + unitW + ' · ' + scope, 'Weakest first · click Act on a ' + unitW + ' for what to do there', [dn ? 'Mandal' : 'District', m[2], 'Status'], top(m[3], 60, !hi).map(function (o) { const t = hi ? (o.x > m[4] ? 'bad' : 'good') : (o.x < m[4] ? 'bad' : 'good'); return { name: o.d, cells: [C(pct(o.x), t), T(t === 'bad' ? 'Below threshold' : 'On track', t)] }; }), null, 'intel-' + m[0]); } });
    });
    /* 4. CCTV offline and off-route vehicles */
    let cams = []; dns.forEach(function (d) { cams = cams.concat(camerasOf(d).filter(function (c) { return c.status === 'Offline'; })); });
    if (cams.length) R({ key: 'cctv', sev: 'warn', area: 'CCTV', title: fmtN(cams.length) + ' cameras offline', act: 'Raise repair tickets with the CCTV vendor for the offline cameras, fullest godowns and MLS points first.', why: ['Offline cameras leave godowns and MLS points unwatched.', 'Cameras exist only at buffer godowns and MLS points, where stock is held.'], owner: 'CCTV vendor, checked by site in-charges', by: 'Within 24 h', effect: 'All storage points under watch', where: [], view: function () { self.tablePopup('Offline cameras · ' + scope, 'Click Act on a camera for what to do', ['Camera', 'Site', 'District', 'Mandal', 'View', 'Last seen'], cams.map(function (c) { return { name: c.id, cells: [T(c.site), T(c.dn), T(c.mandal), T(c.view), C(c.ts)] }; }), null, 'offline-cameras'); } });
    let veh = []; dns.forEach(function (d) { veh = veh.concat(vehiclesOf(d).filter(function (x) { return x.status === 'Deviated'; })); });
    if (veh.length) R({ key: 'gps', sev: 'warn', area: 'GPS', title: fmtN(veh.length) + ' vehicles off route today', act: 'Call the drivers through the transporters; hold vehicles not back on route within 30 minutes for load verification.', why: ['Route deviation is a possible diversion sign.', 'The furthest is ' + fmtN(Math.max.apply(null, veh.map(function (x) { return x.dev; })), 1) + ' km off route.'], owner: 'Command-centre operators', by: 'Now', effect: 'Loads reach their designated points', where: [], view: function () { self.tablePopup('Vehicles off route · ' + scope, 'Click Act on a vehicle for what to do', ['Vehicle', 'District', 'Leg', 'From', 'To', 'Off route'], veh.sort(function (a, b) { return b.dev - a.dev; }).map(function (x) { return { name: x.plate, cells: [T(x.dn), T(STAGE_NAME[x.stage]), T(x.from), T(x.to), C(fmtN(x.dev, 1) + ' km', 'bad')] }; }), null, 'off-route'); } });
    /* 5. media: clippings needing action, negative videos */
    { const t30 = Date.now() - 30 * 86400000; const acted = {}; (self.state.actLog || []).forEach(function (e) { if (e.clipId && (e.decision === 'Rejoinder issued' || e.decision === 'Advisory raised')) acted[e.clipId] = 1; }); const pc = pressClips().filter(function (c) { return c.needs && !acted[c.id] && c.at.getTime() >= t30 && (!dn || c.district === dn); });
      if (pc.length) { const byP = {}; pc.forEach(function (c) { const k = c.district; byP[k] = (byP[k] || 0) + 1; }); const where = Object.keys(byP).sort(function (a, b) { return byP[b] - byP[a]; }).slice(0, 4); const byD = {}; pc.forEach(function (c) { byD[c.dept] = (byD[c.dept] || 0) + 1; }); const dTop = Object.keys(byD).sort(function (a, b) { return byD[b] - byD[a]; })[0];
        R({ key: 'press', sev: 'warn', area: 'Media', title: fmtN(pc.length) + ' newspaper clippings need action (last 30 days)', act: 'Get the departments named to verify each report and, where it is wrong, issue a rejoinder; where it is right, raise an advisory to the district.', why: [fmtN(pc.length) + ' clippings flagged Bad (AI read) and marked as needing action, with no advisory or rejoinder recorded yet.', 'Most concern ' + dTop + ' (' + byD[dTop] + ').', 'Most are from ' + where.map(function (d) { return d + ' (' + byP[d] + ')'; }).join(', ') + '.', 'Sentiment is an AI read of the article, not a verified finding.'], owner: 'Information & PR cell with the departments', by: 'Within 48 h', effect: 'Every adverse report answered or acted on', where: where.map(function (d) { return d + ' · ' + byP[d]; }), view: function () { self.pwList('Clippings needing action · last 30 days', pc); } }); } }
    { const yn = YT_AP.filter(function (v) { return v.s === 'Bad' && (!dn || v.dist === dn); }); if (yn.length) { const vw = yn.reduce(function (a, v) { return a + v.v; }, 0);
        R({ key: 'ytneg', sev: 'warn', area: 'Media', title: fmtN(yn.length) + ' YouTube videos with a negative title (AI read)', act: 'Check the issues raised (mostly ration-rice diversion) with Vigilance and the districts named, and brief the Information cell on the facts.', why: [fmtN(yn.length) + ' AP videos on news channels have titles read as Bad, with ' + fmtN(vw) + ' views in all.', 'The most-watched is "' + yn.slice().sort(function (a, b) { return b.v - a.v; })[0].t.slice(0, 80) + '".', 'Sentiment is read from the title; comment text is not in the source file.'], owner: 'Information & PR cell with Vigilance', by: 'This week', effect: 'Facts on record for each issue raised', where: [], view: function () { self.setState({ module: 'yt', stage: 'all', ytSent: 'Bad', rxRec: null }); } }); } }
    recs.forEach(function (r) { const tp = REC_TOPIC[r.key]; if (!tp) return; const wd = DN_BY_LEN.filter(function (d) { return r.where.join(' ').indexOf(d) >= 0; }); const pl = pressWhy(tp, wd.length ? wd : dn ? [dn] : null); if (pl) r.why.push(pl); const yl = ytWhy(tp); if (yl) r.why.push(yl); });
    const rank = { bad: 0, warn: 1 }; recs.sort(function (a, b) { return rank[a.sev] - rank[b.sev]; });
    /* most relevant data */
    const pend = ftos.length; const insights = [
      { k: 'proc', l: 'Procurement vs target', v: pct(v.procPct), s: fmtMT(v.procured) + ' of ' + fmtMT(v.target), t: tone(v.procPct, 0.95, 0.8) },
      { k: 'pay24', l: 'Farmers paid within 24 h', v: pct(v.pay24), s: fmtN(pend) + ' FTOs not credited', t: tone(v.pay24, 0.9, 0.8) },
      { k: 'cmr', l: 'CMR delivered', v: pct(v.cmrPct), s: fmtMT(Math.max(0, v.cmrDue - v.cmrDel)) + ' still due', t: tone(v.cmrPct, 0.6, 0.45) },
      { k: 'stor', l: 'Godown utilisation', v: pct(v.util), s: fmtMT(v.aged) + ' older than 6 months', t: tone(v.util, 0.85, 0.93, false) },
      { k: 's2', l: 'Stage-II delivered to FPS', v: pct(v.s2Pct), s: 'of this month\'s allotment', t: tone(v.s2Pct, 0.85, 0.7) },
      { k: 'p1', l: 'Critical incidents open', v: fmtN(inc.length), s: 'respond within 4 h', t: tone(inc.length, 0, 3, false) }
    ];
    /* FAQs answered from the records */
    const FAQ = ['How many farmer payments (FTOs) are not credited yet?', 'Show open critical incidents', 'Where is CMR pending?', 'Which godowns are above 90% utilisation?', 'How many trips are not completed?', 'Deliveries awaiting ePoS acknowledgement', 'Which grievances are overdue?', 'How many cameras are offline?', 'Which districts are least prepared for the season?'];
    const msgs = (s.intelMsgs || []).map(function (m) { return Object.assign({ cls: m.me ? 'me' : 'ai', hasBars: !!(m.bars && m.bars.length), hasAct: !!m.act, hasMeta: !m.me && !!m.meta, meta: '', hasOpts: !!(m.opts && m.opts.length), opts: [] }, m); });
    const askQ = function (q) { q = (q || '').trim(); if (!q) return; const a = (self.state.intelCtx && self.answerCtx(q, self.state.intelCtx)) || self.answer(q); a.meta = 'Based on: ' + self.ctxInfo().text + ' · records as of ' + self.ctxInfo().updated; self.setState({ intelMsgs: (self.state.intelMsgs || []).concat([{ me: true, text: q }, Object.assign({ me: false }, a)]).slice(-12), intelInput: '' }); };
    const logAll = (s.actLog || readActLog()).filter(function (e) { if (s.role !== 'dm') return true; const b = (e.dn || '') + ' ' + (e.where || '') + ' ' + (e.rec || '') + ' ' + (e.decision || ''); return e.dn === s.dm || b.indexOf(s.dm) >= 0 || (TX[(String(e.rec).match(/INC-[A-Z]+-\d{4}(?!\d)/) || [])[0]] || {}).dn === s.dm; }); const fS = s.logStage || 'all', fM = s.logMod || 'all';
    const log = logAll.filter(function (e) { return (fS === 'all' || (e.stage || 'all') === fS) && (fM === 'all' || (e.mod || '') === fM); });
    const mods = []; logAll.forEach(function (e) { if (e.mod && mods.indexOf(e.mod) < 0) mods.push(e.mod); });
    const logF = { stage: fS, mod: fM, stages: [['all', 'All stages'], ['proc', 'Procurement'], ['cmr', 'CMR'], ['s1', 'Stage 1'], ['s2', 'Stage 2'], ['stor', 'Storage']].map(function (x) { return { v: x[0], l: x[1] }; }), mods: [{ v: 'all', l: 'All modules' }].concat(['Overview', 'Stage tabs', 'Financials', 'Preparedness', 'Incidents', 'CCTV records', 'GPS tracking', 'At a glance', 'Intelligence'].map(function (m) { return { v: m, l: m }; })), onStage: function (e) { self.setState({ logStage: e.target.value }); }, onMod: function (e) { self.setState({ logMod: e.target.value }); }, clear: function () { self.setState({ logStage: 'all', logMod: 'all' }); }, isF: fS !== 'all' || fM !== 'all', count: fmtN(log.length) + (log.length !== logAll.length ? ' of ' + fmtN(logAll.length) : '') };
    const logList = log.map(function (e) { return { stg: STAGE_NAME[e.stage] || 'All stages', mod: e.mod || '—', id: e.id, when: new Date(e.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }), rec: e.rec, kind: e.kind, decision: e.decision, dcls: 'ild' + (/Escalated/.test(e.decision) ? ' warn' : e.decision === 'Decided' ? ' good' : ''), action: e.action || '—', owner: e.owner || '—', status: e.status, scls: 'ils' + (e.status === 'Done' ? ' good' : ''), detail: function () { self.openLogEntry(e.id); }, undo: function () { self.undoAct(e.id); }, remarks: e.remarks || '', canDone: e.status !== 'Done', markDone: function () { const l2 = (self.state.actLog || readActLog()).map(function (x) { return x.id === e.id ? Object.assign({}, x, { status: 'Done' }) : x; }); saveActLog(l2); self.setState({ actLog: l2 }); } }; });
    const intel = {
      scope: scope, recs: recs.map(function (r, i) { const op = s.intelOpen === r.key; const wo = !!(s.whyOpen || {})['rec:' + r.key]; return { whyOpen: wo, whyLabel: (wo ? '▾ Why' : '▸ Why') + ' · ' + r.why.length + ' reason' + (r.why.length === 1 ? '' : 's'), toggleWhy: function () { const o = Object.assign({}, self.state.whyOpen || {}); o['rec:' + r.key] = !wo; self.setState({ whyOpen: o }); }, details: function () { self.openRecDetail(this0[i]); }, sugs: r.sugs, key: r.key, sev: r.sev, why0: r.why[0] || '', open: op, closed: !op, arrow: op ? '▾' : '▸', toggle: function () { self.setState({ intelOpen: op ? null : r.key }); }, ocls: 'iopt' + (op ? ' on' : '') + ' ' + r.sev, n: i + 1, area: r.area, title: r.title, act: r.act, why: wo ? self.whyItems(r.why, { key: r.key, where: r.where, dn: dn, action: r.act }) : r.why.map(function (w) { return { t: w, incs: [], hasInc: false, incN: '', ask: function () {} }; }), whyRaw: r.why, owner: r.owner, by: r.by, effect: r.effect, where: r.where.map(function (w) { return { t: w }; }), hasWhere: r.where.length > 0, cls: 'irc ' + r.sev, view: r.view, ask: function () { self.askMore({ title: r.title, dn: dn, recKey: r.key, why: r.why, action: r.act, facts: [{ k: 'Area', v: r.area }, { k: 'Owner', v: r.owner }, { k: 'By', v: r.by }].concat(r.where.length ? [{ k: 'Where', v: r.where.join(', ') }] : []), view: r.view, recSugs: r.sugs, hint: { key: r.key, where: r.where, dn: dn } }); },
        doAct: function () { self.openAct({ name: r.title, where: 'Intelligence · ' + r.area + ' · ' + scope, facts: [{ k: 'Area', v: r.area }, { k: 'Where', v: r.where.join(', ') || scope }], rec: { sugs: r.sugs } }); } }; }),
      hasRecs: recs.length > 0, _x: null, insights: insights.map(function (x) { return { l: x.l, v: x.v, s: x.s, cls: 'iiv ' + (x.t || ''), go: function () { self.mkK(x.l, x.v, x.s, x.t, x.k).info(); }, act: function () { self.openAct({ name: x.l, where: 'Intelligence · ' + scope, facts: [{ k: 'Current value', v: x.v }, { k: 'Detail', v: x.s }], kpi: { key: x.k }, dn: dn }); } }; }),
      faqs: (s.intelCtx ? s.intelCtx.sugs || [] : FAQ).map(function (q) { return { q: q, ask: function () { askQ(q); } }; }), msgs: msgs, hasMsgs: msgs.length > 0,
      input: s.intelInput || '', onInput: function (e) { self.setState({ intelInput: e.target.value }); }, onSubmit: function (e) { if (e && e.preventDefault) e.preventDefault(); askQ(self.state.intelInput); }, clearChat: function () { self.setState({ intelMsgs: [], intelCtx: null }); }, hasCtx: !!s.intelCtx, ctxTitle: s.intelCtx ? s.intelCtx.title || '' : '', endCtx: function () { self.setState({ intelCtx: null, intelMsgs: [] }); }, faqLabel: s.intelCtx ? 'Suggested follow-ups' : 'Frequently asked',
      isMain: s.intelTab !== 'log', isLog: s.intelTab === 'log', tabMain: 'itab' + (s.intelTab !== 'log' ? ' on' : ''), tabLog: 'itab' + (s.intelTab === 'log' ? ' on' : ''), showMain: function () { self.setState({ intelTab: 'main' }); }, showLog: function () { self.setState({ intelTab: 'log' }); }, logTotal: fmtN(logAll.length),
      log: logList, hasLog: log.length > 0, noLog: log.length === 0, logN: logF.count, logF: logF, logEmpty: logAll.length ? 'No decisions match these filters.' : 'No decisions yet. Use Act on any record, list or KPI.'
    };
    const this0 = intel.recs;
    return { title: 'Intelligence · ' + scope, isIntel: true, intel: intel, kpis: [], scores: [] };
  }
  /* ---------- Media: Press Watch ---------- */
  pwRej() { const m = {}; (this.state.actLog || []).forEach(function (e) { if (e.decision === 'Rejoinder issued' && e.clipId && !m[e.clipId]) m[e.clipId] = e; }); return m; }
  pwAdv() { const m = {}; (this.state.actLog || []).forEach(function (e) { if (e.decision === 'Advisory raised' && e.clipId && !m[e.clipId]) m[e.clipId] = e; }); return m; }
  pwRaiseAdv(c, text, by, to) {
    const log = (this.state.actLog || readActLog()).slice(); const id = 'ACT-' + pad((log.reduce(function (m, x) { const k = parseInt(String(x.id).replace(/\D/g, ''), 10) || 0; return Math.max(m, k); }, 0)) + 1, 4);
    log.unshift({ id: id, clipId: c.id, stage: 'all', mod: 'Media', at: Date.now(), rec: c.id + ' · ' + c.head, kind: 'Newspaper clipping', where: c.paper + ' · ' + c.district, dn: c.district, decision: 'Advisory raised', action: 'Advisory sent to ' + (to || 'District Collector, ' + c.district), owner: by || 'Information & PR cell', to: to || '', by: '', status: 'Sent', remarks: text || '', prio: '', cc: '', facts: [] });
    saveActLog(log); this.setState({ actLog: log }); this.pwOpen(c, true);
  }
  pwSetRejStatus(c, entryId, st) {
    const log = (this.state.actLog || readActLog()).map(function (x) { return x.id === entryId ? Object.assign({}, x, { status: st, statusAt: Date.now() }) : x; });
    saveActLog(log); this.setState({ actLog: log }); this.pwOpen(c, true, log.filter(function (x) { return x.id === entryId; })[0]);
  }
  pwIssueRej(c, text, by) {
    const log = (this.state.actLog || readActLog()).slice(); const id = 'ACT-' + pad((log.reduce(function (m, x) { const k = parseInt(String(x.id).replace(/\D/g, ''), 10) || 0; return Math.max(m, k); }, 0)) + 1, 4);
    log.unshift({ id: id, clipId: c.id, stage: 'all', mod: 'Media', at: Date.now(), rec: c.id + ' · ' + c.head, kind: 'Newspaper clipping', where: c.paper + ' · ' + c.district, dn: c.district, decision: 'Rejoinder issued', action: 'Rejoinder sent to the editor, ' + c.paper, owner: by || 'Information & PR cell', by: '', status: 'Issued', remarks: text || '', prio: '', cc: '', facts: [] });
    saveActLog(log); this.setState({ actLog: log }); this.pwOpen(c, true, log[0]);
  }
  pwOpen(c, keep, rjO) {
    const self = this; const rd = Object.assign({}, this.state.pwRead || {}); rd[c.id] = 1; const rj = rjO !== undefined ? rjO : this.pwRej()[c.id]; const av = this.pwAdv()[c.id]; const advDraft = 'Advisory on press report: "' + c.head + '" (' + c.paper + ', ' + pwDay(c.at) + ', page ' + c.page + ').\n\nPlease check what is reported about ' + c.mandal + ', ' + c.district + ', act where needed, and send the facts to the Information & PR cell within 24 hours so a rejoinder can be issued if the report is wrong.'; const backTo = keep && this.state.rxRec ? (this.state.rxRec.back || null) : (this.state.rxRec || null);
    const draft = 'To the Editor, ' + c.paper + '\n\nWith reference to the report "' + c.head + '" published on ' + pwDay(c.at) + ' (' + c.section + ', page ' + c.page + '), the Andhra Pradesh State Civil Supplies Corporation wishes to place the following facts on record:\n\n1. [Facts from the records: quantities, dates, payments, actions taken]\n2. [What has been done since the report]\n\nWe request you to publish this clarification.\n\n[Name, designation]';
    this.setState({ pwRead: rd, rxRec: { media: { k: 'clip', id: c.id }, pgImg: pwPageImg(c), pgTag: c.paper + ' · ' + pwDay(c.at) + ' · page ' + c.page, back: backTo, title: c.head, sub: c.paper + ' · ' + c.section + ', page ' + c.page + ' · ' + pwDay(c.at),
      ai: c.ai, aiLabel: 'AI summary (generated, not from the article)', aiSrc: 'Sentiment, summary, department tag and named places are AI reads of the clipping. Check against the source text before acting.',
      src: c.text, srcLabel: 'Source text · as printed in ' + c.paper,
      facts: [{ k: 'Clipping ID', v: c.id }, { k: 'Sentiment (AI read)', v: c.sent }, { k: 'Newspaper', v: c.paper + ' (' + c.lang + ')' }, { k: 'Section · page', v: c.section + ' · page ' + c.page }, { k: 'Published', v: pwDay(c.at) }, { k: 'Department (AI tag)', v: c.dept }, { k: 'Places named (AI read)', v: c.locs.join(', ') }, { k: 'Needs action', v: c.needs ? (rj || av ? 'Flagged · action recorded' : 'Yes · no action recorded yet') : 'No' }, { k: 'Advisory', v: pwAdvTxt(av) }, { k: 'Rejoinder', v: pwRejTxt(rj) }, { k: 'Cut by hand', v: c.hand ? 'Yes' : 'No (auto-clipped)' }],
      rejDraft: draft, steps: [].concat(av ? [{ label: 'Advisory sent to ' + (av.to || 'the district') + ' by ' + av.owner, meta: pwWhen(av.at) + ' · ' + av.id + (av.remarks ? ' · ' + av.remarks.slice(0, 140) + (av.remarks.length > 140 ? '…' : '') : ''), cls: 'step done' }] : []).concat(rj ? [{ label: 'Rejoinder issued to ' + c.paper + ' by ' + rj.owner, meta: pwWhen(rj.at) + ' · ' + rj.id + (rj.remarks ? ' · ' + rj.remarks.slice(0, 140) + (rj.remarks.length > 140 ? '…' : '') : ''), cls: 'step done' }] : []).concat(rj && rj.status === 'Published' ? [{ label: 'Rejoinder published by ' + c.paper, meta: pwWhen(rj.statusAt || rj.at), cls: 'step done' }] : rj ? [{ label: 'Waiting for ' + c.paper + ' to publish the rejoinder', meta: 'Mark it published when it appears in print', cls: 'step' }] : []),
      links: [].concat(av ? [{ label: 'Undo advisory', go: function () { self.undoAct(av.id); self.pwOpen(c, true); } }] : [{ label: 'Raise advisory', go: function () { self.setState({ rxRec: Object.assign({}, self.state.rxRec, { rejForm: true, rejKind: 'adv', rejText: advDraft, rejBy: 'Information & PR cell', rejTo: 'District Collector, ' + c.district }) }); } }]).concat(rj ? (rj.status === 'Published' ? [{ label: 'Mark rejoinder not yet published', go: function () { self.pwSetRejStatus(c, rj.id, 'Issued'); } }] : [{ label: 'Mark rejoinder published', go: function () { self.pwSetRejStatus(c, rj.id, 'Published'); } }]).concat([{ label: 'Undo rejoinder', go: function () { self.undoAct(rj.id); self.pwOpen(c, true, null); } }]) : [{ label: 'Issue rejoinder', go: function () { self.setState({ rxRec: Object.assign({}, self.state.rxRec, { rejForm: true, rejKind: 'rej', rejText: draft, rejBy: 'Information & PR cell' }) }); } }]) } });
  }
  pwActList(title, l, M, kind, def) {
    const self = this; const T = function (x, t) { return Object.assign(C(x, t || ''), { cls: 'txt' }); };
    const rows = l.slice().sort(function (a, b) { return M[b.id].at - M[a.id].at; }).map(function (c) { const e = M[c.id]; return { name: c.id, cells: [T(c.head), T(c.paper), T(c.district), T(pwDay(c.at)), T(pwWhen(e.at)), kind === 'rej' ? T(e.status === 'Published' ? 'Published ' + pwWhen(e.statusAt || e.at) : 'Issued · awaiting publication', e.status === 'Published' ? 'good' : 'warn') : T('Sent to ' + (e.to || 'the district')), T(e.owner), T(e.id)], drill: function () { self.pwOpen(c); } }; });
    this.tablePopup(title, fmtN(l.length) + ' recorded today · click one for the clipping and its record', ['Clipping ID', 'Headline', 'Newspaper', 'District', 'Clipping date', kind === 'rej' ? 'Issued' : 'Sent', 'Status', 'By', 'Record'], rows, null, kind === 'rej' ? 'rejoinders' : 'advisories', null, [{ k: 'Definition', v: def[0] }, { k: 'How it is counted', v: def[1] }, { k: 'Count', v: fmtN(l.length) }]);
  }
  pwList(title, l, def) {
    const self = this; const AV = this.pwAdv(); const RJ = this.pwRej(); const T = function (x, t) { return Object.assign(C(x, t || ''), { cls: 'txt' }); };
    this.tablePopup(title, fmtN(l.length) + ' clippings · sentiment is an AI read · click one for the clipping', ['Clipping ID', 'Headline', 'Sentiment (AI)', 'Newspaper', 'Section', 'District', 'Published', 'Advisory', 'Rejoinder'], l.map(function (c) { const av = AV[c.id]; const rj = RJ[c.id]; return { name: c.id, cells: [T(c.head), T(c.sent, c.sent === 'Bad' ? 'bad' : c.sent === 'Good' ? 'good' : ''), T(c.paper), T(c.section), T(c.district), T(pwDay(c.at)), T(av ? 'Sent ' + pwDay(new Date(av.at)) : '—'), T(rj ? (rj.status === 'Published' ? 'Published ' + pwDay(new Date(rj.statusAt || rj.at)) : 'Issued ' + pwDay(new Date(rj.at))) : '—', rj ? (rj.status === 'Published' ? 'good' : 'warn') : '')], drill: function () { self.pwOpen(c); } }; }), null, 'press-clippings', null, def ? [{ k: 'Definition', v: def[0] }, { k: 'How it is counted', v: def[1] }, { k: 'Count', v: fmtN(l.length) }] : null);
  }
  buildNews(path) {
    const self = this; const s = this.state; const all = pressClips(); const dn = path[0] || null;
    const now = new Date(); const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const preset = s.pwPreset || '30d';
    const from = s.pwFrom ? new Date(s.pwFrom + 'T00:00:00') : preset === 'today' ? t0 : preset === '7d' ? new Date(t0.getTime() - 6 * 86400000) : preset === '30d' ? new Date(t0.getTime() - 29 * 86400000) : null;
    const to = s.pwTo ? new Date(s.pwTo + 'T23:59:59') : null;
    const q = (s.pwQA || '').trim().toLowerCase(); const read = s.pwRead || {};
    const base = all.filter(function (c) { return (!dn || c.district === dn) && (!from || c.at >= from) && (!to || c.at <= to) && (!q || (c.head + ' ' + c.text + ' ' + c.ai).toLowerCase().indexOf(q) >= 0); });
    const RJ = this.pwRej(); const AV = this.pwAdv(); all.forEach(function (c) { c.rejIssued = !!RJ[c.id]; c.advRaised = !!AV[c.id]; c.open = c.needs && !c.rejIssued && !c.advRaised; });
    const F = { sent: s.pwSent || '', dept: s.pwDept || '', paper: s.pwPaper || '', section: s.pwSec || '', needs: !!s.pwNeeds, hand: !!s.pwHand };
    const pass = function (c, skip) { return (!F.needs || c.open) && (skip === 'sent' || !F.sent || c.sent === F.sent) && (skip === 'dept' || !F.dept || c.dept === F.dept) && (skip === 'paper' || !F.paper || c.paper === F.paper) && (skip === 'section' || !F.section || c.section === F.section) && (!F.needs || c.needs) && (!F.hand || c.hand); };
    const res = base.filter(function (c) { return pass(c); });
    const cnt = function (dim, val) { return base.filter(function (c) { return pass(c, dim) && c[dim] === val; }).length; };
    const opts = function (dim, list, lab) { const k = { dept: 'pwDept', paper: 'pwPaper', section: 'pwSec' }[dim]; return { val: F[dim], onChange: function (e) { const o = { pwPage: 0 }; o[k] = e.target.value; self.setState(o); }, opts: [{ v: '', l: lab + ' · ' + fmtN(base.filter(function (c) { return pass(c, dim); }).length) }].concat(list.map(function (x) { return { v: x, l: x + ' · ' + fmtN(cnt(dim, x)) }; }).filter(function (o) { return !/ · 0$/.test(o.l) || o.v === F[dim]; })) }; };
    const DEPTS = []; PW_T.forEach(function (t) { if (DEPTS.indexOf(t[1]) < 0) DEPTS.push(t[1]); });
    const view = s.pwView || 'grid'; const per = view === 'list' ? 20 : view === 'pages' ? 6 : 12;
    const pg = Math.min(s.pwPage || 0, Math.max(0, Math.ceil(res.length / per) - 1));
    const sentCls = function (x) { return 'pws ' + (x === 'Bad' ? 'bad' : x === 'Good' ? 'good' : 'neu'); };
    const item = function (c) { return { id: c.id, head: c.head, ai: c.ai, text: c.text, paper: c.paper, sec: c.section + ' · ' + c.district, date: pwDay(c.at), dept: c.dept, locs: c.locs.join(' · '), sent: c.sent, scls: sentCls(c.sent), needs: c.needs, actTxt: (c.advRaised ? 'Advisory sent' : '') + (c.advRaised && c.rejIssued ? ' · ' : '') + (c.rejIssued ? (RJ[c.id].status === 'Published' ? 'Rejoinder published' : 'Rejoinder issued') : ''), hasAct: c.advRaised || c.rejIssued, unread: c.unread && !read[c.id], cls: 'pwc' + (c.unread && !read[c.id] ? ' unread' : '') + (c.needs ? ' needs' : ''), open: function () { self.pwOpen(c); }, pageNo: 'p.' + c.page }; };
    let shown = res.slice(pg * per, pg * per + per);
    /* Pages view: group by newspaper, date and page */
    let pages = [];
    if (view === 'pages') { const g = {}; res.forEach(function (c) { const k = c.paper + '|' + c.day + '|' + c.page; (g[k] = g[k] || []).push(c); }); const keys = Object.keys(g); pages = keys.slice(pg * per, pg * per + per).map(function (k) { const l = g[k]; return { paper: l[0].paper, date: pwDay(l[0].at), page: 'Page ' + l[0].page + ' · ' + l[0].section, n: l.length + ' clipping' + (l.length === 1 ? '' : 's'), items: l.map(item) }; }); shown = []; var totalP = keys.length; }
    const total = view === 'pages' ? totalP : res.length;
    const today = all.filter(function (c) { return c.at >= t0 && (!dn || c.district === dn); });
    const advT = all.filter(function (c) { return AV[c.id] && AV[c.id].at >= t0.getTime() && (!dn || c.district === dn); }); const rejT = all.filter(function (c) { return RJ[c.id] && RJ[c.id].at >= t0.getTime() && (!dn || c.district === dn); });
    const unread = all.filter(function (c) { return c.unread && !read[c.id] && (!dn || c.district === dn); });
    const sc = function (x) { return today.filter(function (c) { return c.sent === x; }); };
    const papers = []; res.forEach(function (c) { if (papers.indexOf(c.paper) < 0) papers.push(c.paper); });
    const set = function (o) { o.pwPage = 0; self.setState(o); };
    const P0scope = (dn || 'Andhra Pradesh');
    const P = {
      count: fmtN(res.length), papersN: fmtN(papers.length), needsN: fmtN(res.filter(function (c) { return c.open; }).length),
      views: [['grid', 'Grid'], ['list', 'List'], ['clip', 'Clippings'], ['pages', 'Pages']].map(function (v) { return { label: v[1], cls: v[0] === view ? 'on' : '', pick: function () { set({ pwView: v[0] }); } }; }),
      isGrid: view === 'grid', isList: view === 'list', isClip: view === 'clip', isPages: view === 'pages',
      presets: [['today', 'Today'], ['7d', '7 days'], ['30d', '30 days'], ['all', 'All time']].map(function (p) { const on = !s.pwFrom && !s.pwTo && preset === p[0]; return { label: p[1], cls: 'chip' + (on ? ' on' : ''), pick: function () { set({ pwPreset: p[0], pwFrom: '', pwTo: '' }); } }; }),
      fromV: s.pwFrom || (from ? pwIso(from) : ''), toV: s.pwTo || pwIso(t0), onFrom: function (e) { set({ pwFrom: e.target.value }); }, onTo: function (e) { set({ pwTo: e.target.value }); },
      q: s.pwQ || '', onQ: function (e) { self.setState({ pwQ: e.target.value }); }, search: function (e) { if (e && e.preventDefault) e.preventDefault(); set({ pwQA: self.state.pwQ || '' }); }, refresh: function () { self.refreshAll(); },
      refreshed: 'Refreshed ' + (self._pwRef || now).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      sents: ['Bad', 'Neutral', 'Good'].map(function (x) { const n = base.filter(function (c) { return pass(c, 'sent') && c.sent === x; }).length; return { label: x + ' · ' + fmtN(n), cls: 'pwsf ' + (x === 'Bad' ? 'bad' : x === 'Good' ? 'good' : 'neu') + (F.sent === x ? ' on' : ''), pick: function () { set({ pwSent: F.sent === x ? '' : x }); } }; }),
      dept: opts('dept', DEPTS, 'All departments'), paper: opts('paper', PW_PAPERS.map(function (p) { return p[0]; }), 'All newspapers'), section: opts('section', Object.keys(PW_SECT), 'All sections'),
      needs: F.needs, hand: F.hand, togNeeds: function () { set({ pwNeeds: !F.needs }); }, togHand: function () { set({ pwHand: !F.hand }); },
      clear: function () { set({ pwSent: '', pwDept: '', pwPaper: '', pwSec: '', pwNeeds: false, pwHand: false, pwQ: '', pwQA: '', pwFrom: '', pwTo: '', pwPreset: '30d' }); },
      isF: !!(F.sent || F.dept || F.paper || F.section || F.needs || F.hand || q || s.pwFrom || s.pwTo || preset !== '30d'),
      today: { all: fmtN(today.length), pos: fmtN(sc('Good').length), neg: fmtN(sc('Bad').length), neu: fmtN(sc('Neutral').length), adv: fmtN(advT.length), rej: fmtN(rejT.length),
        openAll: function () { self.pwList('Clippings today', today, ['Newspaper articles published today that mention civil supplies, paddy, ration or APSCSCL work in Andhra Pradesh.', "Every clipping with today's publication date, whatever its sentiment. Sample data until the clipping feed is connected."]); }, openPos: function () { self.pwList('Clippings today · Good (AI read)', sc('Good'), ['Clippings today whose tone the AI reads as Good, for example progress or relief for farmers and cardholders.', 'AI read of the article; not a verified finding and not a severity level.']); }, openNeg: function () { self.pwList('Clippings today · Bad (AI read)', sc('Bad'), ['Clippings today whose tone the AI reads as Bad, for example delays, shortages or irregularities reported.', 'AI read of the article; not a verified finding and not a severity level.']); }, openNeu: function () { self.pwList('Clippings today · Neutral (AI read)', sc('Neutral'), ['Clippings today that the AI reads as neither positive nor negative, for example reviews, notices and routine inspections.', 'AI read of the article.']); },
        openAdv: function () { self.pwActList('Advisories raised today', advT, AV, 'adv', ['Advisories recorded today: each one is tied to a clipping and sent to the district or department named, asking them to check and act on what was reported.', 'Advisory records in the Decision log with today\'s date, whatever the date of the clipping. Undoing an advisory removes it from this count.']); }, openRej: function () { self.pwActList('Rejoinders issued today', rejT, RJ, 'rej', ['Rejoinders recorded today: an official correction or clarification sent to the newspaper about a specific clipping.', 'Rejoinder records in the Decision log with today\'s issue date, whatever the date of the clipping. Status shows whether the paper has published it.']); } },
      openRes: function () { self.pwList('Articles in this result · ' + P0scope, res, ['Clippings that match the date range, search and every filter currently set on this page.']); },
      openPapers: function () { self.tablePopup('Newspapers in this result', fmtN(papers.length) + ' newspapers', ['Newspaper', 'Language', 'Clippings', 'Bad (AI)', 'Good (AI)'], papers.map(function (p0) { const l = res.filter(function (c) { return c.paper === p0; }); return { name: p0, cells: [Object.assign(C(l[0].lang), { cls: 'txt' }), C(fmtN(l.length)), C(fmtN(l.filter(function (c) { return c.sent === 'Bad'; }).length), 'bad'), C(fmtN(l.filter(function (c) { return c.sent === 'Good'; }).length), 'good')], drill: function () { self.pwList(p0 + ' · clippings in this result', l); } }; }), null, 'newspapers', null, [{ k: 'Definition', v: 'Newspapers that carried at least one clipping in the current result.' }, { k: 'How it is counted', v: 'Distinct newspaper names among the clippings that match the date range, search and filters.' }]); },
      openNeeds: function () { self.pwList('Articles needing attention', res.filter(function (c) { return c.open; }), ['Clippings in the current result flagged as needing action (the AI reads them as Bad and they report something a department can check or correct) that have no advisory or rejoinder recorded yet.', 'Clippings matching the current filters with the Needs action flag and no recorded advisory or rejoinder. Recording either one takes the clipping off this list; undoing it puts it back.']); },
      hasUnread: unread.length > 0, unreadTxt: fmtN(unread.length) + ' clipping' + (unread.length === 1 ? '' : 's') + ' not yet read', openUnread: function () { self.pwList('Unread clippings', unread, ['Clippings from the last 3 days that nobody has opened on this dashboard yet.']); }, markRead: function () { const rd = Object.assign({}, self.state.pwRead || {}); unread.forEach(function (c) { rd[c.id] = 1; }); self.setState({ pwRead: rd }); },
      items: shown.map(item), pages: pages, none: total === 0, has: total > 0,
      range: total ? (pg * per + 1) + '–' + Math.min(total, pg * per + per) + ' of ' + fmtN(total) + (view === 'pages' ? ' pages' : ' clippings') : '0 clippings',
      canPrev: pg > 0, canNext: (pg + 1) * per < total, prevDis: pg <= 0, nextDis: (pg + 1) * per >= total, prev: function () { self.setState({ pwPage: Math.max(0, pg - 1) }); }, next: function () { self.setState({ pwPage: pg + 1 }); },
      scope: (dn || 'Andhra Pradesh') + ' · ' + (s.pwFrom || s.pwTo ? (s.pwFrom || 'start') + ' to ' + (s.pwTo || 'today') : { today: 'Today', '7d': 'Last 7 days', '30d': 'Last 30 days', all: 'All time' }[preset])
    };
    return { title: 'Media · News clips', sub: 'Press Watch · newspaper clippings', kpis: [], scores: [], press: P, pressOn: true };
  }
  /* ---------- Media: YouTube ---------- */
  ytOpen(v) {
    const sentNote = v.c ? v.c + ' comment' + (v.c === 1 ? '' : 's') + ' on YouTube. The file gives comment counts but not the comment text, so comment sentiment cannot be scored yet.' : 'No comments on YouTube yet.';
    this.setState({ rxRec: { media: { k: 'yt', id: v.id }, img: 'https://i.ytimg.com/vi/' + v.id + '/hqdefault.jpg', imgDur: Math.floor(v.dur / 60) + ':' + pad(v.dur % 60, 2), cmt: (function () { const m = ytMockComments(v); if (!m) return { title: 'Comments · AI summary and sentiment', body: 'No comments on this video yet, so there is nothing to summarise.', mock: false, bars: [], themes: [], samples: [] }; const mx = Math.max(m.pos, m.neu, m.neg, 1); return { title: 'Comments · AI summary and sentiment', body: m.summary, mock: true, bars: [['Good', m.pos, '#2F9E44'], ['Neutral', m.neu, '#868E96'], ['Bad', m.neg, '#E03131']].map(function (b) { return { label: b[0], v: fmtN(b[1]) + ' (' + Math.round(b[1] / v.c * 100) + '%)', w: Math.max(2, Math.round(b[1] / mx * 100)), c: b[2] }; }), themes: m.themes.map(function (x) { return { t: x[0], cls: 'pws ' + (x[1] === 'neg' ? 'bad' : x[1] === 'pos' ? 'good' : 'neu') }; }), samples: m.samples.map(function (x) { return { t: '“' + x[1] + '”', cls: 'pws ' + (x[0] === 'neg' ? 'bad' : x[0] === 'pos' ? 'good' : 'neu'), l: x[0] === 'neg' ? 'Bad' : x[0] === 'pos' ? 'Good' : 'Neutral' }; }) }; })(), back: this.state.rxRec || null, title: v.t, sub: v.ch + ' · ' + pwDay(new Date(v.at)) + ' · YouTube', ai: v.why + '.', aiLabel: 'AI read of the title (generated)', aiSrc: 'Sentiment here is read from the video title, not from comments. ' + sentNote,
      src: v.d || '—', srcLabel: 'Video description · as published on YouTube',
      facts: [{ k: 'Video ID', v: v.id }, { k: 'Channel', v: v.ch }, { k: 'Published', v: pwDay(new Date(v.at)) }, { k: 'Sentiment (AI read of title)', v: v.s }, { k: 'Views', v: fmtN(v.v) }, { k: 'Likes', v: fmtN(v.l) }, { k: 'Comments', v: fmtN(v.c) }, { k: 'Duration', v: Math.floor(v.dur / 60) + ' min ' + (v.dur % 60) + ' s' }, { k: 'Matched keywords', v: v.kw }, { k: 'District named (AI read)', v: v.dist || 'None identified' }, { k: 'Link', v: v.url }],
      steps: [], links: [{ label: 'Open on YouTube', href: v.url }] } });
  }
  buildYT(path) {
    const self = this; const s = this.state; const dn = path[0] || null;
    const now = new Date(); const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()); const preset = s.ytPreset || 'all';
    const from = preset === '7d' ? new Date(t0.getTime() - 6 * 86400000) : preset === '30d' ? new Date(t0.getTime() - 29 * 86400000) : preset === '90d' ? new Date(t0.getTime() - 89 * 86400000) : null;
    const q = (s.ytQA || '').trim().toLowerCase();
    const base = YT_AP.filter(function (v) { return (!dn || v.dist === dn) && (!from || new Date(v.at) >= from) && (!q || (v.t + ' ' + v.d).toLowerCase().indexOf(q) >= 0); });
    const F = { s: s.ytSent || '', ch: s.ytCh || '' };
    const pass = function (v, skip) { return (skip === 's' || !F.s || v.s === F.s) && (skip === 'ch' || !F.ch || v.ch === F.ch); };
    const res = base.filter(function (v) { return pass(v); }).sort(function (a, b) { return s.ytSort === 'views' ? b.v - a.v : new Date(b.at) - new Date(a.at); });
    const set = function (o) { self.setState(o); };
    const chans = []; YT_AP.forEach(function (v) { if (chans.indexOf(v.ch) < 0) chans.push(v.ch); });
    const Y = {
      count: fmtN(res.length), totalFile: fmtN(YT_META.total), apN: fmtN(YT_META.apN), views: fmtN(res.reduce(function (a, v) { return a + v.v; }, 0)), comments: fmtN(res.reduce(function (a, v) { return a + v.c; }, 0)),
      chNote: YT_META.channels.map(function (c) { return c[0].trim() + ' (' + (c[1] === 'success' ? c[2] + ' videos matched' : 'not fetched') + ')'; }).join(' · '),
      sents: ['Bad', 'Neutral', 'Good'].map(function (x) { const n = base.filter(function (v) { return pass(v, 's') && v.s === x; }).length; return { label: x + ' · ' + n, cls: 'pwsf ' + (x === 'Bad' ? 'bad' : x === 'Good' ? 'good' : 'neu') + (F.s === x ? ' on' : ''), pick: function () { set({ ytSent: F.s === x ? '' : x }); } }; }),
      chOpts: [{ v: '', l: 'All channels · ' + base.filter(function (v) { return pass(v, 'ch'); }).length }].concat(chans.map(function (c) { return { v: c, l: c + ' · ' + base.filter(function (v) { return pass(v, 'ch') && v.ch === c; }).length }; })), chVal: F.ch, onCh: function (e) { set({ ytCh: e.target.value }); },
      presets: [['7d', '7 days'], ['30d', '30 days'], ['90d', '90 days'], ['all', 'All time']].map(function (p) { return { label: p[1], cls: 'chip' + (preset === p[0] ? ' on' : ''), pick: function () { set({ ytPreset: p[0] }); } }; }),
      sorts: [['new', 'Newest'], ['views', 'Most viewed']].map(function (p) { return { label: p[1], cls: (s.ytSort || 'new') === p[0] ? 'on' : '', pick: function () { set({ ytSort: p[0] }); } }; }),
      q: s.ytQ || '', onQ: function (e) { set({ ytQ: e.target.value }); }, search: function (e) { if (e && e.preventDefault) e.preventDefault(); set({ ytQA: self.state.ytQ || '' }); },
      clear: function () { set({ ytSent: '', ytCh: '', ytQ: '', ytQA: '', ytPreset: 'all' }); }, isF: !!(F.s || F.ch || q || preset !== 'all'),
      items: res.map(function (v) { const d = new Date(v.at); const mc = ytMockComments(v); return { views: fmtN(v.v), cm: fmtN(v.c) + (mc ? ' · ' + mc.top.replace('mostly ', '') : ''), id: v.id, t: v.t, ch: v.ch, date: pwDay(d), thumb: 'https://i.ytimg.com/vi/' + v.id + '/mqdefault.jpg', dur: Math.floor(v.dur / 60) + ':' + pad(v.dur % 60, 2), stats: fmtN(v.v) + ' views · ' + fmtN(v.l) + ' likes · ' + fmtN(v.c) + ' comments', s: v.s, scls: 'pws ' + (v.s === 'Bad' ? 'bad' : v.s === 'Good' ? 'good' : 'neu'), why: v.why, kw: v.kw, dist: v.dist || '', hasDist: !!v.dist, open: function () { self.ytOpen(v); } }; }),
      none: res.length === 0, has: res.length > 0, isAll: !!s.ytAll, isTop: !s.ytAll, allN: fmtN(YT_AP.filter(function (v) { return !dn || v.dist === dn; }).length), showAll: function () { set({ ytAll: true }); }, showTop: function () { set({ ytAll: false }); },
      scope: (dn || 'Andhra Pradesh') + ' · ' + { '7d': 'Last 7 days', '30d': 'Last 30 days', '90d': 'Last 90 days', all: 'All time' }[preset]
    };
    Y.topTitle = (s.ytSort === 'views' ? 'Most viewed' : 'Latest') + ' · ' + Math.min(3, res.length) + ' of ' + fmtN(res.length) + ' matching'; Y.allN = fmtN(res.length);
    Y.top = res.slice(0, 3).map(function (v) { return Y.items.filter(function (x) { return x.id === v.id; })[0] || { id: v.id, t: v.t, ch: v.ch, date: pwDay(new Date(v.at)), thumb: 'https://i.ytimg.com/vi/' + v.id + '/mqdefault.jpg', dur: Math.floor(v.dur / 60) + ':' + pad(v.dur % 60, 2), stats: fmtN(v.v) + ' views · ' + fmtN(v.l) + ' likes · ' + fmtN(v.c) + ' comments', s: v.s, scls: 'pws ' + (v.s === 'Bad' ? 'bad' : v.s === 'Good' ? 'good' : 'neu'), why: v.why, open: function () { self.ytOpen(v); } }; });
    return { title: 'Media · YouTube', sub: 'Civil-supplies videos found on news channels · AP only', kpis: [], scores: [], yt: Y, ytOn: true };
  }
  buildGps(path, stage) {
    const self = this; const depth = path.length;
    const sOK = self._seasOK || function () { return true; };
    const filt = function (l) { return l.filter(function (x) { return (stage === 'all' || x.stage === stage) && sOK(x.stage); }); };
    const dns = depth ? [path[0]] : D.map(function (d) { return d.name; });
    let all = []; dns.forEach(function (dn) { all = all.concat(filt(vehiclesOf(dn))); });
    const cnt = function (l, s) { return l.filter(function (x) { return x.status === s; }).length; };
    const geo = function (l) { return l.filter(function (x) { return x.geof; }).length; };
    const k = function (label, value, sub, t, key) { return self.mkK(label, value, sub, t, key); };
    const dev = cnt(all, 'Deviated'), halt = cnt(all, 'Halted > 2 h');
    const fv = depth ? distVals(path[0]) : stateVals();
    const MV = { all: 1, proc: 0.45, s1: 0.2, s2: 0.15, cmr: 0.15, stor: 0.05 }; const mf = MV[stage] || 1;
        const VF = { all: 1, proc: 0.45, cmr: 0.18, s1: 0.22, s2: 0.15, stor: 0.05 }; const vf = VF[stage] || 1;
    const gf = function (dn) { const v = distVals(dn); const reg = Math.round(v.regVeh * vf), act = Math.round(v.actVeh * vf), idle = Math.round(v.idleVeh * vf), t = Math.round(v.tripsT * mf), c = Math.round(v.tripsC * mf); const vl = filt(vehiclesOf(dn)); return { reg: reg, act: act, idle: idle, inact: reg - act - idle, appr: Math.round(v.vehAppr * vf), t: t, c: c, i: t - c, dev: cnt(vl, 'Deviated'), trk: vl.length }; };
    const gsum = { reg: 0, act: 0, idle: 0, inact: 0, appr: 0, t: 0, c: 0, i: 0, dev: 0, trk: 0 }; dns.forEach(function (dn) { const o = gf(dn); Object.keys(gsum).forEach(function (k2) { gsum[k2] += o[k2]; }); });
    const fl = { reg: gsum.reg, act: gsum.act, idle: gsum.idle, appr: gsum.appr, inact: gsum.inact }; const actP = gsum.act / (gsum.reg || 1); const tT = gsum.t, tC = gsum.c, tI = gsum.i;
    const page = { title: 'GPS vehicle tracking', sub: MODS[4].src, kpis: [k('Registered vehicles', fmtN(fl.reg), (stage === 'all' ? 'all movement types' : STAGE_NAME[stage] + ' movement') + ' · ' + fmtN(fl.appr) + ' approved', '', 'fl_reg'), k('Active vehicles', pct(actP), fmtN(fl.act) + ' reporting now', tone(actP, 0.3, 0.2), 'fl_act'), k('Inactive vehicles', fmtN(fl.inact), pct(fl.inact / (fl.reg || 1)) + ' of registered', 'warn', 'fl_inact'), k('Idle GPS devices', fmtN(fl.idle), pct(fl.idle / (fl.reg || 1)) + ' of fleet', '', 'fl_idle'), k('Total trips', fmtN(tT), stage === 'all' ? 'all movement types' : STAGE_NAME[stage] + ' movement', '', 'fl_trips'), k('Trip completion', pct(tC / (tT || 1)), fmtN(tC) + ' of ' + fmtN(tT) + ' completed', tone(tC / (tT || 1), 0.6, 0.4), 'fl_comp'), k('In-transit trips', fmtN(tI), 'on the road now', '', 'fl_tran'), k('Route deviations', fmtN(dev), 'over 5 km off route', tone(dev / (all.length || 1), 0.02, 0.04, false), 'gps')] };
    if (stage !== 'all') { page.hasFilter = true; page.filter = STAGE_NAME[stage]; }
    { const fn = function (x) { return fmtN(x); }; const G = function (k2) { return function (o) { return o[k2]; }; };
      [{ cols: [['Approved', 'appr', 'n'], ['Active', 'act', 'n']], res: ['Registered vehicles', G('reg'), fn] },
       { cols: [['Active vehicles', 'act', 'n'], ['Registered vehicles', 'reg', 'n']], res: ['Active', function (o) { return o.act / (o.reg || 1); }, pct, function (x) { return tone(x, 0.3, 0.2); }] },
       { cols: [['Registered vehicles', 'reg', 'n']], res: ['Inactive vehicles', G('inact'), fn] },
       { cols: [['Registered vehicles', 'reg', 'n']], res: ['Idle GPS devices', G('idle'), fn] },
       { cols: [['Completed', 'c', 'n'], ['In transit', 'i', 'n']], res: ['Total trips', G('t'), fn] },
       { cols: [['Trips completed', 'c', 'n'], ['Total trips', 't', 'n']], res: ['Trip completion', function (o) { return o.c / (o.t || 1); }, pct, function (x) { return tone(x, 0.6, 0.4); }] },
       { cols: [['Total trips', 't', 'n']], res: ['In-transit trips', G('i'), fn] },
       { cols: [['Vehicles tracked', 'trk', 'n']], res: ['Route deviations', G('dev'), fn] }].forEach(function (sp, i) { sp.f = gf; if (page.kpis[i]) page.kpis[i]._info.tab = sp; }); }
    if (depth === 0) {
      const rows = D.map(function (d) { const o = gf(d.name); return { d: d, o: o, t: o.t, c: o.c, r: o.c / (o.t || 1), dv: o.dev, ap: o.act / (o.reg || 1) }; }).map(function (x) { return { name: x.d.name, cells: [C(fmtN(x.o.reg)), C(pct(x.ap), tone(x.ap, 0.3, 0.2)), C(fmtN(x.o.idle)), C(fmtN(x.t)), C(fmtN(x.c)), C(pct(x.r), tone(x.r, 0.6, 0.4)), C(fmtN(x.t - x.c)), C(fmtN(x.dv), tone(x.dv, 2, 6, false))], drill: function () { self.drill(x.d.name); } }; });
      page.hasTable = true; page.table = this.table('District-wise view', 'Trip volumes beside each rate · click a district to see its vehicles', ['District', 'Registered', 'Active', 'Idle devices', 'Trips', 'Completed', 'Completion', 'In transit', 'Deviations'], rows, [C(fmtN(fl.reg)), C(pct(actP)), C(fmtN(fl.idle)), C(fmtN(tT)), C(fmtN(tC)), C(pct(tC / (tT || 1))), C(fmtN(tI)), C(fmtN(dev))], 'Andhra Pradesh', 'district-completion-ranking');
      const MT = [['Paddy', 0.42], ['Stage 1', 0.2], ['Stage 2', 0.16], ['CMR', 0.15], ['Jowar', 0.04], ['Ragi', 0.03]];
      page.hasChart = true; page.chart = { title: 'Trips by movement type', src: fmtN(fv.tripsT) + ' trips today', bars: MT.map(function (m) { const n = Math.round(fv.tripsT * m[1]); return { label: m[0], w: Math.round(m[1] / 0.42 * 100), v: fmtN(n), c: '#5B8FD0' }; }) };
    } else if (depth === 1) {
      const order = { Deviated: 0, 'Halted > 2 h': 1, Moving: 2, Loading: 3, Reached: 4 };
      const l = all.slice().sort(function (a, b) { return order[a.status] - order[b.status]; });
      const rows = l.slice(0, 40).map(function (x) { return { name: x.plate, cells: [Object.assign(C(STAGE_NAME[x.stage]), { cls: 'txt' }), Object.assign(C(x.from), { cls: 'txt' }), Object.assign(C(x.to), { cls: 'txt' }), Object.assign(C(x.status, x.status === 'Deviated' || x.status === 'Halted > 2 h' ? 'bad' : x.status === 'Reached' ? 'good' : ''), { cls: 'txt' }), C(x.speed ? x.speed + ' km/h' : '—'), C(x.dev ? fmtN(x.dev, 1) + ' km' : '—', x.dev ? 'bad' : ''), C(x.status === 'Reached' ? '—' : x.eta)], drill: function () { self.drill(x.id); } }; });
      page.hasTable = true; page.table = this.table('Vehicles · ' + path[0], 'Exceptions first · showing ' + Math.min(40, l.length) + ' of ' + l.length + ' · click a vehicle for its trip trail', ['Vehicle', 'Leg', 'From', 'To', 'Status', 'Speed', 'Off route', 'ETA'], rows, null, null, 'vehicles-' + path[0]);
    } else {
      const x = TX[path[1]] || vehiclesOf(path[0])[0];
      const st = function (label, meta, cls) { return { label: label, meta: meta, cls: 'step ' + (cls || 'done') }; };
      const deviated = x.status === 'Deviated';
      page.hasDetail = true;
      page.detail = { title: x.plate + ' · ' + x.from + ' → ' + x.to, src: '', facts: [{ k: 'Leg', v: STAGE_NAME[x.stage] }, { k: 'Status', v: x.status }, { k: 'Speed', v: x.speed ? x.speed + ' km/h' : 'Stationary' }, { k: 'Trip distance', v: x.km + ' km' }, { k: 'Off route', v: x.dev ? fmtN(x.dev, 1) + ' km' : 'No' }, { k: 'Geofence', v: x.geof ? 'Breached' : 'Within approved area' }, { k: 'ETA', v: x.eta }],
        steps: [st('Trip started at ' + x.from, 'Ignition on · ' + clock(x.id + 's', 6, 10)), st('Loaded and sealed', 'Gate camera at origin'), st(deviated ? 'Left planned route' : x.status === 'Halted > 2 h' ? 'Stopped for over 2 hours' : 'On planned route', deviated ? 'Alert sent to CCC · ' + fmtN(x.dev, 1) + ' km off route' : 'Pings every 30 s', deviated || x.status === 'Halted > 2 h' ? 'bad' : 'done'), st('Arrival at ' + x.to, x.status === 'Reached' ? 'Unloaded' : 'ETA ' + x.eta, x.status === 'Reached' ? 'done' : 'now')],
        planned: '20,120 80,100 140,86 200,64 250,44 280,30', actual: deviated ? '20,120 80,100 110,128 165,124 205,70 250,44 280,30' : '20,121 79,99 141,88 199,62 251,45 280,30', trailColor: deviated ? '#C2502E' : '#2B5FA5', gpsNote: deviated ? 'Deviation highlighted.' : 'No deviation.', cam: 'Origin gate camera · ' + x.plate, camTs: 'Today ' + clock(x.id + 'c', 6, 10) };
    }
    return page;
  }

  buildCctv(path, stage) {
    const self = this; const depth = path.length;
    const sOK = self._seasOK || function () { return true; };
    const filt = function (l) { return l.filter(function (c) { return (stage === 'all' || c.stage === stage || (stage === 's2' && c.stage === 's1')) && sOK(c.stage); }); };
    const dns = depth ? [path[0]] : D.map(function (d) { return d.name; });
    let all = []; dns.forEach(function (dn) { all = all.concat(filt(camerasOf(dn))); });
    const off = all.filter(function (c) { return c.status === 'Offline'; }).length; const ev = all.filter(function (c) { return c.event; }).length;
    const k = function (label, value, sub, t, key) { return self.mkK(label, value, sub, t, key); };
    const onl = 1 - off / (all.length || 1);
    const page = { title: 'CCTV record monitoring', sub: MODS[3].src, kpis: [k('Cameras', fmtN(all.length), stage === 'all' ? 'buffer godowns and MLS points' : CAMLOC[stage] ? CAMLOC[stage] + 's' : 'no CCTV at this stage'), k('Online', pct(onl), 'live now', tone(onl, 0.95, 0.9), 'cam'), k('Offline', fmtN(off), 'need field check', tone(off / (all.length || 1), 0.05, 0.1, false), 'camoff'), k('Flagged events (24 h)', fmtN(ev), 'AI video analytics', tone(ev, 10, 40, false), 'cam_ev')] };
    if (stage !== 'all') { page.hasFilter = true; page.filter = STAGE_NAME[stage]; }
    { const cf = function (dn) { const l = filt(camerasOf(dn)); const o = l.filter(function (c) { return c.status === 'Offline'; }).length; return { cams: l.length, off: o, on: l.length - o, ev: l.filter(function (c) { return c.event; }).length }; };
      const fn = function (x) { return fmtN(x); };
      [{ cols: [['Online', 'on', 'n'], ['Offline', 'off', 'n']], res: ['Cameras', function (o) { return o.cams; }, fn] },
       { cols: [['Cameras online', 'on', 'n'], ['Cameras installed', 'cams', 'n']], res: ['Online', function (o) { return o.on / (o.cams || 1); }, pct, function (x) { return tone(x, 0.95, 0.9); }] },
       { cols: [['Cameras installed', 'cams', 'n']], res: ['Offline', function (o) { return o.off; }, fn] },
       { cols: [['Cameras installed', 'cams', 'n']], res: ['Flagged events (24 h)', function (o) { return o.ev; }, fn] }].forEach(function (sp, i) { sp.f = cf; sp.fm = function (mid, m) { const l = filt(camerasOf(m.dn)).filter(function (c) { return c.mandal === m.name; }); const o = l.filter(function (c) { return c.status === 'Offline'; }).length; return { cams: l.length, off: o, on: l.length - o, ev: l.filter(function (c) { return c.event; }).length }; }; page.kpis[i]._info.tab = sp; }); }
    const tileOf = function (c) { const isOff = c.status === 'Offline'; return { site: c.site + ' · ' + c.view, event: isOff ? 'Offline since ' + c.ts : c.event || 'No events', ts: c.dn + ' · ' + c.ts, badge: isOff ? 'OFFLINE' : c.event ? 'EVENT' : 'LIVE', badgeCls: 'lv ' + (isOff ? 'off' : c.event ? 'alert' : ''), boxCls: 'feedbox' + (isOff ? ' off' : ''), go: function () { self.setState({ path: [c.dn, c.id] }); } }; };
    if (depth < 2) {
      const flagged = all.filter(function (c) { return c.event || c.status === 'Offline'; }).sort(function (a, b) { return (b.event ? 1 : 0) - (a.event ? 1 : 0); });
      page.hasTiles = true; page.tilesTitle = depth === 0 ? 'Flagged feeds across the state' : 'Flagged feeds · ' + path[0]; page.tiles = flagged.filter(function (c) { return c.stage === 'stor'; }).slice(0, 2).concat(flagged.filter(function (c) { return c.stage !== 'stor'; }).slice(0, 1)).map(tileOf); /* 2 buffer godown feeds + 1 MLS point feed */
    }
    if (depth === 0) {
      const rows = D.map(function (d) { return { d: d, l: filt(camerasOf(d.name)) }; }).map(function (x) { const l = x.l; const o = l.filter(function (c) { return c.status === 'Offline'; }).length; const on = 1 - o / (l.length || 1); return { name: x.d.name, cells: [C(fmtN(l.length)), C(pct(on), tone(on, 0.95, 0.9)), C(fmtN(o)), C(fmtN(l.filter(function (c) { return c.event; }).length))], drill: function () { self.drill(x.d.name); } }; });
      page.hasTable = true; page.table = this.table('District-wise view', 'Click a district to see its cameras', ['District', 'Cameras', 'Online', 'Offline', 'Flagged events (24 h)'], rows, [C(fmtN(all.length)), C(pct(onl)), C(fmtN(off)), C(fmtN(ev))], 'Andhra Pradesh', 'cctv-by-district');
    } else if (depth === 1) {
      const l = all.slice().sort(function (a, b) { return (a.status === 'Offline' ? 0 : a.event ? 1 : 2) - (b.status === 'Offline' ? 0 : b.event ? 1 : 2); });
      const rows = l.slice(0, 40).map(function (c) { return { name: c.id, cells: [Object.assign(C(c.site), { cls: 'txt' }), Object.assign(C(c.view), { cls: 'txt' }), Object.assign(C(c.mandal), { cls: 'txt' }), Object.assign(C(c.status, c.status === 'Online' ? 'good' : 'bad'), { cls: 'txt' }), Object.assign(C(c.event || '—', c.event ? 'warn' : ''), { cls: 'txt' }), C(c.ts)], drill: function () { self.drill(c.id); } }; });
      page.hasTable = true; page.table = this.table('Cameras · ' + path[0], 'Offline and flagged first · showing ' + Math.min(40, l.length) + ' of ' + l.length, ['Camera', 'Site', 'View', 'Mandal', 'Status', 'Last event', 'Time'], rows, null, null, 'cameras-' + path[0]);
    } else {
      const c = TX[path[1]] || camerasOf(path[0])[0];
      const st = function (label, meta, cls) { return { label: label, meta: meta, cls: 'step ' + (cls || 'done') }; };
      page.hasDetail = true;
      page.detail = { title: c.id + ' · ' + c.site, src: 'Road Vision', facts: [{ k: 'Site', v: c.site }, { k: 'View', v: c.view }, { k: 'District / mandal', v: c.dn + ' / ' + c.mandal }, { k: 'Status', v: c.status }, { k: 'Last event', v: c.event || 'None' }, { k: 'Retention', v: '30 days' }],
        steps: [st('Recording continuously', 'Road Vision NVR'), st(c.status === 'Offline' ? 'Feed lost at ' + c.ts : 'Last heartbeat ' + c.ts, c.status === 'Offline' ? 'Ticket raised to vendor' : 'Healthy', c.status === 'Offline' ? 'bad' : 'done'), st(c.event ? c.event + ' detected' : 'No analytics events in 24 h', c.event ? 'Clip saved · linked to CCC incident' : '—', c.event ? 'now' : 'done')],
        planned: '20,120 80,100 140,86 200,64 250,44 280,30', actual: '20,121 79,99 141,88 199,62 251,45 280,30', trailColor: '#2B5FA5', gpsNote: 'Vehicles that visited this site today.', cam: c.site + ' · ' + c.view + ' camera', camTs: 'Today ' + c.ts };
    }
    return page;
  }

  buildPrep(path, stage, sk) {
    const self = this; const s = this.state; const isDM = s.role === 'dm';
    const dn = path[0] || null;
    const scopeDistricts = D.filter(function (d) { return !isDM || d.name === s.dm; });
    const view = s.prepView || 'overview'; const pSel = s.prepParam === undefined || s.prepParam === null ? -1 : s.prepParam; const asc = s.prepSort !== 'desc';
    const T = function (x) { return Object.assign(C(x), { cls: 'txt' }); };
    const bandOf = function (x) { if (x === null || x === undefined) return 'na'; x = Math.round(x * 1000) / 1000; return x >= 0.7 ? 'good' : x >= 0.5 ? 'mod' : 'att'; };
    const BL = { good: 'Good', mod: 'Moderate', att: 'Needs attention', na: 'No data yet' }, BT = { good: 'good', mod: 'warn', att: 'bad', na: '' }, BC = { good: '#5B8FD0', mod: '#E0AE4F', att: '#D8714F', na: '#DCE3EB' };
    const sorter = function (get) { return function (a, b) { const x = get(a), y = get(b); if (x === null && y === null) return 0; if (x === null) return 1; if (y === null) return -1; return asc ? x - y : y - x; }; };
    const fmtU = function (i, x) { return PRM[i][4] === 'ebg' ? '₹' + fmtN(x, 1) + ' Cr' : PRM[i][4] === 'gun' ? fmtN(x, 1) + ' L bags' : fmtN(Math.round(x)); };
    const age = function () { return Math.max(1, (Date.now() - PREP_SNAP_AT.getTime()) / 60000); }; /* minutes since the snapshot */
    const ageTxt = function (m) { return m < 60 ? Math.round(m) + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; };
    /* statistic for parameter i at district / state */
    const dStat = function (i, d) { const c = prepRaw(d, i); if (!c) return { x: null, num: null, den: null, fresh: 'No report received', stale: false, m: null }; const num = Math.min(c[0], c[1]); const m = age(d, i); return { x: num / c[1], num: num, den: c[1], fresh: ageTxt(m), stale: m > 1440, m: m }; };
    const sStat = function (i) { let num = 0, den = 0, rep = 0, stale = 0, mn = 1e9; scopeDistricts.forEach(function (d) { const st = dStat(i, d.name); if (st.x !== null) { num += st.num; den += st.den; rep++; if (st.stale) stale++; mn = Math.min(mn, st.m); } }); return { x: rep ? num / den : null, num: num, den: den, rep: rep, fresh: rep ? 'Latest ' + ageTxt(mn) + (stale ? ' · ' + stale + ' districts stale (> 24 h)' : '') : 'No report received', stale: stale > 0 }; };
    const stat = function (i) { return dn ? dStat(i, dn) : sStat(i); };
    const scopeName = dn || 'Andhra Pradesh';
    const idxAll = PRM.map(function (p, i) { return i; });
    const st17 = idxAll.map(function (i) { return stat(i); });
    const rep = idxAll.filter(function (i) { return st17[i].x !== null; });
    const avg = rep.reduce(function (a, i) { return a + st17[i].x; }, 0) / (rep.length || 1);
    const cnt = { good: 0, mod: 0, att: 0, na: 0 }; idxAll.forEach(function (i) { cnt[bandOf(st17[i].x)]++; });
    const repCells = dn ? rep.length : scopeDistricts.reduce(function (a, d) { return a + idxAll.filter(function (i) { return !prepNA(d.name, i); }).length; }, 0);
    const totCells = dn ? 17 : scopeDistricts.length * 17;
    const distAvg = function (d) { const xs = idxAll.map(function (i) { return dStat(i, d).x; }).filter(function (x) { return x !== null; }); return xs.length ? xs.reduce(function (a, b) { return a + b; }, 0) / xs.length : null; };
    const k = function (label, value, sub, t, key, extra) { return self.mkK(label, value, sub, t, key, extra); };
    const listBars = function (band) { return idxAll.filter(function (i) { return bandOf(st17[i].x) === band; }).map(function (i) { const x = st17[i].x; return { label: pad(i + 1, 2) + ' · ' + PRM[i][0], w: x === null ? 0 : Math.max(2, Math.round(x * 100)), v: x === null ? 'No data' : pct(x), c: BC[band] }; }); };
    const bandInfo = function (band, mode) { return { def: BL[band] + ' parameters in ' + scopeName + '. Bands are display bands, not official targets: Good ≥ 70%, Moderate 50–69%, Needs attention < 50%, No data yet = not reported.', calc: 'Completion % = numerator ÷ denominator for each parameter; parameters with no report are counted as No data, never as zero', drill: 'Season → district → parameter', bars: listBars(band), barsTitle: BL[band] + ' (' + cnt[band] + ')', rec: mode ? 'prep:' + mode : null }; };
    const SEh = SEASONS[sk] || SEASONS.all;
    const forecast = (function () {
      const open = new Date(2026, 9, 15), close = new Date(2027, 0, 31), now = new Date();
      const days = Math.ceil((open - now) / 86400000), left = Math.ceil((close - now) / 86400000);
      const proj = function (d) { const a = distAvg(d); return a === null ? null : Math.min(0.99, a + rr(d + 'pace', 0.008, 0.016) * Math.max(0, days)); };
      const pv = dn ? proj(dn) : (function () { const xs = scopeDistricts.map(function (d) { return proj(d.name); }).filter(function (x) { return x !== null; }); return xs.reduce(function (a, b) { return a + b; }, 0) / xs.length; })();
      const fmtD = function (d) { return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); };
      const bars = scopeDistricts.map(function (d) { return { name: d.name, v: { _p: proj(d.name) } }; }).filter(function (x) { return x.v._p !== null; }).sort(function (x, y) { return x.v._p - y.v._p; }).map(function (x) { const b = bandOf(x.v._p); return { label: x.name, w: Math.round(x.v._p * 100), v: pct(x.v._p), c: BC[b] }; });
      return k('Forecast window · Kharif 2026-27', days > 0 ? 'Opens in ' + days + ' days' : left > 0 ? 'Open · ' + left + ' days left' : 'Closed', fmtD(open) + ' – ' + fmtD(close) + ' · projected ' + pct(pv) + ' at opening', BT[bandOf(pv)], null, { def: 'Expected opening and closing of the coming season, and projected readiness on opening day if preparation continues at the current pace. Dates are placeholders until confirmed from the procurement calendar.', calc: 'Projected readiness = current readiness + current daily improvement × days to opening (capped at 99%)', drill: 'Season → district → parameter', bars: bars, barsTitle: 'Projected readiness at opening, least ready first at opening', rec: 'prep:att' });
    })();
    const prepChartRef = {};
    const page = { title: 'Preparedness', sub: '', isPrep: true, hasPrep: false, kpis: [
      k('Overall readiness', pct(avg), rep.length + ' of 17 parameters reported in ' + scopeName, BT[bandOf(avg)], 'prep'),
      k('Reporting coverage', pct(repCells / totCells), fmtN(repCells) + ' of ' + fmtN(totCells) + (dn ? ' parameters' : ' district-parameter reports') + ' received', repCells / totCells >= 0.95 ? 'good' : 'warn', null, { def: 'How much of the expected preparedness reporting has arrived. Missing reports show as No data, never as zero.', calc: dn ? 'Parameters reported ÷ 17' : 'District-parameter reports received ÷ (28 districts × 17 parameters)', drill: 'Season → district → parameter', bars: (dn ? [] : scopeDistricts.map(function (d) { const r = idxAll.filter(function (i) { return !prepNA(d.name, i); }).length; return { name: d.name, r: r }; }).filter(function (x) { return x.r < 17; }).map(function (x) { return { label: x.name, w: Math.round(x.r / 17 * 100), v: x.r + ' / 17', c: '#E0AE4F' }; })), barsTitle: 'Districts with missing reports', rec: 'prep:na' }),
      k('Good', cnt.good + ' / 17', '70% and above', 'good', null, bandInfo('good', 'good')),
      k('Moderate', cnt.mod + ' / 17', '50–69%', cnt.mod ? 'warn' : 'good', null, bandInfo('mod', 'mod')),
      k('Needs attention', cnt.att + ' / 17', 'below 50%', cnt.att ? 'bad' : 'good', null, bandInfo('att', 'att')),
      forecast
    ] };
    page.kpis[1]._info.tab = { f: function (d) { return { rep: idxAll.filter(function (i) { return !prepNA(d, i); }).length, exp: 17 }; }, cols: [['Reports received', 'rep', 'n'], ['Reports expected', 'exp', 'n']], res: ['Coverage', function (o) { return o.rep / (o.exp || 1); }, pct, function (x) { return x >= 0.95 ? 'good' : 'warn'; }] };
    if (stage !== 'all') { page.hasFilter = true; page.filter = STAGE_NAME[stage]; }
    /* ----- views ----- */
    const ui = { view: view, isOverview: view === 'overview', isCompare: view === 'compare', isRanking: view === 'ranking', isParam: view === 'param', isReports: view === 'reports', paramSel: String(pSel), distSel: dn || '', canDist: !isDM, scopeName: scopeName,
      views: [['overview', 'Executive overview'], ['compare', 'District ranking'], ['ranking', 'Ranking by parameter'], ['param', 'Parameter detail'], ['reports', 'Reports']].map(function (v) { const on = view === v[0]; return { label: v[1], on: on, cls: on ? 'on' : '', pick: function () { self.setState({ prepView: v[0], prepMandal: null, kpiOpen: null }); } }; }),
      sortBtns: [['asc', 'Lowest first'], ['desc', 'Highest first']].map(function (b) { const on = (s.prepSort || 'asc') === b[0]; return { label: b[1], on: on, cls: on ? 'on' : '', pick: function () { self.setState({ prepSort: b[0] }); } }; }),
      onParam: function (e) { const v = parseInt(e.target.value, 10); self.setState({ prepParam: isNaN(v) ? -1 : v, prepMandal: null, prepView: isNaN(v) || v < 0 ? self.state.prepView : (self.state.prepView === 'overview' ? 'param' : self.state.prepView) }); },
      onDist: function (e) { self.setState({ path: e.target.value ? [e.target.value] : [], prepMandal: null }); } };
    const openParam = function (i, d) { return function () { self.setState({ prepView: 'param', prepParam: i, prepMandal: null, path: d ? [d] : self.curPath().slice(0, 1), kpiOpen: null }); }; };
    const TXp = function (x, t) { return Object.assign(C(x, t || ''), { cls: 'txt' }); };
    const BTp = { good: 'good', mod: 'warn', att: 'bad', na: '' };
    /* popups: a parameter (by district or by mandal) and a district (all 17 parameters), without leaving the page */
    const paramPop = function (i, d) { return function () {
      let rows;
      if (d) { const dx = dStat(i, d); rows = dx.x === null ? [] : mandalsOf(d).map(function (m) { const den = PDEN[PRM[i][4]](m.v); const x = Math.min(1, Math.max(0, dx.x + rr(m.id + 'pm' + i, -0.15, 0.1))); const bb = bandOf(x); return { name: m.name, cells: [C(fmtU(i, den * x)), C(fmtU(i, den)), C(pct(x), BTp[bb]), TXp(BL[bb], BTp[bb])], drill: sitesPop(i, d, m) }; }).sort(function (a, b) { return parseFloat(a.cells[2].v) - parseFloat(b.cells[2].v); }); }
      else rows = scopeDistricts.map(function (dd) { const st = dStat(i, dd.name); const bb = bandOf(st.x); return { name: dd.name, cells: [C(st.x === null ? '—' : fmtU(i, st.num)), C(st.den === null ? '—' : fmtU(i, st.den)), C(st.x === null ? 'No data' : pct(st.x), BTp[bb]), TXp(BL[bb], BTp[bb])], drill: st.x === null ? null : paramPop(i, dd.name) }; });
      const st0 = d ? dStat(i, d) : stat(i); const b0 = bandOf(st0.x);
      self.tablePopup(pad(i + 1, 2) + ' · ' + PRM[i][0] + ' · ' + (d || 'Andhra Pradesh'), PRM[i][7] + (d ? (PRM[i][6] === 'mill' || PRM[i][6] === 'ppc' ? ' · click a mandal for its ' + (PRM[i][6] === 'mill' ? 'mills' : 'PPCs / RSKs') : ' · tracked at mandal level') : ' · click a district for its mandals'), [d ? 'Mandal' : 'District', 'Achieved', 'Out of', 'Readiness', 'Band'], rows, null, 'prep-' + pad(i + 1, 2), [], [{ k: 'Readiness', v: st0.x === null ? 'No data yet' : pct(st0.x) + ' · ' + BL[b0] }, { k: 'Measured as', v: PRM[i][2] + ' ÷ ' + PRM[i][3] }, { k: 'Owner', v: PRM[i][5] }, { k: 'Data freshness', v: st0.fresh || '—' }]);
    }; };
    const distPop = function (d) { return function () {
      const rows = idxAll.map(function (i) { const st = dStat(i, d); const bb = bandOf(st.x); return { name: pad(i + 1, 2) + ' · ' + PRM[i][0], cells: [C(st.x === null ? '—' : fmtU(i, st.num)), C(fmtU(i, st.den)), C(st.x === null ? 'No data' : pct(st.x), BTp[bb]), TXp(BL[bb], BTp[bb])], drill: st.x === null ? null : paramPop(i, d) }; });
      const ov = prepOverall(d);
      self.tablePopup(d + ' · readiness by parameter', 'Click a parameter for its mandals', ['Parameter', 'Achieved', 'Out of', 'Readiness', 'Band'], rows, null, 'prep-' + d, [{ label: 'Filter the dashboard to ' + d, go: function () { self.setState({ rxRec: null, path: [d], kpiOpen: null }); } }], [{ k: 'Overall readiness', v: ov === null ? 'No data' : pct(ov) }]);
    }; };
    /* overview */
    const riskIdx = rep.slice().sort(function (a, b) { return st17[a].x - st17[b].x; }).slice(0, 5);
    ui.topRisks = riskIdx.map(function (i) { const st = st17[i]; const b = bandOf(st.x); return { name: pad(i + 1, 2) + ' · ' + PRM[i][0], numden: fmtU(i, st.num) + ' of ' + fmtU(i, st.den), pctTxt: pct(st.x), bandCls: 'bchip ' + b, bandTxt: BL[b], fresh: st.fresh, tip: PRM[i][7], pick: paramPop(i, dn) }; });
    const dList = (dn ? mandalsOf(dn).map(function (m) { return { name: m.name, a: Math.min(0.99, Math.max(0, (distAvg(dn) || 0) + rr(m.id + 'ma', -0.12, 0.08))), id: m.id }; }) : scopeDistricts.map(function (d) { return { name: d.name, a: distAvg(d.name) }; }));
    ui.attnTitle = dn ? 'Mandals needing attention · ' + dn : 'Districts needing attention';
    ui.distAttn = dList.slice().sort(function (a, b) { return (a.a === null ? 2 : a.a) - (b.a === null ? 2 : b.a); }).slice(0, 5).map(function (o) {
      const weak = dn ? null : idxAll.map(function (i) { return [i, dStat(i, o.name).x]; }).filter(function (x) { return x[1] !== null; }).sort(function (a, b) { return a[1] - b[1]; })[0];
      const natt = dn ? '' : idxAll.filter(function (i) { const x = dStat(i, o.name).x; return x !== null && x < 0.5; }).length + ' need attention';
      const b = bandOf(o.a);
      const pl = (s.prepExp || {})[o.name] ? idxAll.map(function (i) { let x; if (!dn) x = dStat(i, o.name).x; else { const dx = dStat(i, dn).x; x = dx === null ? null : Math.min(1, Math.max(0, dx + rr(o.id + 'pm' + i, -0.15, 0.1))); } const bb = bandOf(x); return { name: pad(i + 1, 2) + ' · ' + PRM[i][0], x: x, bb: bb, pctTxt: x === null ? 'No data' : pct(x), w: x === null ? 0 : Math.round(x * 100), c: BC[bb], pick: function () { (dn ? (sitesPop(i, dn, mandalById(o.id)) || paramPop(i, dn)) : paramPop(i, o.name))(); } }; }).filter(function (q) { return q.bb === 'att'; }) : [];
      return { act: function () { self.openAct({ name: o.name, where: 'Preparedness · ' + (dn ? 'mandals needing attention · ' + dn : 'districts needing attention'), dn: dn || o.name, facts: [{ k: 'Overall readiness', v: (o.a === null ? 'No data' : pct(o.a)) + ' · ' + BL[bandOf(o.a)] }].concat(pl.slice().sort(function (a, b) { return a.x - b.x; }).slice(0, 5).map(function (q) { return { k: q.name, v: q.pctTxt + ' · Needs attention' }; })) }); }, name: o.name, pctTxt: o.a === null ? 'No data' : pct(o.a), bandCls: 'bchip ' + b, bandTxt: BL[b], meta: dn ? 'Mandal readiness (estimated from district reports)' : natt + (weak ? ' · weakest: ' + PRM[weak[0]][0] + ' ' + pct(weak[1]) : ''), open: !!(s.prepExp || {})[o.name], arrow: (s.prepExp || {})[o.name] ? '▾' : '▸', params: pl.slice().sort(function (a, b) { return a.x - b.x; }).slice(0, 5), hasP: pl.length > 0, noP: !pl.length, pnote: pl.length > 5 ? 'The 5 weakest of ' + pl.length + ' parameters below 50%' : pl.length + ' parameter' + (pl.length === 1 ? '' : 's') + ' below 50%', pick: function () { const e2 = Object.assign({}, self.state.prepExp || {}); e2[o.name] = !e2[o.name]; self.setState({ prepExp: e2 }); } };
    });
    { /* Readiness by parameter: one row per parameter, sortable */
      const RPN = ['e-Panta & e-KYC', 'RSK Clustering', 'Harvesting Date', "RSK's Self Declared", 'Mill Self Declaration', 'PPC Inspection', 'Mill Inspection', 'Moisture Calibration', 'Equipment', 'PSA Staff Appointed', 'PSA Tagged to PPCs', 'Custodian Officers', 'Vehicles Registered', 'Gunnies Positioned', 'e-BG In Force/Collected', 'PPCs Tagged to Mills', 'Mill Targets Allocated'];
      const RC = { good: '#16A34A', mod: '#E59E0B', att: '#E04848', na: '#94A3B8' };
      const asc = s.rpSort === 'asc'; const nrep = idxAll.filter(function (i) { return st17[i].x !== null; }).length; const ovA = prepOverall(dn);
      const seasL = (function () { const l = (s.seasons || []).filter(function (k) { return SEAS_NAME[k]; }); return l.length ? l.map(function (k) { return SEAS_NAME[k]; }).join(', ') : 'All seasons'; })();
      const rows = idxAll.map(function (i) { const st = st17[i]; const b = bandOf(st.x); return { i: i, x: st.x, name: RPN[i] || PRM[i][0], pctTxt: st.x === null ? 'NA' : Math.round(st.x * 100) + '%', w: st.x === null ? 0 : Math.max(st.x > 0 ? 1 : 0, Math.round(st.x * 100)), col: RC[b], dot: 'rpdot', vcls: 'rpv ' + b, tip: PRM[i][0] + ' · ' + (st.x === null ? 'No report received' : fmtU(i, st.num) + ' of ' + fmtU(i, st.den) + ' ' + PRM[i][3]) + ' · click to drill down', pick: paramPop(i, dn) }; });
      rows.sort(function (a, b) { if (a.x === null) return 1; if (b.x === null) return -1; return asc ? a.x - b.x : b.x - a.x; });
      ui.rp = { scope: (dn ? dn : 'All districts') + ' · ' + seasL + ' · ' + (asc ? 'Low → High' : 'High → Low'), overall: ovA === null ? 'NA' : Math.round(ovA * 100) + '%', reporting: nrep + ' of ' + PRM.length + ' reporting', rows: rows,
        hiCls: asc ? 'rps' : 'rps on', loCls: asc ? 'rps on' : 'rps', hi: function () { self.setState({ rpSort: 'desc' }); }, lo: function () { self.setState({ rpSort: 'asc' }); } };
    }
    ui.grid = idxAll.map(function (i) { const st = st17[i]; const b = bandOf(st.x); return { n: pad(i + 1, 2), name: PRM[i][0], numden: st.x === null ? 'No report received' : fmtU(i, st.num) + ' of ' + fmtU(i, st.den) + ' ' + PRM[i][3] + (!dn && st.rep < scopeDistricts.length ? ' (' + st.rep + ' of ' + scopeDistricts.length + ' districts reporting)' : ''), pctTxt: st.x === null ? 'No data' : pct(st.x), w: st.x === null ? 0 : Math.round(st.x * 100), c: BC[b], bandCls: 'bchip ' + b, bandTxt: BL[b], fresh: st.fresh, tip: PRM[i][7] + ' — Completion % = ' + PRM[i][2] + ' ÷ ' + PRM[i][3], extra: PEXTRA[i] ? PEXTRA[i](dn ? distVals(dn) : stateVals()) : '', hasExtra: !!PEXTRA[i], pick: paramPop(i, dn) }; });

    { /* readiness forecast: last three weeks, then at today's pace to the season opening and beyond */
      const open = new Date(2026, 9, 15); const days = Math.max(0, Math.ceil((open - new Date()) / 86400000)); const xEnd = Math.max(days + 21, 30);
      const dl = dn ? [dn] : scopeDistricts.map(function (d) { return d.name; });
      const cur = function (d) { return distAvg(d); }; const pace = function (d) { return rr(d + 'pace', 0.008, 0.016) * 0.6; };
      const at = function (d, t) { const a = cur(d); return a === null ? null : Math.max(0.05, Math.min(0.99, a + pace(d) * t)); };
      const avg = function (t) { const xs = dl.map(function (d) { return at(d, t); }).filter(function (x) { return x !== null; }); return xs.length ? xs.reduce(function (a, b) { return a + b; }, 0) / xs.length : 0; };
      const act = [], fc = [], band = [];
      for (let t = -21; t <= 0; t += 3) act.push([t, avg(t)]);
      for (let t = 0; t <= xEnd; t += 3) fc.push([t, avg(t)]);
      if (!dn) for (let t = -21; t <= xEnd; t += 3) { const xs = scopeDistricts.map(function (d) { return at(d.name, t); }).filter(function (x) { return x !== null; }); band.push([t, Math.min.apply(null, xs), Math.max.apply(null, xs)]); }
      const atOpen = avg(days); const hit = (function () { for (let t = 0; t <= 120; t++) if (avg(t) >= 0.8) return t; return null; })();
      page.prepChart = this.lineChart({ title: 'Readiness forecast · ' + (dn || 'Andhra Pradesh'), sub: 'Overall readiness over the last three weeks and projected at today’s pace' + (dn ? '' : '; the shaded band is the range across districts'), series: [{ k: 'act', pts: act }, { k: 'fc', pts: fc }], band: band, hline: { y: 0.8, label: 'On track (80%)' }, yMin: 0, yMax: 1, yFmt: function (x) { return Math.round(x * 100) + '%'; }, vlines: [{ x: 0, label: 'Today' }, { x: days, label: 'Season opens' }], xTicks: [-21, -14, -7, 0, 7, 14, 21, 28, 35, 42].filter(function (t) { return t <= xEnd; }).map(function (t) { return { x: t, label: t === 0 ? 'Today' : (t > 0 ? '+' : '') + t + ' d' }; }), marks: [{ x: days, y: atOpen, label: pct(atOpen) + ' at opening', cls: 'fc' }], legend: [{ cls: 'lg-act', label: 'Readiness so far' }, { cls: 'lg-fc', label: 'Forecast at current pace' }].concat(dn ? [] : [{ cls: 'lg-band', label: 'Range across districts' }]), note: hit === null ? 'At the current pace readiness does not reach 80% within four months.' : hit <= days ? 'At the current pace readiness reaches 80% in ' + hit + ' days, before the season opens.' : 'At the current pace readiness reaches 80% in ' + hit + ' days, ' + (hit - days) + ' days after the season opens.' });
    }
    /* comparison matrix */
    const cmpCols = [{ label: 'District', cls: 'th first', tip: '' }, { label: 'Overall', cls: 'th', tip: 'Average of reported parameters' }].concat(idxAll.map(function (i) { return { label: pad(i + 1, 2) + ' ' + PRM[i][1], cls: 'th cmph' + (pSel === i ? ' sel' : ''), tip: PRM[i][0] }; }));
    let cmpRows = scopeDistricts.map(function (d) { return { name: d.name, a: distAvg(d.name), cells: idxAll.map(function (i) { return dStat(i, d.name).x; }) }; });
    cmpRows.sort(sorter(function (r) { return pSel >= 0 ? r.cells[pSel] : r.a; }));
    ui.cmp = { cols: cmpCols, grid: 'minmax(170px, 1.4fr) 76px repeat(17, minmax(72px, 1fr))', sortNote: 'Sorted by ' + (pSel >= 0 ? pad(pSel + 1, 2) + ' · ' + PRM[pSel][0] : 'overall readiness') + ', ' + (asc ? 'lowest' : 'highest') + ' first · click a district or a value for its details',
      rows: cmpRows.map(function (r, ri) { const b = bandOf(r.a); return { name: r.name, sel: dn === r.name, nameCls: 'td first' + (dn === r.name ? ' rsel' : ''), pick: distPop(r.name), overall: { v: r.a === null ? 'No data' : Math.round(r.a * 100) + '%', cls: 'td hc ' + b }, cells: r.cells.map(function (x, i) { const bb = bandOf(x); return { v: x === null ? 'NA' : Math.round(x * 100) + '%', cls: 'hcell ' + bb + (pSel === i ? ' sel' : ''), tip: r.name + ' · ' + PRM[i][0] + ': ' + (x === null ? 'No data yet' : pct(x) + ' (' + BL[bb] + ')'), pick: paramPop(i, r.name) }; }) }; }) };
    /* district ranking on all parameters (rank matrix) and ranking by parameter (cards) */
    {
      const RSH = ['e-KYC', 'RSK cluster', 'Harvest date', 'RSK self decl.', 'Mill self decl.', 'PPC insp.', 'Mill insp.', 'Moisture calib.', 'Equip-ment', 'PSA staff', 'PSA tagged', 'Custo-dians', 'Vehi-cles', 'Gun-nies', 'e-BG', 'PPC–mill tag', 'Mill targets'];
      const RFN = ['e-Panta & e-KYC', 'RSK Clustering', 'Harvesting Date', 'RSK Self Declaration', 'Mill Self Declaration', 'PPC Inspection', 'Mill Inspection', 'Moisture Calibration', 'Equipment', 'PSA Staff Appointed', 'PSA Tagged to PPCs', 'Custodian Officers', 'Vehicles Registered', 'Gunnies Positioned', 'e-BG In Force / Collected', 'PPCs Tagged to Mills', 'Mill Targets Allocated'];
      const BND = function (x) { return x === null ? 'na' : x >= 0.7 ? 'g' : x >= 0.5 ? 'm' : 'b'; };
      const seasL = (function () { const l = (s.seasons || []).filter(function (k) { return SEAS_NAME[k]; }); return l.length ? l.map(function (k) { return SEAS_NAME[k]; }).join(', ') : 'All seasons'; })();
      const rankBy = function (list, val) { const v = list.map(function (r) { return { n: r.name, x: val(r) }; }).filter(function (o) { return o.x !== null; }).sort(function (a, b) { return b.x - a.x; }); const m = {}; if (v.length && Math.abs(v[0].x - v[v.length - 1].x) < 1e-9) { v.forEach(function (o) { m[o.n] = '='; }); m._all = true; return m; } v.forEach(function (o, i) { m[o.n] = i > 0 && Math.abs(o.x - v[i - 1].x) < 1e-9 ? m[v[i - 1].n] : i + 1; }); m._n = v.length; return m; };
      const out = scopeDistricts.map(function (d) { const st = idxAll.map(function (i) { return dStat(i, d.name); }); const xs = st.map(function (q) { return q.x; }).filter(function (x) { return x !== null; }); return { name: d.name, st: st, score: xs.length ? xs.reduce(function (a, b) { return a + b; }, 0) / xs.length : null, n: xs.length }; });
      const ranks = { score: rankBy(out, function (o) { return o.score; }) }; idxAll.forEach(function (i) { ranks[i] = rankBy(out, function (o) { return o.st[i].x; }); });
      const stateP = idxAll.map(function (i) { return prepStat(i, null); });
      const key = s.rkSort === undefined || s.rkSort === null ? 'score' : s.rkSort; const rk = ranks[key] || ranks.score;
      const num = function (v) { return v === '=' ? 0 : v; };
      const list = out.slice().sort(function (a, b) { const ra = num(rk[a.name]), rb = num(rk[b.name]); if (ra === undefined && rb === undefined) return 0; if (ra === undefined) return 1; if (rb === undefined) return -1; return ra - rb; });
      const scored = out.filter(function (o) { return o.score !== null; }); const top = scored.slice().sort(function (a, b) { return b.score - a.score; })[0]; const avg = scored.reduce(function (a, o) { return a + o.score; }, 0) / (scored.length || 1); const N = scored.length;
      const pcell = function (x) { return x === null ? 'NA' : Math.round(x * 100) + '%'; };
      const profile = function (o) { return function () { const T = function (x, t) { return Object.assign(C(x, t || ''), { cls: 'txt' }); };
        self.tablePopup(o.name, 'Overall score ' + pcell(o.score) + ' · rank ' + (ranks.score[o.name] || '—') + ' of ' + N + ' · ' + seasL, ['Parameter', 'Achieved', 'Target', '%', 'Rank'], idxAll.map(function (i) { const q = o.st[i]; const r = ranks[i][o.name]; return { name: RFN[i], cells: [C(q.x === null ? '—' : fmtU(i, q.num)), C(q.x === null ? '—' : fmtU(i, q.den)), C(pcell(q.x), q.x === null ? '' : q.x >= 0.7 ? 'good' : q.x >= 0.5 ? 'warn' : 'bad'), C(r === '=' ? 'all equal' : r ? r + ' / ' + ranks[i]._n : '—')], drill: q.x === null ? null : paramPop(i, o.name) }; }), null, 'ranking-' + o.name); }; };
      const zero = idxAll.filter(function (i) { return stateP[i].x !== null && stateP[i].x < 0.005; }).map(function (i) { return RFN[i]; });
      ui.rk = { eyebrow: seasL + ' · District ranking on all parameters', head: top ? top.name + ' leads overall at ' + (top.score * 100).toFixed(1) + (isDM ? '%; district average ' : '%; state average ') + (avg * 100).toFixed(1) + '%' : 'No district has reported yet',
        sortedName: key === 'score' ? 'Overall score' : RFN[key],
        kpis: [3, 4, 5, 6, 7, 12, 14].map(function (i) { return { v: pcell(stateP[i].x), l: RFN[i] + (isDM ? ' (district)' : ' (state)') }; }),
        cols: [{ label: 'Overall score', cls: 'rkth s3' + (key === 'score' ? ' sorted' : ''), tip: 'Rank by overall score', pick: function () { self.setState({ rkSort: 'score' }); } }].concat(idxAll.map(function (i) { return { label: RSH[i], cls: 'rkth' + (key === i ? ' sorted' : ''), tip: RFN[i] + ' — click to rank by this', pick: function () { self.setState({ rkSort: i }); } }; })),
        rows: list.map(function (o) { const rs = ranks.score[o.name]; return { rank: rk[o.name] === undefined ? '–' : rk[o.name], name: o.name + (o.n < PRM.length ? ' *' : ''), cls: 'rkrow' + (rs && rs <= 3 ? ' top' : rs && N && rs > N - 3 ? ' bot' : '') + (dn === o.name ? ' sel' : ''), score: o.score === null ? 'NA' : (o.score * 100).toFixed(1) + '%', srank: rs ? 'rank ' + rs : '', pick: profile(o),
          cells: idxAll.map(function (i) { const x = o.st[i].x; const r = ranks[i][o.name]; return { v: pcell(x), sub: r === '=' ? '= all' : r ? '#' + r : '—', cls: 'rkc ' + BND(x) }; }) }; }),
        state: { score: (avg * 100).toFixed(1) + '%', cells: idxAll.map(function (i) { return { v: pcell(stateP[i].x), cls: 'rkc ' + BND(stateP[i].x) }; }) },
        note: 'Overall score = simple average of completion % across the parameters that have data; parameters a district has not reported (NA) are left out of its average (*). Ties share a rank. Top three rows are shaded blue, bottom three red. Colours: green ≥70% · amber 50–69% · red <50% · grey NA.' + (zero.length ? (isDM ? ' At 0% in this district: ' : ' At 0% statewide: ') + zero.join(', ') + '.' : '') };
      const rkPick = (s.rkParams || []).filter(function (i) { return i >= 0 && i < PRM.length; });
      ui.rkSel = { open: !!s.rkOpen, label: rkPick.length ? rkPick.length + ' of ' + PRM.length + ' parameters' : 'All ' + PRM.length + ' parameters', toggle: function () { self.setState({ rkOpen: !self.state.rkOpen }); }, close: function () { self.setState({ rkOpen: false }); },
        all: function () { self.setState({ rkParams: [] }); }, hasChips: rkPick.length > 0, chips: rkPick.map(function (i) { return { label: RFN[i], rm: function () { self.setState({ rkParams: (self.state.rkParams || []).filter(function (x) { return x !== i; }) }); } }; }),
        opts: idxAll.map(function (i) { const on = rkPick.indexOf(i) >= 0; return { name: RFN[i], on: on, mark: on ? '✓' : '', cls: 'mso' + (on ? ' on' : ''), pick: function () { const l = (self.state.rkParams || []).slice(); const j = l.indexOf(i); if (j >= 0) l.splice(j, 1); else l.push(i); l.sort(function (a, b) { return a - b; }); self.setState({ rkParams: l }); } }; }) };
      ui.rkc = (rkPick.length ? rkPick : idxAll).map(function (i) { const r = ranks[i]; const rows = out.slice().sort(function (a, b) { const ra = r[a.name] === '=' ? 0 : r[a.name], rb = r[b.name] === '=' ? 0 : r[b.name]; if (ra === undefined && rb === undefined) return 0; if (ra === undefined) return 1; if (rb === undefined) return -1; return ra - rb; });
        const sp = stateP[i]; const has = rows.some(function (o) { return o.st[i].x !== null; });
        return { title: RFN[i], state: (isDM ? s.dm + ' ' : 'State ') + pcell(sp.x) + (sp.x === null ? '' : ' · ' + fmtU(i, sp.num)), has: has, none: !has, pick: paramPop(i, null),
          rows: rows.map(function (o) { const q = o.st[i]; const b = BND(q.x); return { rank: r[o.name] === '=' ? '=' : (r[o.name] || '–'), name: o.name, w: q.x === null ? 0 : Math.max(2, Math.round(q.x * 100)), bcls: 'rkbar ' + b, pct: pcell(q.x), num: q.x === null ? 'NA' : fmtU(i, q.num), pick: q.x === null ? function () {} : paramPop(i, o.name) }; }) }; });
    }
    const T3p = function (x, t) { return Object.assign(C(x, t || ''), { cls: 'txt' }); };
    /* popups that drill every preparedness figure down to the PPC / mill record */
    const mxOf = function (i, d, m) { const dx = dStat(i, d).x; return dx === null ? null : Math.min(1, Math.max(0, dx + rr(m.id + 'pm' + i, -0.15, 0.1))); };
    const sitePop = function (e, dnn) { return function () {
      const ut = e.id.indexOf('|cmr|') >= 0 ? 'mill' : 'ppc'; const PI = idxAll.filter(function (i) { return PRM[i][6] === ut; });
      const m = mandalById(e.mid);
      const facts = PI.map(function (i) { const x = m ? mxOf(i, dnn, m) : null; return { k: pad(i + 1, 2) + ' · ' + PRM[i][0], v: x === null ? 'No report' : (R(e.id + 'pp' + i) < x ? 'Done' : 'Pending') + ' · owner ' + PRM[i][5] }; }).concat(mstFacts(e));
      self.setState({ rxRec: { back: self.state.rxRec || null, title: e.name, sub: (ut === 'mill' ? 'Rice mill' : 'PPC / RSK') + ' · ' + LBL[e.mid] + ', ' + dnn + ' · preparedness by parameter', facts: facts, steps: [], links: [] } });
    }; };
    const sitesPop = function (i, dnn, m) { const ut = PRM[i][6]; const x = mxOf(i, dnn, m); if (x === null) return null;
      if (ut !== 'mill' && ut !== 'ppc') return function () { const den = PDEN[PRM[i][4]](m.v); const bb = bandOf(x); self.setState({ rxRec: { back: self.state.rxRec || null, title: pad(i + 1, 2) + ' · ' + PRM[i][0] + ' · ' + m.name, sub: 'Mandal record · ' + dnn + ' · this parameter is tracked per mandal, not per PPC or mill', facts: [{ k: PRM[i][2], v: fmtU(i, den * x) }, { k: PRM[i][3], v: fmtU(i, den) }, { k: 'Completion', v: pct(x) }, { k: 'Band', v: BL[bb] }, { k: 'Owner', v: PRM[i][5] }, { k: 'Measured as', v: PRM[i][2] + ' ÷ ' + PRM[i][3] }, { k: 'Mandal', v: m.name + ', ' + dnn }], steps: [], links: [] } }); }; const ents = entsOf(m.id, ut === 'mill' ? 'cmr' : 'proc'); if (!ents.length) return null;
      return function () { const rs = ents.map(function (e) { return { e: e, done: R(e.id + 'pp' + i) < x }; }).sort(function (a, b) { return (a.done ? 1 : 0) - (b.done ? 1 : 0); });
        self.tablePopup(pad(i + 1, 2) + ' · ' + PRM[i][0] + ' · ' + m.name + ', ' + dnn, rs.filter(function (o) { return !o.done; }).length + ' pending of ' + rs.length + ' · click one for its record', [ut === 'mill' ? 'Rice mill' : 'PPC / RSK', 'Status', 'Owner'], rs.map(function (o) { return { name: o.e.name, cells: [T3p(o.done ? 'Done' : 'Pending', o.done ? 'good' : 'bad'), T3p(PRM[i][5])], drill: sitePop(o.e, dnn) }; }), null, 'prep-' + i + '-' + m.name); }; };
    const mandalsPop = function (i, dnn) { return function () { const dst = dStat(i, dnn);
      const rows = dst.x === null ? [] : mandalsOf(dnn).map(function (m) { const den = PDEN[PRM[i][4]](m.v); const x = mxOf(i, dnn, m); return { m: m, den: den, x: x }; }).sort(function (a, b) { return a.x - b.x; }).map(function (o) { const bb = bandOf(o.x); return { name: o.m.name, cells: [C(fmtU(i, o.den * o.x)), C(fmtU(i, o.den)), C(pct(o.x), BT[bb]), T3p(BL[bb], BT[bb])], drill: sitesPop(i, dnn, o.m) }; });
      self.tablePopup(pad(i + 1, 2) + ' · ' + PRM[i][0] + ' · ' + dnn + ' · by mandal', dst.x === null ? 'No report received from ' + dnn + ' for this parameter' : 'Weakest first · click a mandal for its ' + (PRM[i][6] === 'mill' ? 'mills' : PRM[i][6] === 'ppc' ? 'PPCs / RSKs' : 'figures'), ['Mandal', PRM[i][2], PRM[i][3], 'Completion', 'Band'], rows, null, 'prep-' + i + '-' + dnn); }; };
    const distParamsPop = function (dnn) { return function () {
      self.tablePopup('Preparedness · ' + dnn + ' · all 17 parameters', 'Achieved against target from the preparedness snapshot · click a parameter for its mandals, then PPCs / mills', ['Parameter', 'Achieved', 'Target', 'Completion', 'Band', 'Owner'], idxAll.map(function (i) { const st2 = dStat(i, dnn); const bb = bandOf(st2.x); return { name: pad(i + 1, 2) + ' · ' + PRM[i][0], cells: [C(st2.x === null ? '—' : fmtU(i, st2.num)), C(st2.den === null ? '—' : fmtU(i, st2.den)), C(st2.x === null ? 'No data' : pct(st2.x), BT[bb]), T3p(BL[bb], BT[bb]), T3p(PRM[i][5])], drill: st2.x === null ? null : mandalsPop(i, dnn) }; }), null, 'prep-' + dnn); }; };
    const mandalParamsPop = function (dnn, m) { return function () {
      self.tablePopup('Preparedness · ' + m.name + ', ' + dnn + ' · all 17 parameters', 'Mandal figures are estimated from the district report · click a parameter for its PPCs / mills', ['Parameter', 'Completion', 'Band', 'Owner'], idxAll.map(function (i) { const x = mxOf(i, dnn, m); const bb = bandOf(x); return { name: pad(i + 1, 2) + ' · ' + PRM[i][0], cells: [C(x === null ? 'No data' : pct(x), BT[bb]), T3p(BL[bb], BT[bb]), T3p(PRM[i][5])], drill: x === null ? null : sitesPop(i, dnn, m) }; }), null, 'prep-' + m.name); }; };
    this._prepPops = { site: sitePop, sites: sitesPop, mandals: mandalsPop, dist: distParamsPop, param: paramPop, mandal: mandalParamsPop };
    /* parameter detail */
    ui.hasParam = pSel >= 0; ui.noParam = pSel < 0;
    ui.paramChips = idxAll.map(function (i) { return { label: pad(i + 1, 2) + ' · ' + PRM[i][0], pick: openParam(i, dn) }; });
    if (pSel >= 0) {
      const i = pSel; const st = stat(i); const b = bandOf(st.x);
      ui.p = { title: pad(i + 1, 2) + ' · ' + PRM[i][0], def: PRM[i][7], numLabel: PRM[i][2], denLabel: PRM[i][3], owner: PRM[i][5], num: st.x === null ? 'No data' : fmtU(i, st.num), den: fmtU(i, st.den), pctTxt: st.x === null ? 'No data' : pct(st.x), bandCls: 'bchip ' + b, bandTxt: BL[b], fresh: st.fresh, extra: PEXTRA[i] ? PEXTRA[i](dn ? distVals(dn) : stateVals()) : '', hasExtra: !!PEXTRA[i], coverage: dn ? '' : st.rep + ' of ' + scopeDistricts.length + ' districts reported', formula: 'Completion % = ' + PRM[i][2] + ' ÷ ' + PRM[i][3] + ' × 100', equip: i === 8 ? 'Required set: moisture meter, analysis kit, husk remover, pokers, plates, sieve, sample bags, weighing scale' : '', hasEquip: i === 8 };
      ui.p.facts = [{ k: 'Numerator · ' + ui.p.numLabel, v: ui.p.num }, { k: 'Denominator · ' + ui.p.denLabel, v: ui.p.den }, { k: 'Completion', v: ui.p.pctTxt }, { k: 'Data freshness', v: ui.p.fresh }, { k: 'Owner', v: ui.p.owner }].concat(ui.p.coverage ? [{ k: 'Reporting', v: ui.p.coverage }] : []);
      const unitType = PRM[i][6]; const mid = s.prepMandal;
      let labels, rows, lvl;
      if (!dn) {
        lvl = 'District comparison';
        labels = ['District', PRM[i][2], PRM[i][3], 'Completion', 'Band', 'Data freshness'];
        rows = scopeDistricts.map(function (d) { return { d: d.name, st: dStat(i, d.name) }; }).sort(sorter(function (o) { return o.st.x; })).map(function (o) { const bb = bandOf(o.st.x); return { name: o.d, cells: [C(o.st.x === null ? '—' : fmtU(i, o.st.num)), C(fmtU(i, o.st.den)), C(o.st.x === null ? 'No data' : pct(o.st.x), BT[bb]), Object.assign(C(BL[bb], BT[bb]), { cls: 'txt' }), Object.assign(C(o.st.fresh, o.st.stale ? 'warn' : ''), { cls: 'txt' })], drill: o.st.x === null ? null : paramPop(i, o.d) }; });
      } else if (!mid || unitType === 'none') {
        lvl = 'Mandal comparison · ' + dn;
        const dst = dStat(i, dn);
        labels = ['Mandal', PRM[i][2], PRM[i][3], 'Completion', 'Band'];
        rows = dst.x === null ? [] : mandalsOf(dn).map(function (m) { const den = PDEN[PRM[i][4]](m.v); const x = Math.min(1, Math.max(0, dst.x + rr(m.id + 'pm' + i, -0.15, 0.1))); return { m: m, den: den, x: x }; }).sort(sorter(function (o) { return o.x; })).map(function (o) { const bb = bandOf(o.x); return { name: o.m.name, cells: [C(fmtU(i, o.den * o.x)), C(fmtU(i, o.den)), C(pct(o.x), BT[bb]), Object.assign(C(BL[bb], BT[bb]), { cls: 'txt' })], drill: sitesPop(i, dn, o.m) }; });
        if (dst.x === null) lvl += ' — No report received for this parameter';
      } else {
        const m = mandalById(mid); const dst = dStat(i, dn); const x = Math.min(1, Math.max(0, dst.x + rr(m.id + 'pm' + i, -0.15, 0.1)));
        const ents = entsOf(mid, unitType === 'mill' ? 'cmr' : 'proc');
        lvl = (unitType === 'mill' ? 'Mill' : 'PPC / RSK') + ' records · ' + m.name;
        labels = [unitType === 'mill' ? 'Rice mill' : 'PPC / RSK', 'Status', 'Owner'];
        rows = ents.map(function (e) { return { e: e, done: R(e.id + 'pp' + i) < x }; }).sort(function (a, b) { return asc ? (a.done ? 1 : 0) - (b.done ? 1 : 0) : (b.done ? 1 : 0) - (a.done ? 1 : 0); }).map(function (o) { return { name: o.e.name, cells: [Object.assign(C(o.done ? 'Done' : 'Pending', o.done ? 'good' : 'bad'), { cls: 'txt' }), T(PRM[i][5])], drill: sitePop(o.e, dn) }; });
      }
      ui.pTable = this.table(lvl, (dn ? 'Click a ' + (mid ? 'record to open it' : 'mandal for ' + (unitType === 'mill' ? 'mill' : unitType === 'ppc' ? 'PPC / RSK' : 'unit') + ' records') : 'Click a district to drill down'), labels, rows, null, null, 'preparedness-' + PRM[i][0]);
      ui.pCrumbs = ([{ label: 'Andhra Pradesh', go: function () { self.setState({ path: isDM ? [s.dm] : [], prepMandal: null }); }, dis: !dn || isDM }].concat(dn ? [{ label: dn, go: function () { self.setState({ prepMandal: null }); }, dis: !mid }] : []).concat(mid ? [{ label: LBL[mid], go: function () {}, dis: true }] : [])).map(function (c, i) { c.sep = i > 0; return c; });
    } else { ui.p = { facts: [], title: '', def: '', numLabel: '', denLabel: '', owner: '', num: '', den: '', pctTxt: '', bandCls: '', bandTxt: '', fresh: '', extra: '', hasExtra: false, coverage: '', formula: '', equip: '', hasEquip: false }; ui.pTable = null; ui.pCrumbs = []; }
    /* reports */
    const rpt = s.prepRpt || 'dist';
    ui.rptBtns = [['dist', 'District-wise'], ['rsk', 'RSK-wise'], ['mill', 'Mill-wise']].map(function (b) { const on = rpt === b[0]; return { label: b[1], on: on, cls: on ? 'on' : '', pick: function () { self.setState({ prepRpt: b[0] }); } }; });
    ui.rptNeedDist = rpt !== 'dist' && !dn;
    if (rpt === 'dist') {
      let rs = scopeDistricts.map(function (d) { const a = distAvg(d.name); const c2 = { good: 0, mod: 0, att: 0, na: 0 }; idxAll.forEach(function (i) { c2[bandOf(dStat(i, d.name).x)]++; }); return { d: d.name, a: a, c: c2 }; });
      rs.sort(sorter(function (r) { return r.a; }));
      ui.rpt = this.table('District-wise preparedness report', 'All 28 districts · ' + (asc ? 'lowest' : 'highest') + ' readiness first · export opens in Excel', ['District', 'Overall readiness', 'Good', 'Moderate', 'Needs attention', 'No data yet'].concat(idxAll.map(function (i) { return pad(i + 1, 2) + ' ' + PRM[i][1]; })), rs.map(function (r) { return { name: r.d, cells: [C(r.a === null ? 'No data' : pct(r.a), BT[bandOf(r.a)]), C(r.c.good), C(r.c.mod), C(r.c.att, r.c.att ? 'bad' : ''), C(r.c.na, r.c.na ? 'warn' : '')].concat(idxAll.map(function (i) { const x = dStat(i, r.d).x; return C(x === null ? 'NA' : pct(x), BT[bandOf(x)]); })), drill: distParamsPop(r.d) }; }), null, null, 'preparedness-district-wise');
    } else if (dn) {
      const unit = rpt === 'rsk' ? 'ppc' : 'mill'; const PIDX = idxAll.filter(function (i) { return PRM[i][6] === unit; });
      let ents = entsOfDistrict(dn, rpt === 'rsk' ? 'proc' : 'cmr'); if (s.prepMandal) ents = ents.filter(function (e) { return e.mid === s.prepMandal; });
      const mx = {}; const xOf = function (e, i) { const key = e.mid + i; if (!(key in mx)) { const dx = dStat(i, dn).x; mx[key] = dx === null ? null : Math.min(1, Math.max(0, dx + rr(e.mid + 'pm' + i, -0.15, 0.1))); } return mx[key]; };
      const rs = ents.slice(0, 120).map(function (e) { const vals = PIDX.map(function (i) { const x = xOf(e, i); return x === null ? null : (R(e.id + 'pp' + i) < x ? 1 : 0); }); const done = vals.filter(function (v) { return v === 1; }).length, repd = vals.filter(function (v) { return v !== null; }).length; return { e: e, vals: vals, sc: repd ? done / repd : null, done: done, repd: repd }; });
      rs.sort(sorter(function (r) { return r.sc; }));
      ui.rpt = this.table((rpt === 'rsk' ? 'RSK / PPC-wise' : 'Mill-wise') + ' preparedness report · ' + dn + (s.prepMandal ? ' · ' + LBL[s.prepMandal] : ''), rs.length + ' ' + (rpt === 'rsk' ? 'PPCs' : 'mills') + ' · Done / Pending per applicable parameter · export opens in Excel', [rpt === 'rsk' ? 'PPC / RSK' : 'Rice mill', 'Mandal', 'Readiness'].concat(PIDX.map(function (i) { return pad(i + 1, 2) + ' ' + PRM[i][1]; })), rs.map(function (r) { return { name: r.e.name, cells: [T(LBL[r.e.mid]), C(r.sc === null ? 'No data' : r.done + ' / ' + r.repd, BT[bandOf(r.sc)])].concat(r.vals.map(function (v) { return Object.assign(C(v === null ? 'NA' : v ? 'Done' : 'Pending', v === null ? '' : v ? 'good' : 'bad'), { cls: 'txt' }); })), drill: sitePop(r.e, dn) }; }), null, null, 'preparedness-' + (rpt === 'rsk' ? 'rsk' : 'mill') + '-wise-' + dn);
    } else ui.rpt = null;
    ui.hasRpt = !!ui.rpt;
    if (!ui.rpt) ui.rpt = { title: '', note: '', cols: [], rows: [], grid: '1fr', download: function () {} };
    if (!ui.pTable) ui.pTable = { title: '', note: '', cols: [], rows: [], grid: '1fr', download: function () {} };
    page.prepUI = ui;
    return page;
  }

  buildGlance(path, type) {
    const self = this; const g = GLANCE[type]; const et = g.et; const depth = path.length;
    const v = depth ? distVals(path[0]) : stateVals();
    const KK = { rsk: ['rsk', 'proc', 'farmers', 'moist'], mill: ['mills', 'cmr', 'cmrShort', 'millAnom'], godown: ['godowns', 'stor', 'aged', 'cctv'], mls: ['mls', 's2', 's2lift', 'trips'], fps: ['fps', 'fps', 's2', 'cctv'] };
    const page = { title: g.title, sub: 'Every ' + g.label.replace(/s$/, '').toLowerCase() + ' with its key numbers · click to drill to records', kpis: this.kpiList(KK[type].slice(0, type === 'fps' ? 3 : 4), v) };
    if (type === 'fps') page.kpis[0] = self.mkK('Fair price shops', fmtN(v.fps), fmtN(v.cards) + ' ration cards', '', null, { def: 'Fair price shops serving ration-card holders.', calc: 'Count of FPS; ration cards attached', drill: 'District → mandal → FPS', rec: 'fps', field: 'fps', fmt: 'n', dir: -1 });
    const tcols = COLS[et]; const cc = COUNT_COL[et]; const ex = EXTRA[et]; const sortK = SORT[et];
    if (depth === 0) {
      const rows = D.map(function (d) { return { id: d.name, name: d.name, v: distVals(d.name) }; }).map(function (x) { return { name: x.name, cells: [C(fmtN(x.v[cc[1]]))].concat(tcols.map(function (c) { return c[1](x.v); })), drill: function () { self.drill(x.id); } }; });
      page.hasTable = true; page.table = this.table('District-wise view', 'Click a district to list its ' + g.label.toLowerCase(), ['District', cc[0]].concat(tcols.map(function (c) { return c[0]; })), rows, [C(fmtN(v[cc[1]]))].concat(tcols.map(function (c) { return c[1](v); })), 'Andhra Pradesh', type + '-by-district');
    } else if (depth === 1) {
      const list = entsOfDistrict(path[0], et).slice();
      const rows = list.slice(0, 40).map(function (e) { return { name: e.name, cells: [Object.assign(C(LBL[e.mid]), { cls: 'txt' })].concat(tcols.map(function (c) { return c[1](e.v); })).concat([ex[1](e)]), drill: function () { self.drill(e.id); } }; });
      page.hasTable = true; page.table = this.table(g.label + ' · ' + path[0], 'Showing ' + Math.min(40, list.length) + ' of ' + list.length, [g.label.replace(/s$/, ''), 'Mandal'].concat(tcols.map(function (c) { return c[0]; })).concat([ex[0]]), rows, null, null, type + '-' + path[0]);
    } else if (depth === 2) {
      entsOfDistrict(path[0], et);
      const e = ENT[path[1]]; const tx = txnsOf(path[1]);
      page.kpis = this.kpiList(KK[type].slice(1, 4), e ? e.v : v);
      let labels, rows;
      if (et === 'fps') { labels = ['Day', 'Cards served', 'Quantity (kg)', 'Authentication', 'Status']; rows = tx.map(function (t) { return { name: t.name, cells: [C(fmtN(t.cards)), C(fmtN(t.qty)), Object.assign(C(t.auth), { cls: 'txt' }), Object.assign(C(t.status, t.status === 'Closed' ? 'good' : 'warn'), { cls: 'txt' })], drill: function () { self.drill(t.id); } }; }); }
      else { const sub = this.buildStageLike(et, [path[0], e.mid, e.id], 'all', 'proc'); page.hasTable = true; page.table = sub.table; return page; }
      page.hasTable = true; page.table = this.table('Records · ' + (e ? e.name : ''), 'Latest records · click for detail', labels, rows, null, null, e ? e.name : 'records');
    } else {
      entsOfDistrict(path[0], et); txnsOf(path[1]);
      page.hasDetail = true; page.detail = this.txDetail(TX[path[2]]);
    }
    return page;
  }

  /* ---------- pivot ---------- */
  moveField(f, zone) {
    const s = this.state; if (!f) return;
    const rows = s.pvRows.filter(function (x) { return x !== f; }), cols = s.pvCols.filter(function (x) { return x !== f; }), fl = s.pvF.filter(function (x) { return x !== f; });
    if (zone === 'rows') rows.push(f); else if (zone === 'cols') { cols.push(f); while (cols.length > 2) cols.shift(); } else if (zone === 'filters') fl.push(f);
    const fv = Object.assign({}, s.pvFV); if (zone !== 'filters' && fl.indexOf(f) < 0) delete fv[f];
    this.setState({ pvRows: rows, pvCols: cols, pvF: fl, pvFV: fv, pvPick: null, pvExp: {}, pvSel: null, pvOpenF: zone === 'filters' ? f : s.pvOpenF === f ? null : s.pvOpenF, pvMsg: '' });
  }
  buildPivot() {
    const self = this; const s = this.state; const ds = s.pvData;
    const fields = PV_FIELDS[ds]; const meas = PV_MEAS[ds];
    const rowsF = s.pvRows.filter(function (f) { return fields.indexOf(f) >= 0; });
    const colsF = s.pvCols.filter(function (f) { return fields.indexOf(f) >= 0; });
    const filtF = s.pvF.filter(function (f) { return fields.indexOf(f) >= 0; });
    const valsOn = meas.filter(function (m) { return s.pvVals.indexOf(m.k) >= 0; });
    const vm = valsOn.length ? valsOn : [meas[0]];
    /* records after the dashboard filters above */
    let base = ds === 'inc' ? incFacts() : PVX[ds] ? PVX[ds].facts() : procFacts();
    const gD = s.role === 'dm' ? s.dm : s.pvDist || this.curPath()[0] || null; const notes = [];
    if (gD) { base = base.filter(function (r) { return r.District === gD; }); notes.push(gD); }
    if (ds === 'inc' && s.stage !== 'all' && CATN[s.stage]) { base = base.filter(function (r) { return r.Category === CATN[s.stage]; }); notes.push(CATN[s.stage]); }
    let recs = base;
    filtF.forEach(function (f) { const vs = s.pvFV[f]; if (vs && vs.length) recs = recs.filter(function (r) { return vs.indexOf(r[f]) >= 0; }); });
    const fmtM = function (m, x) { return x === null || x === undefined || isNaN(x) ? '—' : fmtN(x, m.d) + (m.u || ''); };
    const colKey = function (r) { return colsF.map(function (f) { return r[f]; }).join(' · '); };
    let colKeys = [null];
    if (colsF.length) {
      const seen = {}; recs.forEach(function (r) { seen[colKey(r)] = 1; });
      const keys = Object.keys(seen);
      const ord = colsF.length === 1 ? pvOrder(colsF[0], keys) : keys.sort();
      colKeys = ord.slice(0, 14);
    }
    const uniq = function (list, f) { const u = {}; list.forEach(function (r) { u[r[f]] = 1; }); return pvOrder(f, Object.keys(u)); };
    /* tree */
    const allKeys = [];
    const body = []; let zi = 0;
    const makeCells = function (list, conds, label) {
      const cells = [];
      const mk = function (sub, ck, m, tot) {
        const a = pvAgg(ds, sub); const x = a[m.k]; const v = fmtM(m, x); const can = v !== '—' && sub.length > 0;
        const isSel = s.pvSel && s.pvSel.key === JSON.stringify([conds, ck, m.k]);
        return { v: v, can: can, dash: !can, cls: 'td' + (tot ? ' tot' : ''), bcls: 'cellbtn' + (isSel ? ' sel' : ''), pick: function () { self.setState({ pvSel: { key: JSON.stringify([conds, ck, m.k]), conds: conds, ck: ck, title: label + (ck ? ' · ' + ck : '') + ' · ' + m.label + ' (' + v + ')' } }); } };
      };
      colKeys.forEach(function (ck) { const sub = ck === null ? list : list.filter(function (r) { return colKey(r) === ck; }); vm.forEach(function (m) { cells.push(mk(sub, ck, m, false)); }); });
      if (colsF.length) vm.forEach(function (m) { cells.push(mk(list, null, m, true)); });
      return cells;
    };
    const walk = function (list, level, conds, prefix) {
      const f = rowsF[level]; let vals = uniq(list, f);
      const groups = vals.map(function (val) { return { val: val, list: list.filter(function (r) { return r[f] === val; }) }; });
      if (!NATURAL[f]) groups.sort(function (a, b) { const x = pvAgg(ds, a.list)[vm[0].k] || 0, y = pvAgg(ds, b.list)[vm[0].k] || 0; return y - x; });
      groups.forEach(function (g) {
        const key = prefix + '›' + g.val; const c2 = conds.concat([[f, g.val]]); const kids = level < rowsF.length - 1;
        if (kids) allKeys.push(key);
        const open = !!s.pvExp[key]; const z = zi++ % 2 ? ' z' : '';
        body.push({ label: g.val, indent: 12 + level * 22, firstCls: 'td first' + z, lcls: level === 0 ? 'rl0' : 'rl1', hasKids: kids, leaf: !kids, open: open, arrow: open ? '▾' : '▸',
          toggle: function () { const e = Object.assign({}, self.state.pvExp); if (e[key]) delete e[key]; else e[key] = 1; self.setState({ pvExp: e }); },
          cells: makeCells(g.list, c2, c2.map(function (c) { return c[1]; }).join(' › ')).map(function (c) { c.cls += z; return c; }) });
        if (kids) { if (open) walk(g.list, level + 1, c2, key); else { const sub = g.list; const f2 = rowsF[level + 1]; uniq(sub, f2).forEach(function (v2) { allKeys.push(key + '›' + v2); }); } }
      });
    };
    if (rowsF.length) walk(recs, 0, [], ''); else body.push({ label: 'All records', indent: 12, firstCls: 'td first', lcls: 'rl0', hasKids: false, leaf: true, open: false, arrow: '', toggle: function () {}, cells: makeCells(recs, [], 'All records') });
    const total = makeCells(recs, [], 'Total').map(function (c) { c.cls = 'td tot'; return c; });
    const head = [{ label: rowsF.length ? rowsF.join(' › ') : 'Rows', cls: 'th first' }];
    colKeys.forEach(function (ck) { vm.forEach(function (m) { head.push({ label: (ck ? ck + ' · ' : '') + m.label, cls: 'th' }); }); });
    if (colsF.length) vm.forEach(function (m) { head.push({ label: 'Total · ' + m.label, cls: 'th' }); });
    const nCols = head.length - 1;
    /* zones */
    const zchip = function (f, zone) { return { label: zone === 'filters' ? f + (s.pvFV[f] && s.pvFV[f].length ? ': ' + (s.pvFV[f].length === 1 ? s.pvFV[f][0] : s.pvFV[f].length + ' selected') : ': all') + ' ▾' : f, name: f, ds: function (e) { self._drag = f; try { e.dataTransfer.setData('text/plain', f); } catch (er) {} }, click: function () { if (zone === 'filters') self.setState({ pvOpenF: self.state.pvOpenF === f ? null : f }); }, remove: function () { self.moveField(f, null); } }; };
    const zone = function (key, label, list) { return { cls: 'pzone', label: label, empty: !list.length, items: list.map(function (f) { return zchip(f, key); }), vals: [], over: function (e) { e.preventDefault(); }, drop: function (e) { e.preventDefault(); let f = self._drag; try { f = f || e.dataTransfer.getData('text/plain'); } catch (er) {} self._drag = null; if (fields.indexOf(f) >= 0) self.moveField(f, key); } }; };
    const zones = [zone('filters', 'Filters', filtF), zone('cols', 'Columns', colsF), zone('rows', 'Rows', rowsF),
      { cls: 'pzone vals', label: 'Values', empty: false, items: [], over: function (e) { e.preventDefault(); }, drop: function (e) { e.preventDefault(); },
        vals: meas.map(function (m) { const on = s.pvVals.indexOf(m.k) >= 0; return { label: m.label, on: on, cls: on ? 'vchip on' : 'vchip', toggle: function () { let nx = on ? self.state.pvVals.filter(function (x) { return x !== m.k; }) : self.state.pvVals.concat([m.k]); if (!nx.length) nx = [m.k]; nx = meas.map(function (q) { return q.k; }).filter(function (k) { return nx.indexOf(k) >= 0; }); self.setState({ pvVals: nx, pvSel: null }); } }; }) }];
    const used = {}; rowsF.concat(colsF, filtF).forEach(function (f) { used[f] = 1; });
    /* filter panel */
    const fo = s.pvOpenF && filtF.indexOf(s.pvOpenF) >= 0 ? s.pvOpenF : null;
    const fSel = fo ? (s.pvFV[fo] || []) : [];
    const fVals = fo ? uniq(base, fo).slice(0, 80).map(function (v) { const on = fSel.indexOf(v) >= 0; return { label: v, on: on, cls: on ? 'vchip on' : 'vchip', toggle: function () { const fv = Object.assign({}, self.state.pvFV); const cur = fv[fo] || []; fv[fo] = on ? cur.filter(function (x) { return x !== v; }) : cur.concat([v]); self.setState({ pvFV: fv, pvExp: {}, pvSel: null }); } }; }) : [];
    /* records behind a number */
    let rec = { title: '', note: '', cols: [], rows: [], grid: '1fr', download: function () {} };
    if (s.pvSel) {
      let rl = recs.filter(function (r) { return s.pvSel.conds.every(function (c) { return r[c[0]] === c[1]; }) && (s.pvSel.ck === null || colKey(r) === s.pvSel.ck); });
      let labels, rows;
      if (PVX[ds]) { const F = PVX[ds].fields; labels = ['Record'].concat(F); rows = rl.slice(0, 60).map(function (r) { return { name: r.id, cells: F.map(function (f) { return Object.assign(C(r[f]), { cls: 'txt' }); }) }; }); }
      else if (ds === 'inc') {
        labels = ['Incident', 'Severity', 'Category', 'Subcategory', 'District', 'Mandal', 'Status', 'Currently with', 'Season', 'Age / resolve (d)'];
        rows = rl.slice(0, 60).map(function (r) { return { name: r.id, cells: [C(r.Severity, r.Severity === 'Critical' ? 'bad' : r.Severity === 'High' ? 'warn' : ''), Object.assign(C(r.Category), { cls: 'txt' }), Object.assign(C(r.Subcategory), { cls: 'txt' }), Object.assign(C(r.District), { cls: 'txt' }), Object.assign(C(r.Mandal), { cls: 'txt' }), Object.assign(C(r.Status, r.Status === 'Escalated' ? 'bad' : r.Status === 'Closed' ? 'good' : ''), { cls: 'txt' }), Object.assign(C(r['Currently with']), { cls: 'txt' }), Object.assign(C(r.Season + ' · ' + r.Month), { cls: 'txt' }), C(fmtN(r.Status === 'Closed' ? r.res : r.age, 1))] }; });
      } else {
        labels = ['District', 'Mandal', 'Month', 'Variety', 'Target (MT)', 'Procured (MT)', 'Farmers', 'Paid (₹ Cr)', 'CMR delivered (MT)'];
        rows = rl.slice(0, 60).map(function (r) { return { name: r.District, cells: [Object.assign(C(r.Mandal), { cls: 'txt' }), Object.assign(C(r.Month), { cls: 'txt' }), Object.assign(C(r.Variety), { cls: 'txt' }), C(fmtN(r.target)), C(fmtN(r.procured)), C(fmtN(r.farmers)), C(fmtN(r.paid, 2)), C(fmtN(r.cmrDel))] }; });
      }
      rec = this.table('Records behind ' + s.pvSel.title, rl.length + ' records' + (rl.length > 60 ? ' · showing first 60' : ''), labels, rows, null, null, 'records');
    }
    const cfg = function () { return { data: ds, rows: rowsF, cols: colsF, f: filtF, fv: s.pvFV, vals: s.pvVals, name: s.pvName }; };
    const csv = function () {
      const esc = function (x) { x = String(x); return /[",\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; };
      const lines = [head.map(function (h) { return esc(h.label); }).join(',')];
      body.forEach(function (r) { lines.push([new Array(Math.round((r.indent - 12) / 22) + 1).join('  ') + r.label].concat(r.cells.map(function (c) { return c.v.replace(/,/g, ''); })).map(esc).join(',')); });
      lines.push(['Total'].concat(total.map(function (c) { return c.v.replace(/,/g, ''); })).map(esc).join(','));
      return lines.join('\n');
    };
    const loadCfg = function (c, msg) { self.setState({ pvData: c.data || ds, pvRows: c.rows || [], pvCols: c.cols || [], pvF: c.f || Object.keys(c.fv || {}), pvFV: c.fv || {}, pvVals: c.vals || [], pvName: c.name || '', pvExp: {}, pvSel: null, pvOpenF: null, pvPick: null, pvMsg: msg || '' }); };
    const nLbl = ds === 'inc' ? 'incidents' : PVX[ds] ? PVX[ds].unit : 'procurement records';
    return {
      summary: fmtN(recs.length) + ' ' + nLbl + ' after your filters' + (notes.length ? ' (' + notes.join(', ') + ')' : '') + ' · works on top of the filters above · click any number for its records',
      dsBtns: [['proc', 'Procurement'], ['inc', 'Incidents & anomalies']].concat(Object.keys(PVX).map(function (k) { return [k, PVX[k].label]; })).map(function (b) { const on = ds === b[0]; return { label: b[1], on: on, cls: on ? 'on' : '', pick: function () { if (on) return; const pr = PV_PRESETS[b[0]][0]; loadCfg({ data: b[0], rows: pr.rows, cols: pr.cols, fv: pr.f, f: Object.keys(pr.f), vals: pr.vals, name: '' }); } }; }),
      presets: PV_PRESETS[ds].map(function (pr) { return { name: pr.name, cls: 'pchip', load: function () { loadCfg({ data: ds, rows: pr.rows, cols: pr.cols, f: Object.keys(pr.f), fv: pr.f, vals: pr.vals, name: pr.name }, 'Loaded “' + pr.name + '”.'); } }; })
        .concat(s.saved.filter(function (v) { return (v.data || 'proc') === ds; }).map(function (v) { return { name: '★ ' + v.name, cls: 'pchip saved', load: function () { loadCfg(v, 'Loaded “' + v.name + '”.'); } }; })),
      fields: fields.map(function (f) { return { label: f, cls: 'fchip' + (s.pvPick === f ? ' pick' : used[f] ? ' used' : ''), ds: function (e) { self._drag = f; try { e.dataTransfer.setData('text/plain', f); } catch (er) {} }, click: function () { self.setState({ pvPick: self.state.pvPick === f ? null : f }); } }; }),
      hasPick: !!s.pvPick && fields.indexOf(s.pvPick) >= 0, pick: s.pvPick || '',
      addF: function () { self.moveField(self.state.pvPick, 'filters'); }, addC: function () { self.moveField(self.state.pvPick, 'cols'); }, addR: function () { self.moveField(self.state.pvPick, 'rows'); }, cancelPick: function () { self.setState({ pvPick: null }); },
      zones: zones,
      hasFPanel: !!fo, fField: fo || '', fVals: fVals, fAll: function () { const fv = Object.assign({}, self.state.pvFV); delete fv[fo]; self.setState({ pvFV: fv }); }, fClose: function () { self.setState({ pvOpenF: null }); },
      rowsLabel: rowsF.length ? rowsF.join(' › ') : 'No row fields', expandAll: function () { const e = {}; allKeys.forEach(function (k) { e[k] = 1; }); self.setState({ pvExp: e }); }, collapseAll: function () { self.setState({ pvExp: {} }); },
      grid: 'minmax(260px, 2fr) repeat(' + Math.max(1, nCols) + ', minmax(116px, 1fr))', head: head, body: body, total: total,
      hasRecs: !!s.pvSel, rec: rec, closeRecs: function () { self.setState({ pvSel: null }); },
      name: s.pvName, msg: s.pvMsg, onName: function (e) { self.setState({ pvName: e.target.value }); },
      swap: function () { const st = self.state; if (!st.pvCols.length) { self.setState({ pvMsg: 'Add a column field first, then swap.' }); return; } self.setState({ pvRows: st.pvCols.slice(), pvCols: st.pvRows.slice(-2), pvExp: {}, pvSel: null, pvMsg: '' }); },
      save: function () { const st = self.state; const name = (st.pvName || '').trim() || ('View ' + (st.saved.length + 1)); const c = cfg(); c.name = name; const saved = st.saved.filter(function (x) { return x.name !== name; }).concat([c]); self.persist(saved); self.setState({ saved: saved, pvName: name, pvMsg: 'Saved “' + name + '”.' }); },
      download: function () { self.offerFile(((s.pvName || 'custom-view').replace(/[^A-Za-z0-9_-]+/g, '-')) + '.csv', csv(), 'Copy custom view as CSV'); },
      share: function () { let code = ''; try { code = btoa(unescape(encodeURIComponent(JSON.stringify(cfg())))); } catch (e) { code = JSON.stringify(cfg()); } self.setState({ modal: { title: 'Share this view', body: 'Send this view code to a colleague. They open Custom view → Pivot table → Share and paste it under “Load a view code”. In production this becomes a link shared with a team.', text: code, msg: '', isShare: true } }); },
      load: loadCfg,
      distVal: s.pvDist || '', distOpts: D.map(function (d) { return { name: d.name }; }), onDist: function (e) { self.setState({ pvDist: e.target.value || '', pvExp: {}, pvSel: null }); },
      clearAll: function () { self.setState({ pvDist: '', pvRows: [], pvCols: [], pvF: [], pvFV: {}, pvVals: [meas[0].k], pvExp: {}, pvSel: null, pvOpenF: null, pvPick: null, pvName: '', pvMsg: 'Cleared — drag or click fields to build a view.' }); }
    };
  }

  /* ---------- chat ---------- */
  answer(q) {
    const self = this; const s = this.state; const ql = q.toLowerCase(); const te = /[ఀ-౿]/.test(q);
    let dn = s.role === 'dm' ? s.dm : null;
    if (!dn) { for (let i = 0; i < D.length; i++) { const d = D[i]; if (ql.indexOf(d.name.toLowerCase()) >= 0 || new RegExp('(^|[^a-z])' + d.abbr.toLowerCase() + '([^a-z]|$)').test(ql)) { dn = d.name; break; } } }
    const scope = dn || 'Andhra Pradesh';
    const kids = dn ? mandalsOf(dn) : D.map(function (d) { return { id: d.name, name: d.name, v: distVals(d.name) }; });
    const v = dn ? distVals(dn) : stateVals();
    const path = dn ? [dn] : [];
    const has = function (arr) { return arr.some(function (w) { return ql.indexOf(w) >= 0 || q.indexOf(w) >= 0; }); };
    const msg = function (text, bars, label, act) { return { text: text, bars: bars || [], actLabel: label || '', act: act || null }; };
    const rq = this.answerRecords(ql, dn, msg); if (rq) return rq;
    if (has(['cmr', 'mill', 'మిల్లు', 'milling'])) {
      const list = dn ? entsOfDistrict(dn, 'cmr') : kids;
      const bars = this.barsFrom(list, 'cmrShort', -1, fmtMT, function (x) { return tone(x.cmrPct, 0.6, 0.45); }, 5);
      return msg((dn ? 'Mills' : 'Districts') + ' behind on CMR delivery in ' + scope + ', by shortfall. Overall ' + pct(v.cmrPct) + ' delivered; ' + fmtMT(v.cmrShort) + ' still due.', bars, 'Open CMR in dashboard', function () { self.go('cmr', 'overview', path); });
    }
    if (has(['payment', 'pending', 'paid', 'pay ', 'fto', 'చెల్లింపు'])) {
      const bars = this.barsFrom(kids, 'pay24', 1, pct, function (x) { return tone(x.pay24, 0.9, 0.8); }, 5);
      let t = 'Farmer payments in ' + scope + ': ' + fmtN(v.farmPaidPct * 100, 2) + '% of farmers paid (₹' + fmtN(v.paid, 2) + ' Cr of ₹' + fmtN(v.valueCr, 2) + ' Cr). ' + fmtN(v.farmersPend) + ' farmers still unpaid (' + fmtCr(v.pending) + '). ' + pct(v.pay24) + ' of payments were made within 24 hours. Lowest 24-hour payment:';
      if (te) t = scope + ' — పెండింగ్ చెల్లింపులు: ₹' + fmtN(v.pending, 2) + ' కోట్లు, ' + fmtN(v.farmersPend) + ' రైతులు.\n' + t;
      return msg(t, bars, 'Open financials', function () { self.go('proc', 'fin', path); });
    }
    if (has(['p1', 'critical', 'incident', 'alert', 'complaint', 'grievance', 'pgrs', 'ivrs'])) {
      let all = []; (dn ? [dn] : D.map(function (d) { return d.name; })).forEach(function (n) { all = all.concat(incidentsOf(n)); });
      const p1 = all.filter(function (i) { return i.prio === 'P1' && i.ageH <= 168; });
      const top = p1.slice(0, 4).map(function (i) { return '• ' + i.id + ' — ' + i.title + ' (' + i.dn + ', ' + i.status + ')'; }).join('\n');
      return msg(p1.length + ' critical incidents open in ' + scope + ' raised in the last 7 days.' + (top ? '\n' + top : ''), null, 'Open incidents', function () { self.go('all', 'alerts', path); });
    }
    if (has(['storage', 'godown', 'stock', 'గోదాము', 'ageing', 'aged'])) {
      const bars = this.barsFrom(kids, 'util', -1, pct, function (x) { return tone(x.util, 0.85, 0.93, false); }, 5);
      return msg('Godown utilisation in ' + scope + ' is ' + pct(v.util) + ' (' + fmtMT(v.stock) + ' of ' + fmtMT(v.cap) + '). ' + fmtMT(v.aged) + ' is older than 6 months. Fullest:', bars, 'Open storage', function () { self.go('stor', 'overview', path); });
    }
    if (has(['vehicle', 'gps', 'truck', 'deviat', 'route', 'lorry'])) {
      const bars = this.barsFrom(kids, 'vehDev', -1, function (x) { return fmtN(x); }, function (x) { return tone(x.vehDev / (x.veh || 1), 0.02, 0.04, false); }, 5);
      return msg(fmtN(v.vehDev) + ' of ' + fmtN(v.veh) + ' tracked vehicles deviated from route today in ' + scope + '; ' + fmtN(v.vehHalt) + ' halted over 2 hours.', bars, 'Open GPS tracking', function () { self.go('all', 'gps', path); });
    }
    if (has(['prepar', 'ready', 'readiness', 'gunny', 'next season', 'coming season'])) {
      const ps = PREP.map(function (p, i) { let x = 0; if (dn) x = prepVal(dn, i); else { D.forEach(function (d) { x += prepVal(d.name, i); }); x /= D.length; } return { name: p[0], v: { r: x } }; });
      const bars = this.barsFrom(ps, 'r', 1, pct, function (x) { return tone(x.r, 0.85, 0.72); }, 5).map(function (b) { b.w = Math.round(parseFloat(b.v)); return b; });
      return msg('Readiness for the coming season in ' + scope + ' is ' + pct(v.prep) + '. Weakest parameters:', bars, 'Open preparedness', function () { self.go('all', 'prep', path); });
    }
    if (has(['cctv', 'camera'])) {
      return msg(fmtN(v.camsOff) + ' of ' + fmtN(v.cams) + ' CCTV cameras are offline in ' + scope + ' (' + pct(v.camOnline) + ' online). ' + fmtN(v.camEv) + ' events flagged in the last 24 hours.', null, 'Open CCTV monitoring', function () { self.go('all', 'cctv', path); });
    }
    if (has(['procure', 'target', 'lag', 'behind', 'paddy', 'moisture', 'సేకరణ'])) {
      const bars = this.barsFrom(kids, 'procPct', 1, pct, function (x) { return tone(x.procPct, 0.95, 0.8); }, 5);
      return msg(scope + ' has procured ' + fmtMT(v.procured) + ' — ' + pct(v.procPct) + ' of the ' + fmtMT(v.target) + ' target, from ' + fmtN(v.farmers) + ' farmers. Average moisture ' + fmtN(v.moisture, 1) + '%. Lagging most:', bars, 'Open procurement', function () { self.go('proc', 'overview', path); });
    }
    if (has(['fps', 'ration', 'beneficiar', 'distribut', 'mls', 'stage 2', 'stage-ii'])) {
      const bars = this.barsFrom(kids, 's2Pct', 1, pct, function (x) { return tone(x.s2Pct, 0.85, 0.7); }, 5);
      return msg('Stage-II in ' + scope + ': ' + pct(v.s2Pct) + ' of allotment delivered to FPS; ' + pct(v.distPct) + ' distributed to ' + fmtN(v.cards) + ' ration cards.', bars, 'Open Stage 2', function () { self.go('s2', 'overview', path); });
    }
    return msg((te ? 'క్షమించండి — ' : '') + 'In this POC I can answer about procurement vs target, farmer payments, CMR by mill, storage, Stage-I and II movement, critical incidents, GPS deviations, CCTV and season preparedness. Name a district to narrow it, e.g. “CMR shortfall in Krishna”.', null, '', null);
  }
  ask(q) {
    q = (q || '').trim(); if (!q) return;
    const a = this.answer(q);
    const msgs = (this.state.chatMsgs || this.greeting()).concat([{ me: true, text: q }, Object.assign({ me: false }, a)]);
    this.setState({ chatMsgs: msgs, chatInput: '' });
  }
  greeting() { const s = this.state; return [{ me: false, text: 'Ask for a quick report in English or Telugu. Answers use the same integrated data and are limited to what the ' + (s.role === 'comm' ? "Commissioner's" : s.role === 'ho' ? 'Head office' : s.dm + ' District Manager') + ' view can see.', bars: [], actLabel: '', act: null }]; }

  prepRecords(mode, path) {
    const self = this; const dn = path[0] || null;
    const val = function (i, d) { if (d) return prepNA(d, i) ? null : prepVal(d, i); let s2 = 0, n = 0; D.forEach(function (x) { if (!prepNA(x.name, i)) { s2 += prepVal(x.name, i); n++; } }); return n ? s2 / n : null; };
    const T = function (x) { return Object.assign(C(x), { cls: 'txt' }); };
    const st = function (x) { return x === null ? Object.assign(C('Not reported', 'warn'), { cls: 'txt' }) : Object.assign(C(x < 0.5 ? 'Needs attention' : x < 0.7 ? 'Moderate' : 'Good', tone(x, 0.7, 0.5)), { cls: 'txt' }); };
    if (mode === 'ready') {
      const ds = D.filter(function (d) { return distVals(d.name).prep >= 0.85; });
      return { title: 'Districts ready for the season', note: ds.length ? ds.length + ' districts at 85% readiness or more' : 'No district has reached 85% readiness yet', labels: ['District', 'Readiness', 'Status'], rows: ds.map(function (d) { const x = distVals(d.name).prep; return { name: d.name, cells: [C(pct(x), tone(x, 0.85, 0.72)), st(x)], drill: function () { self.setState({ module: 'prep', stage: 'all', kpiOpen: null, kpiRec: false, path: [d.name] }); } }; }) };
    }
    const idx = PREP.map(function (p, i) { return i; }).filter(function (i) { const x = val(i, dn); const bm = { risk: 'att', watch: 'mod', meet: 'good' }[mode] || mode; if (bm === 'na') return x === null || (!dn && D.some(function (dd) { return prepNA(dd.name, i); })); return x !== null && (bm === 'att' ? x < 0.5 : bm === 'mod' ? (x >= 0.5 && x < 0.7) : x >= 0.7); }).sort(function (a, b) { return val(a, dn) - val(b, dn); });
    const PPCU = { 1: 1, 2: 1, 3: 1, 5: 1, 7: 1, 8: 1, 10: 1, 13: 1, 15: 1 }, MILLU = { 4: 1, 6: 1, 11: 1, 14: 1, 16: 1 };
    let rows = [], labels;
    if (!dn) {
      labels = ['Parameter', 'District', 'Readiness', 'Owner', 'Status'];
      idx.forEach(function (i) {
        const ds = D.map(function (d) { return { n: d.name, x: val(i, d.name) }; }).filter(function (o) { return mode === 'na' ? o.x === null : o.x !== null; }).sort(function (a, b) { return a.x - b.x; }).slice(0, mode === 'meet' ? 4 : 8);
        ds.forEach(function (o) { rows.push({ name: pad(i + 1, 2) + ' · ' + PREP[i][0], cells: [T(o.n), o.x === null ? C('No data') : C(pct(o.x), tone(o.x, 0.7, 0.5)), T(PREP[i][2]), st(o.x)], drill: function () { self.setState({ module: 'prep', stage: 'all', kpiOpen: null, kpiRec: false, path: [o.n] }); } }); });
      });
      return { title: 'Records for the ' + idx.length + ' parameters ' + ({ risk: 'needing attention', att: 'needing attention', watch: 'in the Moderate band', mod: 'in the Moderate band', meet: 'in the Good band', good: 'in the Good band', na: 'with missing reports' }[mode]), note: 'For each parameter, the ' + (mode === 'meet' ? '4 lowest' : '8 lowest') + ' districts · choose a district for unit-level records', labels: labels, rows: rows };
    }
    labels = ['Parameter', 'Unit', 'Mandal', 'Status', 'Owner'];
    idx.forEach(function (i) {
      const x = val(i, dn);
      if (x === null) { rows.push({ name: pad(i + 1, 2) + ' · ' + PREP[i][0], cells: [T('No report received'), T('—'), C('No data'), T(PREP[i][2])] }); return; }
      if (PPCU[i] || MILLU[i]) {
        const ents = entsOfDistrict(dn, PPCU[i] ? 'proc' : 'cmr');
        const list = ents.map(function (e) { return { e: e, done: R(e.id + 'pp' + i) < x }; }).sort(function (a, b) { return (a.done ? 1 : 0) - (b.done ? 1 : 0); });
        const pend = list.filter(function (o) { return !o.done; }).length;
        list.slice(0, 8).forEach(function (o) { rows.push({ name: pad(i + 1, 2) + ' · ' + PREP[i][0], cells: [T(o.e.name), T(LBL[o.e.mid]), Object.assign(C(o.done ? 'Done' : 'Pending', o.done ? 'good' : 'bad'), { cls: 'txt' }), T(PREP[i][2] + (pend ? ' · ' + pend + ' pending in district' : ''))], drill: function () { self.setState({ stage: PPCU[i] ? 'proc' : 'cmr', module: 'overview', kpiOpen: null, kpiRec: false, path: [o.e.dn, o.e.mid, o.e.id] }); } }); });
      } else {
        rows.push({ name: pad(i + 1, 2) + ' · ' + PREP[i][0], cells: [T('District total'), T('—'), x === null ? C('No data') : C(pct(x), tone(x, 0.7, 0.5)), T(PREP[i][2])] });
      }
    });
    return { title: 'Records for the ' + idx.length + ' parameters ' + ({ risk: 'needing attention', att: 'needing attention', watch: 'in the Moderate band', mod: 'in the Moderate band', meet: 'in the Good band', good: 'in the Good band', na: 'with missing reports' }[mode]) + ' · ' + dn, note: 'Pending PPCs / mills listed first for each parameter', labels: labels, rows: rows };
  }

  /* ---------- records behind a KPI ---------- */
  kpiRecords(type, I, path, mode, stage) {
    const self = this; const isDM = this.state.role === 'dm';
    const flt = type.indexOf(':') > 0 ? type.split(':')[1] : ''; type = type.split(':')[0];
    if (type === 'prep' && flt) { const pr = this.prepRecords(flt, path); return this.table(pr.title, pr.note + ' · click a record to open it', pr.labels, pr.rows, null, null, pr.title); }
    let dists;
    if (path[0]) dists = [path[0]];
    else { const f = I.field; const arr = D.map(function (d) { return { n: d.name, v: distVals(d.name) }; }); if (f && arr[0].v[f] !== undefined) arr.sort(function (a, b) { return (I.dir || 1) * (a.v[f] - b.v[f]); }); dists = arr.slice(0, 3).map(function (x) { return x.n; }); }
    const scopeNote = path[0] ? path[0] : 'the 3 ' + (I.field ? ((I.dir === -1 ? 'highest' : 'lowest') + ' districts on this KPI') : 'first districts') + ' (' + dists.join(', ') + ') · choose a district on the map for its full list';
    const T = function (x) { return Object.assign(C(x), { cls: 'txt' }); };
    let labels = [], rows = [], title = '';
    const cap = function (a) { return a.slice(0, 60); };
    const goEnt = function (e, st) { return function () { self.setState({ stage: st, module: 'overview', pivot: false, kpiOpen: null, kpiRec: false, path: [e.dn, e.mid, e.id] }); }; };
    if (type === 'ppc' || type === 'lots') {
      let ents = []; dists.forEach(function (d) { ents = ents.concat(entsOfDistrict(d, 'proc')); });
      if (flt === 'notstarted') ents = ents.filter(function (e) { return !(R(e.id + 'st') < distVals(e.dn).ppcPct); });
      if (type === 'ppc') {
        title = flt === 'notstarted' ? 'PPCs not yet procuring' : 'PPC / RSK records'; labels = ['PPC / RSK', 'District', 'Mandal', 'Status', 'Procured', '% of target', 'Farmers', 'Paid ≤ 24 h'];
        rows = cap(ents).map(function (e) { const on = R(e.id + 'st') < distVals(e.dn).ppcPct; return { name: e.name, cells: [T(e.dn), T(LBL[e.mid]), Object.assign(C(on ? 'Procuring' : 'Not started', on ? 'good' : 'bad'), { cls: 'txt' }), C(fmtMT(e.v.procured)), C(pct(e.v.procPct), tone(e.v.procPct, 0.95, 0.8)), C(fmtN(e.v.farmers)), C(pct(e.v.pay24), tone(e.v.pay24, 0.9, 0.8))], drill: goEnt(e, 'proc') }; });
      } else {
        title = 'Farmer payment records'; labels = ['Lot', 'District', 'PPC / RSK', 'Farmer', 'Qty (qtl)', 'Time', 'Payment'];
        let lots = []; ents.slice(0, flt === 'pending' ? 60 : 12).forEach(function (e) { lots = lots.concat(txnsOf(e.id)); });
        if (flt === 'pending') { lots = lots.filter(function (t) { return t.pay !== 'Paid'; }); title = 'Farmer payments not yet completed'; }
        rows = cap(lots).map(function (t) { return { name: t.name, cells: [T(t.e.dn), T(t.e.name), T(t.farmer), C(fmtN(t.qty, 1)), C(t.time), Object.assign(C(t.pay, t.pay === 'Paid' ? 'good' : t.pay.indexOf('Pending') >= 0 ? 'bad' : 'warn'), { cls: 'txt' })], drill: function () { self.setState({ stage: 'proc', module: 'overview', pivot: false, kpiOpen: null, kpiRec: false, path: [t.e.dn, t.e.mid, t.e.id, t.id] }); } }; });
      }
    } else if (type === 'mills' || type === 'godowns' || type === 'routes' || type === 'mls' || type === 'fps') {
      const et = { mills: 'cmr', godowns: 'stor', routes: 's1', mls: 's2', fps: 'fps' }[type];
      let ents = []; dists.forEach(function (d) { ents = ents.concat(entsOfDistrict(d, et).slice(0, type === 'fps' ? 25 : 200)); });
      if (type === 'mills' && flt === 'norcv') ents = ents.filter(function (e) { return !e.x.rcv; });
      if (type === 'mills' && flt === 'overdue') ents = ents.filter(function (e) { return millCmr(e).overdue; });
      if (type === 'mills' && flt === 'pending') ents = ents.filter(function (e) { return millCmr(e).bal > 0.5; });
      if (type === 'mills' && flt === 'late') ents = ents.filter(function (e) { return millCmr(e).rcv && millCmr(e).late15; });
      if (type === 'mills') { title = { norcv: 'Mills yet to receive paddy', overdue: 'Mills with CMR overdue beyond 3 months', pending: 'Mills with CMR balance pending', late: 'Mills whose first CMR came after 15 days' }[flt] || 'Rice mill records'; labels = ['Rice mill', 'District', 'Mandal', 'Received paddy', 'Paddy first received', 'CMR due', 'Acknowledged', 'Balance pending', 'Turnaround', 'Status'];
        rows = cap(ents).map(function (e) { const c = millCmr(e); return { name: e.name, cells: [T(e.dn), T(LBL[e.mid]), Object.assign(C(c.rcv ? 'Yes' : 'No', c.rcv ? 'good' : 'bad'), { cls: 'txt' }), C(c.rcv ? fmtD(c.paddyAgo) : '—'), C(fmtMT(c.due)), C(fmtMT(c.ack)), C(fmtMT(c.bal), c.overdue ? 'bad' : ''), C(c.turn !== null ? c.turn + ' d' : '—', c.turn !== null ? tone(c.turn, 12, 16, false) : ''), Object.assign(C(c.status, c.stCls), { cls: 'txt' })], drill: goEnt(e, 'cmr') }; }); }
      else if (type === 'godowns') { title = 'Buffer godown records'; labels = ['Godown', 'District', 'Mandal', 'Capacity', 'Stock', 'Utilisation', 'Aged > 6 months', 'CCTV'];
        rows = cap(ents).map(function (e) { return { name: e.name, cells: [T(e.dn), T(LBL[e.mid]), C(fmtMT(e.v.cap)), C(fmtMT(e.v.stock)), C(pct(e.v.util), tone(e.v.util, 0.85, 0.93, false)), C(fmtMT(e.v.aged)), EXTRA.stor[1](e)], drill: goEnt(e, 'stor') }; }); }
      else if (type === 'routes') { title = 'Stage-I route records'; labels = ['Route', 'District', 'Planned', 'Moved', '% moved', 'Trips', 'Deviations'];
        rows = cap(ents).map(function (e) { return { name: e.name, cells: [T(e.dn), C(fmtMT(e.v.s1Plan)), C(fmtMT(e.v.s1Moved)), C(pct(e.v.s1Pct), tone(e.v.s1Pct, 0.9, 0.8)), C(fmtN(e.v.trips)), C(fmtN(e.v.s1Dev), tone(e.v.s1Dev, 0, 1, false))], drill: goEnt(e, 's1') }; }); }
      else if (type === 'mls') { title = 'MLS point records'; labels = ['MLS point', 'District', 'Allotted', 'Lifted', 'Delivered to FPS', '% to FPS', 'Inspection'];
        rows = cap(ents).map(function (e) { return { name: e.name, cells: [T(e.dn), C(fmtMT(e.v.s2Allot)), C(fmtMT(e.v.s2Lift)), C(fmtMT(e.v.s2Fps)), C(pct(e.v.s2Pct), tone(e.v.s2Pct, 0.85, 0.7)), EXTRA.s2[1](e)], drill: goEnt(e, 's2') }; }); }
      else { title = 'Fair price shop records'; labels = ['FPS', 'District', 'Mandal', 'Ration cards', 'Received', 'Distributed', 'ePoS uptime'];
        rows = cap(ents).map(function (e) { return { name: e.name, cells: [T(e.dn), T(LBL[e.mid]), C(fmtN(e.v.cards)), C(fmtMT(e.v.s2Fps)), C(pct(e.v.distPct), tone(e.v.distPct, 0.9, 0.8)), EXTRA.fps[1](e)], drill: function () { self.setState({ module: 'glance', glance: 'fps', stage: 'all', pivot: false, kpiOpen: null, kpiRec: false, path: [e.dn, e.id] }); } }; }); }
    } else if (type === 'inc') {
      title = 'Incident records'; labels = ['Incident', 'Severity', 'Title', 'District', 'Mandal', 'Status', 'Age'];
      let all = []; dists.forEach(function (d) { all = all.concat(incidentsOf(d)); });
      if (stage !== 'all') all = all.filter(function (i) { return i.stage === stage; });
      if (flt === 'crit') { all = all.filter(function (i) { return i.prio === 'P1'; }); title = 'Critical incident records'; }
      if (flt === 'high') { all = all.filter(function (i) { return i.prio === 'P2'; }); title = 'High-severity incident records'; }
      if (flt === 'esc') { all = all.filter(function (i) { return i.status === 'Escalated'; }).map(function (i) { return Object.assign({}, i, { status: 'Escalated to ' + i.escTo }); }); title = 'Escalated incident records · escalated to district office or head office'; }
      if (flt === 'grv') { all = []; dists.forEach(function (d) { all = all.concat(grievOf(d).filter(function (g) { return g.open; }).map(function (g) { return { id: g.id, prio: g.prio, title: g.type, dn: g.dn, mandal: g.mandal, status: g.esc ? 'Escalated' : g.state || 'Open', ageH: Math.round(g.ageH), stage: g.stage, grv: g }; })); }); if (stage !== 'all') all = all.filter(function (i) { return i.stage === stage; }); title = 'Grievance records (PGRS + IVRS)'; }
      rows = cap(all).map(function (i) { return { name: i.id, cells: [C(SEV[i.prio], i.prio === 'P1' ? 'bad' : i.prio === 'P2' ? 'warn' : ''), T(i.title), T(i.dn), T(i.mandal), Object.assign(C(i.status, i.status === 'Escalated' ? 'bad' : ''), { cls: 'txt' }), C(i.ageH + ' h')], drill: function () { if (i.grv) { self.setState({ rxRec: self.rxBack(self.rxRecord('grv', i.grv)) }); return; } self.setState({ module: 'alerts', stage: 'all', pivot: false, kpiOpen: null, kpiRec: false, path: [i.dn, i.id] }); } }; });
    } else if (type === 'veh') {
      title = 'Vehicle & trip records'; labels = ['Vehicle', 'District', 'Leg', 'From', 'To', 'Status', 'Speed'];
      let all = []; dists.forEach(function (d) { let l = vehiclesOf(d); if (flt === 'dev') l = l.filter(function (x) { return x.status === 'Deviated'; }); all = all.concat(l.slice(0, 25)); });
      if (flt === 'dev') title = 'Vehicles that deviated from route';
      rows = cap(all).map(function (x) { return { name: x.plate, cells: [T(x.dn), T(STAGE_NAME[x.stage]), T(x.from), T(x.to), Object.assign(C(x.status, x.status === 'Deviated' || x.status === 'Halted > 2 h' ? 'bad' : x.status === 'Reached' ? 'good' : ''), { cls: 'txt' }), C(x.speed ? x.speed + ' km/h' : '—')], drill: function () { self.setState({ module: 'gps', stage: 'all', pivot: false, kpiOpen: null, kpiRec: false, path: [x.dn, x.id] }); } }; });
    } else if (type === 'cam') {
      title = 'CCTV camera records'; labels = ['Camera', 'District', 'Site', 'View', 'Status', 'Last event'];
      let all = []; dists.forEach(function (d) { all = all.concat(camerasOf(d).filter(function (c) { return flt === 'off' ? c.status === 'Offline' : flt === 'ev' ? !!c.event : (c.status === 'Offline' || c.event); }).slice(0, 25)); });
      if (flt === 'off') title = 'Offline camera records'; if (flt === 'ev') title = 'Cameras with flagged events';
      rows = cap(all).map(function (c) { return { name: c.id, cells: [T(c.dn), T(c.site), T(c.view), Object.assign(C(c.status, c.status === 'Online' ? 'good' : 'bad'), { cls: 'txt' }), T(c.event || '—')], drill: function () { self.setState({ module: 'cctv', stage: 'all', pivot: false, kpiOpen: null, kpiRec: false, path: [c.dn, c.id] }); } }; });
    } else if (type === 'prep') {
      if (path[0]) { title = 'Preparedness parameter records · ' + path[0]; labels = ['Parameter', 'Readiness', 'Owner', 'Status'];
        rows = PREP.map(function (p, i) { const na = prepNA(path[0], i); const x = na ? null : prepVal(path[0], i); return { name: pad(i + 1, 2) + ' · ' + p[0], cells: [x === null ? C('NA') : C(pct(x), tone(x, 0.85, 0.72)), T(p[2]), Object.assign(C(na ? 'Not reported' : x < 0.72 ? 'Act now' : x < 0.85 ? 'Watch' : 'On track', na ? 'warn' : tone(x, 0.85, 0.72)), { cls: 'txt' })] }; });
      } else { title = 'Preparedness records by district'; labels = ['District', 'Readiness', 'Parameters reported', 'Below 72%'];
        rows = D.map(function (d) { const rep = PREP.map(function (p, i) { return prepNA(d.name, i) ? null : prepVal(d.name, i); }).filter(function (x) { return x !== null; }); const a = rep.reduce(function (s2, x) { return s2 + x; }, 0) / (rep.length || 1); return { name: d.name, cells: [C(pct(a), tone(a, 0.85, 0.72)), C(rep.length + ' / ' + PREP.length), C(fmtN(rep.filter(function (x) { return x < 0.72; }).length))], drill: function () { self.setState({ module: 'prep', stage: 'all', pivot: false, kpiOpen: null, kpiRec: false, path: [d.name] }); } }; });
        dists = D.map(function (d) { return d.name; });
      }
    } else return null;
    const total = rows.length;
    const t = this.table(title, (total >= 60 ? 'First 60 records · ' : total + ' records · ') + 'Scope: ' + (type === 'prep' && !path[0] ? 'all districts' : scopeNote) + ' · click a record to open it', labels, rows, null, null, title);
    return t;
  }

  /* ---------- KPI catalogue: commissioner scorecard + register additions ---------- */
  freshTxt(uid) { const d = new Date(Date.now() - rr(uid + 'fr', 2, 45) * 60000); return 'Updated ' + pad(d.getHours(), 2) + ':' + pad(d.getMinutes(), 2); }
  catItem(o) {
    const it = { uid: o.uid, n: o.n, name: o.name, value: o.value, detail: o.detail, vcls: 'skv ' + (o.t || ''), tag: o.tag || 'Illustrative', group: o.group || '', infoObj: o.info || { def: '', calc: '', drill: '' } };
    it.tagCls = it.tag === 'Reported' ? 'tag rep' : 'tag ill';
    it.hasTarget = o.x !== undefined && o.x !== null && o.tgt !== undefined;
    if (it.hasTarget) { const d = (o.x - o.tgt) * 100; it.target = pct(o.tgt); it.variance = (d >= 0 ? '+' : '−') + fmtN(Math.abs(d), 1) + ' pts'; it.varCls = d >= -0.05 ? 'good' : d > -10 ? 'warn' : 'bad'; } else { it.target = ''; it.variance = ''; it.varCls = ''; }
    it.fresh = o.fresh || (it.tag === 'Proposed' ? 'Proposed KPI · source feed to be confirmed' : this.freshTxt(o.uid));
    return it;
  }
  catalogSections(mode, path, sk) {
    const self = this; const role = this.state.role; const dn = path[0] || null; const v = dn ? distVals(dn) : stateVals(); const isState = !dn;
    const pv = function (i, d) { d = d || dn; if (d) return prepNA(d, i) ? null : prepVal(d, i); let s = 0, n = 0; D.forEach(function (x) { if (!prepNA(x.name, i)) { s += prepVal(x.name, i); n++; } }); return n ? s / n : null; };
    const naCells = dn ? PREP.filter(function (p, i) { return prepNA(dn, i); }).length : D.reduce(function (a, d) { return a + PREP.filter(function (p, i) { return prepNA(d.name, i); }).length; }, 0);
    const avgOf = function (arr, d) { const xs = arr.map(function (i) { return typeof i === 'number' ? pv(i, d) : i === null ? null : i.val; }).filter(function (x) { return x !== null && x !== undefined; }); return xs.length ? xs.reduce(function (a, b) { return a + b; }, 0) / xs.length : null; };
    const P = function (x) { return x === null ? 'NA' : pct(x); };
    const T = function (x, g, w) { return x === null ? '' : tone(x, g, w); };
    const I = function (def, calc, drill, extra) { return Object.assign({ def: def, calc: calc, drill: drill }, extra || {}); };
    const scopeTxt = dn ? ' · ' + dn : ' · state';
    const secs = [];
    const C12 = {
      1: function () { const x = avgOf([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]); const meet = PREP.filter(function (p, i) { const y = pv(i); return y !== null && y >= 0.7; }).length; return { name: 'Season readiness', value: P(x), detail: meet + ' of 17 parameters in the Good band (70%+)', t: T(x, 0.85, 0.72), x: x, tgt: 1, fresh: naCells ? naCells + ' parameter reports missing (shown as NA)' : null, info: I('Are districts and facilities ready to procure?', 'Parameters meeting target ÷ parameters applicable; missing reports stay NA, never zero', 'Season → district → parameter', { fn: function (d) { return avgOf([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], d); }, dir: 1, fmt: 'pct', tone: [0.85, 0.72], go: ['all', 'prep'] }) }; },
      2: function () { return { name: 'Farmer e-KYC completion', value: pct(v.kycPct), detail: fmtN(v.kycDone) + ' of ' + fmtN(v.regFarm) + ' farmers · ' + fmtN(v.regAcres) + ' acres registered', t: T(v.kycPct, 0.95, 0.85), x: v.kycPct, tgt: 1, info: I('Are registered farmers verified?', 'Verified farmers ÷ e-Panta registered farmers × 100', 'Season → district → mandal', { field: 'kycPct', dir: 1, fmt: 'pct', tone: [0.95, 0.85], go: ['all', 'prep'] }) }; },
      3: function () { const a = pv(5), b = pv(8), c = v.psaPct, d = pv(2); const x = avgOf([5, 8, { val: c }, 2]); return { name: 'PPC readiness', value: P(x), detail: 'Inspection ' + P(a) + ' · Equipment ' + P(b) + ' · Staffing ' + P(c) + ' · Date capture ' + P(d), t: T(x, 0.85, 0.72), x: x, tgt: 1, info: I('Can planned procurement centres open and operate?', 'Average of PPC inspection, equipment, PSA staffing and harvest-date capture rates; each stays drillable', 'Season → district → PPC', { fn: function (dd) { return avgOf([5, 8, { val: distVals(dd).psaPct }, 2], dd); }, dir: 1, fmt: 'pct', tone: [0.85, 0.72], go: ['all', 'prep'] }) }; },
      4: function () { const a = pv(6), c = pv(11), d = pv(16); const x = avgOf([6, { val: Math.min(1, v.ebgPct) }, 11, 16]); return { name: 'Mill readiness & allocation', value: P(x), detail: 'Inspection ' + P(a) + ' · e-BG ₹' + fmtN(v.bg, 1) + ' of ₹' + fmtN(v.ebgT, 1) + ' Cr · Custodian ' + P(c) + ' · Targets ' + P(d), t: T(x, 0.85, 0.72), x: x, tgt: 1, info: I('Are mills inspected, secured, staffed and assigned targets?', 'Average of mill inspection, e-BG collected ÷ target (₹ Cr), custodian appointment and target allocation', 'Season → district → mill', { fn: function (dd) { const vv = distVals(dd); return avgOf([6, { val: Math.min(1, vv.ebgPct) }, 11, 16], dd); }, dir: 1, fmt: 'pct', tone: [0.85, 0.72], go: ['cmr', 'overview'] }) }; },
      5: function () { const x = Math.min(1, v.vehRegPct); return { name: 'Vehicle readiness', value: pct(x), detail: fmtN(v.regVeh) + ' of ' + fmtN(v.vehTgt) + ' registered · ' + pct(v.vehApprPct) + ' of registered approved', t: T(x, 0.95, 0.85), x: x, tgt: 1, info: I('Is enough approved transport available?', 'Vehicles registered ÷ target; vehicles approved ÷ registered (kept separate)', 'Season → district → movement type', { field: 'vehRegPct', dir: 1, fmt: 'pct', tone: [0.95, 0.85], go: ['all', 'gps'] }) }; },
      6: function () { return { name: 'GPS fleet activity', value: pct(v.actPct) + ' active', detail: fmtN(v.inactVeh) + ' inactive · ' + fmtN(v.idleVeh) + ' idle GPS devices', t: T(v.actPct, 0.3, 0.2), fresh: 'Active / idle thresholds to be agreed with system owner', info: I('Can the department see the operating fleet?', 'Active vehicles ÷ registered vehicles; inactive count; idle devices', 'Season → district → date', { field: 'actPct', dir: 1, fmt: 'pct', tone: [0.3, 0.2], go: ['all', 'gps'] }) }; },
      7: function () { return { name: 'Trip completion', value: pct(v.tripPct), detail: fmtN(v.tripsC) + ' of ' + fmtN(v.tripsT) + ' trips completed · ' + fmtN(v.tripsI) + ' in transit', t: T(v.tripPct, 0.6, 0.4), info: I('Are goods reaching their destination?', 'Completed trips ÷ total trips; in-transit count alongside', 'Season → movement → district → phase', { field: 'tripPct', dir: 1, fmt: 'pct', tone: [0.6, 0.4], go: ['all', 'gps'] }) }; },
      8: function () { const list = dn ? mandalsOf(dn).map(function (m) { return { name: m.name, v: m.v }; }) : D.map(function (d) { return { name: d.name, v: distVals(d.name) }; }); list.sort(function (a, b) { return a.v.procPct - b.v.procPct; }); const lo = list.slice(0, 3); return { name: dn ? 'Mandal performance' : 'District performance', value: lo[0].name, detail: lo.map(function (x) { return x.name + ' ' + pct(x.v.procPct) + ' (' + fmtN(x.v.procured) + ' of ' + fmtN(x.v.target) + ' MT)'; }).join(' · '), t: 'bad', info: I('Where should senior officers intervene?', 'Lowest procurement achievement, with procured and target volumes shown next to each rate', 'District → mandal → PPC / mill', { field: 'procPct', dir: 1, fmt: 'pct', tone: [0.95, 0.8], go: ['proc', 'overview'] }) }; },
      9: function () { return { name: 'Allocation-to-lifting', value: pct(v.liftPct), detail: 'Rice ' + pct(v.liftPct) + ' · Sugar ' + pct(Math.min(1, v.liftPct * rr((dn || 's') + 'sg', 0.9, 1.05))) + ' · Red gram dal ' + pct(Math.min(1, v.liftPct * rr((dn || 's') + 'dl', 0.8, 1.0))), t: T(v.liftPct, 0.9, 0.8), x: v.liftPct, tgt: 1, tag: 'Proposed', info: I('Of the PDS quantity allocated for the month, how much has actually been lifted, i.e. picked up from MLS points and dispatched towards fair price shops. A low rate means stock is still sitting at MLS points and shops risk running short.', 'Quantity lifted (dispatched out of MLS points this month) ÷ quantity allocated for the month × 100, shown per commodity', 'Commodity → district → month → FPS', { field: 'liftPct', dir: 1, fmt: 'pct', tone: [0.9, 0.8], go: ['s2', 'overview'] }) }; },
      10: function () { return { name: 'Stock cover', value: fmtN(v.coverDays, 0) + ' days', detail: 'Days of issues the stock in buffer godowns can cover at the 30-day average issue rate', t: T(v.coverDays / 60, 0.75, 0.5), tag: 'Proposed', info: I('How long current stock lasts at the present rate of issue.', 'Stock in buffer godowns ÷ average daily issue (30-day lookback)', 'Commodity → godown / district', { field: 'coverDays', dir: 1, fmt: 'n', go: ['stor', 'overview'] }) }; },
      11: function () { return { name: 'Farmer payment timeliness', value: pct(v.pay24) + ' on time', detail: fmtCr(v.pending) + ' overdue · ' + fmtN(v.farmersPend) + ' cases', t: T(v.pay24, 0.9, 0.8), x: v.pay24, tgt: 1, tag: isState ? 'Reported' : 'Illustrative', info: I('Are procurement payments reaching farmers promptly?', 'Payments within 24 h ÷ payments due; overdue amount and cases by ageing', 'Season → district → PPC → ageing', { field: 'pay24', dir: 1, fmt: 'pct', tone: [0.9, 0.8], go: ['proc', 'fin'] }) }; },
      12: function () { let gl = []; (dn ? [dn] : D.map(function (d) { return d.name; })).forEach(function (x) { gl = gl.concat(grievOf(x)); }); const op = gl.filter(function (g) { return g.closeH === null; }); const due = gl.filter(function (g) { return g.dueNow; }); const sla = due.filter(function (g) { return g.within; }).length / (due.length || 1); const ab = function (a, b) { return op.filter(function (g) { return g.ageH >= a * 24 && g.ageH < b * 24; }).length; }; return { name: 'Grievances', value: fmtN(op.length) + ' open', detail: 'PGRS + IVRS · ageing < 2 d ' + fmtN(ab(0, 2)) + ' · 2–7 d ' + fmtN(ab(2, 7)) + ' · > 7 d ' + fmtN(ab(7, 1e9)) + ' · ' + pct(sla) + ' resolved and validated within SLA', t: T(sla, 0.9, 0.8), tag: 'Proposed', info: I('Are public issues being resolved?', 'Open cases by age band; resolved within SLA ÷ resolved cases', 'Channel → district → RSK / FPS', { fn: function (d) { return grievOf(d).filter(function (g) { return g.closeH === null; }).length; }, dir: -1, fmt: 'n', go: ['all', 'alerts'] }) }; }
    };
    const CREC = { 1: 'prep', 2: 'prep', 3: 'ppc', 4: 'mills', 5: 'veh', 6: 'veh', 7: 'veh', 8: 'ppc', 9: 'mls', 10: 'godowns', 11: 'lots', 12: 'inc' };
    const ORD = { all: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], proc: [11, 3, 7, 8, 6, 1, 2, 4, 5, 9, 10, 12], mill: [4, 7, 6, 8, 10, 11, 1, 2, 3, 5, 9, 12], between: [1, 2, 3, 4, 5, 9, 10, 12, 8, 6, 7, 11] };
    if (mode === 'home' && role === 'comm') secs.push({ title: 'Quick view', sub: 'Actual, target, variance and data freshness' + (sk !== 'all' ? ' · ordered for the ' + SEASONS[sk].short.toLowerCase() : '') + scopeTxt, items: ORD[sk].map(function (id) { const o = C12[id](); o.info = Object.assign({}, o.info, { rec: CREC[id] }); o.uid = 'c' + id + (dn || ''); o.n = 'C' + id; o.group = 'Quick view'; return self.catItem(o); }) });
    const REG = {
      prep: ['Season readiness KPIs', 'Counts with rates; NA shown where a district has not reported', [
        function () { return C12[1](); },
        function () { return { name: 'e-Panta registered farmers & extent', value: fmtN(v.regFarm), detail: fmtN(v.regAcres) + ' acres registered', info: I('How many farmers and how much land are registered this season.', 'Source-reported farmer count and acres (tracked separately)', 'Season → district → mandal', { field: 'regFarm', dir: -1, fmt: 'n' }) }; },
        function () { return C12[2](); },
        function () { return { name: 'PSA staffing fill rate', value: pct(v.psaPct), detail: fmtN(v.psaApp) + ' of ' + fmtN(v.psaReq) + ' staff appointed (3 per PPC)', t: T(v.psaPct, 0.9, 0.75), x: v.psaPct, tgt: 1, info: I('Are PPCs staffed to operate?', 'PSA staff appointed ÷ PSA staff required', 'Season → district → PPC', { field: 'psaPct', dir: 1, fmt: 'pct', tone: [0.9, 0.75] }) }; },
        function () { return C12[5](); },
        function () { return { name: 'Vehicle approval rate', value: pct(v.vehApprPct), detail: fmtN(v.vehAppr) + ' of ' + fmtN(v.regVeh) + ' registered vehicles approved', t: T(v.vehApprPct, 0.9, 0.8), x: v.vehApprPct, tgt: 1, info: I('Share of registered vehicles cleared for use.', 'Vehicles approved ÷ vehicles registered', 'Season → district → mandal', { field: 'vehApprPct', dir: 1, fmt: 'pct', tone: [0.9, 0.8] }) }; },
        function () { const x = Math.min(1, v.ebgPct); return { name: 'e-BG collection / in force', value: '₹' + fmtN(v.bg, 1) + ' Cr', detail: pct(x) + ' of ₹' + fmtN(v.ebgT, 1) + ' Cr target', t: T(x, 0.95, 0.8), x: x, tgt: 1, info: I('Financial security held from millers.', 'e-BG amount in force ÷ target amount (₹ crore)', 'Season → district → mill', { field: 'ebgPct', dir: 1, fmt: 'pct', tone: [0.95, 0.8] }) }; },
        function () { const x = pv(15); return { name: 'PPC-to-mill tagging rate', value: P(x), detail: x === null ? 'Not reported' : fmtN(Math.round(v.rsk * (1 - x))) + ' PPCs still to tag', t: T(x, 0.9, 0.75), x: x, tgt: 1, info: I('Every PPC needs a receiving mill.', 'PPCs tagged to mills ÷ total PPCs; balance to be tagged', 'Season → district → PPC / mill', { fn: function (d) { return pv(15, d); }, dir: 1, fmt: 'pct', tone: [0.9, 0.75] }) }; },
        function () { const x = pv(16); return { name: 'Mill target allocation rate', value: P(x), detail: x === null ? 'Not reported' : fmtN(Math.round(v.mills * x)) + ' of ' + fmtN(v.mills) + ' mills have targets', t: T(x, 0.9, 0.75), x: x, tgt: 1, info: I('Mills with procurement / CMR targets allotted.', 'Mills with target allocated ÷ total mills', 'Season → district → mill', { fn: function (d) { return pv(16, d); }, dir: 1, fmt: 'pct', tone: [0.9, 0.75] }) }; },
        function () { const x = Math.min(1, v.gunPct); return { name: 'Gunny positioning rate', value: pct(x), detail: fmtN(v.gunPos, 1) + ' of ' + fmtN(v.gunReq, 1) + ' lakh bags positioned', t: T(x, 0.95, 0.85), x: x, tgt: 1, info: I('Once-used quality gunnies positioned for the season.', 'Gunnies positioned ÷ gunnies required', 'Season → district → PPC / mill', { field: 'gunPct', dir: 1, fmt: 'pct', tone: [0.95, 0.85] }) }; }
      ]],
      s2: ['MLS lifting KPIs', 'Proposed addition · confirm source and units before go-live', [
        function () { return C12[9](); }
      ]],
      fps: ['FPS service KPIs', 'Proposed additions · confirm source, units and definitions before go-live', [
        function () { const x = rr((dn || 's') + 'txs', 0.94, 0.99); return { name: 'Distribution transaction success', value: pct(x), detail: 'Successful ePoS transactions ÷ attempts', t: T(x, 0.97, 0.94), x: x, tgt: 1, tag: 'Proposed', info: I('Are beneficiaries served at the first attempt?', 'Successful transactions ÷ attempts (denominator to be labelled)', 'Commodity → district → FPS → day') }; },
        function () { return { name: 'FPS stockout days', value: fmtN(v.stockout), detail: 'FPS-days without a required commodity this month', t: T(1 - v.stockout / 60, 0.8, 0.5), tag: 'Proposed', info: I('Where shops ran out while service was expected.', 'Count of source-confirmed stockout days', 'Commodity → district → FPS → month', { field: 'stockout', dir: -1, fmt: 'n' }) }; }
      ]],
      stor: ['Supply chain KPIs', 'Proposed additions · need usable stock and dispatch / receipt feeds', [
        function () { return C12[10](); },
        function () { const st1 = function (d) { const l = (d ? [d] : D.map(function (x) { return x.name; })).reduce(function (a, x) { return a.concat(s1Intra(x)); }, []); const rc = l.filter(function (r) { return r.transit !== null; }); const late = l.filter(function (r) { return r.transit !== null ? r.transit > r.sched : r.dispH > r.sched; }).length; return { h: rc.reduce(function (a, r) { return a + r.transit; }, 0) / (rc.length || 1), late: late }; }; const o = st1(dn); return { name: 'Dispatch-to-receipt time (Stage-I)', value: fmtN(o.h, 1) + ' h', detail: fmtN(o.late) + ' consignments received late or still on the road past schedule', t: T(1 - o.h / 24, 0.6, 0.4), tag: 'Proposed', info: I('How long Stage-I consignments take from dispatch to receipt, and how many are late.', 'Average (receipt time − dispatch time) over received consignments; late = beyond the scheduled transit time', 'District → route → consignment', { fn: function (d) { return st1(d).h; }, fmt: 'h', dir: -1, go: ['s1', 'overview'] }) }; }
      ]],
      cmr: ['Quality KPIs', 'Proposed additions · keep quantity-based and lot-based rates distinct', [
        function () { const qf = function (d) { return d ? rr(d + 'qrq', 0.004, 0.03) : D.reduce(function (a, x) { return a + rr(x.name + 'qrq', 0.004, 0.03); }, 0) / D.length; }; const lf = function (d) { return d ? rr(d + 'qrl', 0.01, 0.05) : D.reduce(function (a, x) { return a + rr(x.name + 'qrl', 0.01, 0.05); }, 0) / D.length; }; const q = qf(dn), l = lf(dn); return { name: 'Quality rejection rate', value: fmtN(q * 100, 2) + '% by quantity', detail: fmtN(l * 100, 1) + '% of lots rejected', t: T(1 - q * 20, 0.6, 0.4), tag: 'Proposed', info: I('How much rice fails quality checks.', 'Rejected quantity ÷ inspected quantity; rejected lots ÷ inspected lots', 'Commodity → district → PPC / mill → reason', { fn: qf, fmt: 'pct2', dir: -1 }) }; }
      ]],
      proc: ['Payment timeliness', 'Overdue amount and cases by ageing', [
        function () { return C12[11](); }
      ]],
      alerts: ['Grievance KPIs', 'Proposed additions · SLA and age bands to be agreed', [
        function () { return C12[12](); },
        function () { const xf = function (d) { return d ? rr(d + 'rep', 0.04, 0.15) : D.reduce(function (a, y) { return a + rr(y.name + 'rep', 0.04, 0.15); }, 0) / D.length; }; const x = xf(dn); return { name: 'Repeat issues', value: pct(x), detail: 'Grievances reopened or repeated within 30 days', t: T(1 - x * 4, 0.7, 0.5), tag: 'Proposed', info: I('Problems that keep coming back.', 'Repeat grievances ÷ resolved grievances', 'Category → district → channel', { fn: xf, fmt: 'pct', dir: -1 }) }; }
      ]]
    };
    const r = REG[mode === 'glance' && this.state.glance === 'fps' ? 'fps' : mode];
    if (r && path.length <= 1 && mode !== 'prep') secs.push({ title: r[0], sub: r[1] + scopeTxt, items: r[2].map(function (f, i) { const o = f(); o.uid = mode + 'r' + i + (dn || ''); o.n = 'R' + (i + 1); o.group = r[0]; return self.catItem(o); }) });
    return secs;
  }

  /* ---------- KPI framework scorecards ---------- */
  scoreSections(mode, path, stage) {
    const depth = path.length;
    const SEC_OK = { home: 1, proc: 1, cmr: 1, stor: 1, s1: 1, s2: 1, fin: 1, alerts: 1 }; if (!SEC_OK[mode]) return [];
    const v = depth === 0 ? stateVals() : depth === 1 || mode === 'alerts' ? distVals(path[0]) : (mandalById(path[1]) || { v: distVals(path[0]) }).v;
    const isState = depth === 0;
    const sc = isState ? 'state' : path.slice(0, 2).join('|');
    const X = function (id, a, b) { if (isState) { let t = 0; D.forEach(function (d) { t += rr(d.name + 'k' + id, a, b); }); return t / D.length; } return rr(sc + 'k' + id, a, b); };
    const pc2 = function (x) { return fmtN(x * 100, 2) + '%'; };
    const ds = D.map(function (d) { return { name: d.name, p: distVals(d.name).procPct }; }).sort(function (a, b) { return a.p - b.p; });
    const N = {
      1: ['Target achievement', 'Paddy procured ÷ target × 100'], 2: ['Gap to target', 'Target − paddy procured'], 3: ['Mill readiness', 'Mills that received paddy ÷ planned mills × 100'], 4: ['PPCs active', 'PPCs where procurement started ÷ total PPCs × 100'],
      5: ['Farmer payment coverage', 'Farmers paid ÷ farmers recorded × 100'], 6: ['Payment value coverage', 'Amount paid ÷ amount generated × 100'], 7: ['Payment within 24 hours', 'Payments within 24 h ÷ total payments × 100'],
      8: ['Gunny, labour & transport paid on time', 'Gunny, labour and transport payments within 24 h, 48 h and beyond ÷ total'], 9: ['e-BG available against paddy collected', 'e-BG value from millers ÷ value of paddy issued to them × 100'],
      10: ['District target achievement', 'District procurement ÷ district target × 100'], 11: ['Avg paddy unloading time at mills', 'Arrival at mill to unloading complete ÷ vehicles unloaded'], 12: ['Farmer feedback score (QR at RSKs)', 'Positive QR responses ÷ valid responses × 100'], 13: ['Grievance resolution within SLA', 'Resolved within prescribed time ÷ grievances due × 100'],
      '14a': ['CMR delivered vs obligation — CSC', 'CMR acknowledged ÷ CMR due × 100'], '14b': ['CMR delivered vs obligation — FCI', 'CMR acknowledged ÷ CMR due × 100'], 15: ['Milling turnaround time', 'First CMR delivery date − first paddy acknowledgement date at the mill (cmr_start_date − paddy_ack_date), averaged over mills with both dates'],
      16: ['Stock accuracy', '1 − |physical − book| ÷ book stock'], 17: ['Storage loss / gain', 'Opening + receipts − issues − closing stock'], 18: ['Capacity utilisation', 'Occupied capacity ÷ usable capacity × 100'], 19: ['Stock ageing', 'Quantity held beyond target storage period'], 20: ['Lot traceability', 'Lots with full location & movement records ÷ total lots'], 21: ['CMR quality acceptance', 'CMR lots accepted ÷ lots inspected × 100'],
      22: ['On-time delivery', 'Trips arriving within schedule ÷ total trips × 100'], 23: ['Transit time', 'Average dispatch-to-receipt time'], 24: ['Transit shortage', '(Dispatched − received) ÷ dispatched'], 25: ['Vehicle turnaround time', 'Average time from vehicle reporting to release'], 26: ['Mode-wise dispatch plan achievement', 'Dispatched by mode ÷ planned for that mode × 100'],
      27: ['Inter-district on-time delivery', 'Consignments within schedule ÷ total, by mode'], 28: ['Inter-district transit time', 'Average dispatch-to-receipt, road and rail'], 29: ['Inter-district shortage / damage', 'Short or damaged ÷ quantity dispatched × 100'], 30: ['Freight cost per quintal (road / rail)', 'Freight cost ÷ quantity delivered by that mode'],
      31: ['Dispatch plan achievement', 'Quantity dispatched ÷ quantity planned × 100'], 32: ['On-time, in-full delivery', 'Deliveries on time & complete ÷ total × 100'], 33: ['Acknowledgement turnaround', 'Delivery to receipt confirmation'], 34: ['Last-mile shortage / damage', 'Short or damaged ÷ quantity dispatched × 100'], 35: ['Freight cost per quintal', 'Stage-II freight cost ÷ quantity delivered'], 36: ['Monthly physical verifications', 'Locations verified ÷ locations scheduled this month'], 37: ['Stock variance rate', '|Physical − book| ÷ book stock × 100'],
      38: ['CMR cycle time', 'Days from paddy procurement to CMR acceptance'], 39: ['Cost per quintal delivered', 'Procurement + milling + storage + transport ÷ accepted CMR'], 40: ['Reconciliation closure', 'Reconciled within target period ÷ total transactions'], 41: ['Pending quantity', 'CMR due − CMR acknowledged, split into dispatched-awaiting-acknowledgement and not yet dispatched']
    };
    const o = function (value, detail, t) { return { value: value, detail: detail, t: t || '' }; };
    /* registers in scope, so these KPIs add up to the record sections on the tab */
    const rDns = depth ? [path[0]] : D.map(function (d) { return d.name; }); const rMid = depth >= 2 && mode !== 'alerts' ? path[1] : null;
    const reg = function (fn, f) { let out = []; rDns.forEach(function (dn) { out = out.concat(fn(dn)); }); return out.filter(function (r) { return (!rMid || r.mid === rMid || (r.mid === undefined && r.mandal === LBL[rMid])) && (!f || f(r)); }); };
    const sumF = function (l, f) { return l.reduce(function (a, r) { return a + (f(r) || 0); }, 0); };
    const V = {
      1: function () { return o(pct(v.procPct), fmtN(v.procured) + ' of ' + fmtN(v.target) + ' MT', tone(v.procPct, 0.95, 0.8)); },
      2: function () { return o(fmtN(Math.max(0, v.target - v.procured)) + ' MT', 'Remaining to procure', tone(v.procPct, 0.95, 0.8)); },
      3: function () { return o(pct(v.millReady), fmtN(v.millsAct) + ' of ' + fmtN(v.mills) + ' mills', tone(v.millReady, 0.85, 0.7)); },
      4: function () { return o(pct(v.ppcPct), fmtN(v.ppcAct) + ' of ' + fmtN(v.rsk) + ' PPCs', tone(v.ppcPct, 0.9, 0.8)); },
      5: function () { return o(pc2(v.farmPaidPct), fmtN(v.farmers - v.farmersPend) + ' of ' + fmtN(v.farmers) + ' farmers', tone(v.farmPaidPct, 0.99, 0.95)); },
      6: function () { return o(pc2(v.payVal), '₹' + fmtN(v.paid, 2) + ' Cr of ₹' + fmtN(v.valueCr, 2) + ' Cr', tone(v.payVal, 0.99, 0.95)); },
      7: function () { return o(pct(v.pay24), 'Share of all farmer payments', tone(v.pay24, 0.9, 0.8)); },
      8: function () { const pd = reg(incBills, function (b) { return b.payH !== null; }); const n = pd.length || 1; const sh = function (l, bd) { return l.filter(function (b) { return b.band === bd; }).length / (l.length || 1); }; const a = sh(pd, 'Within 24 h'), b = sh(pd, '24–48 h'); const ty = function (t) { return sh(pd.filter(function (x) { return x.type === t; }), 'Within 24 h'); }; return o(pct(a) + ' in 24 h', '24–48 h ' + pct(b) + ' · beyond 48 h ' + pct(Math.max(0, 1 - a - b)) + ' · gunny ' + pct(ty('Gunny')) + ', labour ' + pct(ty('Labour (hamali)')) + ', transport ' + pct(ty('Transport')) + ' in 24 h · ' + fmtN(n) + ' paid bills', tone(a, 0.8, 0.65)); },
      9: function () { const x = X(9, 0.84, 1.06); return o(pct(x), 'e-BG value vs paddy issued to millers', tone(x, 1, 0.9)); },
      10: function () { if (isState) return o(fmtN(ds[0].p * 100, 0) + '% – ' + fmtN(ds[ds.length - 1].p * 100, 0) + '%', 'Lowest: ' + ds.slice(0, 4).map(function (x) { return x.name; }).join(', '), 'warn'); const r = ds.map(function (x) { return x.name; }).reverse().indexOf(path[0]) + 1; const dv = distVals(path[0]); return o(pct(dv.procPct), path[0] + ' ranks ' + r + ' of ' + D.length + ' districts', tone(dv.procPct, 0.95, 0.8)); },
      11: function () { const h = X(11, 3.2, 8.5); return o(fmtN(h, 1) + ' h', 'Per vehicle, arrival to unloading complete', tone(h, 4, 6, false)); },
      12: function () { const x = X(12, 0.76, 0.94); return o(pct(x) + ' positive', 'Avg rating ' + fmtN(X('12r', 3.6, 4.5), 1) + ' / 5 · ' + fmtN(v.farmers * X('12n', 0.08, 0.2)) + ' responses', tone(x, 0.85, 0.75)); },
      13: function () { const due = reg(grievOf, function (g) { return g.dueNow; }); const w = due.filter(function (g) { return g.within; }).length; const x = w / (due.length || 1); return o(pct(x), fmtN(w) + ' of ' + fmtN(due.length) + ' grievances due were resolved and validated within SLA', tone(x, 0.9, 0.8)); },
      '14a': function () { return Object.assign(o('Integration required', 'CSC obligation and CSC-tagged acknowledgements are not in the integrated feeds', 'na'), { unavail: 'Integration required. CMR delivered against the State pool (CSC) obligation needs the CSC CMR allotment per mill and acknowledgements tagged to CSC godowns. The integrated mill feeds give only total CMR acknowledged per mill, so no CSC figure is shown.' }); },
      '14b': function () { return Object.assign(o('Integration required', 'FCI obligation and FCI-tagged acknowledgements are not in the integrated feeds', 'na'), { unavail: 'Integration required. CMR delivered against the FCI obligation needs the FCI CMR allotment per mill and acknowledgements at FCI godowns. The integrated mill feeds give only total CMR acknowledged per mill, so no FCI figure is shown.' }); },
      15: function () { const c = cmrStatsPath(path.slice(0, 2)); return c.turnAvg === null ? Object.assign(o('Data unavailable', 'No mill has both a paddy receipt and a CMR delivery date yet', 'na'), { unavail: 'Data unavailable: no mill in this area has both dates yet.' }) : o(fmtN(c.turnAvg, 1) + ' days', 'Paddy receipt at mill → first CMR delivery · ' + fmtN(c.nTurn) + ' mills · ' + fmtN(c.late15) + ' over 15 days', tone(c.turnAvg, 12, 16, false)); },
      16: function () { const g = reg(godownBook); const b = sumF(g, function (r) { return r.book; }); const x = 1 - sumF(g, function (r) { return Math.abs(r.phys - r.book); }) / (b || 1); return o(fmtN(x * 100, 2) + '%', 'Latest stocktake, ' + fmtN(g.length) + ' buffer godowns', tone(x, 0.995, 0.99)); },
      17: function () { const g = reg(godownBook); const b = sumF(g, function (r) { return r.book; }); const x = sumF(g, function (r) { return r.phys - r.book; }) / (b || 1) * 100; const a = Math.abs(x); return o((x > 0 ? '+' : '') + fmtN(x, 2) + '%', fmtN(sumF(g, function (r) { return r.phys - r.book; }), 1) + ' MT of book stock this month · tolerance ±0.25%', a <= 0.15 ? 'good' : a <= 0.25 ? 'warn' : 'bad'); },
      18: function () { return o(pct(v.util), fmtMT(v.stock) + ' in ' + fmtMT(v.cap) + ' usable', tone(v.util, 0.85, 0.93, false)); },
      19: function () { return o(fmtMT(v.aged), pct(v.aged / (v.stock || 1)) + ' of stock beyond target period', tone(v.aged / (v.stock || 1), 0.08, 0.14, false)); },
      20: function () { const l = reg(lotsOf); const c = l.filter(function (r) { return r.complete; }).length; const x = c / (l.length || 1); return o(pct(x), fmtN(c) + ' of ' + fmtN(l.length) + ' lots with complete location and movement records', tone(x, 0.97, 0.9)); },
      21: function () { const x = X(21, 0.9, 0.99); return o(pct(x), 'CMR lots accepted at delivery points', tone(x, 0.97, 0.93)); },
      22: function () { const x = X(22, 0.76, 0.95); return o(pct(x), 'Stage-I trips within schedule', tone(x, 0.9, 0.8)); },
      23: function () { const h = X(23, 5, 14); return o(fmtN(h, 1) + ' h', 'Dispatch to receipt', tone(h, 8, 12, false)); },
      24: function () { const x = X(24, 0.04, 0.4); return o(fmtN(x, 2) + '%', 'of dispatched quantity', tone(x, 0.1, 0.25, false)); },
      25: function () { const h = X(25, 2.2, 6.5); return o(fmtN(h, 1) + ' h', 'Reporting to release', tone(h, 3, 5, false)); },
      26: function () { const a = X('26r', 0.82, 0.99), b = X('26l', 0.65, 0.95); return o(pct(a) + ' / ' + pct(b), 'Road / rail vs plan', tone(Math.min(a, b), 0.9, 0.8)); },
      27: function () { const a = X('27r', 0.75, 0.93), b = X('27l', 0.6, 0.88); return o(pct(a) + ' / ' + pct(b), 'Road / rail on time', tone(Math.min(a, b), 0.85, 0.75)); },
      28: function () { return o(fmtN(X('28r', 12, 26), 0) + ' h / ' + fmtN(X('28l', 30, 60), 0) + ' h', 'Road / rail, dispatch to receipt'); },
      29: function () { const x = X(29, 0.05, 0.5); return o(fmtN(x, 2) + '%', 'Short or damaged, all modes', tone(x, 0.15, 0.3, false)); },
      30: function () { return o('₹' + fmtN(X('30r', 52, 78)) + ' / ₹' + fmtN(X('30l', 38, 58)), 'Road / rail per quintal'); },
      31: function () { const x = v.s2Lift / (v.s2Allot || 1); return o(pct(x), fmtMT(v.s2Lift) + ' of ' + fmtMT(v.s2Allot) + ' planned', tone(x, 0.9, 0.8)); },
      32: function () { const x = X(32, 0.78, 0.95); return o(pct(x), 'MLS → FPS deliveries', tone(x, 0.9, 0.8)); },
      33: function () { const h = X(33, 3, 22); return o(fmtN(h, 1) + ' h', 'Delivery to FPS receipt on ePoS', tone(h, 6, 12, false)); },
      34: function () { const x = X(34, 0.04, 0.35); return o(fmtN(x, 2) + '%', 'of dispatched quantity', tone(x, 0.1, 0.2, false)); },
      35: function () { return o('₹' + fmtN(X(35, 26, 52)), 'per quintal, Stage-II'); },
      36: function () { const l = reg(verifReg, function (r) { return r.et === 's2'; }); const y = l.length; const x = l.filter(function (r) { return r.status === 'Completed'; }).length; return o(fmtN(x) + ' of ' + fmtN(y), pct(x / (y || 1)) + ' of MLS points verified this month', tone(x / (y || 1), 0.9, 0.75)); },
      37: function () { const l = reg(verifReg, function (r) { return r.et === 's2' && r.phys !== null; }); const x = sumF(l, function (r) { return Math.abs(r.phys - r.book); }) / (sumF(l, function (r) { return r.book; }) || 1) * 100; return o(fmtN(x, 2) + '%', 'Physical vs book at ' + fmtN(l.length) + ' MLS points verified this month', tone(x, 0.3, 0.6, false)); },
      38: function () { return Object.assign(o('Integration required', 'Completion (final acceptance) date per mill allotment is not in the feeds', 'na'), { unavail: 'Integration required. CMR cycle time runs from paddy procurement to acceptance of the last CMR consignment against the allotment. The feeds give the first CMR delivery date (see Milling turnaround) but not the completion date, so the full cycle cannot be measured yet.' }); },
      39: function () { return o('₹' + fmtN(X(39, 3780, 4060)), 'per quintal of accepted CMR'); },
      40: function () { const x = X(40, 0.8, 0.97); return o(pct(x), 'Reconciled within target period', tone(x, 0.95, 0.85)); },
      41: function () { const c = cmrStatsPath(path.slice(0, 2)); return o(fmtMT(c.bal), 'Dispatched, awaiting acknowledgement ' + fmtMT(c.transit) + ' · not yet dispatched ' + fmtMT(c.notDisp), c.bal / (c.due || 1) > 0.5 ? 'bad' : 'warn'); }
    };
    const REPD = { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 10: 1 };
    const self = this;
    const FF = { 1: ['procPct', 1, 'pct', [0.95, 0.8]], 2: ['gap', -1, 'mtn'], 3: ['millReady', 1, 'pct', [0.85, 0.7]], 4: ['ppcPct', 1, 'pct', [0.9, 0.8]], 5: ['farmPaidPct', 1, 'pct2', [0.99, 0.95]], 6: ['payVal', 1, 'pct2', [0.99, 0.95]], 7: ['pay24', 1, 'pct', [0.9, 0.8]], 10: ['procPct', 1, 'pct', [0.95, 0.8]], 18: ['util', -1, 'pct', [0.85, 0.93, false]], 19: ['aged', -1, 'mt'], 31: ['liftPct', 1, 'pct', [0.9, 0.8]] };
    const TG = { 1: v.procPct, 3: v.millReady, 4: v.ppcPct, 5: v.farmPaidPct, 6: v.payVal, 7: v.pay24 };
    const SEC = {
      proc: [['Procurement KPIs', 'Paddy purchase, PPC and mill coverage, farmer payment', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]]],
      cmr: [['Milling / CMR KPIs', 'Conversion of procured paddy into CMR and delivery against obligation', [15, 21, 41]]],
      stor: [['Storage KPIs', 'Accuracy, utilisation and traceability of stock', [16, 17, 18, 19, 20, 21]]],
      s1: [['Stage-I transport KPIs', 'Buffer storage to MLS points, including inter-district road and rail', [22, 23, 24, 25, 26, 27, 28, 29, 30]]],
      s2: [['Stage-II transport KPIs', 'MLS point to fair price shop, with monthly verification', [31, 32, 33, 34, 35, 36, 37]]],
      fin: [['Payment & cost KPIs', 'Farmer payments, gunny / labour / transport payments, e-BG, unit cost and reconciliation', [5, 6, 7, 8, 9, 39, 40]]],
      alerts: [['Farmer voice & grievance KPIs', 'QR feedback at RSKs and grievance SLA', [12, 13]]]
    };
    const secs = SEC[mode]; if (!secs) return [];
    return secs.map(function (sec) {
      return { title: sec[0], sub: sec[1] + (isState ? ' · state' : ' · ' + (LBL[path[Math.min(depth, 2) - 1]] || path[0])), items: sec[2].map(function (id) {
        const r = V[id](); const rep = isState && REPD[id]; const ff = FF[id]; const tg = TG[id]; const IDREC = { 8: 'lots', 9: 'mills', 11: 'mills', 12: 'ppc', 13: 'inc', '14a': 'mills', '14b': 'mills', 15: 'mills:late', 21: 'mills', 38: 'mills', 39: 'lots', 40: 'lots', 41: 'mills:pending', 36: 'mls', 37: 'mls' };
        return self.catItem({ uid: 'f' + id + sc, n: 'KPI ' + String(id).replace(/[ab]$/, ''), name: N[id][0], value: r.value, detail: r.detail, t: r.t, tag: rep ? 'Reported' : 'Illustrative', x: tg ? tg : undefined, tgt: tg ? 1 : undefined, group: sec[0], info: Object.assign({ def: r.detail, calc: N[id][1], drill: 'Season → district → mandal', rec: IDREC[id], unavail: r.unavail, kid: String(id), kmode: mode }, ff ? { field: ff[0], dir: ff[1], fmt: ff[2], tone: ff[3] } : {}) });
      }) };
    });
  }

  renderVals() {
    const self = this; const s = this.state;
    const isDM = s.role === 'dm';
    const path = this.curPath();
    const setSeas = function (l) { const o = { seasons: l, season: l.length === 0 ? 'all' : l.length === 1 ? l[0] : 'multi' }; saveSeas(o); self.setState(Object.assign(o, { mapMetric: '', kpiOpen: null })); };
    const SELS = s.season === 'custom' ? [] : (s.seasons || []).filter(function (k) { return SEAS_ID[k]; });
    const MULTI = SELS.length > 1;
    const inSel = function (k) { return SELS.indexOf(k) >= 0; };
    const LENSES = SELS.map(function (k) { return SEAS_ID[k].lens; }).filter(Boolean);
    this._seasOK = null; this._lenses = [];
    const SID = SELS.length === 1 ? SEAS_ID[SELS[0]] : MULTI ? { short: SELS.map(function (k) { return SEAS_NAME[k]; }).join(', '), long: SELS.map(function (k) { return SEAS_ID[k].long; }).join(', '), lens: LENSES.length ? (LENSES.length === 1 ? LENSES[0] : 'multi') : null } : null;
    this._sid = SID ? (MULTI ? 'multi' : SELS[0]) : null;
    const sk = SID ? (SID.lens && SID.lens !== 'multi' ? SID.lens : 'all') : SEASONS[s.season] ? s.season : 'all'; const SE = SEASONS[sk];
    if (SID && SID.lens) { this._seasOK = function (stg) { return !STAGE_SEASON[stg] || inSel(STAGE_SEASON[stg]); }; this._lenses = LENSES.filter(function (x, i, a) { return a.indexOf(x) === i; }); }
    const mode = s.module === 'overview' ? (s.stage === 'all' ? 'home' : s.stage) : s.module;
    /* a named season with no records for this view shows "No data available" */
    const stgOf = mode === 'glance' ? (GLANCE[s.glance] || {}).et : mode === 'home' ? null : mode;
    const ownSeas = mode === 'cctv' ? 'r25' : STAGE_SEASON[stgOf] || null; /* CCTV is only at buffer godowns and MLS points */
    const blank = !!SID && !s.pivot && (!SID.lens || (!!ownSeas && !inSel(ownSeas)));
    const ndPop = function (name) { return function () { self.setState({ kpiOpen: null, rxRec: { title: name, sub: SID ? SID.long : '', facts: [{ k: 'Status', v: ND }, { k: 'Why', v: 'No records of this measure are loaded for ' + (SID ? SID.long : 'this season') + '.' }, { k: 'Where to see it', v: 'Choose All seasons, or the season the records belong to.' }], steps: [], links: [] } }); }; };
    /* view history, so any click that changes the view can be undone with Back */
    const navSnap = { module: s.module, stage: s.stage, glance: s.glance, path: (s.path || []).slice(), prepView: s.prepView, prepParam: s.prepParam, prepMandal: s.prepMandal, prepRpt: s.prepRpt, pivot: s.pivot };
    const navKey = JSON.stringify(navSnap);
    if (this._navKey !== undefined && this._navKey !== navKey) { if (!this._navBack) { this._navHist = this._navHist || []; this._navHist.push(this._navSnap); if (this._navHist.length > 40) this._navHist.shift(); } this._navBack = false; }
    this._navKey = navKey; this._navSnap = navSnap;
    const navHist = this._navHist || [];
    const prevNav = navHist.length ? navHist[navHist.length - 1] : null;
    const navLabel = function (n) { if (!n) return ''; const m = n.module === 'overview' ? (n.stage === 'all' ? 'Overview' : (STAGES.filter(function (x) { return x.k === n.stage; })[0] || { label: n.stage }).label) : n.module === 'prep' ? 'Preparedness' : n.module === 'alerts' ? 'Incidents' : n.module === 'gps' ? 'GPS tracking' : n.module === 'cctv' ? 'CCTV' : n.module === 'fin' ? 'Financials' : n.module === 'glance' ? 'At a glance' : n.module; const where = n.path && n.path.length ? ' · ' + (LBL[n.path[n.path.length - 1]] || n.path[n.path.length - 1]) : ''; return m + (n.pivot ? ' · pivot' : n.module === 'prep' && n.prepView && n.prepView !== 'overview' ? ' · ' + n.prepView : '') + where; };

    /* tabs */
    const stageItems = [{ k: 'all', label: 'All stages', num: '' }].concat(STAGES).map(function (st) {
      const on = !s.pivot && s.stage === st.k && s.module !== 'inbox';
      return { sk: st.k, isTab: true, isGlance: false, label: st.label, num: st.num || '', hot: SE.hotStages.indexOf(st.k) >= 0, cur: on ? 'page' : 'false', on: on, pick: function () { self.setState({ stage: st.k, module: s.module === 'glance' ? 'overview' : s.module, pivot: false, kpiOpen: null, path: self.curPath().slice(0, 1) }); } };
    });
    const NAVG = { cctv: ['mon', 'Monitoring', ['cctv', 'gps', 'img']], gps: null, img: null, news: ['media', 'Media', ['news', 'yt']], yt: null };
    const inboxNew = isDM ? this.inboxItems(s.dm).filter(function (x) { return !x.read; }).length : 0;
    const modItems = [{ k: 'overview', label: 'Overview' }].concat(MODS.filter(function (m) { return NAVG[m.k] !== null && m.k !== 'inbox'; }).map(function (m) { const g = NAVG[m.k]; return g ? { k: g[2].indexOf(s.module) >= 0 ? s.module : (s['last_' + g[0]] || g[2][0]), label: g[1], group: g[2] } : m; })).map(function (m) {
      const on = !s.pivot && (m.group ? m.group.indexOf(s.module) >= 0 : s.module === m.k);
      return { sk: m.k, isTab: true, isGlance: false, label: m.label, num: '', hot: SE.hotMods.indexOf(m.k) >= 0, cur: on ? 'page' : 'false', on: on, pick: function () { self.setState({ module: m.k, pivot: false, kpiOpen: null, path: self.curPath().slice(0, 1) }); } };
    }).concat([{ isTab: false, isGlance: true, on: !s.pivot && s.module === 'glance' }]);
    const sOrd = function (list) { if (!SID || !SID.lens) return list; const first = list.slice(0, 1), rest = list.slice(1); const key = function (t) { return t.sk; };
      const a = rest.filter(function (t) { return t.isTab && inSel(STAGE_SEASON[key(t)]); }), b = rest.filter(function (t) { return !(t.isTab && inSel(STAGE_SEASON[key(t)])); });
      a.forEach(function (t) { t.hot = true; }); return first.concat(a, b); };
    const decorate = function (list, top) { return sOrd(list.filter(Boolean)).map(function (t) { t.cls = (top ? 'tt' : 'lt') + (t.isGlance ? ' tsel' : '') + (t.on ? ' on' : ''); return t; }); };
    const topItems = decorate(s.transposed ? stageItems : modItems, true);
    const leftItems = decorate(s.transposed ? modItems : stageItems, false);
    if (isDM) { const ion = !s.pivot && s.module === 'inbox'; leftItems.push({ sk: 'inbox', isTab: true, isGlance: false, label: 'Inbox', num: inboxNew ? String(inboxNew) : '', cur: ion ? 'page' : 'false', on: ion, cls: 'lt ltinbox' + (ion ? ' on' : ''), pick: function () { self.setState({ module: 'inbox', pivot: false, kpiOpen: null, path: self.curPath().slice(0, 1) }); } }); }

    /* page */
    this._isState = path.length === 0;
    let page;
    if (mode === 'alerts') page = this.buildAlerts(path, s.stage);
    else if (mode === 'gps') page = this.buildGps(path, s.stage);
    else if (mode === 'cctv') page = this.buildCctv(path, s.stage);
    else if (mode === 'prep') page = this.buildPrep(path, s.stage, sk);
    else if (mode === 'glance') page = this.buildGlance(path, s.glance);
    else if (mode === 'intel') page = this.buildIntel(path);
    else if (mode === 'inbox') page = isDM ? this.buildInbox(path) : this.buildIntel(path);
    else if (mode === 'img') page = this.buildImg(path);
    else if (mode === 'news') page = this.buildNews(path);
    else if (mode === 'yt') page = this.buildYT(path);
    else page = this.buildStageLike(mode, path, s.stage, sk);
    const defaults = { imgRef: { has: false, seas: [], ex: [], note: '' }, inbox: { tiles: [], types: [], items: [], q: '', onQ: function () {}, markAll: function () {} }, deepInc: { on: false, go: function () {} }, pressOn: false, ytOn: false, press: { views: [], presets: [], sents: [], dept: { opts: [] }, paper: { opts: [] }, section: { opts: [] }, today: {}, items: [], pages: [] }, yt: { sents: [], chOpts: [], presets: [], sorts: [], items: [] }, queue: null, itrend: null, isIntel: false, intel: { isMain: true, isLog: false, tabMain: 'itab on', tabLog: 'itab', showMain: function () {}, showLog: function () {}, logTotal: '0', logF: { stage: 'all', mod: 'all', onStage: function () {}, onMod: function () {}, clear: function () {}, isF: false }, logEmpty: '', scope: '', recs: [], hasRecs: false, insights: [], faqs: [], msgs: [], hasMsgs: false, input: '', onInput: function () {}, onSubmit: function () {}, clearChat: function () {}, log: [], hasLog: false, noLog: true, logN: '0' }, flowN: 7, sChart: null, prepChart: null, chain: null, brief: { btn: false, n: 0, open: function () {}, items: [], has: false, none: true, loading: false, sub: '' }, isHome: false, showFlow: false, hasFilter: false, filter: '', hasPrep: false, prep: [], prepTitle: '', hasTiles: false, tiles: [], tilesTitle: '', hasChart: false, chart: { title: '', src: '', bars: [] }, hasDetail: false, detail: { title: '', src: '', facts: [], steps: [], planned: '', actual: '', trailColor: '#2B5FA5', gpsNote: '', cam: '', camTs: '' }, hasTable: false, table: { title: '', note: '', cols: [], rows: [], grid: '1fr', hasTotal: false, total: [], totalLabel: '', download: function () {} }, isPrep: false, prepUI: { views: [], sortBtns: [], topRisks: [], distAttn: [], grid: [], cmp: { cols: [], rows: [], grid: '1fr', sortNote: '' }, paramChips: [], p: { facts: [] }, pCrumbs: [], pTable: { cols: [], rows: [] }, rptBtns: [], rpt: { cols: [], rows: [] } }, distBtn: false, distLabel: '', hasPeriod: false, period: '', hasT2: false, t2: { title: '', note: '', cols: [], rows: [], grid: '1fr', hasTotal: false, total: [], totalLabel: '', download: function () {}, empty: false }, hasFacts: false, factsTitle: '', facts: [], flowNote: '', flowBands: [], ov: { scope: '', asOf: '', highLbl: '', pend: [], na: [], pendNote: '', attnTitle: '', attnSub: '', hasAttn: false, noAttn: false, noAttnTxt: '', attn: [], weak: [], mxTitle: '', mxSub: '', hasRows: false, noRows: false, emptyTxt: '', ms: { open: false, label: '', opts: [], toggle: function () {}, close: function () {}, all: function () {}, none: function () {}, attn: function () {} }, grid: '1fr', lvl: '', cols: [], rows: [], totLbl: '', total: [], redCnt: [], mxNote: '' }, flow: [], flowScope: '', scores: [], prio: [], rp: { title: '', sub: '', items: [] }, feed: [], kpis: [] };
    page = Object.assign(defaults, page);
    if (mode === 'home' && s.stage === 'all' && !s.pivot && path.length < 2) page.queue = this.incQueue(path);
    if (mode === 'alerts' && !s.pivot) page.itrend = this.incTrends(path, s.stage);
    page.queueOn = !!page.queue; page.itrendOn = !!page.itrend;
    if (!page.queue) page.queue = { tabs: [], note: '', rows: [], more: '', none: false, has: false, all: function () {} };
    if (!page.itrend) page.itrend = { period: '', scope: '', bars: [], metrics: [], liveNote: '' };
    if (mode !== 'intel' && !s.pivot) { const ak = mode + '|' + path.slice(0, 1).join('/') + '|' + s.stage + '|' + (s.seasons || []).join(',') + '|' + s.season + '|' + (s.dtFrom || '') + '|' + (s.dtTo || '') + '|' + (s.actLog || []).length; if (!this._aiC || this._aiC.k !== ak) { let v0 = null; try { v0 = this.aiSummary(mode, path, s.stage); } catch (e) { v0 = null; } this._aiC = { k: ak, v: v0 }; } page.aisum = this._aiC.v; }
    if (!page.aisum) page.aisum = { lead: '', items: [], has: false, open: function () {} };
    /* CCTV and GPS tabs: incidents KPI (incidents at CCTV-covered sites / raised by GPS) */
    if ((mode === 'cctv' || mode === 'gps') && !s.pivot && path.length < 2 && page.kpis) {
      const sOKi = this._seasOK || function () { return true; };
      const incF = mode === 'cctv' ? function (i) { return i.ent === 'Buffer godown' || i.ent === 'MLS point'; } : function (i) { return i.src === 'GPS'; };
      const pick2 = function (l) { return l.filter(function (i) { return incF(i) && (s.stage === 'all' || i.stage === s.stage) && sOKi(i.stage) && self.inWin(i.ageH); }); };
      const dnsI = path[0] ? [path[0]] : D.map(function (d) { return d.name; });
      let il = []; dnsI.forEach(function (dn) { il = il.concat(pick2(incidentsOf(dn))); });
      const c1 = il.filter(function (i) { return i.prio === 'P1'; }).length;
      const kk = this.mkK('Incidents', fmtN(il.length), (mode === 'cctv' ? 'open at buffer godowns & MLS points' : 'open GPS alerts') + ' · ' + fmtN(c1) + ' critical', tone(c1, 0, 3, false), mode === 'cctv' ? 'inc_cctv' : 'inc_gps');
      const agg = function (l) { return { open: l.length, p1: l.filter(function (i) { return i.prio === 'P1'; }).length, esc: l.filter(function (i) { return i.status === 'Escalated'; }).length }; };
      kk._info.tab = { cols: [['Critical', 'p1', 'n'], ['Escalated', 'esc', 'n']], res: ['Incidents', function (o) { return o.open; }, function (x) { return fmtN(x); }], f: function (dn) { return agg(pick2(incidentsOf(dn))); }, fm: function (mid, m) { return agg(pick2(incidentsOf(m.dn)).filter(function (i) { return i.mandal === m.name; })); } };
      kk._incF = pick2; page.kpis.splice(Math.min(3, page.kpis.length), 0, kk);
    }
    const baseL = isDM ? 1 : 0;
    if (!s.pivot && path.length === baseL && page.hasTable) { page.distBtn = true; page.distLabel = (s.showDist ? 'Hide ' : 'View ') + (isDM ? 'mandal' : 'district') + '-wise data'; if (!s.showDist) page.hasTable = false; }
    /* tables drill down in place: a row with something beneath it opens under itself; a record opens in a popup */
    const pageAt = function (p) { const prev = self._isState; let pg; if (mode === 'alerts') pg = self.buildAlerts(p, s.stage); else if (mode === 'gps') pg = self.buildGps(p, s.stage); else if (mode === 'cctv') pg = self.buildCctv(p, s.stage); else if (mode === 'prep') pg = self.buildPrep(p, s.stage, sk); else if (mode === 'glance') pg = self.buildGlance(p, s.glance); else pg = self.buildStageLike(mode, p, s.stage, sk); self._isState = prev; return pg || {}; };
    const capId = function (go) { let id = null; const od = self.drill, os = self.setState; self.drill = function (x) { id = x; }; self.setState = function () {}; try { go(); } catch (e) {} self.drill = od; self.setState = os; return id; };
    const TEXP = s.tExp || {};
    const recPop = function (p, name, rowFacts, title) { const ch = pageAt(p); rowFacts = (rowFacts || []).concat(mstFacts(ENT[p[p.length - 1]]));
      if (ch.hasDetail && ch.detail) { self.setState({ rxRec: { back: self.state.rxRec || null, title: ch.detail.title || name, sub: ch.detail.src || title || '', facts: ch.detail.facts || [], steps: ch.detail.steps || [], links: [] } }); return; }
      if (ch.hasTable && ch.table && ch.table.rows && ch.table.rows.length) { const tb = ch.table; const lab = tb.cols.map(function (c) { return c.label; }); tb.rows.forEach(function (r) { const go = r.drill; const id = go ? capId(go) : null; r.canDrill = !!id; r.noDrill = !id; r.drill = id ? function () { recPop(p.concat([id]), r.name, (r.cells || []).map(function (c, i) { return { k: lab[i + 1] || '', v: c.v }; }), tb.title); } : null; }); tb.count = fmtN(tb.rows.length) + ' row' + (tb.rows.length === 1 ? '' : 's'); self.setState({ rxRec: { back: self.state.rxRec || null, title: name, sub: tb.title, facts: rowFacts || [], steps: [], links: [], tbl: tb } }); return; }
      self.setState({ rxRec: { title: name, sub: title || '', facts: rowFacts || [], steps: [], links: [] } }); };
    const nest = function (tb, p, lvl) {
      if (!tb || !tb.rows) return;
      const labels = (tb.cols || []).map(function (c) { return c.label; });
      tb.rows.forEach(function (r) {
        r.hasSub = false; r.sub = { title: '', cols: [], rows: [], grid: '1fr' }; r.arrow = '';
        if (r.keepDrill) return;
        const go = r.drill; if (!go) return; const id = capId(go);
        const facts = (r.cells || []).map(function (c, i) { return { k: labels[i + 1] || '', v: c.v === '' ? '—' : c.v }; });
        if (!id) { r.drill = function () { self.setState({ rxRec: { title: r.name, sub: tb.title || '', facts: facts, steps: [], links: [] } }); }; return; }
        const cp2 = p.concat([id]); const key = cp2.join('/');
        if (lvl < 2) { const ck = JSON.stringify([mode, s.stage, sk, s.role, s.glance, self.windowH(), cp2]); self._kidC = self._kidC || {}; if (!(ck in self._kidC)) { const t0 = pageAt(cp2); self._kidC[ck] = !!(t0.hasTable && t0.table && t0.table.rows && t0.table.rows.length && !t0.hasDetail); }
          const ch = self._kidC[ck] && TEXP[key] ? pageAt(cp2) : null; if (self._kidC[ck]) {
          const op = !!TEXP[key]; r.arrow = op ? '▾ ' : '▸ ';
          r.drill = function () { const e2 = Object.assign({}, self.state.tExp || {}); e2[key] = !e2[key]; self.setState({ tExp: e2 }); };
          if (op && ch) { nest(ch.table, cp2, lvl + 1); r.hasSub = true; r.sub = ch.table; }
          return; } }
        r.drill = function () { recPop(cp2, r.name, facts, tb.title); };
      });
    };
    if (page.hasTable) nest(page.table, path, 0);
    if (page.hasT2) nest(page.t2, path, 1);
    page.kpiCls = (page.isHome || page.isPrep) ? 'kpis k3' : 'kpis';
    const maxD = mode === 'alerts' ? 1 : 2;
    page.scores = s.pivot ? [] : this.catalogSections(mode, path, sk).filter(function (x) { return x.title === 'Quick view'; }).concat(path.length > maxD ? [] : this.scoreSections(mode, path, s.stage), this.catalogSections(mode, path, sk).filter(function (x) { return x.title !== 'Quick view'; }));
    if ((sk !== 'all' || (SID && SID.lens === 'multi')) && !s.pivot) {
      const RX = { proc: /procure|target|gap|ppc|rsk|farmer|paid|payment|moisture|e-kyc|kyc|gunny|unloading|feedback|grievance|psa|mill readiness|e-bg|bank guarantee|fto|labour|transport paid|district performance|reconciliation|cost per/i,
        mill: /cmr|mill|milling|turnaround|stage-i(?!i)|route|deviation|trip|bank guarantee|quality|pending quantity|anomal|dispatch-to-receipt|freight|transit|consignment/i,
        between: /godown|storage|stock|aged|ageing|lot|stage-ii|mls|fps|distribut|lift|allot|verification|variance|capacity|cctv|camera|ration|beneficiar|acknowledg|last-mile|cover/i };
      const GEN = /incident(?!al)|critical|high|escalat|readiness|preparedness|parameter|reporting|forecast|vehicle|gps|device|open items|avg age|good|moderate|needs attention|registered|active|inactive|idle|cameras|online|offline|flagged/i;
      const keep = function (t) { return (RX[sk] && RX[sk].test(t)) || GEN.test(t); };
      if (SID) {
        /* named season: keep every card and row; those with no records in this season say so */
        const own = function (t) { if (LENSES.some(function (L) { return RX[L].test(t); })) return true; if (RX.proc.test(t) || RX.mill.test(t) || RX.between.test(t)) return false; if (/preparedness|readiness|parameter/i.test(t)) return inSel('k26'); return true; };
        if (mode === 'home' || !STAGE_SEASON[stgOf] || inSel(STAGE_SEASON[stgOf])) {
          const k2 = page.kpis.filter(function (k) { return own(k.label); }); if (k2.length) page.kpis = k2;
          page.scores.forEach(function (sec) { const it = sec.items.filter(function (k) { return own(k.name); }); if (it.length) sec.items = it; });
        }
        page.seasonNote = 'Showing ' + SID.long + ' records';
      } else {
      const k2 = page.kpis.filter(function (k) { return keep(k.label); }); if (k2.length) page.kpis = k2;
      page.scores.forEach(function (sec) { const it = sec.items.filter(function (k) { return keep(k.name); }); if (it.length) sec.items = it; });
      page.seasonNote = 'Showing the KPIs that matter in ' + SE.short;
      }
    }
    /* module tabs: four headline KPI cards; the rest join one KPI list (a single list per tab) */
    const ONLY4 = { proc: 1, cmr: 1, s1: 1, s2: 1, stor: 1, fin: 1, alerts: 1, gps: 1, cctv: 1 };
    if (!s.pivot && ONLY4[mode]) {
      const extra = page.kpis.slice(4); page.kpis = page.kpis.slice(0, 4);
      const xi = extra.map(function (k) { return self.catItem({ uid: 'kc' + mode + k.label, n: 'KPI', name: k.label, value: k.value, detail: k.sub, t: (k.vcls || '').split(' ')[1] || '', tag: k.rep ? 'Reported' : 'Illustrative', group: 'KPI list', info: k._info }); });
      if (page.scores.length > 1 || xi.length) {
        const first = page.scores[0];
        const merged = { title: first ? first.title.replace(/ KPIs$/, '') + ' KPI list' : 'KPI list', sub: first ? first.sub : '', items: xi.concat([].concat.apply([], page.scores.map(function (x) { return x.items; }))) };
        page.scores = merged.items.length ? [merged] : [];
      }
    }
    page.scores.forEach(function (sec) {
      const ex = !!(s.scExp && s.scExp[sec.title]); const N = 6;
      sec.canMore = sec.items.length > N; sec.moreLabel = ex ? 'Show fewer' : 'Show all ' + sec.items.length;
      sec.toggle = function () { const e = Object.assign({}, self.state.scExp || {}); if (e[sec.title]) delete e[sec.title]; else e[sec.title] = 1; self.setState({ scExp: e }); };
      sec.rows = ex ? sec.items : sec.items.slice(0, N);
      sec.items.forEach(function (k) {
        const tcls = (k.vcls.split(' ')[1] || '');
        k.vcls2 = 'scv ' + tcls; k.varCls2 = 'scvar ' + (k.varCls || ''); if (!k.target) { k.target = '—'; } if (!k.variance) k.variance = '—';
        k.status = k.tag === 'Proposed' ? 'Proposed' : k.value === ND ? ND : k.value === 'NA' ? 'Not reported' : tcls === 'good' ? 'On track' : tcls === 'warn' ? 'Watch' : tcls === 'bad' ? 'Act now' : '—';
        k.dot = 'dot ' + (k.tag === 'Proposed' ? '' : tcls);
      });
    });
    page.scores.forEach(function (sec) { sec.items.forEach(function (k) { const id = 's:' + k.uid; const open = !!(s.kpiOpen && s.kpiOpen.id === id); k.open = open; k.cls = 'sk' + (open ? ' on' : ''); k.rcls = 'scrow' + (open ? ' on' : ''); k.info = function () { self.setState({ kpiOpen: open ? null : { id: id, label: k.name, value: k.value, sub: k.detail, target: k.target, variance: k.variance, fresh: k.fresh, group: k.group + ' · ' + k.n, info: k.infoObj, target: k.target === '—' ? '' : k.target }, kpiRec: false }); }; if (k.value === ND) k.info = ndPop(k.name); }); });

    if (mode === 'home' && path.length < 2 && !s.pivot) { const bk = (path[0] || '') + '|' + sk + '|' + s.lastVisit + '|' + s.role; if (!this._briefC || this._briefC.k !== bk) { const selfB = this; this._briefC = { k: bk, v: { btn: true, n: '…', open: function () {}, items: [], has: false, none: false, loading: true, sub: 'Checking what changed since your last visit…' } }; setTimeout(function () { if (selfB._briefC && selfB._briefC.k === bk) { selfB._briefC.v = selfB.briefFor(path[0] || null, sk); selfB.setState({ briefTick: Date.now() }); } }, 40); } page.brief = this._briefC.v; } else page.brief = null;
    page.rx = s.pivot ? [] : this.rxRender(this.rxFor(mode, path, s.stage), JSON.stringify([mode, path, s.stage, s.role, this.windowH()]));
    /* ---------- section layout (per tab) ---------- */
    const tabKey = mode === 'glance' ? 'glance:' + s.glance : mode === 'home' ? 'home:' + sk : mode;
    const TABNAME = { img: 'Image analyser', inbox: 'Inbox', news: 'News clips', yt: 'YouTube', intel: 'Intelligence', home: 'Overview', prep: 'Preparedness', alerts: 'Incidents', cctv: 'CCTV', gps: 'GPS tracking', fin: 'Financials' };
    const tabName = TABNAME[mode] || (STAGES.filter(function (x) { return x.k === mode; })[0] || MODS.filter(function (x) { return x.k === mode; })[0] || { label: mode === 'glance' ? 'At a glance' : mode }).label;
    const P = page.prepUI || {}; page.kpis = page.kpis || []; page.scores = page.scores || [];
    const REG = [
      ['flow', 'Paddy-to-beneficiary flow', page.showFlow && sk === 'all' && !SID],
      ['intel', 'Intelligence', !!page.isIntel],
      ['inbox', 'Inbox', !!page.isInbox],
      ['aisum', 'AI intelligence summary', !page.isIntel && !page.isInbox && !!page.aisum && page.aisum.has],
      ['queue', 'Incident work queue', !!page.queueOn],
      ['kpis', 'KPI cards', page.kpis.length > 0],
      ['press', 'Press Watch', !!page.pressOn],
      ['ytv', 'YouTube videos', !!page.ytOn],
      ['imgref', 'What the grades look like', !!(page.imgRef && page.imgRef.has)],
      ['itrend', 'Incident trends', !!page.itrendOn],
      ['isel', (page.isel && page.isel.title) || 'Incidents by Stage', !!page.isel],
      ['chain', 'Where in the chain', !!page.chain],
      ['schart', (page.sChart && page.sChart.title.split(' · ')[0]) || 'Season chart', !!(page.isHome && page.sChart)],
      ['map', 'District map', page.isHome],
      ['feed', 'Live incidents', page.isHome],
    ].concat(page.scores.map(function (sec) { return ['sc:' + sec.title, sec.title, true]; })).concat([
      ['pend', 'Pending quantity by stage', page.isHome && sk !== 'proc'],
      ['attn', (page.ov && page.ov.attnTitle) || 'Districts needing attention', page.isHome],
      ['matrix', (page.ov && page.ov.mxTitle) || 'District status by stage', page.isHome],
      ['prepbar', 'View and filter bar', !!page.isPrep],
      ['prepA', 'Top risks', !!(page.isPrep && P.isOverview)],
      ['prepB', P.attnTitle || 'Needs attention', !!(page.isPrep && P.isOverview)],
      ['prepF', 'Readiness forecast', !!(page.isPrep && P.isOverview && page.prepChart)],
      ['prepC', 'All 17 parameters', !!(page.isPrep && P.isOverview)],
      ['prepCmp', 'District ranking', !!(page.isPrep && P.isCompare)],
      ['prepRk', 'Ranking by parameter', !!(page.isPrep && P.isRanking)],
      ['prepP1', (P.p && P.p.title) || 'Parameter summary', !!(page.isPrep && P.isParam && P.hasParam)],
      ['prepP2', (P.pTable && P.pTable.title) || 'Parameter table', !!(page.isPrep && P.isParam && P.hasParam)],
      ['prepRpt', 'Reports', !!(page.isPrep && P.isReports)],
      ['prep2', page.prepTitle || 'Readiness', !!page.hasPrep],
      ['tiles', page.tilesTitle || 'Flagged feeds', !!page.hasTiles],
      ['facts', page.factsTitle || 'Facts', !!page.hasFacts],
      ['t2', (page.t2 && page.t2.title) || 'Breakdown', !!page.hasT2],
      ['detail', (page.detail && page.detail.title) || 'Detail', !!page.hasDetail],
      ['table', (page.table && page.table.title) || 'Table', !!(page.hasTable || page.distBtn)]
    ]).concat((page.rx || []).map(function (x) { return ['rx:' + x.key, x.title.split(' · ')[0], true]; }));
    if (mode === 'home') { const HOME_ORD = { all: ['brief', 'aisum', 'flow', 'kpis', 'map', 'feed', 'queue', 'sc', 'pend', 'attn', 'matrix'], proc: ['brief', 'aisum', 'kpis', 'schart', 'flow', 'map', 'feed', 'queue', 'sc', 'attn', 'matrix', 'pend'], mill: ['brief', 'aisum', 'kpis', 'schart', 'pend', 'flow', 'map', 'feed', 'sc', 'attn', 'matrix'], between: ['brief', 'aisum', 'kpis', 'schart', 'pend', 'map', 'feed', 'flow', 'sc', 'attn', 'matrix'] }; const ho = HOME_ORD[sk] || HOME_ORD.all; const rk = function (r, i) { const id = r[0].indexOf('sc:') === 0 ? 'sc' : r[0]; const j = ho.indexOf(id); return j < 0 ? 100 + i : j * 1 + i / 1000; }; const idx = REG.map(function (r, i) { return { r: r, k: rk(r, i) }; }); idx.sort(function (a, b) { return a.k - b.k; }); REG.length = 0; idx.forEach(function (x) { REG.push(x.r); }); }
    const lay0 = (s.lay && s.lay[tabKey]) || {};
    const hid = lay0.hid || {}; const khid = lay0.khid || {};
    const sz = lay0.sz || {}; const ksz = lay0.ksz || {};
    const DEFSPAN = { map: 8, feed: 4, pend: 6, attn: 6, prepA: 6, prepB: 6 };
    const present = REG.filter(function (r) { return r[2]; });
    const seqOf = function (stored, ids) {
      const out = (stored || []).filter(function (id) { return ids.indexOf(id) >= 0; });
      ids.forEach(function (id, di) { if (out.indexOf(id) >= 0) return; let at = out.length; for (let j = di + 1; j < ids.length; j++) { const q = out.indexOf(ids[j]); if (q >= 0) { at = q; break; } } out.splice(at, 0, id); });
      return out;
    };
    const ids = present.map(function (r) { return r[0]; });
    const seq = seqOf(lay0.order, ids); { const ia = seq.indexOf('aisum'), ik = seq.indexOf('kpis'); if (ia > ik && ik >= 0) { seq.splice(ia, 1); seq.splice(ik, 0, 'aisum'); } const iq = seq.indexOf('queue'), im = Math.max(seq.indexOf('map'), seq.indexOf('feed')); if (iq >= 0 && im > iq) { seq.splice(iq, 1); seq.splice(seq.indexOf(seq[im - 1]) + 1, 0, 'queue'); } }
    const saveLay = function (fn) {
      const all = JSON.parse(JSON.stringify(self.state.lay || {}));
      const cur = all[tabKey] || {}; cur.hid = cur.hid || {}; cur.khid = cur.khid || {};
      fn(cur); all[tabKey] = cur; writeLay(all);
      self.setState({ lay: all });
    };
    const visSeq = function () { return seq.filter(function (id) { return !hid[id]; }); };
    const moveTo = function (id, target, after) {
      if (seq.indexOf(id) < 0) return; saveLay(function (c) { const a = seq.filter(function (x) { return x !== id; }); let q = a.indexOf(target); if (q < 0) q = a.length; else if (after) q++; a.splice(q, 0, id); c.order = a; });
    };
    const step = function (id, d) {
      const v = visSeq(); const i = v.indexOf(id); const j = i + d; if (i < 0 || j < 0 || j >= v.length) return;
      moveTo(id, v[j], d > 0);
    };
    const L = {};
    const mkL = function (id) {
      const i = seq.indexOf(id);
      return {
        on: i >= 0 && !hid[id], o: (i + 1) * 10, span: (sz[id] && sz[id].s) || DEFSPAN[id] || 12, h: (sz[id] && sz[id].h) ? sz[id].h + 'px' : 'auto', ov: (sz[id] && sz[id].h) ? 'auto' : 'visible',
        rz: function (e) { const el = e && e.currentTarget && e.currentTarget.parentElement; self.startResize(e, el, 12, 3, function (sp, hh) { saveLay(function (c) { c.sz = c.sz || {}; const o = c.sz[id] || {}; o.s = sp; if (hh !== null) o.h = hh; c.sz[id] = o; c.order = seq.slice(); }); }); },
        rzReset: function (e) { if (e && e.preventDefault) e.preventDefault(); saveLay(function (c) { if (c.sz) delete c.sz[id]; }); },
        rm: function () { saveLay(function (c) { c.hid[id] = 1; c.order = seq.slice(); }); self.setState({ editMode: true }); },
        up: function () { step(id, -1); }, down: function () { step(id, 1); },
        id: id, grab: function (e) { const g = e && e.currentTarget; const el = g && g.closest ? (g.closest('[data-sid]') || (g.parentElement && g.parentElement.parentElement)) : null; self.startDrag(e, el, 'data-sid', function (to, after) { if (to && to !== id) moveTo(id, to, after); }); },
        drag: function (e) { self._dragSec = id; self._dragK = null; try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id); } catch (er) {} },
        over: function (e) { if (self._dragSec && e && e.preventDefault) e.preventDefault(); },
        drop: function (e) { const from = self._dragSec; if (!from) return; if (e && e.preventDefault) e.preventDefault(); if (e && e.stopPropagation) e.stopPropagation(); self._dragSec = null; if (from === id) return; const v = visSeq(); moveTo(from, id, v.indexOf(from) < v.indexOf(id)); }
      };
    };
    REG.forEach(function (r) { if (r[0].indexOf('sc:') !== 0 && r[0].indexOf('rx:') !== 0) L[r[0]] = mkL(r[0]); });
    L.table.on = L.table.on && !!page.hasTable;
    if (blank) { Object.keys(L).forEach(function (k) { if (L[k] && typeof L[k] === 'object') L[k].on = false; }); page.scores = []; page.rx = []; }
    L.distBtn = !blank && !!page.distBtn && seq.indexOf('table') >= 0 && !hid.table;
    [['map', 'feed'], ['pend', 'attn'], ['prepA', 'prepB']].forEach(function (pr) { [0, 1].forEach(function (q) { const a = pr[q], b = pr[1 - q]; if (!L[b].on && !(sz[a] && sz[a].s)) L[a].span = 12; }); });
    page.scores = page.scores.filter(function (sec) { return !hid['sc:' + sec.title]; });
    page.scores.forEach(function (sec) { sec.L = mkL('sc:' + sec.title); });
    page.flowN = (page.flow || []).length || 7;
    const LC0 = { title: '', sub: '', dAct: '', dPlan: '', dFc: '', dAlt: '', dBand: '', dGrid: '', dH: '', hTop: '0', hLabel: '', hasH: false, dV1: '', dV2: '', vl: [], yt: [], xt: [], marks: [], legend: [], note: '', has: false };
    if (!page.sChart) page.sChart = LC0; if (!page.prepChart) page.prepChart = LC0;
    if (!page.chain) page.chain = { count: '', lensBtns: [], splBtns: [], tools: {}, layers: [], labels: [], legend: [], hasLegend: false, step: { has: false, t: { cols: [], rows: [], grid: '1fr' } }, stepT: { cols: [], rows: [], grid: '1fr' }, showSteps: false, off: [], empty: false, emptyTxt: '' };
    if (!page.brief) page.brief = { btn: false, n: 0, open: function () {}, items: [], has: false, none: true, loading: false, sub: '' };
    page.rx = (page.rx || []).filter(function (x) { return !hid['rx:' + x.key]; }); page.rx.forEach(function (x) { x.L = mkL('rx:' + x.key); });
    /* KPI cards: own order inside the KPI section */
    const kIds = page.kpis.map(function (k) { return 'k:' + k.label; });
    const kSeq = seqOf(lay0.kord, kIds);
    const kDef = page.kpiCls && page.kpiCls.indexOf('k3') >= 0 ? 4 : 3;
    const kVis = function () { return kSeq.filter(function (id) { return !khid[id]; }); };
    page.kpis = page.kpis.filter(function (k) { return !khid['k:' + k.label]; });
    page.kpis.forEach(function (k) {
      const id = 'k:' + k.label;
      k.o = kSeq.indexOf(id) + 1;
      k.span = (ksz[id] && ksz[id].s) || kDef; k.h = (ksz[id] && ksz[id].h) ? ksz[id].h + 'px' : 'auto';
      k.rz = function (e) { const el = e && e.currentTarget && e.currentTarget.parentElement; self.startResize(e, el, 12, 2, function (sp, hh) { saveLay(function (c) { c.ksz = c.ksz || {}; const o = c.ksz[id] || {}; o.s = sp; if (hh !== null) o.h = hh; c.ksz[id] = o; c.kord = kSeq.slice(); }); }); };
      k.rzReset = function (e) { if (e && e.preventDefault) e.preventDefault(); if (e && e.stopPropagation) e.stopPropagation(); saveLay(function (c) { if (c.ksz) delete c.ksz[id]; }); };
      k.rm = function (e) { if (e && e.stopPropagation) e.stopPropagation(); saveLay(function (c) { c.khid[id] = 1; c.kord = kSeq.slice(); }); self.setState({ editMode: true, kpiOpen: (self.state.kpiOpen && self.state.kpiOpen.label === k.label) ? null : self.state.kpiOpen }); };
      k.kid = id; k.grab = function (e) { self.startDrag(e, e && e.currentTarget, 'data-kid', function (to, after) { if (!to || to === id) return; saveLay(function (c) { const a = kSeq.filter(function (x) { return x !== id; }); let q = a.indexOf(to); if (q < 0) q = a.length; else if (after) q++; a.splice(q, 0, id); c.kord = a; }); }, true); };
      if (k.value === ND) k.info = ndPop(k.label);
      const oi = k.info; k.info = function () { if (self._justDragged) return; oi(); };
      k.drag = function (e) { self._dragK = id; self._dragSec = null; try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id); } catch (er) {} };
      k.over = function (e) { if (self._dragK && e && e.preventDefault) e.preventDefault(); };
      k.drop = function (e) {
        const from = self._dragK; if (!from) return; if (e && e.preventDefault) e.preventDefault(); if (e && e.stopPropagation) e.stopPropagation(); self._dragK = null; if (from === id) return;
        const v = kVis(); const after = v.indexOf(from) < v.indexOf(id);
        saveLay(function (c) { const a = kSeq.filter(function (x) { return x !== from; }); let q = a.indexOf(id); if (after) q++; a.splice(q, 0, from); c.kord = a; });
      };
    });
    const hiddenList = present.filter(function (r) { return hid[r[0]]; }).map(function (r) {
      return { label: r[1], add: function () { saveLay(function (c) { delete c.hid[r[0]]; }); self.setState({ addOpen: false }); } };
    }).concat(L.kpis.on ? kIds.filter(function (id) { return khid[id]; }).map(function (id) {
      return { label: 'KPI card · ' + id.slice(2), add: function () { saveLay(function (c) { delete c.khid[id]; }); self.setState({ addOpen: false }); } };
    }) : []);
    const editOn = !!s.editMode && !s.pivot;
    const edit = {
      on: editOn, tab: tabName, addOpen: !!s.addOpen, hidden: hiddenList, noneHidden: hiddenList.length === 0, count: hiddenList.length,
      toggleAdd: function () { self.setState({ addOpen: !self.state.addOpen }); },
      reset: function () { const all = JSON.parse(JSON.stringify(self.state.lay || {})); delete all[tabKey]; writeLay(all); self.setState({ lay: all, addOpen: false }); },
      pivot: function () { self.setState(Object.assign({ pivot: true, editMode: false, addOpen: false, pvMsg: '' }, self.pvFor(mode))); },
      done: function () { self.setState({ editMode: false, addOpen: false }); }
    };
    const mainCls = 'main' + (editOn ? ' editing' : '') + (sk !== 'all' ? ' s-' + sk : '');
    let kinfo = { ctx: '', q: '', onQ: function () {}, clearQ: function () {}, hasQ: false, ai: '', hasAi: false, act: function () {}, tabs: [], isData: false, isAbout: false, data: { has: false, note: '', title: '', cols: [], rows: [], grid: '1fr', hasTotal: false, total: [], totalLabel: '' }, canDownload: false, download: function () {}, sub: '', hasRec: false, recOpen: false, rec: { title: '', note: '', cols: [], rows: [], grid: '1fr', download: function () {} }, recLabel: '', toggleRec: function () {}, hasWorked: false, worked: '', has: false, group: '', title: '', value: '', def: '', calc: '', drill: '', facts: [], bars: [], barsTitle: '', hasGo: false, go: function () {}, goLabel: '', close: function () {} };
    const ko = s.kpiOpen;
    if (ko && !s.pivot) {
      const I = ko.info || {};
      const distLvl = !path.length || !!I.fn || !!DIST_ONLY[I.field] || mode === 'prep' || mode === 'gps' || mode === 'alerts' || mode === 'cctv' || mode === 'glance';
      let kids = distLvl ? D.filter(function (d) { return !isDM || d.name === s.dm || !I.fn; }).map(function (d) { return { name: d.name, v: distVals(d.name) }; }) : mandalsOf(path[0]).map(function (m) { return { name: m.name, v: m.v, id: m.id, dn: m.dn }; });
      if (isDM && distLvl && !I.fn && path[0]) kids = mandalsOf(path[0]).map(function (m) { return { name: m.name, v: m.v, id: m.id, dn: m.dn }; });
      const fmt = KFMT[I.fmt] || pct; let bars = [];
      const tn = function (x) { return I.tone ? tone(x, I.tone[0], I.tone[1], I.tone[2]) : ''; };
      if (I.bars) { bars = I.bars; }
      else if (I.fn) { const k2 = kids.map(function (k) { return { name: k.name, v: { _x: I.fn(k.name) } }; }).filter(function (k) { return k.v._x !== null && !isNaN(k.v._x); }); this._pctX = I.fmt === 'pct'; bars = this.barsFrom(k2, '_x', I.dir || 1, fmt, function (vv) { return tn(vv._x); }, 6); this._pctX = false; }
      else if (I.field && kids.length && kids[0].v[I.field] !== undefined) bars = this.barsFrom(kids, I.field, I.dir || 1, fmt, function (vv) { return tn(vv[I.field]); }, 6);
      const facts = [{ k: 'Current value', v: ko.value }, { k: 'Detail', v: ko.sub || '—' }];
      if (ko.target) { facts.push({ k: 'Target', v: ko.target }); facts.push({ k: 'Variance', v: ko.variance }); }
      facts.push({ k: 'Data freshness', v: ko.fresh || this.freshTxt(ko.id) });
      const lvlName = kids.length && DBY[kids[0].name] ? 'districts' : 'mandals';
      const gm = I.go; const TABN = { overview: '', fin: 'Financials', prep: 'Preparedness', alerts: 'Incidents', cctv: 'CCTV', gps: 'GPS tracking' };
      const worked = ko.sub ? 'For ' + (path[0] ? (LBL[path[path.length - 1]] || path[0]) : 'Andhra Pradesh') + ' now: ' + ko.sub + ' → ' + ko.value + (ko.target ? ' against a target of ' + ko.target + ' (' + ko.variance + ')' : '') + '.' : '';
      const GL = { rsk: 'ppc', mill: 'mills', godown: 'godowns', mls: 'mls', fps: 'fps' };
      const recType = I.rec || (ko.key && KREC[ko.key]) || (I.field && FREC[I.field]) || (mode === 'glance' ? GL[s.glance] : MREC[mode]) || null;
      const isDistKids = !!(kids.length && DBY[kids[0].name]);
      const lvlLbl = isDistKids ? 'District' : 'Mandal';
      const totLbl = isDistKids ? 'Andhra Pradesh' : (path[0] || s.dm);
      const selName = isDistKids && path[0] ? path[0] : null;
      const STAGEM = { home: 1, proc: 1, cmr: 1, s1: 1, s2: 1, stor: 1, fin: 1 };
      const rowDrill = function (k) { if (isDistKids) return function () { self.setState({ path: [k.name], kpiOpen: null, kpiRec: false }); }; if (k.id && STAGEM[mode]) return function () { self.setState({ path: [k.dn, k.id], kpiOpen: null, kpiRec: false }); }; return null; };
      const spec = I.field ? (FIN[I.field] || { res: ko.label, cols: [] }) : null;
      /* grievance KPIs: the last level opens the grievance records */
      const isGrvK = /rievance/.test(ko.label || '');
      const isIncK = /^(p1|inc_)/.test(ko.key || '') && ko.key !== 'inc_grv' && ko.key !== 'inc_cctv' && ko.key !== 'inc_gps';
      /* incidents and CCTV KPIs: a mandal (the last level) opens the records behind the number */
      const recLeaf = function (dn, m) {
        const st = s.stage; let title = '', labels = [], rows = [];
        if (ko.key === 'tripc') {
          const w = m.name.split(' ')[0]; const l = tripsOf(dn).filter(function (t) { return t.veh && t.veh.from && t.veh.from.indexOf(w) >= 0; }); if (!l.length) return null;
          title = 'Trips'; labels = ['Trip', 'Vehicle', 'Leg', 'Route', 'Trip state'];
          rows = l.map(function (t) { return { name: t.id, cells: [T3(t.veh.plate), T3(STAGE_NAME[t.stage]), T3(t.route), T3(t.trip, t.trip === 'Completed' ? 'good' : '')], drill: function () { self.setState({ rxRec: self.rxBack(self.rxRecord('trip', t)) }); } }; });
        } else if (ko.key === 'inc_cctv' || ko.key === 'inc_gps') {
          const sOKi = self._seasOK || function () { return true; }; const incF = ko.key === 'inc_cctv' ? function (i) { return i.ent === 'Buffer godown' || i.ent === 'MLS point'; } : function (i) { return i.src === 'GPS'; };
          const l = incidentsOf(dn).filter(function (i) { return i.mandal === m.name && incF(i) && (st === 'all' || i.stage === st) && sOKi(i.stage) && self.inWin(i.ageH); }); if (!l.length) return null;
          title = 'Incidents'; labels = ['Incident ID', 'Incident', 'Stage · point', 'Severity', 'Status', 'Age'];
          rows = l.map(function (i) { return { name: i.id, cells: [T3(i.title), T3(STAGE_NAME[i.stage] + ' · ' + i.ent + (i.mv ? ' · ' + i.mv : '')), T3(SEV[i.prio], i.prio === 'P1' ? 'bad' : ''), T3(i.status + (i.escTo ? ' · to ' + i.escTo : ''), i.status === 'Escalated' ? 'bad' : ''), C(i.ageH + ' h')], drill: function () { self.setState({ rxRec: self.rxBack(self.incRec(i)) }); } }; });
        } else if (mode === 'alerts' || isIncK) {
          if (ko.key === 'inc_closed') { const l = incClosedOf(dn).filter(function (f) { return f.Mandal === m.name && (st === 'all' || f.Category === CATN[st]); }); if (!l.length) return null;
            title = 'Closed incidents'; labels = ['Incident ID', 'Incident', 'Severity', 'Season', 'Closed in']; const RO = self.reopenedIds(); rows = l.map(function (f) { return { name: f.id + (RO[f.id] ? ' · reopened' : ''), cells: [T3(f.title), T3(f.Severity), T3(f.Season), C(fmtN(f.res, 1) + ' d')], drill: function () { self.setState({ rxRec: self.closedRec(f) }); } }; });
          } else {
            const F = { p1: function (i) { return i.prio === 'P1'; }, inc_high: function (i) { return i.prio === 'P2'; }, inc_esc: function (i) { return i.status === 'Escalated'; } }[ko.key] || null;
            const l = incidentsOf(dn).filter(function (i) { return i.mandal === m.name && (st === 'all' || i.stage === st) && self.inWin(i.ageH) && (!F || F(i)); }); if (!l.length) return null;
            title = ko.label + ' · incidents'; labels = ['Incident ID', 'Incident', 'Stage · point', 'Severity', 'Status', 'Age'];
            rows = l.map(function (i) { return { name: i.id, cells: [T3(i.title), T3(STAGE_NAME[i.stage] + ' · ' + i.ent + (i.mv ? ' · ' + i.mv : '')), T3(SEV[i.prio], i.prio === 'P1' ? 'bad' : ''), T3(i.status + (i.escTo ? ' · to ' + i.escTo : ''), i.status === 'Escalated' ? 'bad' : ''), C(i.ageH + ' h')], drill: function () { self.setState({ rxRec: self.rxBack(self.incRec(i)) }); } }; });
          }
        } else if (mode === 'cctv') {
          const F = { cam: function (c) { return c.status === 'Online'; }, camoff: function (c) { return c.status === 'Offline'; }, cam_ev: function (c) { return !!c.event; } }[ko.key] || null;
          const l = camerasOf(dn).filter(function (c) { return c.mandal === m.name && (st === 'all' || c.stage === st || (st === 's2' && c.stage === 's1')) && (!F || F(c)); }); if (!l.length) return null;
          title = ko.label + ' · cameras'; labels = ['Camera', 'Site', 'View', 'Status', 'Event', 'Last seen'];
          rows = l.map(function (c) { return { name: c.id, cells: [T3(c.site), T3(c.view), T3(c.status, c.status === 'Offline' ? 'bad' : 'good'), T3(c.event || '—', c.event ? 'warn' : ''), C(c.ts)], drill: function () { self.setState({ rxRec: { back: self.state.rxRec || null, title: c.id + ' · ' + c.site, sub: (CAMLOC[c.stage] || 'Site') + ' · ' + c.view + ' camera · ' + c.mandal + ', ' + dn, facts: [{ k: 'Status', v: c.status }, { k: 'Event', v: c.event || 'None' }, { k: 'Last seen', v: c.ts }, { k: 'Site', v: c.site }, { k: 'View', v: c.view }, { k: 'Stage', v: STAGE_NAME[c.stage] }], steps: [], links: [] } }); } }; });
        } else if (ko.key === 's2ack') {
          const l = s2Dels(dn).filter(function (r) { return r.mandal === m.name && r.status.indexOf('awaiting') >= 0; }); if (!l.length) return null;
          title = 'Deliveries awaiting ePoS acknowledgement'; labels = ['Delivery', 'FPS', 'MLS point', 'Delivered', 'Waiting', 'Qty (MT)'];
          rows = l.map(function (r) { return { name: r.id, cells: [T3(r.fps), T3(r.mls), C(fmtDT(r.delH)), C('open ' + fmtH(r.delH), r.delH > 24 ? 'bad' : ''), C(fmtN(r.qty, 1))], drill: function () { self.setState({ rxRec: self.rxBack(self.rxRecord('s2', r)) }); } }; });
        } else return null;
        return function () { self.tablePopup(title + ' · ' + m.name + ', ' + dn, fmtN(rows.length) + ' records', labels, rows, null, (title + '-' + m.name).replace(/\s+/g, '-')); };
      };
      const T3 = function (x, t) { return Object.assign(C(x, t || ''), { cls: 'txt' }); };
      const grvPop = function (dn, m, gf) { const l = grievOf(dn).filter(function (g) { return (!m || g.mandal === m.name) && (!gf || gf(g)); }); if (!l.length) return null; const where = (m ? m.name + ', ' : '') + dn; return function () { self.tablePopup('Grievances · ' + where, fmtN(l.length) + ' PGRS + IVRS grievances · open first · click one for its acknowledgement, resolution, validation and closure', ['Grievance', 'Type', 'Channel', 'RSK / FPS', 'Severity', 'State', 'SLA due', 'Within SLA'], l.slice().sort(function (a, b) { return (a.closeH === null ? 0 : 1) - (b.closeH === null ? 0 : 1); }).map(function (g) { return { name: g.id, cells: [T3(g.type), T3(g.channel), T3(g.anchor), T3(SEV[g.prio]), T3(g.state, g.closeH === null ? 'warn' : 'good'), C(fmtDT(g.dueH), g.overdue ? 'bad' : ''), T3(g.dueNow ? (g.within ? 'Yes' : 'No') : 'Not yet due', g.dueNow && !g.within ? 'bad' : '')], drill: function () { self.setState({ rxRec: self.rxBack(self.rxRecord('grv', g)) }); } }; }), null, 'grievances-' + where); }; };
      const getv = function (v, f) { return typeof f === 'function' ? f(v) : v[f]; };
      let data = null; let dataNote = ''; let lvlLbl2 = null;
      if (I.unavail) {
        dataNote = I.unavail;
      } else if (I.tab || (spec && distVals(D[0].name)[I.field] !== undefined)) {
        /* one row per district in scope; a district opens into its mandals, a mandal into its RSKs / mills / godowns */
        const sp = I.tab || null; const EXP = s.kExp || {}; const kid = ko.id || ko.label;
        const ETM = { home: 'proc', proc: 'proc', cmr: 'cmr', s1: 's1', s2: 's2', stor: 'stor', fin: 'proc' };
        /* the level under a mandal is the entity the KPI is about (godowns for godown KPIs, mills for CMR KPIs, ...), not the tab's default */
        const FET = { procPct: 'proc', gap: 'proc', target: 'proc', procured: 'proc', ppcPct: 'proc', ppcAct: 'proc', rsk: 'proc', moisture: 'proc', farmPaidPct: 'proc', payVal: 'proc', pay24: 'proc', pending: 'proc', paid: 'proc', farmers: 'proc', farmersPend: 'proc', transPend: 'proc', valueCr: 'proc', payDays: 'proc',
          cmrPct: 'cmr', cmrShort: 'cmr', cmrDel: 'cmr', cmrDue: 'cmr', millReady: 'cmr', millsAct: 'cmr', mills: 'cmr', bg: 'cmr', hamPend: 'cmr', millAnom: 'cmr', ebgPct: 'cmr',
          s1Pct: 's1', s1Moved: 's1', s1Plan: 's1', trips: 's1', s1Dev: 's1',
          s2Pct: 's2', liftPct: 's2', s2Lift: 's2', s2Fps: 's2', s2Allot: 's2', mls: 's2', insp: 's2',
          util: 'stor', stock: 'stor', cap: 'stor', aged: 'stor', godowns: 'stor', storCh: 'stor', coverDays: 'stor', overdueRc: 'stor',
          distPct: 'fps', dist: 'fps', fps: 'fps', stockout: 'fps', tripPct: '', prep: '', alerts: '', p1: '', camOnline: '', camsOff: '', vehDev: '' };
        const GET = { proc: 'proc', cmr: 'cmr', s1: 's1', s2: 's2', stor: 'stor', fps: 'fps' };
        const PAYF = { farmPaidPct: 1, pay24: 1, pending: 1, paid: 1, farmers: 1, farmersPend: 1, payVal: 1, payDays: 1, pay2448: 1, payLate: 1, valueCr: 1 };
        const etF = isIncK ? null : sp ? sp.et || null : I.field in FET ? (FET[I.field] || null) : ((I.go && GET[I.go[0]]) || ETM[mode] || null);
        const getc = function (o, c) { return typeof c[1] === 'function' ? c[1](o) : o[c[1]]; };
        const cellsOf = sp ? function (o) { const x = sp.res[1](o); return sp.cols.map(function (c) { return C(FIN_F[c[2]](getc(o, c))); }).concat([Object.assign(C(sp.res[2](x), sp.res[3] ? sp.res[3](x) : ''), { cls: 'res' })]); }
          : function (v) { return spec.cols.map(function (c) { return C(FIN_F[c[2]](getv(v, c[1]))); }).concat([Object.assign(C(fmt(v[I.field]), tn(v[I.field])), { cls: 'res' })]); };
        const valD = function (dn) { return sp ? sp.f(dn) : distVals(dn); };
        const valM = sp ? (sp.fm || null) : function (mid, m) { return m.v; };
        const valE = sp ? (sp.fe || null) : function (e) { return e.v[I.field] !== undefined ? e.v : null; };
        const ENTN = { proc: 'RSKs', cmr: 'rice mills', s1: 'routes', s2: 'MLS points', stor: 'godowns' };
        const scopeD = isDM ? [s.dm] : path[0] ? [path[0]] : D.map(function (d) { return d.name; });
        const single = scopeD.length === 1;
        const kq = (s.kQ || '').trim().toLowerCase();
        const isOpen = function (key, def) { return kq ? true : key in EXP ? !!EXP[key] : def; };
        const tog = function (key, cur) { return function () { const o = Object.assign({}, self.state.kExp || {}); o[key] = !cur; self.setState({ kExp: o }); }; };
        const IND = ['', ' ', '  '];
        const rows = []; const sum = {};
        scopeD.forEach(function (dn) {
          const o = valD(dn); if (sp) Object.keys(o).forEach(function (k2) { sum[k2] = (sum[k2] || 0) + (o[k2] || 0); });
          const kD = kid + '|' + dn; const canD = !!valM; const opD = canD && isOpen(kD, single);
          rows.push({ name: (canD ? (opD ? '▾ ' : '▸ ') : '') + dn, cells: cellsOf(o), drill: canD ? tog(kD, opD) : null, lvl: 0 });
          if (!opD) return;
          mandalsOf(dn).forEach(function (m) {
            const om = valM(m.id, m); if (!om) return;
            const ents = valE && etF ? entsOf(m.id, etF) : [];
            const kM = kD + '|' + m.id; const canM = ents.length > 0; const opM = canM && isOpen(kM, false);
            const gpM = !canM ? (sp && sp.leaf ? sp.leaf(dn, m) : isGrvK ? grvPop(dn, m) : recLeaf(dn, m)) : null; /* recLeaf covers incidents, CCTV and the incident KPIs on CCTV / GPS */ rows.push({ name: IND[1] + (canM ? (opM ? '▾ ' : '▸ ') : '') + m.name + (gpM ? ' ›' : ''), cells: cellsOf(om), drill: canM ? tog(kM, opM) : gpM, lvl: 1 });
            if (!opM) return;
            ents.forEach(function (e) { const oe = valE(e); if (!oe) return; const ce = cellsOf(oe); const cn = (sp ? sp.cols : spec.cols).map(function (c) { return c[0]; }).concat([sp ? sp.res[0] : spec.res]);
              rows.push({ name: IND[2] + e.name + ' ›', hint: e.dn + ' ' + LBL[e.mid], cells: ce, lvl: 2, drill: PAYF[I.field] && etF === 'proc' ? function () { self.ftoListPop(e, ce.map(function (c, j) { return { k: cn[j] || '', v: c.v }; })); } : function () { self.setState({ rxRec: { back: self.state.rxRec || null, title: e.name, sub: LBL[e.mid] + ', ' + e.dn + ' · ' + ko.label, facts: ce.map(function (c, j) { return { k: cn[j] || '', v: c.v }; }).concat(mstFacts(e)), steps: [], links: [] } }); } }); });
          });
        });
        if (kq) { const keep = []; let anc = [null, null]; rows.forEach(function (r) { const lv = r.lvl || 0; if (lv < 2) anc[lv] = r; if (lv === 0) anc[1] = null; const hit = String(r.name).toLowerCase().indexOf(kq) >= 0; if (hit) { for (let a = 0; a < lv; a++) if (anc[a] && keep.indexOf(anc[a]) < 0) keep.push(anc[a]); if (keep.indexOf(r) < 0) keep.push(r); } }); rows.length = 0; keep.forEach(function (r) { rows.push(r); }); self._kqDone = true; }
        const labels = ['District / mandal' + (etF && ENTN[etF] ? ' / ' + ENTN[etF].replace(/s$/, '') : '')].concat((sp ? sp.cols : spec.cols).map(function (c) { return c[0]; })).concat([sp ? sp.res[0] : spec.res]);
        const total = single ? null : sp ? cellsOf(sum) : cellsOf((function () { const tv = ratios(sumVals(scopeD.map(function (dn) { return distVals(dn); }))); if (I.field === 'prep' && scopeD.length === D.length) tv.prep = prepOverall(null); return tv; })());
        data = this.table(ko.label + ' · data by district', '', labels, rows, total, 'Andhra Pradesh (total)', ko.label + ' by district');
        data.rows.forEach(function (r, i) { const lv = rows[i].lvl; if (lv) r.firstCls += ' lv' + lv; });
        lvlLbl2 = 'district';
        dataNote = (single ? 'Showing ' + scopeD[0] + ' only, to match the filter. ' : 'One row per district; the total row adds them up and equals the card. ') + (valM ? 'Click ▸ to open a district into its mandals' + (etF && valE ? ', and a mandal into its ' + (ENTN[etF] || 'sites') : isGrvK ? ', then click a mandal for its grievance records' : (mode === 'alerts' || mode === 'cctv' || ko.key === 'inc_gps') ? ', then click a mandal for its records' : '') + '.' : 'This KPI is reported at district level only.');
      } else if (I.field === 'prep') {
        const pdn = path[0] || (isDM ? s.dm : null);
        const BT2 = function (x) { return x === null ? '' : x >= 0.7 ? 'good' : x >= 0.5 ? 'warn' : 'bad'; };
        const BL2 = function (x) { return x === null ? 'No data yet' : x >= 0.7 ? 'Good' : x >= 0.5 ? 'Moderate' : 'Needs attention'; };
        const T2 = function (x) { return Object.assign(C(x), { cls: 'txt' }); };
        let nrep = 0;
        const rows = PRM.map(function (pr, i) { const st = prepStat(i, pdn); if (st.x !== null) nrep++; return { name: pad(i + 1, 2) + ' · ' + pr[0], cells: [T2(pr[2]), C(st.x === null ? '—' : prepFmtU(i, st.num)), C(prepFmtU(i, st.den) + ' ' + pr[3]), Object.assign(C(st.x === null ? 'No data' : pct(st.x), BT2(st.x)), { cls: 'res' }), Object.assign(C(BL2(st.x), BT2(st.x)), { cls: 'txt' })], drill: function () { self.setState({ module: 'prep', stage: 'all', prepView: 'param', prepParam: i, kpiOpen: null, kpiRec: false }); } }; });
        const ov = prepOverall(pdn);
        data = this.table(ko.label + ' · data by parameter', '', ['Parameter', 'Measured as', 'Achieved', 'Out of', 'Readiness', 'Band'], rows, [C(''), C(''), C(''), Object.assign(C(ov === null ? 'No data' : pct(ov), BT2(ov)), { cls: 'res' }), Object.assign(C(BL2(ov), BT2(ov)), { cls: 'txt' })], 'Overall · average of ' + nrep + ' reported', ko.label + ' by parameter');
        lvlLbl2 = 'parameter';
        dataNote = 'The 17 preparedness parameters for ' + (pdn || 'Andhra Pradesh') + ': what was achieved against what is required. ' + (pdn ? '' : 'State figures add up the reporting districts. ') + 'Overall readiness is the average of the reported parameters, so missing reports never count as zero. Click a parameter to open it.';
      } else if (I.fn && kids.length) {
        if (path[0] && !isDM) kids = kids.filter(function (k) { return k.name === path[0]; });
        const rows = kids.map(function (k) { const x = I.fn(k.name); const isRep = ko.label === 'Repeat issues'; const gpD = (isGrvK || isRep) && DBY[k.name] ? grvPop(k.name, null, isRep ? function (g) { return g.valid === 'Rejected · reopened' || g.valid === 'Pending validation'; } : null) : null; return { name: k.name + (gpD ? ' ›' : ''), cells: [Object.assign(C(x === null || isNaN(x) ? 'No data' : fmt(x), x === null ? '' : tn(x)), { cls: 'res' })], drill: gpD || (isRep ? null : rowDrill(k)) }; });
        data = this.table(ko.label + ' · data by ' + lvlLbl.toLowerCase(), '', [lvlLbl, ko.label], rows, selName ? null : [Object.assign(C(ko.value), { cls: 'res' })], totLbl + ' (total)', ko.label + ' by ' + lvlLbl.toLowerCase());
        dataNote = (path[0] && !isDM ? 'Showing ' + path[0] + ' only, to match the filter. ' : '') + 'Each ' + lvlLbl.toLowerCase() + ' is worked out the same way as the card' + (path[0] ? '.' : '; the total row is the card value.');
      } else if (I.kid !== undefined && !I.unavail) {
        const EXP = s.kExp || {}; const kid = ko.id || ko.label;
        if (!this._scC) this._scC = {};
        const valAt = function (p) { const key = I.kmode + '|' + s.stage + '|' + p.join('/') + '|' + I.kid; if (!(key in self._scC)) { const secs = self.scoreSections(I.kmode, p, s.stage); let it = null; secs.forEach(function (sc2) { sc2.items.forEach(function (x) { if (x.uid.indexOf('f' + I.kid) === 0 && x.uid.slice(1 + I.kid.length).indexOf(p.length ? p.join('|') : 'state') === 0) it = x; }); }); self._scC[key] = it; } return self._scC[key]; };
        const cellsOf = function (it) { return it ? [Object.assign(C(it.value, (it.vcls || '').split(' ')[1] || ''), { cls: 'res' }), Object.assign(C(it.detail || '—'), { cls: 'txt' })] : [C('—'), C('—')]; };
        const scopeD = isDM ? [s.dm] : path[0] ? [path[0]] : D.map(function (d) { return d.name; });
        const single = scopeD.length === 1; const isGrv = isGrvK; const canM = I.kmode !== 'alerts' || isGrv;

        const isOpen = function (key, def) { return key in EXP ? !!EXP[key] : def; };
        const tog = function (key, cur) { return function () { const o = Object.assign({}, self.state.kExp || {}); o[key] = !cur; self.setState({ kExp: o }); }; };
        const rows = [];
        scopeD.forEach(function (dn) { const kD = kid + '|' + dn; const op = canM && isOpen(kD, single); rows.push({ name: (canM ? (op ? '▾ ' : '▸ ') : '') + dn, cells: cellsOf(valAt([dn])), drill: canM ? tog(kD, op) : null, lvl: 0 }); if (op) mandalsOf(dn).forEach(function (m) { const gp = isGrv ? grvPop(dn, m) : null; rows.push({ name: '\u2003' + m.name + (gp ? ' ›' : ''), cells: cellsOf(valAt([dn, m.id])), drill: gp, lvl: 1 }); }); });
        data = this.table(ko.label + ' · data by district', '', ['District / mandal', ko.label, 'Detail'], rows, single ? null : cellsOf(valAt([])), 'Andhra Pradesh', ko.label + ' by district');
        data.rows.forEach(function (r, i) { if (rows[i].lvl) r.firstCls += ' lv' + rows[i].lvl; });
        lvlLbl2 = 'district';
        dataNote = (single ? 'Showing ' + scopeD[0] + ' only, to match the filter.' : 'One row per district, worked out the same way as the card; the Andhra Pradesh row is the card value.') + (canM ? ' Click ▸ to open a district into its mandals' + (isGrv ? ', then click a mandal for its grievance records.' : '.') : '');
      } else if (I.bars && I.bars.length) {
        const barsL = path[0] && I.bars.some(function (b) { return DBY[b.label]; }) ? I.bars.filter(function (b) { return b.label === path[0]; }) : I.bars;
        const rows = barsL.map(function (b) { return { name: b.label, cells: [Object.assign(C(b.v), { cls: 'res' })] }; });
        if (rows.length) { data = this.table(ko.label + ' · data', '', [I.barsTitle || 'Item', ko.label], rows, null, '', ko.label); dataNote = (I.barsTitle || 'Items behind this KPI') + '. ' + (I.calc ? 'Calculated as: ' + I.calc + '.' : ''); }
        else dataNote = path[0] + ' is not in this list (' + (I.barsTitle || 'items behind this KPI').toLowerCase() + '), so there is nothing to show for it here. Clear the district filter to see the full list.';
      } else {
        dataNote = 'In the POC sample this KPI is a single illustrative figure with no underlying inputs, so there is nothing to break down yet. Once its source feed is connected, this tab will list the inputs by ' + lvlLbl.toLowerCase() + ' using the formula above.' + (recType ? '' : '');
      }
      const tab = s.kpiRec === 'about' ? 'about' : 'data';
      const rec = null;
      const tabs = [['data', 'Data by ' + (lvlLbl2 || lvlLbl.toLowerCase())], ['about', 'Definition']].map(function (t) { const on = tab === t[0]; return { label: t[1], on: on, cls: on ? 'on' : '', pick: function () { self.setState({ kpiRec: t[0] }); } }; });
      const emptyT = { title: '', note: '', cols: [], rows: [], grid: '1fr', hasTotal: false, total: [], totalLabel: '', download: function () {} };
      if (/^fl_(reg|act|inact|idle)$/.test(ko.key || '') && data && data.rows) {
        const FS = { fl_reg: null, fl_act: 'Active', fl_inact: 'Inactive', fl_idle: 'Idle GPS' }[ko.key]; const T4 = function (x, t) { return Object.assign(C(x, t || ''), { cls: 'txt' }); };
        data.rows.forEach(function (r) { const nm = String(r.name).replace(/^[\s ▾▸]+/, '').replace(/\s*›\s*$/, '').trim(); if (!DBY[nm]) return;
          r.canDrill = true; r.noDrill = false; r.drill = function () { const l = fleetOf(nm).filter(function (x) { return !FS || x.status === FS; });
            self.tablePopup(ko.label + ' · ' + nm, fmtN(l.length) + ' vehicles · search by number, transporter or mandal · click one for its record', ['Vehicle', 'Status', 'Type', 'Transporter', 'Base mandal', 'GPS device', 'Last ping', 'Approval'], l.map(function (x) { return { name: x.plate, cells: [T4(x.status, x.status === 'Active' ? 'good' : x.status === 'Inactive' ? 'bad' : 'warn'), T4(x.type), T4(x.transporter), T4(x.mandal), T4(x.device), T4(x.ping), T4(x.approved, x.approved === 'Approved' ? '' : 'warn')], drill: function () { self.setState({ rxRec: { back: self.state.rxRec || null, title: x.plate + ' · ' + x.status, sub: x.type + ' · ' + x.transporter + ' · ' + x.mandal + ', ' + nm, facts: [{ k: 'Status', v: x.status }, { k: 'Last GPS ping', v: x.ping }, { k: 'GPS device', v: x.device }, { k: 'Vehicle type', v: x.type }, { k: 'Transporter', v: x.transporter }, { k: 'Base mandal', v: x.mandal + ', ' + nm }, { k: 'Registration approval', v: x.approved }], steps: [], links: [] } }); } }; }), null, 'fleet-' + nm); }; });
      }
      if ((mode === 'prep' || ko.key === 'prep' || I.field === 'prep') && data && data.rows && !this._prepPops) { const sv = this._prepPops; this.buildPrep(path, 'all', 'all'); if (!this._prepPops) this._prepPops = sv; }
      if ((mode === 'prep' || ko.key === 'prep' || I.field === 'prep') && data && data.rows && this._prepPops) {
        const PP = this._prepPops; const pd = path[0] || null;
        data.rows.forEach(function (r) { const nm = String(r.name).replace(/^[\s\u2003▾▸]+/, '').replace(/\s*[›*]\s*$/, '').trim(); let fn = null;
          const mi = nm.match(/^(\d\d) · /); if (mi) { const i = parseInt(mi[1], 10) - 1; if (PRM[i]) fn = PP.param(i, pd); }
          else if (DBY[nm]) fn = PP.dist(nm);
          else if (pd) { const m = mandalsOf(pd).filter(function (x) { return x.name === nm; })[0]; if (m) fn = PP.mandal(pd, m); }
          if (fn) { r.drill = fn; r.canDrill = true; r.noDrill = false; } });
        dataNote = (dataNote ? dataNote + ' ' : '') + 'Click a row to drill down to the PPC / RSK or mill records.';
      }
      { const kq2 = (s.kQ || '').trim().toLowerCase(); if (kq2 && data && data.rows && !self._kqDone) data.rows = data.rows.filter(function (r) { return (String(r.name) + ' ' + r.cells.map(function (c) { return c.v; }).join(' ')).toLowerCase().indexOf(kq2) >= 0; }); self._kqDone = false; }
      let kAi = '';
      if (mode === 'alerts' || isIncK || ko.key === 'inc_cctv' || ko.key === 'inc_gps') { const sOK = self._seasOK || function () { return true; }; const dl = path[0] ? [path[0]] : D.map(function (d) { return d.name; }); let il = []; dl.forEach(function (d) { il = il.concat(incidentsOf(d).filter(function (i) { return (s.stage === 'all' || i.stage === s.stage) && sOK(i.stage) && self.inWin(i.ageH); })); });
        const KF = { p1: function (i) { return i.prio === 'P1'; }, inc_high: function (i) { return i.prio === 'P2'; }, inc_esc: function (i) { return i.status === 'Escalated'; }, inc_cctv: function (i) { return i.ent === 'Buffer godown' || i.ent === 'MLS point'; }, inc_gps: function (i) { return i.src === 'GPS'; } }[ko.key]; if (KF) il = il.filter(KF); if (ko.key !== 'inc_closed' && ko.key !== 'inc_grv') kAi = incAiList(il); }
      kinfo = { ctx: this.ctxInfo().text + ' · as of ' + this.ctxInfo().updated, q: s.kQ || '', onQ: function (e) { self.setState({ kQ: e.target.value }); }, clearQ: function () { self.setState({ kQ: '' }); }, hasQ: !!(s.kQ || '').trim(), ai: kAi, hasAi: !!kAi, act: function () { self.openAct({ name: ko.label, where: 'KPI · ' + (path[0] ? (LBL[path[path.length - 1]] || path[0]) : 'Andhra Pradesh'), facts: facts, kpi: { key: ko.key }, value: ko.value, dn: path[0] || null }); }, hasRec: false, recOpen: !!rec, rec: rec || emptyT, recLabel: 'Records', toggleRec: function () { self.setState({ kpiRec: 'rec' }); }, hasWorked: !!worked, worked: worked, has: true, group: ko.group || 'KPI', title: ko.label, value: ko.value, sub: ko.sub || '', def: I.def || ko.sub || '', calc: I.calc || '—', drill: I.drill || 'State → district → mandal', facts: facts, bars: bars, barsTitle: I.barsTitle || (bars.length ? ((I.dir === -1 ? 'Highest ' : 'Lowest ') + lvlName) : 'No breakdown available for this KPI yet'),
        tabs: tabs, isData: tab === 'data', isAbout: tab === 'about', data: Object.assign({}, data || emptyT, { has: !!data, note: dataNote }), canDownload: (tab === 'data' && !!data) || !!rec, download: function () { if (tab === 'rec' && rec) rec.download(); else if (data) data.download(); },
        hasGo: !!gm, goLabel: gm ? 'Open ' + (gm[1] !== 'overview' ? TABN[gm[1]] : (STAGES.filter(function (x) { return x.k === gm[0]; })[0] || { label: 'view' }).label) : '', go: function () { self.setState({ kpiOpen: null }); if (gm) self.go(gm[0], gm[1]); }, close: function () { self.setState({ kpiOpen: null, kpiRec: false }); }, stop: function (e) { if (e && e.stopPropagation) e.stopPropagation(); } };
    }

    /* crumbs */
    const baseLen = isDM ? 1 : 0;
    const drilled = !s.pivot && path.length > baseLen;
    const crumbs = [{ label: 'Andhra Pradesh', sep: false, dis: isDM || path.length === 0, go: function () { self.setState({ path: [] }); } }];
    path.forEach(function (id, i) { crumbs.push({ label: LBL[id] || id, sep: true, dis: i === path.length - 1 || (isDM && i === 0 && path.length === 1), go: function () { self.setState({ path: self.curPath().slice(0, i + 1) }); } }); });

    /* map */
    const mOK = function (k) { return !SID || !MAP_STAGE[k] || inSel(STAGE_SEASON[MAP_STAGE[k]]); };
    const mm = s.mapMetric || SE.map;
    const MET = {
      procPct: [function (v) { return Math.round(v.procPct * 100) + '%'; }, function (v) { return tone(v.procPct, 0.95, 0.8); }, 'Procurement vs target', function (v) { return v.procPct; }],
      pay24: [function (v) { return Math.round(v.pay24 * 100) + '%'; }, function (v) { return tone(v.pay24, 0.9, 0.8); }, 'Farmers paid within 24 h', function (v) { return v.pay24; }],
      cmrPct: [function (v) { return Math.round(v.cmrPct * 100) + '%'; }, function (v) { return tone(v.cmrPct, 0.6, 0.45); }, 'CMR delivered', function (v) { return v.cmrPct; }],
      util: [function (v) { return v.cap ? Math.round(v.util * 100) + '%' : '—'; }, function (v) { return tone(v.util, 0.85, 0.93, false); }, 'Godown utilisation', function (v) { return v.util; }],
      s2Pct: [function (v) { return Math.round(v.s2Pct * 100) + '%'; }, function (v) { return tone(v.s2Pct, 0.85, 0.7); }, 'Stage-II to FPS', function (v) { return v.s2Pct; }],
      alerts: [function (v) { return String(Math.round(v.alerts)); }, function (v) { return tone(v.p1, 0, 2, false); }, 'Open incidents', function (v) { return v.alerts; }],
      prep: [function (v) { return v.prepNA ? 'NA' : Math.round(v.prep * 100) + '%'; }, function (v) { return v.prepNA ? '' : tone(v.prep, 0.7, 0.5); }, 'Season preparedness', function (v) { return v.prepNA ? null : v.prep; }]
    };
    const met = MET[mm] || MET.procPct;
    const selD = path[0] || null;
    const mapND = false;
    const vals = D.map(function (d) { return met[3](distVals(d.name)); });
    const sorted = vals.filter(function (x) { return x !== null; }).sort(function (a, b) { return a - b; });
    const qs = [0.2, 0.4, 0.6, 0.8].map(function (q) { return sorted[Math.floor(q * (sorted.length - 1))]; });
    const bin = function (x) { let b = 0; qs.forEach(function (t) { if (x > t) b++; }); return b; };
    let tiles = D.map(function (d, i) {
      const v = distVals(d.name); const g = MAPD[d.name] || { d: '', cx: 0, cy: 0 };
      const off = isDM && d.name !== s.dm; const sel = selD === d.name; const b = bin(vals[i]);
      return { name: d.name, d: g.d, lx: (g.cx / 760 * 100).toFixed(2), ly: (g.cy / 649 * 100).toFixed(2), bg: off || mapND || vals[i] === null ? '#EEF1F5' : BLUES[b], fg: off || mapND ? 'transparent' : vals[i] === null ? '#6B7A90' : b >= 3 ? '#FFFFFF' : '#14233D', pcls: off ? 'off' : sel ? 'sel' : '', sel: sel, val: off || mapND ? '' : met[0](v),
        pick: function () { if (!off) self.setState({ path: [d.name], kpiOpen: null }); }, enter: function () { if (self.state.mapHover !== d.name) self.setState({ mapHover: d.name }); }, leave: function () { if (self.state.mapHover === d.name) self.setState({ mapHover: null }); } };
    });
    tiles = tiles.filter(function (t) { return !t.sel; }).concat(tiles.filter(function (t) { return t.sel; }));
    const hv = s.mapHover && DBY[s.mapHover] ? distVals(s.mapHover) : null;
    const map = { tiles: tiles, metric: mm, metricLabel: met[2], lo: met[0]({ procPct: sorted[0], pay24: sorted[0], cmrPct: sorted[0], util: sorted[0], s2Pct: sorted[0], alerts: sorted[0], prep: sorted[0] }), hi: met[0]({ procPct: sorted[sorted.length - 1], pay24: sorted[sorted.length - 1], cmrPct: sorted[sorted.length - 1], util: sorted[sorted.length - 1], s2Pct: sorted[sorted.length - 1], alerts: sorted[sorted.length - 1], prep: sorted[sorted.length - 1] }),
      hasSel: !!selD && !isDM, canPick: !isDM, selVal: selD || '', hasHover: !!hv, hoverName: s.mapHover || '', hoverText: hv ? met[2] + ' ' + (mapND ? ND : met[0](hv)) : '', hasScale: !mapND, nd: mapND, ndText: mapND ? met[2] + ' · ' + ND + ' for ' + SID.short : '',
      hint: isDM ? 'Locked to ' + s.dm + ' for the District Manager view' : selD ? 'Showing ' + selD + ' — the whole dashboard is scoped to it' : 'Click a district to scope the whole dashboard to it · darker = higher',
      pts: (function () { const t = s.mapPts; if (!MST[t]) return { on: false, d: '', note: '', list: function () {} }; const dn = isDM ? s.dm : selD; const p = mstPts(t, dn);
        return { on: true, d: p.d, note: fmtN(p.all) + ' ' + MST_LC[t] + ' in ' + (dn || 'Andhra Pradesh') + ' · ' + fmtN(p.n) + ' with coordinates in ' + MST_SRC[t],
          list: function () { const T = function (x) { return Object.assign(C(x), { cls: 'txt' }); }; let l = []; (dn ? [dn] : D.map(function (d) { return d.name; })).forEach(function (k) { l = l.concat(mstRecs(t, k)); });
            self.tablePopup(MST_LBL[t] + ' · ' + (dn || 'Andhra Pradesh'), fmtN(l.length) + ' records from ' + MST_SRC[t], ['Name', 'Code', 'District', 'Mandal', 'Latitude', 'Longitude'], l.map(function (r) { return { name: r.name, cells: [T(r.code), T(r.dn), T(r.mandal || 'Not matched'), C(r.lat ? r.lat.toFixed(4) : '—'), C(r.lon ? r.lon.toFixed(4) : '—')] }; }), null, MST_SRC[t].replace('.xls', '') + (dn ? '-' + dn : '')); } }; })(),
      ptsVal: s.mapPts || '', onPts: function (e) { self.setState({ mapPts: e.target.value }); },
      metrics: Object.keys(MET).filter(mOK).concat(Object.keys(MET).filter(function (k) { return !mOK(k); })).map(function (k) { return { v: k, label: MET[k][2] }; }), onMetric: function (e) { self.setState({ mapMetric: e.target.value }); }, onPick: function (e) { self.setState({ path: e.target.value ? [e.target.value] : [] }); }, clear: function () { self.setState({ path: [] }); } };

    /* chat */
    const sugs = (s.sugHide ? [] : isDM ? ['How many trips are still not completed in Stage 1?', 'Deliveries awaiting ePoS acknowledgement', 'Pending payments in my district', 'Which mills are behind on CMR this season?', 'Open critical incidents, last 7 days', 'Vehicles that deviated today', 'నా జిల్లాలో పెండింగ్ చెల్లింపులు'] : ['How many trips are still not completed in Stage 1?', 'Payment batches rejected or failed', 'Grievances overdue on SLA', 'Which districts are lagging on procurement?', 'Which mills are behind on CMR this season?', 'Pending payments in Krishna', 'Open critical incidents, last 7 days', 'Godown storage status', 'పెండింగ్ చెల్లింపులు']).map(function (t) { return { text: t, ask: function () { self.ask(t); } }; });
    const msgs = (s.chatMsgs || this.greeting()).map(function (m) { return { cls: m.me ? 'me' : 'ai', text: m.text, hasBars: !!(m.bars && m.bars.length), bars: m.bars || [], hasAct: !!m.act, actLabel: m.actLabel, act: m.act ? function () { m.act(); } : function () {} }; });

    const ROLE = { comm: "Commissioner's view", ho: 'Head office view', dm: 'District Manager view' };
    const now = new Date();
    const modal = s.modal || { title: '', body: '', text: '', msg: '', isShare: false };

    return {
      roleTitle: isDM ? ROLE.dm + ' · ' + s.dm : ROLE[s.role],
      asOf: now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + pad(now.getHours(), 2) + ':' + pad(now.getMinutes(), 2),
      role: s.role, onRole: function (e) { const r = e.target.value; self.setState({ role: r, module: r !== 'dm' && self.state.module === 'inbox' ? 'overview' : self.state.module, rxRec: null, act: null, path: r === 'dm' ? [self.state.dm] : [], chatMsgs: null, kpiOpen: null, showDist: false }); },
      roleBtns: [['comm', 'Commissioner'], ['ho', 'Head office'], ['dm', 'District Manager']].map(function (r) { const on = s.role === r[0]; return { label: r[1], on: on, cls: on ? 'on' : '', pick: function () { self.setState({ role: r[0], path: r[0] === 'dm' ? [self.state.dm] : [], chatMsgs: null }); } }; }),
      isDM: isDM, dm: s.dm, onDm: function (e) { self.setState({ dm: e.target.value, path: [e.target.value], chatMsgs: null }); },
      seas: (function () {
        const isCust = s.season === 'custom';
        const groups = SEAS_GRP.map(function (g) { return { year: g[0], items: g[1].map(function (it) { const on = inSel(it[0]); const has = !!SEAS_ID[it[0]].lens; return { name: it[1], sub: has ? '' : 'no records loaded', on: on, mark: on ? '✓' : '', cls: 'mso sso' + (on ? ' on' : ''), pick: function () { const l = (self.state.season === 'custom' ? [] : (self.state.seasons || []).slice()); const i = l.indexOf(it[0]); if (i >= 0) l.splice(i, 1); else l.push(it[0]); setSeas(l); } }; }) }; });
        const allOn = !isCust && SELS.length === 0;
        return { open: !!s.seasOpen, toggle: function () { self.setState({ seasOpen: !self.state.seasOpen }); }, close: function () { self.setState({ seasOpen: false }); },
          label: isCust ? 'Custom date & time' : SELS.length === 0 ? 'All seasons' : SELS.length === 1 ? SEAS_NAME[SELS[0]] : SELS.length + ' seasons',
          groups: groups, allMark: allOn ? '✓' : '', allCls: 'mso sso' + (allOn ? ' on' : ''), all: function () { setSeas([]); },
          custCls: 'mso sso' + (isCust ? ' on' : ''), custMark: isCust ? '✓' : '', custom: function () { saveSeas({ seasons: [], season: 'custom' }); self.setState({ season: 'custom', seasons: [], mapMetric: '', kpiOpen: null, seasOpen: false }); },
          hasChips: SELS.length > 0, chips: SELS.map(function (k) { return { label: SEAS_NAME[k], rm: function () { setSeas(SELS.filter(function (x) { return x !== k; })); } }; }), clear: function () { setSeas([]); } };
      })(),
      seasonSel: SEAS_ID[s.season] || SEASONS[s.season] || s.season === 'custom' ? s.season : 'all', onSeason: function (e) { const nv = e.target.value; const o = { season: nv, mapMetric: '', kpiOpen: null };
        self.setState(o); },
      transposed: s.transposed, transCls: s.transposed ? 'btn sm on' : 'btn sm',
      clearFilters: function () { saveSeas({ seasons: [], season: 'all' }); self.setState({ seasons: [], seasOpen: false, stage: 'all', module: 'overview', glance: 'rsk', season: 'all', mapMetric: '', pivot: false, path: self.basePath(), pvSel: null, kpiOpen: null, showDist: false, period: 'season', dtFrom: '', dtTo: '' }); }, toggleTranspose: function () { self.setState({ transposed: !self.state.transposed }); },
      pivotOpen: s.pivot, notPivot: !s.pivot, pivotCls: (s.pivot || editOn) ? 'btn sm on' : 'btn sm', togglePivot: function () { if (self.state.pivot) self.setState({ pivot: false, editMode: true, addOpen: false }); else self.setState({ editMode: !self.state.editMode, addOpen: false, kpiOpen: null }); }, customOn: s.pivot || editOn,
      ach: (function () { if (true || blank || s.pivot || !(mode === 'home' || mode === 'fin') || path.length > 1) return { on: false, all: false, title: '', text: '', label: '', go: function () {} }; const d0 = path[0] && DBY[path[0]] ? path[0] : null; return self.achFor(d0 ? [d0] : D.map(function (d) { return d.name; }), d0 || 'Andhra Pradesh'); })(),
      sEmpty: (function () { if (!blank) return { on: false, title: '', text: '', hasAlt: false, altLabel: '', alt: function () {} }; const own = ownSeas; const alt = SID.lens && own ? own : null;
        return { on: true, title: 'No records for ' + SID.long, text: SID.lens && own ? (mode === 'cctv' ? 'CCTV (buffer godowns and MLS points)' : SEAS_STG[stgOf]) + ' records in this dashboard belong to ' + SEAS_ID[own].long + ', which is not in your selection.' : 'No records for ' + SID.long + ' are loaded in this dashboard. Choose a season that has data, or All seasons.', hasAlt: !!alt, altLabel: alt ? 'Show ' + SEAS_NAME[alt] : '', alt: function () { if (alt) setSeas([alt]); }, allLabel: 'Show all seasons', all: function () { setSeas([]); } }; })(),
      L: L, edit: edit, mainCls: mainCls, sBanner: SID ? { on: !s.pivot, cls: 'sbanner sb-' + (SID.lens && SID.lens !== 'multi' ? SID.lens : SID.lens ? 'proc' : 'nd'), title: MULTI ? 'Marketing seasons · ' + SID.short : SEAS_NAME[SELS[0]] + ' · ' + SID.long, desc: SID.lens ? 'Showing ' + SID.long + ' records: ' + Object.keys(STAGE_SEASON).filter(function (k) { return inSel(STAGE_SEASON[k]); }).map(function (k) { return SEAS_STG[k]; }).join(', ') + '. Incidents, GPS and CCTV are live feeds and are not split by season.' : 'No records for ' + SID.long + ' are loaded in this dashboard yet.', clear: function () { setSeas([]); } } : { on: sk !== 'all' && !s.pivot, cls: 'sbanner sb-' + sk, title: SE.title || '', desc: (SE.desc || '') + (mode === 'home' ? ' Only this season\u2019s measures are shown on the overview.' : ''), clear: function () { self.setState({ season: 'all', mapMetric: '' }); } },
      hasRx: !!s.rxRec, rx: s.rxRec ? Object.assign({ hasList: !!(s.rxRec.list && s.rxRec.list.length), list: [], hasBack: !!s.rxRec.back, backLabel: s.rxRec.back ? '← Back to ' + s.rxRec.back.title : '', goBack: function () { self.setState({ rxRec: self.state.rxRec && self.state.rxRec.back || null }); },  hasLinks: !!(s.rxRec.links && s.rxRec.links.length), lks: (s.rxRec.links || []).map(function (l) { return Object.assign({}, l, { isHref: !!l.href, isBtn: !l.href }); }), hasSteps: !!(s.rxRec.steps && s.rxRec.steps.length), hasFacts: !!(s.rxRec.facts && s.rxRec.facts.length), incs: (self._rxIncs = (function () { if (s.rxRec.rec1 || s.rxRec.tbl) return []; const t0 = String(s.rxRec.title || ''); const hint = (s.rxRec.sub || '') + ' ' + (s.rxRec.facts || []).map(function (f) { return f.v; }).join(' '); let il = incLinksFor(t0, hint); if (!il.length) il = incLinksFor(t0.split(' · ')[0], hint); return il.map(function (id) { const i = TX[id]; return { id: id, title: i.title, meta: SEV[i.prio] + ' · ' + i.status + ' · ' + i.ageH + ' h', cls: 'inclink ' + (i.prio === 'P1' ? 'p1' : ''), go: function () { self.setState({ rxRec: self.rxBack(self.incRec(i)) }); } }; }); })()), hasIncs: self._rxIncs.length > 0, hasImg: !!s.rxRec.img, hasPg: !!s.rxRec.pgImg, pgCls: 'rxpg' + (s.rxRec.pgBig ? ' big' : ''), pgOpen: !!s.rxRec.pgBig, pgToggle: function () { self.setState({ rxRec: Object.assign({}, self.state.rxRec, { pgBig: !self.state.rxRec.pgBig }) }); }, img: s.rxRec.img || '', imgDur: s.rxRec.imgDur || '', hasCmt: !!s.rxRec.cmt, cmtTitle: s.rxRec.cmt ? s.rxRec.cmt.title : '', cmtBody: s.rxRec.cmt ? s.rxRec.cmt.body : '', cmtMock: !!(s.rxRec.cmt && s.rxRec.cmt.mock), cmtBars: s.rxRec.cmt ? s.rxRec.cmt.bars || [] : [], cmtThemes: s.rxRec.cmt ? s.rxRec.cmt.themes || [] : [], cmtSamples: s.rxRec.cmt ? s.rxRec.cmt.samples || [] : [], aiLabel: s.rxRec.aiLabel || 'AI summary', aiSrc: s.rxRec.aiSrc || 'Written from the records shown here', hasSrc: !!s.rxRec.src, src: s.rxRec.src || '', srcLabel: s.rxRec.srcLabel || 'Source text', hasRej: !!s.rxRec.rejForm, rejBtn: s.rxRec.rejKind === 'reply' ? (s.rxRec.inboxDone ? 'Save and mark done' : 'Send reply') : s.rxRec.rejKind === 'adv' ? 'Raise advisory' : 'Issue rejoinder', rejIsAdv: s.rxRec.rejKind === 'adv', rejTitle: s.rxRec.rejKind === 'reply' ? (s.rxRec.inboxDone ? 'Mark done with a note' : 'Reply') : s.rxRec.rejKind === 'adv' ? 'Raise advisory' : 'Issue rejoinder', rejNote: s.rxRec.rejKind === 'reply' ? 'Your reply is recorded against this item and shown to the sender in the decision log.' : s.rxRec.rejKind === 'adv' ? 'AI draft · edit before sending. It is recorded in the Decision log against this clipping, with the date and who it went to.' : 'AI draft · edit the facts in brackets before sending. It is recorded in the Decision log against this clipping, with the issue date; its status stays "awaiting publication" until you mark it published.', rejTo: s.rxRec.rejTo || '', onRejTo: function (e) { self.setState({ rxRec: Object.assign({}, self.state.rxRec, { rejTo: e.target.value }) }); }, rejText: s.rxRec.rejText || '', rejBy: s.rxRec.rejBy || '', onRejText: function (e) { self.setState({ rxRec: Object.assign({}, self.state.rxRec, { rejText: e.target.value }) }); }, onRejBy: function (e) { self.setState({ rxRec: Object.assign({}, self.state.rxRec, { rejBy: e.target.value }) }); }, sendRej: function () { const x = self.state.rxRec; const id = (x.facts || []).filter(function (f) { return f.k === 'Clipping ID'; })[0]; const c = id ? pressClips().filter(function (q) { return q.id === id.v; })[0] : null; if (x.rejKind === 'reply') { self.inboxReply(x.inboxKey, x.rejText, x.inboxDone); return; } if (c) { if (x.rejKind === 'adv') self.pwRaiseAdv(c, x.rejText, x.rejBy, x.rejTo); else self.pwIssueRej(c, x.rejText, x.rejBy); } }, cancelRej: function () { self.setState({ rxRec: Object.assign({}, self.state.rxRec, { rejForm: false }) }); }, hasReopen: !!s.rxRec.reopenForm, reopenWhy: s.rxRec.reopenWhy || '', onReopenWhy: function (e) { self.setState({ rxRec: Object.assign({}, self.state.rxRec, { reopenWhy: e.target.value }) }); }, confirmReopen: function () { const x = self.state.rxRec; if (x.closedF) self.logReopen(x.closedF, x.reopenWhy); }, cancelReopen: function () { self.setState({ rxRec: Object.assign({}, self.state.rxRec, { reopenForm: false }) }); }, hasWhy: !!(s.rxRec.why && s.rxRec.why.length), whyOpen: !!s.rxRec.whyOpen, whyLabel: (s.rxRec.whyOpen ? '▾ Why' : '▸ Why') + ' · ' + ((s.rxRec.why || []).length) + ' reason' + ((s.rxRec.why || []).length === 1 ? '' : 's'), whyList: s.rxRec.whyOpen ? self.whyItems(s.rxRec.why || [], s.rxRec.whyHint || { dn: actDist(String(s.rxRec.title) + ' ' + String(s.rxRec.sub || '')) }) : [], acts: s.rxRec.incId && TX[s.rxRec.incId] ? self.incActions(TX[s.rxRec.incId]).slice(0, 12) : [], hasActs: !!(s.rxRec.incId && TX[s.rxRec.incId] && self.incActions(TX[s.rxRec.incId]).length), actsN: s.rxRec.incId && TX[s.rxRec.incId] ? (function () { const l = self.incActions(TX[s.rxRec.incId]); if (!l.length) return ''; const dmN = l.filter(function (a) { return a.role === 'dm'; }).length; return fmtN(l.length) + ' recorded' + (dmN ? ' · ' + dmN + ' by the District Manager' : '') + ' · latest ' + l[0].when; })() : '', hasLayers: !!(s.rxRec.incId && TX[s.rxRec.incId]) || !!s.rxRec.media, layers: s.rxRec.incId && TX[s.rxRec.incId] ? self.incLayers(TX[s.rxRec.incId]) : s.rxRec.media ? self.mediaLayers(s.rxRec.media) : [], askMore: function () { const x = self.state.rxRec; if (x.incId) return self.askMore({ incId: x.incId, title: x.title }); if (x.media) return self.askMore({ media: x.media, title: x.title }); const t = x.tbl; self.askMore({ title: x.title, dn: actDist(String(x.title) + ' ' + String(x.sub || '')), facts: (x.facts || []).concat(t && t.count ? [{ k: 'Records', v: t.count }] : []), why: x.why || [], action: x.ai || '', hint: x.whyHint || null }); }, toggleWhy: function () { self.setState({ rxRec: Object.assign({}, self.state.rxRec, { whyOpen: !self.state.rxRec.whyOpen }) }); }, hasAi: !!s.rxRec.ai, hasTbl: !!s.rxRec.tbl, q: s.rxRec.q || '', onQ: function (e) { const x = self.state.rxRec; self.setState({ rxRec: Object.assign({}, x, { q: e.target.value }) }); }, clearQ: function () { self.setState({ rxRec: Object.assign({}, self.state.rxRec, { q: '' }) }); }, hasQ: !!(s.rxRec.q || '').trim(), canSearch: !!(s.rxRec.tbl && (s.rxRec.tbl.all || s.rxRec.tbl.rows).length > 5), actLabel: s.rxRec.tbl && !s.rxRec.rec1 ? 'Act on this list' : 'Act on this record', act: function () { const x = self.state.rxRec; const t = x.rec1 ? null : x.tbl; const r0 = t && t.rows && t.rows[0]; self.openAct({ name: x.title, where: x.sub, facts: (x.facts || []).concat(t ? [{ k: 'Records', v: t.count }] : []), list: r0 ? { n: t.count, first: { name: r0.name, where: x.title, facts: t.cols.slice(1).map(function (c, j) { return { k: c.label, v: r0.cells[j] ? r0.cells[j].v : '' }; }) } } : null }); } }, s.rxRec, { tbl: s.rxRec.tbl ? (function (t) { const q = (s.rxRec.q || '').trim().toLowerCase(); if (!q || !t.all) return t; const m = t.all.filter(function (r) { return (String(r.name) + ' ' + r.cells.map(function (c) { return c.v; }).join(' ')).toLowerCase().indexOf(q) >= 0; }); return Object.assign({}, t, { rows: m.slice(0, 300), count: fmtN(m.length) + ' of ' + fmtN(t.all.length) + ' match "' + s.rxRec.q.trim() + '"' + (m.length > 300 ? ' · first 300 shown' : '') }); })(s.rxRec.tbl) : { cols: [], rows: [], grid: '1fr', hasTotal: false, total: [], totalLabel: '', count: '', download: function () {} } }) : { hasRej: false, rejText: '', rejBy: '', onRejText: function () {}, onRejBy: function () {}, sendRej: function () {}, cancelRej: function () {}, rejBtn: '', rejIsAdv: false, rejTitle: '', rejNote: '', rejTo: '', onRejTo: function () {}, hasImg: false, hasPg: false, pgOpen: false, pgCls: 'rxpg', img: '', imgDur: '', hasCmt: false, cmtTitle: '', cmtBody: '', cmtMock: false, cmtBars: [], cmtThemes: [], cmtSamples: [], aiLabel: '', aiSrc: '', hasSrc: false, src: '', srcLabel: '', hasReopen: false, reopenWhy: '', onReopenWhy: function () {}, confirmReopen: function () {}, cancelReopen: function () {}, hasWhy: false, whyOpen: false, whyLabel: '', whyList: [], hasLayers: false, layers: [], acts: [], hasActs: false, actsN: '', askMore: function () {}, toggleWhy: function () {}, incs: [], hasIncs: false, q: '', onQ: function () {}, clearQ: function () {}, hasQ: false, canSearch: false, ai: '', hasAi: false, actLabel: 'Act', act: function () {}, hasList: false, list: [], hasBack: false, backLabel: '', goBack: function () {}, title: '', sub: '', facts: [], steps: [], links: [], hasLinks: false, hasSteps: false, hasFacts: false, hasTbl: false, tbl: { cols: [], rows: [], grid: '1fr', hasTotal: false, total: [], totalLabel: '', count: '', download: function () {} } }, closeRx: function () { self.setState({ rxRec: null }); }, stopRx: function (e) { if (e && e.stopPropagation) e.stopPropagation(); },
      topItems: topItems, leftItems: leftItems,
      topLabel: s.transposed ? 'Stages' : 'Modules', leftLabel: s.transposed ? 'Modules' : 'Stages',
      topAria: s.transposed ? 'Stages' : 'Modules', leftAria: s.transposed ? 'Modules' : 'Stages',
      subTabs: (function () { const G = [[['cctv', 'gps', 'img'], 'Monitoring', ['CCTV records', 'GPS tracking', 'Image analyser'], 'mon'], [['news', 'yt'], 'Media', ['News clips', 'YouTube'], 'media']]; const g = G.filter(function (x) { return x[0].indexOf(s.module) >= 0; })[0]; if (!g) return { has: false, tabs: [] };
        return { has: !s.pivot, label: g[1], tabs: g[0].map(function (k, i) { return { label: g[2][i], cls: 'itab' + (s.module === k ? ' on' : ''), pick: function () { const o = { module: k, kpiOpen: null, rxRec: null }; o['last_' + g[3]] = k; self.setState(o); } }; }) }; })(),
      act: this.actUI(),
      refresh: { go: function () { self.refreshAll(); }, hasNote: !!s.refNote, note: s.refNote || '' },
      pctx: (function () { const ci = self.ctxInfo(); const mode0 = s.module === 'overview' ? (s.stage === 'all' ? 'home' : s.stage) : s.module;
        const inc = { alerts: 'Incident figures: live (open now); trends and resolution times use closed incidents for the selected period', cctv: 'Camera and incident figures: live', gps: 'Vehicle, trip and incident figures: live (today)', prep: 'Preparedness: Kharif 2026-27 snapshot of ' + ci.prep, intel: 'Answers use live incidents and the selected filters', fin: 'Payments: season to date for the selected period' }[mode0] || 'Quantities: season to date for the selected period; incident counts: live (open now)';
        return { updated: 'Last updated ' + ci.updated, chips: ci.filters.map(function (x) { return { t: x.k + ': ' + x.v, on: !/^All/.test(x.v) }; }).map(function (x) { return { t: x.t, cls: 'ctxc' + (x.on ? ' on' : '') }; }), live: inc }; })(),
      distF: { show: s.module === 'overview' && s.stage === 'all' && !s.pivot && !isDM, val: (s.path && s.path[0]) || '', opts: D.map(function (d) { return { name: d.name }; }), pick: function (e) { const v = e.target.value; self.setState({ path: v ? [v] : [], kpiOpen: null, kpiRec: false, rxRec: null, mxSel: null }); } },
      glanceVal: s.module === 'glance' ? s.glance : '', onGlance: function (e) { const v = e.target.value; if (!v) return; self.setState({ module: 'glance', glance: v, stage: 'all', pivot: false, path: self.curPath().slice(0, 1) }); },
      isCustom: s.season === 'custom', dtFrom: s.dtFrom, dtTo: s.dtTo,
      onFrom: function (e) { self.setState({ dtFrom: e.target.value }); }, onTo: function (e) { self.setState({ dtTo: e.target.value }); },
      toggleDist: function () { self.setState({ showDist: !self.state.showDist }); },
      showTopBack: !!prevNav && !(s.module === 'prep' && page.prepUI && page.prepUI.isParam), hasPrev: !!prevNav, prevLabel: prevNav ? 'Back to ' + navLabel(prevNav) : '', goPrev: function () { const h = self._navHist || []; const n = h.pop(); if (!n) return; self._navBack = true; self.setState(Object.assign({}, n, { kpiOpen: null, rxRec: null })); },
      kinfo: kinfo, crumbs: crumbs, drilled: drilled, goBack: function () { const p = self.curPath(); self.setState({ path: p.slice(0, Math.max(baseLen, p.length - 1)), kpiOpen: null }); }, page: page, season: SE, map: map,
      clearStage: function () { self.setState({ stage: 'all' }); },
      goAlerts: function () { self.go('all', 'alerts'); },
      pv: this.buildPivot(),
      chatOpen: s.chatOpen, chatClosed: !s.chatOpen, openChat: function () { self.setState({ chatOpen: true }); }, goAsk: function () { self.setState({ module: 'intel', stage: 'all', pivot: false, intelTab: 'main', chatOpen: false, rxRec: null, kpiOpen: null, act: null }); try { window.scrollTo({ top: 0, behavior: 'smooth' }); const el = document.getElementById('ucc-intel'); if (el) setTimeout(function () { try { el.focus(); } catch (e) {} }, 300); } catch (e) {} }, closeChat: function () { self.setState({ chatOpen: false }); },
      chatMsgs: msgs, chatSugs: sugs, chatInput: s.chatInput, sugHidden: !!s.sugHide, sugLabel: s.sugHide ? 'Show suggested questions' : 'Hide suggested questions', toggleSugs: function () { self.setState({ sugHide: !self.state.sugHide }); },
      onChatInput: function (e) { self.setState({ chatInput: e.target.value }); },
      onChatSubmit: function (e) { if (e && e.preventDefault) e.preventDefault(); self.ask(self.state.chatInput); },
      hasModal: !!s.modal, modal: modal, noop: function () {},
      shareIn: s.shareIn, onShareIn: function (e) { self.setState({ shareIn: e.target.value }); },
      closeModal: function () { self.setState({ modal: null, shareIn: '' }); },
      copyModal: function () { const t = (self.state.modal || {}).text || ''; const done = function (ok) { self.setState({ modal: Object.assign({}, self.state.modal, { msg: ok ? 'Copied to clipboard.' : 'Select the text and copy it manually.' }) }); }; try { navigator.clipboard.writeText(t).then(function () { done(true); }, function () { done(false); }); } catch (e) { done(false); } },
      applyShare: function () {
        const code = (self.state.shareIn || '').trim(); if (!code) return;
        try { let c; try { c = JSON.parse(decodeURIComponent(escape(atob(code)))); } catch (e1) { c = JSON.parse(code); } if (!c || !Array.isArray(c.rows)) throw new Error('bad'); self.buildPivot().load(c, 'Loaded a shared view.'); self.setState({ modal: null, shareIn: '', pivot: true }); }
        catch (e) { self.setState({ modal: Object.assign({}, self.state.modal, { msg: 'That code could not be read.' }) }); }
      }
    };
  }
}
