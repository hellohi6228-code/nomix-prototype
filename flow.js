/* Nomix flows: the lines between stores, tools, Nomix and what it keeps organized. */
(function () {
  'use strict';
  const N = window.Nomix, esc = N.esc;
  const still = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const toolState = id => { const s = N.status(id); return s === 'connected' ? 'live' : s === 'help' ? 'help' : 'later'; };

  // One diagram for the end of setup and for Overview: brands (or one brand's stores) → tools → Nomix → tags.
  // view = 'all', 'brand:<id>' or one store; pick = true lets a brand or store be tapped to focus on it.
  N.storeFlow = (view, pick) => {
    const stores = N.allStores(), sel = N.S.selected, keep = N.keepIds();
    const node = (key, label, sub, to, act, on, dim) => (pick
      ? `<button type="button" class="pill store${dim ? ' dim' : ''}" id="sf-${esc(key)}" data-node="${esc(key)}" data-to="${esc(to)}" data-act="store" data-id="${esc(act)}" aria-pressed="${on}"><span class="p-name">${esc(label)}</span>${sub ? `<span class="p-sub">${esc(sub)}</span>` : ''}</button>`
      : `<span class="pill store" data-node="${esc(key)}" data-to="${esc(to)}"><span class="p-name">${esc(label)}</span>${sub ? `<span class="p-sub">${esc(sub)}</span>` : ''}</span>`);
    const linksTo = (ids, live) => N.connected().filter(t => N.storesOf(t).some(s => ids.includes(s))).map(t => `t-${t}:${live ? 'live' : 'dim'}`).join(' ');
    const focus = view === 'all' ? null : view.startsWith('brand:') ? view.slice(6) : N.brandOf(view);
    let storePills;
    if (!stores.length) storePills = '<span class="pill store later"><span class="p-name">Your stores</span></span>';
    else if (!focus) {
      // Every brand as one node, with how many of its stores are connected.
      storePills = N.brands().map(b => {
        const mine = stores.filter(s => N.brandOf(s) === b.id);
        return mine.length ? node('b-' + b.id, b.name, `${mine.length} ${mine.length === 1 ? 'store' : 'stores'}`, linksTo(mine, true), 'brand:' + b.id, false, false) : '';
      }).join('');
    } else {
      // One brand open: its stores, the chosen one highlighted.
      const b = N.brand(focus), mine = stores.filter(s => N.brandOf(s) === focus);
      const head = pick
        ? `<button type="button" class="fv-brand-name on" id="sfb-${esc(focus)}" data-act="store" data-id="all" aria-pressed="true">${esc(b.name)}</button>`
        : `<span class="fv-brand-name">${esc(b.name)}</span>`;
      storePills = `<div class="fv-brand">${head}${mine.map(s => {
        const live = N.inView(s, view), on = view === s;
        return node('s-' + s, N.storeLoc(s), '', linksTo([s], live), on ? 'brand:' + focus : s, on, !live);
      }).join('')}</div>`;
    }
    const toolPills = sel.length ? sel.map(id => {
      const t = N.tool(id), st = toolState(id);
      const dim = st === 'live' && view !== 'all' && !N.storesOf(id).some(s => N.inView(s, view));
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
