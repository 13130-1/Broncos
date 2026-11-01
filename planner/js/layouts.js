/* Dated planner layouts: multiyear, year, quarter, month, week, day — each in portrait
 * (1000 x 1400) and landscape (1400 x 1000). Each returns an SVG string.
 * Interactive targets use data attributes:
 *   data-link="view|YYYY-MM-DD"      navigate to a period
 *   data-event="<id>"                open an event
 *   data-newevent="YYYY-MM-DD[THH:MM]"  double-click to create an event there */
(function () {
  const { S, L } = Templates;
  const esc = Templates.esc;
  let R = 940, BOTTOM = 1360, LAND = false; // set per render from the orientation

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
    const step = LAND ? 163 : 238, h = LAND ? 155 : 220;
    for (let i = 0; i < 5; i++) {
      const y = start + i, top = (LAND ? 150 : 170) + i * step;
      s += S.rect(L, top, R - L, h, 'box', 14);
      s += link('year', new Date(y, 0, 1), `Year ${y}`, S.text(L + 24, top + 60, y, 't-year'));
      s += S.text(L + 24, top + 95, 'Goals', 't-s') + S.lines(L + 24, top + 130, 130, top + h - 15, 35);
      for (let m = 0; m < 12; m++) {
        const bx = LAND ? 240 + m * 91 : 230 + (m % 6) * 118;
        const by = LAND ? top + 35 : top + 18 + Math.floor(m / 6) * 100;
        const bw = LAND ? 83 : 108, bh = LAND ? 85 : 88;
        s += link('month', new Date(y, m, 1), `${D.MONTHS[m]} ${y}`,
          `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="10" class="cell"/>` + S.text(bx + 12, by + 28, D.MON_SHORT[m], 't-b'));
      }
    }
    return S.wrap(s);
  }

  /* ---------- Shared page helpers ----------
   * Spreads are two portrait pages (1000 x 1400) scaled into one landscape page. */
  function spread(left, right) {
    const k = 0.7, y = (1000 - 1400 * k) / 2;
    return `<svg class="page-svg" viewBox="0 0 1400 1000" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" class="paper"/>` +
      `<g transform="translate(0 ${y}) scale(${k})">${left}</g>` +
      `<rect x="688" y="0" width="24" height="1000" class="gutter"/>` + S.line(700, 0, 700, 1000, 'ln-faint') +
      `<g transform="translate(700 ${y}) scale(${k})">${right}</g></svg>`;
  }
  const portrait = inner => `<svg class="page-svg" viewBox="0 0 1000 1400" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" class="paper"/>${inner}</svg>`;
  function quote(i, x1 = 930) {
    const [q, who] = QUOTES[((i % QUOTES.length) + QUOTES.length) % QUOTES.length];
    return S.text(x1, 92, q, 't-quote', 'text-anchor="end"') + S.text(x1, 124, who.toUpperCase(), 't-th', 'text-anchor="end"');
  }

  /* ---------- Year: 12-month view ----------
   * Six months per page, two columns by three rows. Each month heading
   * (JAN / 2026 ...) links to that month; all-day events are listed as the majors. */
  function monthBlock(x, y, w, yr, m) {
    const first = new Date(yr, m, 1), t = D.today();
    const cur = t.getFullYear() === yr && t.getMonth() === m;
    let s = link('month', first, `${D.MONTHS[m]} ${yr}`,
      S.text(x, y, `${D.MON_SHORT[m].toUpperCase()} / ${yr}`, 't-month-h') + (cur ? S.circle(x + 150, y - 6, 4, 'wk-on') : ''));
    const n = 10, gap = 31, ly0 = y + 30;
    s += S.lines(x, ly0, w, ly0 + (n - 1) * gap, gap);
    // Majors: all-day events this month, one per line
    const seen = new Set(), items = [];
    const days = new Date(yr, m + 1, 0).getDate();
    for (let d = 1; d <= days && items.length < n; d++) {
      const dt = new Date(yr, m, d);
      Store.eventsOn(dt).filter(e => e.allDay || !e.time).forEach(e => {
        const k = e.id + (e.recurrence === 'none' ? '' : d);
        if (!seen.has(k) && items.length < n) { seen.add(k); items.push([d, e]); }
      });
    }
    items.forEach(([d, e], i) => {
      s += `<g class="ev" data-event="${e.id}" tabindex="0" role="button" aria-label="${esc(e.title)}">` +
        S.text(x + 6, ly0 + i * gap - 8, `${d}  ${trunc(e.title, 34)}`, 't-ev-line') + '</g>';
    });
    return s;
  }
  function twelvePage(yr, half) {
    let s = half === 0
      ? S.text(70, 112, '12-MONTH VIEW', 't-display') + S.text(70, 158, 'List major events and projects, month by month.', 't-instr') +
        link('multiyear', new Date(yr, 0, 1), 'Five-year view', S.text(930, 112, `${D.multiStart(yr)}–${D.multiStart(yr) + 4} ›`, 't-th', 'text-anchor="end"'))
      : quote(yr + 3);
    for (let i = 0; i < 6; i++) {
      const m = half * 6 + i;
      s += monthBlock(70 + (i % 2) * 470, 250 + Math.floor(i / 2) * 370, 390, yr, m);
    }
    return s;
  }
  function year(date, planner, opts) {
    const yr = date.getFullYear();
    if (LAND) return spread(twelvePage(yr, 0), twelvePage(yr, 1));
    return portrait(twelvePage(yr, opts && opts.sub === 'h2' ? 1 : 0));
  }

  /* ---------- Quarter: quarterly preview ----------
   * Review page: wins, last quarter's goals with %, what worked.
   * Plan page: continue, change, and a setup checklist for the quarter ahead. */
  function quarterReview(date) {
    const yr = date.getFullYear(), q = D.quarter(date), m0 = (q - 1) * 3, x0 = 70, x1 = 930, w = x1 - x0;
    let s = S.text(x0, 112, 'QUARTERLY PREVIEW', 't-display') + S.text(x1, 110, `Q${q} ${yr}`, 't-date', 'text-anchor="end"');
    for (let i = 0; i < 3; i++) s += link('month', new Date(yr, m0 + i, 1), D.MONTHS[m0 + i], S.text(x0 + i * 110, 160, `${D.MON_SHORT[m0 + i].toUpperCase()} ›`, 't-th'));
    s += link('year', date, `Year ${yr}`, S.text(x0 + 330, 160, `${yr} ›`, 't-th'));
    s += S.label(x0, 232, 'After-action review', 'List 3–5 of your top wins from last quarter.') + S.lines(x0, 278, w, 458, 36);
    s += S.text(x0, 522, 'Look back at last quarter’s goals. How far did you get?', 't-instr') + S.text(x1 - 40, 528, '%', 't-th', 'text-anchor="middle"');
    s += S.lines(x0, 556, w, 808, 36) + S.line(x1 - 80, 536, x1 - 80, 808);
    s += S.text(x0, 872, 'What worked? What didn’t? Why?', 't-instr') + S.lines(x0, 918, w, 1314, 36);
    return s;
  }
  function quarterPlan(date) {
    const x0 = 70, x1 = 930, w = x1 - x0;
    let s = quote(D.quarter(date) + date.getFullYear());
    s += S.text(x0, 212, 'What will you continue?', 't-instr') + S.lines(x0, 258, w, 510, 36);
    s += S.text(x0, 576, 'What will you change?', 't-instr') + S.lines(x0, 622, w, 874, 36);
    s += S.label(x0, 950, 'Next quarter overview', 'Set up the quarter ahead.');
    ['Review your goals and your longer-range plans.',
      'Choose up to three goals for the quarter; update Annual Goals and Goal Detail.',
      'Add major events to the Calendar and the 12-Month View.',
      'Adjust your daily rituals and model week if needed.',
      'Add the quarter’s key projects to the Project Tracker.'].forEach((t, i) => {
      const y = 1012 + i * 56;
      s += S.circle(x0 + 8, y - 6, 8) + S.text(x0 + 30, y, t, 't-instr');
    });
    return s;
  }
  function quarter(date, planner, opts) {
    if (LAND) return spread(quarterReview(date), quarterPlan(date));
    return portrait(opts && opts.sub === 'qp2' ? quarterPlan(date) : quarterReview(date));
  }

  /* ---------- Month: calendar ----------
   * Grey date squares, Saturday and Sunday kept together, and a notes column.
   * Landscape: Mon–Thu on the left page, Fri–Sun and notes on the right.
   * Portrait: all seven days on one page, notes along the bottom. */
  function calRows(y, m) {
    const mx = D.monthMatrix(y, m);
    return mx.slice(35).some(d => d.getMonth() === m) ? 6 : 5;
  }
  function calCell(d, m, x, y, w, h) {
    const inMonth = d.getMonth() === m, today = D.sameDay(d, D.today());
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="frame"${inMonth ? ` data-newevent="${D.iso(d)}"` : ''}/>`;
    if (!inMonth) return s + S.rect(x + 8, y + 8, 30, 30, 'date-box');
    s += link('day', d, D.label('day', d), S.rect(x + 8, y + 8, 30, 30, today ? 'wk-on' : 'date-box') +
      S.text(x + 23, y + 29, d.getDate(), today ? 't-datebox on' : 't-datebox', 'text-anchor="middle"'));
    const evs = Store.eventsOn(d), max = Math.max(0, Math.floor((h - 50) / 26));
    evs.slice(0, max).forEach((ev, k) => { s += evChip(ev, x + 5, y + 46 + k * 26, w - 10, 23, { charW: 7.4 }); });
    if (evs.length > max) s += link('day', d, `${evs.length - max} more events`, S.text(x + w - 8, y + 28, `+${evs.length - max}`, 't-xs', 'text-anchor="end"'), false);
    return s;
  }
  function calHeader(x, y, w, labels) {
    let s = S.rect(x, y - 30, w * labels.length, 30, 'frame');
    labels.forEach((l, i) => { s += S.text(x + i * w + w / 2, y - 10, l.toUpperCase(), 't-day-label', 'text-anchor="middle"'); });
    return s;
  }
  function calTitle(date) {
    const yr = date.getFullYear();
    return S.text(70, 112, 'CALENDAR', 't-display') +
      S.text(70, 162, 'MONTH', 't-th') + S.text(150, 163, `${D.MONTHS[date.getMonth()].toUpperCase()} ${yr}`, 't-date') +
      link('quarter', date, `Quarter ${D.quarter(date)}`, S.text(850, 112, `Q${D.quarter(date)} ›`, 't-th', 'text-anchor="end"')) +
      link('year', date, `Year ${yr}`, S.text(930, 112, `${yr} ›`, 't-th', 'text-anchor="end"'));
  }
  function month(date) {
    const y = date.getFullYear(), m = date.getMonth(), mx = D.monthMatrix(y, m), rows = calRows(y, m);
    const names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weekLinks = (x, top, rh) => mx.slice(0, rows * 7).filter((_, i) => i % 7 === 0)
      .map((d, r) => link('week', d, `Week of ${D.label('week', d)}`, S.text(x, top + r * rh + 30, '›', 't-link'))).join('');
    if (LAND) {
      const top = 262, rh = (1340 - top) / rows, cw = 215;
      let left = calTitle(date) + calHeader(70, top, cw, names.slice(0, 4)) + weekLinks(40, top, rh);
      let right = quote(m + y) + calHeader(70, top, cw, ['Friday', 'Saturday', 'Sunday', 'Notes']);
      for (let r = 0; r < rows; r++) for (let c = 0; c < 7; c++) {
        const d = mx[r * 7 + c];
        if (c < 4) left += calCell(d, m, 70 + c * cw, top + r * rh, cw, rh);
        else right += calCell(d, m, 70 + (c - 4) * cw, top + r * rh, cw, rh);
      }
      right += S.rect(70 + 3 * cw, top, cw, 1340 - top, 'frame') + S.lines(70 + 3 * cw + 12, top + 40, cw - 24, 1320, 36);
      return spread(left, right);
    }
    const top = 232, bottom = 1200, rh = (bottom - top) / rows, cw = 860 / 7;
    let s = calTitle(date) + calHeader(70, top, cw, names.map(n => n.slice(0, 3))) + weekLinks(44, top, rh);
    for (let r = 0; r < rows; r++) for (let c = 0; c < 7; c++) s += calCell(mx[r * 7 + c], m, 70 + c * cw, top + r * rh, cw, rh);
    s += S.label(70, 1250, 'Notes', 'Projects and reminders for the month.') + S.lines(70, 1288, 860, 1360, 36);
    return portrait(s);
  }

  /* ---------- Week: 7-day view ----------
   * Two "pages" side by side: Mon/Tue/Wed on the left, Thu/Fri and Sat|Sun on the right.
   * Each day is a framed box with its name set into the top rule. */
  function frameLabel(x, y, w, label) {
    const tw = label.length * 11 + 28;
    return `<rect x="${x + w / 2 - tw / 2}" y="${y - 12}" width="${tw}" height="24" class="paper"/>` +
      S.text(x + w / 2, y + 5, label, 't-day-label', 'text-anchor="middle"');
  }
  const gutter = () => (LAND ? `<rect x="688" y="0" width="24" height="1000" class="gutter"/>` + S.line(700, 0, 700, 1000, 'ln-faint') : '');
  const pages = () => (LAND ? [[90, 640], [760, 1310]] : [[60, 480], [520, 940]]);

  function week(date, planner, opts) {
    if (opts && (opts.sub === 'preview' || opts.sub === 'preview2')) return weekPreview(date, opts.sub === 'preview2');
    const start = D.startOfWeek(date), today = D.today();
    const [lp, rp] = pages();
    const top = LAND ? 90 : 100, bottom = LAND ? 950 : 1350, rh = (bottom - top) / 3;
    let s = gutter() +
      S.text(lp[0], 52, D.label('week', start).toUpperCase(), 't-th') +
      link('month', start, D.label('month', start), S.text(rp[1] - 230, 52, `${D.MONTHS[start.getMonth()].toUpperCase()} ›`, 't-th', 'text-anchor="end"')) +
      link('weekpreview', start, 'Weekly preview', S.text(rp[1], 52, 'WEEKLY PREVIEW ›', 't-th', 'text-anchor="end"'));
    const lw = lp[1] - lp[0], rw = rp[1] - rp[0];
    const boxes = [
      [lp[0], top, lw, rh], [lp[0], top + rh, lw, rh], [lp[0], top + 2 * rh, lw, rh],
      [rp[0], top, rw, rh], [rp[0], top + rh, rw, rh], [rp[0], top + 2 * rh, rw / 2, rh], [rp[0] + rw / 2, top + 2 * rh, rw / 2, rh],
    ];
    boxes.forEach(([x, y, w, h], i) => {
      const d = D.addDays(start, i);
      s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="frame${D.sameDay(d, today) ? ' cell-today' : ''}" data-newevent="${D.iso(d)}"/>`;
    });
    boxes.forEach(([x, y, w, h], i) => {
      const d = D.addDays(start, i);
      s += link('day', d, D.label('day', d), frameLabel(x, y, w, D.DOW[d.getDay()].toUpperCase()));
      s += link('day', d, D.label('day', d), S.text(x + w - 14, y + 34, d.getDate(), 't-day', 'text-anchor="end"'));
      const evs = Store.eventsOn(d), max = Math.max(1, Math.floor((h - 60) / 32));
      evs.slice(0, max).forEach((ev, k) => { s += evChip(ev, x + 14, y + 22 + k * 32 + (k === 0 ? 0 : 0), w - 64, 28); });
      if (evs.length > max) s += link('day', d, 'More events', S.text(x + 16, y + h - 14, `+${evs.length - max} more`, 't-xs'), false);
    });
    return S.wrap(s);
  }

  /* ---------- Week: weekly preview ----------
   * Left page: weeks-left countdown, title, review of last week.
   * Right page: reviews, habit streaks, rejuvenation, overview, top 3 for the week. */
  function label(x, y, title, instr) {
    return `<text x="${x}" y="${y}"><tspan class="t-h">${esc(title.toUpperCase())}</tspan>` +
      (instr ? `<tspan class="t-instr" dx="14">${esc(instr)}</tspan>` : '') + '</text>';
  }
  function circleOpts(x, y, items) {
    let s = '', cx = x;
    items.forEach(t => {
      s += S.circle(cx + 7, y - 5, 7) + S.text(cx + 22, y, t.toUpperCase(), 't-th');
      cx += 22 + t.length * 9.6 + 26;
    });
    return s;
  }
  function weeksLeft(date) {
    const start = D.startOfWeek(date);
    const qs = new Date(date.getFullYear(), (D.quarter(date) - 1) * 3, 1);
    const idx = Math.round((start - D.startOfWeek(qs)) / 6048e5);
    return Math.max(0, Math.min(13, 13 - idx));
  }
  function weeksRow(x, top, date, step = 26) {
    const left = weeksLeft(date);
    let s = S.text(x, top, 'WEEKS IN QUARTER', 't-th');
    for (let k = 13, i = 0; k >= 0; k--, i++) {
      const cx = x + 175 + i * step;
      if (k === left) s += S.circle(cx, top - 4, 11, 'wk-on');
      s += S.text(cx, top + 1, k, k === left ? 't-wk on' : 't-wk', 'text-anchor="middle"');
    }
    return s;
  }
  function previewLeft(x, w, top, date, n) {
    let s = weeksRow(x, top, date);
    let y = top + 68;
    s += S.text(x, y, 'WEEKLY PREVIEW', 't-display');
    y += 70;
    s += label(x, y, 'After-action review', 'List 3–5 wins from the past week.');
    s += S.lines(x, y + 46, w, y + 46 + (n.wins - 1) * n.gap, n.gap);
    y += 46 + (n.wins - 1) * n.gap + n.sg;
    s += S.text(x, y, 'How far did you get on last week’s Top 3?', 't-instr') + S.text(x + w - 30, y + 6, '%', 't-th', 'text-anchor="middle"');
    for (let i = 1; i <= 3; i++) {
      const ly = y + 14 + i * n.gap;
      s += S.text(x, ly - 10, i, 't-xs') + S.line(x, ly, x + w, ly);
    }
    s += S.line(x + w - 64, y + 12, x + w - 64, y + 14 + 3 * n.gap, 'ln');
    y += 14 + 3 * n.gap + n.sg + 4;
    s += S.text(x, y, 'What worked? What didn’t? Why?', 't-instr') + S.lines(x, y + 44, w, y + 44 + (n.worked - 1) * n.gap, n.gap);
    y += 44 + (n.worked - 1) * n.gap + n.sg + 4;
    s += S.text(x, y, 'What will you keep doing, or change?', 't-instr') + S.lines(x, y + 44, w, y + 44 + (n.change - 1) * n.gap, n.gap);
    return s;
  }
  function previewRight(x, w, top, date, n) {
    const start = D.startOfWeek(date);
    let y = top;
    let s = label(x, y, 'Goal review & list sweep', 'Review goals, lists and notes.');
    s += circleOpts(x, y + 42, ['Goals', 'Delegated items', 'Notes', 'Task list']);
    y += 42 + n.sec;
    s += label(x, y, 'Habit streaks', 'Track your habit goals.');
    const c = n.cell, gx = x + w - 7 * c, gy = y + 24;
    s += S.lines(x, gy + 4 + c, gx - 24 - x, gy + 4 + 5 * c, c);
    for (let r = 0; r < 5; r++) for (let k = 0; k < 7; k++) {
      s += S.rect(gx + k * c, gy + 4 + r * c, c, c, 'box') + S.text(gx + k * c + c / 2, gy + 9 + r * c + c / 2, k + 1, 't-xs', 'text-anchor="middle"');
    }
    y = gy + 4 + 5 * c + n.sec - 10;
    s += label(x, y, 'Rejuvenation', 'Choose 3 ways to recharge this week:');
    s += S.text(x, y + 28, 'sleep, eat, move, connect or rest better — then schedule them.', 't-instr');
    const by = y + 52, bh = n.boxH;
    s += S.line(x, by, x + w, by) + S.line(x, by + bh, x + w, by + bh);
    for (let i = 0; i < 3; i++) {
      const bx = x + i * w / 3;
      if (i) s += S.line(bx, by, bx, by + bh);
      s += S.text(bx + 14, by + 26, i + 1, 't-xs');
    }
    y = by + bh + n.sec - 10;
    s += label(x, y, 'Weekly overview', 'Plan the week ahead on the 7-day view.');
    s += circleOpts(x, y + 42, ['Events', 'Projects', 'Tasks', 'Other commitments']);
    y += 42 + n.sec;
    s += label(x, y, 'Top 3 for the week', 'Choose three objectives for the week.');
    for (let i = 0; i < 3; i++) {
      const cy = y + 50 + i * n.top3;
      s += S.circle(x + 18, cy, 17, 'big-check') + S.line(x + 52, cy - 16, x + w, cy - 16) + S.line(x + 52, cy + 14, x + w, cy + 14);
    }
    s += link('week', start, '7-day view', S.text(x + w, top - 52, '7-DAY VIEW ›', 't-th', 'text-anchor="end"'));
    return s;
  }
  function weekPreview(date, second) {
    if (LAND) {
      return S.wrap(gutter() +
        previewLeft(110, 520, 90, date, { wins: 5, worked: 4, change: 4, gap: 30, sg: 50 }) +
        previewRight(770, 550, 120, date, { sec: 70, boxH: 110, top3: 48, cell: 26 }));
    }
    // Portrait: two pages, like the printed spread
    return S.wrap(second
      ? previewRight(80, 840, 130, date, { sec: 100, boxH: 200, top3: 70, cell: 34 })
      : previewLeft(80, 840, 90, date, { wins: 5, worked: 7, change: 7, gap: 38, sg: 60 }));
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
      miniMonth(R - 250, 10, 250, date.getFullYear(), date.getMonth(), { rowH: 22, focusTitle: false, highlight: d => D.sameDay(d, date) }) +
      S.line(L, 205, R, 205, 'ln-strong');
  }

  function eventList(date, x, y, w, max) {
    const evs = Store.eventsOn(date);
    let s = S.h(x, y, 'Events');
    if (!evs.length) s += S.text(x, y + 40, 'No events — double-click here to add one', 't-s', `data-newevent="${D.iso(date)}"`);
    evs.slice(0, max).forEach((ev, k) => { s += evChip(ev, x, y + 18 + k * 34, w, 28); });
    return { svg: s, height: 30 + Math.max(1, Math.min(evs.length, max)) * 34 };
  }

  /* ---------- Daily pages ----------
   * Plan page: weeks left, day and date, routines, top 3, other tasks with a status
   * legend, and an hourly schedule column with calendar events.
   * Notes page: a short quote, ruled notes with margins, and a daily win. */
  var QUOTES = [
    ['Well begun is half done.', 'Aristotle'],
    ['Do what you can, with what you have, where you are.', 'Theodore Roosevelt'],
    ['Energy and persistence conquer all things.', 'Benjamin Franklin'],
    ['It is not that we have a short time to live, but that we waste much of it.', 'Seneca'],
    ['Lost time is never found again.', 'Benjamin Franklin'],
    ['The secret of getting ahead is getting started.', 'Proverb'],
    ['Little by little, one travels far.', 'Proverb'],
    ['Begin at once to live.', 'Seneca'],
  ];
  function dayPlan(date) {
    const x0 = 70, tx1 = 625, sx = 680, sx1 = 930;
    let s = weeksRow(x0, 80, date, 25);
    s += link('week', date, 'Week view', S.text(x0, 168, D.DOW[date.getDay()].toUpperCase(), 't-display'));
    const nameW = D.DOW[date.getDay()].length * 40;
    s += link('month', date, D.label('month', date), S.text(x0 + nameW + 40, 166, `/  ${D.MON_SHORT[date.getMonth()].toUpperCase()} ${date.getDate()}`, 't-date'));
    // Routines
    ['Morning routine', 'Workday startup', 'Workday shutdown', 'Evening routine'].forEach((t, i) => {
      s += S.circle(sx + 7, 75 + i * 28, 7) + S.text(sx + 22, 80 + i * 28, t.toUpperCase(), 't-th');
    });
    // Top 3
    s += S.label(x0, 262, 'Top 3 for the day', 'Your three most important tasks.');
    for (let i = 0; i < 3; i++) {
      const cy = 330 + i * 70;
      s += S.circle(x0 + 20, cy, 20, 'big-check') + S.line(x0 + 60, cy - 16, tx1, cy - 16) + S.line(x0 + 60, cy + 16, tx1, cy + 16);
    }
    // Other tasks
    s += S.label(x0, 580, 'Other tasks');
    s += S.lines(x0, 610, tx1 - x0, 1240, 35) + S.line(x0 + 36, 610, x0 + 36, 1240);
    // Status legend
    [['✓', 'Done'], ['☐', 'To do'], ['↘', 'Delegate'], ['→', 'Defer'], ['✕', 'Delete'], ['/', 'Waiting'], ['✱', 'Important'], ['?', 'Question']].forEach(([g, t], i) => {
      const lx = x0 + 40 + (i % 4) * 140, ly = 1290 + Math.floor(i / 4) * 34;
      s += S.text(lx, ly, g, 't-glyph', 'text-anchor="middle"') + S.text(lx + 16, ly, t.toUpperCase(), 't-th');
    });
    // Schedule: 5am to 9pm, with half-hour lines
    const top = 270, startH = 5, endH = 21, rh = (1330 - top) / (endH - startH), ex = sx + 34;
    const evs = Store.eventsOn(date);
    const allDay = evs.filter(e => e.allDay || !e.time), timed = evs.filter(e => !e.allDay && e.time);
    s += `<rect x="${ex}" y="196" width="${sx1 - ex}" height="56" class="hit" data-newevent="${D.iso(date)}"/>`;
    allDay.slice(0, 2).forEach((ev, k) => { s += evChip(ev, ex, 198 + k * 27, sx1 - ex, 24, { charW: 7.4 }); });
    for (let h = startH; h <= endH; h++) {
      const y = top + (h - startH) * rh;
      s += S.text(sx + 4, y + 5, ((h + 11) % 12) + 1, 't-xs') + S.line(ex, y, sx1, y);
      if (h < endH) {
        s += S.line(ex, y + rh / 2, sx1, y + rh / 2, 'ln-faint');
        s += `<rect x="${ex}" y="${y}" width="${sx1 - ex}" height="${rh}" class="hit" data-newevent="${D.iso(date)}T${String(h).padStart(2, '0')}:00"/>`;
      }
    }
    const nowD = new Date();
    if (D.sameDay(nowD, date)) {
      const mins = nowD.getHours() * 60 + nowD.getMinutes();
      if (mins >= startH * 60 && mins <= endH * 60) {
        const y = top + (mins - startH * 60) / 60 * rh;
        s += `<line x1="${ex - 4}" y1="${y}" x2="${sx1}" y2="${y}" class="now-line"/>` + S.circle(ex - 4, y, 4, 'now-dot');
      }
    }
    layoutColumns(timed).forEach(o => {
      const s0 = Math.max(o.s, startH * 60), e0 = Math.min(o.en, endH * 60);
      if (e0 <= s0) return;
      const y = top + (s0 - startH * 60) / 60 * rh, h = Math.max(22, (e0 - s0) / 60 * rh - 3);
      const w = (sx1 - ex - 2) / o.n;
      s += evChip(o.e, ex + 2 + o.col * w, y + 1, w - 3, h, { charW: 7.4 });
    });
    return s;
  }
  function dayNotes(date) {
    const x0 = 70, x1 = 930;
    const doy = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 864e5);
    const [q, who] = QUOTES[doy % QUOTES.length];
    let s = S.text(x1, 92, q, 't-quote', 'text-anchor="end"') + S.text(x1, 124, who.toUpperCase(), 't-th', 'text-anchor="end"');
    s += S.label(x0, 214, 'Notes');
    s += S.lines(x0, 244, x1 - x0, 1174, 35) + S.line(x0 + 36, 244, x0 + 36, 1174) + S.line(x1 - 70, 244, x1 - 70, 1174);
    s += S.label(x0, 1242, 'Daily win') + S.lines(x0, 1292, x1 - x0, 1332, 40);
    return s;
  }
  function dailySpread(date) {
    const k = 0.7, y = (1000 - 1400 * k) / 2;
    return `<svg class="page-svg" viewBox="0 0 1400 1000" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" class="paper"/>` +
      `<g transform="translate(0 ${y}) scale(${k})">${dayPlan(date)}</g>` +
      `<rect x="688" y="0" width="24" height="1000" class="gutter"/>` + S.line(700, 0, 700, 1000, 'ln-faint') +
      `<g transform="translate(700 ${y}) scale(${k})">${dayNotes(date)}</g></svg>`;
  }

  function day(date, planner, opts) {
    const style = (planner && planner.dayStyle) || 'schedule';
    if (style === 'schedule') {
      if (LAND) return dailySpread(date);
      return S.wrap(opts && opts.sub === 'notes' ? dayNotes(date) : dayPlan(date));
    }
    let s = dayHeader(date);
    if (style === 'lined' || style === 'checklist') {
      if (LAND) {
        // Events on the left, notes or tasks on the right
        const ev = eventList(date, L, 250, 560, 20);
        s += `<rect x="${L}" y="215" width="580" height="${BOTTOM - 215}" class="hit" data-newevent="${D.iso(date)}"/>` + ev.svg;
        s += style === 'lined' ? S.h(700, 250, 'Notes') + S.lines(700, 295, R - 700, BOTTOM, 40)
          : S.h(700, 250, 'Tasks') + S.checks(700, 305, R - 700, 14, 47);
        return S.wrap(s);
      }
      const ev = eventList(date, L, 250, R - L, 6);
      s += `<rect x="${L}" y="215" width="${R - L}" height="${ev.height + 40}" class="hit" data-newevent="${D.iso(date)}"/>` + ev.svg;
      const y0 = 260 + ev.height + 30;
      if (style === 'lined') s += S.h(L, y0, 'Notes') + S.lines(L, y0 + 45, R - L, BOTTOM, 40);
      else s += S.h(L, y0, 'Tasks') + S.checks(L, y0 + 55, R - L, Math.floor((BOTTOM - y0 - 55) / 48) + 1, 48);
      return S.wrap(s);
    }
    // Schedule style
    const g = LAND
      ? { x0: 140, x1: 760, top: 275, rh: 43, rx: 820, prio: [250, 295, 46], todo: [455, 500, 7, 44], notes: [830, 870] }
      : { x0: 140, x1: 590, top: 280, rh: 63, rx: 630, prio: [250, 300, 50], todo: [470, 520, 9, 48], notes: [990, 1030] };
    const { x0, x1, top, rh } = g, startH = 6, endH = 22;
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
      const y = top + (s0 - startH * 60) / 60 * rh, h = Math.max(24, (e0 - s0) / 60 * rh - 3);
      const w = (x1 - x0 - 6) / o.n;
      s += evChip(o.e, x0 + 4 + o.col * w, y + 1, w - 4, h, { charW: 8 });
    });
    // Right column
    const rx = g.rx, rw = R - rx;
    s += S.h(rx, g.prio[0], 'Top priorities') + S.checks(rx, g.prio[1], rw, 3, g.prio[2]);
    s += S.h(rx, g.todo[0], 'To-do') + S.checks(rx, g.todo[1], rw, g.todo[2], g.todo[3]);
    s += S.h(rx, g.notes[0], 'Notes') + S.lines(rx, g.notes[1], rw, BOTTOM, 40);
    return S.wrap(s);
  }

  const Layouts = { multiyear, year, quarter, month, week, day };
  window.Layouts = {
    render(view, date, planner, opts) {
      const orientation = (planner && planner.orientation) || 'portrait';
      const G = Templates.geom(orientation);
      LAND = orientation === 'landscape'; R = G.R; BOTTOM = G.H - 40;
      try { return (Layouts[view] || Layouts.day)(date, planner, opts); }
      finally { Templates.geom('portrait'); LAND = false; R = 940; BOTTOM = 1360; }
    },
  };
})();
