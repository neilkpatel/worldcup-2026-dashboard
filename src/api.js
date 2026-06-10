const SCOREBOARD =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard'
const STANDINGS =
  'https://site.web.api.espn.com/apis/v2/sports/soccer/fifa.world/standings?season=2026'

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
    home: parseTeam(home),
    away: parseTeam(away),
    state: event.status.type.state, // 'pre' | 'in' | 'post'
    completed: event.status.type.completed,
    statusDetail: event.status.type.detail,
    clock: event.status.displayClock,
    venue: comp.venue?.fullName ?? '',
    city: comp.venue?.address?.city ?? '',
    tv: comp.broadcasts?.[0]?.names?.join(' / ') ?? '',
  }
}

export async function fetchSchedule() {
  const res = await fetch(`${SCOREBOARD}?dates=${TOURNAMENT_DATES}&limit=200`)
  if (!res.ok) throw new Error(`scoreboard request failed: ${res.status}`)
  const data = await res.json()
  return (data.events ?? []).map(parseEvent).sort((a, b) => a.date - b.date)
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

// Map of team id -> group letter, e.g. "A", for labeling match cards
export function buildGroupMap(groups) {
  const map = {}
  for (const group of groups) {
    const letter = group.name.replace('Group ', '')
    for (const team of group.teams) map[team.id] = letter
  }
  return map
}
