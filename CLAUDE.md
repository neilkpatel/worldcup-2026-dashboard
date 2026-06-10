# World Cup 2026 Dashboard

Local-only dashboard for tracking the 2026 FIFA World Cup (June 11 – July 19, 2026).
Not deployed anywhere — runs at http://localhost:5173 via `npm run dev`.

## Stack
- Vite + React 19 + Tailwind v4 (`@tailwindcss/vite` plugin)
- No backend, no API key — fetches ESPN's unofficial public API client-side (CORS is open)
- Auto-refreshes every 60s

## Data source: ESPN unofficial API
- **Scoreboard (all 104 matches in one call):**
  `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=200`
  - `events[].status.type.state` is `'pre' | 'in' | 'post'`
  - `events[].competitions[0].competitors[]` has `homeAway`, `team`, `score`, `winner`
  - Knockout matches exist as placeholders ("Semifinal 1 Winner") until teams are known
- **Standings (12 groups):**
  `https://site.web.api.espn.com/apis/v2/sports/soccer/fifa.world/standings?season=2026`
  - `children[]` = groups A–L; `children[].standings.entries[].stats` has
    `gamesPlayed/wins/ties/losses/pointsFor/pointsAgainst/pointDifferential/points/rank`
- Use these same endpoints (via curl) to answer Neil's questions about results,
  standings, and qualification scenarios — don't web-search for scores.

## Tournament format (48 teams, new in 2026)
- 12 groups of 4; top 2 per group + 8 best third-place teams → round of 32
- Group stage June 11–27; final July 19 at MetLife Stadium

## Structure
- `src/api.js` — fetch + parse for scoreboard/standings, team→group map
- `src/components/Today.jsx` — live/today/next-day/yesterday sections
- `src/components/Groups.jsx` — 12 group tables (green = top 2, amber = 3rd)
- `src/components/Schedule.jsx` — full schedule grouped by day, team filter
