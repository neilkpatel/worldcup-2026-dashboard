// Derived tournament-wide stats, all computed client-side from data we already
// fetch — no extra ESPN requests. Golden Boot comes from the scoreboard's
// scoring `details`; the third-place race comes from the standings.

// Golden Boot race: aggregate every goal across all played matches. Own goals
// are excluded (not credited to a scorer). Returns scorers sorted by goals,
// then by fewest penalties (open-play goals break ties), then name. Each scorer
// also carries `goalsList` — every goal with its match context (opponent, score
// from the scorer's side, minute, penalty, date) — so player search can show
// exactly which games a player scored in.
export function buildScorers(matches, teamLookup = {}) {
  const tally = new Map()
  for (const m of matches) {
    if (m.state === 'pre') continue
    for (const d of m.details ?? []) {
      if (!d.scoringPlay || d.ownGoal || !d.scorer) continue
      const key = `${d.scorer}::${d.teamId}`
      const entry = tally.get(key) ?? {
        name: d.scorer,
        teamId: d.teamId,
        team: teamLookup[d.teamId]?.name ?? '',
        abbrev: teamLookup[d.teamId]?.abbrev ?? '',
        logo: teamLookup[d.teamId]?.logo ?? '',
        goals: 0,
        penalties: 0,
        goalsList: [],
      }
      entry.goals += 1
      if (d.penalty) entry.penalties += 1
      // The scorer's side + opponent within this match, for "which game" context.
      const me = m.home.id === d.teamId ? m.home : m.away.id === d.teamId ? m.away : null
      const opp = me ? (me === m.home ? m.away : m.home) : null
      entry.goalsList.push({
        matchId: m.id,
        minute: d.minute,
        penalty: !!d.penalty,
        opponent: opp?.name ?? '',
        oppAbbrev: opp?.abbrev ?? '',
        scoreFor: me?.score ?? '',
        scoreAgainst: opp?.score ?? '',
        date: m.date,
      })
      tally.set(key, entry)
    }
  }
  const minuteNum = (s) => parseInt(s, 10) || 0
  for (const e of tally.values()) {
    e.goalsList.sort((a, b) => a.date - b.date || minuteNum(a.minute) - minuteNum(b.minute))
  }
  return [...tally.values()].sort(
    (a, b) => b.goals - a.goals || a.penalties - b.penalties || a.name.localeCompare(b.name)
  )
}

// Recent form per team, derived from the schedule (no extra fetch). Returns
// { [teamId]: ['W'|'D'|'L', ...] } in chronological order, most recent last,
// capped to the last 5 completed matches.
export function buildFormMap(matches) {
  const map = {}
  const played = matches
    .filter((m) => m.state === 'post')
    .sort((a, b) => a.date - b.date)
  for (const m of played) {
    for (const [team, opp] of [
      [m.home, m.away],
      [m.away, m.home],
    ]) {
      const r = team.winner ? 'W' : opp.winner ? 'L' : 'D'
      ;(map[team.id] ??= []).push(r)
    }
  }
  for (const id of Object.keys(map)) map[id] = map[id].slice(-5)
  return map
}

// The 8 best third-place teams advance (new 48-team format). Rank the 12
// group-third teams by points, goal difference, then goals for — the same order
// FIFA uses — and flag the top 8 as in, the rest as on the bubble / out.
export function buildThirdPlaceRace(groups) {
  const thirds = []
  for (const g of groups) {
    const letter = g.name.replace('Group ', '')
    // Third on the table (teams are pre-sorted by rank in fetchStandings)
    const team = g.teams[2]
    if (team) thirds.push({ ...team, group: letter })
  }
  thirds.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf)
  return thirds.map((t, i) => ({ ...t, position: i + 1, qualifying: i < 8 }))
}

// Ordinal suffix: 1 -> "1st", 2 -> "2nd", 23 -> "23rd". Shared across the UI.
export const ordinal = (n) =>
  `${n}${['th', 'st', 'nd', 'rd'][(n % 100 >> 3 ^ 1) && n % 10] || 'th'}`

// Map team id -> its current group standing, so fixtures and results can show
// "how a team is doing" (position + points) without re-deriving it from matches.
export function buildStandingMap(groups) {
  const map = {}
  for (const g of groups) {
    const group = g.name.replace('Group ', '')
    for (const t of g.teams) {
      map[t.id] = {
        group,
        rank: t.rank,
        points: t.points,
        played: t.played,
        wins: t.wins,
        draws: t.draws,
        losses: t.losses,
        gd: t.gd,
        gf: t.gf,
      }
    }
  }
  return map
}
