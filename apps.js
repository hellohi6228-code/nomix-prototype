/* Nomix apps: what the organized data does for the people running the stores.
   Two icons on home open in place (Insights, Dashboard); Chat floats in the corner.
   All three read through brain.js, so they always agree. */
(function () {
  'use strict';
  const N = window.Nomix, esc = N.esc;
  // The service hands brain.js its own data once that's built; the demo uses sim.js.
  if (window.NOMIX_SERVICE || !window.NomixSim || !window.NomixBrain) return;
  const RELAY = () => window.NOMIX_AI || 'https://nomix-chat.meohworld.workers.dev';

  const ICON = {
    insights: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
    dash: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8.5 16v-3M12 16V9M15.5 16v-5"/>',
    chat: '<path d="M5 18.5V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H8.5z"/>',
    warn: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
    check: '<path d="M5 12.5l4.2 4.2L19 7"/>',
    send: '<path d="M5 12h13M13 6l6 6-6 6"/>',
    moon: '<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    fresh: '<path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>',
    sales: '<path d="M4 19h16M7 15l4-4 3 3 5-6"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
    people: '<circle cx="9" cy="9" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 6.5a3 3 0 0 1 0 5.6M17.5 19a5 5 0 0 0-2.2-4.2"/>',
    star: '<path d="M12 4l2.4 5 5.4.6-4 3.7 1.1 5.4L12 16l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6z"/>',
    bag: '<path d="M6 8h12l-1 12H7z"/><path d="M9 8a3 3 0 0 1 6 0"/>'
  };
  const ic = (name, cls) => `<svg${cls ? ` class="${cls}"` : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name]}</svg>`;

  /* ---------- Data: the demo's stores, limited to what's connected ---------- */
  // Which dictionary tags each brain topic needs.
  const TAG_OF = { sales: ['orders', 'sales'], staff: ['staff', 'schedules'], stock: ['inventory'], temps: ['temps'], apps: ['downtime'] };
  const has = (topic, store) => N.connected().some(id => N.storesOf(id).includes(store) && TAG_OF[topic].some(c => N.toolFeeds(id, c)));
  const deliveryAt = store => N.connected().filter(id => N.tool(id).kind === 'delivery' && N.storesOf(id).includes(store));
  const base = NomixSim.source({ now: () => Date.now(), has, apps: deliveryAt, appName: id => (N.tool(id) ? N.tool(id).name : id) });
  const B = NomixBrain.create(Object.assign({}, base, { stores: () => base.stores().filter(s => N.allStores().includes(s.id)) }));
  N.brain = B;
  const ready = () => N.S.phase === 'home' && !N.viewing && N.allStores().length > 0;
  const where = view => (view === 'all' ? 'All stores' : N.viewName(view));

  /* ---------- The two icons on home, each opening in place ---------- */
  const APPS = [{ id: 'insights', name: 'Insights' }, { id: 'dash', name: 'Dashboard' }];
  N.appDock = view => {
    if (!ready()) return '';
    const open = N.S.appOpen;
    const count = B.board(view).now.length;
    const btn = a => `<button type="button" class="dock-btn" id="dock-${a.id}" data-act="app-open" data-id="${a.id}" aria-expanded="${open === a.id}" aria-controls="app-view">
        <span class="dock-ic">${ic(a.id)}${a.id === 'insights' && count ? `<span class="dock-badge" aria-label="${count} need attention">${count}</span>` : ''}</span><span class="dock-l">${esc(a.name)}</span></button>`;
    return `<div class="dock" role="group" aria-label="Apps">${APPS.map(btn).join('')}</div>
      ${open ? `<div id="app-view" class="app-panel" data-app="${open}">${open === 'insights' ? insightsView(view) : dashView(view)}</div>` : ''}`;
  };

  /* ---------- Insights ---------- */
  const NOTE_ICON = { sales: 'sales', ahead: 'clock', staff: 'people', top: 'star', apps: 'bag', best: 'star', closed: 'moon', yesterday: 'sales' };
  function insightsView(view) {
    const b = B.insights(view), open = N.ui.nkOpen || [], multi = b.stores > 1;
    const item = it => {
      const on = open.includes(it.key), more = it.evidence && it.evidence.length;
      const row = `<span class="dot ${it.level === 'now' ? 'warn' : 'plan'}"></span><span class="nk-text">
          <span class="nk-t">${esc(it.title)}</span><span class="nk-d">${multi ? `${esc(it.where)} · ` : ''}${esc(it.detail)}</span></span>`;
      return `<li class="nk-item">${more
        ? `<button type="button" class="nk-row" id="nk-${esc(it.key)}" data-act="nk-open" data-id="${esc(it.key)}" aria-expanded="${on}">${row}${N.icon('chev', 'chev')}</button>
           ${on ? `<ul class="nk-ev">${it.evidence.map(e => `<li>${esc(e)}</li>`).join('')}</ul>` : ''}`
        : `<div class="nk-row">${row}</div>`}</li>`;
    };
    const act = b.now.concat(b.today);
    return `<div class="panel-head"><h2 class="panel-h">${esc(where(view))}</h2><span class="meta" data-ts="${Date.now()}" data-pre="Updated ">Updated just now</span></div>
      ${act.length ? `<ul class="nk-list">${act.map(item).join('')}</ul>` : ''}
      ${b.notes.length ? `<ul class="notes">${b.notes.map(n => `<li>${ic(NOTE_ICON[n.key] || 'check')}<span>${esc(n.text)}</span></li>`).join('')}</ul>` : ''}
      ${b.missing.length ? missingRow(b.missing) : ''}`;
  }
  N.brainHour = h => (h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`);
  const missingRow = tags => `<div class="nk-miss"><span class="lbl">Not connected</span><span class="nk-tags">${tags.map(t => `<span class="chip static">${esc(B.TAGS[t])}</span>`).join('')}</span>
      <button type="button" class="btn-quiet sm" data-act="pick-open">Connect a tool</button></div>`;

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
  const tile = (label, value, sub) => `<div class="ktile"><span class="lbl">${esc(label)}</span><span class="k-v">${esc(value)}</span>${sub ? `<span class="k-s">${esc(sub)}</span>` : ''}</div>`;
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
    return `<figure class="chart">
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
  function dashView(view) {
    const d = B.dash(view), k = d.kpi;
    const first = B.today((N.allStores().find(s => N.inView(s, view))) || N.allStores()[0]), day = first.weekday;
    const miss = ['staff', 'stock', 'temps', 'apps'].filter(t => !d.has[t]);
    const head = `<div class="panel-head"><h2 class="panel-h">${esc(where(view))}</h2><span class="meta" data-ts="${Date.now()}" data-pre="Updated ">Updated just now</span></div>`;
    if (!d.has.sales) return head + missingRow(['sales'].concat(miss));
    const top = `${head}
      <div class="dash-hero"><span class="lbl">Sales today</span><span class="hero-v">${usd(k.net)}</span>${delta(k.net, k.usualNet, day)}</div>
      <div class="ktiles">
        ${tile('Orders', k.orders == null ? '—' : k.orders.toLocaleString('en-US'), k.usualOrders ? `Usual by now ${k.usualOrders.toLocaleString('en-US')}` : '')}
        ${tile('Average check', k.check == null ? '—' : '$' + (k.check / 100).toFixed(2))}
        ${k.labor != null ? tile('Labor so far', usd(k.labor), k.laborPct != null ? `${pct(k.laborPct)} of sales` : '') : ''}
        ${k.onShift != null ? tile('On shift now', String(k.onShift)) : ''}
      </div>
      ${d.hours ? chart(d.hours, day) : ''}`;
    const items = d.items && d.items.length ? `<div class="dbox"><h3 class="lbl">Best sellers today</h3><ol class="dlist">${d.items.map(i =>
      `<li><span class="dl-n">${esc(i.item)}</span><span class="dl-v">${i.qty.toLocaleString('en-US')} · ${usd(i.net)}</span></li>`).join('')}</ol></div>` : '';
    if (!d.single) {
      const rows = d.table.map(r => `<tr><th scope="row"><button type="button" class="link-quiet" data-act="store" data-id="${esc(r.id)}">${esc(N.viewName(r.id))}</button>${r.open ? '' : ' <span class="meta">Closed</span>'}</th>
        <td>${usd(r.net)}</td><td>${r.net != null && r.usualNet ? change(r.net, r.usualNet) : '—'}</td>
        <td>${pct(r.laborPct)}</td><td>${r.onShift == null ? '—' : r.onShift}</td><td>${r.alerts ? `<span class="pill warn">${r.alerts}</span>` : ''}</td></tr>`).join('');
      return `${top}<div class="dbox"><h3 class="lbl">Stores</h3><div class="fh-scroll"><table class="fh dtable"><thead><tr><th scope="col">Store</th><th scope="col">Sales today</th><th scope="col">vs usual</th><th scope="col">Labor</th><th scope="col">On shift</th><th scope="col">Needs attention</th></tr></thead><tbody>${rows}</tbody></table></div></div>
        ${items}${miss.length ? missingRow(miss) : ''}`;
    }
    const shift = d.shift ? `<div class="dbox"><h3 class="lbl">Shift</h3><ul class="dlist">${d.shift.map(x => `<li><span class="dl-n"><span class="dot ${x.state === 'on' ? 'ok' : x.state === 'late' ? 'warn' : ''}"></span>${esc(x.who)} <span class="meta">${esc(x.role)}</span></span>
        <span class="dl-v">${esc(x.state === 'on' ? `In ${x.at} · until ${x.until}` : x.state === 'late' ? `Not in · started ${x.at}` : `Starts ${x.at}`)}</span></li>`).join('')}</ul></div>` : '';
    const stock = d.stock ? `<div class="dbox"><h3 class="lbl">Stock</h3><ul class="meters">${d.stock.map(x => `<li><span class="m-top"><span>${esc(x.item)}</span><span class="meta">${esc(`${x.onHand} of ${x.par} ${x.unit}`)}${x.low ? ` · <span class="pill warn">${ic('warn')}Low</span>` : ''}</span></span>
        <span class="meter${x.low ? ' low' : ''}"><span style="width:${Math.min(100, Math.round(x.onHand / x.par * 100))}%"></span></span></li>`).join('')}</ul></div>` : '';
    const temps = d.temps ? `<div class="dbox"><h3 class="lbl">Fridges and freezers</h3><ul class="dlist">${d.temps.map(x => `<li><span class="dl-n">${esc(x.unit)} <span class="meta">${esc(x.lo < 0 ? `Below ${x.hi}°F` : `${x.lo}–${x.hi}°F`)}</span></span>
        <span class="dl-v">${x.f == null ? '—' : `${x.f}°F`}${x.alert ? ` <span class="pill warn">${ic('warn')}Too warm</span>` : ''}</span></li>`).join('')}</ul></div>` : '';
    const apps = d.apps && d.apps.length ? `<div class="dbox"><h3 class="lbl">Delivery apps</h3><ul class="dlist">${d.apps.map(x => `<li><span class="dl-n">${esc(x.app)}</span>
        <span class="dl-v">${x.paused ? `<span class="pill warn">${ic('warn')}Paused</span>` : 'Taking orders'} · ${x.orders} orders</span></li>`).join('')}</ul></div>` : '';
    return `${top}<div class="dgrid">${shift}${stock}${temps}${apps}${items}</div>${miss.length ? missingRow(miss) : ''}`;
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

  /* ---------- Chat: a floating box in the corner ---------- */
  const chat = N.ui.chat || (N.ui.chat = { view: [], api: [], busy: false, draft: '', ready: null });
  const STARTERS = ['Anything I need to know right now?', 'How are sales today?', 'Who’s on shift now?', 'How did each store do yesterday?'];
  const DOING = { list_stores: 'Looking at the stores', sales: 'Checking sales', sales_by_hour: 'Checking sales by hour', top_items: 'Checking best sellers',
    staff: 'Checking shifts', inventory: 'Checking stock', temperatures: 'Checking fridges', delivery_apps: 'Checking delivery apps', insights: 'Checking insights' };
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
  let root = null;
  function chatRoot() {
    if (!root) { root = document.createElement('div'); root.id = 'chat-root'; document.body.appendChild(root); }
    return root;
  }
  function panel() {
    const starters = N.S.questions.map(q => q.text).concat(STARTERS).filter((x, i, a) => a.indexOf(x) === i).slice(0, 5);
    const off = chat.ready === false;
    return `<section class="chatpanel" role="dialog" aria-label="Chat">
      <header class="cp-head"><span class="cp-title">${ic('chat')}<span>Chat</span></span><span class="cp-where" id="cp-where">${esc(where(N.viewStore()))}</span>
        ${chat.view.length ? `<button type="button" class="x" data-act="chat-new" aria-label="New chat">${ic('fresh')}</button>` : ''}
        <button type="button" class="x" id="chat-close" data-act="chat-toggle" aria-label="Close">${ic('x')}</button></header>
      <div class="cp-body" id="cp-body">
        ${off ? `<p class="cp-off">${ic('chat')}<span>Chat isn’t switched on yet</span></p>` : ''}
        ${!off && !chat.view.length ? `<div class="chips chat-starters">${starters.map(s => `<button type="button" class="chip" data-act="chat-ask" data-text="${esc(s)}">${esc(s)}</button>`).join('')}</div>` : ''}
        <ol class="msgs" id="msgs" aria-live="polite">${chat.view.map(bubble).join('')}</ol>
      </div>
      <div class="chat-box">
        <label class="vh" for="chat-input">Ask about your stores</label>
        <textarea id="chat-input" rows="1" data-input="chat" data-enter="chat-send" placeholder="Ask about your stores"${off ? ' disabled' : ''}>${esc(chat.draft)}</textarea>
        <button type="button" class="btn-main sm" id="chat-send" data-act="chat-send" aria-label="Send"${chat.busy || off ? ' disabled' : ''}>${ic('send')}</button>
      </div></section>`;
  }
  // Draw the chat corner: the button always (on home), the box when open.
  function paintChat(focus) {
    const r = chatRoot();
    if (!ready()) { r.innerHTML = ''; return; }
    r.innerHTML = `${N.ui.chatOpen ? panel() : ''}
      <button type="button" class="chat-fab" id="chat-fab" data-act="chat-toggle" aria-expanded="${!!N.ui.chatOpen}" aria-label="${N.ui.chatOpen ? 'Close chat' : 'Chat'}">${ic(N.ui.chatOpen ? 'x' : 'chat')}</button>`;
    const body = document.getElementById('cp-body');
    if (body) body.scrollTop = body.scrollHeight;
    if (focus) { const el = document.getElementById(focus); if (el) el.focus(); }
  }
  // Home redraws itself often; the chat corner is only redrawn when it has to be.
  const render = N.render;
  N.render = o => {
    render(o);
    const r = chatRoot();
    if (!ready()) { if (r.innerHTML) r.innerHTML = ''; return; }
    if (!r.innerHTML) paintChat();
    const w = document.getElementById('cp-where');
    if (w) w.textContent = N.L(where(N.viewStore()));
  };
  function paintMsg(k) {
    const el = document.getElementById('msg-' + k);
    if (el) el.outerHTML = bubble(chat.view[k], k);
    const body = document.getElementById('cp-body');
    if (body) body.scrollTop = body.scrollHeight;
  }
  async function checkReady() {
    try {
      const r = await fetch(RELAY() + '/health');
      chat.ready = r.ok ? !!(await r.json()).ready : false;
    } catch (e) { chat.ready = false; }
    if (N.ui.chatOpen) paintChat('chat-input');
  }
  function context() {
    const view = N.viewStore(), now = new Date();
    return `<context>\nNow: ${now.toLocaleString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} (viewer's clock, ${Intl.DateTimeFormat().resolvedOptions().timeZone})\nLooking at: ${where(view)} (where="${view}")\nApp language: ${window.NOMIX_LANG === 'zh' ? 'Chinese' : 'English'}\n</context>`;
  }
  // One question: send it, run whatever tools Claude asks for on this page's data, repeat until it answers.
  async function ask(text) {
    if (chat.busy || !text.trim() || chat.ready === false) return;
    if (chat.api.length > 60) chat.api = [];
    chat.busy = true; chat.draft = '';
    chat.api.push({ role: 'user', content: [{ type: 'text', text: context() }, { type: 'text', text: text.trim() }] });
    chat.view.push({ who: 'me', text: text.trim() });
    const k = chat.view.push({ who: 'ai', text: '', status: N.L('Thinking') }) - 1, m = chat.view[k];
    paintChat('chat-input');
    try {
      for (let round = 0; round < 8; round++) {
        const res = await fetch(RELAY() + '/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: chat.api }) });
        if (!res.ok || !(res.headers.get('content-type') || '').includes('event-stream')) {
          const e = await res.json().catch(() => ({}));
          throw new Error(e.error || 'failed');
        }
        const reader = res.body.getReader(), dec = new TextDecoder();
        let buf = '', done = null;
        const before = m.text ? m.text + '\n\n' : '';
        let live = before;
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
        m.text = (before + blocks.filter(b => b.type === 'text').map(b => b.text).join('')).trim();
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
      if (err.message === 'not_ready') chat.ready = false;
      m.error = N.L(FAIL[err.message] || FAIL.failed);
      // Leave the conversation where Claude can pick it up: drop the unanswered question.
      while (chat.api.length && chat.api[chat.api.length - 1].role === 'user') chat.api.pop();
      const last = chat.api[chat.api.length - 1];
      if (last && Array.isArray(last.content) && last.content.some(b => b.type === 'tool_use')) chat.api.pop();
    }
    m.status = ''; chat.busy = false;
    if (N.ui.chatOpen) { paintMsg(k); const b = document.getElementById('chat-send'); if (b) b.disabled = chat.ready === false; }
  }
  N.inputs.chat = v => { chat.draft = v; };
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && N.ui.chatOpen && !document.querySelector('.sheet')) { N.ui.chatOpen = false; paintChat('chat-fab'); }
  });

  /* ---------- Actions ---------- */
  Object.assign(N.acts, {
    'app-open': d => {
      N.S.appOpen = N.S.appOpen === d.id ? null : d.id;
      N.save(); N.render({ refocus: 'dock-' + d.id, keepScroll: true });
    },
    'nk-open': d => {
      const o = N.ui.nkOpen || (N.ui.nkOpen = []), i = o.indexOf(d.id);
      if (i >= 0) o.splice(i, 1); else o.push(d.id);
      N.render({ refocus: 'nk-' + d.id, keepScroll: true });
    },
    'chat-toggle': () => {
      N.ui.chatOpen = !N.ui.chatOpen;
      paintChat(N.ui.chatOpen ? 'chat-input' : 'chat-fab');
      if (N.ui.chatOpen) checkReady();
    },
    'chat-ask': d => ask(N.L(d.text)),
    'chat-send': () => { const el = document.getElementById('chat-input'); ask(el ? el.value : chat.draft); },
    'chat-new': () => { if (chat.busy) return; chat.view = []; chat.api = []; paintChat('chat-input'); }
  });

  // An open app keeps itself current; the rest of the page is left alone.
  setInterval(() => {
    const el = document.getElementById('app-view');
    if (!el || !ready() || document.querySelector('.sheet')) return;
    el.innerHTML = el.dataset.app === 'insights' ? insightsView(N.viewStore()) : dashView(N.viewStore());
    N.paint();
  }, 30000);
})();
