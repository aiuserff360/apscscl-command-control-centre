/* Presentation only: source rules, metrics and recommended actions remain unchanged. */
window.IncidentUI = (function () {
  'use strict';
  const U = window.UI, esc = U.esc;
  const first = text => String(text || '').split(/(?<=[.!?])\s+(?=[A-Z])/)[0];
  const field = (label, value) => '<div><dt>'+esc(label)+'</dt><dd>'+esc(value)+'</dd></div>';
  function brief(r) {
    const i = TX[r.incId]; if (!i) return '';
    const c = incCat(i), action = c && c.action || 'Verify the supporting records, then close or escalate the incident.';
    return '<section class="incident-brief" aria-label="Incident brief"><h3>Incident brief</h3><dl>'+field('Why it needs attention', String(i.why).replace(/^Critical by type · /, '').replace(/(\d+) h\b/g, '$1 hours').replace(/past the (\d+) hours response time/g, 'exceeding the response standard of $1 hours'))+field('Next step', action)+field('Responsible office', c && c.ownerOffice || ({proc:'Procurement wing',cmr:'Custom milled rice cell',s1:'Transportation cell',s2:'Distribution wing',stor:'Storage wing'}[i.stage] || 'Responsible office not recorded'))+field('Current severity response standard', SEV_RESP_H[i.prio]+' hours')+(c && c.sla ? field('Catalogue response requirement', c.sla) : '')+'</dl>'+followup(i)+'<p class="note">Demo incident · validate the supporting records before taking action.</p></section>';
  }
  function followup(i) {
    const logs=(Engine.L.state.actLog||[]).filter(e=>e.incId===i.id || new RegExp('(^|[^A-Z0-9-])'+i.id+'($|[^A-Z0-9-])').test(String(e.rec||'')));
    return '<div class="incident-followup"><h4>Intervention status</h4>'+(logs.length ? logs.map(e=>'<div><b>'+esc(e.id+' · '+(e.status==='Done'?'Completion recorded':'Action pending'))+'</b><p>'+esc(e.action||e.decision)+'</p><p>'+esc('Responsible office: '+(e.owner||'Not recorded')+'. Response deadline: '+(e.by||'Not recorded')+'.')+'</p>'+U.btn('Review the decision record',()=>Engine.L.openLogEntry(e.id),'xs ghost')+'</div>').join('') : '<p>No decision has been recorded for this incident. Review the evidence and recommended action before assigning responsibility.</p>')+'<p class="note">Verify the operational outcome against the source records before treating the issue as resolved.</p></div>';
  }
  function layers(r) {
    const names = ['Incident details','Supporting records','Detection rule','Source evidence','Impact and related issues','Recommended action'];
    return '<section class="case-file"><h3>Supporting evidence and recommended action</h3><p class="note">Expand a section to inspect the records behind this incident.</p>'+r.layers.map(function(l) {
      const rows = l.rows || [], id = 'case-layer-'+l.n;
      return '<details class="layer"><summary class="lh" aria-controls="'+id+'"><span class="n">'+esc(l.n)+'</span><span>'+esc(names[l.n-1] || l.title)+'</span><span class="ls">'+rows.length+' items</span></summary><div class="lb" id="'+id+'"><dl class="case-rows">'+rows.map(function(x) {
        const label = x.k || x.label || '', value = x.v || x.text || '';
        return '<div><dt>'+esc(label === 'AI summary' ? 'Full incident summary' : label)+'</dt><dd>'+esc(value)+(x.links && x.links.length ? '<div class="tools">'+x.links.map(k=>U.btn(k.label || k.id, k.go || k.pick || k.open,'xs ghost')).join('')+'</div>' : '')+'</dd></div>';
      }).join('')+'</dl>'+(l.hasNote ? '<p class="note">'+esc(l.note)+'</p>' : '')+(l.ask ? U.btn('Ask about this section',l.ask,'xs ghost') : '')+'</div></details>';
    }).join('')+'</section>';
  }
  function summary(r) {
    const sentences=String(r.ai||'').split(/(?<=[.!?])\s+(?=[A-Z])/),lead=sentences.slice(0,2).join(' ');
    return '<section class="record-summary"><h3>'+esc(r.aiLabel||'Record summary')+'</h3><p>'+esc(lead)+'</p>'+(sentences.length>2?'<details><summary>Read the complete summary</summary><p>'+esc(r.ai)+'</p></details>':'')+(r.aiSrc?'<p class="note">'+esc(r.aiSrc)+'</p>':'')+'</section>';
  }
  return {brief, layers, summary};
})();
