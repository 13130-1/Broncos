/* Page editor: renders a page (background SVG + items + ink) and handles input.
 * Tools: nav (follow links, swipe), pen, highlighter, eraser, select (move/resize/rotate), text.
 * Coordinates are in page units (1000 x 1400) regardless of zoom. */
(function () {
  const PW = 1000, PH = 1400;
  const uid = () => Store.uid();

  let wrap, sizer, page, bgEl, itemsEl, canvas, ctx, base, bctx;
  let cb = {};
  let cur = null;          // { plannerId, pageKey }
  let content = { strokes: [], items: [] };
  const history = new Map(); // pageKey -> { undo: [], redo: [] }
  let scale = 1, zoom = 1, inkK = 1;
  let selectedId = null, editingId = null;

  const tools = {
    tool: 'nav',
    pen: { color: '#1d2b3a', size: 3 },
    highlighter: { color: '#ffe066', size: 22 },
    eraser: { size: 18 },
  };

  /* ---------- Setup ---------- */
  function init(wrapEl, callbacks) {
    wrap = wrapEl; cb = callbacks;
    wrap.innerHTML = `<div class="page-sizer"><div class="page" role="region" aria-label="Planner page">
      <div class="page-bg"></div><div class="page-items"></div><canvas class="page-ink" aria-hidden="true"></canvas></div></div>`;
    sizer = wrap.querySelector('.page-sizer');
    page = wrap.querySelector('.page');
    bgEl = wrap.querySelector('.page-bg');
    itemsEl = wrap.querySelector('.page-items');
    canvas = wrap.querySelector('.page-ink');
    ctx = canvas.getContext('2d');
    base = document.createElement('canvas');
    bctx = base.getContext('2d');

    bindNav();
    bindInk();
    bindItems();
    bindDrop();
    new ResizeObserver(() => relayout()).observe(wrap);
  }

  function show({ bg, plannerId, pageKey, theme, accent, keepScroll }) {
    finishEditing();
    page.style.setProperty('--pc', accent || '#3d5a80');
    const same = cur && cur.plannerId === plannerId && cur.pageKey === pageKey;
    cur = { plannerId, pageKey };
    page.className = 'page theme-' + (theme || 'classic') + ' tool-' + tools.tool;
    bgEl.innerHTML = bg;
    content = JSON.parse(JSON.stringify(Store.content(plannerId, pageKey)));
    if (!same) { selectedId = null; cb.onSelect && cb.onSelect(null); }
    renderItems();
    rebuildBase();
    if (!same && !keepScroll) wrap.scrollTop = 0;
    cb.onHistory && cb.onHistory();
  }

  function reloadContent() {
    if (!cur || drawing || editingId) return;
    content = JSON.parse(JSON.stringify(Store.content(cur.plannerId, cur.pageKey)));
    if (selectedId && !content.items.find(i => i.id === selectedId)) selectedId = null;
    renderItems(); rebuildBase();
  }

  function relayout() {
    if (!wrap) return;
    const avail = Math.max(240, wrap.clientWidth - 24);
    const fit = Math.min(avail / PW, 1.1);
    scale = fit * zoom;
    sizer.style.width = PW * scale + 'px';
    sizer.style.height = PH * scale + 'px';
    page.style.transform = `scale(${scale})`;
    page.style.setProperty('--inv', (1 / scale).toFixed(3));
    const k = Math.min(3, (window.devicePixelRatio || 1) * scale * 1.0);
    if (Math.abs(k - inkK) > 0.05 || canvas.width === 300) {
      inkK = k;
      canvas.width = base.width = Math.round(PW * k);
      canvas.height = base.height = Math.round(PH * k);
      rebuildBase();
    }
  }

  function setZoom(z) { zoom = Math.max(0.5, Math.min(3, z)); relayout(); }

  function toPage(e) {
    const r = page.getBoundingClientRect();
    return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale };
  }

  /* ---------- History ---------- */
  function hist() {
    const k = cur.plannerId + '|' + cur.pageKey;
    if (!history.has(k)) history.set(k, { undo: [], redo: [] });
    return history.get(k);
  }
  function snapshot() { return JSON.stringify(content); }
  function pushUndo(snap) {
    const h = hist();
    h.undo.push(snap || snapshot());
    if (h.undo.length > 100) h.undo.shift();
    h.redo = [];
  }
  function commit() {
    Store.setContent(cur.plannerId, cur.pageKey, content);
    cb.onHistory && cb.onHistory();
  }
  function undo() {
    if (!cur) return;
    finishEditing();
    const h = hist(); if (!h.undo.length) return;
    h.redo.push(snapshot()); content = JSON.parse(h.undo.pop());
    afterRestore();
  }
  function redo() {
    if (!cur) return;
    const h = hist(); if (!h.redo.length) return;
    h.undo.push(snapshot()); content = JSON.parse(h.redo.pop());
    afterRestore();
  }
  function afterRestore() {
    if (selectedId && !content.items.find(i => i.id === selectedId)) select(null);
    renderItems(); rebuildBase(); commit();
  }
  function canUndo() { return !!cur && hist().undo.length > 0; }
  function canRedo() { return !!cur && hist().redo.length > 0; }

  /* ---------- Tools ---------- */
  function setTool(t) {
    finishEditing();
    tools.tool = t;
    if (t !== 'select' && t !== 'text') select(null);
    page.className = page.className.replace(/tool-\w+/, 'tool-' + t);
  }

  /* ---------- Navigation mode: links, events, swipe ---------- */
  function bindNav() {
    bgEl.addEventListener('click', e => {
      if (tools.tool !== 'nav' || swipeConsumed) return;
      const ev = e.target.closest('[data-event]');
      if (ev) { cb.onEvent(ev.dataset.event); return; }
      const ln = e.target.closest('[data-link]');
      if (ln) { const [v, d] = ln.dataset.link.split('|'); cb.onLink(v, D.parse(d)); }
    });
    bgEl.addEventListener('dblclick', e => {
      if (tools.tool !== 'nav') return;
      if (e.target.closest('[data-event],[data-link]')) return;
      const t = e.target.closest('[data-newevent]');
      if (t) cb.onNewEvent(t.dataset.newevent);
    });
    bgEl.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const t = e.target.closest('[data-event],[data-link]');
      if (!t) return;
      e.preventDefault();
      if (t.dataset.event) cb.onEvent(t.dataset.event);
      else { const [v, d] = t.dataset.link.split('|'); cb.onLink(v, D.parse(d)); }
    });
    // Swipe between pages (touch / pen in navigate mode)
    let sw = null;
    wrap.addEventListener('pointerdown', e => {
      if (tools.tool !== 'nav' || e.pointerType === 'mouse') return;
      sw = { x: e.clientX, y: e.clientY, t: Date.now() };
    });
    wrap.addEventListener('pointerup', e => { if (sw) { checkSwipe(sw, e); sw = null; } });
    wrap.addEventListener('pointercancel', () => { sw = null; });
  }
  let swipeConsumed = false;
  function checkSwipe(start, e) {
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (Math.abs(dx) > 70 && Math.abs(dx) > 2 * Math.abs(dy) && Date.now() - start.t < 700) {
      swipeConsumed = true; setTimeout(() => { swipeConsumed = false; }, 50);
      cb.onSwipe(dx < 0 ? 1 : -1);
      return true;
    }
    return false;
  }

  /* ---------- Ink ---------- */
  let drawing = null, eraseSnap = null, erased = false, pan = null, penSeen = false;

  function bindInk() {
    canvas.addEventListener('pointerdown', e => {
      if (!['pen', 'highlighter', 'eraser'].includes(tools.tool)) return;
      if (e.pointerType === 'pen' && !penSeen) { penSeen = true; cb.onPenDetected && cb.onPenDetected(); }
      // Palm rejection / finger scrolling when stylus-only mode is on
      if (e.pointerType === 'touch' && Store.state.prefs.stylusOnly) {
        pan = { id: e.pointerId, x: e.clientX, y: e.clientY, top: wrap.scrollTop, t: Date.now(), sx: e.clientX, sy: e.clientY };
        canvas.setPointerCapture(e.pointerId);
        return;
      }
      if (e.button > 0) return;
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      const p = toPage(e);
      if (tools.tool === 'eraser') {
        eraseSnap = snapshot(); erased = false; drawing = { erase: true, id: e.pointerId };
        eraseAt(p);
        return;
      }
      const t = tools[tools.tool];
      drawing = { id: e.pointerId, stroke: { id: uid(), tool: tools.tool === 'pen' ? 'pen' : 'hl', color: t.color, size: t.size, points: [[r1(p.x), r1(p.y), pr(e)]] } };
      frame();
    });
    canvas.addEventListener('pointermove', e => {
      if (pan && e.pointerId === pan.id) { wrap.scrollTop = pan.top - (e.clientY - pan.y); return; }
      if (!drawing || e.pointerId !== drawing.id) return;
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      for (const ce of (evs.length ? evs : [e])) {
        const p = toPage(ce);
        if (drawing.erase) eraseAt(p);
        else {
          const pts = drawing.stroke.points, last = pts[pts.length - 1];
          if (Math.hypot(p.x - last[0], p.y - last[1]) > 0.8) pts.push([r1(p.x), r1(p.y), pr(ce)]);
        }
      }
      if (!drawing.erase) requestFrame();
    });
    const end = e => {
      if (pan && e.pointerId === pan.id) { checkSwipe({ x: pan.sx, y: pan.sy, t: pan.t }, e); pan = null; return; }
      if (!drawing || e.pointerId !== drawing.id) return;
      if (drawing.erase) {
        if (erased) { pushUndo(eraseSnap); commit(); }
      } else {
        const s = drawing.stroke;
        if (s.points.length === 1) s.points.push([s.points[0][0] + 0.5, s.points[0][1] + 0.5, s.points[0][2]]);
        pushUndo();
        content.strokes.push(s);
        drawStroke(bctx, s, inkK);
        commit();
      }
      drawing = null;
      frame();
    };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
  }
  const r1 = v => Math.round(v * 10) / 10;
  const pr = e => (e.pointerType === 'mouse' || !e.pressure ? 0.5 : Math.round(e.pressure * 100) / 100);

  let raf = 0;
  function requestFrame() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; frame(); }); }
  function frame() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(base, 0, 0);
    if (drawing && drawing.stroke) drawStroke(ctx, drawing.stroke, inkK);
  }
  function rebuildBase() {
    if (!bctx) return;
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.clearRect(0, 0, base.width, base.height);
    content.strokes.filter(s => s.tool === 'hl').forEach(s => drawStroke(bctx, s, inkK));
    content.strokes.filter(s => s.tool !== 'hl').forEach(s => drawStroke(bctx, s, inkK));
    frame();
  }
  function drawStroke(c, s, k) {
    const pts = s.points;
    c.save();
    c.setTransform(k, 0, 0, k, 0, 0);
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = s.color;
    if (s.tool === 'hl') {
      c.globalAlpha = 0.38;
      c.globalCompositeOperation = 'multiply';
      c.lineWidth = s.size;
      c.lineCap = 'butt';
      c.beginPath();
      c.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
        c.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
      }
      c.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
      c.stroke();
    } else {
      // Variable width from pressure, drawn as short smoothed segments
      let px = pts[0][0], py = pts[0][1];
      for (let i = 1; i < pts.length; i++) {
        const [x, y, p] = pts[i];
        const mx = i < pts.length - 1 ? (x + pts[i + 1][0]) / 2 : x;
        const my = i < pts.length - 1 ? (y + pts[i + 1][1]) / 2 : y;
        const pp = (p + pts[i - 1][2]) / 2;
        c.lineWidth = s.size * (0.35 + pp * 1.3);
        c.beginPath();
        c.moveTo(px, py);
        c.quadraticCurveTo(x, y, mx, my);
        c.stroke();
        px = mx; py = my;
      }
    }
    c.restore();
  }
  function distToSeg(p, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const l2 = dx * dx + dy * dy;
    let t = l2 ? ((p.x - a[0]) * dx + (p.y - a[1]) * dy) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (a[0] + t * dx), p.y - (a[1] + t * dy));
  }
  function eraseAt(p) {
    const r = tools.eraser.size;
    const before = content.strokes.length;
    content.strokes = content.strokes.filter(s => {
      const pts = s.points, reach = r + s.size / 2;
      for (let i = 0; i < pts.length - 1; i++) if (distToSeg(p, pts[i], pts[i + 1]) < reach) return false;
      return true;
    });
    if (content.strokes.length !== before) { erased = true; rebuildBase(); }
  }

  /* ---------- Items: text, images, stickers ---------- */
  function stickerStyle(it) {
    const pad = it.pad == null ? 10 : it.pad;
    const shapes = {
      rounded: 'border-radius:12px;',
      pill: 'border-radius:999px;',
      circle: 'border-radius:50%;',
      square: 'border-radius:2px;',
      tag: 'border-radius:6px;clip-path:polygon(0 0,86% 0,100% 50%,86% 100%,0 100%);',
      banner: 'clip-path:polygon(0 0,100% 0,93% 50%,100% 100%,0 100%,7% 50%);',
    };
    const fs = it.kind === 'emoji' ? (it.h - pad * 2) * 0.8 : Math.max(10, (it.h - pad * 2) * 0.48);
    return `background:${it.bg || 'transparent'};color:${it.color || '#222'};padding:${pad}px;font-size:${fs}px;` +
      (shapes[it.shape || 'rounded'] || '') +
      (it.shade ? (it.shape === 'tag' || it.shape === 'banner' ? 'filter:drop-shadow(2px 4px 4px rgba(0,0,0,.28));' : 'box-shadow:2px 5px 10px rgba(0,0,0,.25);') : '');
  }

  function renderItems() {
    itemsEl.innerHTML = '';
    content.items.forEach(it => itemsEl.appendChild(itemEl(it)));
  }
  function itemEl(it) {
    const el = document.createElement('div');
    el.className = 'item kind-' + it.type + (it.id === selectedId ? ' selected' : '');
    el.dataset.id = it.id;
    placeEl(el, it);
    let inner = '';
    if (it.type === 'text') {
      inner = `<div class="item-text" style="font-size:${it.size}px;color:${it.color};font-weight:${it.bold ? 700 : 400};font-style:${it.italic ? 'italic' : 'normal'};text-align:${it.align || 'left'};font-family:${fontStack(it.font)};${it.bg ? 'background:' + it.bg + ';' : ''}"></div>`;
    } else if (it.type === 'image') {
      inner = `<img src="${it.src}" alt="" draggable="false">`;
    } else if (it.type === 'sticker') {
      inner = `<div class="sticker" style="${stickerStyle(it)}"><span></span></div>`;
    }
    el.innerHTML = inner + '<div class="h h-rotate" title="Rotate"></div><div class="h h-resize" title="Resize"></div><button class="h h-del" title="Delete" aria-label="Delete item">×</button>';
    if (it.type === 'text') el.querySelector('.item-text').innerText = it.text || '';
    if (it.type === 'sticker') el.querySelector('.sticker span').textContent = it.kind === 'emoji' ? it.emoji : (it.text || '');
    return el;
  }
  function fontStack(f) {
    return { sans: 'var(--font-sans)', serif: 'Georgia, "Times New Roman", serif', hand: '"Comic Sans MS", "Segoe Print", "Bradley Hand", cursive', mono: 'ui-monospace, Menlo, Consolas, monospace' }[f || 'sans'];
  }
  function placeEl(el, it) {
    el.style.left = it.x + 'px'; el.style.top = it.y + 'px';
    el.style.width = it.w + 'px'; el.style.height = it.h + 'px';
    el.style.transform = `rotate(${it.rot || 0}deg)`;
  }
  const findItem = id => content.items.find(i => i.id === id);
  const elOf = id => itemsEl.querySelector(`[data-id="${id}"]`);

  function select(id) {
    if (selectedId === id) return;
    selectedId = id;
    itemsEl.querySelectorAll('.item').forEach(el => el.classList.toggle('selected', el.dataset.id === id));
    cb.onSelect && cb.onSelect(id ? findItem(id) : null);
  }

  function bindItems() {
    let op = null;
    itemsEl.addEventListener('pointerdown', e => {
      const tool = tools.tool;
      if (tool !== 'select' && tool !== 'text') return;
      const el = e.target.closest('.item');
      const p = toPage(e);
      if (e.target.classList.contains('h-del')) { e.preventDefault(); deleteSelected(); return; }
      if (!el) {
        finishEditing();
        if (tool === 'text') { e.preventDefault(); addText(p); }
        else select(null);
        return;
      }
      const it = findItem(el.dataset.id);
      if (editingId === it.id) return; // let the caret move inside the text
      if (tool === 'text' && it.type === 'text') { e.preventDefault(); select(it.id); startEditing(it.id); return; }
      e.preventDefault();
      finishEditing();
      select(it.id);
      const snap = snapshot();
      if (e.target.classList.contains('h-rotate')) op = { type: 'rotate', it, snap };
      else if (e.target.classList.contains('h-resize')) op = { type: 'resize', it, snap, p0: p, w0: it.w, h0: it.h };
      else op = { type: 'move', it, snap, p0: p, x0: it.x, y0: it.y, t0: Date.now() };
      op.moved = false;
      itemsEl.setPointerCapture(e.pointerId);
    });
    itemsEl.addEventListener('pointermove', e => {
      if (!op) return;
      const p = toPage(e), it = op.it;
      op.moved = true;
      if (op.type === 'move') {
        it.x = Math.round(op.x0 + p.x - op.p0.x); it.y = Math.round(op.y0 + p.y - op.p0.y);
      } else if (op.type === 'rotate') {
        const cx = it.x + it.w / 2, cy = it.y + it.h / 2;
        let a = Math.atan2(p.y - cy, p.x - cx) * 180 / Math.PI + 90;
        if (e.shiftKey) a = Math.round(a / 15) * 15;
        else for (const snapA of [0, 90, 180, -90, 270]) if (Math.abs(a - snapA) < 4) a = snapA;
        it.rot = Math.round(a);
      } else if (op.type === 'resize') {
        const rad = (it.rot || 0) * Math.PI / 180;
        const dx = p.x - op.p0.x, dy = p.y - op.p0.y;
        const lx = dx * Math.cos(rad) + dy * Math.sin(rad), ly = -dx * Math.sin(rad) + dy * Math.cos(rad);
        let w = Math.max(30, op.w0 + lx), h = Math.max(24, op.h0 + ly);
        if (it.type !== 'text' && !e.shiftKey) { const r = op.w0 / op.h0; if (w / h > r) h = w / r; else w = h * r; }
        it.w = Math.round(w); it.h = Math.round(h);
      }
      const el = elOf(it.id);
      placeEl(el, it);
      if (it.type === 'sticker') el.querySelector('.sticker').setAttribute('style', stickerStyle(it));
    });
    const end = () => {
      if (!op) return;
      if (op.moved) { pushUndo(op.snap); commit(); }
      op = null;
    };
    itemsEl.addEventListener('pointerup', end);
    itemsEl.addEventListener('pointercancel', end);
    itemsEl.addEventListener('dblclick', e => {
      const el = e.target.closest('.item-text');
      if (el && (tools.tool === 'select' || tools.tool === 'text')) startEditing(el.parentElement.dataset.id);
    });
  }

  function addText(p) {
    pushUndo();
    const it = { id: uid(), type: 'text', x: Math.round(p.x), y: Math.round(p.y - 18), w: 380, h: 56, rot: 0, text: '', size: 26, color: (getComputedStyle(page).getPropertyValue('--ink').trim() || '#1d2b3a'), font: 'sans', bold: false, italic: false, align: 'left' };
    content.items.push(it);
    itemsEl.appendChild(itemEl(it));
    select(it.id);
    startEditing(it.id, true);
  }

  function startEditing(id, isNew) {
    if (editingId === id) return;
    finishEditing();
    const it = findItem(id); if (!it || it.type !== 'text') return;
    const el = elOf(id), tx = el.querySelector('.item-text');
    editingId = id;
    el.classList.add('editing');
    tx.contentEditable = 'true';
    tx.setAttribute('aria-label', 'Text box');
    tx.focus();
    const range = document.createRange(); range.selectNodeContents(tx); range.collapse(false);
    const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
    const snap = isNew ? null : snapshot();
    tx.oninput = () => { if (tx.scrollHeight > it.h) { it.h = tx.scrollHeight; el.style.height = it.h + 'px'; } };
    tx.onblur = () => finishEditing();
    tx.onkeydown = e => { if (e.key === 'Escape') { e.preventDefault(); tx.blur(); } };
    tx._snap = snap;
  }
  function finishEditing() {
    if (!editingId) return;
    const id = editingId; editingId = null;
    const it = findItem(id), el = elOf(id);
    if (!it || !el) return;
    const tx = el.querySelector('.item-text');
    tx.contentEditable = 'false'; tx.onblur = null;
    el.classList.remove('editing');
    const text = tx.innerText.replace(/\n$/, '');
    if (!text.trim()) {
      content.items = content.items.filter(i => i.id !== id);
      el.remove();
      if (selectedId === id) select(null);
      commit();
      return;
    }
    if (text !== it.text) {
      if (tx._snap) pushUndo(tx._snap);
      it.text = text;
    }
    commit();
  }

  function insertItem(it) {
    pushUndo();
    const c = visibleCenter();
    it.id = uid(); it.rot = it.rot || 0;
    it.x = Math.round(c.x - it.w / 2); it.y = Math.round(c.y - it.h / 2);
    content.items.push(it);
    itemsEl.appendChild(itemEl(it));
    commit();
    cb.onRequestTool && cb.onRequestTool('select');
    select(it.id);
  }
  function visibleCenter() {
    const r = page.getBoundingClientRect(), wr = wrap.getBoundingClientRect();
    const cy = (Math.max(r.top, wr.top) + Math.min(r.bottom, wr.bottom)) / 2;
    return { x: PW / 2, y: Math.max(100, Math.min(PH - 100, (cy - r.top) / scale)) };
  }
  function insertSticker(spec) {
    const it = Object.assign({ type: 'sticker', shade: true, pad: 10 }, spec);
    if (it.kind === 'emoji') { it.w = it.w || 110; it.h = it.h || 110; it.pad = spec.pad == null ? 6 : spec.pad; }
    else { it.w = it.w || Math.max(160, (it.text || '').length * 20 + 60); it.h = it.h || 64; }
    insertItem(it);
  }
  function insertImage(file, at) {
    return readImage(file).then(({ src, w, h }) => {
      const maxW = 520, s = Math.min(1, maxW / w);
      const it = { type: 'image', src, w: Math.round(w * s), h: Math.round(h * s) };
      insertItem(it);
      if (at) { it.x = Math.round(at.x - it.w / 2); it.y = Math.round(at.y - it.h / 2); placeEl(elOf(it.id), it); commit(); }
    });
  }
  function readImage(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onerror = reject;
      fr.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Could not read that image.'));
        img.onload = () => {
          const MAX = 1000, s = Math.min(1, MAX / Math.max(img.width, img.height));
          const w = Math.round(img.width * s), h = Math.round(img.height * s);
          const c = document.createElement('canvas'); c.width = w; c.height = h;
          c.getContext('2d').drawImage(img, 0, 0, w, h);
          const png = /png|gif|svg/.test(file.type);
          resolve({ src: c.toDataURL(png ? 'image/png' : 'image/jpeg', 0.85), w, h });
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }
  function bindDrop() {
    page.addEventListener('dragover', e => { if ([...e.dataTransfer.items].some(i => i.kind === 'file')) e.preventDefault(); });
    page.addEventListener('drop', e => {
      const f = [...e.dataTransfer.files].find(f => f.type.startsWith('image/'));
      if (!f) return;
      e.preventDefault();
      insertImage(f, toPage(e)).catch(err => cb.onError && cb.onError(err.message));
    });
    document.addEventListener('paste', e => {
      if (!cur || editingId || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
      const f = [...(e.clipboardData || {}).files || []].find(f => f.type.startsWith('image/'));
      if (f) { e.preventDefault(); insertImage(f).catch(err => cb.onError && cb.onError(err.message)); }
    });
  }

  function updateSelected(patch) {
    const it = selectedId && findItem(selectedId);
    if (!it) return;
    pushUndo();
    Object.assign(it, patch);
    const old = elOf(it.id), fresh = itemEl(it);
    old.replaceWith(fresh);
    commit();
    cb.onSelect && cb.onSelect(it);
  }
  function deleteSelected() {
    if (!selectedId) return;
    pushUndo();
    content.items = content.items.filter(i => i.id !== selectedId);
    const el = elOf(selectedId); el && el.remove();
    select(null);
    commit();
  }
  function bringToFront() {
    const it = selectedId && findItem(selectedId); if (!it) return;
    pushUndo();
    content.items = content.items.filter(i => i !== it).concat(it);
    renderItems(); commit();
  }
  function nudge(dx, dy) {
    const it = selectedId && findItem(selectedId); if (!it) return;
    pushUndo(); it.x += dx; it.y += dy; placeEl(elOf(it.id), it); commit();
  }
  function clearPage() {
    if (!content.strokes.length && !content.items.length) return false;
    pushUndo();
    content = { strokes: [], items: [] };
    select(null); renderItems(); rebuildBase(); commit();
    return true;
  }

  window.Editor = {
    init, show, relayout, reloadContent, setTool, undo, redo, canUndo, canRedo,
    insertSticker, insertImage, updateSelected, deleteSelected, bringToFront, nudge, clearPage, finishEditing,
    get tools() { return tools; },
    get tool() { return tools.tool; },
    get zoom() { return zoom; },
    setZoom,
    get isEditingText() { return !!editingId; },
    get selected() { return selectedId ? findItem(selectedId) : null; },
  };
})();
