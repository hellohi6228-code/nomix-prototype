/* Nomix setup: one question per screen, one main button, one strap at a time. */
(function () {
  'use strict';
  const N = window.Nomix, D = window.NOMIX_DATA, esc = N.esc;
  const STEPS = ['welcome', 'tools', 'connect', 'track', 'dictionary', 'ready'];
  const stepNo = s => STEPS.indexOf(s);
  let waitTimer = null;

  /* ---------- 1. Welcome ---------- */
  function heroArt() {
    const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const paths = ['M50 20 C150 20 160 52 236 52', 'M50 52 H236', 'M50 84 C150 84 160 52 236 52'];
    const dots = still ? '' : paths.map((p, k) =>
      `<circle class="hk-dot" r="3.5"><animateMotion dur="2.8s" begin="-${(k * 0.9).toFixed(1)}s" repeatCount="indefinite" path="${p}"/></circle>`).join('');
    return `<svg class="hero-knot" viewBox="0 0 300 104" aria-hidden="true">
      ${paths.map(p => `<path class="hk-line" d="${p}"/>`).join('')}
      <rect class="hk-a" x="4" y="8" width="46" height="24" rx="12"/><circle class="hk-pin" cx="17" cy="20" r="6"/>
      <rect class="hk-b" x="4" y="40" width="46" height="24" rx="12"/><circle class="hk-pin" cx="17" cy="52" r="6"/>
      <rect class="hk-c" x="4" y="72" width="46" height="24" rx="12"/><circle class="hk-pin" cx="17" cy="84" r="6"/>
      ${dots}
      <circle class="hk-hub" cx="262" cy="52" r="26"/>
      <g class="hk-knot" transform="translate(248 43.6) scale(.7)"><circle cx="8" cy="12" r="5.5"/><circle cx="32" cy="12" r="5.5"/><path d="M13.5 12h13"/></g>
    </svg>`;
  }
  function welcome() {
    return {
      body: `<div class="welcome">
        ${heroArt()}
        ${N.title('Let’s connect your restaurant')}
        <p class="lead">A few simple steps. You can finish the rest later.</p>
        <ol class="how" aria-label="What happens next">
          <li><span class="node"></span>Choose the tools you use</li>
          <li><span class="node"></span>Connect them one at a time</li>
          <li><span class="node"></span>Tell us what to keep track of</li>
        </ol>
      </div>`,
      main: { label: 'Start', act: 'go', id: 'tools' }
    };
  }

  /* ---------- 2. What do you use? (also the "connect another tool" sheet) ---------- */
  const ctxNow = () => (N.S.phase === 'setup' ? 'setup' : 'home');
  N.toolsBody = ctx => {
    const setup = ctx === 'setup';
    return `<div class="head">${N.title(setup ? 'What do you use?' : 'Connect your tool(s)')}
        ${setup ? '<p class="lead">Choose the tools you use every day.</p>' : ''}</div>
      <label class="search"><span class="vh">Find a tool</span>${N.icon('search')}
        <input id="tool-search" type="search" placeholder="Find a tool" autocomplete="off" value="${esc(N.ui.search)}" data-input="search"></label>
      <div class="groups" id="tool-groups">${N.toolGroups()}</div>`;
  };

  function toolCard(t, ctx) {
    const st = N.status(t.id), inSel = N.S.selected.includes(t.id);
    const locked = ctx === 'home' && inSel && st !== 'later';
    const on = ctx === 'setup' ? inSel : N.S.pick.includes(t.id);
    const what = inSel && st === 'connected' ? 'Connected' : inSel && st === 'help' ? 'Being set up with you' : N.toolWhat(t);
    return `<button type="button" class="tool" id="tool-${esc(t.id)}" data-act="toggle-tool" data-id="${esc(t.id)}" aria-pressed="${on || locked}"${locked ? ' disabled' : ''}>
      ${N.mono(t)}<span class="tool-text"><span class="name">${esc(N.toolName(t))}</span><span class="what">${esc(what)}</span></span>
      <span class="tick" aria-hidden="true">${N.icon('check')}</span></button>`;
  }
  function addCard(g) {
    return `<button type="button" class="tool add" data-act="add-open" data-group="${g.id}">
      <span class="mono g-add">${N.icon('plus')}</span>
      <span class="tool-text"><span class="name">${esc(g.addName)}</span><span class="what">${esc(g.addWhat)}</span></span></button>`;
  }
  const addLabel = () => (N.ui.addName.trim() ? `Add ${N.ui.addName.trim()}` : 'Add tool');
  function addForm() {
    const k = N.ui.addKind;
    return `<div class="addform" role="group" aria-labelledby="add-h">
      <span class="lbl" id="add-h">Add a tool we don’t list</span>
      <label class="vh" for="add-name">What’s it called?</label>
      <input id="add-name" class="text-input" autocomplete="off" placeholder="What’s it called?" value="${esc(N.ui.addName)}" data-input="add-name" data-enter="add-save">
      <span class="lbl">What does it do?</span>
      <div class="chips">${D.CUSTOM_KINDS.map(kind => `<button type="button" class="chip" data-act="add-kind" data-kind="${kind}" aria-pressed="${k === kind}">${esc(D.KINDS[kind].label)}</button>`).join('')}</div>
      <div class="row">
        <button type="button" class="btn-soft" id="add-save" data-act="add-save"${N.ui.addName.trim() ? '' : ' disabled'}>${esc(addLabel())}</button>
        <button type="button" class="btn-quiet" data-act="add-cancel">Cancel</button>
      </div>
    </div>`;
  }
  N.toolGroups = () => {
    const ctx = ctxNow(), raw = N.ui.search.trim(), q = raw.toLowerCase();
    if (N.ui.adding && q) return `<div class="grid">${addForm()}</div>`;
    const match = t => !q || [t.name, t.alt || '', N.toolWhat(t)].some(s => s.toLowerCase().includes(q));
    const out = D.GROUPS.map(g => {
      const list = N.allTools().filter(t => N.groupOf(t) === g.id && match(t));
      if (q && !list.length) return '';
      // Folded until the owner taps the group; a search or an open "add" form unfolds it.
      const open = !!q || N.ui.adding === g.id || (N.ui.groupsOpen || []).includes(g.id);
      const tail = N.ui.adding === g.id ? addForm() : (q ? '' : addCard(g));
      const peek = list.filter(t => D.LOGOS[t.id]).slice(0, 5).map(t => `<img src="logos/${D.LOGOS[t.id]}" alt="" decoding="async">`).join('');
      return `<section class="group${open ? ' is-open' : ''}" aria-label="${esc(g.title)}">
        <h2 class="group-h"><button type="button" class="group-toggle" id="grp-${g.id}" data-act="group-open" data-id="${g.id}" aria-expanded="${open}">
          <span class="gt-text"><span class="gt-title">${esc(g.title)}</span><span class="gt-hint">${esc(g.hint)}</span></span>
          ${open ? '' : `<span class="gt-peek" aria-hidden="true">${peek}</span>`}
          <span class="gt-count" id="gc-${g.id}">${esc(groupCount(g.id, list.length))}</span>
          ${N.icon('chev', 'chev')}</button></h2>
        ${open ? `<div class="grid">${list.map(t => toolCard(t, ctx)).join('')}${tail}</div>` : ''}</section>`;
    }).join('');
    return out || `<div class="nomatch"><p>Nothing called “${esc(raw)}” yet.</p>
      <button type="button" class="btn-soft" data-act="add-open" data-group="team" data-name="${esc(raw)}">${N.icon('plus')}Add “${esc(raw)}”</button></div>`;
  };
  const redrawGroups = () => { const g = document.getElementById('tool-groups'); if (g) g.innerHTML = N.toolGroups(); };
  // "2 chosen" once something in the group is picked, otherwise how many tools it holds.
  function groupCount(gid, total) {
    const list = ctxNow() === 'setup' ? N.S.selected : N.S.pick;
    const n = list.filter(id => { const t = N.tool(id); return t && N.groupOf(t) === gid; }).length;
    return n ? `${n} chosen` : `${total} tools`;
  }
  N.acts['group-open'] = d => {
    const list = N.ui.groupsOpen || (N.ui.groupsOpen = []), i = list.indexOf(d.id);
    if (i >= 0) list.splice(i, 1); else list.push(d.id);
    redrawGroups();
    const b = document.getElementById('grp-' + d.id);
    if (b) b.focus({ preventScroll: true });
  };

  function tools() {
    const n = N.S.selected.length;
    return {
      wide: true, back: 'welcome', body: N.toolsBody('setup'),
      main: { label: n ? `Continue with ${n} ${n === 1 ? 'tool' : 'tools'}` : 'Skip for now', act: 'tools-next' }
    };
  }

  N.inputs.search = v => { N.ui.search = v; N.ui.adding = null; redrawGroups(); };
  N.inputs['add-name'] = v => {
    N.ui.addName = v;
    const b = document.getElementById('add-save');
    if (b) { b.disabled = !v.trim(); b.textContent = addLabel(); }
  };
  Object.assign(N.acts, {
    'toggle-tool': (d, el) => {
      const home = ctxNow() === 'home', list = home ? N.S.pick : N.S.selected;
      const i = list.indexOf(d.id);
      if (i >= 0) {
        list.splice(i, 1);
        if (!home) { delete N.S.tools[d.id]; el.querySelector('.what').textContent = N.toolWhat(N.tool(d.id)); }
      } else list.push(d.id);
      el.setAttribute('aria-pressed', String(i < 0));
      const gid = N.groupOf(N.tool(d.id)), gc = document.getElementById('gc-' + gid);
      if (gc) gc.textContent = N.L(groupCount(gid, N.allTools().filter(t => N.groupOf(t) === gid).length));
      N.save(); N.refreshMain();
    },
    'add-open': d => {
      const g = D.GROUPS.find(x => x.id === d.group);
      N.ui.adding = g.id; N.ui.addName = d.name || ''; N.ui.addKind = d.name ? null : g.addKind;
      redrawGroups();
      const input = document.getElementById('add-name');
      if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
    },
    'add-cancel': () => { N.ui.adding = null; N.ui.addName = ''; N.ui.addKind = null; redrawGroups(); },
    'add-kind': (d, el) => {
      N.ui.addKind = d.kind;
      el.parentNode.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', String(c === el)));
    },
    'add-save': () => {
      const name = N.ui.addName.trim();
      if (!name) { const i = document.getElementById('add-name'); if (i) i.focus(); return; }
      const lower = name.toLowerCase();
      let t = N.allTools().find(x => [x.name, x.alt, N.toolName(x)].some(s => s && s.toLowerCase() === lower));
      if (!t) {
        const kind = N.ui.addKind || 'other';
        t = { id: 'c' + Date.now().toString(36), name, kind, custom: true, assisted: true };
        if (kind === 'other' && N.ui.adding) t.group = N.ui.adding;
        N.S.custom.push(t);
      }
      const home = ctxNow() === 'home', list = home ? N.S.pick : N.S.selected;
      const busy = home && N.S.selected.includes(t.id) && N.status(t.id) !== 'later';
      if (!busy && !list.includes(t.id)) list.push(t.id);
      N.ui.adding = null; N.ui.addName = ''; N.ui.addKind = null; N.ui.search = '';
      const s = document.getElementById('tool-search');
      if (s) s.value = '';
      N.save(); redrawGroups(); N.refreshMain();
      const card = document.getElementById('tool-' + t.id);
      if (card) { card.focus({ preventScroll: true }); card.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      N.toast(busy ? `${t.name} is already on your list` : `${t.name} added`);
    },
    'tools-next': () => { N.ui.search = ''; N.ui.adding = null; N.startFlow(N.S.selected, 'setup'); },
    go: d => {
      N.clearWait();
      if (N.S.step === 'connect' && d.id !== 'connect') N.S.flow = null;
      N.ui.keepAdding = false; N.ui.adding = null;
      N.go(d.id);
    }
  });

  /* ---------- 3. Connect one tool at a time (setup and home share this) ---------- */
  N.startFlow = (ids, ctx) => {
    const queue = ids.filter(id => N.status(id) === 'later');
    if (!queue.length) {
      N.S.flow = null;
      if (ctx === 'setup') return N.go('track');
      N.save(); return N.render();
    }
    N.S.flow = { queue, i: 0, phase: 'intro', ctx, note: '', stores: null, found: null };
    if (ctx === 'setup') N.go('connect'); else { N.save(); N.render({ focus: true }); }
  };

  const linkViz = (t, state) => `<div class="link-viz is-${state}" aria-hidden="true">
    <span class="lv-node">${N.mono(t)}</span><span class="lv-wire"><span></span></span><span class="lv-node lv-nomix">${N.knot()}</span></div>`;
  function queueStrip(f) {
    if (f.queue.length < 2) return '';
    return `<ol class="queue" aria-label="Tool ${f.i + 1} of ${f.queue.length}">${f.queue.map((id, k) => {
      const t = N.tool(id), s = N.status(id);
      const cls = k === f.i ? 'q-now' : s === 'connected' ? 'q-ok' : s === 'help' ? 'q-help' : k < f.i ? 'q-later' : '';
      return `<li class="${cls}">${N.mono(t)}<span>${esc(t.name)}</span>${s === 'connected' ? N.icon('check') : ''}</li>`;
    }).join('')}</ol>`;
  }
  // The button on a finished step names where it goes, and the step moves on by itself.
  function nextStep(f) {
    if (f.i < f.queue.length - 1) return `Next: ${N.tool(f.queue[f.i + 1]).name}`;
    return f.ctx === 'setup' ? 'Next: what to keep track of' : 'Done';
  }

  N.flowView = () => {
    const f = N.S.flow, id = f.queue[f.i], t = N.tool(id), name = t.name;
    let state = 'idle', h = '', lead = '', extra = '', main = null, sec = null;
    if (f.phase === 'intro' && t.assisted) {
      state = 'help'; h = 'We’ll set this up with you';
      lead = `Someone from Nomix will connect ${name} with you.`;
      extra = `<div class="note"><label class="lbl" for="help-note">Anything we should know?<span class="opt">Optional</span></label>
        <textarea id="help-note" data-input="note" placeholder="Like the best time to call">${esc(f.note || '')}</textarea></div>`;
      main = { label: 'Request help', act: 'flow-help' }; sec = { label: 'Do this later', act: 'flow-later' };
    } else if (f.phase === 'intro') {
      h = `Connect ${name}`; lead = 'Sign in and choose your restaurant.';
      main = { label: `Continue to ${name}`, act: 'flow-go' }; sec = { label: 'Do this later', act: 'flow-later' };
    } else if (f.phase === 'waiting') {
      state = 'waiting'; h = `Signing in to ${name}`; lead = 'Keep this screen open. It only takes a moment.';
      main = { label: `Waiting for ${name}`, busy: true, disabled: true }; sec = { label: 'Cancel', act: 'flow-cancel' };
    } else if (f.phase === 'choose') {
      const found = f.found || [], n = (f.stores || []).length, edit = f.mode === 'stores';
      const count = n === 1 ? '1 store' : n + ' stores';
      h = edit ? `Choose stores for ${name}` : 'Choose your stores';
      lead = edit ? `Nomix keeps ${name} data from the stores you choose.` : `We found ${found.length} ${D.ACCOUNT.name} stores on ${name}.`;
      extra = `<div class="locs" role="group" aria-label="Stores">${found.map(s =>
        `<label class="loc"><input type="checkbox" data-change="store" value="${esc(s)}"${(f.stores || []).includes(s) ? ' checked' : ''}><span><span class="name">${esc(D.ACCOUNT.name)}</span> <span class="what">· ${esc(s)}</span></span></label>`).join('')}</div>`;
      main = n ? { label: edit ? `Save ${count}` : `Connect ${count}`, act: 'flow-connect' } : { label: 'Choose a store', disabled: true };
      sec = edit ? { label: 'Cancel', act: 'sheet-close' } : { label: 'Do this later', act: 'flow-later' };
    } else if (f.phase === 'done') {
      const r = N.S.tools[id];
      state = 'live'; h = `${name} ${t.plural ? 'are' : 'is'} connected`;
      lead = `${D.ACCOUNT.name} · ${N.list(r.stores)}`;
      main = { label: nextStep(f), act: 'flow-next' };
    } else if (f.phase === 'helped') {
      state = 'help'; h = 'Help is on the way';
      lead = `Someone from Nomix will reach out to finish connecting ${name}.`;
      main = { label: nextStep(f), act: 'flow-next' };
    }
    const body = `${queueStrip(f)}<div class="connect" aria-live="polite">${linkViz(t, state)}
      <div class="head">${N.title(h)}<p class="lead">${esc(lead)}</p></div>${extra}</div>`;
    return { body, main, secondary: sec };
  };

  let moveTimer = null;
  const cur = () => N.S.flow && N.S.flow.queue[N.S.flow.i];
  function advance() {
    clearTimeout(moveTimer);
    const f = N.S.flow;
    if (!f) return;
    if (f.i < f.queue.length - 1) {
      f.i++; f.phase = 'intro'; f.note = ''; f.stores = null; f.found = null;
      N.save(); return N.render({ focus: true });
    }
    const last = f.queue[f.i];
    N.S.flow = null;
    if (f.ctx === 'setup') return N.go('track');
    N.S.open = 'tool:' + last;   // show the owner the tool they just set up
    N.save(); N.render({ refocus: 'head-tool:' + last });
    const card = document.getElementById('tc-' + last);
    if (card) card.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  // Show the finished state for a moment, then carry on without another tap.
  function settle(phase) {
    const f = N.S.flow, id = cur();
    f.phase = phase; N.save(); N.render({ focus: true });
    clearTimeout(moveTimer);
    moveTimer = setTimeout(() => {
      const g = N.S.flow;
      if (g && g.phase === phase && g.queue[g.i] === id) advance();
    }, 1500);
  }
  function connect(id, stores) {
    N.S.tools[id] = { status: 'connected', at: Date.now(), stores: stores.slice() };
    N.seedFeed(id);
    N.commit(`Connected ${N.tool(id).name} · ${N.list(stores)}`);
    settle('done');
  }
  N.clearWait = () => { clearTimeout(waitTimer); clearTimeout(moveTimer); };
  N.inputs.note = v => { if (N.S.flow) { N.S.flow.note = v; N.save(); } };
  N.changes.store = el => {
    const f = N.S.flow;
    if (!f) return;
    const set = new Set(f.stores || []);
    if (el.checked) set.add(el.value); else set.delete(el.value);
    f.stores = (f.found || []).filter(s => set.has(s));
    N.save(); N.refreshMain();
  };
  Object.assign(N.acts, {
    'flow-go': () => {
      const f = N.S.flow, id = cur();
      f.phase = 'waiting'; N.save(); N.render({ focus: true });
      N.clearWait();
      waitTimer = setTimeout(() => {
        const g = N.S.flow;
        if (!g || g.phase !== 'waiting' || g.queue[g.i] !== id) return;
        const found = N.storesFound(id);
        if (found.length === 1) return connect(id, found);   // one store on this account: nothing to choose
        g.phase = 'choose'; g.found = found; g.stores = found.slice();
        N.save(); N.render({ focus: true });
      }, 1900);
    },
    'flow-cancel': () => { N.clearWait(); N.S.flow.phase = 'intro'; N.save(); N.render({ focus: true }); },
    'flow-later': () => {
      N.clearWait();
      const id = cur();
      if (N.S.tools[id] && N.S.tools[id].status !== 'connected') delete N.S.tools[id];
      advance();
    },
    'flow-connect': () => {
      const f = N.S.flow, id = cur();
      if (!f.stores || !f.stores.length) return;
      if (f.mode !== 'stores') return connect(id, f.stores);
      // Changing which stores a connected tool covers
      N.S.tools[id].stores = f.stores.slice();
      N.S.flow = null;
      N.commit(`${N.tool(id).name} now covers ${N.list(f.stores)}`);
      N.save(); N.render({ refocus: 'head-tool:' + id, keepScroll: true });
      N.toast(`${N.tool(id).name} now covers ${f.stores.length === 1 ? '1 store' : f.stores.length + ' stores'}`);
    },
    'flow-help': () => {
      const f = N.S.flow, id = cur();
      N.S.tools[id] = { status: 'help', at: Date.now(), note: (f.note || '').trim() };
      N.commit(`Asked for help with ${N.tool(id).name}`);
      settle('helped');
    },
    'flow-next': () => advance()
  });

  /* ---------- 4. What would you like to keep track of? ---------- */
  // Every tag, grouped, for owners who would rather pick than ask.
  function tagPicker() {
    const keep = N.keepIds();
    return `<div class="tagpick"><span class="lbl">Or pick tags</span>
      ${D.TAG_GROUPS.map(g => `<div class="tp-group"><span class="tp-title">${esc(g.title)}</span>
        <div class="chips">${g.ids.map(id => { const c = N.cat(id), on = keep.includes(id);
          return `<button type="button" class="chip" id="tp-${id}" data-act="tag-toggle" data-id="${id}" aria-pressed="${on}" title="${esc(c.about)}">${on ? N.icon('check') : N.icon('plus')}${esc(c.name)}</button>`; }).join('')}</div></div>`).join('')}
      ${N.S.customCats.length ? `<div class="tp-group"><span class="tp-title">Your own</span><div class="chips">${N.S.customCats.map(c => { const on = keep.includes(c.id);
        return `<button type="button" class="chip" id="tp-${esc(c.id)}" data-act="tag-toggle" data-id="${esc(c.id)}" aria-pressed="${on}">${on ? N.icon('check') : N.icon('plus')}${esc(c.name)}</button>`; }).join('')}</div></div>` : ''}
      ${N.ui.keepAdding ? N.keepPanel() : `<button type="button" class="adder sm" data-act="keep-add-open">${N.icon('plus')}Make your own tag</button>`}
    </div>`;
  }
  function track() {
    const draft = N.ui.qDraft.trim(), qs = N.S.questions;
    const main = draft ? { label: 'Add this prompt', act: 'q-add-typed' }
      : N.keepIds().length ? { label: 'Review your data dictionary', act: 'go', id: 'dictionary' }
      : { label: 'Suggest for me', act: 'q-suggest' };
    return {
      back: 'tools', main,
      body: `<div class="head">${N.title('What would you like to keep track of?')}
          <div class="qwrap"><span class="lbl">Your prompts</span>
          ${qs.length ? N.qRows() : '<p class="hint">Write one below, tap an example, or pick tags.</p>'}</div></div>
        ${N.qBox()}
        ${N.qExamples()}
        ${tagPicker()}`
    };
  }
  N.acts['tag-toggle'] = d => {
    if (N.keepIds().includes(d.id)) return N.acts['keep-remove'](d);
    if (!N.S.extraKeep.includes(d.id)) N.S.extraKeep.push(d.id);
    N.save(); N.render({ refocus: 'tp-' + d.id, keepScroll: true });
  };

  /* ---------- 5. Your data dictionary: how each tool's data lines up with Nomix ---------- */
  // The tools that fill a tag, in the order the owner connected them.
  const feeders = id => {
    const c = N.cat(id);
    return c.custom ? [] : N.S.selected.filter(t => N.status(t) === 'connected' && c.kinds.includes(N.tool(t).kind));
  };
  function mapCell(toolId, cat, field) {
    const src = ((N.MAP[toolId] || {})[cat] || {})[field];
    if (src === '=') return '<td class="m-calc">Worked out by Nomix</td>';
    if (src) return `<td><code>${esc(src)}</code></td>`;
    return '<td class="m-with">Mapped with you</td>';
  }
  function mapTable(id) {
    const c = N.cat(id), tools = feeders(id), extra = N.extraFields(id);
    const cols = tools.length ? tools.map(t => `<th scope="col">${esc(N.tool(t).name)}</th>`).join('') : '<th scope="col">Comes from</th>';
    const none = `<td class="m-with">${esc(N.sourceLine(id, 'all'))}</td>`;
    const live = (f) => `<td class="fvc" data-fvc="${esc(id)}|${esc(f)}"><span class="fvc-v"></span><span class="fvc-s"></span></td>`;
    const rows = c.fields.map(f => `<tr><th scope="row">${esc(f)}</th><td class="m-type">${esc(N.typeOf(id, f))}</td>
        ${tools.length ? tools.map(t => mapCell(t, id, f)).join('') : none}${live(f)}</tr>`).join('')
      + extra.map((f, k) => `<tr class="is-custom"><th scope="row">${esc(f)}</th><td class="m-type">Text</td>
        <td class="m-with" colspan="${Math.max(tools.length, 1)}">Added by you · mapped with you</td>
        <td><button type="button" class="x" data-act="field-remove" data-id="${esc(id)}" data-k="${k}" aria-label="Remove ${esc(f)}">${N.icon('x')}</button></td></tr>`).join('');
    const asks = N.questionsFor(id);
    const open = N.tagOpen(id);
    return `<article class="dcard${open ? ' is-open' : ''}">
      ${N.tagHead(id, 'all', 'h2')}
      ${open ? `<div class="dc-body">
      <p class="dc-about">${esc(c.about)}</p>
      ${asks.length ? `<p class="tb-asks"><span class="lbl">Answers</span>${asks.map(q => `<span>${esc(q.text)}</span>`).join('')}</p>` : ''}
      <div class="maptable-wrap"><table class="maptable">
        <thead><tr><th scope="col">Nomix field</th><th scope="col">Type</th>${cols}<th scope="col">Latest value</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      <div class="inline-add">
        <label class="vh" for="field-new-${esc(id)}">Add a field to ${esc(c.name)}</label>
        <input id="field-new-${esc(id)}" class="text-input" autocomplete="off" placeholder="Add a field, like “Table number”" data-input="enable-next" data-enter="field-add" data-id="${esc(id)}">
        <button type="button" class="btn-soft" data-act="field-add" data-id="${esc(id)}" disabled>Add</button>
      </div></div>` : ''}
    </article>`;
  }
  function dictionary() {
    const k = N.keepIds();
    return {
      back: 'track', wide: true,
      body: `<div class="head">${N.title('Your data dictionary')}<p class="lead">How each tool’s data lines up with Nomix. Every store uses the same fields. Tap a tag to see its fields.</p></div>
        ${k.length ? `<div class="dict">${k.map(mapTable).join('')}</div>` : '<p class="meta">No tags yet. Go back and write a prompt, or add a tag.</p>'}
        ${N.ui.keepAdding ? N.keepPanel() : `<button type="button" class="adder" data-act="keep-add-open">${N.icon('plus')}Add a tag</button>`}`,
      main: k.length ? { label: 'Looks right', act: 'go', id: 'ready' } : { label: 'Add at least one tag', disabled: true }
    };
  }

  /* ---------- 6. Ready ---------- */
  function ready() {
    const c = N.connected(), total = N.S.selected.length, p = total - c.length, stores = N.allStores().length;
    let lead;
    if (!total) lead = 'Nomix is set up. Connect your first tool whenever you’re ready.';
    else {
      lead = !c.length ? 'Nomix is set up.'
        : `${c.length === 1 ? N.tool(c[0]).name + ' is' : c.length + ' tools are'} flowing into Nomix from ${stores} ${stores === 1 ? 'store' : 'stores'}.`;
      if (p) lead += ` ${p} more ${p === 1 ? 'joins' : 'join'} once ${p === 1 ? 'it’s' : 'they’re'} connected.`;
    }
    return {
      wide: true, back: 'dictionary',
      body: `<div class="head center">${N.title('You’re ready')}<p class="lead">${esc(lead)}</p></div>
        ${N.storeFlow('all', false)}${p ? '<p class="fv-note">Dashed lines fill in as each tool is connected.</p>' : ''}`,
      main: { label: 'Finish setup', act: 'finish' }
    };
  }
  N.acts.finish = () => {
    N.S.phase = 'home'; N.S.finishedAt = Date.now(); N.S.open = null; N.S.store = 'all';
    N.ui.qDraft = ''; N.ui.keepAdding = false; N.ui.openTags = [];
    N.commit('Setup finished');
    N.save(); N.render({ focus: true }); window.scrollTo(0, 0);
  };

  /* ---------- Frame ---------- */
  const SCREENS = {
    welcome, tools, track, dictionary, ready,
    connect: () => Object.assign(N.flowView(), { back: 'tools' })
  };
  N.setup = {
    screen() {
      if (N.S.step === 'connect' && !N.S.flow) N.S.step = 'track';
      return (SCREENS[N.S.step] || welcome)();
    },
    render(app) {
      const sc = this.screen(), i = stepNo(N.S.step);
      app.innerHTML = `<div class="setup${sc.wide ? ' is-wide' : ''}">
        <header class="topbar">${N.logo()}${N.langLink()}
          <div class="progress"><span class="step-label">Step ${i + 1} of ${STEPS.length}</span>
            <span class="straps" aria-hidden="true">${STEPS.map((_, k) => `<span class="${k < i ? 'done' : k === i ? 'now' : ''}"></span>`).join('')}</span></div>
        </header>
        <main class="card glass setup-card" aria-labelledby="screen-title">
          ${sc.back ? `<button type="button" class="back" data-act="go" data-id="${sc.back}">${N.icon('back')}Back</button>` : ''}
          ${sc.body}
          ${N.actions(sc.main, sc.secondary)}
        </main>
      </div>`;
    }
  };
})();
