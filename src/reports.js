// Match-report helpers. The rich, written recaps come from Claude via
// scripts/generate-reports.mjs (cached in data/reports.json). When a match has
// no cached report yet, templateReport() composes a serviceable one live from
// the structured summary data so the card is never bare.

import { MARQUEE } from './stakes.js'

// "Mbappé (66', 90'+6')" — a scorer with all their goal minutes for one side.
function scorerLine(events) {
  const byPlayer = new Map()
  for (const e of events) {
    if (!e.isGoal) continue
    const name = e.players[0] ?? 'Unknown'
    const mins = byPlayer.get(name) ?? []
    mins.push(e.minute + (e.penalty ? ' pen' : '') + (e.ownGoal ? ' OG' : ''))
    byPlayer.set(name, mins)
  }
  return [...byPlayer.entries()].map(([name, mins]) => `${name} (${mins.join(', ')})`)
}

export function templateReport(match, summary) {
  if (!summary) return null
  const home = match.home
  const away = match.away
  const hGoals = summary.events.filter((e) => e.isGoal && e.teamId === home.id)
  const aGoals = summary.events.filter((e) => e.isGoal && e.teamId === away.id)

  const draw = home.score === away.score
  const [w, l, wGoals, lGoals] =
    home.winner || (!draw && Number(home.score) > Number(away.score))
      ? [home, away, hGoals, aGoals]
      : [away, home, aGoals, hGoals]

  const verbForMargin = (m) => (m >= 3 ? 'ran out' : m === 2 ? 'cruised to' : 'edged')
  const margin = Math.abs(Number(home.score) - Number(away.score))

  let lead = draw
    ? `${home.name} and ${away.name} shared a ${home.score}–${away.score} draw.`
    : `${w.name} ${verbForMargin(margin)} ${draw ? '' : `a ${w.score}–${l.score} win over `}${l.name}.`

  const wLine = scorerLine(wGoals)
  const lLine = scorerLine(lGoals)
  let goalsSentence = ''
  if (wLine.length) goalsSentence += ` ${wLine.join(', ')} scored${draw ? '' : ' for the winners'}.`
  if (lLine.length) goalsSentence += ` ${lLine.join(', ')} replied.`

  let statSentence = ''
  const s = summary.stats
  if (s?.home && s?.away) {
    const hp = parseFloat(s.home.possession)
    const ap = parseFloat(s.away.possession)
    const shots = `${s.home.shots ?? '?'}–${s.away.shots ?? '?'}`
    if (!Number.isNaN(hp) && !Number.isNaN(ap)) {
      const dom = hp >= ap ? home : away
      statSentence = ` ${dom.name} controlled possession (${Math.round(Math.max(hp, ap))}%); shots finished ${shots}.`
    }
  }

  return (lead + goalsSentence + statSentence).trim()
}

// Short storyline chips shown on the card. Derived from the result + stats.
export function matchTags(match, summary) {
  const tags = []
  const draw = match.home.score === match.away.score
  const margin = Math.abs(Number(match.home.score) - Number(match.away.score))
  const winner = match.home.winner ? match.home : match.away.winner ? match.away : null

  // Marquee upset / shock
  const hBig = MARQUEE.has(match.home.name)
  const aBig = MARQUEE.has(match.away.name)
  if (hBig !== aBig) {
    const minnow = hBig ? match.away : match.home
    if (winner === minnow) tags.push('Upset')
    else if (draw) tags.push('Shock')
  }

  if (margin >= 3) tags.push('Demolition')

  const s = summary?.stats
  if (winner && s?.home && s?.away) {
    const winPoss = parseFloat(winner.id === match.home.id ? s.home.possession : s.away.possession)
    if (!Number.isNaN(winPoss)) {
      if (winPoss >= 58) tags.push('Dominant')
      else if (winPoss <= 42) tags.push('Smash & grab')
    }
  }

  const totalGoals = Number(match.home.score) + Number(match.away.score)
  if (totalGoals <= 1) tags.push('Cagey')
  if (totalGoals >= 5) tags.push('Goal fest')

  return tags
}
