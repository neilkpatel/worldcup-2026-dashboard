// Computes "what's at stake" for a match from the live group standings.
// Group-stage logic is matchday-aware; the final-matchday math is deliberately
// conservative (treats any points tie as unfavorable) so a "clinched" / "through
// with a win" claim is always safe. Third-place qualification (best 8 of the 12
// third-placed teams) crosses groups and can't be computed locally, so we flag it
// as a lifeline rather than asserting it.

const MARQUEE = new Set([
  'Brazil', 'Argentina', 'France', 'England', 'Spain', 'Germany',
  'Portugal', 'Netherlands', 'Belgium', 'Croatia', 'Morocco',
  'United States', 'Mexico', 'Canada',
])

export function groupForTeam(groups, teamId) {
  return groups.find((g) => g.teams.some((t) => t.id === teamId)) ?? null
}

function teamState(group, id) {
  const t = group.teams.find((x) => x.id === id)
  return t
    ? { id: t.id, name: t.name, pts: t.points, gd: t.gd, gf: t.gf, played: t.played }
    : null
}

// Conservative: I'm safely top-2 only if at most one other team can finish at or
// above my points (so even losing every tiebreaker I'm still 1st or 2nd).
function safeTop2(myPts, otherPts) {
  return otherPts.filter((p) => p >= myPts).length <= 1
}

// Optimistic: top-2 is still mathematically reachable (ties go my way).
function reachTop2(myPts, otherPts) {
  return otherPts.filter((p) => p > myPts).length <= 1
}

// The two teams not in this match play each other on the final matchday too.
function parallelOutcomes(c, d) {
  return [
    [c.pts + 3, d.pts], // C wins
    [c.pts + 1, d.pts + 1], // draw
    [c.pts, d.pts + 3], // D wins
  ]
}

function finalDayOutcome(me, opp, others) {
  const [c, d] = others
  const scenarios = parallelOutcomes(c, d)
  // Already through no matter what I do (worst case: I lose, opp wins).
  if (scenarios.every(([cp, dp]) => safeTop2(me.pts, [opp.pts + 3, cp, dp]))) {
    return 'through'
  }
  // Guaranteed through if I win (opp then gets 0).
  if (scenarios.every(([cp, dp]) => safeTop2(me.pts + 3, [opp.pts, cp, dp]))) {
    return 'winAndThrough'
  }
  // Even a win can't get me into the top two.
  if (!scenarios.some(([cp, dp]) => reachTop2(me.pts + 3, [opp.pts, cp, dp]))) {
    return 'top2Out'
  }
  return 'inHunt'
}

const PHRASE = {
  through: (n) => `${n} have already clinched a top-two spot.`,
  winAndThrough: (n) => `${n} are through to the round of 32 with a win.`,
  top2Out: (n) => `${n} can't reach the top two — a third-place spot is their only route.`,
  inHunt: (n) => `${n} stay in control with a positive result.`,
}

function isMarquee(match) {
  return MARQUEE.has(match.home.name) || MARQUEE.has(match.away.name)
}

// Returns { level: 'critical'|'notable'|'info', text } or null.
export function matchStakes(match, groups) {
  const group = groupForTeam(groups, match.home.id)

  // Knockout rounds — single elimination.
  if (!group) {
    return {
      level: 'critical',
      text: 'Knockout round — win and advance, lose and go home.',
    }
  }

  const letter = group.name.replace('Group ', '')
  const home = teamState(group, match.home.id)
  const away = teamState(group, match.away.id)
  if (!home || !away) return null

  const played = Math.max(home.played, away.played)
  const baseLevel = isMarquee(match) ? 'notable' : 'info'

  // Matchday 1 — no games played yet.
  if (played === 0) {
    return {
      level: baseLevel,
      text: `Group ${letter} opener. Three points here is a big early cushion in the race for the top two.`,
    }
  }

  // Matchday 2 — one game in the books for each side.
  if (played === 1) {
    const note = (t) =>
      t.pts >= 3
        ? `${t.name} can move to the brink of advancing`
        : t.pts === 1
          ? `${t.name} need a win to take charge`
          : `${t.name} must respond after an opening loss`
    const urgent = home.pts === 0 || away.pts === 0
    return {
      level: urgent ? 'critical' : baseLevel,
      text: `Group ${letter}, matchday 2 — ${note(home)}; ${note(away)}.`,
    }
  }

  // Final matchday — real qualification math.
  const others = group.teams
    .filter((t) => t.id !== home.id && t.id !== away.id)
    .map((t) => ({ pts: t.points, gd: t.gd, gf: t.gf }))
  if (others.length === 2) {
    const h = finalDayOutcome(home, away, others)
    const a = finalDayOutcome(away, home, others)
    return {
      level: 'critical',
      text: `Group ${letter} finale — ${PHRASE[h](home.name)} ${PHRASE[a](away.name)}`,
    }
  }

  return {
    level: 'critical',
    text: `Group ${letter} finale — every point decides who advances.`,
  }
}

const LEVEL_RANK = { critical: 0, notable: 1, info: 2 }

// Highest-stakes matches first, for the "key matches" highlight.
export function rankByStakes(matches, groups) {
  return matches
    .map((m) => ({ match: m, stakes: matchStakes(m, groups) }))
    .sort(
      (a, b) =>
        (LEVEL_RANK[a.stakes?.level] ?? 9) - (LEVEL_RANK[b.stakes?.level] ?? 9)
    )
}
