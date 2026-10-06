/* Nomix home: overview of every store, what is connected, and the data dictionary. */
(function () {
  'use strict';
  const N = window.Nomix, D = window.NOMIX_DATA, esc = N.esc;
  const chev = () => N.icon('chev', 'chev');
  const inView = (id, store) => store === 'all' || N.status(id) !== 'connected' || N.storesOf(id).some(s => N.inView(s, store));
  const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  /* ---------- Header and store switcher ---------- */
  // All stores, one brand, or one store: brands first, then the chosen brand's stores.
  function storeBar(view) {
    const stores = N.allStores();
    if (stores.length < 2) return '';
    const chip = (id, label, key, on, cls) => `<button type="button" class="chip${cls ? ' ' + cls : ''}" id="st-${esc(key)}" data-act="store" data-id="${esc(id)}" aria-pressed="${on}">${esc(label)}</button>`;
    const open = view === 'all' ? null : view.startsWith('brand:') ? view.slice(6) : N.brandOf(view);
    const brands = N.brands().filter(b => stores.some(s => N.brandOf(s) === b.id)).map(b => {
      const n = stores.filter(s => N.brandOf(s) === b.id).length;
      return chip('brand:' + b.id, `${b.name} · ${n}`, 'b-' + b.id, open === b.id, 'brand');
    }).join('');
    const mine = open ? stores.filter(s => N.brandOf(s) === open) : [];
    return `<div class="storebar" role="group" aria-label="Choose a brand or store">
      <div class="sb-row">${chip('all', `All ${stores.length} stores`, 'all', view === 'all')}${brands}</div>
      ${mine.length > 1 ? `<div class="sb-row sb-stores">${mine.map(s => chip(s, N.storeLoc(s), s, view === s)).join('')}</div>` : ''}
    </div>`;
  }
  function header(store) {
    const sel = N.S.selected, c = N.connected().filter(id => inView(id, store));
    const later = sel.filter(id => N.status(id) === 'later').length, help = sel.filter(id => N.status(id) === 'help').length;
    const parts = [];
    if (c.length) parts.push(`${count(c.length, 'tool', 'tools')} working${store === 'all' ? '' : ` at ${N.viewName(store)}`}`);
    if (later) parts.push(`${later} waiting for you`);
    if (help) parts.push(`${help} being set up with you`);
    return `<header class="home-top">
      <div class="ht-brand">${N.logo()}${N.langLink()}</div>
      <div>
        <h1 id="home-title" tabindex="-1" data-focus>${esc(N.connected().length ? D.COMPANY.name : 'Your company')}</h1>
        <p class="summary"><span class="dot ${c.length ? 'ok' : help ? 'help' : ''}"></span>${esc(parts.length ? parts.join(' · ') : 'No tools connected yet')}</p>
      </div>
      ${storeBar(store)}
      ${N.focusKey() ? `<div class="focusbar"><span class="lbl">Showing</span><button type="button" class="chip" id="focus-clear" data-act="focus" data-id="${esc(N.focusKey())}" aria-pressed="true" aria-label="Show everything">${esc(N.focusName())}${N.icon('x')}</button></div>` : ''}
    </header>`;
  }
  // Shown while looking at a past version.
  function viewBar() {
    const v = N.viewing;
    if (!v) return '';
    const when = N.whenShort(v.at);
    return `<div class="viewbar" role="region" aria-label="Past version">
      <div class="vb-text"><strong>Viewing ${esc(when)}</strong><span>${esc(v.label)}. Connections, dictionary and data as they were then.</span></div>
      ${v.confirm
        ? `<p class="vb-confirm">Go back to this setup? Connections and the data dictionary return to how they were ${esc(N.when(v.at))}. Data Nomix kept since then stays.</p>
           <div class="row"><button type="button" class="btn-soft" id="vb-yes" data-act="view-restore-confirm">Go back to this version</button><button type="button" class="btn-quiet" data-act="view-restore-cancel">Cancel</button></div>`
        : `<div class="row"><button type="button" class="btn-soft" id="vb-restore" data-act="view-restore">Restore this version</button><button type="button" class="btn-quiet" id="vb-exit" data-act="view-exit">Back to now</button></div>`}
    </div>`;
  }

  /* ---------- Overview ---------- */
  function ownBlock() {
    const o = N.S.own, u = N.ui;
    if (o) {
      return `<div class="own"><p><strong>Also sending a copy to your ${esc(o.provider)} account</strong></p>
        <p class="meta status"><span class="dot help"></span>We’re setting this up with you · Requested ${esc(N.when(o.at))}</p>
        <button type="button" class="link-quiet edit-only" data-act="own-cancel">Cancel this request</button></div>`;
    }
    if (!u.ownOpen) return '';
    const p = u.ownPick, name = p === 'Other' ? u.ownOther.trim() : p;
    return `<div class="own edit-only">
      <span class="lbl">Which one do you use?</span>
      <div class="chips">${D.PROVIDERS.map(x => `<button type="button" class="chip" id="own-${esc(x.replace(/\W/g, ''))}" data-act="own-pick" data-id="${esc(x)}" aria-pressed="${p === x}">${esc(x)}</button>`).join('')}</div>
      ${p === 'Other' ? `<label class="vh" for="own-other">Which one?</label><input id="own-other" class="text-input" autocomplete="off" placeholder="Which one?" value="${esc(u.ownOther)}" data-input="own-other">` : ''}
      ${p ? `<p>Nomix keeps running your data home and also sends a copy to <span id="own-name">${name ? `your ${esc(name)} account` : 'your account'}</span>. We’ll set it up with you.</p>` : ''}
      <div class="row">
        ${p ? `<button type="button" class="btn-soft" id="own-request" data-act="own-request"${name ? '' : ' disabled'}>Request help</button>` : ''}
        <button type="button" class="btn-quiet" data-act="own-close">Never mind</button>
      </div>
    </div>`;
  }
  function historyList() {
    const vs = (N.real || N.S).versions;
    if (!vs.length) return '<p class="hint">Each change you make is saved here, so you can look back or go back.</p>';
    return `<ol class="history">${vs.map((v, k) => {
      const here = N.viewing && N.viewing.id === v.id;
      return `<li${here ? ' class="is-here"' : ''}><span class="h-when">${esc(N.whenShort(v.at))}${k === 0 ? ' · Latest' : ''}</span><span class="h-what">${esc(v.label)}</span>
        ${here ? '<span class="h-tag">Viewing</span>' : `<button type="button" class="btn-quiet sm" data-act="history-view" data-id="${esc(v.id)}">View</button>`}</li>`;
    }).join('')}</ol>`;
  }
  function overviewSection(store) {
    const vs = (N.real || N.S).versions.length;
    return `<section class="sec" aria-labelledby="sec-ov"><h2 class="sec-h" id="sec-ov">Overview</h2>
      <div class="glass keepcard">
        ${N.connected().length ? N.storeFlow(store, true) : '<p class="hint">Your stores show up here as each tool connects.</p>'}
        <div class="ov-foot">
          <button type="button" class="link-quiet" id="history-toggle" data-act="history-toggle" aria-expanded="${N.ui.history}">History · ${count(vs, 'version', 'versions')}</button>
          ${N.S.own || N.ui.ownOpen ? '' : '<button type="button" class="link-quiet edit-only" id="own-open" data-act="own-open">I use my own data account</button>'}
        </div>
        ${N.ui.history ? historyList() : ''}
        ${ownBlock()}
      </div></section>`;
  }

  /* ---------- Connected ---------- */
  function streamAdder(id, t) {
    if (N.ui.streamAdd !== id) return `<button type="button" class="adder sm edit-only" data-act="stream-open" data-id="${esc(id)}">${N.icon('plus')}Add something to receive</button>`;
    return `<div class="inline-add edit-only">
      <label class="vh" for="stream-new">What else should Nomix receive from ${esc(t.name)}?</label>
      <input id="stream-new" class="text-input" autocomplete="off" placeholder="Like “tips” or “table numbers”" data-input="enable-next" data-enter="stream-add" data-id="${esc(id)}">
      <button type="button" class="btn-soft" data-act="stream-add" data-id="${esc(id)}" disabled>Add</button>
      <button type="button" class="x" data-act="stream-close" aria-label="Cancel">${N.icon('x')}</button>
    </div>`;
  }
  function toolActions(id, t, st) {
    if (N.ui.disconnect === id) {
      const stores = N.storesOf(id);
      return `<div class="confirm edit-only"><p>Disconnect ${esc(t.name)}? Nomix stops receiving from it${stores.length ? ` at ${esc(N.storeList(stores))}` : ''}. What it already sent stays, and History can bring this setup back.</p>
        <div class="row"><button type="button" class="btn-soft danger" id="dc-yes" data-act="disconnect" data-id="${esc(id)}">Disconnect ${esc(t.name)}</button>
        <button type="button" class="btn-quiet" data-act="disconnect-cancel" data-id="${esc(id)}">Cancel</button></div></div>`;
    }
    return `<div class="tc-actions edit-only">
      ${st === 'connected' ? `<button type="button" class="btn-quiet sm" data-act="stores-edit" data-id="${esc(id)}">Change stores</button>` : ''}
      ${st === 'later' ? `<button type="button" class="btn-soft" data-act="home-connect" data-id="${esc(id)}">Connect ${esc(t.name)}</button>` : ''}
      <button type="button" class="btn-quiet sm danger" id="dc-${esc(id)}" data-act="${st === 'connected' ? 'disconnect-ask' : 'tool-remove'}" data-id="${esc(id)}">${st === 'connected' ? 'Disconnect' : 'Remove from list'}</button>
    </div>`;
  }
  function toolBody(id, t, st, r, store) {
    const base = N.streams(id), extra = N.extraStreams(id);
    const streams = muted => (base.length || extra.length)
      ? `<ul class="streams${muted ? ' muted' : ''}">${base.map(s => `<li>${muted ? '' : N.icon('check')}${esc(s)}</li>`).join('')}${extra.map(s => `<li class="req">${esc(s)}<span class="tagnote">· Requested</span></li>`).join('')}</ul>`
      : '';
    const ask = `What should Nomix receive from ${esc(t.name)}?`;
    let body;
    if (st === 'connected') {
      const feed = (r.feed || []).filter(e => N.inView(e.store, store)).slice(0, 4);
      body = `<div class="blk"><h3>Nomix is receiving:</h3>${streams(false)}${streamAdder(id, t)}</div>
        <div class="blk"><h3>Most recent${store === 'all' ? '' : ` at ${esc(N.viewName(store))}`}</h3><ul class="feed" data-feed="${esc(id)}">${feed.map(ev => N.feedItem(ev)).join('')}</ul></div>
        <p class="meta">Connected ${esc(N.when(r.at))}</p>`;
    } else if (st === 'help') {
      body = `<div class="blk"><p>Someone from Nomix will reach out to finish connecting ${esc(t.name)}.</p>
          <p class="meta">Requested ${esc(N.when(r.at))}</p>${r.note ? `<p class="quote">${esc(r.note)}</p>` : ''}</div>
        <div class="blk"><h3>${base.length || extra.length ? 'Nomix will receive:' : ask}</h3>${streams(true)}${streamAdder(id, t)}</div>`;
    } else {
      body = `<div class="blk"><h3>${base.length || extra.length ? 'Once connected, Nomix will receive:' : ask}</h3>${streams(true)}${streamAdder(id, t)}</div>`;
    }
    return body + toolActions(id, t, st);
  }
  function toolCard(id, store) {
    const t = N.tool(id), st = N.status(id), r = N.S.tools[id] || {}, key = 'tool:' + id, open = N.S.open === key;
    const last = N.lastTs(id, store), stores = N.storesOf(id);
    const status = st === 'connected'
      ? `<span class="dot ok"></span><span>Working · <span data-ts="${last}" data-last="${esc(id)}" data-pre="Updated ">Updated ${N.rel(last)}</span></span>`
      : st === 'help' ? '<span class="dot help"></span><span>We’re setting this up with you</span>'
      : '<span class="dot"></span><span>Not connected yet</span>';
    return `<article class="tcard glass" id="tc-${esc(id)}">
      <button type="button" class="tc-head" id="head-${esc(key)}" data-act="toggle-open" data-key="${esc(key)}" aria-expanded="${open}" aria-controls="body-${esc(id)}">
        ${N.mono(t)}
        <span class="tc-text"><span class="tc-name">${esc(N.toolName(t))}</span>
          <span class="tc-what">${esc(N.toolWhat(t))}${stores.length ? ` · ${esc(N.storeList(stores))}` : ''}</span>
          <span class="status">${status}</span></span>
        ${chev()}
      </button>
      ${open ? `<div class="tc-body" id="body-${esc(id)}">${toolBody(id, t, st, r, store)}</div>` : ''}
    </article>`;
  }
  function connectedSection(store) {
    const ft = N.focusTools();
    const list = N.S.selected.filter(id => inView(id, store) && (!ft || ft.includes(id)));
    return `<section class="sec" aria-labelledby="sec-tools"><h2 class="sec-h" id="sec-tools">Connected</h2>
      <div class="stack">
        ${list.length ? list.map(id => toolCard(id, store)).join('')
          : `<div class="glass empty-card"><p class="meta">${N.S.selected.length ? 'Nothing connected matches this filter.' : 'No tools yet. Connect the ones you use every day.'}</p></div>`}
        <button type="button" class="adder edit-only" id="pick-open" data-act="pick-open">${N.icon('plus')}Connect your tool(s)</button>
      </div></section>`;
  }

  /* ---------- Data dictionary ---------- */
  // The last five values of one field, newest first.
  function fieldHistory(cat, field, store) {
    const rows = N.histFor(cat, field, store, 5);
    if (!rows.length) return `<p class="meta fh-empty">${esc(N.waitingText(cat, store))}</p>`;
    return `<div class="fh-scroll"><table class="fh">
      <thead><tr><th scope="col">When</th><th scope="col">Store</th><th scope="col">From</th><th scope="col">Value</th></tr></thead>
      <tbody>${rows.map(e => `<tr><td data-ts="${e.ts}">${N.rel(e.ts)}</td><td>${esc(N.storeName(e.store))}</td><td>${esc(N.tool(e.tool).name)}</td><td class="fh-v">${esc(e.v)}</td></tr>`).join('')}</tbody>
    </table></div>`;
  }
  // Keep an open field's history current as new values arrive.
  N.paintHistory = () => {
    document.querySelectorAll('[data-fh]').forEach(el => {
      const [cat, field] = el.dataset.fh.split('|'), store = N.viewStore();
      const top = (N.histFor(cat, field, store, 1)[0] || {}).ts || 0;
      if (String(top) !== el.dataset.top) { el.dataset.top = top; el.innerHTML = fieldHistory(cat, field, store); }
    });
  };
  function dictGroup(id, store) {
    const c = N.cat(id), extra = N.extraFields(id), open = N.ui.field;
    const rows = c.fields.map((f, k) => {
      const key = `${id}|${f}`, on = open === key;
      const top = on ? ((N.histFor(id, f, store, 1)[0] || {}).ts || 0) : 0;
      return `<li class="dg-row${on ? ' is-open' : ''}">
        <button type="button" class="dg-field" id="df-${esc(id)}-${k}" data-act="field-open" data-id="${esc(key)}" aria-expanded="${on}">
          <span class="dg-n">${esc(f)}</span><span class="dg-t">${esc(N.typeOf(id, f))}</span>${chev()}</button>
        ${on ? `<div class="fh-wrap" data-fh="${esc(key)}" data-top="${top}">${fieldHistory(id, f, store)}</div>` : ''}
      </li>`;
    }).join('') + extra.map((f, k) => `<li class="dg-row is-custom"><div class="dg-field">
        <span class="dg-n">${esc(f)}</span><span class="dg-t">Added by you</span>
        <button type="button" class="x edit-only" data-act="field-remove" data-id="${esc(id)}" data-k="${k}" aria-label="Remove ${esc(f)}">${N.icon('x')}</button></div></li>`).join('');
    const adding = N.ui.fieldAdd === id;
    if (!N.tagOpen(id) && N.focusKey() !== 'tag:' + id) return `<div class="dg">${N.tagHead(id, store, 'h3')}</div>`;
    return `<div class="dg is-open">
      ${N.tagHead(id, store, 'h3')}
      ${rows ? `<ul class="dg-fields">${rows}</ul>` : '<p class="meta">No fields yet. Add the first one.</p>'}
      ${adding ? `<div class="inline-add edit-only">
          <label class="vh" for="field-new-${esc(id)}">Add a field to ${esc(c.name)}</label>
          <input id="field-new-${esc(id)}" class="text-input" autocomplete="off" placeholder="Like “Table number”" data-input="enable-next" data-enter="field-add" data-id="${esc(id)}">
          <button type="button" class="btn-soft" data-act="field-add" data-id="${esc(id)}" disabled>Add</button>
          <button type="button" class="x" data-act="fieldadd-close" data-id="${esc(id)}" aria-label="Cancel">${N.icon('x')}</button></div>`
        : `<button type="button" class="link-quiet edit-only" id="fa-${esc(id)}" data-act="fieldadd-open" data-id="${esc(id)}">Add a field</button>`}
    </div>`;
  }
  function askBox() {
    return `<div class="ask addpanel edit-only">
      <span class="lbl">Write a prompt</span>
      ${N.qBox()}
      <div class="row"><button type="button" class="btn-soft" id="q-add-btn" data-act="q-add-typed"${N.ui.qDraft.trim() ? '' : ' disabled'}>Add prompt</button>
        <button type="button" class="btn-quiet" data-act="ask-close">Cancel</button></div>
      ${N.qExamples()}
    </div>`;
  }
  function dictSection(store) {
    const fk = N.focusTags(), k = N.keepIds().filter(id => !fk || fk.includes(id)), qs = N.S.questions, busy = N.ui.keepAdding || N.ui.asking;
    return `<section class="sec" aria-labelledby="sec-dict"><h2 class="sec-h" id="sec-dict">Data dictionary</h2>
      <div class="glass keepcard">
        ${qs.length ? `<div class="qwrap"><span class="lbl">Your prompts</span>${N.qRows()}</div>` : ''}
        ${N.ui.asking ? askBox() : (busy ? '' : `<button type="button" class="adder sm edit-only" id="ask-open" data-act="ask-open">${N.icon('plus')}Write a prompt</button>`)}
        <span class="lbl dict-lbl">Tags</span>
        ${k.length ? `<div class="dict-clean">${k.map(id => dictGroup(id, store)).join('')}</div>` : '<p class="hint">No tags yet. Write a prompt or add a tag.</p>'}
        ${N.ui.keepAdding ? N.keepPanel() : (busy ? '' : `<button type="button" class="adder sm edit-only" data-act="keep-add-open">${N.icon('plus')}Add a tag</button>`)}
      </div></section>`;
  }

  function footer() {
    return `<footer class="foot edit-only">${N.ui.resetAsk
      ? '<span>Start over? This clears your tools, choices and history.</span><button type="button" class="btn-quiet" id="reset-yes" data-act="reset-yes">Start over</button><button type="button" class="btn-quiet" data-act="reset-no">Keep everything</button>'
      : '<button type="button" class="link-quiet" id="reset-ask" data-act="reset-ask">Set up again</button>'}</footer>`;
  }

  N.home = {
    render(app) {
      const store = N.viewStore();
      app.innerHTML = `<div class="home${N.viewing ? ' viewing' : ''}">${viewBar()}${header(store)}
        <main class="home-main" aria-labelledby="home-title">
          ${overviewSection(store)}<div class="strap-link" aria-hidden="true"></div>
          ${connectedSection(store)}<div class="strap-link" aria-hidden="true"></div>
          ${dictSection(store)}
        </main>${footer()}</div>`;
    },
    sheetScreen() {
      if (N.S.flow && N.S.flow.ctx === 'home') return N.flowView();
      if (N.ui.sheet !== 'pick') return null;
      const n = N.S.pick.length;
      return {
        wide: true, body: N.toolsBody('home'),
        main: n ? { label: `Connect ${count(n, 'tool', 'tools')}`, act: 'pick-go' } : { label: 'Choose a tool', disabled: true }
      };
    }
  };

  // Live: new information lands in place without redrawing the page.
  N.onEvent = (id, ev) => {
    if (N.S.phase !== 'home' || N.viewing) return;
    const store = N.viewStore();
    if (!N.inView(ev.store, store)) return;
    document.querySelectorAll(`[data-last="${id}"]`).forEach(el => { el.dataset.ts = ev.ts; });
    const ul = document.querySelector(`[data-feed="${id}"]`);
    if (ul) {
      ul.insertAdjacentHTML('afterbegin', N.feedItem(ev, true));
      while (ul.children.length > 4) ul.lastElementChild.remove();
    }
  };

  N.inputs['own-other'] = v => {
    N.ui.ownOther = v;
    const b = document.getElementById('own-request'), s = document.getElementById('own-name');
    if (b) b.disabled = !v.trim();
    if (s) s.textContent = v.trim() ? `your ${v.trim()} account` : 'your account';
  };
  const removeTool = id => {
    N.S.selected = N.S.selected.filter(x => x !== id);
    delete N.S.tools[id];
    if (N.S.open === 'tool:' + id) N.S.open = null;
    N.ui.disconnect = null;
  };
  Object.assign(N.acts, {
    store: (d, el) => { N.S.store = d.id; if (!N.viewing) N.save(); N.render({ refocus: el.id, keepScroll: true }); },
    // Tap a tool or tag in the diagram to see what it touches; tap it again (or the chip) to show everything.
    focus: (d, el) => { N.ui.focus = N.ui.focus === d.id ? null : d.id; N.render({ refocus: el.id === 'focus-clear' ? null : el.id, keepScroll: true }); },
    'toggle-open': d => {
      N.S.open = N.S.open === d.key ? null : d.key;
      N.ui.streamAdd = null; N.ui.disconnect = null;
      N.save(); N.render({ refocus: 'head-' + d.key, keepScroll: true });
      const head = document.getElementById('head-' + d.key);
      if (head && N.S.open === d.key) head.parentNode.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    },
    'field-open': (d, el) => { N.ui.field = N.ui.field === d.id ? null : d.id; N.render({ refocus: el.id, keepScroll: true }); },
    'fieldadd-open': d => { N.ui.fieldAdd = d.id; N.render({ refocus: 'field-new-' + d.id, keepScroll: true }); },
    'fieldadd-close': d => { N.ui.fieldAdd = null; N.render({ refocus: 'fa-' + d.id, keepScroll: true }); },
    'ask-open': () => { N.ui.asking = true; N.ui.tag = null; N.ui.keepAdding = false; N.render({ refocus: 'q-text', keepScroll: true }); },
    'ask-close': () => { N.ui.asking = false; N.ui.qDraft = ''; N.render({ refocus: 'ask-open', keepScroll: true }); },
    'stream-open': d => { N.ui.streamAdd = d.id; N.render({ refocus: 'stream-new', keepScroll: true }); },
    'stream-close': () => { const id = N.ui.streamAdd; N.ui.streamAdd = null; N.render({ refocus: 'head-tool:' + id, keepScroll: true }); },
    'stream-add': d => {
      const el = document.getElementById('stream-new'), v = el ? el.value.trim() : '';
      if (!v) return;
      N.addTo(N.S.extraStreams, d.id, v);
      N.commit(`Asked ${N.tool(d.id).name} for ${v.toLowerCase()}`);
      N.save(); N.render({ refocus: 'stream-new', keepScroll: true });
      N.toast(`Asked for ${v.toLowerCase()} from ${N.tool(d.id).name}`);
    },
    'home-connect': d => N.startFlow([d.id], 'home'),
    'stores-edit': d => {
      N.S.flow = { queue: [d.id], i: 0, phase: 'choose', ctx: 'home', mode: 'stores', found: N.storesFound(d.id, true), stores: N.storesOf(d.id).slice() };
      N.save(); N.render({ focus: true });
    },
    'disconnect-ask': d => { N.ui.disconnect = d.id; N.render({ refocus: 'dc-yes', keepScroll: true }); },
    'disconnect-cancel': d => { N.ui.disconnect = null; N.render({ refocus: 'dc-' + d.id, keepScroll: true }); },
    disconnect: d => {
      const name = N.tool(d.id).name;
      removeTool(d.id);
      N.commit(`Disconnected ${name}`);
      N.save(); N.render({ refocus: 'pick-open', keepScroll: true });
      N.toast(`${name} disconnected`);
    },
    'tool-remove': d => {
      const name = N.tool(d.id).name;
      removeTool(d.id);
      N.commit(`Removed ${name} from the list`);
      N.save(); N.render({ refocus: 'pick-open', keepScroll: true });
    },
    'pick-open': () => { N.S.pick = []; N.ui.search = ''; N.ui.adding = null; N.ui.sheet = 'pick'; N.render({ focus: true }); },
    'pick-go': () => {
      const ids = N.S.pick.slice();
      ids.forEach(id => { if (!N.S.selected.includes(id)) N.S.selected.push(id); });
      N.S.pick = []; N.ui.sheet = null; N.ui.search = ''; N.ui.adding = null;
      N.startFlow(ids, 'home');
    },
    'sheet-close': () => {
      N.clearWait();
      N.S.flow = null; N.S.pick = []; N.ui.sheet = null; N.ui.adding = null; N.ui.search = '';
      N.save(); N.render({ refocus: 'pick-open', keepScroll: true });
    },
    'history-toggle': () => { N.ui.history = !N.ui.history; N.render({ refocus: 'history-toggle', keepScroll: true }); },
    'history-view': d => N.viewVersion(d.id),
    'view-exit': () => N.exitView(),
    'view-restore': () => { N.viewing.confirm = true; N.render({ refocus: 'vb-yes', keepScroll: true }); },
    'view-restore-cancel': () => { N.viewing.confirm = false; N.render({ refocus: 'vb-restore', keepScroll: true }); },
    'view-restore-confirm': () => N.restoreVersion(),
    'own-open': () => { N.ui.ownOpen = true; N.render({ keepScroll: true, refocus: 'own-Snowflake' }); },
    'own-close': () => { N.ui.ownOpen = false; N.ui.ownPick = null; N.ui.ownOther = ''; N.render({ keepScroll: true, refocus: 'own-open' }); },
    'own-pick': d => { N.ui.ownPick = d.id; N.render({ keepScroll: true, refocus: d.id === 'Other' ? 'own-other' : 'own-request' }); },
    'own-request': () => {
      const p = N.ui.ownPick === 'Other' ? N.ui.ownOther.trim() : N.ui.ownPick;
      if (!p) return;
      N.S.own = { provider: p, at: Date.now() };
      N.ui.ownOpen = false; N.ui.ownPick = null; N.ui.ownOther = '';
      N.commit(`Asked to send a copy to ${p}`);
      N.save(); N.render({ keepScroll: true });
      N.toast(`Help requested for ${p}`);
    },
    'own-cancel': () => {
      const p = N.S.own && N.S.own.provider;
      N.S.own = null;
      N.commit(`Stopped the copy to ${p}`);
      N.save(); N.render({ keepScroll: true, refocus: 'own-open' });
    },
    'reset-ask': () => { N.ui.resetAsk = true; N.render({ keepScroll: true, refocus: 'reset-yes' }); },
    'reset-no': () => { N.ui.resetAsk = false; N.render({ keepScroll: true, refocus: 'reset-ask' }); },
    'reset-yes': () => { N.reset(); N.render({ focus: true }); window.scrollTo(0, 0); }
  });
})();
