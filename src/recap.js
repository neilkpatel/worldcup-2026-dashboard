// Builds a recap of the most recent completed match day: scores, derived
// storylines (upsets, big wins), and what the results mean for each group.
// Uses the same conservative math as stakes.js — a "clinched"/"out" claim
// ignores tiebreakers so it is always safe.

import { MARQUEE } from './stakes.js'

const GROUP_GAMES = 3

function dayKey(date) {
  return date.toDateString()
}

// Latest day before today that has at least one completed match.
export function lastCompletedDay(matches, now = new Date()) {
  const todayKey = dayKey(now)
  const done = matches.filter(
    (m) => m.state === 'post' && dayKey(m.date) !== todayKey && m.date < now
  )
  if (done.length === 0) return null
  const latest = done[done.length - 1]
  return done.filter((m) => dayKey(m.date) === dayKey(latest.date))
}

function winnerLoser(match) {
  if (match.home.winner) return [match.home, match.away]
  if (match.away.winner) return [match.away, match.home]
  return null
}

// "Spain thrashed Chile 4-0" / "Mexico edged Korea 2-1" / "France drew 1-1 with Senegal"
export function resultPhrase(match) {
  const pair = winnerLoser(match)
  if (!pair) {
    return `${match.home.name} ${match.home.score}-${match.away.score} ${match.away.name} — points shared`
  }
  const [w, l] = pair
  const margin = Math.abs(Number(w.score) - Number(l.score))
  const verb = margin >= 3 ? 'thrashed' : margin === 2 ? 'cruised past' : 'edged'
  return `${w.name} ${verb} ${l.name} ${w.score}-${l.score}`
}

function storylines(matches) {
  const lines = []

  for (const m of matches) {
    const pair = winnerLoser(m)
    if (!pair) {
      if (MARQUEE.has(m.home.name) !== MARQUEE.has(m.away.name)) {
        const big = MARQUEE.has(m.home.name) ? m.home : m.away
        const small = big === m.home ? m.away : m.home
        lines.push(`${big.name} held to a ${m.home.score}-${m.away.score} draw by ${small.name}.`)
      }
      continue
    }
    const [w, l] = pair
    if (MARQUEE.has(l.name) && !MARQUEE.has(w.name)) {
      lines.push(`Upset: ${w.name} beat ${l.name} ${w.score}-${l.score}.`)
    }
  }

  const decided = matches.filter(winnerLoser)
  if (decided.length > 0) {
    const biggest = decided.reduce((a, b) => {
      const ma = Math.abs(a.home.score - a.away.score)
      const mb = Math.abs(b.home.score - b.away.score)
      return mb > ma ? b : a
    })
    const margin = Math.abs(biggest.home.score - biggest.away.score)
    if (margin >= 3) {
      lines.push(`Statement win: ${resultPhrase(biggest)}.`)
    }
  }

  return lines
}

// Conservative clinch/elimination from current standings.
// maxPts = points still reachable; clinched if at most one rival can match my
// current total even winning out; out if two rivals are already beyond my max.
function groupQualState(group) {
  const notes = []
  for (const t of group.teams) {
    const others = group.teams.filter((x) => x.id !== t.id)
    const maxOf = (x) => x.points + 3 * (GROUP_GAMES - x.played)
    if (t.played > 0 && others.filter((o) => maxOf(o) >= t.points).length <= 1) {
      notes.push(`${t.name} have clinched a top-two spot.`)
    } else if (others.filter((o) => o.points > maxOf(t)).length >= 2) {
      notes.push(
        `${t.name} can no longer finish in the top two — a best-third spot is their only route.`
      )
    }
  }
  return notes
}

// One compact line of the current table: "Mexico 3 · Korea 1 · ..."
function tableLine(group) {
  return group.teams.map((t) => `${t.abbrev ?? t.name} ${t.points}`).join(' · ')
}

// matches: the completed matches of the recap day; groups: live standings.
export function buildRecap(matches, groups) {
  if (!matches || matches.length === 0) return null

  const date = matches[0].date
  const groupStage = matches.filter((m) =>
    groups.some((g) => g.teams.some((t) => t.id === m.home.id))
  )
  const knockout = matches.filter((m) => !groupStage.includes(m))

  // Group implications, only for groups that actually played.
  const groupNotes = []
  for (const g of groups) {
    const played = groupStage.filter((m) =>
      g.teams.some((t) => t.id === m.home.id)
    )
    if (played.length === 0) continue
    const letter = g.name.replace('Group ', '')
    const leader = g.teams[0]
    const quals = groupQualState(g)
    groupNotes.push({
      letter,
      results: played.map(resultPhrase),
      table: tableLine(g),
      note:
        quals.length > 0
          ? quals.join(' ')
          : `${leader.name} lead on ${leader.points} point${leader.points === 1 ? '' : 's'}.`,
    })
  }

  for (const m of knockout) {
    const pair = winnerLoser(m)
    groupNotes.push({
      letter: null,
      results: [resultPhrase(m)],
      table: '',
      note: pair ? `${pair[0].name} advance.` : 'Decided after regulation.',
    })
  }

  return {
    date,
    headlines: storylines(matches),
    groupNotes,
    count: matches.length,
  }
}
