/* Calendar sources.
 * The prototype cannot complete a real Google / Apple / Outlook sign-in, so "connecting" an
 * account adds a demo calendar with sample events. Importing an .ics file is real: events
 * exported from Google Calendar, Apple Calendar or Outlook are parsed into a new calendar. */
(function () {
  const PROVIDERS = {
    Google: { color: '#4285f4', calendars: [['Work (Google)', '#4285f4'], ['Personal (Google)', '#0b8043']] },
    Apple: { color: '#ff3b30', calendars: [['Home (iCloud)', '#ff9500'], ['Family (iCloud)', '#af52de']] },
    Outlook: { color: '#0078d4', calendars: [['Outlook Calendar', '#0078d4']] },
  };

  function sampleEvents(name, t) {
    const iso = d => D.iso(d);
    const mon = D.startOfWeek(t);
    const day = n => iso(D.addDays(mon, n));
    const samples = {
      'Work (Google)': [
        { title: 'Team stand-up', date: day(0), time: '09:00', endTime: '09:15', recurrence: 'weekdays' },
        { title: 'Project review', date: day(2), time: '14:00', endTime: '15:00', recurrence: 'weekly' },
        { title: '1:1 with manager', date: day(3), time: '11:00', endTime: '11:30', recurrence: 'biweekly' },
        { title: 'Quarterly planning', date: iso(D.addDays(t, 9)), time: '10:00', endTime: '12:00' },
      ],
      'Personal (Google)': [
        { title: 'Gym', date: day(1), time: '18:00', endTime: '19:00', recurrence: 'weekly' },
        { title: 'Gym', date: day(3), time: '18:00', endTime: '19:00', recurrence: 'weekly' },
        { title: 'Dentist', date: iso(D.addDays(t, 5)), time: '08:30', endTime: '09:15' },
      ],
      'Home (iCloud)': [
        { title: 'Trash & recycling', date: day(2), time: '07:00', endTime: '07:15', recurrence: 'weekly' },
        { title: 'Pay rent', date: iso(new Date(t.getFullYear(), t.getMonth(), 1)), allDay: true, recurrence: 'monthly' },
      ],
      'Family (iCloud)': [
        { title: 'Family dinner', date: day(6), time: '17:30', endTime: '19:30', recurrence: 'weekly' },
        { title: "Sam's birthday", date: iso(D.addDays(t, 12)), allDay: true, recurrence: 'yearly' },
      ],
      'Outlook Calendar': [
        { title: 'Client call', date: day(1), time: '13:00', endTime: '13:45', recurrence: 'weekly' },
        { title: 'Conference', date: iso(D.addDays(t, 16)), allDay: true },
      ],
    };
    return samples[name] || [];
  }

  function connect(provider) {
    const t = D.today();
    const added = [];
    PROVIDERS[provider].calendars.forEach(([name, color]) => {
      if (Store.calendars().some(c => c.name === name)) return;
      const cal = Store.addCalendar({ name, color, source: provider, demo: true });
      sampleEvents(name, t).forEach(e => Store.saveEvent(Object.assign({ calendarId: cal.id, notes: '' }, e)));
      added.push(cal);
    });
    return added;
  }
  function disconnect(provider) {
    Store.calendars().filter(c => c.source === provider).forEach(c => Store.removeCalendar(c.id));
  }
  function isConnected(provider) { return Store.calendars().some(c => c.source === provider); }

  /* ---------- Minimal iCalendar (.ics) import ---------- */
  function parseICS(text) {
    const lines = text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '').split(/\r?\n/);
    const events = [];
    let cur = null, calName = null;
    for (const raw of lines) {
      const i = raw.indexOf(':');
      if (i < 0) continue;
      const left = raw.slice(0, i), value = raw.slice(i + 1);
      const [prop, ...params] = left.split(';');
      const P = prop.toUpperCase();
      if (P === 'X-WR-CALNAME') calName = value;
      if (P === 'BEGIN' && value === 'VEVENT') cur = {};
      else if (P === 'END' && value === 'VEVENT') { if (cur && cur.start) events.push(cur); cur = null; }
      else if (cur) {
        if (P === 'SUMMARY') cur.title = unescape(value);
        else if (P === 'DESCRIPTION') cur.notes = unescape(value);
        else if (P === 'DTSTART') cur.start = parseDT(value, params);
        else if (P === 'DTEND') cur.end = parseDT(value, params);
        else if (P === 'RRULE') cur.rrule = value;
      }
    }
    return { name: calName, events: events.map(toEvent) };
  }
  function unescape(s) { return s.replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1'); }
  function parseDT(v, params) {
    const allDay = params.some(p => /VALUE=DATE$/i.test(p)) || /^\d{8}$/.test(v);
    const m = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?/);
    if (!m) return null;
    let d;
    if (m[4] && m[7]) d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]));
    else d = new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0));
    return { d, allDay };
  }
  function toEvent(e) {
    const p = n => String(n).padStart(2, '0');
    const ev = {
      title: e.title || '(No title)', notes: e.notes || '',
      date: D.iso(e.start.d), allDay: e.start.allDay,
      time: e.start.allDay ? '' : `${p(e.start.d.getHours())}:${p(e.start.d.getMinutes())}`,
      endTime: e.end && !e.start.allDay ? `${p(e.end.d.getHours())}:${p(e.end.d.getMinutes())}` : '',
      recurrence: 'none',
    };
    if (e.rrule) {
      const f = (e.rrule.match(/FREQ=(\w+)/) || [])[1];
      const interval = +((e.rrule.match(/INTERVAL=(\d+)/) || [])[1] || 1);
      const byday = (e.rrule.match(/BYDAY=([\w,]+)/) || [])[1];
      if (f === 'DAILY' && interval === 1) ev.recurrence = 'daily';
      else if (f === 'WEEKLY' && byday === 'MO,TU,WE,TH,FR') ev.recurrence = 'weekdays';
      else if (f === 'WEEKLY') ev.recurrence = interval === 2 ? 'biweekly' : 'weekly';
      else if (f === 'MONTHLY') ev.recurrence = 'monthly';
      else if (f === 'YEARLY') ev.recurrence = 'yearly';
      const until = (e.rrule.match(/UNTIL=(\d{8})/) || [])[1];
      if (until) ev.until = `${until.slice(0, 4)}-${until.slice(4, 6)}-${until.slice(6, 8)}`;
    }
    return ev;
  }
  function importICS(text, fileName) {
    const { name, events } = parseICS(text);
    if (!events.length) throw new Error('No events were found in that file.');
    const palette = ['#e76f51', '#2a9d8f', '#8338ec', '#fb8500', '#3a86ff', '#d62828'];
    const cal = Store.addCalendar({ name: name || fileName.replace(/\.ics$/i, ''), color: palette[Store.calendars().length % palette.length], source: 'Imported' });
    events.forEach(e => Store.saveEvent(Object.assign({ calendarId: cal.id }, e)));
    return { cal, count: events.length };
  }

  window.Calendars = { PROVIDERS, connect, disconnect, isConnected, importICS, parseICS };
})();
