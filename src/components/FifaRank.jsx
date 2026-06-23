import { FIFA_RANKS } from '../data/fifaRankings'

// Subtle, parenthesized "(FIFA #N)" shown right next to a team's name wherever it
// appears. Not bold — it's secondary context, not a headline. Renders nothing for
// unranked placeholders. `bare` → "(#N)" for the tightest spots.
export default function FifaRank({ abbrev, bare = false, className = '' }) {
  const rank = FIFA_RANKS[abbrev]
  if (!rank) return null
  return (
    <span
      title={`FIFA World Ranking: #${rank}`}
      className={`font-normal tabular-nums text-slate-500 ${className}`}
    >
      ({bare ? `#${rank}` : `FIFA #${rank}`})
    </span>
  )
}
