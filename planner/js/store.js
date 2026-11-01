/* Local-first data store.
 * Everything lives in one JSON document in localStorage. Each entity carries `updatedAt`
 * so two copies (another tab, an offline device, a restored backup) can be merged
 * entity-by-entity with last-writer-wins. Deletions are tombstones (`deleted: true`). */
(function () {
  const KEY = 'digital-planner.v1';
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const now = () => Date.now();

  const ALL_VIEWS = ['multiyear', 'year', 'quarter', 'month', 'week', 'day'];
  const VIEW_NAMES = { multiyear: 'Multiyear', year: 'Year', quarter: 'Quarter', month: 'Month', week: 'Week', day: 'Day' };

  function emptyState() {
    return {
      version: 1,
      deviceId: uid(),
      account: { name: 'Demo account', email: 'you@example.com' },
      planners: [],
      content: {},          // "<plannerId>|<pageKey>" -> { strokes, items, updatedAt }
      calendars: [],
      events: [],
      defaultCalendarId: null,
      prefs: { shelfSort: 'recent', stylusOnly: false },
      sync: { lastSynced: null, pending: 0, simulateOffline: false, conflicts: 0 },
      ui: {},               // per planner: { view, date, sectionId, pageIndex }
    };
  }

  const listeners = new Set();
  let state = load();
  let saveTimer = null;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return Object.assign(emptyState(), JSON.parse(raw));
    } catch (e) { console.warn('Could not read saved planner data', e); }
    return null;
  }

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      Store.emit('error', 'Storage is full. Remove some images or export a backup.');
      return false;
    }
  }

  /* ---------- Merge (sync reconciliation) ---------- */
  function mergeById(a = [], b = [], counter) {
    const map = new Map(a.map(x => [x.id, x]));
    for (const x of b) {
      const cur = map.get(x.id);
      if (!cur) map.set(x.id, x);
      else if ((x.updatedAt || 0) > (cur.updatedAt || 0)) { map.set(x.id, x); if (counter) counter.n++; }
    }
    return [...map.values()];
  }
  function merge(local, remote) {
    const counter = { n: 0 };
    const out = Object.assign({}, local);
    out.planners = mergeById(local.planners, remote.planners, counter);
    out.calendars = mergeById(local.calendars, remote.calendars);
    out.events = mergeById(local.events, remote.events);
    out.content = Object.assign({}, local.content);
    for (const [k, v] of Object.entries(remote.content || {})) {
      const cur = out.content[k];
      if (!cur || (v.updatedAt || 0) > (cur.updatedAt || 0)) out.content[k] = v;
    }
    if (!out.defaultCalendarId) out.defaultCalendarId = remote.defaultCalendarId;
    return { state: out, replaced: counter.n };
  }

  /* ---------- Recurrence ---------- */
  function occursOn(ev, d) {
    const base = D.parse(ev.date);
    if (d < base) return false;
    if (ev.until && d > D.parse(ev.until)) return false;
    switch (ev.recurrence || 'none') {
      case 'none': return D.sameDay(base, d);
      case 'daily': return true;
      case 'weekdays': { const w = d.getDay(); return w >= 1 && w <= 5; }
      case 'weekly': return d.getDay() === base.getDay();
      case 'biweekly': return d.getDay() === base.getDay() && Math.round((d - base) / 864e5) % 14 === 0;
      case 'monthly': return d.getDate() === base.getDate();
      case 'yearly': return d.getDate() === base.getDate() && d.getMonth() === base.getMonth();
    }
    return false;
  }

  const Store = {
    uid, ALL_VIEWS, VIEW_NAMES,
    get state() { return state; },
    hasData() { return !!state; },
    init(seedFn) {
      if (!state) { state = emptyState(); seedFn(state); persist(); }
      // Cross-tab sync: another tab saved -> merge its copy into ours.
      window.addEventListener('storage', e => {
        if (e.key !== KEY || !e.newValue || state.sync.simulateOffline) return;
        try {
          const remote = JSON.parse(e.newValue);
          const r = merge(state, remote);
          state = Object.assign(r.state, { deviceId: state.deviceId, ui: state.ui, prefs: state.prefs, sync: state.sync });
          state.sync.lastSynced = now();
          Store.emit('remote');
        } catch (err) { console.warn(err); }
      });
      window.addEventListener('online', () => Store.reconcile());
      window.addEventListener('offline', () => Store.emit('sync'));
    },
    on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    emit(type, detail) { listeners.forEach(fn => fn(type, detail)); },

    isOnline() { return navigator.onLine && !state.sync.simulateOffline; },

    /* Mark a change: save locally right away (debounced), and queue for sync. */
    touch(opts = {}) {
      if (!opts.silent) state.sync.pending++;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        if (!persist()) return;
        Store.emit('sync');
        if (Store.isOnline() && state.sync.pending) Store.reconcile();
      }, 250);
    },
    saveNow() { clearTimeout(saveTimer); persist(); },

    /* Simulated upload. With a real backend this would push the queued entities and pull
     * remote changes, then call merge(). Here the "server" is localStorage itself. */
    reconcile() {
      if (!Store.isOnline()) { Store.emit('sync'); return; }
      Store.emit('sync', 'syncing');
      setTimeout(() => {
        try {
          const raw = localStorage.getItem(KEY);
          if (raw) {
            const r = merge(state, JSON.parse(raw));
            state = Object.assign(r.state, { deviceId: state.deviceId, ui: state.ui, prefs: state.prefs, sync: state.sync });
            state.sync.conflicts += r.replaced;
          }
          state.sync.pending = 0;
          state.sync.lastSynced = now();
          persist();
          Store.emit('sync');
        } catch (e) {
          Store.emit('sync', 'error');
        }
      }, 700);
    },

    /* ---------- Planners ---------- */
    planners() { return state.planners.filter(p => !p.deleted); },
    planner(id) { return state.planners.find(p => p.id === id && !p.deleted); },
    addPlanner(p) {
      const planner = Object.assign({
        id: uid(), name: 'Untitled planner', color: '#3d5a80', cover: 'solid', theme: 'classic',
        views: ['year', 'quarter', 'month', 'week', 'day'], dayStyle: 'schedule',
        sections: [], createdAt: now(), openedAt: now(),
      }, p, { updatedAt: now() });
      state.planners.push(planner);
      Store.touch();
      return planner;
    },
    updatePlanner(id, patch) {
      const p = Store.planner(id);
      if (!p) return;
      Object.assign(p, patch, { updatedAt: now() });
      Store.touch();
    },
    deletePlanner(id) {
      const p = Store.planner(id);
      if (!p) return;
      p.deleted = true; p.updatedAt = now();
      Store.touch();
    },
    duplicatePlanner(id) {
      const src = Store.planner(id);
      if (!src) return;
      const copy = JSON.parse(JSON.stringify(src));
      const pageMap = {};
      copy.id = uid(); copy.name = src.name + ' (copy)'; copy.createdAt = copy.openedAt = copy.updatedAt = now();
      copy.sections.forEach(s => { s.id = uid(); s.pages.forEach(pg => { const nid = uid(); pageMap[pg.id] = nid; pg.id = nid; }); });
      state.planners.push(copy);
      for (const [k, v] of Object.entries(state.content)) {
        const [pid, pageKey] = k.split('|');
        if (pid !== src.id) continue;
        let nk = pageKey;
        if (pageKey.startsWith('page:')) nk = 'page:' + (pageMap[pageKey.slice(5)] || pageKey.slice(5));
        state.content[copy.id + '|' + nk] = JSON.parse(JSON.stringify(v));
      }
      Store.touch();
      return copy;
    },

    /* ---------- Page content ---------- */
    content(plannerId, pageKey) {
      return state.content[plannerId + '|' + pageKey] || { strokes: [], items: [] };
    },
    setContent(plannerId, pageKey, c) {
      state.content[plannerId + '|' + pageKey] = { strokes: c.strokes, items: c.items, updatedAt: now() };
      Store.touch();
    },
    hasContent(plannerId, pageKey) {
      const c = state.content[plannerId + '|' + pageKey];
      return !!c && (c.strokes.length > 0 || c.items.length > 0);
    },

    /* ---------- Calendars & events ---------- */
    calendars() { return state.calendars.filter(c => !c.deleted); },
    calendar(id) { return state.calendars.find(c => c.id === id); },
    addCalendar(c) {
      const cal = Object.assign({ id: uid(), visible: true, source: 'Planner' }, c, { updatedAt: now() });
      state.calendars.push(cal);
      Store.touch();
      return cal;
    },
    updateCalendar(id, patch) { const c = Store.calendar(id); if (c) { Object.assign(c, patch, { updatedAt: now() }); Store.touch(); } },
    removeCalendar(id) {
      const c = Store.calendar(id);
      if (!c) return;
      c.deleted = true; c.updatedAt = now();
      state.events.filter(e => e.calendarId === id).forEach(e => { e.deleted = true; e.updatedAt = now(); });
      if (state.defaultCalendarId === id) state.defaultCalendarId = (Store.calendars()[0] || {}).id || null;
      Store.touch();
    },
    event(id) { return state.events.find(e => e.id === id && !e.deleted); },
    saveEvent(ev) {
      const existing = ev.id && Store.event(ev.id);
      if (existing) Object.assign(existing, ev, { updatedAt: now() });
      else state.events.push(Object.assign({}, ev, { id: uid(), updatedAt: now() }));
      Store.touch();
    },
    deleteEvent(id) { const e = Store.event(id); if (e) { e.deleted = true; e.updatedAt = now(); Store.touch(); } },
    /* Visible events on a date, sorted: all-day first, then by start time */
    eventsOn(d) {
      const visible = new Set(Store.calendars().filter(c => c.visible).map(c => c.id));
      return state.events
        .filter(e => !e.deleted && visible.has(e.calendarId) && occursOn(e, d))
        .sort((a, b) => (a.allDay === b.allDay ? (a.time || '').localeCompare(b.time || '') : a.allDay ? -1 : 1));
    },
    colorOf(ev) { const c = Store.calendar(ev.calendarId); return c ? c.color : '#888'; },

    /* ---------- Backup ---------- */
    exportJSON() { return JSON.stringify(state, null, 1); },
    importJSON(text, mode) {
      const incoming = JSON.parse(text);
      if (!incoming || !Array.isArray(incoming.planners)) throw new Error('This file is not a planner backup.');
      if (mode === 'replace') {
        state = Object.assign(emptyState(), incoming, { deviceId: state.deviceId });
      } else {
        const r = merge(state, incoming);
        state = Object.assign(r.state, { deviceId: state.deviceId, ui: state.ui, prefs: state.prefs, sync: state.sync });
      }
      Store.touch();
    },
    resetAll() { localStorage.removeItem(KEY); location.reload(); },
  };
  window.Store = Store;
})();
