/* Dated planner layouts: multiyear, year, quarter, month, week, day.
 * Each returns an SVG string. Interactive targets use data attributes:
 *   data-link="view|YYYY-MM-DD"      navigate to a period
 *   data-event="<id>"                open an event
 *   data-newevent="YYYY-MM-DD[THH:MM]"  double-click to create an event there */
(function () {
  const { S, L, R } = Templates;
  const esc = Templates.esc;

  const link = (view, d, label, inner, focus = true) =>
    `<g class="lnk" data-link="${view}|${D.iso(d)}"${focus ? ` tabindex="0" role="link" aria-label="${esc(label)}"` : ''}>${inner}</g>`;

  const trunc = (s, n) => (s.length > n ? s.slice(0, Math.max(1, n - 1)) + '…' : s);

  function evChip(ev, x, y, w, h = 26, opts = {}) {
    const color = Store.colorOf(ev);
    const time = ev.allDay ? '' : D.fmtTime(ev.time) + ' ';
    const label = time + ev.title;
    const chars = Math.floor((w - 16) / (opts.charW || 8));
    return `<g class="ev" data-event="${ev.id}" tabindex="0" role="button" aria-label="${esc(label)}">` +
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" style="fill:${color}" class="ev-bg"/>` +
      `<rect x="${x}" y="${y}" width="5" height="${h}" rx="2" style="fill:${color}"/>` +
      `<text x="${x + 11}" y="${y + h / 2 + 5}" class="ev-text">${esc(trunc(label, chars))}</text></g>`;
  }

  function miniMonth(x, y, w, year, month, opts = {}) {
    const cw = w / 7, rh = opts.rowH || 36, today = D.today();
    const first = new Date(year, month, 1);
    let s = link('month', first, `${D.MONTHS[month]} ${year}`,
      S.text(x + 4, y + 22, opts.long ? `${D.MONTHS[month]} ${year}` : D.MONTHS[month], 't-mini-title'), opts.focusTitle !== false);
    'MTWTFSS'.split('').forEach((c, i) => { s += S.text(x + i * cw + cw / 2, y + 50, c, 't-xs', 'text-anchor="middle"'); });
    D.monthMatrix(year, month).forEach((d, i) => {
      if (d.getMonth() !== month) return;
      const cx = x + (i % 7) * cw + cw / 2, cy = y + 56 + Math.floor(i / 7) * rh + rh / 2;
      let inner = `<rect x="${cx - cw / 2}" y="${cy - rh / 2}" width="${cw}" height="${rh}" class="hit"/>`;
      if (D.sameDay(d, today)) inner += S.circle(cx, cy - 1, Math.min(cw, rh) / 2 - 2, 'today-mark');
      if (opts.highlight && opts.highlight(d)) inner += S.circle(cx, cy - 1, Math.min(cw, rh) / 2 - 2, 'sel-mark');
      inner += S.text(cx, cy + 5, d.getDate(), D.sameDay(d, today) ? 't-mini-day today' : 't-mini-day', 'text-anchor="middle"');
      if (opts.dots && Store.eventsOn(d).length) inner += S.circle(cx, cy + 12, 2.5, 'evdot');
      s += link('day', d, D.label('day', d), inner, !!opts.focusDays);
    });
    return s;
  }

  /* ---------- Multiyear ---------- */
  function multiyear(date) {
    const start = D.multiStart(date.getFullYear());
    let s = S.header(`${start} – ${start + 4}`, 'Five-year view');
    for (let i = 0; i < 5; i++) {
      const y = start + i, top = 170 + i * 238;
      s += S.rect(L, top, R - L, 220, 'box', 14);
      s += link('year', new Date(y, 0, 1), `Year ${y}`, S.text(L + 24, top + 60, y, 't-year'));
      s += S.text(L + 24, top + 95, 'Goals', 't-s') + S.lines(L + 24, top + 135, 120, top + 205, 35);
      for (let m = 0; m < 12; m++) {
        const bx = 230 + (m % 6) * 118, by = top + 18 + Math.floor(m / 6) * 100;
        s += link('month', new Date(y, m, 1), `${D.MONTHS[m]} ${y}`,
          `<rect x="${bx}" y="${by}" width="108" height="88" rx="10" class="cell"/>` + S.text(bx + 12, by + 28, D.MON_SHORT[m], 't-b'));
      }
    }
    return S.wrap(s);
  }

  /* ---------- Year ---------- */
  function year(date) {
    const y = date.getFullYear();
    let s = S.header(String(y)) +
      link('multiyear', date, 'Five-year view', S.text(R, 105, `${D.multiStart(y)}–${D.multiStart(y) + 4} ›`, 't-link', 'text-anchor="end"'));
    for (let m = 0; m < 12; m++) {
      const x = L + (m % 3) * 310, top = 160 + Math.floor(m / 3) * 298;
      if (m % 3 === 0) s += link('quarter', new Date(y, m, 1), `Quarter ${m / 3 + 1}`, S.text(L - 40, top + 150, `Q${m / 3 + 1}`, 't-q', `transform="rotate(-90 ${L - 40} ${top + 150})" text-anchor="middle"`));
      s += miniMonth(x, top, 280, y, m, { dots: true, rowH: 36 });
    }
    return S.wrap(s);
  }

  /* ---------- Quarter ---------- */
  function quarter(date) {
    const y = date.getFullYear(), q = D.quarter(date), m0 = (q - 1) * 3;
    let s = S.header(`Quarter ${q}`) + link('year', date, `Year ${y}`, S.text(R, 105, `${y} ›`, 't-link', 'text-anchor="end"'));
    for (let i = 0; i < 3; i++) s += miniMonth(L + i * 310, 160, 280, y, m0 + i, { dots: true, rowH: 38, focusDays: true });
    s += S.h(L, 520, 'Quarterly goals') + S.checks(L, 570, R - L, 5, 48);
    for (let i = 0; i < 3; i++) {
      const x = L + i * 300;
      s += link('month', new Date(y, m0 + i, 1), D.MONTHS[m0 + i], S.text(x, 860, `${D.MONTHS[m0 + i].toUpperCase()} FOCUS`, 't-h lnk-h'));
      s += S.lines(x, 905, 280, 1355, 40);
    }
    return S.wrap(s);
  }

  /* ---------- Month ---------- */
  function month(date) {
    const y = date.getFullYear(), m = date.getMonth(), today = D.today();
    const cw = (R - L) / 7, ch = 168, top = 200;
    let s = S.header(D.MONTHS[m]) +
      link('quarter', date, `Quarter ${D.quarter(date)}`, S.text(R - 90, 105, `Q${D.quarter(date)}`, 't-link', 'text-anchor="end"')) +
      link('year', date, `Year ${y}`, S.text(R, 105, `${y} ›`, 't-link', 'text-anchor="end"'));
    D.DOW_SHORT.slice(1).concat('Sun').forEach((d, i) => { s += S.text(L + i * cw + 10, 185, d.toUpperCase(), 't-th'); });
    D.monthMatrix(y, m).forEach((d, i) => {
      const x = L + (i % 7) * cw, cy = top + Math.floor(i / 7) * ch;
      const out = d.getMonth() !== m;
      s += `<rect x="${x}" y="${cy}" width="${cw}" height="${ch}" class="cell${out ? ' dim' : ''}${D.sameDay(d, today) ? ' cell-today' : ''}" data-newevent="${D.iso(d)}"/>`;
      if (i % 7 === 0) s += link('week', d, `Week of ${D.label('week', d)}`, S.text(x - 22, cy + 30, '›', 't-link'));
      s += link('day', d, D.label('day', d), S.text(x + 10, cy + 30, d.getDate(), out ? 't-day dim' : 't-day'));
      const evs = out ? [] : Store.eventsOn(d);
      evs.slice(0, 3).forEach((ev, k) => { s += evChip(ev, x + 4, cy + 44 + k * 30, cw - 8, 26, { charW: 7.6 }); });
      if (evs.length > 3) s += link('day', d, `${evs.length - 3} more events`, S.text(x + 10, cy + 156, `+${evs.length - 3} more`, 't-xs'), false);
    });
    s += S.h(L, 1250, 'Notes') + S.lines(L, 1290, R - L, 1360, 35);
    return S.wrap(s);
  }

  /* ---------- Week ---------- */
  function week(date) {
    const start = D.startOfWeek(date), today = D.today();
    let s = S.header(`Week of ${D.MON_SHORT[start.getMonth()]} ${start.getDate()}`) +
      link('month', start, D.label('month', start), S.text(R, 105, `${D.label('month', start)} ›`, 't-link', 'text-anchor="end"'));
    const bw = 430, bh = 290;
    for (let i = 0; i < 8; i++) {
      const x = i % 2 ? 510 : L, y = 160 + Math.floor(i / 2) * (bh + 8);
      if (i === 7) {
        s += S.rect(x, y, bw, bh, 'box', 12) + S.h(x + 18, y + 36, 'Notes') + S.lines(x + 18, y + 80, bw - 36, y + bh - 15, 38);
        continue;
      }
      const d = D.addDays(start, i);
      s += `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="12" class="box${D.sameDay(d, today) ? ' cell-today' : ''}" data-newevent="${D.iso(d)}"/>`;
      s += link('day', d, D.label('day', d), S.text(x + 18, y + 38, D.DOW[d.getDay()].toUpperCase(), 't-h') + S.text(x + bw - 18, y + 40, d.getDate(), 't-day-lg', 'text-anchor="end"'));
      const evs = Store.eventsOn(d);
      const shown = evs.slice(0, 4);
      shown.forEach((ev, k) => { s += evChip(ev, x + 14, y + 56 + k * 32, bw - 28, 28); });
      if (evs.length > 4) s += link('day', d, 'More events', S.text(x + 18, y + 56 + 4 * 32 + 16, `+${evs.length - 4} more`, 't-xs'), false);
      const ly = y + 70 + Math.max(shown.length, 0) * 32 + (evs.length > 4 ? 20 : 0);
      s += S.lines(x + 18, Math.max(ly, y + 80), bw - 36, y + bh - 15, 38);
    }
    return S.wrap(s);
  }

  /* ---------- Day ---------- */
  function layoutColumns(evs) {
    // Greedy column assignment for overlapping timed events.
    const items = evs.map(e => ({ e, s: D.minutes(e.time), en: e.endTime ? D.minutes(e.endTime) : D.minutes(e.time) + 60 }))
      .map(o => (o.en <= o.s ? Object.assign(o, { en: o.s + 30 }) : o))
      .sort((a, b) => a.s - b.s);
    let cluster = [], colsEnd = [], out = [];
    const flush = () => { const n = colsEnd.length; cluster.forEach(o => { o.n = n; out.push(o); }); cluster = []; colsEnd = []; };
    for (const o of items) {
      if (cluster.length && o.s >= Math.max(...cluster.map(c => c.en))) flush();
      let c = colsEnd.findIndex(end => end <= o.s);
      if (c === -1) { c = colsEnd.length; colsEnd.push(o.en); } else colsEnd[c] = o.en;
      o.col = c; cluster.push(o);
    }
    flush();
    return out;
  }

  function dayHeader(date) {
    return S.text(L, 140, date.getDate(), 't-big') +
      S.text(L + 150, 90, D.DOW[date.getDay()], 't-title') +
      link('month', date, D.label('month', date), S.text(L + 152, 130, D.label('month', date), 't-link')) +
      link('week', date, 'Week view', S.text(L + 152, 165, 'Week view ›', 't-link')) +
      miniMonth(690, 10, 250, date.getFullYear(), date.getMonth(), { rowH: 22, focusTitle: false, highlight: d => D.sameDay(d, date) }) +
      S.line(L, 205, R, 205, 'ln-strong');
  }

  function eventList(date, x, y, w, max) {
    const evs = Store.eventsOn(date);
    let s = S.h(x, y, 'Events');
    if (!evs.length) s += S.text(x, y + 40, 'No events — double-click here to add one', 't-s', `data-newevent="${D.iso(date)}"`);
    evs.slice(0, max).forEach((ev, k) => { s += evChip(ev, x, y + 18 + k * 34, w, 28); });
    return { svg: s, height: 30 + Math.max(1, Math.min(evs.length, max)) * 34 };
  }

  function day(date, planner) {
    const style = (planner && planner.dayStyle) || 'schedule';
    let s = dayHeader(date);
    if (style === 'lined' || style === 'checklist') {
      const ev = eventList(date, L, 250, R - L, 6);
      s += `<rect x="${L}" y="215" width="${R - L}" height="${ev.height + 40}" class="hit" data-newevent="${D.iso(date)}"/>` + ev.svg;
      const y0 = 260 + ev.height + 30;
      if (style === 'lined') s += S.h(L, y0, 'Notes') + S.lines(L, y0 + 45, R - L, 1360, 40);
      else s += S.h(L, y0, 'Tasks') + S.checks(L, y0 + 55, R - L, Math.floor((1360 - y0 - 55) / 48) + 1, 48);
      return S.wrap(s);
    }
    // Schedule style
    const x0 = 140, x1 = 590, startH = 6, endH = 22, top = 280, rh = 63;
    const evs = Store.eventsOn(date);
    const allDay = evs.filter(e => e.allDay || !e.time), timed = evs.filter(e => !e.allDay && e.time);
    s += S.text(L, 242, 'ALL DAY', 't-th') + `<rect x="${x0}" y="218" width="${x1 - x0}" height="40" class="hit" data-newevent="${D.iso(date)}"/>`;
    allDay.slice(0, 2).forEach((ev, k) => { s += evChip(ev, x0 + k * ((x1 - x0) / 2), 222, (x1 - x0) / 2 - 6, 30); });
    if (allDay.length > 2) s += S.text(x1 - 4, 270, `+${allDay.length - 2}`, 't-xs', 'text-anchor="end"');
    for (let h = startH; h <= endH; h++) {
      const y = top + (h - startH) * rh;
      s += S.text(L, y + 6, D.fmtTime(`${h}:00`), 't-s') + S.line(x0, y, x1, y, 'ln');
      if (h < endH) {
        s += S.line(x0, y + rh / 2, x1, y + rh / 2, 'ln-faint');
        s += `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="${rh}" class="hit" data-newevent="${D.iso(date)}T${String(h).padStart(2, '0')}:00"/>`;
      }
    }
    // Current-time marker
    const nowD = new Date();
    if (D.sameDay(nowD, date)) {
      const mins = nowD.getHours() * 60 + nowD.getMinutes();
      if (mins >= startH * 60 && mins <= endH * 60) {
        const y = top + (mins - startH * 60) / 60 * rh;
        s += `<line x1="${x0 - 6}" y1="${y}" x2="${x1}" y2="${y}" class="now-line"/>` + S.circle(x0 - 6, y, 5, 'now-dot');
      }
    }
    layoutColumns(timed).forEach(o => {
      const s0 = Math.max(o.s, startH * 60), e0 = Math.min(o.en, endH * 60);
      if (e0 <= s0) return;
      const y = top + (s0 - startH * 60) / 60 * rh, h = Math.max(26, (e0 - s0) / 60 * rh - 3);
      const w = (x1 - x0 - 6) / o.n;
      s += evChip(o.e, x0 + 4 + o.col * w, y + 1, w - 4, h, { charW: 8 });
    });
    // Right column
    const rx = 630, rw = R - rx;
    s += S.h(rx, 250, 'Top priorities') + S.checks(rx, 300, rw, 3, 50);
    s += S.h(rx, 470, 'To-do') + S.checks(rx, 520, rw, 9, 48);
    s += S.h(rx, 990, 'Notes') + S.lines(rx, 1030, rw, 1360, 40);
    return S.wrap(s);
  }

  const Layouts = { multiyear, year, quarter, month, week, day };
  window.Layouts = {
    render(view, date, planner) { return (Layouts[view] || Layouts.day)(date, planner); },
  };
})();
