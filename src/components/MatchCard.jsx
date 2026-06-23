import FifaRank from './FifaRank'

function TeamRow({ team, state, isWinner }) {
  const dim = state === 'post' && !isWinner
  return (
    <div className={`flex items-center gap-3 ${dim ? 'opacity-50' : ''}`}>
      <img src={team.logo} alt="" className="h-6 w-6 object-contain" loading="lazy" />
      <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
        <span className="truncate font-medium">{team.name}</span>
        <FifaRank abbrev={team.abbrev} className="shrink-0 text-[10px]" />
      </div>
      {state !== 'pre' && (
        <span className={`text-lg tabular-nums ${isWinner ? 'font-bold' : ''}`}>
          {team.score}
        </span>
      )}
    </div>
  )
}

const STAKE_STYLE = {
  critical: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
  notable: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  info: 'border-slate-700 bg-slate-800/50 text-slate-400',
}

export default function MatchCard({ match, groupMap, stakes }) {
  const group = groupMap[match.home.id]
  const kickoff = match.date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
        <span>
          {group ? `Group ${group}` : 'Knockout'}
          {match.venue && ` · ${match.venue}${match.city ? `, ${match.city}` : ''}`}
        </span>
        {match.state === 'in' ? (
          <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            {match.clock}
          </span>
        ) : match.state === 'post' ? (
          <span className="font-semibold text-slate-300">FT</span>
        ) : (
          <span className="font-semibold text-slate-300">{kickoff}</span>
        )}
      </div>
      <div className="space-y-2">
        <TeamRow team={match.home} state={match.state} isWinner={match.home.winner} />
        <TeamRow team={match.away} state={match.state} isWinner={match.away.winner} />
      </div>
      {match.state === 'pre' && match.tv && (
        <div className="mt-3 text-xs text-slate-500">📺 {match.tv}</div>
      )}
      {stakes && (
        <div
          className={`mt-3 rounded-lg border px-3 py-2 text-xs leading-relaxed ${
            STAKE_STYLE[stakes.level] ?? STAKE_STYLE.info
          }`}
        >
          {stakes.text}
        </div>
      )}
    </div>
  )
}
