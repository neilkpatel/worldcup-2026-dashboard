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

## Pick'em (friends leaderboard) — the only backend feature
- Tab `Pick'em` (`src/components/PickEm.jsx`): friends pick the winner of each
  upcoming match (Home/Draw/Away, Draw only in group stage). **+1 pt per correct
  result.** Picks lock at kickoff. One shared open leaderboard.
- **No accounts:** identity is a random `client_id` + display name in
  `localStorage` (`wc_pick_client`, `wc_pick_name`). Different browser/device =
  fresh player. The UI only ever writes/edits the visitor's own picks and only
  shows their own + the ranked leaderboard (names + points, never others' picks).
- **Storage:** dedicated Supabase project `worldcup-picks`
  (ref `hufgsqlyaolefwhtvbub`, org `neil`, us-east-1) — separate from sup-app.
  Table `public.worldcup_picks` (unique on `client_id,match_id`; upsert on pick).
  RLS is intentionally open to `anon` (select/insert/update) — trust-based for a
  private friends pool, **not** hardened against a deliberate API hack (decided
  against the per-device-secret option as overkill for friends).
- `src/lib/picks.js` — anon Supabase REST via plain `fetch` (no supabase-js);
  URL + public anon key are committed (safe by design). `buildLeaderboard()`
  scores rows against finished matches. `PICKS_ENABLED` guards an unconfigured
  build (shows a "not connected" message).
- **Admin SQL** (create table, clear test rows): Supabase Management API
  `POST https://api.supabase.com/v1/projects/hufgsqlyaolefwhtvbub/database/query`
  with the personal access token (in global CLAUDE.md), same pattern as sup-app.

## Live game view (Today tab fixture cards)
All from the free ESPN data already fetched — no keys, no cost. In `Today.jsx`:
- **EventTimeline** — goals + cards (who/minute/team) from the scoreboard
  `m.details` (refreshes every 60s, so live games fill in). Newest event is
  spotlighted on live games ("latest action").
- **LiveStats** — possession/shots/on-target/corners dual bars from the summary
  `stats`. `useMatchSummaries` refetches a live game when its clock/score ticks.
- **Goal celebration** — combined score ticking up flashes the card (`goal-flash`)
  + pops a "⚽ GOAL!" banner (`goal-pop`, keyframes in `index.css`). Detected via
  the previous-value render pattern, cleared by a timer.
- **OddsRow** — 3-way moneyline + O/U from ESPN `pickcenter` (parsed in
  `api.js`), prefers live price else close. Informational, no bet links.
- **`useLiveClock`** ticks the minute locally between refreshes; HT/FT styling
  from `m.statusDetail`.

## FIFA rankings (`src/data/fifaRankings.js`)
- `FIFA_RANKS` = abbrev→rank map, official **11 Jun 2026** release (stable through
  the tournament; FIFA only re-ranks after). UPDATE after the next release if
  wanted. ESPN does NOT carry FIFA rank — this is our own verified snapshot.
- `<FifaRank abbrev={...} />` (`src/components/FifaRank.jsx`) renders a subtle,
  **parenthesized, unbolded** `(FIFA #N)` next to the team name. Used EVERYWHERE a
  team is listed (Today, Schedule/MatchCard, Groups + 3rd-place, Bracket,
  ResultCard). In horizontal rows, wrap name+chip together so it hugs the name.

## "Bars" tab — Where to watch in NYC (`WatchNYC.jsx`)
Rebuilt June 2026 as a **TV-first / vibe-first quick reference** from Neil's own
hand-researched list. Two data files (NOT the old `nycBars.js`, now unused):
- `src/data/watchBars.js` — `WATCH_BARS` (45 spots: 38 curated + 7 from June 2026
  roundups). Each has `tv` confidence (`high`/`medhigh`/`medium`), `tvNote`, `vibe`,
  `blurb`, `why`, `watchOut`, `bestFor` tags. Plus `MOODS` (ranked "by group mood"
  shortlists), `ZONES` + `zoneOf(area)` (geographic buckets), and `VISITED` (seed
  list for the collected tracker).
- `src/data/watchParties.js` — `WATCH_PARTIES`: validated organized events (official
  fan zones + venue series), each cross-checked across **≥2 sources** with `sources`
  links rendered in the UI. **NEVER add an unverified party** — same bar as all bar data.
- **Layout:** collapsible "✅ Validated watch parties" popout → "🏆 Bars collected"
  tracker → TV-confidence legend → mood filter chips → geographic sections
  (Under 28th St → Midtown → Brooklyn → Queens). Picking a mood chip shows that
  ranked shortlist flat instead of by zone.
- **Collected tracker:** tap a card's ◯ to "collect" a bar you watched a game at.
  Per-device in `localStorage` (`wc_bars_collected`), seeded from `VISITED`. Collected
  bars get a ✓ + emerald ring and float to the top of their zone.
- **App rule:** MEDIUM TV confidence renders an amber "Verify TVs" badge — never sold
  as a sure thing. Closed spots (Nevada Smith's, Woodwork) are deliberately excluded.
- The tab opens with a **"🍻 Today's pick"** highlight (`BarOfTheDay` in `WatchNYC.jsx`)
  — a deterministic daily spot from the under-28th set (overridable via
  `BAR_OF_DAY_OVERRIDES`). Nav tab shows a celebratory **🍻 Bars** (special-cased in
  `App.jsx`); Pick'em is the last tab. (The old per-game `WatchTeaser` on Today was removed.)

## Iran war status (`src/data/iranWarStatus.js`)
- `WarStatus` in the Iran followed-team popout: a single-serving "Is the war with
  Iran over?" with THREE honest states (`over`/`active`/`ceasefire`), sourced +
  dated, with an always-current live-coverage link. **Do not let the app assert a
  flat yes/no** — currently `ceasefire`. Update `state`/`asOf` manually as the
  real situation changes (it can't auto-update).

## Following panel (`Today.jsx`)
- `FollowingPanel` pins followed teams — **USA, Iran, Norway** (the `abbrevs` arg).
  Each is a collapsed row (tap to expand fixtures + team headlines).
- Per-team flavor popouts gate on `abbrev` inside `FollowedTeam`: Iran → `WarStatus`
  (above); Norway → `NorwayChant`, a sourced note on the viral Viking **"Ro!"** chant
  (Oljeberget supporters' club). Add more the same way.

## Tournament format (48 teams, new in 2026)
- 12 groups of 4; top 2 per group + 8 best third-place teams → round of 32
- Group stage June 11–27; final July 19 at MetLife Stadium

## Structure
- `src/api.js` — fetch + parse for scoreboard/standings/summary; scoring `details`,
  team→group map, team-id→{name,logo} lookup. Also stamps `m.number` = FIFA match #
  (1–104), derived from the chronological schedule order (ESPN's native order is
  already FIFA-ordered, so this is exact); `prettySlot()` rewrites knockout
  placeholder names ("Round of 32 7 Winner" → "Winner of Round of 32 #7")
- `src/stats.js` — `buildScorers` (Golden Boot) + `buildThirdPlaceRace` (best-8 thirds)
- `src/lib/picks.js` + `src/components/PickEm.jsx` — Pick'em (see section above)
- `src/reports.js` — `templateReport` fallback + `matchTags` storyline chips
- `src/data/reports.json` — cached Claude match verdicts (generated by `npm run reports`)
- `src/components/Today.jsx` — `FollowingPanel` (USA/Iran/Norway) →
  Now (scores/live/previews) → Latest results → News block
- `src/components/ResultCard.jsx` — per-match analysis card; body prefers a Claude
  verdict, else ESPN's own match report (`summary.story`), else a template
- `src/components/GoldenBoot.jsx` — top-scorer leaderboard (own tab)
- `src/components/Groups.jsx` — 12 group tables + best-third-place race
- `src/components/Bracket.jsx` — knockout bracket R32→final + 3rd-place match;
  reads `match.round` (ESPN season slug), fills slots as teams qualify
- `src/components/Schedule.jsx` — full schedule grouped by day, team filter
- `src/components/FifaRank.jsx` + `src/data/fifaRankings.js` — FIFA rank chip (see above)
- `src/components/WatchNYC.jsx` + `src/data/watchBars.js` + `src/data/watchParties.js`
  — "Bars" tab (see above). `src/data/nycBars.js` = retired pre-June-2026 bars data, now unused.
- `src/data/iranWarStatus.js` — Iran war-status indicator data (see above)
- `src/stakes.js` — matchday-aware qualification implications (conservative math);
  `matchStakes` now used only by `Schedule.jsx` (removed from Today's fixture cards)
