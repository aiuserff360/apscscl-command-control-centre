/* Engine: runs the client's baseline view-model (data/component.js) headlessly.
   The baseline computes every number, table, record and suggestion; this app only decides where it lives and how it looks. */
(function () {
  'use strict';
  // Minimal stand-in for the runtime's DCLogic base class.
  window.DCLogic = class DCLogic {
    constructor(p) { this.props = p || {}; this.state = {}; this.__host = null; }
    setState(p, cb) { if (this.__host) this.__host.__setLogicState(p, cb); else { Object.assign(this.state, typeof p === 'function' ? p(this.state) : p); if (cb) cb(); } }
    forceUpdate() { if (this.__host) this.__host.forceUpdate(); }
    componentDidMount() {} componentDidUpdate() {} componentWillUnmount() {}
    renderVals() { return {}; }
  };
  window.React = window.React || {};
})();

window.Engine = (function () {
  'use strict';
  const E = { L: null, vm: null, fns: [], listeners: [], dirty: false, ready: false };
  // Keep the example District Manager inside the assigned district, including
  // temporary views, saved report filters and callbacks from older screens.
  const scopedPatch = function (patch) {
    const current = E.L.state;
    const next = Object.assign({}, current, typeof patch === 'function' ? patch(current) : patch);
    if (next.role === 'dm') {
      const district = current.role === 'dm' ? current.dm : next.dm;
      next.dm = district;
      next.path = next.path && next.path[0] === district ? next.path : [district];
      next.pvDist = district;
      if (current.role !== 'dm') {
        next.modal = null; next.rxRec = null; next.act = null;
        next.kpiOpen = null; next.mxSel = null; next.pvSel = null;
        next.intelOpen = null; next.intelCtx = null; next.intelMsgs = []; next.chatMsgs = null;
      }
    }
    return next;
  };
  const host = {
    __setLogicState(p, cb) { Object.assign(E.L.state, scopedPatch(p)); if (cb) cb(); E.invalidate(); },
    forceUpdate() { E.invalidate(); }
  };
  E.boot = function () {
    E.L = new Component({}); /* global lexical class from data/component.js */
    E.L.__host = host;
    try { E.L.componentDidMount(); } catch (e) { console.warn('mount', e); }
    E.ready = true;
    E.invalidate();
  };
  E.invalidate = function () { if (E.dirty) return; E.dirty = true; Promise.resolve().then(function () { E.dirty = false; E.listeners.forEach(function (f) { f(); }); }); };
  E.onChange = function (f) { E.listeners.push(f); };
  E.set = function (p) { Object.assign(E.L.state, scopedPatch(p)); };            // silent (no re-render)
  E.setState = function (p) { E.L.setState(p); };                    // re-renders
  E.render = function () { E.vm = E.L.renderVals(); return E.vm; };
  // Compute a view-model for a temporary state without disturbing navigation history.
  E.withState = function (temp, fn) {
    const L = E.L; const saved = Object.assign({}, L.state);
    const nav = { k: L._navKey, s: L._navSnap, h: L._navHist ? L._navHist.slice() : L._navHist, b: L._navBack };
    Object.assign(L.state, scopedPatch(temp));
    let out;
    try { out = fn(L.renderVals()); } catch (e) { console.warn('withState', e); out = null; }
    L.state = saved; L._navKey = nav.k; L._navSnap = nav.s; L._navHist = nav.h; L._navBack = nav.b;
    return out;
  };
  E.peek = function (temp) { return E.withState(temp, function (vm) { return vm; }); };
  // Closure registry for the rendered DOM.
  E.resetFns = function () { E.fns = []; };
  E.bind = function (fn) { if (typeof fn !== 'function') return ''; E.fns.push(fn); return String(E.fns.length - 1); };
  E.call = function (id, ev) { const f = E.fns[+id]; if (f) { try { f(ev); } catch (e) { console.error(e); } } };
  return E;
})();
