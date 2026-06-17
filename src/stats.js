// Derived tournament-wide stats, all computed client-side from data we already
// fetch — no extra ESPN requests. Golden Boot comes from the scoreboard's
// scoring `details`; the third-place race comes from the standings.

// Golden Boot race: aggregate every goal across all played matches. Own goals
// are excluded (not credited to a scorer). Returns scorers sorted by goals,
// then by fewest penalties (open-play goals break ties), then name.
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
      }
      entry.goals += 1
      if (d.penalty) entry.penalties += 1
      tally.set(key, entry)
    }
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
