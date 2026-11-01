/* "How to use this page" notes for each page type, plus a getting-started path. */
(function () {
  const G = {
    'day:plan': ['Daily plan', [
      ['Top 3 for the day', 'Choose the three tasks that would make today a win. They can come from a goal or a project; what matters is that they move you forward. Do these first.'],
      ['Other tasks', 'Everything else you hope to get to today. Keep the list realistic, since a short list you finish beats a long one you abandon. As you work, mark each task with a symbol from the key at the bottom of the page.'],
      ['Schedule', 'Block out meetings, appointments and time for focused work. Events from your connected calendars appear here on their own. Double-click an hour to add one.'],
      ['Routines', 'Tick each routine once it’s done: morning, workday startup, workday shutdown and evening. Write out the steps on your Daily Rituals page.'],
      ['Tip', 'Plan tomorrow during today’s shutdown routine, or first thing in the morning during your startup routine. Find the time that works and stick with it.'],
    ]],
    'day:notes': ['Daily notes', [
      ['Notes', 'Keep the day’s meeting notes, ideas, numbers and reminders here, all in one place instead of on scattered scraps.'],
      ['Flags', 'Use the narrow column to flag anything that needs follow-up, with a symbol from the task key on the plan page.'],
      ['Daily win', 'Before you close the day, write down one thing that went well, however small. Finishing on a win builds momentum for tomorrow.'],
    ]],
    'week:preview': ['Weekly preview', [
      ['Weeks in quarter', 'The circled number shows how many weeks remain in this quarter. It’s a gentle nudge to keep your goals moving.'],
      ['After-action review', 'List your biggest wins from last week. Then note how far you got on last week’s Top 3 as a percentage, what worked, what didn’t, and what you’ll keep or change.'],
      ['Goal review & list sweep', 'Skim your goals, your lists, anything you delegated or put off, and your daily notes. Update your task list so nothing slips.'],
      ['Habit streaks', 'Write each habit goal on a line, and tick a box for every day this week that you keep it.'],
      ['Rejuvenation', 'Pick three ways to rest and recharge this week, through sleep, food, movement, people or downtime. Then put them on your daily pages so they actually happen.'],
      ['Weekly overview', 'Look over the coming week’s events, projects, tasks and other commitments. The 7-day view helps here.'],
      ['Top 3 for the week', 'Choose the three objectives that matter most this week. They can come from goals or projects.'],
      ['Tip', 'Set aside time between Friday afternoon and Monday morning. Once it’s a habit it takes about twenty minutes.'],
    ]],
    'week:days': ['7-day view', [
      ['At a glance', 'See the week’s main commitments in one place. Events from your calendars appear on their own. Double-click a day to add one.'],
      ['Weekend together', 'Saturday and Sunday share the bottom row so you can plan the weekend as a whole.'],
      ['Go to a day', 'In Navigate mode, tap a day’s name to open its daily pages.'],
    ]],
    'month': ['Calendar', [
      ['Major commitments', 'Add the big things for the month, like trips, deadlines and birthdays. Filling it in once a quarter fixes the important dates in your mind.'],
      ['Date squares', 'Each grey square holds the date. Tap it in Navigate mode to open that day, or double-click a day to add an event.'],
      ['Weekend as a block', 'Saturday and Sunday sit side by side so you can plan them together.'],
      ['Notes', 'List the projects you want to move forward this month, or anything you want to keep in mind.'],
    ]],
    'year': ['12-month view', [
      ['Just the majors', 'There isn’t room for every appointment, so note only the big deadlines, deliverables, trips and commitments.'],
      ['Month links', 'Each month heading (JAN / 2026 and so on) opens that month’s calendar.'],
      ['From your calendars', 'All-day events from your connected calendars are listed under their month automatically.'],
      ['Perspective', 'This page is optional, but it keeps the bigger picture in view while you plan your weeks and days.'],
    ]],
    'quarter': ['Quarterly preview', [
      ['When', 'Near the end of each quarter, somewhere quiet. Schedule it as a recurring appointment with yourself.'],
      ['After-action review', 'List your top wins from the quarter, record how far you got on each goal as a percentage, and note what worked and what didn’t.'],
      ['Continue and change', 'Decide what you’ll keep doing and what you’ll do differently next quarter.'],
      ['Next quarter overview', 'Work through the checklist to set up the coming quarter. Review your goals and longer-range plans, choose the quarter’s goals, add major events, and adjust your rituals and model week.'],
    ]],
    'goals': ['Goal detail', [
      ['Type of goal', 'Choose achievement (a one-time result with a finish line) or habit (something you want to do regularly).'],
      ['Goal statement', 'Write the goal so it’s specific, measurable and actionable, with a deadline. Make it a stretch that excites you and matters to you.'],
      ['Life areas', 'Tick the areas of life this goal touches. A goal can touch more than one.'],
      ['Key motivations', 'Write short reasons why this goal matters, or what’s at stake if you don’t reach it. Then rank them. Come back to them when your motivation dips.'],
      ['Next steps', 'List the first few actions to get started. Keep them simple, and resist adding too many.'],
      ['Celebration', 'Decide now how you’ll celebrate when you get there, such as a trip, a purchase or an experience, and picture it.'],
      ['Goal progress', 'For achievement goals, mark how far along you are on the 0–100% bar. Add milestones if they help.'],
      ['Habit streaks', 'For habit goals, each row is one month of the quarter and each number is a date. Tick the days you keep the habit.'],
    ]],
    'annual-goals': ['Annual goals', [
      ['Keep it focused', 'Write no more than eight goals for the year. The two spare rows are for new goals once you complete one.'],
      ['Number', 'Number the goals in the order you plan to tackle them.'],
      ['Quarter', 'In the Q column, write the quarter each goal is due. Two or three goals per quarter is plenty.'],
      ['Done', 'Tick a goal off when you complete it. Reading this list often keeps your goals in view.'],
    ]],
    'rituals': ['Daily rituals', [
      ['Four routines', 'Morning, workday startup, workday shutdown and evening. Repeating good habits automatically leaves your energy free for the day itself.'],
      ['Activities', 'List the steps of each routine, numbered in the order you’ll do them.'],
      ['Time', 'Estimate the minutes each step takes, then add them up for the total.'],
      ['Adjust', 'Your routines will change with your season of life. Revise them whenever they stop fitting.'],
    ]],
    'idealweek': ['Model week', [
      ['Picture it', 'Map how your week would run if your time were entirely your own.'],
      ['Group similar work', 'Batch similar activities into blocks, such as meetings, deep work, admin and personal time.'],
      ['Energy', 'Use the narrow grey column to mark when your energy is usually high or low, and put demanding work in your high-energy hours.'],
      ['Themes', 'Use the shaded row to give whole days a theme, for example a meeting-free day.'],
      ['A guide, not a rule', 'Real weeks won’t match it exactly, and that’s fine. Use it to shape each new week.'],
    ]],
    'project-tracker': ['Project tracker', [
      ['Name', 'List the projects that matter most this quarter.'],
      ['Due', 'Write each deadline, and order the projects by due date to stay ahead of them.'],
      ['Progress', 'Shade the bar, write in milestones, or use percentages, whichever works for you.'],
    ]],
  };
  const START = [
    'Start with the daily pages. Write your Top 3 for the day, your other tasks and your schedule.',
    'Do your first weekly preview: review last week and plan the next.',
    'Write your annual goals, no more than eight.',
    'Fill in a goal detail page for each goal.',
    'Add major events to the calendar, and to the 12-month view if you like.',
    'Write out your daily rituals.',
    'Sketch your model week.',
    'At the end of the quarter, do your quarterly preview.',
  ];
  window.Guide = { pages: G, start: START };
})();
