/* Nomix apps: what the organized data does for the people running the stores.
   Need to know (a short board for today and this hour), Dashboard, and Chat (Claude, answering
   from the same data). All three read through brain.js, so they always agree. */
(function () {
  'use strict';
  const N = window.Nomix, esc = N.esc;
  // The service hands brain.js its own data once that's built; the demo uses sim.js.
  if (window.NOMIX_SERVICE || !window.NomixSim || !window.NomixBrain) return;
  const RELAY = () => window.NOMIX_AI || 'https://nomix-chat.meohworld.workers.dev';
  const MIN = 60000;

  const APPS = [
    { id: 'board', name: 'Need to know' },
    { id: 'dash', name: 'Dashboard' },
    { id: 'chat', name: 'Chat' }
  ];
  const ICON = {
    board: '<path d="M6 7h12M6 12h12M6 17h7"/><circle cx="18.5" cy="17" r="1.6" fill="currentColor" stroke="none"/>',
    dash: '<path d="M5 19V11M10 19V6M15 19v-5M20 19V9"/>',
    chat: '<path d="M5 18.5V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H8.5z"/>',
    data: '<ellipse cx="12" cy="6.5" rx="7" ry="2.5"/><path d="M5 6.5v11c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-11M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    warn: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
    check: '<path d="M5 12.5l4.2 4.2L19 7"/>',
    send: '<path d="M5 12h13M13 6l6 6-6 6"/>',
    moon: '<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/>'
  };
  const ic = (name, cls) => `<svg${cls ? ` class="${cls}"` : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name]}</svg>`;

  /* ---------- Data: the demo's stores, limited to what's connected ---------- */
  // Which dictionary tags each brain topic needs.
  const TAG_OF = { sales: ['orders', 'sales'], staff: ['staff', 'schedules'], stock: ['inventory'], temps: ['temps'], apps: ['downtime'] };
  const has = (topic, store) => N.connected().some(id => N.storesOf(id).includes(store) && TAG_OF[topic].some(c => N.toolFeeds(id, c)));
  const deliveryAt = store => N.connected().filter(id => N.tool(id).kind === 'delivery' && N.storesOf(id).includes(store));
  const base = NomixSim.source({ now: () => Date.now(), has, apps: deliveryAt, appName: id => (N.tool(id) ? N.tool(id).name : id) });
  const B = NomixBrain.create(Object.assign({}, base, { stores: () => base.stores().filter(s => N.allStores().includes(s.id)) }));
  N.brain = B;

  /* ---------- Tabs and choosing apps ---------- */
  const mine = () => (N.S.apps || (N.S.apps = []));
  N.appTab = () => {
    if (N.viewing || !N.allStores().length) return 'data';
    const t = N.S.tab || 'data';
    return t === 'add' || t === 'data' || mine().includes(t) ? t : 'data';
  };
  N.appTabs = tab => {
    if (N.viewing || !N.allStores().length || !mine().length) return '';
    const btn = (id, name, icon) => `<button type="button" class="apptab" id="tab-${id}" data-act="app-tab" data-id="${id}" aria-pressed="${tab === id}">${ic(icon)}<span>${esc(name)}</span></button>`;
    return `<nav class="apptabs" aria-label="Apps">${APPS.filter(a => mine().includes(a.id)).map(a => btn(a.id, a.name, a.id)).join('')}
      ${btn('data', 'Data', 'data')}
      ${mine().length < APPS.length ? `<button type="button" class="apptab add" id="tab-add" data-act="app-tab" data-id="add" aria-pressed="${tab === 'add'}">${ic('plus')}<span>Add an app</span></button>` : ''}</nav>`;
  };
  // Small drawings of each app, so the tile shows what it is without a sentence.
  const ART = {
    board: '<svg viewBox="0 0 120 72" aria-hidden="true"><rect x="10" y="12" width="100" height="14" rx="7" class="a-soft"/><circle cx="20" cy="19" r="3.5" class="a-amber"/><rect x="28" y="16.5" width="52" height="5" rx="2.5" class="a-ink"/><rect x="10" y="32" width="100" height="14" rx="7" class="a-soft"/><circle cx="20" cy="39" r="3.5" class="a-green"/><rect x="28" y="36.5" width="40" height="5" rx="2.5" class="a-ink"/><rect x="10" y="52" width="100" height="14" rx="7" class="a-soft"/><circle cx="20" cy="59" r="3.5" class="a-green"/><rect x="28" y="56.5" width="60" height="5" rx="2.5" class="a-ink"/></svg>',
    dash: '<svg viewBox="0 0 120 72" aria-hidden="true"><rect x="10" y="10" width="44" height="22" rx="6" class="a-soft"/><rect x="16" y="16" width="26" height="6" rx="3" class="a-ink"/><rect x="62" y="10" width="48" height="22" rx="6" class="a-soft"/><rect x="68" y="16" width="20" height="6" rx="3" class="a-ink"/><rect x="16" y="50" width="8" height="14" rx="2" class="a-green"/><rect x="30" y="44" width="8" height="20" rx="2" class="a-green"/><rect x="44" y="40" width="8" height="24" rx="2" class="a-green"/><rect x="58" y="47" width="8" height="17" rx="2" class="a-green"/><rect x="72" y="42" width="8" height="22" rx="2" class="a-green"/><rect x="86" y="52" width="8" height="12" rx="2" class="a-soft"/><rect x="100" y="55" width="8" height="9" rx="2" class="a-soft"/></svg>',
    chat: '<svg viewBox="0 0 120 72" aria-hidden="true"><rect x="40" y="10" width="70" height="16" rx="8" class="a-green"/><rect x="10" y="32" width="80" height="30" rx="10" class="a-soft"/><rect x="18" y="40" width="56" height="5" rx="2.5" class="a-ink"/><rect x="18" y="50" width="40" height="5" rx="2.5" class="a-ink"/></svg>'
  };
  N.appChooser = () => {
    if (N.viewing || !N.allStores().length) return '';
    const left = APPS.filter(a => !mine().includes(a.id));
    if (!left.length) return '';
    return `<section class="sec" aria-labelledby="sec-apps"><h2 class="sec-h" id="sec-apps">${mine().length ? 'Add an app' : 'Apps'}</h2>
      <div class="app-tiles">${left.map(a => `<button type="button" class="app-tile glass" id="add-${a.id}" data-act="app-add" data-id="${a.id}">
        <span class="at-art">${ART[a.id]}</span><span class="at-name">${ic(a.id)}${esc(a.name)}</span></button>`).join('')}</div></section>`;
  };
  N.appView = (tab, store) => {
    if (tab === 'add') return N.appChooser();
    const body = tab === 'board' ? boardView(store) : tab === 'dash' ? dashView(store) : chatView(store);
    const app = APPS.find(a => a.id === tab);
    return `<div id="app-view" data-app="${tab}">${body}</div>
      <footer class="foot"><button type="button" class="link-quiet" data-act="app-remove" data-id="${tab}">Remove ${esc(app.name)}</button></footer>`;
  };

  /* ---------- Need to know ---------- */
  const where = view => (view === 'all' ? 'All stores' : N.viewName(view));
  function boardView(view) {
    const b = B.board(view), open = N.ui.nkOpen || [];
    const multi = b.stores > 1;
    const item = it => {
      const on = open.includes(it.key), more = it.evidence && it.evidence.length;
      const row = `<span class="dot ${it.level === 'now' ? 'warn' : 'plan'}"></span><span class="nk-text">
          <span class="nk-t">${esc(it.title)}</span><span class="nk-d">${multi ? `${esc(it.where)} · ` : ''}${esc(it.detail)}</span></span>`;
      return `<li class="nk-item">${more
        ? `<button type="button" class="nk-row" id="nk-${esc(it.key)}" data-act="nk-open" data-id="${esc(it.key)}" aria-expanded="${on}">${row}${N.icon('chev', 'chev')}</button>
           ${on ? `<ul class="nk-ev">${it.evidence.map(e => `<li>${esc(e)}</li>`).join('')}</ul>` : ''}`
        : `<div class="nk-row">${row}</div>`}</li>`;
    };
    const closed = !b.open;
    return `<section class="sec" aria-labelledby="nk-h">
      <div class="app-head"><h2 class="sec-h" id="nk-h">${esc(where(view))}</h2><span class="meta" data-ts="${Date.now()}" data-pre="Updated ">Updated just now</span></div>
      <div class="glass keepcard nk">
        ${closed ? `<p class="nk-calm">${ic('moon')}<span>${b.opensAt != null ? `Closed · opens ${N.brainHour(b.opensAt)}` : 'Closed'}</span></p>` : `
        <h3 class="lbl">Right now</h3>
        ${b.now.length ? `<ul class="nk-list">${b.now.map(item).join('')}</ul>` : `<p class="nk-calm">${ic('check')}<span>All clear</span></p>`}
        ${b.today.length ? `<h3 class="lbl">Today</h3><ul class="nk-list">${b.today.map(item).join('')}</ul>` : ''}`}
        ${b.missing.length ? `<div class="nk-miss"><span class="lbl">Not connected</span><span class="nk-tags">${b.missing.map(t => `<span class="chip static">${esc(B.TAGS[t])}</span>`).join('')}</span>
          <button type="button" class="btn-quiet sm" data-act="pick-open">Connect a tool</button></div>` : ''}
      </div></section>`;
  }
  N.brainHour = h => (h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`);

  /* ---------- Dashboard ---------- */
  const usd = c => (c == null ? '—' : '$' + Math.round(c / 100).toLocaleString('en-US'));
  const pct = x => (x == null ? '—' : `${Math.round(x * 100)}%`);
  const short = c => { const d = c / 100; return d >= 1000 ? `$${(d / 1000).toFixed(d >= 10000 ? 0 : 1).replace(/\.0$/, '')}K` : `$${Math.round(d)}`; };
  const hourLabel = h => (h === 12 ? '12p' : h > 12 ? `${h - 12}p` : `${h}a`);
  const change = (now, usual) => { const d = Math.round((now / usual - 1) * 100); return d === 0 ? '0%' : `${d > 0 ? '▲' : '▼'} ${Math.abs(d)}%`; };
  function delta(now, usual, day) {
    if (now == null || !usual) return '';
    const c = change(now, usual);
    return `<span class="k-d">${esc(c === '0%' ? `Same as a usual ${day} by now` : `${c} vs a usual ${day} by now`)}</span>`;
  }
  const tile = (label, value, sub) => `<div class="ktile glass"><span class="lbl">${esc(label)}</span><span class="k-v">${esc(value)}</span>${sub ? `<span class="k-s">${esc(sub)}</span>` : ''}</div>`;
  function chart(hours, day) {
    const W = 640, H = 200, L = 44, R = 8, T = 10, Bt = 26, n = hours.length, slot = (W - L - R) / n;
    const max = Math.max(1, ...hours.map(h => Math.max(h.net, h.usual)));
    const step = [10000, 25000, 50000, 100000, 250000, 500000, 1000000, 2500000, 5000000].find(s => max / s <= 4) || 10000000;
    const top = Math.ceil(max / step) * step, y = v => T + (H - T - Bt) * (1 - v / top);
    const grid = []; for (let v = 0; v <= top; v += step) grid.push(v);
    const bw = Math.min(24, slot * 0.55);
    const bars = hours.map((h, i) => {
      if (!h.started && !h.done && !h.now) return '';
      const x = L + i * slot + (slot - bw) / 2, yy = y(h.net), hgt = Math.max(0, H - Bt - yy), r = Math.min(4, hgt);
      return hgt > 0 ? `<path class="c-today${h.done ? '' : ' going'}" d="M${x},${H - Bt}V${yy + r}Q${x},${yy} ${x + r},${yy}H${x + bw - r}Q${x + bw},${yy} ${x + bw},${yy + r}V${H - Bt}Z"/>` : '';
    }).join('');
    const pts = hours.map((h, i) => [L + i * slot + slot / 2, y(h.usual)]);
    const line = `<path class="c-usual" d="M${pts.map(p => p.join(',')).join('L')}"/>` + pts.map(p => `<circle class="c-dot" cx="${p[0]}" cy="${p[1]}" r="4"/>`).join('');
    const hits = hours.map((h, i) => `<rect class="c-hit" x="${L + i * slot}" y="${T}" width="${slot}" height="${H - T - Bt}" data-tip="${esc(`${N.brainHour(h.h)}|${h.done || h.now || h.started ? usd(h.net) : ''}|${usd(h.usual)}`)}"/>`).join('');
    return `<figure class="chart glass">
      <figcaption class="chart-h"><span class="lbl">Sales by hour</span>
        <span class="legend"><span class="key"><span class="sw today"></span>Today</span><span class="key"><span class="sw usual"></span>Usual ${esc(day)}</span></span></figcaption>
      <div class="chart-box"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Sales by hour, today and a usual ${esc(day)}">
        ${grid.map(v => `<line class="c-grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="c-ax" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${short(v)}</text>`).join('')}
        ${bars}${line}
        ${hours.map((h, i) => `<text class="c-ax" x="${L + i * slot + slot / 2}" y="${H - 8}" text-anchor="middle">${hourLabel(h.h)}</text>`).join('')}
        ${hits}</svg><div class="c-tip" hidden></div></div>
      <details class="c-table"><summary>Show as a table</summary><table class="fh"><thead><tr><th scope="col">Hour</th><th scope="col">Today</th><th scope="col">Usual ${esc(day)}</th></tr></thead>
        <tbody>${hours.map(h => `<tr><td>${N.brainHour(h.h)}</td><td>${h.done || h.now || h.started ? usd(h.net) + (h.done ? '' : ' so far') : '—'}</td><td>${usd(h.usual)}</td></tr>`).join('')}</tbody></table></details>
    </figure>`;
  }
  const missingRow = d => {
    const miss = ['staff', 'stock', 'temps', 'apps'].filter(t => !d.has[t]);
    return miss.length ? `<div class="nk-miss glass"><span class="lbl">Not connected</span><span class="nk-tags">${miss.map(t => `<span class="chip static">${esc(B.TAGS[t])}</span>`).join('')}</span>
      <button type="button" class="btn-quiet sm" data-act="pick-open">Connect a tool</button></div>` : '';
  };
  function dashView(view) {
    const d = B.dash(view), k = d.kpi;
    const first = B.today((N.allStores().find(s => N.inView(s, view))) || N.allStores()[0]), day = first.weekday;
    if (!d.has.sales) return `<section class="sec"><div class="app-head"><h2 class="sec-h">${esc(where(view))}</h2></div>${missingRow(d)}</section>`;
    const head = `<div class="app-head"><h2 class="sec-h" id="dash-h">${esc(where(view))}</h2><span class="meta" data-ts="${Date.now()}" data-pre="Updated ">Updated just now</span></div>
      <div class="dash-hero glass"><span class="lbl">Sales today</span><span class="hero-v">${usd(k.net)}</span>${delta(k.net, k.usualNet, day)}</div>
      <div class="ktiles">
        ${tile('Orders', k.orders == null ? '—' : k.orders.toLocaleString('en-US'), k.usualOrders ? `Usual by now ${k.usualOrders.toLocaleString('en-US')}` : '')}
        ${tile('Average check', k.check == null ? '—' : '$' + (k.check / 100).toFixed(2))}
        ${k.labor != null ? tile('Labor so far', usd(k.labor), k.laborPct != null ? `${pct(k.laborPct)} of sales` : '') : ''}
        ${k.onShift != null ? tile('On shift now', String(k.onShift)) : ''}
      </div>
      ${d.hours ? chart(d.hours, day) : ''}`;
    const items = d.items && d.items.length ? `<div class="dbox glass"><h3 class="lbl">Best sellers today</h3><ol class="dlist">${d.items.map(i =>
      `<li><span class="dl-n">${esc(i.item)}</span><span class="dl-v">${i.qty.toLocaleString('en-US')} · ${usd(i.net)}</span></li>`).join('')}</ol></div>` : '';
    if (!d.single) {
      const rows = d.table.map(r => `<tr><th scope="row"><button type="button" class="link-quiet" data-act="store" data-id="${esc(r.id)}">${esc(N.viewName(r.id))}</button>${r.open ? '' : ' <span class="meta">Closed</span>'}</th>
        <td>${usd(r.net)}</td><td>${r.net != null && r.usualNet ? change(r.net, r.usualNet) : '—'}</td>
        <td>${pct(r.laborPct)}</td><td>${r.onShift == null ? '—' : r.onShift}</td><td>${r.alerts ? `<span class="pill warn">${r.alerts}</span>` : ''}</td></tr>`).join('');
      return `<section class="sec" aria-labelledby="dash-h">${head}
        <div class="dbox glass"><h3 class="lbl">Stores</h3><div class="fh-scroll"><table class="fh dtable"><thead><tr><th scope="col">Store</th><th scope="col">Sales today</th><th scope="col">vs usual</th><th scope="col">Labor</th><th scope="col">On shift</th><th scope="col">Need to know</th></tr></thead><tbody>${rows}</tbody></table></div></div>
        ${items}${missingRow(d)}</section>`;
    }
    const shift = d.shift ? `<div class="dbox glass"><h3 class="lbl">Shift</h3><ul class="dlist">${d.shift.map(x => `<li><span class="dl-n"><span class="dot ${x.state === 'on' ? 'ok' : x.state === 'late' ? 'warn' : ''}"></span>${esc(x.who)} <span class="meta">${esc(x.role)}</span></span>
        <span class="dl-v">${esc(x.state === 'on' ? `In ${x.at} · until ${x.until}` : x.state === 'late' ? `Not in · started ${x.at}` : `Starts ${x.at}`)}</span></li>`).join('')}</ul></div>` : '';
    const stock = d.stock ? `<div class="dbox glass"><h3 class="lbl">Stock</h3><ul class="meters">${d.stock.map(x => `<li><span class="m-top"><span>${esc(x.item)}</span><span class="meta">${esc(`${x.onHand} of ${x.par} ${x.unit}`)}${x.low ? ` · <span class="pill warn">${ic('warn')}Low</span>` : ''}</span></span>
        <span class="meter${x.low ? ' low' : ''}"><span style="width:${Math.min(100, Math.round(x.onHand / x.par * 100))}%"></span></span></li>`).join('')}</ul></div>` : '';
    const temps = d.temps ? `<div class="dbox glass"><h3 class="lbl">Fridges and freezers</h3><ul class="dlist">${d.temps.map(x => `<li><span class="dl-n">${esc(x.unit)} <span class="meta">${esc(x.lo < 0 ? `Below ${x.hi}°F` : `${x.lo}–${x.hi}°F`)}</span></span>
        <span class="dl-v">${x.f == null ? '—' : `${x.f}°F`}${x.alert ? ` <span class="pill warn">${ic('warn')}Too warm</span>` : ''}</span></li>`).join('')}</ul></div>` : '';
    const apps = d.apps && d.apps.length ? `<div class="dbox glass"><h3 class="lbl">Delivery apps</h3><ul class="dlist">${d.apps.map(x => `<li><span class="dl-n">${esc(x.app)}</span>
        <span class="dl-v">${x.paused ? `<span class="pill warn">${ic('warn')}Paused</span>` : 'Taking orders'} · ${x.orders} orders</span></li>`).join('')}</ul></div>` : '';
    return `<section class="sec" aria-labelledby="dash-h">${head}<div class="dgrid">${shift}${stock}${temps}${apps}${items}</div>${missingRow(d)}</section>`;
  }
  // The chart's hover card: the hour, today and the usual.
  document.addEventListener('pointerover', e => {
    const hit = e.target.closest && e.target.closest('.c-hit'), box = hit && hit.closest('.chart-box');
    if (!box) return;
    const tip = box.querySelector('.c-tip'), [h, today, usual] = hit.dataset.tip.split('|');
    tip.innerHTML = `<strong>${esc(h)}</strong>${today ? `<span><span class="sw today"></span>${esc(N.L('Today'))} ${esc(today)}</span>` : ''}<span><span class="sw usual"></span>${esc(N.L('Usual'))} ${esc(usual)}</span>`;
    const r = hit.getBoundingClientRect(), b = box.getBoundingClientRect();
    tip.hidden = false;
    tip.style.left = `${Math.max(0, Math.min(b.width - tip.offsetWidth, r.left - b.left + r.width / 2 - tip.offsetWidth / 2))}px`;
    tip.style.top = '0px';
  });
  document.addEventListener('pointerout', e => {
    const box = e.target.closest && e.target.closest('.chart-box');
    if (box && !box.contains(e.relatedTarget)) box.querySelector('.c-tip').hidden = true;
  });

  /* ---------- Chat ---------- */
  const chat = N.ui.chat || (N.ui.chat = { view: [], api: [], busy: false, draft: '' });
  const STARTERS = ['Anything I need to know right now?', 'How are sales today?', 'Who’s on shift now?', 'How did each store do yesterday?'];
  const DOING = { list_stores: 'Looking at the stores', sales: 'Checking sales', sales_by_hour: 'Checking sales by hour', top_items: 'Checking best sellers',
    staff: 'Checking shifts', inventory: 'Checking stock', temperatures: 'Checking fridges', delivery_apps: 'Checking delivery apps', need_to_know: 'Checking the board' };
  const FAIL = { not_ready: 'Chat isn’t switched on yet', busy: 'Too many questions at once. Try again in a minute.', too_long: 'This chat is full. Start a new one.', failed: 'Couldn’t get an answer. Try again.' };
  // A little Markdown: paragraphs, lists, bold and small tables. Everything is escaped first.
  function md(text) {
    const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    const out = [], lines = String(text || '').split('\n');
    for (let i = 0; i < lines.length;) {
      const l = lines[i];
      if (/^\s*\|/.test(l)) {
        const rows = [];
        while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(lines[i++]);
        const cells = r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
        const body = rows.filter(r => !/^\s*\|?\s*:?-{2,}/.test(r));
        out.push(`<div class="fh-scroll"><table class="fh"><thead><tr>${cells(body[0]).map(c => `<th scope="col">${inline(c)}</th>`).join('')}</tr></thead><tbody>${body.slice(1).map(r => `<tr>${cells(r).map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      } else if (/^\s*([-*•]|\d+\.)\s+/.test(l)) {
        const ol = /^\s*\d+\./.test(l), items = [];
        while (i < lines.length && /^\s*([-*•]|\d+\.)\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*([-*•]|\d+\.)\s+/, ''));
        out.push(`<${ol ? 'ol' : 'ul'}>${items.map(x => `<li>${inline(x)}</li>`).join('')}</${ol ? 'ol' : 'ul'}>`);
      } else if (!l.trim()) { i++; } else {
        const para = [];
        while (i < lines.length && lines[i].trim() && !/^\s*(\||[-*•]\s|\d+\.\s)/.test(lines[i])) para.push(lines[i++]);
        out.push(`<p>${para.map(inline).join('<br>')}</p>`);
      }
    }
    return out.join('');
  }
  const bubble = (m, k) => m.who === 'me'
    ? `<li class="msg me" data-notr>${esc(m.text)}</li>`
    : `<li class="msg ai" id="msg-${k}"><div class="msg-body" data-notr>${md(m.text)}</div>${m.status ? `<span class="msg-status"><span class="spin" aria-hidden="true"></span>${esc(m.status)}</span>` : ''}${m.error ? `<span class="msg-err">${esc(m.error)}</span>` : ''}</li>`;
  function chatView(view) {
    const starters = N.S.questions.map(q => q.text).concat(STARTERS).filter((x, i, a) => a.indexOf(x) === i).slice(0, 6);
    return `<section class="sec chat" aria-labelledby="chat-h">
      <div class="app-head"><h2 class="sec-h" id="chat-h">${esc(where(view))}</h2>${chat.view.length ? '<button type="button" class="btn-quiet sm" data-act="chat-new">New chat</button>' : ''}</div>
      <div class="glass keepcard chat-card">
        ${chat.view.length ? '' : `<div class="chips chat-starters">${starters.map(s => `<button type="button" class="chip" data-act="chat-ask" data-text="${esc(s)}">${esc(s)}</button>`).join('')}</div>`}
        <ol class="msgs" id="msgs" aria-live="polite">${chat.view.map(bubble).join('')}</ol>
        <div class="chat-box">
          <label class="vh" for="chat-input">Ask about your stores</label>
          <textarea id="chat-input" class="qbox-input" rows="1" data-input="chat" data-enter="chat-send" placeholder="Ask about your stores">${esc(chat.draft)}</textarea>
          <button type="button" class="btn-main sm" id="chat-send" data-act="chat-send" aria-label="Send"${chat.busy ? ' disabled' : ''}>${ic('send')}</button>
        </div>
      </div></section>`;
  }
  function paintMsg(k) {
    const el = document.getElementById('msg-' + k);
    if (el) el.outerHTML = bubble(chat.view[k], k);
    const list = document.getElementById('msgs');
    if (list) list.lastElementChild && list.lastElementChild.scrollIntoView({ block: 'nearest' });
  }
  function context() {
    const view = N.viewStore(), now = new Date();
    return `<context>\nNow: ${now.toLocaleString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} (viewer's clock, ${Intl.DateTimeFormat().resolvedOptions().timeZone})\nLooking at: ${where(view)} (where="${view}")\nApp language: ${window.NOMIX_LANG === 'zh' ? 'Chinese' : 'English'}\n</context>`;
  }
  // One question: send it, run whatever tools Claude asks for on this page's data, repeat until it answers.
  async function ask(text) {
    if (chat.busy || !text.trim()) return;
    if (chat.api.length > 60) chat.api = [];
    chat.busy = true; chat.draft = '';
    chat.api.push({ role: 'user', content: [{ type: 'text', text: context() }, { type: 'text', text: text.trim() }] });
    chat.view.push({ who: 'me', text: text.trim() });
    const k = chat.view.push({ who: 'ai', text: '', status: N.L('Thinking') }) - 1, m = chat.view[k];
    N.render({ keepScroll: true, refocus: 'chat-input' });
    try {
      for (let round = 0; round < 8; round++) {
        const res = await fetch(RELAY() + '/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: chat.api }) });
        if (!res.ok || !(res.headers.get('content-type') || '').includes('event-stream')) {
          const e = await res.json().catch(() => ({}));
          throw new Error(e.error || 'failed');
        }
        const reader = res.body.getReader(), dec = new TextDecoder();
        let buf = '', done = null, live = m.text ? m.text + '\n\n' : '';
        const before = live;
        for (;;) {
          const { value, done: end } = await reader.read();
          if (end) break;
          buf += dec.decode(value, { stream: true });
          let cut;
          while ((cut = buf.indexOf('\n\n')) >= 0) {
            const line = buf.slice(0, cut).replace(/^data: /, ''); buf = buf.slice(cut + 2);
            if (!line.trim()) continue;
            const ev = JSON.parse(line);
            if (ev.t === 'text') { live += ev.v; m.text = live; m.status = ''; paintMsg(k); }
            else if (ev.t === 'tool') { m.status = N.L(DOING[ev.v] || 'Working'); paintMsg(k); }
            else if (ev.t === 'done') done = ev.v;
            else if (ev.t === 'error') throw new Error(ev.v);
          }
        }
        if (!done) throw new Error('failed');
        chat.api.push({ role: 'assistant', content: done.content });
        // After a hand-over to a fallback model, only what comes after the last hand-over counts.
        const cutAt = done.content.map(b => b.type).lastIndexOf('fallback'), blocks = done.content.slice(cutAt + 1);
        const said = blocks.filter(b => b.type === 'text').map(b => b.text).join('');
        m.text = (before + said).trim();
        if (done.stop_reason !== 'tool_use') {
          if (done.stop_reason === 'refusal' && !m.text) m.text = N.L('I can’t help with that one.');
          break;
        }
        const results = blocks.filter(b => b.type === 'tool_use').map(b => {
          try { return { type: 'tool_result', tool_use_id: b.id, content: JSON.stringify(B.run(b.name, b.input)) }; }
          catch (err) { return { type: 'tool_result', tool_use_id: b.id, is_error: true, content: String(err.message || err) }; }
        });
        chat.api.push({ role: 'user', content: results });
        m.status = N.L('Thinking'); paintMsg(k);
      }
    } catch (err) {
      m.error = N.L(FAIL[err.message] || FAIL.failed);
      // Leave the conversation where Claude can pick it up: drop the unanswered question.
      while (chat.api.length && chat.api[chat.api.length - 1].role === 'user') chat.api.pop();
      if (chat.api.length && chat.api[chat.api.length - 1].content.some && chat.api[chat.api.length - 1].content.some(b => b.type === 'tool_use')) chat.api.pop();
    }
    m.status = ''; chat.busy = false;
    if (N.S.phase === 'home' && N.appTab() === 'chat') { paintMsg(k); const b = document.getElementById('chat-send'); if (b) b.disabled = false; }
  }
  N.inputs.chat = v => { chat.draft = v; };

  /* ---------- Actions ---------- */
  Object.assign(N.acts, {
    'app-tab': d => { N.S.tab = d.id; N.save(); N.render({ refocus: 'tab-' + d.id, keepScroll: true }); },
    'app-add': d => {
      if (!mine().includes(d.id)) mine().push(d.id);
      N.S.tab = d.id;
      N.commit(`Added the ${APPS.find(a => a.id === d.id).name} app`);
      N.save(); N.render({ refocus: 'tab-' + d.id }); window.scrollTo(0, 0);
    },
    'app-remove': d => {
      N.S.apps = mine().filter(x => x !== d.id);
      N.S.tab = N.S.apps[0] || 'data';
      N.commit(`Removed the ${APPS.find(a => a.id === d.id).name} app`);
      N.save(); N.render({ focus: true }); window.scrollTo(0, 0);
    },
    'nk-open': d => {
      const o = N.ui.nkOpen || (N.ui.nkOpen = []), i = o.indexOf(d.id);
      if (i >= 0) o.splice(i, 1); else o.push(d.id);
      N.render({ refocus: 'nk-' + d.id, keepScroll: true });
    },
    'chat-ask': d => ask(N.L(d.text)),
    'chat-send': () => { const el = document.getElementById('chat-input'); ask(el ? el.value : chat.draft); },
    'chat-new': () => { if (chat.busy) return; chat.view = []; chat.api = []; N.render({ refocus: 'chat-input', keepScroll: true }); }
  });

  // The board and dashboard keep themselves current; the rest of the page is left alone.
  setInterval(() => {
    const el = document.getElementById('app-view');
    if (!el || N.S.phase !== 'home' || document.querySelector('.sheet') || el.contains(document.activeElement) && document.activeElement.tagName === 'TEXTAREA') return;
    const tab = el.dataset.app;
    if (tab !== 'board' && tab !== 'dash') return;
    el.innerHTML = tab === 'board' ? boardView(N.viewStore()) : dashView(N.viewStore());
    N.paint();
  }, 30000);
})();
