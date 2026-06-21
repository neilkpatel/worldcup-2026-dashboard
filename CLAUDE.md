# World Cup 2026 Dashboard

Dashboard for tracking the 2026 FIFA World Cup (June 11 – July 19, 2026).
Runs locally at http://localhost:5173 via `npm run dev`.

## Deployment
- **Live:** https://worldcup.neilkpatel.com (custom subdomain) +
  https://worldcup-2026-dashboard-nine.vercel.app (Vercel default)
- Hosted on Vercel project `worldcup-2026-dashboard`
  (team `neilkpatel-gmailcoms-projects`); **auto-deploys on every push** to the
  `neilkpatel/worldcup-2026-dashboard` GitHub repo. No manual `vercel` deploy needed.
- DNS for the subdomain: Dreamhost (neilkpatel.com NS) → `A worldcup → 76.76.21.21`.

## Social share card (og:image)
- `scripts/generate-og.py` (Pillow) renders `public/og.png` (1200×630,
  "World Cup 2026 — by Neil"). Re-run: `python3 scripts/generate-og.py`.
- `index.html` carries the Open Graph + Twitter meta tags; `og:image` is the
  absolute `https://worldcup.neilkpatel.com/og.png`. Vite copies `public/og.png`
  to the deploy root even under `viteSingleFile`.

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

- **Per-match summary (scorers, stats, lineups, recap):**
  `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=<id>`
  - `keyEvents[]` — goals/cards with `clock.displayValue`, `team.id`, `participants[]`
    (scorer is `[0]`, assister `[1]`), `scoringPlay`, `type.text`
  - `boxscore.teams[]` — tagged `homeAway`; `statistics[]` has possessionPct,
    totalShots, shotsOnTarget, wonCorners, passes, tackles, etc.
  - `rosters[]` — lineups + `formation`; `gameInfo.attendance`; `article.headline`/`story`
  - The **scoreboard** call already carries `competitions[0].details[]` (goals with
    scorer + minute + type, cards) — the Golden Boot race is derived from that, no
    extra requests.

## Claude-written match reports
- `npm run reports` (script: `scripts/generate-reports.mjs`) fetches every completed
  match, has **Claude (claude-haiku-4-5)** write an analytical recap, and caches it in
  `src/data/reports.json` keyed by event id. Re-runnable + incremental (only missing /
  changed scores; `-- --force` regenerates all). **Needs `ANTHROPIC_API_KEY`.**
- Uses the official `@anthropic-ai/sdk` with structured output (`output_config.format`).
- The app imports `reports.json`; `ResultCard` prefers the cached Claude verdict, then
  falls back to **ESPN's own match report** (`summary.story`, free via the API — no key
  needed), then a live template (`src/reports.js`). So analysis shows even with no key;
  running `npm run reports` upgrades it to tailored verdicts.

## Live ticket prices (Neil's Tickets)
- `npm run prices` (script: `scripts/fetch-prices.mjs`) fetches **live secondary-market
  prices** for Neil's two matches and caches them in `src/data/prices.json`, keyed by the
  ticket ids in `MyTickets.jsx` (`nyc-r16`, `miami-qf`). **No API key, no browser.**
- **Why these sources** (we tried everything): SeatGeek/StubHub/Vivid list the matches but
  gate prices behind **DataDome** (curl AND headless browsers get 403'd), Claude's Chrome
  extension refuses ticket/commerce sites by policy, and SeatGeek's free dev API returns an
  empty `stats` object for World Cup events. What *does* work: SEO-rendered aggregator pages.
  - **TickPick** event page → embeds a schema.org `AggregateOffer` in plain HTML; we parse
    `lowPrice` (get-in) + `highPrice` (top of range). All-in/no-fee, so honest numbers.
  - Per-FIFA-category breakout (Cat 1–4, via GoalTickets' Shopify `.json`) was tried and
    **removed**: those are broker "from"/teaser prices, not live get-ins, so they could sit
    *below* the real get-in and read as contradictory. True per-section listings load via the
    same DataDome-walled call and aren't scrapable — so we show only the trustworthy TickPick
    live get-in + range.
- Re-runnable + incremental: appends a history point each run so the UI draws a
  price-over-time sparkline + a ▲/▼ get-in trend vs the last check.
- `MyTickets.jsx` imports `prices.json` and renders `PriceBand` (live get-in / range /
  ▲▼ trend / "checked Xm ago" / TickPick + SeatGeek links) + `PriceChart` (get-in-over-time
  line chart from `history[]`) per card. Hidden until the cache is populated, so the public
  site never shows an empty rail.
- **Auto-refresh:** `.github/workflows/refresh-prices.yml` runs `npm run prices` every 6h
  (cron) — and on demand via the Actions "Run workflow" button — then commits `prices.json`
  *only if it changed* and pushes, which triggers a Vercel rebuild. Runs entirely on GitHub
  (no key/browser/local machine). Each run appends a `history` point, so the `PriceChart`
  time series builds itself. Tune cadence by editing the `cron:` line.

## Tournament format (48 teams, new in 2026)
- 12 groups of 4; top 2 per group + 8 best third-place teams → round of 32
- Group stage June 11–27; final July 19 at MetLife Stadium

## Structure
- `src/api.js` — fetch + parse for scoreboard/standings/summary; scoring `details`,
  team→group map, team-id→{name,logo} lookup
- `src/stats.js` — `buildScorers` (Golden Boot) + `buildThirdPlaceRace` (best-8 thirds)
- `src/reports.js` — `templateReport` fallback + `matchTags` storyline chips
- `src/data/reports.json` — cached Claude match verdicts (generated by `npm run reports`)
- `src/components/Today.jsx` — Now (scores/live/previews) → Latest results → News block
- `src/components/ResultCard.jsx` — per-match analysis card; body prefers a Claude
  verdict, else ESPN's own match report (`summary.story`), else a template
- `src/components/GoldenBoot.jsx` — top-scorer leaderboard (own tab)
- `src/components/Groups.jsx` — 12 group tables + best-third-place race
- `src/components/Bracket.jsx` — knockout bracket R32→final + 3rd-place match;
  reads `match.round` (ESPN season slug), fills slots as teams qualify
- `src/components/Schedule.jsx` — full schedule grouped by day, team filter
- `src/stakes.js` — matchday-aware qualification implications (conservative math)
