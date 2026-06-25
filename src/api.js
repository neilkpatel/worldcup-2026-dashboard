const SCOREBOARD =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard'
const STANDINGS =
  'https://site.web.api.espn.com/apis/v2/sports/soccer/fifa.world/standings?season=2026'
const NEWS =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/news'
const SUMMARY =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary'

// Full tournament window — ESPN returns all 104 matches in one call
const TOURNAMENT_DATES = '20260611-20260719'

function parseTeam(competitor) {
  return {
    id: competitor.team.id,
    name: competitor.team.displayName,
    shortName: competitor.team.shortDisplayName,
    abbrev: competitor.team.abbreviation,
    logo: competitor.team.logo,
    score: competitor.score,
    winner: competitor.winner ?? false,
  }
}

function parseEvent(event) {
  const comp = event.competitions[0]
  const home = comp.competitors.find((c) => c.homeAway === 'home')
  const away = comp.competitors.find((c) => c.homeAway === 'away')
  return {
    id: event.id,
    date: new Date(event.date),
    name: event.name,
    shortName: event.shortName,
    round: event.season?.slug ?? 'group-stage', // e.g. 'round-of-32', 'final'
    home: parseTeam(home),
    away: parseTeam(away),
    state: event.status.type.state, // 'pre' | 'in' | 'post'
    completed: event.status.type.completed,
    statusDetail: event.status.type.detail,
    clock: event.status.displayClock,
    venue: comp.venue?.fullName ?? '',
    // ESPN bakes "City, State" into `city` for US venues (state field is empty)
    // and uses a bare city + `country` for Canada/Mexico.
    city: comp.venue?.address?.city ?? '',
    country: comp.venue?.address?.country ?? '',
    tv: comp.broadcasts?.[0]?.names?.join(' / ') ?? '',
    // Goal/card scoring plays — carried in the scoreboard call itself, so the
    // whole-tournament Golden Boot race needs no extra requests.
    details: (comp.details ?? []).map((d) => ({
      minute: d.clock?.displayValue ?? '',
      type: d.type?.text ?? '',
      teamId: d.team?.id ?? null,
      scorer: d.athletesInvolved?.[0]?.displayName ?? null,
      scoringPlay: !!d.scoringPlay,
      ownGoal: !!d.ownGoal,
      penalty: !!d.penaltyKick,
    })),
  }
}

export async function fetchSchedule() {
  const res = await fetch(`${SCOREBOARD}?dates=${TOURNAMENT_DATES}&limit=200`)
  if (!res.ok) throw new Error(`scoreboard request failed: ${res.status}`)
  const data = await res.json()
  // FIFA numbers matches in kickoff order (opener = 1, final = 104) and the numbers
  // are fixed in advance. ESPN doesn't carry the number, so derive it from the sorted
  // schedule — accurate for the knockouts (no simultaneous kickoffs there).
  return (data.events ?? [])
    .map(parseEvent)
    .sort((a, b) => a.date - b.date)
    .map((m, i) => ({ ...m, number: i + 1 }))
}

export async function fetchStandings() {
  const res = await fetch(STANDINGS)
  if (!res.ok) throw new Error(`standings request failed: ${res.status}`)
  const data = await res.json()
  return (data.children ?? []).map((group) => ({
    name: group.name,
    teams: group.standings.entries
      .map((entry) => {
        const stat = (name) =>
          entry.stats.find((s) => s.name === name)?.value ?? 0
        return {
          id: entry.team.id,
          name: entry.team.displayName,
          abbrev: entry.team.abbreviation,
          logo: entry.team.logos?.[0]?.href,
          played: stat('gamesPlayed'),
          wins: stat('wins'),
          draws: stat('ties'),
          losses: stat('losses'),
          gd: stat('pointDifferential'),
          gf: stat('pointsFor'),
          points: stat('points'),
          rank: stat('rank'),
        }
      })
      .sort((a, b) => a.rank - b.rank),
  }))
}

// Editorial World Cup headlines from ESPN's news feed. Best-effort: the caller
// treats a failure as "no headlines" rather than failing the whole dashboard.
export async function fetchNews() {
  const res = await fetch(`${NEWS}?limit=50`)
  if (!res.ok) throw new Error(`news request failed: ${res.status}`)
  const data = await res.json()
  return (data.articles ?? [])
    .map((a) => ({
      id: a.id,
      headline: a.headline,
      description: a.description ?? '',
      type: a.type ?? '',
      published: a.published ? new Date(a.published) : null,
      link: a.links?.web?.href ?? null,
    }))
    .filter((a) => a.headline && a.link)
}

