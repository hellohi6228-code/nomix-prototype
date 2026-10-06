/* Nomix core: state, the shared dictionary, live data, rendering and the pieces setup and home share. */
(function () {
  'use strict';
  const D = window.NOMIX_DATA;
  const N = (window.Nomix = { acts: {}, inputs: {}, changes: {} });
  N.MAP = window.NOMIX_MAP || {};   // each tool's own field names, from map.js
  const KEY = 'nomix.v5';

  /* ---------- State ---------- */
  function fresh() {
    return {
      v: 5,
      phase: 'setup',          // setup | home
      step: 'welcome',         // welcome | tools | connect | track | dictionary | ready
      selected: [],            // tool ids, in the order the owner chose them
      custom: [],              // tools the owner added
      tools: {},               // id -> { status: connected | help, at, stores, note, feed, seq, next }
      flow: null,              // the connect-one-at-a-time session
      questions: [],           // { id, text, need: { catId: [field] } }
      extraKeep: [],           // keywords added by hand
      customCats: [],
      extraFields: {},         // catId -> details the owner added
      extraStreams: {},        // toolId -> things the owner asked to receive
      latest: {},              // catId -> store -> field -> { v, tool, ts }
      hist: {},                // catId -> field -> recent values, newest first
      sales: {},               // store -> today's running totals
      store: 'all',            // which store home is showing
      open: null,
      own: null,               // { provider, at }
      finishedAt: null,
      pick: [],
      versions: []             // { id, at, label, state }: every setup change, newest first
    };
  }
  function freshUI() {
    return { search: '', adding: null, addName: '', addKind: null, keepAdding: false, tag: null, asking: false,
      qDraft: '', streamAdd: null, ownOpen: false, ownPick: null, ownOther: '', resetAsk: false, sheet: null,
      history: false, disconnect: null };
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const s = JSON.parse(raw); if (s && s.v === 5) return Object.assign(fresh(), s); }
    } catch (e) { /* storage unavailable: start fresh */ }
    return fresh();
  }
  N.S = load();
  N.ui = freshUI();
  if (N.S.flow && N.S.flow.phase === 'waiting') N.S.flow.phase = 'intro';
  // While looking at a past version, N.S is that version and N.real holds the live setup.
  N.real = null;
  N.viewing = null;
  N.save = () => {
    const s = N.real || N.S;
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {
      // Browser storage is full: keep the newest versions and try once more.
      if (s.versions && s.versions.length > 5) { s.versions.length = Math.ceil(s.versions.length / 2); try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e2) { /* keep working in memory */ } }
    }
  };
  N.reset = () => { N.S = fresh(); N.real = null; N.viewing = null; N.ui = freshUI(); N.save(); };

  /* ---------- Lookups ---------- */
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = N.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ESC[c]);
  N.allTools = () => D.TOOLS.concat(N.S.custom);
  N.tool = id => D.TOOLS.find(t => t.id === id) || N.S.custom.find(t => t.id === id) || null;
  N.toolName = t => (t.alt ? `${t.name} / ${t.alt}` : t.name);
  N.toolWhat = t => t.label || D.KINDS[t.kind].label;
  N.groupOf = t => t.group || D.KINDS[t.kind].group;
  N.status = id => (N.S.tools[id] && N.S.tools[id].status) || 'later';
  N.connected = () => N.S.selected.filter(id => N.status(id) === 'connected');
  N.streams = id => (D.STREAMS[N.tool(id).kind] || []).slice();
  N.extraStreams = id => N.S.extraStreams[id] || [];
  N.cat = id => D.CATS.find(c => c.id === id) || N.S.customCats.find(c => c.id === id) || null;
  N.extraFields = id => N.S.extraFields[id] || [];
  const cap = N.cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  N.L = s => s;   // language hook: zh.js swaps in the Chinese translator

  N.list = (arr, max) => {
    const a = arr.slice();
    if (!a.length) return '';
    if (max && a.length > max) { const rest = a.length - (max - 1); a.length = max - 1; a.push(`${rest} more`); }
    return a.length === 1 ? a[0] : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
  };

  /* ---------- Company, brands and stores ---------- */
  const STORES = D.COMPANY.brands.flatMap(b => b.stores.map(([id, loc]) => ({ id, loc, brand: b.id, brandName: b.name })));
  const STORE = Object.fromEntries(STORES.map(s => [s.id, s]));
  N.brands = () => D.COMPANY.brands;
  N.brand = bid => D.COMPANY.brands.find(b => b.id === bid);
  N.brandOf = id => (STORE[id] ? STORE[id].brand : null);
  N.storeLoc = id => (STORE[id] ? STORE[id].loc : id);
  N.storeName = id => (STORE[id] ? `${STORE[id].brandName} – ${STORE[id].loc}` : id);
  // "Umiya: all 18 stores · Surfing Crab: Laredo and Brownsville" (long lists become a count)
  N.storeList = ids => D.COMPANY.brands.map(b => {
    const mine = ids.filter(id => N.brandOf(id) === b.id);
    if (!mine.length) return '';
    const what = mine.length === b.stores.length && mine.length > 1 ? `all ${mine.length} stores`
      : mine.length > 3 ? `${mine.length} stores` : N.list(mine.map(N.storeLoc));
    return `${b.name}: ${what}`;
  }).filter(Boolean).join(' · ');
  // What home is showing: 'all', a whole brand ('brand:gl') or one store.
  N.inView = (storeId, view) => !view || view === 'all' || view === storeId || view === 'brand:' + N.brandOf(storeId);
  N.viewName = view => (view.startsWith('brand:') ? N.brand(view.slice(6)).name : N.storeName(view));
  N.storesOf = id => (N.S.tools[id] && N.S.tools[id].stores) || [];
  N.allStores = () => STORES.map(s => s.id).filter(s => N.connected().some(id => N.storesOf(id).includes(s)));
  N.viewStore = () => {
    const v = N.S.store;
    if (N.S.phase !== 'home' || !v || v === 'all') return 'all';
    return N.allStores().some(s => N.inView(s, v)) ? v : 'all';
  };
  // What a sign-in finds. A point-of-sale account covers the open stores of one brand;
  // other tools see every store Nomix knows.
  // every = changing stores on a tool already connected: offer every store no other point of sale runs.
  N.storesFound = (id, every) => {
    const t = N.tool(id), all = STORES.map(s => s.id);
    if (t.kind !== 'pos') {
      if (every) return all;
      const known = N.allStores();
      return known.length ? known : all.filter(s => N.brandOf(s) === D.COMPANY.brands[0].id);
    }
    const claimed = new Set();
    N.connected().forEach(x => { if (x !== id && N.tool(x).kind === 'pos') N.storesOf(x).forEach(s => claimed.add(s)); });
    const free = all.filter(s => !claimed.has(s));
    if (!free.length) return all;
    if (every) return free;
    const b = N.brandOf(free[0]);
    return free.filter(s => N.brandOf(s) === b);
  };

  /* ---------- The dictionary ---------- */
  N.orderKeep = ids => {
    const set = new Set(ids);
    return D.CATS.map(c => c.id).filter(id => set.has(id))
      .concat(N.S.customCats.map(c => c.id).filter(id => set.has(id)));
  };
  N.keepIds = () => N.orderKeep(N.S.questions.flatMap(q => Object.keys(q.need)).concat(N.S.extraKeep));
  N.fieldsOf = id => (N.cat(id).fields || []).slice();
  N.questionsFor = catId => N.S.questions.filter(q => q.need[catId]);
  N.availCats = () => D.CATS.filter(c => N.S.selected.some(id => { const t = N.tool(id); return t && c.kinds.includes(t.kind); })).map(c => c.id);

  // Where a keyword's information comes from right now, for one store or all of them.
  N.sources = (catId, store) => {
    const c = N.cat(catId), on = [], off = [];
    if (!c || c.custom) return { on, off, custom: true };
    N.S.selected.forEach(id => {
      const t = N.tool(id);
      if (!t || !c.kinds.includes(t.kind)) return;
      if (N.status(id) === 'connected') {
        const st = N.storesOf(id).filter(s => N.inView(s, store));
        if (st.length) on.push({ name: t.name, stores: st });
      } else off.push({ name: t.name });
    });
    return { on, off };
  };
  N.flowing = (catId, store) => N.sources(catId, store).on.length > 0;
  N.sourceLine = (catId, store) => {
    const s = N.sources(catId, store);
    if (s.custom) return 'We’ll set this up with you';
    if (s.on.length) return 'From ' + N.list(s.on.map(x => x.name), 3);
    if (s.off.length) return `When ${N.list(s.off.map(x => x.name), 2)} ${s.off.length === 1 ? 'is' : 'are'} connected`;
    return store && store !== 'all' ? `Nothing sends this for ${N.viewName(store)} yet` : 'No tool for this yet';
  };

  // Turn a plain question into the exact details that answer it.
  N.needFor = text => {
    const q = (text || '').trim().toLowerCase();
    const known = D.QUESTIONS.find(x => x.text.toLowerCase() === q);
    if (known) return JSON.parse(JSON.stringify(known.need));
    const has = w => (/[^\x00-\x7f]/.test(w) ? q.includes(w)
      : new RegExp('(^|[^a-z0-9])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(q));
    const need = {};
    const add = (id, fields) => { const a = need[id] || (need[id] = []); fields.forEach(f => { if (!a.includes(f)) a.push(f); }); };
    D.CATS.forEach(c => { if (c.words.some(has)) add(c.id, c.core); });
    D.FIELD_WORDS.forEach(([id, f, ws]) => { if (need[id] && ws.some(has)) add(id, [f]); });
    if (D.BACKUP_WORDS.some(has)) N.availCats().forEach(id => add(id, N.fieldsOf(id)));
    Object.keys(need).forEach(id => { const order = N.fieldsOf(id); need[id].sort((a, b) => order.indexOf(a) - order.indexOf(b)); });
    return need;
  };

  /* ---------- Time ---------- */
  N.rel = ts => {
    const s = Math.max(0, (Date.now() - ts) / 1000);
    if (s < 45) return 'just now';
    const m = Math.round(s / 60);
    if (m < 60) return `${m} min ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h} hr ago`;
    return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };
  N.when = ts => {
    const d = new Date(ts);
    const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return d.toDateString() === new Date().toDateString()
      ? `today at ${time}`
      : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${time}`;
  };
  const clock = ts => new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const dayLabel = ts => new Date(ts).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  N.lastTs = (id, store) => {
    const r = N.S.tools[id];
    if (!r) return 0;
    const ev = (r.feed || []).find(e => N.inView(e.store, store));
    return ev ? ev.ts : r.at || 0;
  };
  N.lastAny = () => N.connected().reduce((m, id) => Math.max(m, N.lastTs(id)), 0);

  /* ---------- What connected tools send ---------- */
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const money = n => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const items = n => `${n} item${n === 1 ? '' : 's'}`;
  function basket(menu) {
    const count = rnd(1, 4), names = [];
    let total = 0, first = null;
    for (let i = 0; i < count; i++) {
      const d = pick(menu || D.DISHES);
      first = first || d;
      total += d[1];
      if (!names.includes(d[0])) names.push(d[0]);
    }
    return { count, total, first, names: names.slice(0, 2).join(', ') + (names.length > 2 ? ` +${names.length - 2}` : '') };
  }
  // Running totals per store for today, so sales and labor read like a real day.
  function dayFor(store, at) {
    const day = new Date(at).toDateString();
    let s = N.S.sales[store];
    if (!s || s.day !== day) s = N.S.sales[store] = { day, gross: rnd(4200, 12800) + rnd(0, 99) / 100, disc: rnd(80, 420), hours: rnd(70, 160), ot: 0 };
    return s;
  }
  const salesVals = (store, s, at) => ({ 'Business day': dayLabel(at), Store: N.storeName(store), 'Gross sales': money(s.gross), Discounts: money(s.disc), 'Net sales': money(s.gross - s.disc), Tax: money(s.gross * 0.0875) });
  const laborVals = (store, s, at) => ({ 'Business day': dayLabel(at), Store: N.storeName(store), 'Hours worked': s.hours.toFixed(1), 'Overtime hours': s.ot.toFixed(1), Wages: money(s.hours * 18.5 + s.ot * 27.75) });
  const person = () => { const p = pick(D.STAFF); return { name: p[0], role: p[1] }; };

  function makeEvent(id, ts) {
    const t = N.tool(id), r = N.S.tools[id], at = ts || Date.now();
    const store = pick(r.stores && r.stores.length ? r.stores : [STORES[0].id]);
    const where = N.storeName(store), menu = D.MENUS[N.brandOf(store)] || D.DISHES;
    r.seq = (r.seq || rnd(1030, 1080)) + 1;
    const n = r.seq, x = Math.random(), time = clock(at), vals = {};
    let title = 'Update received', detail = N.toolWhat(t);
    const order = channel => {
      const b = basket(menu), s = dayFor(store, at), d = b.first;
      s.gross += b.total;
      vals.orders = { 'Order number': '#' + n, 'Time placed': time, Store: where, Channel: channel, Total: money(b.total), Server: t.kind === 'pos' ? person().name : '—' };
      vals.items = { 'Item name': d[0], Quantity: String(rnd(1, 2)), Price: money(d[1]), Options: pick(D.OPTIONS), 'Order number': '#' + n, Store: where };
      vals.menu = { 'Item name': d[0], 'Menu section': d[2], Price: money(d[1]), 'Options and add-ons': pick(D.OPTIONS), Available: 'Yes' };
      if (Math.random() < 0.14) {
        const off = Math.round(b.total * 10) / 100;
        s.disc += off;
        vals.discounts = { 'Promo name': pick(D.PROMOS), Amount: money(off), 'Order number': '#' + n, 'Applied by': pick(D.MANAGERS), Store: where };
      }
      if (Math.random() < 0.3) vals.guests = { 'Guest ID': 'G-' + rnd(10200, 48900), 'First visit': dayLabel(at - rnd(3, 400) * 86400000), Visits: String(rnd(2, 41)), 'Total spent': money(rnd(40, 1900)), 'Loyalty points': String(rnd(10, 900)) };
      vals.sales = salesVals(store, s, at);
      return b;
    };
    const shift = () => {
      const p = person(), out = Math.random() < 0.4, s = dayFor(store, at);
      if (out) { s.hours += rnd(5, 8); if (Math.random() < 0.15) s.ot += 1; }
      vals.staff = { 'Team member': p.name, Role: p.role, 'Clock in': out ? clock(at - rnd(5, 8) * 3600000) : time, 'Clock out': out ? time : 'Still on shift', Breaks: out ? pick(['30 min', '15 min']) : 'None yet', Store: where };
      vals.labor = laborVals(store, s, at);
      vals.team = { Name: p.name, Role: p.role, Store: where, 'Pay rate': money(rnd(17, 24)), 'Start date': dayLabel(at - rnd(30, 900) * 86400000) };
      title = `${p.name} clocked ${out ? 'out' : 'in'}`; detail = p.role;
    };
    switch (t.kind) {
      case 'pos':
        if (x < 0.42) { const b = order(pick(['Dine-in', 'Dine-in', 'Pickup'])); title = `Order #${n}`; detail = `${items(b.count)} · ${b.names} · ${money(b.total)}`; }
        else if (x < 0.6) {
          const amt = basket(menu).total, tip = Math.round(amt * pick([0, 0.15, 0.18, 0.2]) * 100) / 100, how = pick(['Card', 'Card', 'Cash', 'Apple Pay', 'Gift card']);
          vals.payments = { 'Order number': '#' + (n - 1), Amount: money(amt), Tip: money(tip), 'Paid with': how, 'Card brand': how === 'Card' ? pick(['Visa', 'Mastercard', 'Amex']) : '—', 'Time paid': time };
          if (tip) vals.tips = { 'Team member': person().name, 'Card tips': money(tip), 'Cash tips': money(how === 'Cash' ? tip : 0), 'Business day': dayLabel(at), Store: where };
          title = `Payment for #${n - 1}`; detail = `${how} · ${money(amt)}${tip ? ` + ${money(tip)} tip` : ''}`;
        } else if (x < 0.65) {
          const amt = pick(menu)[1], why = pick(D.REASONS), on = n - rnd(2, 9);
          vals.refunds = { 'Order number': '#' + on, 'Amount refunded': money(amt), Reason: why, 'Approved by': pick(D.MANAGERS), Time: time };
          title = `Refund on #${on}`; detail = `${money(amt)} · ${why}`;
        } else if (x < 0.69) {
          const d = pick(menu), why = pick(['Sent wrong', 'Guest complaint', 'Staff meal', 'Rang in twice']);
          vals.voids = { 'Item name': d[0], Amount: money(d[1]), Reason: why, 'Approved by': pick(D.MANAGERS), Store: where, Time: time };
          title = `${d[0]} voided`; detail = why;
        } else if (x < 0.82) {
          const mins = rnd(6, 16), st = pick(D.STATIONS);
          vals.tickets = { 'Ticket number': '#' + n, 'Sent to kitchen': clock(at - mins * 60000), 'Ready at': time, 'Minutes to make': String(mins), Station: st, Store: where };
          title = `Ticket #${n} ready`; detail = `${st} station · ${mins} min`;
        } else if (x < 0.91) shift();
        else if (x < 0.95) {
          const amt = pick([25, 50, 100]), used = Math.random() < 0.5;
          vals.giftcards = { Card: '•••• ' + rnd(1000, 9999), Activity: used ? 'Used' : 'Sold', Amount: money(amt), Balance: money(used ? rnd(0, 60) : amt), Time: time };
          title = `Gift card ${used ? 'used' : 'sold'}`; detail = money(amt);
        } else if (x < 0.98) {
          const exp = rnd(300, 1400), diff = pick([0, 0, 0, -5, 2.5, -12]);
          vals.cash = { Drawer: pick(['Front 1', 'Front 2', 'Bar']), 'Opening cash': money(200), 'Expected cash': money(exp), 'Counted cash': money(exp + diff), 'Over or short': money(diff), Store: where };
          title = 'Drawer closed'; detail = diff ? `${diff > 0 ? 'Over' : 'Short'} ${money(Math.abs(diff))}` : 'Balanced';
        } else {
          const d = pick(menu);
          vals.menu = { 'Item name': d[0], 'Menu section': d[2], Price: money(d[1]), 'Options and add-ons': '—', Available: 'No' };
          title = `${d[0]} sold out`; detail = d[2];
        }
        break;
      case 'delivery':
        if (x < 0.74) { const b = order(`Delivery · ${t.name}`); title = `Delivery order #${n}`; detail = `${items(b.count)} · ${b.names} · ${money(b.total)}`; }
        else if (x < 0.82) {
          const d = pick(menu), why = pick(['Item was missing', 'Wrong item', 'Order arrived late']);
          vals.apperrors = { App: t.name, 'Order number': '#' + (n - rnd(1, 6)), 'Item name': d[0], 'Error charge': money(d[1]), Reason: why, Store: where };
          vals.refunds = { 'Order number': '#' + (n - rnd(1, 6)), 'Amount refunded': money(d[1]), Reason: why, 'Approved by': t.name, Time: time };
          title = 'Charge for a missing item'; detail = `${d[0]} · ${money(d[1])}`;
        } else if (x < 0.9) {
          const c = pick(D.COMMENTS);
          vals.ratings = { App: t.name, Rating: String(c[0]), Comment: c[1], 'Order number': '#' + (n - rnd(1, 9)), Date: dayLabel(at) };
          title = `${c[0]}-star rating`; detail = c[1];
        } else if (x < 0.95) {
          const mins = rnd(8, 45);
          vals.downtime = { App: t.name, Store: where, 'Paused from': clock(at - mins * 60000), 'Paused until': time, 'Minutes offline': String(mins) };
          title = 'Store was paused'; detail = `${mins} min offline`;
        } else {
          const sales = rnd(1800, 6400), com = sales * 0.25, fees = rnd(20, 90), mkt = rnd(0, 150);
          vals.payouts = { App: t.name, 'Payout date': dayLabel(at), Sales: money(sales), Commission: money(com), Fees: money(fees), 'Marketing spend': money(mkt), 'Net payout': money(sales - com - fees - mkt) };
          title = 'Payout sent'; detail = money(sales - com - fees - mkt);
        }
        break;
      case 'online': {
        const b = order(`Pickup · ${t.name}`);
        vals.payments = { 'Order number': '#' + n, Amount: money(b.total), Tip: money(0), 'Paid with': 'Card', 'Card brand': pick(['Visa', 'Mastercard']), 'Time paid': time };
        title = `Pickup order #${n}`; detail = `${items(b.count)} · ${money(b.total)} · ready at ${clock(at + rnd(12, 25) * 60000)}`;
        break;
      }
      case 'hub': { const app = pick(['DoorDash', 'Uber Eats', 'Grubhub']), b = order(`Delivery · ${app}`); title = `Order from ${app}`; detail = `#${n} · ${items(b.count)} · ${money(b.total)}`; break; }
      case 'deals': {
        if (x < 0.85) {
          const deal = pick(D.DEALS), price = rnd(18, 68), s = dayFor(store, at);
          s.gross += price;
          vals.orders = { 'Order number': '#' + n, 'Time placed': time, Store: where, Channel: `Voucher · ${t.name}`, Total: money(price), Server: '—' };
          vals.sales = salesVals(store, s, at);
          title = 'Voucher used'; detail = `${deal} · ${money(price)}`;
        } else {
          const c = pick(D.COMMENTS);
          vals.ratings = { App: t.name, Rating: String(c[0]), Comment: c[1], 'Order number': '#' + n, Date: dayLabel(at) };
          title = `${c[0]}-star review`; detail = c[1];
        }
        break;
      }
      case 'schedule':
        if (x < 0.6) shift();
        else {
          const p = person(), start = rnd(7, 17);
          vals.schedules = { 'Team member': p.name, Role: p.role, 'Shift start': `${start > 12 ? start - 12 : start}:00 ${start >= 12 ? 'PM' : 'AM'}`, 'Shift end': `${(start + 6) > 12 ? start - 6 : start + 6}:00 ${start + 6 >= 12 ? 'PM' : 'AM'}`, Store: where };
          title = 'Shift scheduled'; detail = `${p.name} · ${p.role}`;
        }
        break;
      case 'backoffice': {
        const it = pick(D.STOCK);
        if (x < 0.35) {
          const qty = rnd(2, 40);
          vals.inventory = { Item: it[0], 'Amount on hand': String(qty), Unit: it[1], Store: where, 'Counted on': dayLabel(at) };
          title = 'Inventory count saved'; detail = `${it[0]} · ${qty} ${it[1]}`;
        } else if (x < 0.65) {
          const qty = rnd(2, 20), cost = rnd(8, 60) + 0.5;
          vals.invoices = { Supplier: it[2], 'Invoice number': 'INV-' + rnd(20000, 89999), Item: it[0], Quantity: String(qty), 'Unit cost': money(cost), Total: money(qty * cost), Date: dayLabel(at) };
          title = `Invoice from ${it[2]}`; detail = `${it[0]} · ${money(qty * cost)}`;
        } else if (x < 0.82) {
          const rc = pick(D.RECIPES);
          vals.recipes = { 'Menu item': rc[0], Ingredient: rc[1], 'Amount per plate': rc[2], 'Ingredient cost': money(rc[3]), 'Plate cost': money(rc[3] * 2.6) };
          title = 'Recipe cost updated'; detail = `${rc[0]} · ${money(rc[3] * 2.6)} a plate`;
        } else {
          const why = pick(D.WASTE_REASONS), amt = rnd(1, 6);
          vals.waste = { Item: it[0], Amount: `${amt} ${it[1]}`, Reason: why, Store: where, Date: dayLabel(at) };
          title = 'Waste logged'; detail = `${it[0]} · ${why}`;
        }
        break;
      }
      case 'camera':
        if (x < 0.7) {
          const k = rnd(1, 8), m = rnd(1, 9), shelf = rnd(0, 6);
          vals.lines = { 'People in line': String(k), 'Wait at pickup': String(m), 'Orders on the shelf': String(shelf), Store: where, Time: time };
          title = 'Line and pickup shelf'; detail = `${k} in line · longest wait ${m} min`;
        } else {
          const ppl = rnd(12, 70);
          vals.traffic = { Store: where, Hour: clock(at - (at % 3600000)), 'People who came in': String(ppl) };
          title = 'Foot traffic'; detail = `${ppl} people this hour`;
        }
        break;
      case 'sensor': {
        const f = pick(D.FRIDGES), v = rnd(f[1], f[2]);
        vals.temps = { 'Fridge or freezer': f[0], Temperature: `${v}°F`, 'Time checked': time, 'Safe range': f[3], 'Inside the safe range': 'Yes', Store: where };
        title = f[0]; detail = `${v}°F · in the safe range`;
        break;
      }
    }
    return { ts: at, store, title, detail: `${detail} · ${where}`, vals };
  }
  // Every value lands in the shared dictionary, filed under its tag, detail and store.
  const HIST = 12;
  function record(id, ev) {
    Object.keys(ev.vals).forEach(cat => {
      const byStore = (N.S.latest[cat] = N.S.latest[cat] || {});
      const row = (byStore[ev.store] = byStore[ev.store] || {});
      const h = (N.S.hist[cat] = N.S.hist[cat] || {});
      Object.keys(ev.vals[cat]).forEach(f => {
        const e = { v: ev.vals[cat][f], tool: id, store: ev.store, ts: ev.ts };
        row[f] = { v: e.v, tool: id, ts: e.ts };
        const list = (h[f] = h[f] || []);
        list.unshift(e);
        if (list.length > HIST) list.length = HIST;
      });
    });
  }
  N.fieldNow = (cat, field, store) => {
    const m = N.S.latest[cat];
    if (!m) return null;
    let best = null;
    Object.keys(m).filter(s => N.inView(s, store)).forEach(s => {
      const e = m[s] && m[s][field];
      if (e && N.tool(e.tool) && (!best || e.ts > best.ts)) best = Object.assign({ store: s }, e);
    });
    return best;
  };
  // The most recent values of one detail, newest first.
  N.histFor = (cat, field, store, max) => (((N.S.hist[cat] || {})[field]) || [])
    .filter(e => N.tool(e.tool) && N.inView(e.store, store)).slice(0, max || 5);
  N.typeOf = (cat, field) => { const c = N.cat(cat); return (c && c.types && c.types[field]) || 'Text'; };
  N.seedFeed = id => {
    const r = N.S.tools[id], now = Date.now();
    r.feed = [];
    for (let k = 14; k > 0; k--) {
      const ev = makeEvent(id, now - k * rnd(40, 70) * 1000);
      record(id, ev);
      r.feed.unshift(ev);
    }
    r.feed.length = Math.min(r.feed.length, 12);
    r.next = now + rnd(5, 12) * 1000;
  };
  N.tick = () => {
    if (N.viewing) { N.paint(); return; }   // a past version stays as it was
    const now = Date.now();
    let changed = false;
    N.connected().forEach(id => {
      const r = N.S.tools[id];
      if (!r.feed) { N.seedFeed(id); changed = true; }
      if (!r.next || r.next < now - 120000) r.next = now + rnd(4, 12) * 1000;
      if (now >= r.next) {
        const ev = makeEvent(id);
        record(id, ev);
        r.feed.unshift(ev);
        if (r.feed.length > 12) r.feed.length = 12;
        r.next = now + rnd(8, 22) * 1000;
        changed = true;
        if (N.onEvent) N.onEvent(id, ev);
      }
    });
    if (changed) N.save();
    N.paint();
  };

  /* ---------- Live painting ---------- */
  // Why a detail has no value yet, in plain words.
  N.waitingText = (cat, store) => (N.flowing(cat, store) ? 'Waiting for the next one' : N.sourceLine(cat, store));
  N.paintFields = () => {
    const store = N.viewStore();
    document.querySelectorAll('[data-fvc]').forEach(el => {
      const [cat, field] = el.dataset.fvc.split('|');
      const e = N.fieldNow(cat, field, store);
      const v = N.L(e ? e.v : '—'), s = N.L(e ? `${N.tool(e.tool).name} · ${N.storeName(e.store)} · ${N.rel(e.ts)}` : N.waitingText(cat, store));
      const val = el.querySelector('.fvc-v'), src = el.querySelector('.fvc-s');
      if (val.textContent !== v) {
        if (val.textContent && e) { el.classList.remove('fresh'); void el.offsetWidth; el.classList.add('fresh'); }
        val.textContent = v;
      }
      if (src.textContent !== s) src.textContent = s;
    });
    if (N.paintHistory) N.paintHistory();
  };
  N.paint = () => {
    document.querySelectorAll('[data-ts]').forEach(el => {
      const ts = +el.dataset.ts;
      if (!ts) return;
      let txt = N.rel(ts);
      if ('cap' in el.dataset) txt = cap(txt);
      txt = N.L((el.dataset.pre || '') + txt);
      if (el.textContent !== txt) el.textContent = txt;
    });
    N.paintFields();
  };

  /* ---------- Pieces ---------- */
  const I = {
    check: '<path d="M5 12.5l4.2 4.2L19 7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    chev: '<path d="M6 9l6 6 6-6"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>',
    ask: '<path d="M5 18.5V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H8.5z"/>',
    sensor: '<path d="M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0z"/><path d="M12 9v7"/>',
    camera: '<path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13.5" r="3.5"/>',
    kitchen: '<path d="M5 10h14v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/><path d="M3 10h18M9.5 6.5c0-1 1-1.5 1-2.5M13.5 6.5c0-1 1-1.5 1-2.5"/>',
    robot: '<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 4v4M9.5 13h.01M14.5 13h.01M9.5 16h5"/>'
  };
  N.icon = (name, cls) => `<svg${cls ? ` class="${cls}"` : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[name]}</svg>`;
  N.knot = () => '<svg viewBox="0 0 40 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="12" r="5.5"/><circle cx="32" cy="12" r="5.5"/><path d="M13.5 12h13"/></svg>';
  N.logo = () => `<span class="brand">${N.knot()}<span class="word">Nomix</span></span>`;
  // Switch between the English and Chinese pages; both share the same saved setup.
  N.langLink = () => (window.NOMIX_LANG === 'zh'
    ? '<a class="lang-link" href="index.html" lang="en">English</a>'
    : '<a class="lang-link" href="zh.html" lang="zh-CN">中文</a>');
  N.title = text => `<h1 class="title" id="screen-title" tabindex="-1" data-focus>${esc(text)}</h1>`;
  // A tool's badge: the vendor's own logo, a plain icon for in-store devices, or its first letter.
  N.mono = t => {
    const file = !t.custom && D.LOGOS[t.id];
    if (file) return `<span class="mono logo" aria-hidden="true"><img src="logos/${file}" alt="" decoding="async"></span>`;
    const g = t.custom ? 'custom' : N.groupOf(t);
    if (!t.custom && I[t.kind]) return `<span class="mono g-${g}" aria-hidden="true">${N.icon(t.kind)}</span>`;
    const ch = Array.from(t.name.trim())[0] || '?';
    return `<span class="mono g-${g}" aria-hidden="true">${esc(ch.toUpperCase())}</span>`;
  };
  N.feedItem = (ev, isNew) => `<li${isNew ? ' class="is-new"' : ''}><span class="f-title">${esc(ev.title)}</span><span class="f-time" data-ts="${ev.ts}">${N.rel(ev.ts)}</span><span class="f-detail">${esc(ev.detail)}</span></li>`;

  N.actions = (main, sec) => `<div class="actions">
    ${main ? `<button type="button" class="btn-main" id="main-btn" data-act="${main.act || ''}"${main.id ? ` data-id="${esc(main.id)}"` : ''}${main.disabled ? ' disabled' : ''}>${main.busy ? '<span class="spin" aria-hidden="true"></span>' : ''}<span class="btn-label">${esc(main.label)}</span></button>` : ''}
    ${sec ? `<button type="button" class="btn-quiet" data-act="${sec.act}">${esc(sec.label)}</button>` : ''}
  </div>`;

  // Keep the one main button's words true after small changes, without redrawing the screen.
  N.currentScreen = () => (N.S.phase === 'setup' ? N.setup.screen() : N.home.sheetScreen());
  N.refreshMain = () => {
    const btn = document.getElementById('main-btn');
    const sc = btn && N.currentScreen();
    if (!sc || !sc.main) return;
    btn.querySelector('.btn-label').textContent = N.L(sc.main.label);
    btn.disabled = !!sc.main.disabled;
    btn.dataset.act = sc.main.act || '';
    if (sc.main.id) btn.dataset.id = sc.main.id; else delete btn.dataset.id;
  };

  /* ---------- Questions: plain words → tags → details ---------- */
  // What the question in the box will track, shown inside the box as you type.
  N.qPreview = () => {
    const text = N.ui.qDraft.trim();
    if (!text) return '';
    const need = N.needFor(text), cats = N.orderKeep(Object.keys(need));
    if (!cats.length) return '<p class="qbox-none">Nomix will go over this one with you and set up the details.</p>';
    return `<span class="lbl">Nomix will track</span><ul class="qtags">${cats.map(id =>
      `<li><span class="qtag-name">${esc(N.cat(id).name)}</span><span class="qtag-fields">${esc(need[id].join(' · '))}</span></li>`).join('')}</ul>`;
  };
  N.qBox = () => `<div class="qbox">
      <textarea id="q-text" class="qbox-input" rows="2" data-input="q" data-enter="q-add-typed" aria-label="Your prompt" placeholder="Write it in your own words, like “What sold best last weekend?”">${esc(N.ui.qDraft)}</textarea>
      <div id="q-preview" class="qbox-tags" aria-live="polite">${N.qPreview()}</div>
    </div>`;
  N.qExamples = () => {
    const asked = new Set(N.S.questions.map(q => q.text.toLowerCase()));
    const rest = D.QUESTIONS.filter(x => !asked.has(x.text.toLowerCase()));
    return rest.length ? `<div class="examples"><span class="lbl">Try one</span><div class="chips">${rest.map(x =>
      `<button type="button" class="chip" data-act="q-try" data-text="${esc(x.text)}">${esc(x.text)}</button>`).join('')}</div></div>` : '';
  };
  N.qRows = () => `<ul class="qrows">${N.S.questions.map(q => `<li id="q-${esc(q.id)}"><span class="q-t">${esc(q.text)}</span>
      <span class="q-k">${esc(N.list(N.orderKeep(Object.keys(q.need)).map(id => N.cat(id).name)) || 'Nomix will go over this one with you')}</span>
      <button type="button" class="x edit-only" data-act="q-remove" data-id="${esc(q.id)}" aria-label="Remove this prompt">${N.icon('x')}</button></li>`).join('')}</ul>`;
  N.addQuestion = text => {
    const clean = text.trim().replace(/\s+/g, ' ');
    if (!clean) return null;
    const exists = N.S.questions.find(q => q.text.toLowerCase().replace(/[?？]$/, '') === clean.toLowerCase().replace(/[?？]$/, ''));
    if (exists) return exists;
    const q = { id: 'q' + Date.now().toString(36) + N.S.questions.length, text: cap(clean), need: N.needFor(clean) };
    N.S.questions.unshift(q);
    return q;
  };
  N.suggestQuestions = () => {
    const kinds = new Set(N.S.selected.map(id => N.tool(id).kind));
    const fit = D.QUESTIONS.filter(x => x.kinds.some(k => kinds.has(k)));
    (fit.length ? fit.slice(0, 3) : D.QUESTIONS.slice(0, 2)).reverse().forEach(x => N.addQuestion(x.text));
  };
  N.inputs.q = v => {
    N.ui.qDraft = v;
    const box = document.getElementById('q-preview');
    if (box) box.innerHTML = N.qPreview();
    const add = document.getElementById('q-add-btn');
    if (add) add.disabled = !v.trim();
    N.refreshMain();
  };

  // A tag in the data dictionary, folded to one line. Tapping it opens the details.
  N.tagOpen = id => (N.ui.openTags || []).includes(id);
  N.tagHead = (id, store, h) => {
    const c = N.cat(id), n = c.fields.length + N.extraFields(id).length;
    const dot = N.flowing(id, store) ? 'ok' : c.custom ? 'help' : '';
    return `<div class="tg-head">
      <${h} class="tg-h"><button type="button" class="tg-toggle" id="tg-${esc(id)}" data-act="tag-open" data-id="${esc(id)}" aria-expanded="${N.tagOpen(id)}">
        <span class="tg-text"><span class="tg-name">${esc(c.name)}</span>
          <span class="tg-sum status"><span class="dot ${dot}"></span><span>${n} ${n === 1 ? 'field' : 'fields'} · ${esc(N.sourceLine(id, store))}</span></span></span>
        ${N.icon('chev', 'chev')}</button></${h}>
      <button type="button" class="x edit-only" data-act="keep-remove" data-id="${esc(id)}" aria-label="Remove the ${esc(c.name)} tag">${N.icon('x')}</button>
    </div>`;
  };
  N.acts['tag-open'] = (d, el) => {
    const list = N.ui.openTags || (N.ui.openTags = []), i = list.indexOf(d.id);
    if (i >= 0) list.splice(i, 1); else list.push(d.id);
    N.render({ refocus: el.id, keepScroll: true });
  };

  N.keepPanel = () => {
    const keep = N.keepIds(), rest = D.CATS.filter(c => !keep.includes(c.id));
    return `<div class="addpanel">
      ${rest.length ? `<span class="lbl">Tap to add a tag</span><div class="chips">${rest.map(c => `<button type="button" class="chip" data-act="keep-add" data-id="${c.id}">${N.icon('plus')}${esc(c.name)}</button>`).join('')}</div>` : ''}
      <label class="lbl" for="keep-custom">Your own tag</label>
      <div class="inline-add">
        <input id="keep-custom" class="text-input" autocomplete="off" placeholder="Like “catering orders”" data-input="enable-next" data-enter="keep-custom">
        <button type="button" class="btn-soft" data-act="keep-custom" disabled>Add</button>
      </div>
      <button type="button" class="link-quiet" data-act="keep-add-close">Done adding</button>
    </div>`;
  };
  const addTo = (map, id, v) => { (map[id] = map[id] || []).push(v); };
  Object.assign(N.acts, {
    // "Try one" puts the question and what it tracks into the box; the owner adds it from there.
    'q-try': d => {
      const ta = document.getElementById('q-text');
      if (ta) { ta.value = d.text; ta.focus(); ta.setSelectionRange(d.text.length, d.text.length); }
      N.inputs.q(d.text);
    },
    'q-add-typed': () => {
      const el = document.getElementById('q-text'), q = N.addQuestion(el ? el.value : N.ui.qDraft);
      if (!q) { if (el) el.focus(); return; }
      const home = N.S.phase === 'home';
      N.ui.qDraft = '';
      if (home) { N.ui.asking = false; N.commit(`Added prompt “${q.text}”`); }
      N.save(); N.render({ refocus: home ? 'ask-open' : 'q-text', keepScroll: true });
      N.toast('Prompt added');
    },
    'q-remove': d => {
      const q = N.S.questions.find(x => x.id === d.id);
      N.S.questions = N.S.questions.filter(x => x.id !== d.id);
      if (q) N.commit(`Removed prompt “${q.text}”`);
      N.save(); N.render({ keepScroll: true });
    },
    'q-suggest': () => { N.suggestQuestions(); N.save(); N.render({ keepScroll: true }); },
    'keep-add-open': () => { N.ui.keepAdding = true; N.ui.tag = null; N.ui.asking = false; N.render({ refocus: 'keep-custom', keepScroll: true }); },
    'keep-add-close': () => { N.ui.keepAdding = false; N.render({ keepScroll: true }); },
    'keep-add': d => {
      if (!N.S.extraKeep.includes(d.id)) N.S.extraKeep.push(d.id);
      N.commit(`Added tag ${N.cat(d.id).name}`);
      N.save(); N.render({ keepScroll: true }); N.toast(`${N.cat(d.id).name} added`);
    },
    'keep-custom': () => {
      const el = document.getElementById('keep-custom'), name = el ? el.value.trim() : '';
      if (!name) { if (el) el.focus(); return; }
      let c = D.CATS.concat(N.S.customCats).find(x => x.name.toLowerCase() === name.toLowerCase());
      if (!c) {
        c = { id: 'k' + Date.now().toString(36), name: cap(name), about: 'Added by you. Nomix will go over the details with you.', fields: [], custom: true };
        N.S.customCats.push(c);
      }
      if (!N.S.extraKeep.includes(c.id)) N.S.extraKeep.push(c.id);
      N.commit(`Added tag ${c.name}`);
      N.save(); N.render({ refocus: 'keep-custom', keepScroll: true }); N.toast(`${c.name} added`);
    },
    // Stop keeping a tag everywhere, including in the questions that used it.
    'keep-remove': d => {
      N.S.extraKeep = N.S.extraKeep.filter(x => x !== d.id);
      N.S.questions.forEach(q => { delete q.need[d.id]; });
      if (N.ui.tag === d.id) N.ui.tag = null;
      N.commit(`Removed tag ${N.cat(d.id).name}`);
      N.save(); N.render({ keepScroll: true });
    },
    'field-add': d => {
      const el = document.getElementById('field-new-' + d.id), v = el ? el.value.trim() : '';
      if (!v) return;
      addTo(N.S.extraFields, d.id, v);
      N.commit(`Added ${v} to ${N.cat(d.id).name}`);
      N.save(); N.render({ refocus: 'field-new-' + d.id, keepScroll: true });
      N.toast(`${v} added to ${N.cat(d.id).name}`);
    },
    'field-remove': d => {
      const list = N.S.extraFields[d.id] || [], gone = list.splice(+d.k, 1)[0];
      if (gone) N.commit(`Removed ${gone} from ${N.cat(d.id).name}`);
      N.save(); N.render({ refocus: 'field-new-' + d.id, keepScroll: true });
    }
  });
  N.addTo = addTo;

  /* ---------- History: every setup change is a version to look at or go back to ---------- */
  const SETUP = ['selected', 'custom', 'tools', 'questions', 'extraKeep', 'customCats', 'extraFields', 'extraStreams', 'own'];
  const copy = o => JSON.parse(JSON.stringify(o));
  N.whenShort = ts => {
    const d = new Date(ts), t = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
    return d.toDateString() === new Date().toDateString() ? `Today ${t}` : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${t}`;
  };
  // Save the setup, plus the data as it stood, under a plain label.
  N.commit = label => {
    if (N.S.phase !== 'home' || N.viewing) return;
    const state = {};
    SETUP.forEach(k => { state[k] = copy(N.S[k]); });
    Object.keys(state.tools).forEach(id => { const r = state.tools[id]; if (r.feed) r.feed = r.feed.slice(0, 6); delete r.next; });
    // The data as it stood: the last five values of each detail in the tags being kept.
    state.hist = {};
    N.keepIds().forEach(cat => {
      const h = N.S.hist[cat];
      if (h) state.hist[cat] = Object.fromEntries(Object.keys(h).map(f => [f, h[f].slice(0, 5)]));
    });
    N.S.versions.unshift({ id: 'v' + Date.now().toString(36) + N.S.versions.length, at: Date.now(), label, state });
    if (N.S.versions.length > 40) N.S.versions.length = 40;
    N.save();
  };
  N.viewVersion = id => {
    const real = N.real || N.S, v = real.versions.find(x => x.id === id);
    if (!v) return;
    N.real = real;
    N.S = Object.assign(fresh(), copy(v.state), { phase: 'home', store: 'all', versions: real.versions, finishedAt: real.finishedAt, latest: {} });
    N.viewing = { id: v.id, at: v.at, label: v.label, confirm: false };
    Object.assign(N.ui, { tag: null, keepAdding: false, asking: false, disconnect: null, streamAdd: null, history: false });
    N.render({ focus: true }); window.scrollTo(0, 0);
  };
  N.exitView = () => {
    if (!N.real) return;
    N.S = N.real; N.real = null; N.viewing = null;
    N.render({ focus: true }); window.scrollTo(0, 0);
  };
  // Bring back that version's connections and dictionary. Data kept since then stays.
  N.restoreVersion = () => {
    const real = N.real, v = real && real.versions.find(x => x.id === N.viewing.id);
    if (!v) return;
    N.S = real; N.real = null; N.viewing = null;
    SETUP.forEach(k => { real[k] = copy(v.state[k]); });   // connections and dictionary only; data kept since then stays
    Object.keys(real.tools).forEach(id => { real.tools[id].next = 0; });
    real.store = 'all'; real.open = null; real.flow = null;
    N.commit(`Went back to ${N.whenShort(v.at)}`);
    N.render({ focus: true }); window.scrollTo(0, 0);
    N.toast(`Back to the setup from ${N.whenShort(v.at)}`);
  };
  N.VIEW_ACTS = ['toggle-open', 'field-open', 'tag-open', 'store', 'history-toggle', 'history-view', 'view-exit', 'view-restore', 'view-restore-confirm', 'view-restore-cancel'];

  /* ---------- Rendering ---------- */
  N.go = step => { N.S.step = step; N.save(); N.render({ focus: true }); window.scrollTo(0, 0); };
  N.render = (o = {}) => {
    const app = document.getElementById('app');
    if (N.S.phase === 'setup') N.setup.render(app); else N.home.render(app);
    N.renderSheet();
    N.paint();
    if (N.afterRender) N.afterRender();
    if (o.refocus) {
      const el = document.getElementById(o.refocus);
      if (el) el.focus({ preventScroll: !!o.keepScroll });
    } else if (o.focus) {
      const h = document.querySelector('.sheet [data-focus]') || document.querySelector('[data-focus]');
      if (h) h.focus({ preventScroll: true });
    }
  };
  N.renderSheet = () => {
    const root = document.getElementById('sheet-root');
    const sc = N.S.phase === 'home' ? N.home.sheetScreen() : null;
    if (!sc) {
      if (root.innerHTML) root.innerHTML = '';
      document.body.classList.remove('locked');
      return;
    }
    root.innerHTML = `<div class="sheet-wrap"><div class="sheet glass${sc.wide ? ' is-wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="screen-title">
      <button type="button" class="x sheet-x" data-act="sheet-close" aria-label="Close">${N.icon('x')}</button>
      ${sc.body}${N.actions(sc.main, sc.secondary)}</div></div>`;
    document.body.classList.add('locked');
  };

  let toastTimer;
  N.toast = msg => {
    const el = document.getElementById('toast');
    if (!el) return;
    el.innerHTML = N.icon('check') + `<span>${esc(N.L(msg))}</span>`;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  };

  /* ---------- Wiring ---------- */
  N.start = () => {
    document.addEventListener('click', e => {
      const el = e.target.closest('[data-act]');
      if (!el || el.disabled || !el.dataset.act) return;
      if (N.viewing && !N.VIEW_ACTS.includes(el.dataset.act)) return;   // a past version is read-only
      const fn = N.acts[el.dataset.act];
      if (!fn) return;
      e.preventDefault();
      fn(el.dataset, el, e);
    });
    document.addEventListener('input', e => {
      const el = e.target, k = el.dataset && el.dataset.input;
      if (!k) return;
      if (k === 'enable-next') { const b = el.nextElementSibling; if (b) b.disabled = !el.value.trim(); return; }
      if (N.inputs[k]) N.inputs[k](el.value, el);
    });
    document.addEventListener('change', e => {
      const el = e.target, k = el.dataset && el.dataset.change;
      if (k && N.changes[k]) N.changes[k](el);
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && document.querySelector('.sheet')) { N.acts['sheet-close'](); return; }
      const el = e.target;
      if (e.key === 'Enter' && !e.shiftKey && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.dataset.enter) {
        e.preventDefault();
        const fn = N.acts[el.dataset.enter];
        if (fn) fn(el.dataset, el, e);
      }
    });
    window.addEventListener('resize', () => { if (N.afterRender) N.afterRender(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (N.afterRender) N.afterRender(); });
    N.render();
    setInterval(N.tick, 1000);
  };
})();
