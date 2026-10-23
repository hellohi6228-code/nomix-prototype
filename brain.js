/* Nomix brain: the rules behind the apps. One place decides what goes on the board, what the
   dashboard shows and what the chat's tools answer, so all three always agree.
   It reads a source (demo: sim.js; the service: the data dictionary) and never guesses: a rule only
   speaks when its data is connected, fresh and clearly past a line that matters. */
(function (root) {
  'use strict';
  const MIN = 60000, HOUR = 60 * MIN, DAY = 24 * HOUR;
  const BASELINE = 4;                 // same weekdays the usual is averaged over
  const HISTORY_DAYS = 56;            // how far back the data goes

  // The lines a rule must clearly pass before it speaks. Each one leaves room for normal noise.
  const LINE = {
    warmMinutes: 30, warmReadings: 3,   // a fridge out of range for half an hour, not a door left open
    lateMinutes: 15,                    // someone a quarter hour past the start of their shift
    pausedMinutes: 10,                  // a store paused on an app for more than a few minutes
    overtimeHours: 40
  };

  function create(src) {
    const S = {};
    const stores = () => src.stores();
    const store = id => stores().find(s => s.id === id);
    const inView = (s, view) => !view || view === 'all' || view === s.id || view === 'brand:' + s.brand
      || (view.startsWith('set:') && view.slice(4).split(',').includes(s.id));
    const storesIn = view => stores().filter(s => inView(s, view));
    const name = s => `${s.brandName} – ${s.loc}`;
    const clock = (ts, tz) => new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz });
    const hm = (ts, tz) => new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz });
    const dollars = c => Math.round(c) / 100;
    const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    /* ---------- Sales today and the usual for this time ---------- */
    // Today so far at a store, and what the same weekdays usually had rung up by this minute.
    // Worked out once a minute per store; the board, dashboard and tools all ask for it.
    const memo = {};
    function today(id) {
      const k = id + '|' + Math.floor(src.now() / MIN);
      if (!memo[k]) {
        if (Object.keys(memo).length > 500) Object.keys(memo).forEach(x => { delete memo[x]; });
        memo[k] = todayNow(id);
      }
      return memo[k];
    }
    function todayNow(id) {
      const s = store(id), now = src.now(), L = src.local(now, s.tz), [open, close] = src.openHours(L.dow);
      const upto = (key, h) => (h < L.hour ? 1 : h === L.hour ? L.minute / 60 : 0);
      const hours = [];
      let net = 0, orders = 0, usualNet = 0, usualOrders = 0;
      for (let h = open; h < close; h++) {
        const t = src.hourTotal(id, L.day, h, upto(L.day, h));
        let un = 0, uo = 0, full = 0;
        for (let w = 1; w <= BASELINE; w++) {
          const key = src.dayShift(L.day, -7 * w), u = src.hourTotal(id, key, h, upto(key, h)), f = src.hourTotal(id, key, h, 1);
          un += u.net; uo += u.orders; full += f.net;
        }
        net += t.net; orders += t.orders; usualNet += un / BASELINE; usualOrders += uo / BASELINE;
        hours.push({ h, net: t.net, usual: Math.round(full / BASELINE), now: h === L.hour, done: h < L.hour });
      }
      return { L, open: L.hour >= open && L.hour < close, opensAt: open, closesAt: close, net, orders,
        usualNet: Math.round(usualNet), usualOrders: Math.round(usualOrders), usualDays: BASELINE, hours, weekday: WEEKDAY[L.dow] };
    }
    function laborSoFar(list, now) {
      return list.reduce((sum, x) => x.in ? sum + Math.max(0, Math.min(x.out || now, now) - x.in) / HOUR * x.rate : sum, 0);
    }

    /* ---------- The board ---------- */
    // Each rule returns items only when its data is connected and the line is clearly crossed.
    const RULES = [
      { id: 'warm', level: 'now', tag: 'temps', rank: 0, run(s, now) {
        return src.temps(s.id).flatMap(u => {
          const rs = u.readings.filter(r => r.ts <= now);
          if (!rs.length) return [];
          const out = r => r.f > u.hi || r.f < u.lo;
          let k = rs.length - 1;
          if (!out(rs[k]) || now - rs[k].ts > 20 * MIN) return [];       // fine now, or no recent reading to go on
          while (k > 0 && out(rs[k - 1])) k--;
          const streak = rs.slice(k), mins = Math.round((now - streak[0].ts) / MIN), latest = rs[rs.length - 1];
          if (streak.length < LINE.warmReadings || mins < LINE.warmMinutes) return [];
          const high = latest.f > u.hi;
          return [{ unit: u.unit, title: `${u.unit} is at ${latest.f}°F`, detail: `${high ? 'Above' : 'Below'} ${high ? u.hi : u.lo}°F for ${mins} min`,
            evidence: streak.slice(-6).map(r => `${clock(r.ts, s.tz)} · ${r.f}°F`) }];
        });
      } },
      { id: 'paused', level: 'now', tag: 'apps', rank: 1, run(s, now) {
        return src.apps(s.id).filter(a => a.paused && now - a.since >= LINE.pausedMinutes * MIN).map(a => ({
          title: `Paused on ${src.appName(a.app)}`, detail: `Since ${clock(a.since, s.tz)} · ${Math.round((now - a.since) / MIN)} min` }));
      } },
      { id: 'late', level: 'now', tag: 'staff', rank: 2, run(s, now) {
        return src.shifts(s.id).filter(x => !x.in && x.start <= now - LINE.lateMinutes * MIN && x.end > now).map(x => ({
          title: `${x.who} hasn’t clocked in`, detail: `${x.role} · shift started ${clock(x.start, s.tz)}` }));
      } },
      { id: 'short', level: 'today', tag: 'stock', rank: 3, run(s, now) {
        const t = today(s.id);
        if (!t.open) return [];
        return src.stock(s.id).filter(x => x.countedAt && x.countedAt >= t.L.midnight && x.onHand < x.restOfDay).map(x => (x.onHand > 0
          ? { title: `${x.item} may run out today`, detail: `${x.onHand} ${x.unit} left · about ${x.restOfDay} ${x.unit} usually used by close` }
          : { title: `Out of ${x.item}`, detail: `About ${x.restOfDay} ${x.unit} usually used by close` }));
      } },
      { id: 'overtime', level: 'today', tag: 'staff', rank: 4, run(s, now) {
        return src.shifts(s.id).filter(x => x.end > now && x.week + (x.end - x.start) / HOUR > LINE.overtimeHours).map(x => ({
          title: `${x.who} goes over ${LINE.overtimeHours} hours today`, detail: `${x.week} hrs this week before today · on until ${clock(x.end, s.tz)}` }));
      } }
    ];
    S.TAGS = { temps: 'Fridge temperatures', apps: 'Delivery apps', staff: 'Shifts', stock: 'Stock', sales: 'Sales' };
    S.board = view => {
      const now = src.now(), list = storesIn(view), items = [];
      const openNow = list.filter(s => today(s.id).open);
      list.forEach(s => {
        if (!openNow.includes(s)) return;
        RULES.forEach(r => {
          if (!src.has(r.tag, s.id)) return;
          r.run(s, now).forEach((it, k) => items.push(Object.assign({ key: `${r.id}:${s.id}:${k}`, rule: r.id, level: r.level, rank: r.rank, store: s.id, where: name(s) }, it)));
        });
      });
      items.sort((a, b) => a.rank - b.rank || a.where.localeCompare(b.where));
      const watching = Object.keys(S.TAGS).filter(t => t !== 'sales' && list.some(s => src.has(t, s.id)));
      const missing = Object.keys(S.TAGS).filter(t => t !== 'sales' && !watching.includes(t));
      const next = list.length ? today(list[0].id) : null;
      return { now: items.filter(i => i.level === 'now'), today: items.filter(i => i.level === 'today'),
        open: openNow.length, stores: list.length, opensAt: next && next.opensAt, watching, missing };
    };

    /* ---------- The insight board: what needs someone, then the day's few useful facts ---------- */
    const usd = c => '$' + Math.round(c / 100).toLocaleString('en-US');
    const hourName = h => (h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`);
    // Plain words for how today compares; small differences are just "about the same".
    const pace = (net, usual, day) => {
      if (!usual) return `${usd(net)} so far`;
      const d = Math.round((net / usual - 1) * 100);
      return Math.abs(d) < 5 ? `${usd(net)} so far · about the same as a usual ${day}` : `${usd(net)} so far · ${Math.abs(d)}% ${d > 0 ? 'above' : 'below'} a usual ${day}`;
    };
    S.insights = view => {
      const b = S.board(view), list = storesIn(view), now = src.now(), notes = [];
      const note = (key, text) => notes.push({ key, text });
      const sales = list.filter(s => src.has('sales', s.id)), staff = list.filter(s => src.has('staff', s.id));
      const open = list.filter(s => today(s.id).open);
      if (list.length === 1) {
        const s = list[0], t = today(s.id);
        if (!t.open) {
          note('closed', `Closed · opens ${hourName(t.opensAt)}`);
          if (sales.length) { const y = src.dayTotal(s.id, src.dayShift(t.L.day, -1)); note('yesterday', `Yesterday ${usd(y.net)} · ${y.orders} orders`); }
        } else {
          if (sales.length) {
            note('sales', pace(t.net, t.usualNet, t.weekday));
            const ahead = t.hours.filter(h => h.h > t.L.hour).sort((a, c) => c.usual - a.usual)[0];
            if (ahead) note('ahead', `Busiest hour ahead is ${hourName(ahead.h)} · usually ${usd(ahead.usual)}`);
            const top = src.items(s.id, t.net)[0];
            if (top && top.qty) note('top', `${top.item} leads today · ${top.qty} sold`);
          }
          if (staff.length) {
            const sh = src.shifts(s.id), on = sh.filter(x => x.in && !x.out).length;
            const soon = sh.filter(x => !x.in && x.start > now && x.start <= now + 3 * HOUR);
            note('staff', soon.length ? `${on} on shift · ${soon.length} more by ${clock(Math.max(...soon.map(x => x.start)), s.tz)}` : `${on} on shift`);
          }
          if (src.has('apps', s.id)) {
            const apps = src.apps(s.id), taking = apps.filter(a => !a.paused);
            if (taking.length) note('apps', `${taking.map(a => src.appName(a.app)).join(' and ')} taking orders · ${apps.reduce((n, a) => n + a.ordersToday, 0)} app orders today`);
          }
        }
      } else if (list.length) {
        if (!open.length) note('closed', `All ${list.length} stores closed`);
        else if (open.length < list.length) note('closed', `${list.length - open.length} of ${list.length} stores closed now`);
        if (sales.length) {
          const ts = sales.map(s => ({ s, t: today(s.id) }));
          const net = ts.reduce((n, x) => n + x.t.net, 0), usual = ts.reduce((n, x) => n + x.t.usualNet, 0);
          note('sales', pace(net, usual, ts[0].t.weekday));
          const best = ts.slice().sort((a, c) => c.t.net - a.t.net)[0];
          if (best && best.t.net) note('best', `${name(best.s)} has the most so far · ${usd(best.t.net)}`);
          const tally = {};
          ts.forEach(x => src.items(x.s.id, x.t.net).forEach(i => { tally[i.item] = (tally[i.item] || 0) + i.net; }));
          const top = Object.keys(tally).sort((a, c) => tally[c] - tally[a])[0];
          if (top && tally[top]) note('top', `${top} leads across stores`);
        }
        if (staff.length) note('staff', `${staff.reduce((n, s) => n + src.shifts(s.id).filter(x => x.in && !x.out).length, 0)} on shift across ${staff.length} stores`);
      }
      return { now: b.now, today: b.today, notes, missing: b.missing, stores: list.length, has: sales.length > 0 || staff.length > 0 || b.watching.length > 0 };
    };

    /* ---------- The dashboard ---------- */
    S.dash = view => {
      const now = src.now(), list = storesIn(view);
      const rows = list.map(s => {
        const t = src.has('sales', s.id) ? today(s.id) : null, sh = src.has('staff', s.id) ? src.shifts(s.id) : null;
        const labor = sh ? laborSoFar(sh, now) : null;
        return { s, t, sh, labor, onShift: sh ? sh.filter(x => x.in && !x.out) : null };
      });
      const withSales = rows.filter(r => r.t);
      const sum = (arr, f) => arr.reduce((a, r) => a + f(r), 0);
      const k = {
        net: withSales.length ? sum(withSales, r => r.t.net) : null,
        usualNet: withSales.length ? sum(withSales, r => r.t.usualNet) : null,
        orders: withSales.length ? sum(withSales, r => r.t.orders) : null,
        usualOrders: withSales.length ? sum(withSales, r => r.t.usualOrders) : null,
        labor: rows.some(r => r.labor != null) ? sum(rows, r => r.labor || 0) : null,
        onShift: rows.some(r => r.onShift) ? sum(rows, r => (r.onShift ? r.onShift.length : 0)) : null
      };
      k.check = k.orders ? k.net / k.orders : null;
      k.laborPct = k.labor != null && k.net ? k.labor / k.net : null;
      const one = list.length === 1 ? rows[0] : null;
      const out = { view, single: !!one, kpi: k, has: {}, stores: list.length };
      ['sales', 'staff', 'stock', 'temps', 'apps'].forEach(t => { out.has[t] = list.some(s => src.has(t, s.id)); });
      if (withSales.length) {
        // By hour, across the stores in view, on each store's own clock.
        const by = {};
        withSales.forEach(r => r.t.hours.forEach(h => {
          const x = by[h.h] || (by[h.h] = { h: h.h, net: 0, usual: 0, done: true, now: false, started: false });
          // Stores sit in different time zones: an hour is done once every store is past it.
          x.net += h.net; x.usual += h.usual; x.done = x.done && h.done; x.now = x.now || h.now; x.started = x.started || h.done || h.now;
        }));
        out.hours = Object.values(by).sort((a, b) => a.h - b.h);
        const tally = {};
        withSales.forEach(r => src.items(r.s.id, r.t.net).forEach(i => {
          const x = tally[i.item] || (tally[i.item] = { item: i.item, qty: 0, net: 0 }); x.qty += i.qty; x.net += i.net;
        }));
        out.items = Object.values(tally).sort((a, b) => b.net - a.net).slice(0, 5);
      }
      if (one) {
        const s = one.s;
        if (one.sh) {
          out.shift = one.sh.filter(x => x.end > now && x.start <= now + 2 * HOUR).map(x => ({
            who: x.who, role: x.role, state: x.in && !x.out ? 'on' : !x.in && x.start <= now ? 'late' : 'next',
            at: clock(x.in || x.start, s.tz), until: clock(x.end, s.tz) }));
        }
        if (src.has('stock', s.id)) out.stock = src.stock(s.id).filter(x => x.onHand != null).map(x => ({ item: x.item, unit: x.unit, onHand: x.onHand, par: x.par, low: x.onHand < x.restOfDay }));
        // A unit is flagged only when the board flags it, so one open door doesn't turn the dashboard red.
        const warm = src.has('temps', s.id) ? S.board(s.id).now.filter(i => i.rule === 'warm').map(i => i.unit) : [];
        if (src.has('temps', s.id)) out.temps = src.temps(s.id).map(u => { const r = u.readings.filter(x => x.ts <= now).pop(); return { unit: u.unit, f: r ? r.f : null, lo: u.lo, hi: u.hi, alert: warm.includes(u.unit) }; });
        if (src.has('apps', s.id)) out.apps = src.apps(s.id).map(a => ({ app: src.appName(a.app), paused: a.paused, orders: a.ordersToday }));
        out.local = one.t ? one.t : today(s.id);
      } else {
        const board = S.board(view);
        out.table = rows.map(r => ({ id: r.s.id, name: name(r.s), loc: r.s.loc, brand: r.s.brandName, open: today(r.s.id).open,
          net: r.t ? r.t.net : null, usualNet: r.t ? r.t.usualNet : null, laborPct: r.labor != null && r.t && r.t.net ? r.labor / r.t.net : null,
          onShift: r.onShift ? r.onShift.length : null, alerts: board.now.filter(i => i.store === r.s.id).length + board.today.filter(i => i.store === r.s.id).length }))
          .sort((a, b) => (b.net || 0) - (a.net || 0));
      }
      return out;
    };

    /* ---------- The chat's tools: plain facts, in the shapes the model reads easily ---------- */
    const notConnected = (tag, list) => {
      const miss = list.filter(s => !src.has(tag, s.id));
      return miss.length ? { not_connected: `${S.TAGS[tag]} for ${miss.length === list.length ? 'these stores' : miss.map(name).join(', ')}` } : {};
    };
    const where = input => {
      const w = (input && input.where) || 'all';
      const list = storesIn(w);
      if (!list.length) throw new Error(`Unknown store or brand: ${w}. Use list_stores.`);
      return list;
    };
    const DATE = /^\d{4}-\d{2}-\d{2}$/;
    function days(input, list) {
      const L = src.local(src.now(), list[0].tz);
      const to = input.to || input.date || L.day, from = input.from || input.date || to;
      if (!DATE.test(from) || !DATE.test(to)) throw new Error('Dates are YYYY-MM-DD.');
      if (from > to) throw new Error('from is after to.');
      const first = src.dayShift(L.day, -HISTORY_DAYS);
      if (to < first) return { keys: [], note: `Data starts ${first}.` };
      const keys = [];
      for (let d = from < first ? first : from; d <= to && d <= L.day && keys.length < 92; d = src.dayShift(d, 1)) keys.push(d);
      return { keys, note: from < first ? `Data starts ${first}.` : undefined };
    }
    // A day's totals at one store; today counts only what's been rung up so far.
    function dayAt(s, key) {
      const L = src.local(src.now(), s.tz);
      if (key === L.day) { const t = today(s.id); return { net: t.net, orders: t.orders, so_far: true }; }
      return src.dayTotal(s.id, key);
    }
    const TOOLS = {
      list_stores() {
        return { stores: stores().map(s => ({ id: s.id, name: name(s), brand: s.brandName, brand_id: 'brand:' + s.brand, time_zone: s.tz, open_now: today(s.id).open })) };
      },
      sales(input) {
        const list = where(input), nc = notConnected('sales', list), ok = list.filter(s => src.has('sales', s.id));
        const { keys, note } = days(input, list), group = input.group || 'store';
        const rows = [];
        ok.forEach(s => keys.forEach(key => { const t = dayAt(s, key); rows.push({ store: s.id, name: name(s), day: key, net: t.net, orders: t.orders, so_far: !!t.so_far }); }));
        const roll = by => { const m = {}; rows.forEach(r => { const k = by(r), x = m[k] || (m[k] = { key: k, net: 0, orders: 0, so_far: false }); x.net += r.net; x.orders += r.orders; x.so_far = x.so_far || r.so_far; }); return Object.values(m); };
        const fmtRow = x => ({ [group === 'day' ? 'day' : group === 'store' ? 'store' : 'total']: x.key, net_sales: dollars(x.net), orders: x.orders, average_check: x.orders ? dollars(x.net / x.orders) : null, ...(x.so_far ? { so_far_today: true } : {}) });
        const out = group === 'day' ? roll(r => r.day) : group === 'store' ? roll(r => r.name) : roll(() => 'all');
        return Object.assign({ from: keys[0] || null, to: keys[keys.length - 1] || null, rows: out.map(fmtRow) }, note ? { note } : {}, nc);
      },
      sales_by_hour(input) {
        const list = where(input), ok = list.filter(s => src.has('sales', s.id)), nc = notConnected('sales', list);
        const L = src.local(src.now(), (ok[0] || list[0]).tz), key = input.date || L.day;
        if (!DATE.test(key)) throw new Error('Dates are YYYY-MM-DD.');
        const by = {};
        ok.forEach(s => {
          const isToday = key === src.local(src.now(), s.tz).day, t = isToday ? today(s.id) : null;
          const [o, c] = src.openHours(new Date(key + 'T12:00:00Z').getUTCDay());
          for (let h = o; h < c; h++) {
            const x = by[h] || (by[h] = { hour: `${String(h).padStart(2, '0')}:00`, net: 0, orders: 0, usual_net: 0 });
            const v = t ? t.hours.find(y => y.h === h) : null;
            if (t) { const part = src.hourTotal(s.id, key, h, h < t.L.hour ? 1 : h === t.L.hour ? t.L.minute / 60 : 0); x.net += part.net; x.orders += part.orders; x.usual_net += v ? v.usual : 0; }
            else { const f = src.hourTotal(s.id, key, h, 1); x.net += f.net; x.orders += f.orders; }
          }
        });
        return Object.assign({ date: key, store_local_hours: true, hours: Object.values(by).map(x => Object.assign({ hour: x.hour, net_sales: dollars(x.net), orders: x.orders }, x.usual_net ? { usual_net_sales_same_weekday: dollars(x.usual_net) } : {})) }, nc);
      },
      top_items(input) {
        const list = where(input), ok = list.filter(s => src.has('sales', s.id)), nc = notConnected('sales', list), { keys, note } = days(input, list);
        const m = {};
        ok.forEach(s => keys.forEach(key => src.items(s.id, dayAt(s, key).net).forEach(i => { const x = m[i.item] || (m[i.item] = { item: i.item, qty: 0, net: 0 }); x.qty += i.qty; x.net += i.net; })));
        const rows = Object.values(m).sort((a, b) => b.net - a.net).slice(0, Math.min(25, input.limit || 10)).map(x => ({ item: x.item, quantity: x.qty, net_sales: dollars(x.net) }));
        return Object.assign({ from: keys[0] || null, to: keys[keys.length - 1] || null, items: rows }, note ? { note } : {}, nc);
      },
      staff(input) {
        const list = where(input), ok = list.filter(s => src.has('staff', s.id)), nc = notConnected('staff', list), now = src.now();
        const state = x => (x.out ? 'finished' : x.in ? 'on shift' : x.start <= now ? 'not clocked in' : 'later today');
        if (ok.length === 1) {
          const s = ok[0];
          return Object.assign({ store: name(s), shifts: src.shifts(s.id).map(x => ({ name: x.who, role: x.role, starts: hm(x.start, s.tz), ends: hm(x.end, s.tz),
            clocked_in: x.in ? hm(x.in, s.tz) : null, clocked_out: x.out ? hm(x.out, s.tz) : null, status: state(x), hours_this_week_before_today: x.week, hourly_rate: dollars(x.rate) })),
            labor_cost_so_far: dollars(laborSoFar(src.shifts(s.id), now)) }, nc);
        }
        return Object.assign({ stores: ok.map(s => { const sh = src.shifts(s.id); return { store: name(s), on_shift: sh.filter(x => state(x) === 'on shift').length,
          not_clocked_in: sh.filter(x => state(x) === 'not clocked in').map(x => `${x.who} (${x.role}, started ${hm(x.start, s.tz)})`),
          labor_cost_so_far: dollars(laborSoFar(sh, now)) }; }), note: 'Ask about one store for each person.' }, nc);
      },
      inventory(input) {
        const list = where(input), ok = list.filter(s => src.has('stock', s.id)), nc = notConnected('stock', list);
        const rows = ok.flatMap(s => src.stock(s.id).filter(x => ok.length === 1 || x.onHand < x.restOfDay || x.onHand < x.par * 0.5)
          .map(x => ({ store: name(s), item: x.item, on_hand: x.onHand, unit: x.unit, par: x.par, usual_use_rest_of_today: x.restOfDay, counted_at: x.countedAt ? hm(x.countedAt, s.tz) : 'not counted yet today' })));
        return Object.assign({ items: rows }, ok.length > 1 ? { note: 'Only items that are low. Ask about one store for everything.' } : {}, nc);
      },
      temperatures(input) {
        const list = where(input), ok = list.filter(s => src.has('temps', s.id)), nc = notConnected('temps', list), now = src.now();
        const rows = ok.flatMap(s => src.temps(s.id).map(u => {
          const rs = u.readings.filter(r => r.ts <= now), last = rs[rs.length - 1];
          const outToday = rs.filter(r => r.f > u.hi || r.f < u.lo).length;
          return { store: name(s), unit: u.unit, latest_f: last ? last.f : null, at: last ? hm(last.ts, s.tz) : null, safe_range: `${u.lo}–${u.hi}°F`,
            in_range_now: last ? last.f >= u.lo && last.f <= u.hi : null, readings_out_of_range_last_6h: outToday };
        })).filter(r => ok.length === 1 || !r.in_range_now || r.readings_out_of_range_last_6h > 0);
        return Object.assign({ units: rows, readings_every: '10 min' }, ok.length > 1 ? { note: 'Only units with a reading out of range. Ask about one store for all.' } : {}, nc);
      },
      delivery_apps(input) {
        const list = where(input), ok = list.filter(s => src.has('apps', s.id)), nc = notConnected('apps', list), now = src.now();
        const rows = ok.flatMap(s => src.apps(s.id).map(a => ({ store: name(s), app: src.appName(a.app), status: !a.open ? 'store closed' : a.paused ? 'paused' : 'taking orders',
          paused_minutes: a.paused ? Math.round((now - a.since) / MIN) : undefined, orders_today: a.ordersToday })));
        return Object.assign({ apps: ok.length > 1 ? rows.filter(r => r.status !== 'taking orders').concat([{ taking_orders: rows.filter(r => r.status === 'taking orders').length }]) : rows }, nc);
      },
      insights(input) {
        const w = (input && input.where) || 'all', b = S.board(w), i = S.insights(w);
        const fmt = x => ({ store: x.where, what: x.title, detail: x.detail });
        return { needs_attention_now: b.now.map(fmt), to_plan_for_today: b.today.map(fmt), facts: i.notes.map(n => n.text), stores_open: b.open, not_watching: b.missing.map(t => S.TAGS[t]) };
      }
    };
    S.run = (tool, input) => {
      const fn = TOOLS[tool];
      if (!fn) throw new Error(`No tool named ${tool}`);
      return fn(input || {});
    };
    S.today = today;
    S.LINE = LINE;
    return S;
  }

  const api = { create, LINE };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.NomixBrain = api;
})(typeof window !== 'undefined' ? window : globalThis);
