# Pathfinder — Student Career Roadmap & Placement Readiness Tracker

A self-contained, browser-based web application that helps students plan, track, and
monitor their placement preparation journey — from DSA and aptitude to projects, resume
building, and interview readiness.

No sign-up, no server, and no build step. Open `index.html` and start tracking.

---

## Features

**Profile & Career Goals**
- Personal profile (name, college, degree, CGPA, graduation year)
- Target role, target companies, preparation timeline, and objectives
- Fully customizable roadmap categories — add or remove areas to match your goal

**Roadmap & Task Management**
- Create, edit, complete, and delete preparation tasks
- Organize tasks by category, priority (high/medium/low), and status (pending/ongoing/completed)
- Search tasks by title and filter by category, status, or priority

**Skill Tracking & Gap Analysis**
- Category-wise breakdown of completed, ongoing, and pending topics
- Automatic skill-gap detection for categories under 40% completion
- A full skill summary table across every category

**Placement Readiness Score**
- A weighted 0–100 readiness score combining overall progress, category balance, and
  preparation consistency
- Four readiness levels: **Beginner → Intermediate → Advanced → Interview-Ready**

**Dashboard**
- Readiness score ring, overall progress, current streak, and weekly activity
- Category progress bars, personalized recommendations, recent activity, and upcoming tasks

**Analytics & Insights**
- Readiness trend chart over time
- Weekly activity bar chart
- Consistency score, average completions per active day, longest streak, and strongest category
- Charts are drawn natively in SVG — no external charting library required

**Consistency Tracking**
- Daily/weekly activity log
- Current streak and longest streak, calculated from your completion history

**Achievements**
- 12 milestone badges covering task completion, consistency, category mastery, and
  readiness levels, unlocked automatically as you make progress

**History**
- A full chronological timeline of every task added and completed

**Data Export**
- One-click export of a full progress report (profile, goals, category stats, tasks,
  readiness history, and achievements) as a JSON file you can keep or share

---

## Getting started

1. Unzip the project folder.
2. Open `index.html` in any modern browser (Chrome, Edge, Firefox, Safari).
3. That's it — the app loads with a sample roadmap already filled in so you can see how
   everything works. Edit or delete the sample tasks and make it your own from the
   **Profile & Goals** page.

No installation, no internet connection required after the first load (the interface
font loads from Google Fonts if you're online; it falls back to your system font if not).

---

## How your data is stored

All data — profile, goals, categories, tasks, history, streaks, achievements, and
readiness scores — is stored **entirely in your browser's `localStorage`**. Nothing is
sent to a server.

This means:
- Your data stays on this device, in this browser.
- Clearing your browser's site data/history will erase it — use **Export data** in the
  sidebar regularly if you want a backup.
- Opening the app in a different browser or device starts a fresh dataset.
- The **Reset all data** button in the sidebar permanently erases everything and reseeds
  the starter roadmap — use it if you want to start over.

---

## Project structure

```
career-tracker/
├── index.html    Page structure and layout for every screen
├── style.css     Design system and all styling
├── app.js        State management, calculations, rendering, and interactions
└── README.md     This file
```

## How the readiness score works

The readiness score blends three signals:

| Signal              | Weight | What it measures                                      |
|----------------------|--------|---------------------------------------------------------|
| Overall progress     | 55%    | Completed tasks ÷ total tasks                           |
| Category balance     | 30%    | Average and minimum category completion (so one strong area can't hide a weak one) |
| Consistency          | 15%    | Current preparation streak, capped at 14 days            |

Score ranges: **0–24 Beginner · 25–54 Intermediate · 55–79 Advanced · 80–100 Interview-Ready**

## Customizing

- **Categories**: add or remove them from the Profile & Goals page. A category with
  existing tasks can't be deleted until its tasks are reassigned or removed.
- **Colors, type, spacing**: all defined as CSS custom properties at the top of
  `style.css` for easy re-theming.
- **Achievements & scoring logic**: defined near the top of `app.js` in the
  `ACHIEVEMENTS` array and `computeStats()` function.

---

Built with plain HTML, CSS, and JavaScript — no frameworks, no dependencies, no tracking.
