/* Nomix flows: the lines between stores, tools, Nomix and what it keeps organized. */
(function () {
  'use strict';
  const N = window.Nomix, esc = N.esc;
  const still = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const toolState = id => { const s = N.status(id); return s === 'connected' ? 'live' : s === 'help' ? 'help' : 'later'; };

  // Ready screen: tools → Nomix → what it keeps.
  N.flowViz = () => {
    const sel = N.S.selected, keep = N.keepIds();
    const ins = sel.length
      ? sel.map(id => { const t = N.tool(id), st = toolState(id);
        return `<span class="pill ${st}" data-node="t-${esc(id)}" data-to="hub:${st}">${N.mono(t)}<span class="p-name">${esc(t.name)}</span></span>`; }).join('')
      : '<span class="pill later" data-node="t-none" data-to="hub:later"><span class="p-name">Your tools</span></span>';
    const outs = keep.map(id => { const c = N.cat(id), st = N.flowing(id) ? 'live' : c.custom ? 'help' : 'later';
      return `<span class="pill out ${st}" data-node="k-${esc(id)}"><span class="p-name">${esc(c.name)}</span></span>`; }).join('');
    const hubTo = keep.map(id => `k-${id}:${N.flowing(id) ? 'live' : N.cat(id).custom ? 'help' : 'later'}`).join(' ');
    return `<div class="flowviz" data-min="600">
      <svg class="wires" aria-hidden="true"></svg>
      <div class="fv-col fv-in">${ins}</div>
      <div class="fv-hub" data-node="hub" data-to="${esc(hubTo)}">${N.knot()}<span>Nomix</span></div>
      <div class="fv-col fv-out">${outs}</div>
    </div>`;
  };

  // Home: every store → the tools it runs on → one Nomix dictionary and data home.
  N.storeFlow = view => {
    const stores = N.allStores(), sel = N.S.selected;
    const storePills = stores.map((s, k) => {
      const to = N.connected().filter(id => N.storesOf(id).includes(s)).map(id => `t-${id}:${view === 'all' || view === s ? 'live' : 'dim'}`).join(' ');
      const on = view === s, dim = view !== 'all' && !on;
      return `<button type="button" class="pill store${dim ? ' dim' : ''}" id="sf-${k}" data-node="s-${k}" data-to="${esc(to)}" data-act="store" data-id="${esc(on ? 'all' : s)}" aria-pressed="${on}">
        <span class="p-name">${esc(s)}</span></button>`;
    }).join('');
    const toolPills = sel.map(id => {
      const t = N.tool(id), st = toolState(id);
      const dim = st === 'live' && view !== 'all' && !N.storesOf(id).includes(view);
      return `<span class="pill ${st}${dim ? ' dim' : ''}" data-node="t-${esc(id)}" data-to="hub:${dim ? 'dim' : st}">${N.mono(t)}<span class="p-name">${esc(t.name)}</span></span>`;
    }).join('');
    return `<div class="flowviz fv-stores" data-min="560" role="group" aria-label="How each store flows into Nomix">
      <svg class="wires" aria-hidden="true"></svg>
      <div class="fv-col fv-in">${storePills}</div>
      <div class="fv-col fv-mid">${toolPills}</div>
      <div class="fv-hub" data-node="hub">${N.knot()}<span>Nomix</span></div>
    </div>`;
  };

  // Draw each strap from its source to its target, measured from the real layout.
  function draw(box) {
    box.classList.toggle('is-vertical', box.clientWidth < (+box.dataset.min || 600));
    const vertical = box.classList.contains('is-vertical');
    const B = box.getBoundingClientRect(), nodes = {};
    box.querySelectorAll('[data-node]').forEach(el => { nodes[el.dataset.node] = el.getBoundingClientRect(); });
    const animate = !still(), f = n => n.toFixed(1);
    let out = '', k = 0;
    box.querySelectorAll('[data-to]').forEach(el => {
      const a = nodes[el.dataset.node];
      el.dataset.to.split(' ').filter(Boolean).forEach(pair => {
        const [to, st] = pair.split(':'), b = nodes[to];
        if (!a || !b) return;
        let d;
        if (!vertical) {
          const x1 = a.right - B.left, y1 = a.top + a.height / 2 - B.top, x2 = b.left - B.left, y2 = b.top + b.height / 2 - B.top, m = (x1 + x2) / 2;
          d = `M${f(x1)},${f(y1)} C${f(m)},${f(y1)} ${f(m)},${f(y2)} ${f(x2)},${f(y2)}`;
        } else {
          const x1 = a.left + a.width / 2 - B.left, y1 = a.bottom - B.top, x2 = b.left + b.width / 2 - B.left, y2 = b.top - B.top, m = (y1 + y2) / 2;
          d = `M${f(x1)},${f(y1)} C${f(x1)},${f(m)} ${f(x2)},${f(m)} ${f(x2)},${f(y2)}`;
        }
        out += `<path class="w ${st === 'live' ? '' : st}" d="${d}"/>`;
        if (st === 'live' && animate) {
          out += `<circle class="pulse" r="3.5"><animateMotion dur="${(2.2 + (k % 3) * 0.4).toFixed(1)}s" begin="-${((k * 0.37) % 2).toFixed(2)}s" repeatCount="indefinite" path="${d}"/></circle>`;
        }
        k++;
      });
    });
    const svg = box.querySelector('svg.wires');
    svg.setAttribute('viewBox', `0 0 ${f(B.width)} ${f(B.height)}`);
    svg.innerHTML = out;
    if (!box._watch && window.ResizeObserver) {
      let w = box.clientWidth;
      box._watch = new ResizeObserver(() => { if (box.clientWidth !== w) { w = box.clientWidth; draw(box); } });
      box._watch.observe(box);
    }
  }
  N.afterRender = () => document.querySelectorAll('.flowviz').forEach(draw);

  N.start();
})();
