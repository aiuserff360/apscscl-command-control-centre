/* Presentation only: source rules, metrics and recommended actions remain unchanged. */
window.IncidentUI = (function () {
  'use strict';
  const U = window.UI, esc = U.esc;
  const first = text => String(text || '').split(/(?<=[.!?])\s+(?=[A-Z])/)[0];
  const field = (label, value) => '<div><dt>'+esc(label)+'</dt><dd>'+esc(value)+'</dd></div>';
  function brief(r) {
    const i = TX[r.incId]; if (!i) return '';
    const c = incCat(i), action = c && c.action || 'Verify the supporting records, then close or escalate the incident.';
    return '<section class="incident-brief" aria-label="Incident brief"><h3>Incident brief</h3><dl>'+field('Why it needs attention', String(i.why).replace(/^Critical by type · /, ''))+field('Next step', first(action))+field('Responsible office', c && c.ownerOffice || STAGE_NAME[i.stage])+field('Response target', c && c.sla || SEV_RESP_H[i.prio]+' hours')+'</dl><p class="note">Demo incident · validate the supporting records before taking action.</p></section>';
  }
  function layers(r) {
    const names = ['Incident details','Supporting records','Detection rule','Source evidence','Impact & related issues','Recommended action'];
    return '<section class="case-file"><h3>Evidence & action</h3><p class="note">Expand a section to inspect the records behind this incident.</p>'+r.layers.map(function(l) {
      const rows = l.rows || [], id = 'case-layer-'+l.n;
      return '<details class="layer"><summary class="lh" aria-controls="'+id+'"><span class="n">'+esc(l.n)+'</span><span>'+esc(names[l.n-1] || l.title)+'</span><span class="ls">'+rows.length+' items</span></summary><div class="lb" id="'+id+'"><dl class="case-rows">'+rows.map(function(x) {
        const label = x.k || x.label || '', value = x.v || x.text || '';
        return '<div><dt>'+esc(label === 'AI summary' ? 'Full incident summary' : label)+'</dt><dd>'+esc(value)+(x.links && x.links.length ? '<div class="tools">'+x.links.map(k=>U.btn(k.label || k.id, k.go || k.pick || k.open,'xs ghost')).join('')+'</div>' : '')+'</dd></div>';
      }).join('')+'</dl>'+(l.hasNote ? '<p class="note">'+esc(l.note)+'</p>' : '')+(l.ask ? U.btn('Ask about this section',l.ask,'xs ghost') : '')+'</div></details>';
    }).join('')+'</section>';
  }
  return {brief, layers};
})();
