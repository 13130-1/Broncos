/* App controller: bookshelf, planner screen, dialogs, keyboard, sync status. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = Templates.esc;
  const { VIEW_NAMES, ALL_VIEWS } = Store;
  const FINE_TO_COARSE = ['day', 'week', 'month', 'quarter', 'year', 'multiyear'];
  const SECTION_COLORS = ['#e76f51', '#2a9d8f', '#e9c46a', '#8ab17d', '#9c89b8', '#f4a261', '#577590', '#d62828'];
  const COVER_COLORS = ['#3d5a80', '#1f3a5f', '#2a9d8f', '#6a994e', '#bc6c25', '#c8553d', '#8e5572', '#6d597a', '#5f0f40', '#343a40', '#e09f3e', '#457b9d'];
  const THEMES = { classic: 'Classic white', sand: 'Cream', sage: 'Sage', blush: 'Blush', midnight: 'Midnight' };
  const COVERS = { solid: 'Solid', stripes: 'Stripes', dots: 'Dots', linen: 'Linen', grid: 'Grid' };
  const PEN_COLORS = ['#1d2b3a', '#c1121f', '#1d4ed8', '#15803d', '#7c3aed', '#ea580c', '#ffffff'];
  const HL_COLORS = ['#ffe066', '#a7f3d0', '#fbcfe8', '#bae6fd', '#fed7aa'];
  const EMOJI = ['⭐', '❤️', '✅', '📌', '🎉', '☕', '💡', '📚', '✈️', '🎂', '🏋️', '🌿', '🔥', '🌙', '☀️', '🎵', '💰', '🍎', '🐾', '✨', '⚠️', '📞', '🧘', '🏠'];
  const LABELS = [['Important', '#ef476f', '#fff'], ['Due', '#ffd166', '#3b2f00'], ['Done', '#06d6a0', '#053b2c'], ['Meeting', '#118ab2', '#fff'], ['Birthday', '#f78c6b', '#fff'], ['Payday', '#83c5be', '#0b3b37'], ['Self-care', '#cdb4db', '#3a2546'], ['Workout', '#2b2d42', '#fff'], ['Travel', '#8ecae6', '#06324a'], ['Note', '#fefae0', '#4a4320']];

  const ICONS = {
    hand: 'M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8l-1.8-1.8a2 2 0 0 0-2.8 2.8L7 20.5A6 6 0 0 0 11.5 22H13a6 6 0 0 0 6-6v-5a2 2 0 0 0-4 0',
    pen: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z',
    highlighter: 'm9 11-6 6v3h9l3-3M22 12l-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4',
    eraser: 'm7 21-4.3-4.3a1 1 0 0 1 0-1.4l10-10a1 1 0 0 1 1.4 0l5.6 5.6a1 1 0 0 1 0 1.4L13 19M22 21H7M5 11l9 9',
    select: 'M4 4l7 17 2.5-7.5L21 11Z',
    text: 'M4 7V4h16v3M9 20h6M12 4v16',
    sticker: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1Z',
    image: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3M21 15l-5-5L5 21',
    undo: 'M3 7v6h6M21 17a9 9 0 0 0-15-6.7L3 13',
    redo: 'M21 7v6h-6M3 17a9 9 0 0 1 15-6.7L21 13',
    calPlus: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM12 13v5M9.5 15.5h5',
    cal: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
    minus: 'M5 12h14', plus: 'M12 5v14M5 12h14',
    trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
    left: 'm15 18-6-6 6-6', right: 'm9 18 6-6-6-6',
    more: 'M5 12h.01M12 12h.01M19 12h.01',
    cloud: 'M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9Z',
    sliders: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
    help: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01',
    book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15ZM6.5 22H20v-5',
    front: 'M8 8h12v12H8zM4 16V4h12',
  };
  const icon = n => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[n]}"/></svg>`;

  let pid = null;

  /* ---------- Utilities ---------- */
  function toast(msg, ms = 2600) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), ms);
  }
  function ago(ts) {
    if (!ts) return 'never';
    const s = Math.round((Date.now() - ts) / 1000);
    if (s < 45) return 'just now';
    if (s < 3600) return Math.round(s / 60) + ' min ago';
    if (s < 86400) return Math.round(s / 3600) + ' h ago';
    return Math.round(s / 86400) + ' d ago';
  }
  function inkOn(hex) {
    const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) > 160 ? '#1b1b1b' : '#ffffff';
  }
  function download(name, text, type = 'application/json') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function pickFile(accept) {
    return new Promise(res => {
      const i = document.createElement('input');
      i.type = 'file'; i.accept = accept;
      i.onchange = () => res(i.files[0] || null);
      i.click();
    });
  }

  /* ---------- Dialog helpers ---------- */
  function dialog(title, body, { footer = '', wide = false, onMount } = {}) {
    const d = document.createElement('dialog');
    d.className = 'dlg' + (wide ? ' wide' : '');
    d.setAttribute('aria-label', title);
    d.innerHTML = `<div class="dlg-inner"><header class="dlg-head"><h2>${esc(title)}</h2>
      <button class="icon-btn" data-close aria-label="Close">×</button></header>
      <div class="dlg-body">${body}</div>${footer ? `<footer class="dlg-foot">${footer}</footer>` : ''}</div>`;
    document.body.appendChild(d);
    d.addEventListener('close', () => d.remove());
    d.addEventListener('click', e => { if (e.target === d) d.close(); });
    d.addEventListener('click', e => { if (e.target.closest('[data-close]')) d.close(); });
    onMount && onMount(d);
    d.showModal();
    return d;
  }
  function confirmDlg(msg, ok = 'OK', danger = false) {
    return new Promise(res => {
      let result = false;
      const d = dialog('Please confirm', `<p>${esc(msg)}</p>`, {
        footer: `<button data-close>Cancel</button><button class="${danger ? 'danger' : 'primary'}" data-ok>${esc(ok)}</button>`,
        onMount: d => { d.querySelector('[data-ok]').onclick = () => { result = true; d.close(); }; },
      });
      d.addEventListener('close', () => res(result));
    });
  }
  function promptDlg(title, value = '', label = 'Name') {
    return new Promise(res => {
      let result = null;
      const d = dialog(title, `<label class="field"><span>${esc(label)}</span><input type="text" value="${esc(value)}" maxlength="80"></label>`, {
        footer: '<button data-close>Cancel</button><button class="primary" data-ok>Save</button>',
        onMount: d => {
          const inp = d.querySelector('input');
          const ok = () => { result = inp.value.trim() || null; d.close(); };
          d.querySelector('[data-ok]').onclick = ok;
          inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ok(); } });
          setTimeout(() => inp.select(), 30);
        },
      });
      d.addEventListener('close', () => res(result));
    });
  }

  /* ---------- Orientation ---------- */
  const deviceOrientation = () => (window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
  const isLand = p => p.orientation === 'landscape';
  // Each orientation has its own page design, so writing is stored per orientation.
  // Portrait daily pages are two pages (plan, notes); landscape shows both as one spread
  /* ---------- Multi-page views ----------
   * Some dated views span several pages, like a paper planner. Landscape shows two
   * pages side by side, so it needs fewer page turns than portrait. */
  function subPages(p, view) {
    const L = isLand(p);
    switch (view) {
      case 'week': return L ? ['preview', 'days'] : ['preview', 'preview2', 'days'];
      case 'day': return (p.dayStyle || 'schedule') === 'schedule' && !L ? ['plan', 'notes'] : ['plan'];
      case 'year': return L ? ['all'] : ['h1', 'h2'];
      case 'quarter': return L ? ['all'] : ['qp1', 'qp2'];
      default: return ['main'];
    }
  }
  const SUB_DEFAULT = { week: 'days' };
  const SUB_LABEL = { preview: 'Weekly preview', preview2: 'Preview (2)', days: '7-day view', plan: 'Plan', notes: 'Notes', h1: 'Jan–Jun', h2: 'Jul–Dec', qp1: 'Review', qp2: 'Plan ahead' };
  const SUB_TITLE = { preview: 'Weekly preview', preview2: 'Weekly preview 2/2', notes: 'Notes', h1: '12-month view, Jan–Jun', h2: '12-month view, Jul–Dec', qp1: 'Quarterly preview 1/2', qp2: 'Quarterly preview 2/2' };
  // Secondary pages store their writing under their own key
  const SUB_KEY = { preview: 'weekpreview', preview2: 'weekpreview2', notes: 'daynotes', h2: 'year-h2', qp2: 'quarter-qp2' };
  function curSub(p, u) {
    const list = subPages(p, u.view);
    u.sub = u.sub || {};
    let sub = u.sub[u.view];
    if (!list.includes(sub)) {
      if (sub === 'preview2') sub = 'preview';
      if (!list.includes(sub)) sub = list.includes(SUB_DEFAULT[u.view]) ? SUB_DEFAULT[u.view] : list[0];
      u.sub[u.view] = sub;
    }
    return sub;
  }
  const contentKey = (p, base) => base + (isLand(p) ? '@L' : '');
  const pageUsed = (pid_, pgId) => Store.hasContent(pid_, 'page:' + pgId) || Store.hasContent(pid_, 'page:' + pgId + '@L');
  const ORIENT_ICON = { portrait: 'M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z', landscape: 'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z' };
  const orientIcon = o => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="${ORIENT_ICON[o]}"/></svg>`;
  function toggleOrientation() {
    const p = planner(); if (!p) return;
    const next = isLand(p) ? 'portrait' : 'landscape';
    Store.updatePlanner(p.id, { orientation: next });
    Editor.setZoom(1);
    renderToolbar(); renderPlanner();
    toast(next === 'landscape' ? 'Landscape pages' : 'Portrait pages');
  }

  /* ---------- Planner creation ---------- */
  const tpl = id => Templates.PLANNER_TEMPLATES.find(t => t.id === id);
  function createFromTemplate(t, name, orientation) {
    return Store.addPlanner({
      name, color: t.color, orientation: orientation || deviceOrientation(), theme: t.theme, views: [...t.views], templateId: t.id,
      sections: t.sections.map(([n, pages], i) => ({ id: Store.uid(), name: n, color: SECTION_COLORS[i % SECTION_COLORS.length], pages: pages.map(tp => ({ id: Store.uid(), template: tp })) })),
    });
  }

  function seed() {
    const local = Store.addCalendar({ name: 'Planner', color: '#e76f51', source: 'Planner' });
    Store.state.defaultCalendarId = local.id;
    Calendars.connect('Google');
    const t = D.today();
    Store.saveEvent({ calendarId: local.id, title: 'Plan the week', date: D.iso(D.startOfWeek(t)), time: '08:00', endTime: '08:30', recurrence: 'weekly', notes: '' });
    const p1 = createFromTemplate(tpl('classic'), `My ${t.getFullYear()} Planner`);
    createFromTemplate(tpl('wellness'), 'Wellness Journal');
    createFromTemplate(tpl('work'), 'Work Notebook');
    const welcomeText = 'Pick the pen to write here. In Navigate mode, tap any date to jump to it, swipe to turn pages, and double-click a time to add an event.';
    const welcome = (sx, sy, tx, ty, tw, th, size) => ({
      strokes: [], items: [
        { id: Store.uid(), type: 'sticker', kind: 'label', text: 'Welcome!', shape: 'banner', bg: '#ffd166', color: '#3b2f00', shade: true, pad: 10, x: sx, y: sy, w: 250, h: 70, rot: -4 },
        { id: Store.uid(), type: 'text', x: tx, y: ty, w: tw, h: th, rot: 0, size, color: '#1d2b3a', font: 'hand', bold: false, italic: false, align: 'left', text: welcomeText },
      ],
    });
    // Put the note on today's page in both orientations
    Store.setContent(p1.id, 'daynotes:' + D.iso(t), welcome(110, 262, 120, 345, 700, 120, 24));
    Store.setContent(p1.id, D.key('day', t) + '@L', welcome(780, 196, 790, 270, 520, 110, 19));
    Store.state.sync.pending = 0;
    Store.state.sync.lastSynced = Date.now();
  }

  /* ---------- Routing ---------- */
  function route() {
    const m = location.hash.match(/^#\/p\/(\w+)/);
    Editor.finishEditing();
    if (m && Store.planner(m[1])) openPlanner(m[1]);
    else showShelf();
  }
  function showShelf() {
    pid = null;
    $('#plannerScreen').hidden = true;
    $('#shelf').hidden = false;
    document.title = 'My Bookshelf · Digital Planner';
    renderShelf();
  }
  function openPlanner(id) {
    pid = id;
    const p = Store.planner(id);
    p.openedAt = Date.now(); Store.touch({ silent: true });
    $('#shelf').hidden = true;
    $('#plannerScreen').hidden = false;
    document.title = p.name + ' · Digital Planner';
    renderToolbar();
    Editor.relayout();
    renderPlanner();
  }

  /* ---------- Bookshelf ---------- */
  function renderShelf() {
    const q = ($('#shelfSearch').value || '').toLowerCase();
    const sort = Store.state.prefs.shelfSort;
    $('#shelfSort').value = sort;
    let list = Store.planners().filter(p => p.name.toLowerCase().includes(q));
    list.sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'created' ? b.createdAt - a.createdAt : (b.openedAt || 0) - (a.openedAt || 0));
    const sub = p => [p.views.length ? `${p.views.length} layout${p.views.length > 1 ? 's' : ''}` : '', p.sections.length ? `${p.sections.length} section${p.sections.length > 1 ? 's' : ''}` : ''].filter(Boolean).join(' · ') || 'Empty';
    $('#shelfGrid').innerHTML = list.map(p => `
      <article class="book" style="--c:${p.color};--ci:${inkOn(p.color)}">
        <button class="book-cover cover-${p.cover || 'solid'}" data-open="${p.id}" aria-label="Open ${esc(p.name)}">
          <span class="book-band"></span>
          <span class="book-title">${esc(p.name)}</span>
          <span class="book-sub">${esc(sub(p))}</span>
        </button>
        <div class="book-meta">
          <div><strong>${esc(p.name)}</strong><small>Edited ${ago(p.updatedAt)}</small></div>
          <button class="icon-btn" data-menu="${p.id}" aria-label="More actions for ${esc(p.name)}" aria-haspopup="menu">${icon('more')}</button>
        </div>
      </article>`).join('') +
      `<button class="book-new" id="btnNewCard">${icon('plus')}<span>New planner</span><small>Start from a template</small></button>`;
    if (!list.length && q) $('#shelfGrid').insertAdjacentHTML('afterbegin', `<p class="empty">No planners match “${esc(q)}”.</p>`);
  }

  function bookMenu(btn, id) {
    closeMenu();
    const p = Store.planner(id);
    const m = document.createElement('div');
    m.className = 'menu'; m.setAttribute('role', 'menu');
    m.innerHTML = ['Open', 'Rename', 'Customize', 'Duplicate', 'Delete'].map(a => `<button role="menuitem" data-act="${a}" class="${a === 'Delete' ? 'danger-text' : ''}">${a}</button>`).join('');
    document.body.appendChild(m);
    const r = btn.getBoundingClientRect();
    m.style.top = Math.min(window.innerHeight - m.offsetHeight - 8, r.bottom + 4) + 'px';
    m.style.left = Math.max(8, Math.min(window.innerWidth - m.offsetWidth - 8, r.right - m.offsetWidth)) + 'px';
    m.querySelector('button').focus();
    m.addEventListener('click', async e => {
      const a = e.target.dataset.act; if (!a) return;
      closeMenu();
      if (a === 'Open') location.hash = '#/p/' + id;
      if (a === 'Rename') { const n = await promptDlg('Rename planner', p.name); if (n) { Store.updatePlanner(id, { name: n }); renderShelf(); } }
      if (a === 'Customize') customizeDialog(id, renderShelf);
      if (a === 'Duplicate') { Store.duplicatePlanner(id); renderShelf(); toast('Planner duplicated'); }
      if (a === 'Delete') { if (await confirmDlg(`Delete “${p.name}”? This removes it from all your devices.`, 'Delete', true)) { Store.deletePlanner(id); renderShelf(); toast('Planner deleted'); } }
    });
    m.addEventListener('keydown', e => {
      const items = $$('button', m), i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      if (e.key === 'Escape') { closeMenu(); btn.focus(); }
    });
    setTimeout(() => document.addEventListener('pointerdown', outside), 0);
    function outside(e) { if (!m.contains(e.target)) closeMenu(); }
    m._cleanup = () => document.removeEventListener('pointerdown', outside);
  }
  function closeMenu() { $$('.menu').forEach(m => { m._cleanup && m._cleanup(); m.remove(); }); }

  /* ---------- Template library ---------- */
  function thumbFor(t) {
    const mini = svg => `<div class="page-mini theme-${t.theme}" style="--pc:${t.color}">${svg}</div>`;
    const pages = [];
    if (t.views.length) pages.push(Layouts.render(t.views.includes('month') ? 'month' : t.views[0], D.today(), { dayStyle: 'schedule' }));
    if (t.sections.length) pages.push(Templates.renderPageTemplate(t.sections[0][1][0]));
    return { html: pages.map(mini).join(''), single: pages.length === 1 };
  }
  function libraryDialog() {
    let cat = 'All', chosen = null, customName = false;
    const cats = ['All', ...Templates.CATEGORIES];
    dialog('New planner', `
      <div class="lib-tools">
        <input type="search" class="lib-search" placeholder="Search templates" aria-label="Search templates">
        <div class="chips" role="group" aria-label="Category">${cats.map(c => `<button class="chip" data-cat="${c}" aria-pressed="${c === 'All'}">${c}</button>`).join('')}</div>
      </div>
      <div class="lib-grid"></div>`, {
      wide: true,
      footer: `<label class="field inline"><span>Name</span><input type="text" class="lib-name" placeholder="Choose a template" maxlength="80"></label>
        <div class="seg lib-orient" role="group" aria-label="Page orientation"><button type="button" data-v="portrait">${orientIcon('portrait')} Portrait</button><button type="button" data-v="landscape">${orientIcon('landscape')} Landscape</button></div>
        <button data-close>Cancel</button><button class="primary lib-create" disabled>Create planner</button>`,
      onMount: d => {
        const grid = d.querySelector('.lib-grid'), search = d.querySelector('.lib-search'), nameIn = d.querySelector('.lib-name'), create = d.querySelector('.lib-create');
        let orient = deviceOrientation();
        const og = d.querySelector('.lib-orient');
        const syncO = () => $$('button', og).forEach(b => b.setAttribute('aria-pressed', b.dataset.v === orient));
        syncO();
        og.onclick = e => { const b = e.target.closest('button'); if (b) { orient = b.dataset.v; syncO(); } };
        const draw = () => {
          const q = search.value.toLowerCase();
          const list = Templates.PLANNER_TEMPLATES.filter(t => (cat === 'All' || t.cat === cat) &&
            (t.name + ' ' + t.desc + ' ' + t.sections.map(s => s[0]).join(' ')).toLowerCase().includes(q));
          grid.innerHTML = list.map(t => `
            <button class="tpl-card${chosen === t.id ? ' on' : ''}" data-id="${t.id}" aria-pressed="${chosen === t.id}">
              ${(th => `<div class="tpl-thumb${th.single ? ' single' : ''}">${th.html}</div>`)(thumbFor(t))}
              <div class="tpl-info"><strong>${esc(t.name)}</strong><span class="tag">${t.cat}</span>
              <small>${esc(t.desc)}</small>
              <small class="muted">${[t.views.map(v => VIEW_NAMES[v]).join(', '), t.sections.length ? t.sections.map(s => s[0]).join(', ') : ''].filter(Boolean).join(' · ')}</small></div>
            </button>`).join('') || '<p class="empty">No templates match your search.</p>';
        };
        draw();
        search.oninput = draw;
        d.querySelector('.chips').onclick = e => {
          const b = e.target.closest('[data-cat]'); if (!b) return;
          cat = b.dataset.cat;
          $$('.chip', d).forEach(c => c.setAttribute('aria-pressed', c === b));
          draw();
        };
        grid.onclick = e => {
          const b = e.target.closest('.tpl-card'); if (!b) return;
          chosen = b.dataset.id;
          if (!customName) nameIn.value = tpl(chosen).name;
          create.disabled = false;
          $$('.tpl-card', grid).forEach(c => { c.classList.toggle('on', c === b); c.setAttribute('aria-pressed', c === b); });
        };
        grid.ondblclick = e => { if (e.target.closest('.tpl-card')) create.click(); };
        nameIn.oninput = () => { customName = !!nameIn.value; };
        create.onclick = () => {
          const t = tpl(chosen); if (!t) return;
          const p = createFromTemplate(t, nameIn.value.trim() || t.name, orient);
          d.close();
          location.hash = '#/p/' + p.id;
          toast(`Created “${p.name}”`);
        };
        setTimeout(() => search.focus(), 30);
      },
    });
  }

  /* ---------- Customize planner ---------- */
  function customizeDialog(id, after) {
    const p = Store.planner(id);
    const draft = JSON.parse(JSON.stringify({ name: p.name, color: p.color, cover: p.cover || 'solid', theme: p.theme, views: p.views, dayStyle: p.dayStyle || 'schedule', orientation: p.orientation || 'portrait', sections: p.sections }));
    const body = `
      <label class="field"><span>Name</span><input type="text" name="name" maxlength="80"></label>
      <div class="cz-grid">
        <fieldset><legend>Cover color</legend><div class="swatches cover-sw"></div></fieldset>
        <fieldset><legend>Cover pattern</legend><div class="seg" data-k="cover">${Object.entries(COVERS).map(([k, v]) => `<button type="button" data-v="${k}">${v}</button>`).join('')}</div></fieldset>
        <fieldset><legend>Paper theme</legend><div class="seg" data-k="theme">${Object.entries(THEMES).map(([k, v]) => `<button type="button" data-v="${k}"><i class="paper-dot theme-${k}"></i>${v}</button>`).join('')}</div></fieldset>
        <fieldset><legend>Date layouts</legend><div class="checks">${ALL_VIEWS.map(v => `<label><input type="checkbox" value="${v}"> ${VIEW_NAMES[v]}</label>`).join('')}</div>
          <p class="note">Hiding a layout never deletes what you wrote on it. Turn it back on and your pages return.</p></fieldset>
        <fieldset><legend>Page orientation</legend><div class="seg" data-k="orientation"><button type="button" data-v="portrait">${orientIcon('portrait')} Portrait</button><button type="button" data-v="landscape">${orientIcon('landscape')} Landscape</button></div>
          <p class="note">Each orientation has its own page layout, so writing stays with the orientation it was made in. Switch back any time to see it.</p></fieldset>
        <fieldset><legend>Day page style</legend><div class="seg" data-k="dayStyle"><button type="button" data-v="schedule">Hourly schedule</button><button type="button" data-v="lined">Lined notes</button><button type="button" data-v="checklist">Checklist</button></div></fieldset>
      </div>
      <fieldset><legend>Sections</legend><ol class="sec-list"></ol><button type="button" class="add-sec">${icon('plus')} Add section</button></fieldset>
      <div class="cz-preview"><div class="book-cover"><span class="book-band"></span><span class="book-title"></span></div></div>`;
    dialog('Customize planner', body, {
      wide: true,
      footer: '<button data-close>Cancel</button><button class="primary" data-save>Save changes</button>',
      onMount: d => {
        const nameIn = d.querySelector('[name=name]');
        nameIn.value = draft.name;
        const preview = () => {
          const c = d.querySelector('.cz-preview .book-cover');
          c.className = 'book-cover cover-' + draft.cover;
          c.parentElement.style.cssText = `--c:${draft.color};--ci:${inkOn(draft.color)}`;
          c.querySelector('.book-title').textContent = nameIn.value || 'Untitled';
        };
        nameIn.oninput = () => { draft.name = nameIn.value; preview(); };
        const sw = d.querySelector('.cover-sw');
        const drawSw = () => {
          sw.innerHTML = COVER_COLORS.map(c => `<button type="button" class="sw${c === draft.color ? ' on' : ''}" style="background:${c}" data-c="${c}" aria-label="Color ${c}" aria-pressed="${c === draft.color}"></button>`).join('') +
            `<label class="sw custom" title="Custom color"><input type="color" value="${draft.color}" aria-label="Custom cover color"></label>`;
        };
        drawSw();
        sw.onclick = e => { const b = e.target.closest('[data-c]'); if (b) { draft.color = b.dataset.c; drawSw(); preview(); } };
        sw.oninput = e => { if (e.target.type === 'color') { draft.color = e.target.value; preview(); } };
        $$('.seg', d).forEach(seg => {
          const k = seg.dataset.k;
          const sync = () => $$('button', seg).forEach(b => b.setAttribute('aria-pressed', b.dataset.v === draft[k]));
          sync();
          seg.onclick = e => { const b = e.target.closest('button'); if (b) { draft[k] = b.dataset.v; sync(); preview(); } };
        });
        $$('.checks input', d).forEach(cb => {
          cb.checked = draft.views.includes(cb.value);
          cb.onchange = () => { draft.views = ALL_VIEWS.filter(v => $(`.checks input[value=${v}]`, d).checked); };
        });
        const list = d.querySelector('.sec-list');
        const drawSecs = () => {
          list.innerHTML = draft.sections.map((s, i) => `
            <li data-i="${i}">
              <input type="color" value="${s.color}" aria-label="Tab color for ${esc(s.name)}" data-f="color">
              <input type="text" value="${esc(s.name)}" aria-label="Section name" data-f="name" maxlength="40">
              <small>${s.pages.length} page${s.pages.length > 1 ? 's' : ''}</small>
              <button type="button" class="icon-btn" data-a="up" aria-label="Move up" ${i === 0 ? 'disabled' : ''}>↑</button>
              <button type="button" class="icon-btn" data-a="down" aria-label="Move down" ${i === draft.sections.length - 1 ? 'disabled' : ''}>↓</button>
              <button type="button" class="icon-btn" data-a="del" aria-label="Delete section">${icon('trash')}</button>
            </li>`).join('') || '<li class="muted">No sections yet.</li>';
        };
        drawSecs();
        list.oninput = e => { const li = e.target.closest('li'); if (li && e.target.dataset.f) draft.sections[li.dataset.i][e.target.dataset.f] = e.target.value; };
        list.onclick = async e => {
          const b = e.target.closest('[data-a]'); if (!b) return;
          const i = +b.closest('li').dataset.i, s = draft.sections;
          if (b.dataset.a === 'up') [s[i - 1], s[i]] = [s[i], s[i - 1]];
          if (b.dataset.a === 'down') [s[i + 1], s[i]] = [s[i], s[i + 1]];
          if (b.dataset.a === 'del') {
            const used = s[i].pages.some(pg => pageUsed(id, pg.id));
            if (used && !(await confirmDlg(`“${s[i].name}” has pages with writing on them. Delete the section and its pages?`, 'Delete section', true))) return;
            s.splice(i, 1);
          }
          drawSecs();
        };
        d.querySelector('.add-sec').onclick = () => {
          draft.sections.push({ id: Store.uid(), name: 'New section', color: SECTION_COLORS[draft.sections.length % SECTION_COLORS.length], pages: [{ id: Store.uid(), template: 'lined' }] });
          drawSecs();
          const inputs = $$('.sec-list input[type=text]', d); inputs[inputs.length - 1].select();
        };
        preview();
        d.querySelector('[data-save]').onclick = () => {
          if (!draft.name.trim()) { nameIn.focus(); toast('Give your planner a name'); return; }
          if (!draft.views.length && !draft.sections.length) { toast('Keep at least one layout or section'); return; }
          draft.sections.forEach(s => { s.name = s.name.trim() || 'Untitled'; });
          Store.updatePlanner(id, draft);
          d.close();
          after && after();
          toast('Planner updated');
        };
      },
    });
  }

  /* ---------- Planner screen ---------- */
  const planner = () => Store.planner(pid);
  function ui() {
    const p = planner(), all = Store.state.ui;
    let u = all[pid];
    if (!u) u = all[pid] = { date: D.iso(D.today()), view: null, pages: {} };
    u.pages = u.pages || {};
    const validSection = u.view === 'section' && p.sections.some(s => s.id === u.sectionId);
    if (!validSection && !p.views.includes(u.view)) {
      if (p.views.length) { u.view = p.views.includes('day') ? 'day' : p.views[p.views.length - 1]; }
      else if (p.sections.length) { u.view = 'section'; u.sectionId = p.sections[0].id; }
    }
    if (u.view === 'section') {
      const sec = p.sections.find(s => s.id === u.sectionId);
      if (!sec.pages.length) sec.pages.push({ id: Store.uid(), template: 'lined' });
      u.pageIndex = Math.max(0, Math.min(sec.pages.length - 1, u.pages[sec.id] || 0));
    }
    return u;
  }
  function saveUI() { Store.touch({ silent: true }); }
  const currentSection = () => { const u = ui(); return u.view === 'section' ? planner().sections.find(s => s.id === u.sectionId) : null; };

  function renderPlanner(opts = {}) {
    const p = planner();
    if (!p) { location.hash = '#/'; return; }
    const u = ui();
    $('#pTitle').textContent = p.name;
    renderTabs(p, u);
    let bg, key, label;
    if (u.view === 'section') {
      const sec = currentSection(), pg = sec.pages[u.pageIndex];
      bg = Templates.renderPageTemplate(pg.template, p.orientation);
      key = contentKey(p, 'page:' + pg.id);
      label = sec.name;
    } else {
      const d = D.parse(u.date);
      const sub = curSub(p, u), base = D.key(u.view, d);
      bg = Layouts.render(u.view, d, p, { sub });
      key = contentKey(p, SUB_KEY[sub] ? SUB_KEY[sub] + ':' + base.split(':')[1] : base);
      let title = SUB_TITLE[sub];
      if (sub === 'preview' && !isLand(p)) title = 'Weekly preview 1/2';
      if (sub === 'all' && u.view === 'quarter') title = 'Quarterly preview';
      label = (title ? title + ' · ' : '') + D.label(u.view, d);
    }
    $('#periodLabel').textContent = label;
    $('#goDate').value = u.date;
    $('#btnToday').hidden = false;
    // Keep the default pen readable on dark paper
    const pen = Editor.tools.pen, dark = p.theme === 'midnight';
    if (dark && pen.color === PEN_COLORS[0]) { pen.color = '#ffffff'; renderToolbar(); }
    else if (!dark && pen.color === '#ffffff') { pen.color = PEN_COLORS[0]; renderToolbar(); }
    Editor.show({ bg, plannerId: p.id, pageKey: key, theme: p.theme, accent: p.color, keepScroll: opts.keepScroll, orientation: p.orientation });
    const ob = $('#toolbar [data-act=orient]');
    if (ob) ob.innerHTML = orientIcon(p.orientation || 'portrait') + `<span>${isLand(p) ? 'Landscape' : 'Portrait'}</span>`;
    renderFooter(p, u);
  }

  function renderTabs(p, u) {
    let h = ALL_VIEWS.filter(v => p.views.includes(v)).map(v =>
      `<button class="tab${u.view === v ? ' on' : ''}" data-view="${v}" ${u.view === v ? 'aria-current="page"' : ''}>${VIEW_NAMES[v]}</button>`).join('');
    if (p.views.length && p.sections.length) h += '<div class="tab-sep" role="separator"></div>';
    h += p.sections.map(s => {
      const on = u.view === 'section' && u.sectionId === s.id;
      return `<button class="tab sec${on ? ' on' : ''}" data-sec="${s.id}" style="--tab:${s.color}" ${on ? 'aria-current="page"' : ''}>${esc(s.name)}</button>`;
    }).join('');
    h += `<button class="tab add" data-addsec aria-label="Add section">+ Section</button>`;
    $('#tabs').innerHTML = h;
    const on = $('#tabs .tab.on'); on && on.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function renderFooter(p, u) {
    const f = $('#pageFooter');
    if (u.view === 'section') {
      const sec = currentSection(), pg = sec.pages[u.pageIndex], t = Templates.PAGE_TEMPLATES[pg.template];
      f.innerHTML = `
        <div class="pager"><button class="icon-btn" data-f="prev" aria-label="Previous page" ${u.pageIndex === 0 ? 'disabled' : ''}>${icon('left')}</button>
        <span>Page ${u.pageIndex + 1} of ${sec.pages.length}</span>
        <button class="icon-btn" data-f="next" aria-label="Next page" ${u.pageIndex === sec.pages.length - 1 ? 'disabled' : ''}>${icon('right')}</button></div>
        <div class="foot-actions">
          <button data-f="add">${icon('plus')} Page</button>
          <button data-f="paper" title="Change paper">Paper: ${esc(t ? t.name : pg.template)}</button>
          <button data-f="delpage" aria-label="Delete page">${icon('trash')}</button>
          <button data-f="clear">Clear</button>
          ${guideKey(p, u) ? `<button data-f="guide">${icon('help')} Guide</button>` : ''}
        </div>`;
    } else {
      const list = subPages(p, u.view), sub = curSub(p, u);
      const seg = list.length > 1 ? `<div class="seg week-seg" role="group" aria-label="Pages">${list.map(x =>
        `<button data-sub="${x}" aria-pressed="${x === sub}">${SUB_LABEL[x]}</button>`).join('')}</div>` : '';
      const evHint = (u.view === 'day' && sub === 'plan') || (u.view === 'week' && sub === 'days') || u.view === 'month';
      f.innerHTML = seg + `<span class="hint">${evHint ? 'Double-click a day or time to add an event · ' : ''}Swipe or press ← → to turn pages</span>
        <div class="foot-actions">${guideKey(p, u) ? `<button data-f="guide">${icon('help')} Guide</button>` : ''}<button data-f="clear">Clear page</button></div>`;
    }
  }

  /* ---------- Page guide ---------- */
  function guideKey(p, u) {
    let k;
    if (u.view === 'section') { const sec = currentSection(); k = sec.pages[u.pageIndex].template; }
    else {
      const sub = curSub(p, u);
      k = u.view === 'day' ? (sub === 'notes' ? 'day:notes' : (p.dayStyle || 'schedule') === 'schedule' ? 'day:plan' : null)
        : u.view === 'week' ? (sub === 'days' ? 'week:days' : 'week:preview') : u.view;
    }
    return k && Guide.pages[k] ? k : null;
  }
  function guideDialog(k) {
    const [title, items] = Guide.pages[k];
    dialog(`How to use: ${title}`, `<ol class="guide">${items.map(([h, t]) => `<li><strong>${esc(h)}</strong><p>${esc(t)}</p></li>`).join('')}</ol>`, {
      footer: '<button class="primary" data-close>Got it</button>',
    });
  }

  function step(dir) {
    const u = ui();
    if (u.view === 'section') {
      const sec = currentSection(), ni = u.pageIndex + dir;
      if (ni < 0) { toast('This is the first page'); return; }
      if (ni >= sec.pages.length) { toast('Last page. Use “+ Page” to add another.'); return; }
      u.pages[sec.id] = ni;
    } else {
      // Turn through this period's pages, then on to the next period's first page
      const list = subPages(planner(), u.view), i = list.indexOf(curSub(planner(), u)) + dir;
      if (i >= 0 && i < list.length) u.sub[u.view] = list[i];
      else {
        u.date = D.iso(D.shift(u.view, D.parse(u.date), dir));
        u.sub[u.view] = dir > 0 ? list[0] : list[list.length - 1];
      }
    }
    saveUI(); renderPlanner();
    flashPage(dir);
  }
  function flashPage(dir) {
    const pg = $('#pageWrap .page-sizer');
    pg.classList.remove('turn-l', 'turn-r'); void pg.offsetWidth;
    pg.classList.add(dir > 0 ? 'turn-r' : 'turn-l');
  }
  function goToView(view, date) {
    const p = planner(), u = ui();
    u.sub = u.sub || {};
    if (view === 'weekpreview') { view = 'week'; u.sub.week = 'preview'; }
    else if (view === 'week') u.sub.week = 'days';
    else if (view === 'day') u.sub.day = 'plan';
    else if (view === 'year' && !isLand(p)) u.sub.year = (date || D.parse(u.date)).getMonth() < 6 ? 'h1' : 'h2';
    else if (view === 'quarter') u.sub.quarter = isLand(p) ? 'all' : 'qp1';
    let target = view;
    if (!p.views.includes(view)) {
      const i = FINE_TO_COARSE.indexOf(view);
      target = FINE_TO_COARSE.map((v, k) => [v, Math.abs(k - i) + (k > i ? 0.5 : 0)]).filter(([v]) => p.views.includes(v)).sort((a, b) => a[1] - b[1]).map(x => x[0])[0];
      if (!target) { toast('This planner has no date layouts. Turn them on in Customize.'); return; }
    }
    u.view = target;
    if (date) u.date = D.iso(date);
    saveUI(); renderPlanner();
  }
  function today() {
    const p = planner(), u = ui();
    if (!p.views.length) { toast('This planner has no date layouts'); return; }
    goToView(u.view === 'section' ? (p.views.includes('day') ? 'day' : p.views[p.views.length - 1]) : u.view, D.today());
  }

  async function footerAction(a) {
    const p = planner(), u = ui(), sec = currentSection();
    if (a === 'guide') { guideDialog(guideKey(p, u)); return; }
    if (a === 'prev') step(-1);
    if (a === 'next') step(1);
    if (a === 'clear') {
      if (await confirmDlg('Erase all writing, text, images and stickers on this page? You can undo this.', 'Clear page', true)) Editor.clearPage();
    }
    if (a === 'add') pageTemplateDialog('Add a page', sec.pages[u.pageIndex].template, tid => {
      sec.pages.splice(u.pageIndex + 1, 0, { id: Store.uid(), template: tid });
      u.pages[sec.id] = u.pageIndex + 1;
      Store.updatePlanner(p.id, { sections: p.sections });
      renderPlanner(); flashPage(1);
    });
    if (a === 'paper') pageTemplateDialog('Change paper', sec.pages[u.pageIndex].template, tid => {
      sec.pages[u.pageIndex].template = tid;
      Store.updatePlanner(p.id, { sections: p.sections });
      renderPlanner({ keepScroll: true });
    });
    if (a === 'delpage') {
      if (sec.pages.length === 1) { toast('A section needs at least one page. Delete the section in Customize.'); return; }
      const pg = sec.pages[u.pageIndex];
      if (pageUsed(p.id, pg.id) && !(await confirmDlg('Delete this page and everything on it?', 'Delete page', true))) return;
      sec.pages.splice(u.pageIndex, 1);
      u.pages[sec.id] = Math.max(0, u.pageIndex - 1);
      Store.updatePlanner(p.id, { sections: p.sections });
      renderPlanner();
      toast('Page deleted');
    }
  }

  function pageTemplateDialog(title, current, onPick) {
    const groups = {};
    Object.entries(Templates.PAGE_TEMPLATES).forEach(([id, t]) => { (groups[t.cat] = groups[t.cat] || []).push([id, t]); });
    const theme = planner().theme, color = planner().color;
    dialog(title, `<input type="search" class="lib-search" placeholder="Search page types" aria-label="Search page types">
      ${Templates.CATEGORIES.filter(c => groups[c]).map(c => `<section class="pt-group"><h3>${c}</h3><div class="pt-grid">${groups[c].map(([id, t]) => `
        <button class="pt-card${id === current ? ' on' : ''}" data-id="${id}" data-name="${esc(t.name.toLowerCase())}">
          <div class="page-mini theme-${theme}" style="--pc:${color}">${Templates.renderPageTemplate(id)}</div><span>${esc(t.name)}</span></button>`).join('')}</div></section>`).join('')}`, {
      wide: true,
      onMount: d => {
        d.querySelector('.dlg-body').onclick = e => { const b = e.target.closest('.pt-card'); if (b) { d.close(); onPick(b.dataset.id); } };
        const s = d.querySelector('.lib-search');
        s.oninput = () => {
          const q = s.value.toLowerCase();
          $$('.pt-card', d).forEach(c => { c.hidden = !c.dataset.name.includes(q); });
          $$('.pt-group', d).forEach(g => { g.hidden = !$$('.pt-card', g).some(c => !c.hidden); });
        };
        setTimeout(() => s.focus(), 30);
      },
    });
  }

  /* ---------- Toolbar ---------- */
  const TOOL_LIST = [['nav', 'hand', 'Navigate (N) — follow links, swipe, no drawing'], ['pen', 'pen', 'Pen (P)'], ['highlighter', 'highlighter', 'Highlighter (H)'], ['eraser', 'eraser', 'Eraser (E)'], ['select', 'select', 'Select & move (S)'], ['text', 'text', 'Text box (X)']];
  function renderToolbar() {
    const T = Editor.tools, t = T.tool;
    const palette = t === 'highlighter' ? HL_COLORS : PEN_COLORS;
    const showColors = t === 'pen' || t === 'highlighter';
    const sizeCfg = { pen: [1, 14], highlighter: [8, 44], eraser: [6, 60] }[t];
    $('#toolbar').innerHTML = `
      <div class="tb-group" role="group" aria-label="Mode">${TOOL_LIST.map(([id, ic, label]) =>
        `<button class="tb${t === id ? ' on' : ''}" data-tool="${id}" aria-pressed="${t === id}" title="${label}" aria-label="${label}">${icon(ic)}</button>`).join('')}</div>
      <div class="tb-group" role="group" aria-label="Insert">
        <button class="tb" data-act="sticker" title="Add sticker" aria-label="Add sticker">${icon('sticker')}</button>
        <button class="tb" data-act="image" title="Add image" aria-label="Add image">${icon('image')}</button>
      </div>
      ${showColors ? `<div class="tb-group colors" role="group" aria-label="Color">${palette.map(c =>
        `<button class="tb-color${T[t].color === c ? ' on' : ''}" data-color="${c}" style="--sw:${c}" aria-label="Color ${c}" aria-pressed="${T[t].color === c}"></button>`).join('')}
        <label class="tb-color custom" title="Custom color"><input type="color" value="${T[t].color}" aria-label="Custom color"></label></div>` : ''}
      ${sizeCfg ? `<div class="tb-group size"><label><span class="sr">Size</span><input type="range" min="${sizeCfg[0]}" max="${sizeCfg[1]}" value="${T[t].size}" aria-label="${t} size"></label><i class="size-dot" style="--s:${Math.min(28, T[t].size)}px"></i></div>` : ''}
      <div class="tb-group" role="group" aria-label="History">
        <button class="tb" data-act="undo" title="Undo (Ctrl+Z)" aria-label="Undo" ${Editor.canUndo() ? '' : 'disabled'}>${icon('undo')}</button>
        <button class="tb" data-act="redo" title="Redo (Ctrl+Shift+Z)" aria-label="Redo" ${Editor.canRedo() ? '' : 'disabled'}>${icon('redo')}</button>
      </div>
      <div class="tb-group" role="group" aria-label="Zoom">
        <button class="tb" data-act="zoomout" aria-label="Zoom out" title="Zoom out (−)">${icon('minus')}</button>
        <button class="tb zoom-label" data-act="zoomreset" title="Fit width (0)">${Math.round(Editor.zoom * 100)}%</button>
        <button class="tb" data-act="zoomin" aria-label="Zoom in" title="Zoom in (+)">${icon('plus')}</button>
      </div>
      <button class="tb tb-orient" data-act="orient" title="Switch page orientation (O)" aria-label="Switch page orientation">${orientIcon((planner() || {}).orientation || 'portrait')}<span>${planner() && isLand(planner()) ? 'Landscape' : 'Portrait'}</span></button>
      <button class="tb tb-event" data-act="event" title="New calendar event">${icon('calPlus')}<span>Event</span></button>`;
  }
  function updateHistoryButtons() {
    const u = $('#toolbar [data-act=undo]'), r = $('#toolbar [data-act=redo]');
    if (u) u.disabled = !Editor.canUndo();
    if (r) r.disabled = !Editor.canRedo();
  }
  function setTool(t) {
    Editor.setTool(t);
    renderToolbar();
  }
  function toolbarClick(e) {
    const b = e.target.closest('button'); if (!b) return;
    const T = Editor.tools;
    if (b.dataset.tool) return setTool(b.dataset.tool);
    if (b.dataset.color) { T[T.tool].color = b.dataset.color; renderToolbar(); return; }
    const a = b.dataset.act;
    if (a === 'undo') Editor.undo();
    if (a === 'redo') Editor.redo();
    if (a === 'zoomin') { Editor.setZoom(Editor.zoom + 0.25); renderToolbar(); }
    if (a === 'zoomout') { Editor.setZoom(Editor.zoom - 0.25); renderToolbar(); }
    if (a === 'zoomreset') { Editor.setZoom(1); renderToolbar(); }
    if (a === 'sticker') stickerDialog();
    if (a === 'orient') toggleOrientation();
    if (a === 'image') pickFile('image/*').then(f => f && Editor.insertImage(f).catch(err => toast(err.message)));
    if (a === 'event') {
      const u = ui();
      eventDialog({ date: u.view === 'section' ? D.iso(D.today()) : (u.view === 'day' ? u.date : D.iso(D.today() >= periodStart(u) && D.today() <= periodEnd(u) ? D.today() : periodStart(u))) });
    }
  }
  function periodStart(u) {
    const d = D.parse(u.date);
    return { day: d, week: D.startOfWeek(d), month: new Date(d.getFullYear(), d.getMonth(), 1), quarter: new Date(d.getFullYear(), (D.quarter(d) - 1) * 3, 1), year: new Date(d.getFullYear(), 0, 1), multiyear: new Date(D.multiStart(d.getFullYear()), 0, 1) }[u.view];
  }
  function periodEnd(u) { return D.addDays(D.shift(u.view, periodStart(u), 1), -1); }

  function toolbarInput(e) {
    const T = Editor.tools;
    if (e.target.type === 'color') { T[T.tool].color = e.target.value; $$('#toolbar .tb-color').forEach(b => b.classList.remove('on')); }
    if (e.target.type === 'range') { T[T.tool].size = +e.target.value; const dot = $('#toolbar .size-dot'); dot && dot.style.setProperty('--s', Math.min(28, +e.target.value) + 'px'); }
  }

  /* ---------- Context bar for a selected item ---------- */
  function renderCtx(it) {
    const bar = $('#ctxbar');
    if (!it) { bar.hidden = true; bar.innerHTML = ''; return; }
    bar.hidden = false;
    let h = '';
    if (it.type === 'text') {
      h = `<label class="ctl"><span class="sr">Font</span><select data-k="font" aria-label="Font">${[['sans', 'Sans'], ['serif', 'Serif'], ['hand', 'Handwritten'], ['mono', 'Mono']].map(([v, n]) => `<option value="${v}" ${it.font === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <label class="ctl"><span class="sr">Size</span><input type="number" min="10" max="120" value="${it.size}" data-k="size" aria-label="Font size"></label>
        <label class="ctl swatch"><input type="color" value="${it.color}" data-k="color" aria-label="Text color"></label>
        <button class="ctl${it.bold ? ' on' : ''}" data-toggle="bold" aria-pressed="${!!it.bold}" aria-label="Bold"><b>B</b></button>
        <button class="ctl${it.italic ? ' on' : ''}" data-toggle="italic" aria-pressed="${!!it.italic}" aria-label="Italic"><i>I</i></button>
        <div class="ctl-seg" role="group" aria-label="Alignment">${['left', 'center', 'right'].map(a => `<button class="ctl${(it.align || 'left') === a ? ' on' : ''}" data-align="${a}" aria-label="Align ${a}" aria-pressed="${(it.align || 'left') === a}">${{ left: '⟸', center: '⇔', right: '⟹' }[a]}</button>`).join('')}</div>
        <label class="ctl"><span>Fill</span><select data-k="bg" aria-label="Text box fill"><option value="">None</option>${[['#fff3b0', 'Yellow'], ['#d8f3dc', 'Green'], ['#dbeafe', 'Blue'], ['#fde2e4', 'Pink'], ['#ffffff', 'White']].map(([v, n]) => `<option value="${v}" ${it.bg === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>`;
    } else if (it.type === 'sticker') {
      h = (it.kind === 'label' ? `<label class="ctl"><span class="sr">Text</span><input type="text" value="${esc(it.text)}" data-k="text" aria-label="Sticker text" maxlength="40"></label>` : '') +
        `<label class="ctl"><span>Fill</span><input type="color" value="${it.bg && it.bg !== 'transparent' ? it.bg : '#ffffff'}" data-k="bg" aria-label="Sticker fill"></label>` +
        (it.kind === 'emoji' ? `<button class="ctl" data-clearbg>No fill</button>` : `<label class="ctl"><span>Text</span><input type="color" value="${it.color || '#222222'}" data-k="color" aria-label="Sticker text color"></label>`) +
        `<label class="ctl"><span class="sr">Shape</span><select data-k="shape" aria-label="Shape">${['rounded', 'pill', 'circle', 'square', 'tag', 'banner'].map(s => `<option ${it.shape === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
        <button class="ctl${it.shade ? ' on' : ''}" data-toggle="shade" aria-pressed="${!!it.shade}">Shadow</button>
        <label class="ctl"><span>Padding</span><input type="range" min="0" max="30" value="${it.pad == null ? 10 : it.pad}" data-k="pad" aria-label="Padding"></label>`;
    } else {
      h = `<span class="ctl-label">Image — drag to move, use the corner to resize and the top dot to rotate</span>`;
    }
    h += `<span class="spacer"></span><button class="ctl" data-front title="Bring to front">${icon('front')}<span class="sr">Bring to front</span></button>
      <button class="ctl danger-text" data-del aria-label="Delete item">${icon('trash')}</button>`;
    bar.innerHTML = h;
  }
  function ctxEvents() {
    const bar = $('#ctxbar');
    bar.addEventListener('change', e => {
      const k = e.target.dataset.k; if (!k) return;
      let v = e.target.value;
      if (k === 'size' || k === 'pad') v = +v;
      Editor.updateSelected({ [k]: v });
    });
    bar.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const it = Editor.selected; if (!it) return;
      if (b.dataset.toggle) Editor.updateSelected({ [b.dataset.toggle]: !it[b.dataset.toggle] });
      if (b.dataset.align) Editor.updateSelected({ align: b.dataset.align });
      if (b.hasAttribute('data-clearbg')) Editor.updateSelected({ bg: 'transparent' });
      if (b.hasAttribute('data-front')) Editor.bringToFront();
      if (b.hasAttribute('data-del')) Editor.deleteSelected();
    });
  }

  /* ---------- Stickers ---------- */
  function stickerDialog() {
    let shape = 'rounded', shade = true;
    dialog('Add a sticker', `
      <h3 class="sub">Emoji</h3><div class="emoji-grid">${EMOJI.map(e => `<button data-emoji="${e}" aria-label="${e} sticker">${e}</button>`).join('')}</div>
      <h3 class="sub">Labels</h3>
      <div class="seg small" data-k="shape">${['rounded', 'pill', 'tag', 'banner', 'circle'].map(s => `<button type="button" data-v="${s}" aria-pressed="${s === shape}">${s}</button>`).join('')}</div>
      <label class="inline-check"><input type="checkbox" checked data-shade> Drop shadow</label>
      <div class="label-grid">${LABELS.map(([t, bg, fg]) => `<button data-label="${t}" data-bg="${bg}" data-fg="${fg}" style="background:${bg};color:${fg}">${t}</button>`).join('')}</div>
      <div class="custom-label"><input type="text" placeholder="Custom label text" maxlength="40" aria-label="Custom label text"><input type="color" value="#ffd166" aria-label="Label color"><button class="primary" data-custom>Add</button></div>
      <p class="note">After adding, select a sticker to change its colors, shading, padding and text.</p>`, {
      onMount: d => {
        const seg = d.querySelector('.seg');
        seg.onclick = e => { const b = e.target.closest('button'); if (b) { shape = b.dataset.v; $$('button', seg).forEach(x => x.setAttribute('aria-pressed', x === b)); } };
        d.querySelector('[data-shade]').onchange = e => { shade = e.target.checked; };
        d.querySelector('.dlg-body').addEventListener('click', e => {
          const b = e.target.closest('button'); if (!b) return;
          if (b.dataset.emoji) { Editor.insertSticker({ kind: 'emoji', emoji: b.dataset.emoji, bg: 'transparent', shade: false, shape: 'circle' }); d.close(); }
          if (b.dataset.label) { Editor.insertSticker({ kind: 'label', text: b.dataset.label, bg: b.dataset.bg, color: b.dataset.fg, shape, shade, ...(shape === 'circle' ? { w: 130, h: 130 } : {}) }); d.close(); }
          if (b.hasAttribute('data-custom')) {
            const txt = d.querySelector('.custom-label input[type=text]').value.trim();
            const bg = d.querySelector('.custom-label input[type=color]').value;
            if (!txt) { toast('Type some label text first'); return; }
            Editor.insertSticker({ kind: 'label', text: txt, bg, color: inkOn(bg), shape, shade, ...(shape === 'circle' ? { w: 130, h: 130 } : {}) });
            d.close();
          }
        });
      },
    });
  }

  /* ---------- Events ---------- */
  const REPEAT = { none: 'Does not repeat', daily: 'Every day', weekdays: 'Every weekday (Mon–Fri)', weekly: 'Every week', biweekly: 'Every 2 weeks', monthly: 'Every month', yearly: 'Every year' };
  function addHour(t) { const m = D.minutes(t) + 60; return `${String(Math.min(23, Math.floor(m / 60))).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; }
  function eventDialog({ id, date, time }) {
    const cals = Store.calendars();
    if (!cals.length) { toast('Add or connect a calendar first'); calendarsDialog(); return; }
    const ev = id ? Store.event(id) : null;
    const v = ev ? Object.assign({}, ev) : {
      title: '', calendarId: (Store.calendar(Store.state.defaultCalendarId) && !Store.calendar(Store.state.defaultCalendarId).deleted ? Store.state.defaultCalendarId : cals[0].id),
      date: date || D.iso(D.today()), time: time || '09:00', endTime: addHour(time || '09:00'), allDay: false, recurrence: 'none', notes: '', until: '',
    };
    const d = dialog(ev ? 'Edit event' : 'New event', `
      <label class="field"><span>Title</span><input type="text" name="title" value="${esc(v.title)}" maxlength="120" placeholder="Add title" required></label>
      <label class="field"><span>Calendar</span><select name="calendarId">${cals.map(c => `<option value="${c.id}" ${c.id === v.calendarId ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
      <div class="row">
        <label class="field"><span>Date</span><input type="date" name="date" value="${v.date}" required></label>
        <label class="inline-check"><input type="checkbox" name="allDay" ${v.allDay ? 'checked' : ''}> All day</label>
      </div>
      <div class="row times" ${v.allDay ? 'hidden' : ''}>
        <label class="field"><span>Start</span><input type="time" name="time" value="${v.time || '09:00'}"></label>
        <label class="field"><span>End</span><input type="time" name="endTime" value="${v.endTime || ''}"></label>
      </div>
      <div class="row">
        <label class="field"><span>Repeat</span><select name="recurrence">${Object.entries(REPEAT).map(([k, n]) => `<option value="${k}" ${k === (v.recurrence || 'none') ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <label class="field until" ${(v.recurrence || 'none') === 'none' ? 'hidden' : ''}><span>Until (optional)</span><input type="date" name="until" value="${v.until || ''}"></label>
      </div>
      <label class="field"><span>Notes</span><textarea name="notes" rows="3">${esc(v.notes || '')}</textarea></label>
      ${ev && ev.recurrence && ev.recurrence !== 'none' ? '<p class="note">This is a repeating event. Changes apply to every occurrence.</p>' : ''}
      ${ev && Store.calendar(ev.calendarId) && Store.calendar(ev.calendarId).demo ? '<p class="note">Demo event from a sample connected calendar.</p>' : ''}`, {
      footer: `${ev ? `<button class="danger" data-del>${icon('trash')} Delete</button><span class="spacer"></span>` : ''}<button data-close>Cancel</button><button class="primary" data-save>Save</button>`,
      onMount: d => {
        const f = n => d.querySelector(`[name=${n}]`);
        f('allDay').onchange = () => { d.querySelector('.times').hidden = f('allDay').checked; };
        f('recurrence').onchange = () => { d.querySelector('.until').hidden = f('recurrence').value === 'none'; };
        f('time').onchange = () => { if (!f('endTime').value || f('endTime').value <= f('time').value) f('endTime').value = addHour(f('time').value); };
        d.querySelector('[data-save]').onclick = () => {
          const out = {
            id: ev && ev.id, title: f('title').value.trim() || '(No title)', calendarId: f('calendarId').value, date: f('date').value,
            allDay: f('allDay').checked, time: f('allDay').checked ? '' : f('time').value, endTime: f('allDay').checked ? '' : f('endTime').value,
            recurrence: f('recurrence').value, until: f('recurrence').value === 'none' ? '' : f('until').value, notes: f('notes').value,
          };
          if (!out.date) { f('date').focus(); toast('Pick a date'); return; }
          if (!out.allDay && out.endTime && out.endTime <= out.time) { f('endTime').focus(); toast('End time must be after the start time'); return; }
          if (out.until && out.until < out.date) { f('until').focus(); toast('“Until” must be after the first date'); return; }
          Store.saveEvent(out);
          d.close();
          if (pid) renderPlanner({ keepScroll: true });
          toast(ev ? 'Event updated' : `Added to ${Store.calendar(out.calendarId).name}`);
        };
        const del = d.querySelector('[data-del]');
        if (del) del.onclick = async () => {
          if (!(await confirmDlg(ev.recurrence && ev.recurrence !== 'none' ? 'Delete every occurrence of this event?' : 'Delete this event?', 'Delete', true))) return;
          Store.deleteEvent(ev.id); d.close();
          if (pid) renderPlanner({ keepScroll: true });
          toast('Event deleted');
        };
        setTimeout(() => f('title').focus(), 30);
      },
    });
    return d;
  }

  /* ---------- Calendars ---------- */
  function calendarsDialog() {
    dialog('Calendars', '<div class="cal-body"></div>', {
      wide: true,
      footer: '<button class="primary" data-close>Done</button>',
      onMount: d => {
        const body = d.querySelector('.cal-body');
        const draw = () => {
          const cals = Store.calendars();
          body.innerHTML = `
            <h3 class="sub">Connected accounts</h3>
            <div class="providers">${Object.keys(Calendars.PROVIDERS).map(pv => {
              const on = Calendars.isConnected(pv);
              return `<div class="provider"><span class="pv-dot" style="background:${Calendars.PROVIDERS[pv].color}"></span>
                <div><strong>${pv === 'Apple' ? 'Apple Calendar' : pv}</strong><small>${on ? 'Connected (demo data)' : 'Not connected'}</small></div>
                <button data-pv="${pv}" class="${on ? '' : 'primary'}">${on ? 'Disconnect' : 'Connect'}</button></div>`;
            }).join('')}</div>
            <p class="note">This prototype has no server, so connecting adds sample calendars. To bring in your real events, export an .ics file from Google Calendar, Apple Calendar or Outlook and import it.</p>
            <div class="row"><button data-import>${icon('cal')} Import .ics file</button><button data-addlocal>${icon('plus')} New planner calendar</button></div>
            <h3 class="sub">Show on planner pages</h3>
            <ul class="cal-list">${cals.map(c => `<li>
              <label class="inline-check"><input type="checkbox" data-vis="${c.id}" ${c.visible ? 'checked' : ''}> <span>${esc(c.name)}</span></label>
              <small>${esc(c.source)}</small>
              <input type="color" value="${c.color}" data-color="${c.id}" aria-label="Color for ${esc(c.name)}">
              ${c.source === 'Imported' || c.source === 'Planner' ? `<button class="icon-btn" data-rm="${c.id}" aria-label="Remove ${esc(c.name)}">${icon('trash')}</button>` : '<span class="icon-btn-placeholder"></span>'}
            </li>`).join('') || '<li class="muted">No calendars yet.</li>'}</ul>
            <label class="field"><span>Default calendar for new events</span><select data-default>${cals.map(c => `<option value="${c.id}" ${c.id === Store.state.defaultCalendarId ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>`;
        };
        draw();
        body.addEventListener('change', e => {
          const t = e.target;
          if (t.dataset.vis) Store.updateCalendar(t.dataset.vis, { visible: t.checked });
          if (t.dataset.color) Store.updateCalendar(t.dataset.color, { color: t.value });
          if (t.hasAttribute('data-default')) { Store.state.defaultCalendarId = t.value; Store.touch(); }
          if (pid) renderPlanner({ keepScroll: true });
        });
        body.addEventListener('click', async e => {
          const b = e.target.closest('button'); if (!b) return;
          if (b.dataset.pv) {
            if (Calendars.isConnected(b.dataset.pv)) {
              if (!(await confirmDlg(`Disconnect ${b.dataset.pv}? Its events will no longer appear in your planners.`, 'Disconnect', true))) return;
              Calendars.disconnect(b.dataset.pv);
            } else { const added = Calendars.connect(b.dataset.pv); toast(`Connected ${added.length} calendar${added.length === 1 ? '' : 's'}`); }
            if (!Store.calendar(Store.state.defaultCalendarId) || Store.calendar(Store.state.defaultCalendarId).deleted) Store.state.defaultCalendarId = (Store.calendars()[0] || {}).id || null;
          }
          if (b.hasAttribute('data-import')) {
            const f = await pickFile('.ics,text/calendar');
            if (f) {
              try { const r = Calendars.importICS(await f.text(), f.name); toast(`Imported ${r.count} event${r.count === 1 ? '' : 's'} into “${r.cal.name}”`); }
              catch (err) { toast(err.message); }
            }
          }
          if (b.hasAttribute('data-addlocal')) {
            const n = await promptDlg('New planner calendar', 'My calendar');
            if (n) Store.addCalendar({ name: n, color: SECTION_COLORS[Store.calendars().length % SECTION_COLORS.length], source: 'Planner' });
          }
          if (b.dataset.rm) {
            const c = Store.calendar(b.dataset.rm);
            if (!(await confirmDlg(`Remove “${c.name}” and all of its events?`, 'Remove', true))) return;
            Store.removeCalendar(c.id);
          }
          draw();
          if (pid) renderPlanner({ keepScroll: true });
        });
      },
    });
  }

  /* ---------- Account, sync & backup ---------- */
  function accountDialog() {
    dialog('Account & sync', '<div class="acct-body"></div>', {
      footer: '<button class="primary" data-close>Done</button>',
      onMount: d => {
        const body = d.querySelector('.acct-body');
        const draw = () => {
          const s = Store.state, size = new Blob([Store.exportJSON()]).size;
          body.innerHTML = `
            <div class="acct-card"><div class="avatar" aria-hidden="true">${esc((s.account.name || '?')[0])}</div>
              <div><label class="field compact"><span>Name</span><input data-acct="name" value="${esc(s.account.name)}"></label>
              <small class="muted">Device ID ${esc(s.deviceId.slice(0, 6))} · local prototype account</small></div></div>
            <dl class="stats">
              <div><dt>Status</dt><dd>${Store.isOnline() ? 'Online' : 'Offline'}</dd></div>
              <div><dt>Queued changes</dt><dd>${s.sync.pending}</dd></div>
              <div><dt>Last synced</dt><dd>${ago(s.sync.lastSynced)}</dd></div>
              <div><dt>Conflicts resolved</dt><dd>${s.sync.conflicts}</dd></div>
              <div><dt>Data size</dt><dd>${(size / 1024).toFixed(0)} KB</dd></div>
            </dl>
            <label class="inline-check"><input type="checkbox" data-offline ${s.sync.simulateOffline ? 'checked' : ''}> Simulate offline mode</label>
            <p class="note">While offline, edits are saved on this device and queued. When you reconnect they upload and merge with changes from other devices. Each page, planner and event is merged separately, and the newest edit wins. Open this page in a second browser tab to watch edits sync between “devices”.</p>
            <label class="inline-check"><input type="checkbox" data-stylus ${s.prefs.stylusOnly ? 'checked' : ''}> Stylus-only drawing (fingers scroll and swipe; turns on automatically when an Apple Pencil is detected)</label>
            <div class="row"><button data-syncnow ${Store.isOnline() ? '' : 'disabled'}>${icon('cloud')} Sync now</button></div>
            <h3 class="sub">Backup & restore</h3>
            <div class="row wrap"><button data-export>Download backup</button><button data-restore>Restore from backup…</button></div>
            <h3 class="sub">Demo data</h3>
            <button class="danger" data-reset>Erase everything and start over</button>`;
        };
        draw();
        const off = Store.on(t => { if (t === 'sync' && d.open) draw(); });
        d.addEventListener('close', off);
        body.addEventListener('change', e => {
          const t = e.target;
          if (t.dataset.acct) { Store.state.account[t.dataset.acct] = t.value; Store.touch(); }
          if (t.hasAttribute('data-offline')) {
            Store.state.sync.simulateOffline = t.checked; Store.saveNow();
            if (!t.checked) Store.reconcile();
            renderSync(); draw();
          }
          if (t.hasAttribute('data-stylus')) { Store.state.prefs.stylusOnly = t.checked; Store.touch({ silent: true }); }
        });
        body.addEventListener('click', async e => {
          const b = e.target.closest('button'); if (!b) return;
          if (b.hasAttribute('data-syncnow')) Store.reconcile();
          if (b.hasAttribute('data-export')) download(`planner-backup-${D.iso(D.today())}.json`, Store.exportJSON());
          if (b.hasAttribute('data-restore')) {
            const f = await pickFile('.json,application/json'); if (!f) return;
            if (!(await confirmDlg('Merge this backup into your planners? For each page, planner and event, the newest version is kept.', 'Merge backup'))) return;
            try { Store.importJSON(await f.text(), 'merge'); toast('Backup restored'); route(); draw(); }
            catch (err) { toast(err.message || 'Could not read that backup'); }
          }
          if (b.hasAttribute('data-reset')) {
            if (await confirmDlg('Erase all planners, pages, calendars and events stored in this browser?', 'Erase everything', true)) Store.resetAll();
          }
        });
      },
    });
  }

  function renderSync(state) {
    const s = Store.state.sync;
    let txt, cls;
    if (!Store.isOnline()) { txt = s.pending ? `Offline · ${s.pending} change${s.pending > 1 ? 's' : ''} queued` : 'Offline · saved on device'; cls = 'off'; }
    else if (state === 'syncing') { txt = 'Syncing…'; cls = 'busy'; }
    else if (state === 'error') { txt = 'Sync problem — will retry'; cls = 'err'; }
    else if (s.pending) { txt = 'Saving…'; cls = 'busy'; }
    else { txt = `Synced ${ago(s.lastSynced)}`; cls = 'ok'; }
    $$('.sync-pill').forEach(el => { el.className = 'sync-pill ' + cls; el.querySelector('span').textContent = txt; });
  }

  /* ---------- Help ---------- */
  function helpDialog() {
    const k = (keys, what) => `<tr><td>${keys.map(x => `<kbd>${x}</kbd>`).join(' ')}</td><td>${what}</td></tr>`;
    dialog('Shortcuts & tips', `
      <table class="keys">${[
        k(['←', '→'], 'Previous / next page or period'), k(['T'], 'Jump to today'),
        k(['Y'], 'Year'), k(['Q'], 'Quarter'), k(['M'], 'Month'), k(['W'], 'Week'), k(['D'], 'Day'), k(['5'], 'Multiyear'),
        k(['N'], 'Navigate mode (follow links, no drawing)'), k(['P'], 'Pen'), k(['H'], 'Highlighter'), k(['E'], 'Eraser'), k(['S'], 'Select / move'), k(['X'], 'Text box'),
        k(['Ctrl', 'Z'], 'Undo'), k(['Ctrl', 'Shift', 'Z'], 'Redo'), k(['Del'], 'Delete selected item'), k(['Esc'], 'Deselect, back to Navigate'),
        k(['+', '−', '0'], 'Zoom in / out / fit'), k(['O'], 'Switch portrait / landscape'), k(['?'], 'This help')].join('')}</table>
      <h3 class="sub">Getting started with the planning system</h3>
      <ol class="tips">${Guide.start.map(t => `<li>${esc(t)}</li>`).join('')}</ol>
      <p class="note">Every page has a <strong>Guide</strong> button at the bottom of the screen that explains how to use it.</p>
      <h3 class="sub">Tips</h3>
      <ul class="tips">
        <li>Date links (days, months, years) only work in <strong>Navigate</strong> mode, so you never jump pages by accident while writing.</li>
        <li>With a pen or Apple Pencil, the stylus draws and your finger scrolls (palm rejection).</li>
        <li>Paste or drag an image onto a page to place it.</li>
        <li>Turning a layout off in Customize hides it but keeps everything you wrote.</li>
      </ul>`);
  }

  /* ---------- Keyboard ---------- */
  function onKey(e) {
    if (document.querySelector('dialog[open]') || document.querySelector('.menu')) return;
    const t = e.target;
    if (t.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
    const mod = e.ctrlKey || e.metaKey;
    if (!pid) {
      if (e.key === 'n' && !mod) { e.preventDefault(); libraryDialog(); }
      return;
    }
    const key = e.key.toLowerCase();
    if (mod && key === 'z') { e.preventDefault(); e.shiftKey ? Editor.redo() : Editor.undo(); return; }
    if (mod && key === 'y') { e.preventDefault(); Editor.redo(); return; }
    if (mod) return;
    const sel = Editor.selected;
    if (sel && Editor.tool === 'select' && e.key.startsWith('Arrow')) {
      e.preventDefault();
      const n = e.shiftKey ? 20 : 4;
      Editor.nudge(e.key === 'ArrowLeft' ? -n : e.key === 'ArrowRight' ? n : 0, e.key === 'ArrowUp' ? -n : e.key === 'ArrowDown' ? n : 0);
      return;
    }
    const views = { y: 'year', q: 'quarter', m: 'month', w: 'week', d: 'day', 5: 'multiyear' };
    const toolKeys = { n: 'nav', p: 'pen', h: 'highlighter', e: 'eraser', s: 'select', x: 'text' };
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); step(-1); }
    else if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); step(1); }
    else if (key === 't') today();
    else if (key === 'o') toggleOrientation();
    else if (views[key]) { if (planner().views.includes(views[key])) goToView(views[key], D.parse(ui().date)); }
    else if (toolKeys[key]) setTool(toolKeys[key]);
    else if ((e.key === 'Delete' || e.key === 'Backspace') && sel) { e.preventDefault(); Editor.deleteSelected(); }
    else if (e.key === 'Escape') setTool('nav');
    else if (e.key === '+' || e.key === '=') { Editor.setZoom(Editor.zoom + 0.25); renderToolbar(); }
    else if (e.key === '-') { Editor.setZoom(Editor.zoom - 0.25); renderToolbar(); }
    else if (e.key === '0') { Editor.setZoom(1); renderToolbar(); }
    else if (e.key === '?') helpDialog();
  }

  /* ---------- Wiring ---------- */
  function wire() {
    $('#shelfGrid').addEventListener('click', e => {
      const o = e.target.closest('[data-open]'); if (o) { location.hash = '#/p/' + o.dataset.open; return; }
      const m = e.target.closest('[data-menu]'); if (m) { bookMenu(m, m.dataset.menu); return; }
      if (e.target.closest('#btnNewCard')) libraryDialog();
    });
    $('#btnNew').onclick = libraryDialog;
    $('#shelfSearch').oninput = renderShelf;
    $('#shelfSort').onchange = e => { Store.state.prefs.shelfSort = e.target.value; Store.touch({ silent: true }); renderShelf(); };
    $$('[data-open-calendars]').forEach(b => { b.onclick = calendarsDialog; });
    $$('[data-open-account]').forEach(b => { b.onclick = accountDialog; });
    $('#btnBack').onclick = () => { location.hash = '#/'; };
    $('#btnPrev').onclick = () => step(-1);
    $('#btnNext').onclick = () => step(1);
    $('#btnToday').onclick = today;
    $('#periodLabel').onclick = () => {
      const u = ui();
      if (u.view === 'section') return;
      const inp = $('#goDate');
      if (inp.showPicker) { try { inp.showPicker(); return; } catch (e) { /* fall through */ } }
      inp.focus(); inp.click();
    };
    $('#goDate').onchange = e => { if (e.target.value) { const u = ui(); goToView(u.view === 'section' ? (planner().views.includes('day') ? 'day' : planner().views[0]) : u.view, D.parse(e.target.value)); } };
    $('#btnCustomize').onclick = () => customizeDialog(pid, () => renderPlanner());
    $('#btnHelp').onclick = helpDialog;
    $('#tabs').addEventListener('click', async e => {
      const b = e.target.closest('.tab'); if (!b) return;
      const u = ui(), p = planner();
      if (b.dataset.view) { goToView(b.dataset.view); return; }
      if (b.dataset.sec) { u.view = 'section'; u.sectionId = b.dataset.sec; saveUI(); renderPlanner(); return; }
      if (b.hasAttribute('data-addsec')) {
        const n = await promptDlg('New section', 'New section');
        if (!n) return;
        const sec = { id: Store.uid(), name: n, color: SECTION_COLORS[p.sections.length % SECTION_COLORS.length], pages: [{ id: Store.uid(), template: 'lined' }] };
        p.sections.push(sec);
        Store.updatePlanner(p.id, { sections: p.sections });
        u.view = 'section'; u.sectionId = sec.id; saveUI();
        renderPlanner();
      }
    });
    $('#toolbar').addEventListener('click', toolbarClick);
    $('#toolbar').addEventListener('input', toolbarInput);
    $('#pageFooter').addEventListener('click', e => {
      const sb = e.target.closest('[data-sub]');
      if (sb) { const u = ui(); u.sub = u.sub || {}; u.sub[u.view] = sb.dataset.sub; saveUI(); renderPlanner(); return; }
      const b = e.target.closest('[data-f]'); if (b) footerAction(b.dataset.f);
    });
    ctxEvents();
    document.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', route);
    window.addEventListener('beforeunload', () => Store.saveNow());
    document.addEventListener('visibilitychange', () => { if (document.hidden) Store.saveNow(); });
    setInterval(() => renderSync(), 30000);
  }

  /* ---------- Boot ---------- */
  function boot() {
    Store.init(seed);
    Editor.init($('#pageWrap'), {
      onLink: (v, d) => goToView(v, d),
      onEvent: id => eventDialog({ id }),
      onNewEvent: s => { const [date, time] = s.split('T'); eventDialog({ date, time }); },
      onSwipe: dir => step(dir),
      onSelect: it => renderCtx(it),
      onHistory: () => updateHistoryButtons(),
      onRequestTool: t => setTool(t),
      onError: msg => toast(msg),
      onPenDetected: () => {
        if (!Store.state.prefs.stylusOnly) {
          Store.state.prefs.stylusOnly = true; Store.touch({ silent: true });
          toast('Stylus detected: the pen draws, your finger scrolls. Change this in Account & sync.', 4000);
        }
      },
    });
    Store.on((type, detail) => {
      if (type === 'sync') renderSync(detail);
      if (type === 'error') toast(detail, 4000);
      if (type === 'remote') {
        renderSync();
        if (pid) {
          if (!Store.planner(pid)) { location.hash = '#/'; return; }
          if (Editor.isEditingText) return;
          renderPlanner({ keepScroll: true });
        } else renderShelf();
      }
    });
    wire();
    route();
    renderSync();
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('sw.js').catch(() => { /* offline cache is optional */ });
    }
  }
  boot();
})();
