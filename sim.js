/* Nomix demo data for the apps: four weeks of sales, today's shifts, stock, fridge readings and
   delivery apps for every store, in each store's own time zone. The same store and day always give
   the same numbers, so the board, the dashboard and the chat agree with each other.
   Only the demo uses this; the real service hands brain.js the same shapes from the dictionary. */
(function () {
  'use strict';
  const D = window.NOMIX_DATA;
  const MIN = 60000, HOUR = 60 * MIN, DAY = 24 * HOUR;

  /* ---------- Repeatable randomness ---------- */
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = key => {
    let a = hash(key);
    return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };
  const r1 = key => rng(key)();
  const between = (r, lo, hi) => lo + r * (hi - lo);

  /* ---------- Stores and their clocks ---------- */
  const ET = 'America/New_York', CT = 'America/Chicago', PT = 'America/Los_Angeles';
  const TZ = { 'umiya-lic': ET, 'umiya-edison': ET, 'umiya-alexandria': ET, 'umiya-jensen-beach': ET, 'surfing-crab-lewes': ET,
    'umiya-las-vegas': PT, 'surfing-crab-escondido': PT };
  const STORES = D.COMPANY.brands.flatMap(b => b.stores.map(([id, loc]) => ({ id, loc, brand: b.id, brandName: b.name, tz: TZ[id] || CT })));
  const STORE = Object.fromEntries(STORES.map(s => [s.id, s]));
  const fmt = {};
  // The store's own date, hour and weekday at a moment.
  function local(ts, tz) {
    const f = fmt[tz] || (fmt[tz] = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', weekday: 'short' }));
    const p = Object.fromEntries(f.formatToParts(new Date(ts)).map(x => [x.type, x.value]));
    const hour = +p.hour % 24, minute = +p.minute, second = +p.second;
    return { day: `${p.year}-${p.month}-${p.day}`, hour, minute, mins: hour * 60 + minute,
      dow: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday),
      midnight: ts - ((hour * 60 + minute) * 60 + second) * 1000 - (ts % 1000) };
  }
  const dayShift = (key, n) => { const d = new Date(key + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const dowOf = key => new Date(key + 'T12:00:00Z').getUTCDay();

  /* ---------- Sales ---------- */
  const OPEN = 11, closeAt = dow => (dow === 5 || dow === 6 ? 23 : 22);
  const CURVE = { 11: 6, 12: 11, 13: 9, 14: 5, 15: 3.5, 16: 4.5, 17: 9, 18: 14, 19: 15, 20: 12, 21: 7, 22: 3.5 };
  const curves = {};
  const curve = dow => curves[dow] || (curves[dow] = makeCurve(dow));
  const makeCurve = dow => {
    const hrs = {}; let sum = 0;
    for (let h = OPEN; h < closeAt(dow); h++) { hrs[h] = CURVE[h] || 2; sum += hrs[h]; }
    Object.keys(hrs).forEach(h => { hrs[h] /= sum; });
    return hrs;
  };
  const BASE = { umiya: 1100000, 'surfing-crab': 900000, 'hibachi-buffet': 1400000 };   // cents a day
  const CHECK = { umiya: 3800, 'surfing-crab': 4200, 'hibachi-buffet': 2600 };
  const WEEK = [1.15, 0.78, 0.8, 0.86, 0.92, 1.22, 1.38];
  const storeSize = id => between(r1('size' + id), 0.75, 1.3);
  // A whole day's net sales and orders.
  const days = new Map();
  function dayTotal(id, key) {
    const k = id + key;
    if (!days.has(k)) { if (days.size > 20000) days.clear(); days.set(k, makeDay(id, key)); }
    return days.get(k);
  }
  function makeDay(id, key) {
    const s = STORE[id], r = rng('day' + id + key);
    const net = Math.round(BASE[s.brand] * storeSize(id) * WEEK[dowOf(key)] * between(r(), 0.92, 1.08));
    return { net, orders: Math.max(1, Math.round(net / (CHECK[s.brand] * between(r(), 0.94, 1.06)))) };
  }
  // One hour of one day; the current hour counts only the minutes gone by.
  function hourTotal(id, key, h, upto) {
    const t = dayTotal(id, key), share = curve(dowOf(key))[h] || 0, w = between(r1('hr' + id + key + h), 0.9, 1.1);
    const part = upto == null ? 1 : Math.max(0, Math.min(1, upto));
    return { net: Math.round(t.net * share * w * part), orders: Math.round(t.orders * share * w * part) };
  }

  /* ---------- What each store sells ---------- */
  const MIX = [0.26, 0.21, 0.17, 0.14, 0.12, 0.1];
  function items(id, net) {
    const menu = D.MENUS[STORE[id].brand];
    return menu.map(([name, price], i) => {
      const n = Math.round(net * (MIX[i] || 0.05) / 100 / price);
      return { item: name, qty: n, net: Math.round(n * price * 100) };
    }).sort((a, b) => b.net - a.net);
  }

  /* ---------- Today's shifts ---------- */
  const FIRST = ['Maria', 'Kevin', 'Ana', 'Jun', 'Dee', 'Tomás', 'Lily', 'Marcus', 'Priya', 'Hao', 'Sofia', 'Andre', 'Mei', 'Luis', 'Grace', 'Omar', 'Yuki', 'Diego', 'Nina', 'Ray', 'Chen', 'Isabel', 'Tony', 'Hana', 'Victor', 'Rosa', 'Sam', 'Lin', 'Carlos', 'Jade'];
  const ROSTER = [
    ['Manager', '10:30', '17:00', 2600], ['Manager', '16:30', '23:00', 2600],
    ['Line cook', '10:30', '16:30', 1800], ['Line cook', '16:00', '22:30', 1800], ['Line cook', '17:00', '23:00', 1750],
    ['Prep', '09:00', '15:00', 1600], ['Server', '11:00', '15:00', 1100], ['Server', '11:00', '17:00', 1100],
    ['Server', '16:00', '22:00', 1100], ['Server', '17:00', '23:00', 1100], ['Host', '16:30', '21:30', 1300], ['Dish', '17:00', '23:00', 1400]
  ];
  const STATION = { umiya: 'Sushi bar', 'surfing-crab': 'Boil station', 'hibachi-buffet': 'Hibachi grill' };
  const mm = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  // Today's things that go wrong, chosen once per day: few stores, short windows, nothing made up on the spot.
  function events(key) {
    const r = rng('events' + key), pick = () => STORES[Math.floor(r() * STORES.length)].id, out = [];
    for (let i = 0; i < 5; i++) out.push({ kind: 'warm', store: pick(), at: Math.round(between(r(), 12 * 60, 20.5 * 60)), len: Math.round(between(r(), 60, 100)) });
    for (let i = 0; i < 5; i++) out.push({ kind: 'paused', store: pick(), at: Math.round(between(r(), 11.5 * 60, 21 * 60)), len: Math.round(between(r(), 25, 50)), app: r() < 0.6 ? 'doordash' : 'ubereats' });
    for (let i = 0; i < 3; i++) out.push({ kind: 'late', store: pick(), slot: [3, 6, 8][i] });
    for (let i = 0; i < 2; i++) out.push({ kind: 'short', store: pick(), item: Math.floor(r() * 3) });
    out.push({ kind: 'overtime', store: pick(), slot: 7 });
    return out;
  }
  const eventsFor = (id, key, kind) => events(key).filter(e => e.store === id && e.kind === kind);

  function shifts(id, now) {
    const s = STORE[id], L = local(now, s.tz), key = L.day, r = rng('staff' + id + key);
    const used = new Set();
    const late = eventsFor(id, key, 'late').map(e => e.slot), ot = eventsFor(id, key, 'overtime').map(e => e.slot);
    return ROSTER.map(([role, a, b, rate], k) => {
      let n; do { n = FIRST[Math.floor(r() * FIRST.length)]; } while (used.has(n)); used.add(n);
      const who = `${n} ${String.fromCharCode(65 + Math.floor(r() * 26))}.`;
      const start = L.midnight + mm(a) * MIN, end = L.midnight + mm(b) * MIN;
      const inAt = start + Math.round(between(r(), -7, 3)) * MIN + (late.includes(k) ? 46 * MIN : 0);
      const outAt = end + Math.round(between(r(), 0, 6)) * MIN;
      const daysBefore = (L.dow + 6) % 7;   // the week starts on Monday
      const hoursToday = (mm(b) - mm(a)) / 60;
      const week = ot.includes(k) ? 36.5 : Math.min(Math.round(daysBefore * between(r(), 4.5, 7.2) * 2) / 2, Math.floor(38 - hoursToday));
      return { who, role: role === 'Line cook' ? `${role} · ${STATION[s.brand]}` : role, store: id, start, end,
        in: inAt <= now ? inAt : null, out: outAt <= now ? outAt : null, rate, week };
    });
  }

  /* ---------- Stock ---------- */
  const STOCK = {
    umiya: [['Salmon', 'lb', 40, 30], ['Tuna', 'lb', 25, 18], ['Sushi rice', 'bags', 6, 4], ['Avocados', 'cases', 4, 2.5], ['Takeout boxes', 'cases', 8, 3]],
    'surfing-crab': [['Snow crab clusters', 'lb', 120, 90], ['Crawfish', 'lb', 150, 110], ['Shrimp', 'lb', 60, 40], ['Corn', 'cases', 6, 4], ['Takeout bags', 'cases', 6, 3]],
    'hibachi-buffet': [['Sirloin', 'lb', 80, 55], ['Chicken', 'lb', 120, 90], ['Rice', 'bags', 8, 6], ['Shrimp', 'lb', 50, 35], ['Takeout boxes', 'cases', 10, 5]]
  };
  // Share of the day's sales already rung up, at a store-local minute.
  const doneShare = (dow, mins) => {
    const c = curve(dow); let s = 0;
    Object.keys(c).forEach(h => { s += c[h] * Math.max(0, Math.min(1, (mins - h * 60) / 60)); });
    return s;
  };
  function stock(id, now) {
    const s = STORE[id], L = local(now, s.tz), short = eventsFor(id, L.day, 'short').map(e => e.item);
    const counted = L.midnight + 9.5 * HOUR, seen = now >= counted;
    const size = storeSize(id), dayUse = WEEK[L.dow] / 1.0;
    return STOCK[s.brand].map(([item, unit, par, use], k) => {
      const r = rng('stock' + id + L.day + k), daily = use * size * dayUse;
      const morning = short.includes(k) ? daily * between(r(), 0.45, 0.6) : Math.max(par * size * between(r(), 0.85, 1.15), daily * 1.15);
      const usedSoFar = daily * doneShare(L.dow, L.mins);
      const round = v => (unit === 'lb' ? Math.round(v) : Math.round(v * 2) / 2);
      return { item, unit, store: id, par: round(par * size), countedAt: seen ? counted : null,
        onHand: seen ? Math.max(0, round(morning - usedSoFar)) : null, restOfDay: round(daily * (1 - doneShare(L.dow, L.mins))) };
    });
  }

  /* ---------- Fridges and freezers ---------- */
  const UNITS = [['Walk-in fridge', 33, 40, 37], ['Prep fridge', 33, 41, 37.5], ['Freezer', -10, 5, -2]];
  function temps(id, now) {
    const s = STORE[id], L = local(now, s.tz), warm = eventsFor(id, L.day, 'warm');
    const last = now - (now % (10 * MIN));
    return UNITS.map(([unit, lo, hi, mid], u) => {
      const readings = [];
      for (let t = last - 6 * HOUR; t <= last; t += 10 * MIN) {
        const r = rng('t' + id + u + t), lm = Math.round((t - L.midnight) / MIN);
        let f = mid + between(r(), -1.5, 1.5);
        if (r() < 0.03) f += between(r(), 3, 4.5);                   // a door left open for a moment
        if (u === 0) warm.forEach(e => {
          const into = lm - e.at;
          if (into >= 0 && into < e.len) f = mid + Math.min(8, into / 4);   // the walk-in warming up
        });
        readings.push({ ts: t, f: Math.round(f * 10) / 10 });
      }
      return { unit, store: id, lo, hi, readings };
    });
  }

  /* ---------- Delivery apps ---------- */
  function apps(id, now, ids) {
    const s = STORE[id], L = local(now, s.tz), paused = eventsFor(id, L.day, 'paused');
    const open = L.hour >= OPEN && L.hour < closeAt(L.dow);
    return ids.map(app => {
      const e = paused.find(p => p.app === app && L.mins >= p.at && L.mins < p.at + p.len);
      const t = dayTotal(id, L.day), share = app === 'doordash' ? 0.14 : app === 'ubereats' ? 0.1 : 0.04;
      return { app, store: id, open, paused: !!(open && e), since: e ? L.midnight + e.at * MIN : null,
        ordersToday: Math.round(t.orders * share * doneShare(L.dow, L.mins)) };
    });
  }

  /* ---------- The source brain.js reads ---------- */
  // o.now(): the time; o.has(tag, store): whether a connected tool sends that data for that store;
  // o.apps(store): the delivery apps connected there; o.appName(id): an app's name.
  const source = o => ({
    now: o.now, has: o.has, appName: o.appName, local, dayShift,
    stores: () => STORES, openHours: dow => [OPEN, closeAt(dow)],
    dayTotal, hourTotal, items,
    shifts: id => shifts(id, o.now()), stock: id => stock(id, o.now()), temps: id => temps(id, o.now()),
    apps: id => apps(id, o.now(), o.apps(id))
  });
  window.NomixSim = { stores: STORES, local, events, source };
})();
