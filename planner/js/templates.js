/* Page templates (paper backgrounds) and planner templates (catalog presets).
 * Every page is drawn as SVG in a 1000 x 1400 logical coordinate space. Colors come from
 * CSS variables set by the planner's paper theme, so one template works in every theme. */
(function () {
  const W = 1000, H = 1400, L = 60, R = 940;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- SVG drawing helpers ---------- */
  const S = {
    esc,
    text: (x, y, s, cls = 't-s', extra = '') => `<text x="${x}" y="${y}" class="${cls}" ${extra}>${esc(s)}</text>`,
    line: (x1, y1, x2, y2, cls = 'ln') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}"/>`,
    rect: (x, y, w, h, cls = 'box', rx = 0, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" class="${cls}" ${extra}/>`,
    circle: (cx, cy, r, cls = 'box') => `<circle cx="${cx}" cy="${cy}" r="${r}" class="${cls}"/>`,
    lines(x, y0, w, y1, gap = 40, cls = 'ln') {
      let s = '';
      for (let y = y0; y <= y1; y += gap) s += S.line(x, y, x + w, y, cls);
      return s;
    },
    checks(x, y0, w, n, gap = 48) {
      let s = '';
      for (let i = 0; i < n; i++) {
        const y = y0 + i * gap;
        s += S.rect(x, y - 20, 20, 20, 'box', 4) + S.line(x + 34, y, x + w, y);
      }
      return s;
    },
    header(title, sub) {
      return S.text(L, 105, title, 't-title') +
        (sub ? S.text(R, 105, sub, 't-s', 'text-anchor="end"') : '') +
        S.line(L, 132, R, 132, 'ln-strong');
    },
    h(x, y, s) { return S.text(x, y, s.toUpperCase(), 't-h'); },
    field(x, y, w, label) {
      const lw = label.length * 10 + 16;
      return S.text(x, y, label, 't-s') + S.line(x + lw, y + 4, x + w, y + 4);
    },
    table(x, y, cols, rows, rowH = 48, opts = {}) {
      const totalW = cols.reduce((a, c) => a + c.w, 0);
      let s = S.rect(x, y, totalW, 40, 'fill-soft');
      let cx = x;
      cols.forEach(c => { s += S.text(cx + 10, y + 27, c.label.toUpperCase(), 't-th'); cx += c.w; });
      const top = y + 40, bottom = top + rows * rowH;
      for (let r = 0; r <= rows; r++) s += S.line(x, top + r * rowH, x + totalW, top + r * rowH);
      cx = x;
      cols.forEach((c, i) => {
        if (i > 0) s += S.line(cx, y, cx, bottom);
        if (c.check) for (let r = 0; r < rows; r++) s += S.rect(cx + c.w / 2 - 10, top + r * rowH + rowH / 2 - 10, 20, 20, 'box', 4);
        if (c.stars) for (let r = 0; r < rows; r++) s += S.text(cx + 10, top + r * rowH + rowH / 2 + 7, '☆☆☆☆☆', 't-s');
        cx += c.w;
      });
      if (opts.rowLabels) opts.rowLabels.forEach((lab, r) => { s += S.text(x + 10, top + r * rowH + rowH / 2 + 7, lab, 't-b'); });
      return s;
    },
    dots(x, y, w, h, gap = 40) {
      let s = '';
      for (let yy = y; yy <= y + h; yy += gap) for (let xx = x; xx <= x + w; xx += gap) s += `<circle cx="${xx}" cy="${yy}" r="2.2" class="dot"/>`;
      return s;
    },
    gridLines(x, y, w, h, gap = 40) {
      let s = '';
      for (let xx = x; xx <= x + w + 0.1; xx += gap) s += S.line(xx, y, xx, y + h, 'ln-faint');
      for (let yy = y; yy <= y + h + 0.1; yy += gap) s += S.line(x, yy, x + w, yy, 'ln-faint');
      return s;
    },
    wrap(inner, extraClass = '') {
      return `<svg class="page-svg ${extraClass}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="false">${inner}</svg>`;
    },
  };

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  /* ---------- Page templates ---------- */
  const PAGE_TEMPLATES = {
    lined: { name: 'Lined paper', cat: 'Creative', draw: () => S.lines(L, 140, R - L, 1360, 40) + S.line(130, 60, 130, 1370, 'ln-accent') },
    dot: { name: 'Dot grid', cat: 'Creative', draw: () => S.dots(60, 60, 880, 1280, 40) },
    graph: { name: 'Graph paper', cat: 'Creative', draw: () => S.gridLines(60, 60, 880, 1280, 40) },
    blank: { name: 'Blank', cat: 'Creative', draw: () => '' },
    sketch: { name: 'Sketchbook', cat: 'Creative', draw: () => S.rect(L, 60, R - L, 1220, 'box', 8) + S.field(L, 1330, 520, 'Title') + S.field(620, 1330, 320, 'Date') },
    cornell: {
      name: 'Cornell notes', cat: 'Education',
      draw: () => S.header('Class Notes') + S.field(L, 180, 520, 'Course') + S.field(620, 180, 320, 'Date') +
        S.h(L, 235, 'Cues') + S.h(330, 235, 'Notes') + S.line(310, 210, 310, 1110, 'ln-strong') +
        S.lines(L, 280, R - L, 1100, 40) + S.line(L, 1130, R, 1130, 'ln-strong') + S.h(L, 1170, 'Summary') + S.lines(L, 1210, R - L, 1350, 40),
    },
    todo: { name: 'To-do list', cat: 'Productivity', draw: () => S.header('To-Do List', 'Date ________') + S.h(L, 190, 'Tasks') + S.checks(L, 250, R - L, 23, 48) },
    daily: {
      name: 'Daily tasks', cat: 'Productivity',
      draw: () => S.header('Daily Tasks', 'Date ________') + S.h(L, 190, 'Top 3') + S.checks(L, 245, R - L, 3, 52) +
        S.h(L, 430, 'Must do') + S.checks(L, 485, 420, 10, 50) + S.h(520, 430, 'Should do') + S.checks(520, 485, 420, 10, 50) +
        S.h(L, 1010, 'Notes') + S.lines(L, 1050, R - L, 1350, 40),
    },
    'weekly-tasks': {
      name: 'Weekly tasks', cat: 'Productivity',
      draw: () => {
        let s = S.header('Weekly Tasks', 'Week of ________');
        DAYS.concat(['Next week']).forEach((d, i) => {
          const x = i % 2 ? 520 : L, y = 190 + Math.floor(i / 2) * 290;
          s += S.h(x, y, d) + S.checks(x, y + 50, 420, 5, 46);
        });
        return s;
      },
    },
    goals: {
      name: 'Goal planner', cat: 'Productivity',
      draw: () => {
        let s = S.header('Goals');
        [0, 1, 2].forEach(i => {
          const y = 190 + i * 390;
          s += S.rect(L, y - 30, R - L, 360, 'box', 12) + S.field(L + 20, y + 10, 840, `Goal ${i + 1}`) +
            S.text(L + 20, y + 60, 'Why it matters', 't-s') + S.lines(L + 20, y + 95, 840, y + 135, 40) +
            S.text(L + 20, y + 180, 'Steps', 't-s') + S.checks(L + 20, y + 220, 520, 3, 44) +
            S.field(600, y + 220, 300, 'Deadline');
        });
        return s;
      },
    },
    habit: {
      name: 'Habit tracker', cat: 'Productivity',
      draw: () => {
        let s = S.header('Habit Tracker', 'Month ________');
        const x0 = 290, cw = (R - x0) / 31, y0 = 190, rh = 52;
        s += S.text(L, y0 + 28, 'HABIT', 't-th');
        for (let d = 0; d < 31; d++) s += S.text(x0 + d * cw + cw / 2, y0 + 28, d + 1, 't-xs', 'text-anchor="middle"');
        for (let r = 0; r <= 14; r++) s += S.line(L, y0 + 40 + r * rh, R, y0 + 40 + r * rh);
        for (let d = 0; d <= 31; d++) s += S.line(x0 + d * cw, y0 + 40, x0 + d * cw, y0 + 40 + 14 * rh, 'ln-faint');
        s += S.h(L, 1000, 'Reflection') + S.lines(L, 1040, R - L, 1350, 40);
        return s;
      },
    },
    routine: {
      name: 'Daily routine', cat: 'Productivity',
      draw: () => S.header('Daily Routine') + ['Morning', 'Afternoon', 'Evening'].map((p, i) => S.h(L, 200 + i * 380, p) + S.checks(L, 255 + i * 380, R - L, 6, 50)).join(''),
    },
    project: {
      name: 'Project plan', cat: 'Professional',
      draw: () => S.header('Project Plan') + S.field(L, 185, 540, 'Project') + S.field(640, 185, 300, 'Due') + S.field(L, 235, 540, 'Owner') + S.field(640, 235, 300, 'Status') +
        S.h(L, 300, 'Objective') + S.lines(L, 340, R - L, 420, 40) +
        S.h(L, 480, 'Milestones') + S.table(L, 500, [{ label: 'Milestone', w: 520 }, { label: 'Due', w: 180 }, { label: 'Done', w: 180, check: true }], 7, 48) +
        S.h(L, 930, 'Tasks') + S.checks(L, 985, 420, 8, 46) + S.h(520, 930, 'Notes') + S.lines(520, 985, 420, 1310, 46),
    },
    meeting: {
      name: 'Meeting notes', cat: 'Professional',
      draw: () => S.header('Meeting Notes') + S.field(L, 185, 380, 'Date') + S.field(460, 185, 220, 'Time') + S.field(700, 185, 240, 'Room') +
        S.field(L, 235, R - L, 'Attendees') + S.h(L, 300, 'Agenda') + S.checks(L, 350, R - L, 4, 46) +
        S.h(L, 560, 'Notes') + S.lines(L, 600, R - L, 960, 40) +
        S.h(L, 1020, 'Action items') + S.table(L, 1040, [{ label: 'Action', w: 520 }, { label: 'Owner', w: 200 }, { label: 'Due', w: 160 }], 5, 50),
    },
    pomodoro: {
      name: 'Pomodoro planner', cat: 'Productivity',
      draw: () => {
        let s = S.header('Pomodoro Planner', '25 min focus · 5 min break');
        s += S.text(L, 190, 'TASK', 't-th') + S.text(600, 190, 'POMODOROS', 't-th');
        for (let i = 0; i < 12; i++) {
          const y = 250 + i * 66;
          s += S.line(L, y, 560, y);
          for (let k = 0; k < 8; k++) s += S.circle(615 + k * 42, y - 12, 15);
        }
        s += S.h(L, 1090, 'Distractions to park') + S.rect(L, 1110, R - L, 240, 'box', 12);
        return s;
      },
    },
    journal: { name: 'Journal', cat: 'Lifestyle', draw: () => S.header('Journal', 'Date ________') + S.lines(L, 200, R - L, 1360, 44) },
    gratitude: {
      name: 'Gratitude', cat: 'Lifestyle',
      draw: () => S.header('Gratitude', 'Date ________') + S.h(L, 195, "Today I'm grateful for") +
        [1, 2, 3].map(n => S.text(L, 205 + n * 60, n + '.', 't-b') + S.line(L + 30, 210 + n * 60, R, 210 + n * 60)).join('') +
        S.h(L, 480, 'Something good that happened') + S.lines(L, 525, R - L, 765, 48) +
        S.h(L, 830, 'Affirmation') + S.rect(L, 850, R - L, 140, 'fill-soft', 14) +
        S.h(L, 1050, 'Tomorrow I look forward to') + S.lines(L, 1095, R - L, 1335, 48),
    },
    budget: {
      name: 'Monthly budget', cat: 'Lifestyle',
      draw: () => S.header('Monthly Budget', 'Month ________') +
        S.h(L, 190, 'Income') + S.table(L, 205, [{ label: 'Source', w: 620 }, { label: 'Amount', w: 260 }], 4, 44) +
        S.h(L, 470, 'Expenses') + S.table(L, 485, [{ label: 'Category', w: 340 }, { label: 'Budget', w: 180 }, { label: 'Actual', w: 180 }, { label: 'Diff', w: 180 }], 13, 44,
          { rowLabels: ['Housing', 'Utilities', 'Groceries', 'Transport', 'Insurance', 'Health', 'Debt', 'Savings', 'Dining', 'Fun', 'Subscriptions', 'Gifts', 'Other'] }) +
        ['Income', 'Expenses', 'Left over'].map((t, i) => S.rect(L + i * 300, 1150, 280, 190, 'fill-soft', 14) + S.text(L + 20 + i * 300, 1190, t.toUpperCase(), 't-th')).join(''),
    },
    meals: {
      name: 'Meal planner', cat: 'Lifestyle',
      draw: () => S.header('Meal Planner', 'Week of ________') +
        S.table(L, 170, [{ label: '', w: 120 }, { label: 'Breakfast', w: 190 }, { label: 'Lunch', w: 190 }, { label: 'Dinner', w: 190 }, { label: 'Snacks', w: 190 }], 7, 100,
          { rowLabels: DAYS.map(d => d.slice(0, 3)) }) +
        S.h(L, 980, 'Grocery list') + S.checks(L, 1030, 420, 7, 46) + S.checks(520, 1030, 420, 7, 46),
    },
    household: {
      name: 'Household chores', cat: 'Lifestyle',
      draw: () => S.header('Household Chores', 'Week of ________') +
        S.table(L, 170, [{ label: 'Chore', w: 334 }].concat(DAYS.map(d => ({ label: d.slice(0, 3), w: 78, check: true }))), 16, 56) +
        S.h(L, 1170, 'Notes') + S.lines(L, 1210, R - L, 1350, 40),
    },
    travel: {
      name: 'Travel planner', cat: 'Lifestyle',
      draw: () => S.header('Travel Planner') + S.field(L, 185, 540, 'Destination') + S.field(640, 185, 300, 'Dates') +
        S.h(L, 250, 'Itinerary') + S.table(L, 265, [{ label: 'Day', w: 140 }, { label: 'Plans', w: 740 }], 7, 64) +
        S.h(L, 820, 'Packing list') + S.checks(L, 870, 280, 9, 46) + S.checks(360, 870, 280, 9, 46) +
        S.h(680, 820, 'Bookings') + S.rect(680, 840, 260, 440, 'box', 12),
    },
    fitness: {
      name: 'Workout log', cat: 'Lifestyle',
      draw: () => S.header('Workout Log', 'Date ________') +
        S.table(L, 170, [{ label: 'Exercise', w: 330 }, { label: 'Sets', w: 110 }, { label: 'Reps', w: 110 }, { label: 'Weight', w: 130 }, { label: 'Notes', w: 200 }], 14, 52) +
        S.h(L, 990, 'Cardio') + S.field(L, 1040, 420, 'Type') + S.field(520, 1040, 420, 'Duration') +
        S.h(L, 1110, 'How I felt') + S.lines(L, 1150, R - L, 1350, 40),
    },
    wellness: {
      name: 'Wellness check-in', cat: 'Lifestyle',
      draw: () => {
        let s = S.header('Wellness Check-in', 'Date ________');
        s += S.h(L, 195, 'Mood');
        ['😞', '😕', '😐', '🙂', '😄'].forEach((m, i) => { s += S.circle(L + 40 + i * 110, 260, 38) + S.text(L + 40 + i * 110, 273, m, 't-emoji', 'text-anchor="middle"'); });
        s += S.h(L, 350, 'Sleep (hours)');
        for (let i = 0; i < 12; i++) s += S.rect(L + i * 72, 370, 60, 60, 'box', 8) + S.text(L + 30 + i * 72, 408, i + 1, 't-xs', 'text-anchor="middle"');
        s += S.h(L, 490, 'Water');
        for (let i = 0; i < 8; i++) s += `<path d="M${L + i * 108} 510 h70 l-8 90 h-54 z" class="box"/>`;
        s += S.h(L, 670, 'Movement') + S.lines(L, 710, R - L, 790, 40);
        s += S.h(L, 850, 'Self-care') + S.checks(L, 900, 420, 5, 46) + S.h(520, 850, 'Notes') + S.lines(520, 900, 420, 1084, 46);
        s += S.h(L, 1150, 'One kind thing for myself') + S.rect(L, 1170, R - L, 170, 'fill-soft', 14);
        return s;
      },
    },
    reading: {
      name: 'Reading log', cat: 'Lifestyle',
      draw: () => S.header('Reading Log') + S.table(L, 160, [{ label: 'Title', w: 300 }, { label: 'Author', w: 200 }, { label: 'Started', w: 120 }, { label: 'Finished', w: 120 }, { label: 'Rating', w: 140, stars: true }], 20, 58),
    },
    client: {
      name: 'Client record', cat: 'Professional',
      draw: () => S.header('Client Record') + ['Name', 'Company', 'Email', 'Phone', 'Address'].map((f, i) => S.field(L, 190 + i * 52, R - L, f)).join('') +
        S.h(L, 490, 'Project details') + S.lines(L, 530, R - L, 690, 40) +
        S.h(L, 750, 'Contact log') + S.table(L, 770, [{ label: 'Date', w: 150 }, { label: 'Notes', w: 530 }, { label: 'Follow-up', w: 200 }], 10, 54),
    },
    social: {
      name: 'Social media planner', cat: 'Professional',
      draw: () => S.header('Social Media Planner', 'Month ________') +
        S.table(L, 160, [{ label: 'Date', w: 110 }, { label: 'Platform', w: 150 }, { label: 'Content', w: 300 }, { label: 'Caption / tags', w: 240 }, { label: 'Posted', w: 80, check: true }], 18, 62),
    },
    lesson: {
      name: 'Lesson plan', cat: 'Education',
      draw: () => S.header('Lesson Plan') + S.field(L, 185, 400, 'Subject') + S.field(480, 185, 200, 'Grade') + S.field(700, 185, 240, 'Date') +
        S.h(L, 250, 'Objectives') + S.lines(L, 290, R - L, 370, 40) +
        S.h(L, 430, 'Materials') + S.lines(L, 470, R - L, 510, 40) +
        S.h(L, 570, 'Activities') + S.table(L, 585, [{ label: 'Time', w: 140 }, { label: 'Activity', w: 740 }], 6, 60) +
        S.h(L, 1050, 'Assessment') + S.lines(L, 1090, R - L, 1170, 40) +
        S.h(L, 1230, 'Homework') + S.lines(L, 1270, R - L, 1350, 40),
    },
    assignment: {
      name: 'Assignment tracker', cat: 'Education',
      draw: () => S.header('Assignment Tracker') + S.table(L, 160, [{ label: 'Subject', w: 180 }, { label: 'Assignment', w: 450 }, { label: 'Due', w: 150 }, { label: 'Done', w: 100, check: true }], 20, 58),
    },
  };

  /* ---------- Planner templates (catalog) ---------- */
  const DATED = ['year', 'quarter', 'month', 'week', 'day'];
  const PLANNER_TEMPLATES = [
    { id: 'classic', name: 'Classic Planner', cat: 'Productivity', color: '#3d5a80', theme: 'classic', views: DATED, desc: 'Year to day, plus goals, to-dos and notes.', sections: [['Goals', ['goals']], ['To-Do', ['todo', 'daily']], ['Notes', ['lined', 'lined', 'dot']]] },
    { id: 'focus', name: 'Focus & Productivity', cat: 'Productivity', color: '#c8553d', theme: 'sand', views: ['month', 'week', 'day'], desc: 'Pomodoro sessions, routines and weekly tasks.', sections: [['Focus', ['pomodoro', 'pomodoro']], ['Routines', ['routine']], ['Weekly', ['weekly-tasks']], ['Habits', ['habit']]] },
    { id: 'work', name: 'Work & Business', cat: 'Professional', color: '#1f3a5f', theme: 'classic', views: ['quarter', 'month', 'week', 'day'], desc: 'Projects, meetings and client records.', sections: [['Projects', ['project', 'project']], ['Meetings', ['meeting', 'meeting', 'meeting']], ['Clients', ['client', 'client']], ['Notes', ['dot', 'dot']]] },
    { id: 'social', name: 'Social Media Planner', cat: 'Professional', color: '#8e5572', theme: 'blush', views: ['month', 'week'], desc: 'Content calendar, post log and idea pages.', sections: [['Content', ['social', 'social']], ['Ideas', ['dot', 'dot']]] },
    { id: 'student', name: 'Student Planner', cat: 'Education', color: '#2a9d8f', theme: 'classic', views: ['month', 'week', 'day'], desc: 'Class notes, assignments and a weekly view.', sections: [['Classes', ['cornell', 'cornell', 'cornell']], ['Assignments', ['assignment']], ['Notes', ['lined', 'graph']]] },
    { id: 'teacher', name: 'Teacher Planner', cat: 'Education', color: '#e09f3e', theme: 'sand', views: ['year', 'month', 'week'], desc: 'Lesson plans, notes and a school-year view.', sections: [['Lessons', ['lesson', 'lesson', 'lesson']], ['Notes', ['lined']]] },
    { id: 'wellness', name: 'Wellness Journal', cat: 'Lifestyle', color: '#6a994e', theme: 'sage', views: ['month', 'week', 'day'], desc: 'Habits, mood, fitness, meals and gratitude.', sections: [['Habits', ['habit']], ['Wellness', ['wellness', 'wellness']], ['Fitness', ['fitness']], ['Meals', ['meals']], ['Gratitude', ['gratitude', 'gratitude']], ['Journal', ['journal', 'journal']]] },
    { id: 'home', name: 'Home & Budget', cat: 'Lifestyle', color: '#bc6c25', theme: 'sand', views: ['month', 'week'], desc: 'Budget, meals and chores for the household.', sections: [['Budget', ['budget']], ['Meals', ['meals']], ['Chores', ['household']], ['Lists', ['todo']]] },
    { id: 'travel', name: 'Travel Planner', cat: 'Lifestyle', color: '#457b9d', theme: 'classic', views: ['month', 'day'], desc: 'Trip itineraries, packing lists and journals.', sections: [['Trips', ['travel', 'travel']], ['Packing', ['todo']], ['Journal', ['journal']]] },
    { id: 'reading', name: 'Reading Journal', cat: 'Lifestyle', color: '#6d597a', theme: 'blush', views: ['year', 'month'], desc: 'Reading log and book notes.', sections: [['Log', ['reading']], ['Book notes', ['lined', 'lined']]] },
    { id: 'sketch', name: 'Sketchbook', cat: 'Creative', color: '#343a40', theme: 'classic', views: [], desc: 'Blank framed pages for drawing.', sections: [['Sketches', ['sketch', 'sketch', 'sketch', 'blank']]] },
    { id: 'notebook-lined', name: 'Lined Notebook', cat: 'Creative', color: '#264653', theme: 'classic', views: [], desc: 'A simple ruled notebook.', sections: [['Notes', ['lined', 'lined', 'lined']]] },
    { id: 'notebook-dot', name: 'Dot-Grid Notebook', cat: 'Creative', color: '#9c6644', theme: 'sand', views: [], desc: 'Dot grid for bullet journaling.', sections: [['Pages', ['dot', 'dot', 'dot']]] },
    { id: 'notebook-graph', name: 'Graph Notebook', cat: 'Creative', color: '#4a4e69', theme: 'classic', views: [], desc: 'Squared paper for diagrams and math.', sections: [['Pages', ['graph', 'graph', 'graph']]] },
    { id: 'multiyear', name: 'Five-Year Planner', cat: 'Productivity', color: '#5f0f40', theme: 'midnight', views: ['multiyear', 'year', 'quarter'], desc: 'Long-range goals across five years.', sections: [['Big goals', ['goals', 'goals']]] },
    { id: 'blank', name: 'Blank Planner', cat: 'Productivity', color: '#6c757d', theme: 'classic', views: DATED, desc: 'All date views, no extra sections.', sections: [] },
  ];

  const CATEGORIES = ['Productivity', 'Professional', 'Education', 'Lifestyle', 'Creative'];

  function renderPageTemplate(id) {
    const t = PAGE_TEMPLATES[id] || PAGE_TEMPLATES.blank;
    return S.wrap(t.draw());
  }

  window.Templates = { S, W, H, L, R, PAGE_TEMPLATES, PLANNER_TEMPLATES, CATEGORIES, renderPageTemplate, esc };
})();
