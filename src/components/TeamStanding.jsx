import { ordinal } from '../stats'

// Compact "how they're doing" chip for a team in a group-stage fixture/result:
// group position + points, tinted by qualification zone (top-2 green, 3rd amber,
// 4th/out slate). Teams yet to play just show "0 pts". Full record on hover.
export default function TeamStanding({ s }) {
  if (!s) return null
  const fresh = s.played === 0
  const color = fresh
    ? 'text-slate-500'
    : s.rank <= 2
      ? 'text-emerald-400'
      : s.rank === 3
        ? 'text-amber-400'
        : 'text-slate-500'
  const label = fresh
    ? `${s.points} pts`
    : `${ordinal(s.rank)} · ${s.points} ${s.points === 1 ? 'pt' : 'pts'}`
  return (
    <span
      title={`Group ${s.group} · Played ${s.played} · ${s.wins}W ${s.draws}D ${s.losses}L · GD ${s.gd > 0 ? '+' : ''}${s.gd}`}
      className={`text-[10px] font-semibold tabular-nums ${color}`}
    >
      {label}
    </span>
  )
}
