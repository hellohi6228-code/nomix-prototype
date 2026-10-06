/* Nomix flows: the lines between stores, tools, Nomix and what it keeps organized. */
(function () {
  'use strict';
  const N = window.Nomix, esc = N.esc;
  const still = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const toolState = id => { const s = N.status(id); return s === 'connected' ? 'live' : s === 'help' ? 'help' : 'later'; };

  // One diagram for the end of setup and for Overview: stores → tools → Nomix → tags.
  // view = 'all' or one store; pick = true lets a store be tapped to focus on it.
  N.storeFlow = (view, pick) => {
    const stores = N.allStores(), sel = N.S.selected, keep = N.keepIds();
    const storePills = stores.length ? stores.map((s, k) => {
      const to = N.connected().filter(id => N.storesOf(id).includes(s)).map(id => `t-${id}:${view === 'all' || view === s ? 'live' : 'dim'}`).join(' ');
      const on = view === s, dim = view !== 'all' && !on;
      return pick
        ? `<button type="button" class="pill store${dim ? ' dim' : ''}" id="sf-${k}" data-node="s-${k}" data-to="${esc(to)}" data-act="store" data-id="${esc(on ? 'all' : s)}" aria-pressed="${on}"><span class="p-name">${esc(s)}</span></button>`
        : `<span class="pill store" data-node="s-${k}" data-to="${esc(to)}"><span class="p-name">${esc(s)}</span></span>`;
    }).join('') : '<span class="pill store later"><span class="p-name">Your stores</span></span>';
    const toolPills = sel.length ? sel.map(id => {
      const t = N.tool(id), st = toolState(id);
      const dim = st === 'live' && view !== 'all' && !N.storesOf(id).includes(view);
      return `<span class="pill ${st}${dim ? ' dim' : ''}" data-node="t-${esc(id)}" data-to="hub:${dim ? 'dim' : st}">${N.mono(t)}<span class="p-name">${esc(t.name)}</span></span>`;
    }).join('') : '<span class="pill later" data-node="t-none" data-to="hub:later"><span class="p-name">Your tools</span></span>';
    const tagState = id => (N.flowing(id, view) ? 'live' : N.cat(id).custom ? 'help' : 'later');
    const tagPills = keep.map(id => `<span class="pill out ${tagState(id)}" data-node="k-${esc(id)}"><span class="p-name">${esc(N.cat(id).name)}</span></span>`).join('');
    const hubTo = keep.map(id => `k-${id}:${tagState(id)}`).join(' ');
    return `<div class="flowviz fv-full" data-min="640" role="group" aria-label="How each store flows into Nomix">
      <svg class="wires" aria-hidden="true"></svg>
      <div class="fv-col fv-in">${storePills}</div>
      <div class="fv-col fv-mid">${toolPills}</div>
      <div class="fv-hub" data-node="hub" data-to="${esc(hubTo)}">${N.knot()}<span>Nomix</span></div>
      <div class="fv-col fv-out">${tagPills}</div>
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
