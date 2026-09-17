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
- `scripts/generate-og.py` (Pillow) renders `public/og.png` (1200×630). Re-run:
  `python3 scripts/generate-og.py`. **Design** (redesigned Jun 2026 — was a busy
  left-aligned card): clean CENTERED composition — a glowing soccer ball on a deep
  emerald→black gradient, "WORLD CUP 2026" (2026 in gold), "DASHBOARD · by Neil",
  and a one-line gag (`TAGLINE` const, currently the "we organize the tables / the
  drama organizes itself" inside joke). Deliberately decluttered: no kicker line,
  no tag chips. Edit `TAGLINE` to swap the joke.
- `index.html` carries the Open Graph + Twitter meta tags; title is "World Cup 2026
  Dashboard — by Neil"; `og:image` is `…/og.png?v=YYYYMMDD` — **bump the `?v=` when
  you regenerate og.png** so iMessage/X/LinkedIn refetch instead of serving a cached
  card. Vite copies `public/og.png` to the deploy root even under `viteSingleFile`.

## Visit analytics + hidden owner-stats panel
- **Vercel Web Analytics:** `@vercel/analytics` `<Analytics/>` mounts in `App.jsx`
  (the project toggle was already on but no script shipped, so it collected nothing
  until Jun 2026). Full dashboard — visitors / referrers / countries / top pages,
  bot-filtered — at vercel.com → project `worldcup-2026-dashboard` → Analytics.
  (Vercel's analytics *read* API is browser-session-gated; a CLI token 404s, so the
  in-app panel below can't reuse it — hence the self-hosted counter.)
- **Hidden owner panel:** tap the ⚽ logo **5× within ~1.2s/tap** to unlock
  `StatsPanel` (`src/components/StatsPanel.jsx`) — total views / unique devices /
  today / last-7d + a 30-day sparkline + a deep link to the Vercel dashboard. Silent
  by design (no pointer cursor) so casual visitors don't find it; closes on ✕/Esc/backdrop.
- **Self-hosted counter:** reuses the existing `worldcup-picks` Supabase. `src/lib/visits.js`
  → `trackVisit()` (called once on mount; localStorage flag `wc_visit_<YYYY-MM-DD>` marks a
  device unique-per-day) POSTs to the `track_visit(is_unique bool)` RPC; `fetchVisitStats()`
  reads the aggregate `site_visits` table.
  - Schema (via Supabase Management API, project ref `hufgsqlyaolefwhtvbub`): table
    `public.site_visits(day date pk, views bigint, uniques bigint)`; RLS on with an open
    **SELECT** policy for anon; writes only through the **SECURITY DEFINER** `track_visit`
    function (anon has no direct table write). So the counts are public-readable (vanity
    metric, not sensitive) but un-spoofable except via the +1 RPC — same trust model as Pick'em.
  - Counts raw pageviews incl. bots; for clean human numbers use the Vercel dashboard.

## Never-dark rule: the archived tournament (added 9/17/26)
The dashboard is shown in interviews, so it must never render empty because a third
party changed something. `public/espn-archive.json` (1.4 MB, ~131 KB gzipped) holds the
FINAL tournament: all 104 matches, 12 group tables and 50 headlines. `npm run archive`
(`scripts/archive-espn.mjs`) regenerates it and refuses to write a partial copy (it
asserts 104 matches / 12 groups / every match final).
- `fetchSchedule` / `fetchStandings` / `fetchNews` in `api.js` each fall back to the
  archive when the live call fails OR returns an empty list (an empty list means the
  query shape broke, not that the World Cup vanished).
- `dataSource.archivedAt` (reset each refresh via `resetDataSource()`) tells `App.jsx`
  to show a neutral "📦 Final tournament archive" note with the as-of date and source,
  instead of the old red error banner. The red banner now only appears if the archive
  is unreachable too.
- **What broke 9/17/26:** ESPN began returning 400 for the date RANGE
  `dates=20260611-20260719` that had worked all tournament (400 for curl, 403 for a
  browser UA; single dates and `dates=2026` still return 200). Every tab went empty.
  `SCOREBOARD_QUERIES` now tries `dates=2026` first and keeps the range as a fallback.
- ESPN's CDN also blocks headless Chrome outright ("Access Denied"), so to verify the
  LIVE path locally pass a normal `--user-agent`; the default headless UA exercises the
  archive path, which is a handy way to test both.

## Today page: how far back the results go (9/17/26)
Once the tournament ended, Today showed exactly one result (the final) and a half-empty
page. `recentCompletedDays()` in `src/recap.js` now walks back from the most recent
completed day until it has at least 8 matches (max 8 days); the newest day keeps the full
`LatestResults` treatment and the rest render in `EarlierResults` ("⏪ Before that") as
compact `MatchCard`s with no per-match summary fetches.
- Those earlier results group by ROUND once the knockouts start ("Quarterfinals · July
  9-11") and by DAY during the group stage, since a round spread over three days reads as
  one block and one-match days would otherwise leave a row of gaps.
- `FollowingPanel` hides itself when every followed team is out (always true after the
  final), so Today now drops to a single full-width column in that case instead of leaving
  an empty third. Three-across only when the row fills: a 4-match round renders 2x2.
- All of this respects replay mode, because it reads the rewound match list.

## Replay a matchday (added 9/17/26)
Because the tournament is over, a first-time visitor only ever saw its final state. The
replay control (`src/components/ReplayBar.jsx`, rendered above the tabs) rewinds the WHOLE
dashboard to the end of a past matchday, so it reads exactly as it did that night.
- **Curated days + linkable:** `REPLAY_DAYS` in `src/replay.js`; `?replay=2026-06-27`
  opens straight into that night and the URL stays in sync (`changeReplayDate` in App).
- **One clock:** `src/lib/clock.js` (`now()` / `setClockOverride()` / `isReplaying()`).
  Components must call `now()` instead of `new Date()` or half the UI answers from the
  real clock and the replay contradicts itself. Already routed: `Today.jsx` (master now,
  `kickoffCountdown`, `timeAgo`), `recap.js`, `PickEm.jsx`. Deliberately NOT routed:
  `visits.js`, `StatsPanel`, `WatchNYC` bar-of-the-day, `MyTickets` price timestamps —
  those are real-world, not tournament, time.
- **The data is rewound, not faked** (`src/replay.js`): matches after the moment go back
  to `state: 'pre'` with scores, goals and cards stripped; group tables are RECOMPUTED
  from the results that existed that night (the standings feed only ever gives final
  numbers); knockout fixtures whose feeders hadn't played show their slot
  ("Winner of Match 79", "Group stage qualifier") via `buildSlotFor` + `FEEDERS`, so a
  replay can't leak a result the site didn't know yet. A day always replays at its END —
  reconstructing a half-finished match would mean inventing a scoreline.
- **Guards while replaying:** Pick'em is read-only (it writes to a shared leaderboard),
  `TeamsLeft` doesn't write `wc_teams_left_seen` (it would poison the real "N out since
  your last visit" flourish), the live Polymarket title odds are hidden, and the goal
  celebration is suppressed (stepping between days changes scores wholesale).
- `FEEDERS` now lives in `src/data/bracketFeeders.js` (shared by Bracket + replay);
  `TREE_ORDER` stayed in `Bracket.jsx`.

## Stack
- Vite + React 19 + Tailwind v4 (`@tailwindcss/vite` plugin)
- No backend, no API key — fetches ESPN's unofficial public API client-side (CORS is open)
- Auto-refreshes every 60s

## Data source: ESPN unofficial API
- **Scoreboard (all 104 matches in one call):**
  `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=2026&limit=200`
  (the old `dates=20260611-20260719` range now 400s — see the never-dark rule above)
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
  site never shows an empty rail. Takes `matches` (not `groups`): post-draw it shows each
  ticket's CONCRETE feeder ties by match number (`feeders:[76,78]` / `[91,92]`) with real
  teams + ✓ for whoever advanced, followed teams (USA/Norway) bolded — replaced the old
  group-route scenarios. A feeder that's itself a later round shows "Winner of Match N".
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
  (1–104). Group matches (1–72) run in kickoff order, so they're numbered by the
  sorted schedule. KNOCKOUTS ARE NOT: FIFA numbers them by bracket position, not
  kickoff time, so a chronological sort mis-numbers 14 of the 32 (e.g. Houston's R16
  kicks off before Philadelphia's but is the higher number, Match 90 vs 89). So each
  knockout fixture is pinned to its FIXED official number via the `KO_SCHEDULE` table
  (matched by kickoff UTC — all 32 are distinct). `prettySlot()` then rewrites feeder
  placeholders to absolute numbers ("Round of 32 7 Winner" → "Winner of Match 79";
  offsets R32=72+N, R16=88+N, QF=96+N, SF=100+N) — ESPN's feeder indices ARE the
  official bracket indices, so these are correct once `m.number` is right. Verified
  against FIFA/Wikipedia + ticketing (M91 MetLife = W76 v W78, M99 Miami = W91 v W92).
- `src/stats.js` — `buildScorers` (Golden Boot) + `buildThirdPlaceRace` (best-8 thirds)
- `src/lib/picks.js` + `src/components/PickEm.jsx` — Pick'em (see section above)
- `src/reports.js` — `templateReport` fallback + `matchTags` storyline chips
- `src/data/reports.json` — cached Claude match verdicts (generated by `npm run reports`)
- `src/components/Today.jsx` — `FollowingPanel` (USA/Iran/Norway) →
  Now (scores/live/previews) → Latest results → News block. Followed teams show a status
  via `knockoutStatus()`: prefers the authoritative signal (team's real id already in a
  bracket fixture → "Into the [round]" / "Eliminated"), else format rules (top 2 of a
  group always advance; 8 best 3rds via `buildThirdPlaceRace`, "Nth of 12"; once the
  whole stage is done a 3rd-place verdict locks to Qualified/Eliminated). KNOCKOUT MODE:
  eliminated teams are auto-dropped from the panel (`followedQual` filter; panel hides
  when all are out), and the pill flips from qualification status to the next knockout
  game ("⚔️ Round of 32 · vs <opp> · <date>"). FixtureCard also labels knockout games
  "⚔️ <round> · elimination · Match N" (amber) instead of a qualified team's old group.
- Today layout (knockout phase), top → bottom: full-width "teams still alive" counter HERO
  → full-width collapsed Title race bar (tap to expand) → 2-col dashboard with the game feed
  (today's match → latest results → news) on the left and followed teams on the right. Mobile
  stacks counter → odds bar → game → … The old "Round of 32 is set" banner was removed. Only
  the counter (and a live game) animate — today's-games frame is static — to stay calm/quick.
- `src/components/TeamsLeft.jsx` — the counter hero. Counts down by game: 32 − completed
  main-bracket KO matches (excludes 3rd-place). Remembers the value last seen on the device
  (`wc_teams_left_seen`) and tweens the DROP since then (e.g. 32→31) with a "▼ N out since
  your last visit" flourish; flashing border via the `.alive-pulse` CSS class (in index.css,
  reduced-motion-aware). 🏆 champion hero once the final is decided. (Bracket round headers
  no longer show a bare match count.)
- `src/components/TitleRace.jsx` + `fetchTitleOdds()` in api.js — "🏆 Title race": implied
  championship odds from Polymarket's public "World Cup Winner" market, fetched CLIENT-SIDE
  (gamma API sends `access-control-allow-origin: *`, no key/proxy). Full-width bar directly
  under the counter, COLLAPSED by default — shows the leader inline ("· France 23% favorite")
  with an explicit "Tap to expand ▾" cue; expands to the top-10 bars (followed teams bolded),
  toggle reads "Hide ▴". Best-effort (hides if the fetch fails), refreshes every 10 min.
- `src/components/ResultCard.jsx` — per-match analysis card; body prefers a Claude
  verdict, else ESPN's own match report (`summary.story`), else a template
- `src/components/GoldenBoot.jsx` — top-scorer leaderboard (own tab)
- `src/components/Groups.jsx` — 12 group tables + best-third-place race
- `src/components/Bracket.jsx` — knockout bracket R32→final + 3rd-place match;
  reads `match.round` (ESPN season slug), fills slots as teams qualify. Promoted to
  the 2nd tab (🏆) since it's the main event once groups end. DESKTOP is a real tree:
  columns ordered by bracket position (`TREE_ORDER`, since FIFA's match numbers aren't
  bracket-adjacent), `justify-around` columns so each match centers between its two
  feeders, and an SVG overlay (`useConnectorPaths`, measures card rects) draws the
  connector lines from `FEEDERS`. Connectors are measured via offsetLeft/offsetTop
  (transform-IMMUNE) so the tree can be scaled. MOBILE has a `mobileView` toggle,
  DEFAULT "Full bracket": the whole tree scaled to fit the phone width (a quick reference
  — `fit` state in Bracket measures naturalW vs available and applies a `scale()` transform
  on phones only, with a reserved-size wrapper so there's no whitespace; pinch-zoom for
  detail). The other option, "Rounds", is one round at a time (R32/R16/QF/SF/3rd/Final
  switcher, prev/next + date range, tap a card for venue/TV). The tree renders once (desktop
  always full-size + scroll; mobile fit-scaled). Compact uniform cards (details on hover/tap). Spotlights the live game
  (or next to kick off) with an emerald ring + "NEXT UP"; flags Neil's tickets (91, 99)
  with 🎟️; Final gets gold accent + a champion banner once decided.
- Knockout activation is DATA-DRIVEN, not date-hardcoded: `groupStageComplete(matches)`
  in api.js = all 72 group fixtures `completed`; it gates the TeamsLeft counter + the
  knockout-status logic. (The old "Round of 32 is set" transition banner was removed once
  the knockouts were underway.) App.jsx adds a live pulse on the Bracket tab when
  `isKnockoutRound(round) && state==='in'`.
- `src/components/Schedule.jsx` — full schedule grouped by day, team filter
- `src/components/FifaRank.jsx` + `src/data/fifaRankings.js` — FIFA rank chip (see above)
- `src/components/WatchNYC.jsx` + `src/data/watchBars.js` + `src/data/watchParties.js`
  — "Bars" tab (see above). `src/data/nycBars.js` = retired pre-June-2026 bars data, now unused.
- `src/data/iranWarStatus.js` — Iran war-status indicator data (see above)
- `src/stakes.js` — matchday-aware qualification implications (conservative math);
  `matchStakes` now used only by `Schedule.jsx` (removed from Today's fixture cards)
