/* Date helpers. All dates are local-time Date objects at midnight. Weeks start on Monday. */
(function () {
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const MON_SHORT = MONTHS.map(m => m.slice(0, 3));
  const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const DOW_SHORT = DOW.map(d => d.slice(0, 3));
  const pad = n => String(n).padStart(2, '0');

  const D = {
    MONTHS, MON_SHORT, DOW, DOW_SHORT,
    today() { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); },
    iso(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; },
    parse(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); },
    addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); },
    addMonths(d, n) {
      const day = d.getDate();
      const r = new Date(d.getFullYear(), d.getMonth() + n, 1);
      const last = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate();
      r.setDate(Math.min(day, last));
      return r;
    },
    startOfWeek(d) { const dow = (d.getDay() + 6) % 7; return D.addDays(d, -dow); },
    sameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); },
    quarter(d) { return Math.floor(d.getMonth() / 3) + 1; },
    multiStart(y) { return y - ((y % 5) + 5) % 5; },

    /* Stable content key for a dated page. Content is stored by key, so it survives layout changes. */
    key(view, d) {
      switch (view) {
        case 'day': return 'day:' + D.iso(d);
        case 'week': return 'week:' + D.iso(D.startOfWeek(d));
        case 'month': return `month:${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
        case 'quarter': return `quarter:${d.getFullYear()}-Q${D.quarter(d)}`;
        case 'year': return 'year:' + d.getFullYear();
        case 'multiyear': return 'multiyear:' + D.multiStart(d.getFullYear());
      }
    },
    /* Inverse of key(): returns [view, date] */
    fromKey(k) {
      const [view, v] = k.split(':');
      if (view === 'day' || view === 'week') return [view, D.parse(v)];
      if (view === 'month') return [view, D.parse(v + '-01')];
      if (view === 'quarter') { const [y, q] = v.split('-Q'); return [view, new Date(+y, (+q - 1) * 3, 1)]; }
      return [view, new Date(+v, 0, 1)];
    },
    shift(view, d, dir) {
      switch (view) {
        case 'day': return D.addDays(d, dir);
        case 'week': return D.addDays(d, 7 * dir);
        case 'month': return D.addMonths(d, dir);
        case 'quarter': return D.addMonths(d, 3 * dir);
        case 'year': return D.addMonths(d, 12 * dir);
        case 'multiyear': return D.addMonths(d, 60 * dir);
      }
      return d;
    },
    label(view, d) {
      switch (view) {
        case 'day': return `${DOW[d.getDay()]}, ${MON_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
        case 'week': {
          const s = D.startOfWeek(d), e = D.addDays(s, 6);
          return s.getMonth() === e.getMonth()
            ? `${MON_SHORT[s.getMonth()]} ${s.getDate()}–${e.getDate()}, ${e.getFullYear()}`
            : `${MON_SHORT[s.getMonth()]} ${s.getDate()} – ${MON_SHORT[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
        }
        case 'month': return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
        case 'quarter': return `Q${D.quarter(d)} ${d.getFullYear()}`;
        case 'year': return String(d.getFullYear());
        case 'multiyear': { const s = D.multiStart(d.getFullYear()); return `${s}–${s + 4}`; }
      }
      return '';
    },
    /* 42 dates (6 weeks) covering the month, starting Monday */
    monthMatrix(y, m) {
      const start = D.startOfWeek(new Date(y, m, 1));
      return Array.from({ length: 42 }, (_, i) => D.addDays(start, i));
    },
    fmtTime(t) {
      if (!t) return '';
      const [h, m] = t.split(':').map(Number);
      const ap = h >= 12 ? 'pm' : 'am';
      const hh = ((h + 11) % 12) + 1;
      return m ? `${hh}:${pad(m)}${ap}` : `${hh}${ap}`;
    },
    minutes(t) { const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); },
  };
  window.D = D;
})();
