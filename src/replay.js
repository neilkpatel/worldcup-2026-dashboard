// Replay mode: render the dashboard as it stood at the end of a past matchday.
//
// The tournament is finished, so the normal site shows its final state. For a visitor
// who never saw it live (and in interviews), replay rewinds everything together: the
// matches after the chosen day become unplayed, knockout fixtures whose feeders hadn't
// been decided yet go back to being slots rather than teams, and the group tables are
// recomputed from only the results that existed that night.
//
// Everything here derives from the real archived results. Nothing is invented: a day is
// always replayed at its END, because reconstructing a half-finished match would mean
// making up a scoreline.

// Tournament time is US Eastern (UTC-4 in June/July 2026).
const TOURNAMENT_UTC_OFFSET = '-04:00'

export const REPLAY_DAYS = [
  { date: '2026-06-11', label: 'Opening day', blurb: 'Mexico City kicks it all off' },
  { date: '2026-06-19', label: 'USA matchday 2', blurb: 'USA vs Australia, Brazil vs Haiti' },
  { date: '2026-06-27', label: 'Final group day', blurb: 'Six games, everything at stake' },
  { date: '2026-07-01', label: 'Round of 32', blurb: 'USA vs Bosnia, England, Belgium' },
  { date: '2026-07-06', label: 'Round of 16', blurb: 'USA vs Belgium, Spain vs Portugal' },
  { date: '2026-07-11', label: 'Quarterfinals', blurb: 'England vs Norway, Switzerland vs Argentina' },
  { date: '2026-07-15', label: 'Semifinals', blurb: 'Argentina vs England for the last spot' },
]

/** The moment a replayed day ends, so every match that day is final. */
export function endOfMatchday(dayISO) {
  return new Date(`${dayISO}T23:59:59${TOURNAMENT_UTC_OFFSET}`)
}

export function replayDay(dayISO) {
  return REPLAY_DAYS.find((d) => d.date === dayISO) ?? null
}

/** "Saturday, June 27" for labels. */
export function formatReplayDay(dayISO) {
  return new Date(`${dayISO}T12:00:00${TOURNAMENT_UTC_OFFSET}`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/New_York',
  })
}

// A fixture the tournament hadn't reached yet. Scores, winners, goals and cards are
// stripped — on that day nobody knew them.
function unplay(match, slotFor) {
  const blankTeam = (team, slot) => ({
    ...team,
    ...(slot ? { name: slot, shortName: slot, abbrev: '', logo: null, id: null } : {}),
    score: null,
    winner: false,
  })
  const slots = slotFor(match)
  return {
    ...match,
    state: 'pre',
    completed: false,
    statusDetail: 'Scheduled',
    clock: '0:00',
    details: [],
    odds: null,
    home: blankTeam(match.home, slots?.home),
    away: blankTeam(match.away, slots?.away),
  }
}

/**
 * Rewind the schedule to `at`.
 * @param {Array} matches parsed matches (final results)
 * @param {Date} at the replay moment
 * @param {(match) => ({home: string, away: string}|null)} slotFor names the bracket slot
 *   for a knockout fixture whose teams weren't known yet (e.g. "Winner of Match 79")
 */
export function rewindMatches(matches, at, slotFor = () => null) {
  return matches.map((m) => (m.date <= at ? m : unplay(m, slotFor)))
}

/**
 * Build the `slotFor` callback for {@link rewindMatches}: on a given night, a knockout
 * fixture only has real teams once the matches feeding it are finished. Before that the
 * dashboard showed a slot, so the replay shows one too rather than leaking the result.
 *
 * @param {Array} matches all matches, with `number` = official FIFA match number
 * @param {Date} at the replay moment
 * @param {Record<number, number[]>} feeders knockout match -> the two matches feeding it
 */
export function buildSlotFor(matches, at, feeders) {
  const byNumber = new Map(matches.map((m) => [m.number, m]))
  const done = (number) => {
    const m = byNumber.get(number)
    return !!m && m.completed && m.date <= at
  }
  const groupStageDone = matches
    .filter((m) => m.round === 'group-stage')
    .every((m) => done(m.number))

  return (match) => {
    if (match.round === 'group-stage') return null // group fixtures were known from the draw
    const pair = feeders[match.number]
    if (pair) {
      if (pair.every(done)) return null // both feeders played: the teams were known
      return { home: `Winner of Match ${pair[0]}`, away: `Winner of Match ${pair[1]}` }
    }
    if (match.round === '3rd-place-match') {
      // The third-place match takes the two losing semifinalists.
      return done(101) && done(102)
        ? null
        : { home: 'Loser of Match 101', away: 'Loser of Match 102' }
    }
    // Round of 32: filled straight from the group tables the moment the groups ended.
    return groupStageDone ? null : { home: 'Group stage qualifier', away: 'Group stage qualifier' }
  }
}

const POINTS = { win: 3, draw: 1 }

/**
 * Recompute the 12 group tables from only the matches played by `at`. The final ESPN
 * standings supply group membership and team metadata (logo, abbreviation); every
 * number is derived from results, so a replayed table matches that night's table.
 *
 * Ordering is points → goal difference → goals for → name. FIFA's full tiebreakers add
 * head-to-head and fair play, which can differ in a tie; this is a replay of the table,
 * not an official qualification ruling.
 */
export function rewindGroups(groups, matches, at) {
  const played = matches.filter(
    (m) => m.round === 'group-stage' && m.completed && m.date <= at
  )

  return groups.map((group) => {
    const rows = group.teams.map((team) => ({
      ...team,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0,
    }))
    const byId = new Map(rows.map((r) => [String(r.id), r]))

    for (const match of played) {
      const home = byId.get(String(match.home.id))
      const away = byId.get(String(match.away.id))
      if (!home || !away) continue // a cross-group fixture can't happen, but stay safe
      const hg = Number(match.home.score)
      const ag = Number(match.away.score)
      if (!Number.isFinite(hg) || !Number.isFinite(ag)) continue

      for (const [team, scored, conceded] of [
        [home, hg, ag],
        [away, ag, hg],
      ]) {
        team.played += 1
        team.gf += scored
        team.ga += conceded
        team.gd = team.gf - team.ga
        if (scored > conceded) {
          team.wins += 1
          team.points += POINTS.win
        } else if (scored === conceded) {
          team.draws += 1
          team.points += POINTS.draw
        } else {
          team.losses += 1
        }
      }
    }

    const ranked = rows.sort(
      (a, b) =>
        b.points - a.points ||
        b.gd - a.gd ||
        b.gf - a.gf ||
        a.name.localeCompare(b.name)
    )
    ranked.forEach((team, i) => {
      team.rank = i + 1
    })
    return { ...group, teams: ranked }
  })
}

/** Headlines published after the replayed day would give away what happens next. */
export function rewindNews(news, at) {
  return news.filter((n) => n.published && n.published <= at)
}
