import { buildScorers } from '../stats'
import { buildTeamLookup } from '../api'

export default function GoldenBoot({ matches }) {
  const teamLookup = buildTeamLookup(matches)
  const scorers = buildScorers(matches, teamLookup)
  const topGoals = scorers[0]?.goals ?? 0

  if (scorers.length === 0) {
    return (
      <p className="py-16 text-center text-slate-500">
        No goals yet — the race for the Golden Boot starts with the first match.
      </p>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-100">🥇 Golden Boot race</h2>
        <p className="text-sm text-slate-500">
          Every goal so far, across all matches. Ties broken by fewest penalties.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-800">
        {scorers.map((s, i) => {
          const leader = s.goals === topGoals
          return (
            <div
              key={`${s.name}-${s.teamId}`}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm ${
                leader ? 'bg-amber-500/10' : 'odd:bg-slate-900/40'
              }`}
            >
              <span className="w-6 shrink-0 text-right tabular-nums text-slate-500">{i + 1}</span>
              {s.logo ? (
                <img src={s.logo} alt="" className="h-5 w-5 shrink-0" />
              ) : (
                <span className="h-5 w-5 shrink-0" />
              )}
              <span className="min-w-0 flex-1 truncate">
                <span className={leader ? 'font-semibold text-amber-200' : 'text-slate-200'}>
                  {s.name}
                </span>
                <span className="ml-2 text-xs text-slate-500">{s.abbrev || s.team}</span>
              </span>
              {s.penalties > 0 && (
                <span className="shrink-0 text-xs text-slate-500">
                  {s.penalties} pen
                </span>
              )}
              <span
                className={`w-8 shrink-0 text-right text-base font-bold tabular-nums ${
                  leader ? 'text-amber-300' : 'text-slate-100'
                }`}
              >
                {s.goals}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
