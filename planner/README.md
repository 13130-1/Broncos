# Digital Planner — web prototype

A working prototype of the *Digital Planner Application* scope (v1.0, Nov 2026). It is plain HTML, CSS and JavaScript with no build step and no dependencies.

**Run it:** serve this folder over HTTP, for example `python3 -m http.server` from `planner/`, then open `http://localhost:8000/`. On GitHub Pages it is at `/planner/`. Opening `index.html` directly from disk also works, but without the offline cache.

## What's in it (mapped to the scope)

| Scope | Prototype |
|---|---|
| 3.1 Calendar & scheduling | Day, week and month pages show events in their calendar colors. Create events from the toolbar, by double-clicking a time or day, or from any planner view, with title, date, time, repeat (daily, weekdays, weekly, every 2 weeks, monthly, yearly, with optional end date) and notes. You can show or hide each calendar and pick the default calendar for new events. **Real events:** import an `.ics` file exported from Google, Apple or Outlook. **Connect Google / Apple / Outlook** adds *demo* calendars, because real sign-in needs a backend. |
| 3.2 Planner creation & customization | My Bookshelf lets you create, open, rename, customize, duplicate, delete, search and sort planners. Each planner has its own name, cover color and pattern, paper theme, layouts (multiyear, year, quarter, month, week, day), day-page style, and sections that you can add, rename, recolor, reorder and delete. Pages can be added without limit. |
| Portrait / landscape | Each planner is set to portrait (1000×1400) or landscape (1400×1000). Choose it when you create a planner (it defaults to how the device is held), in Customize, or with the toolbar button or the **O** key. Date pages have layouts designed for landscape; structured section pages become a two-page spread; plain paper fills the page. On a tablet a landscape page fits the screen with no scrolling. Writing is kept separately for each orientation, so switching back shows it again. |
| Preserve content on layout change | Content is stored by date (for example `week:2026-10-26`), not by layout. Hiding a layout or changing the day style keeps your writing, and turning the layout back on brings it back. |
| 3.3 Handwriting & page editing | Pen with pressure support, highlighter, stroke eraser, and undo/redo for every page. Navigate mode is separate from drawing. Stylus-only mode lets the Pencil draw while your finger scrolls and swipes; it turns on automatically when a pen is detected. Text boxes support font, size, color, bold, italic, alignment and fill. You can insert images (button, paste or drag-and-drop) and emoji or label stickers. Any item can be moved, resized and rotated. Sticker color, shape, shadow, padding and text are all adjustable. |
| 3.4 / 3.5 Templates | 16 planner templates: Productivity, Professional, Education, Lifestyle and Creative. There are also 27 page types, including to-do, daily and weekly tasks, goals, habits, routine, Pomodoro, project, meeting, client, social media, Cornell notes, lesson plan, assignments, journal, gratitude, budget, meals, chores, travel, workout, wellness, reading, and lined, dot, graph, blank and sketch paper. The library can be searched and filtered by category. Checklists are drawn as page content, as the scope specifies. |
| 3.6 Navigation | Days, weeks, months, quarters and years on the page are links. You can swipe, use the arrows, jump to Today, or pick any date. Keyboard shortcuts include ← →, T, D/W/M/Q/Y, tool keys, Ctrl+Z, and `?` for help. Links only work in Navigate mode, so writing never turns the page by accident. |
| 3.7 Sync & offline | Saving is local-first. Every planner, page and event carries a timestamp and is merged separately, so the newest edit wins. **Live sync between browser tabs** shows multi-device sync in action. *Simulate offline* queues changes and reconciles them when you reconnect. A sync status pill, backup download and merge-restore are included. A service worker caches the app so it works offline. |
| 4 Nonfunctional | Responsive from phone to desktop, light and dark modes, keyboard access, labelled controls and visible focus. |

## Known limits of the prototype

- **No backend.** Data lives in this browser's `localStorage`, which holds about 5 MB; images are shrunk on import to save space. "Sync" covers tabs of the same browser and offline queueing. Real cross-device sync and accounts need a server.
- **Calendar providers are simulated**, apart from `.ics` import. Edits to a repeating event apply to every occurrence.
- **Not yet tested on a real iPad or Apple Pencil.** Testing so far used desktop Chromium with mouse input, at phone and desktop sizes.
- Section 5 discovery items are out of scope: structured tasks, search and handwriting recognition, PDF export, collaboration, and analytics.

## Code map

- `js/dates.js` — date math and the stable page keys
- `js/store.js` — data model, persistence, merge/sync, recurrence
- `js/templates.js` — page templates (SVG) and the planner template catalog
- `js/layouts.js` — year, quarter, month, week, day and multiyear layouts with links and events
- `js/editor.js` — page canvas: ink, text, images, stickers, undo
- `js/calendar.js` — demo providers and `.ics` import
- `js/app.js` — bookshelf, planner screen, dialogs, keyboard, sync UI
