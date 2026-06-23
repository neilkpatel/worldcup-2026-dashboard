import { FIFA_RANKS } from '../data/fifaRankings'

// Small "FIFA #N" chip shown wherever a team appears. Renders nothing for teams
// without a ranking (knockout placeholders, etc.). `bare` drops the "FIFA " label
// for tight spots (tables) — just "#N".
export default function FifaRank({ abbrev, bare = false, className = '' }) {
  const rank = FIFA_RANKS[abbrev]
  if (!rank) return null
  return (
    <span
      title={`FIFA World Ranking: #${rank}`}
      className={`font-semibold tracking-wide text-slate-500 tabular-nums ${className}`}
    >
      {bare ? `#${rank}` : `FIFA #${rank}`}
    </span>
  )
}