// Team-specific ESPN headlines (e.g. USMNT or Iran) for a followed-team box.
// Same best-effort contract as fetchNews — failures surface as "no headlines".
export async function fetchTeamNews(teamId, limit = 6) {
  const res = await fetch(`${NEWS}?team=${teamId}&limit=${limit}`)
  if (!res.ok) throw new Error(`team news request failed: ${res.status}`)
  const data = await res.json()
  return (data.articles ?? [])
    .map((a) => ({
      id: a.id,
      headline: a.headline,
      published: a.published ? new Date(a.published) : null,
      link: a.links?.web?.href ?? null,
    }))
    .filter((a) => a.headline && a.link)
}

// Turn ESPN's HTML article body into clean paragraph text (blank-line separated).
function htmlToText(html) {
  if (!html) return ''
  return html
    .replace(/<\/(p|div|li)>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Per-match recap detail for a finished game: scorers/cards with minute, ESPN's
// written match report + headline, key team stats, and attendance. Used to make
// the "Latest results" section feel alive instead of bare scorelines.
// Best-effort — the caller treats a rejection as "no detail for this match".
export async function fetchMatchSummary(eventId) {
  const res = await fetch(`${SUMMARY}?event=${eventId}`)
  if (!res.ok) throw new Error(`summary request failed: ${res.status}`)
  const d = await res.json()

  const events = (d.keyEvents ?? [])
    .filter((k) => {
      const t = k.type?.text ?? ''
      return k.scoringPlay || t.includes('Goal') || t.includes('Card')
    })
    .map((k) => {
      const t = k.type?.text ?? ''
      return {
        minute: k.clock?.displayValue ?? '',
        teamId: k.team?.id ?? null,
        players: (k.participants ?? [])
          .map((p) => p.athlete?.displayName)
          .filter(Boolean),
        isGoal: !!k.scoringPlay || t.includes('Goal'),
        ownGoal: /own goal/i.test(t),
        penalty: /penalty/i.test(t),
        card: t.includes('Red Card') ? 'red' : t.includes('Yellow Card') ? 'yellow' : null,
      }
    })

  // Boxscore teams are tagged homeAway, so key stats by side directly.
  const stats = {}
  for (const t of d.boxscore?.teams ?? []) {
    const get = (name) =>
      t.statistics?.find((s) => s.name === name)?.displayValue ?? null
    stats[t.homeAway] = {
      possession: get('possessionPct'),
      shots: get('totalShots'),
      onTarget: get('shotsOnTarget'),
      corners: get('wonCorners'),
    }
  }

  // Recent form (last 5) per team id + a head-to-head snapshot — comes back in the
  // same summary call, so previews for upcoming fixtures need no extra request.
  const form = {}
  for (const block of d.lastFiveGames ?? []) {
    const tid = block.team?.id
    if (!tid) continue
    form[tid] = (block.events ?? []).map((e) => ({
      result: e.gameResult, // 'W' | 'D' | 'L'
      score: e.score,
      opponent: e.opponent?.abbreviation || e.opponent?.displayName || '',
      date: e.gameDate ? new Date(e.gameDate) : null,
    }))
  }

  let h2h = null
  const h2hEvents = (d.headToHeadGames ?? [])[0]?.events ?? []
  if (h2hEvents.length) {
    const last = h2hEvents[0] // most recent meeting
    h2h = {
      count: h2hEvents.length,
      lastScore: last.score,
      lastYear: last.gameDate ? new Date(last.gameDate).getFullYear() : null,
    }
  }

  // Betting odds — 3-way moneyline (+ total goals) from the pickcenter book. Prefer
  // live odds when the book has them open, else the pre-match close price.
  // Informational only — we deliberately don't surface the sportsbook bet links.
  let odds = null
  const book = (d.pickcenter ?? []).find((p) => p.moneyline)
  if (book?.moneyline) {
    const price = (side) => {
      const o = book.moneyline[side]
      const live = o?.live?.odds
      return live && live !== 'OFF' ? live : (o?.close?.odds ?? null)
    }
    odds = {
      provider: book.provider?.name ?? null,
      home: price('home'),
      draw: price('draw'),
      away: price('away'),
      total: book.overUnder ?? null,
    }
  }

  return {
    headline: d.article?.headline ?? null,
    story: htmlToText(d.article?.story), // ESPN's own written match report
    attendance: d.gameInfo?.attendance ?? null,
    events,
    stats,
    form,
    h2h,
    odds,
  }
}

// Map of team id -> { name, abbrev, logo } gleaned from the schedule, so derived
// views (Golden Boot) can label a scorer's country without another request.
export function buildTeamLookup(matches) {
  const map = {}
  for (const m of matches) {
    for (const t of [m.home, m.away]) {
      if (t.id && !map[t.id]) {
        map[t.id] = { name: t.name, abbrev: t.abbrev, logo: t.logo }
      }
    }
  }
  return map
}

// Map of team id -> group letter, e.g. "A", for labeling match cards
export function buildGroupMap(groups) {
  const map = {}
  for (const group of groups) {
    const letter = group.name.replace('Group ', '')
    for (const team of group.teams) map[team.id] = letter
  }
  return map
}
