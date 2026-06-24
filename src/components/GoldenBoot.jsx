import { useMemo, useState } from 'react'
import { buildScorers } from '../stats'
import { buildTeamLookup } from '../api'

// Accent-insensitive search so "jimenez" finds "Jiménez", "krejci" finds "Krejcí".
const norm = (s) => (s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

const goalDate = (d) => d.toLocaleDateString([], { month: 'short', day: 'numeric' })

// One scorer's goal-by-goal breakdown: which match (vs whom + score from their
// side), minute, and whether it was a penalty.
function GoalBreakdown({ goalsList }) {
  return (
    <ul className="space-y-1 border-t border-slate-800 bg-slate-950/40 px-3 py-2.5 text-xs text-slate-400">
      {goalsList.map((g, i) => (
        <li key={i} className="flex items-baseline gap-2">
          <span className="shrink-0">⚽</span>
          <span className="w-10 shrink-0 tabular-nums text-slate-500">{g.minute}</span>
          <span className="min-w-0 flex-1 truncate text-slate-300">
            vs {g.oppAbbrev || g.opponent || 'TBD'}
            {g.penalty && <span className="ml-1 text-slate-500">(pen)</span>}
          </span>
          {g.scoreFor !== '' && (
            <span className="shrink-0 tabular-nums text-slate-500">
              {g.scoreFor}–{g.scoreAgainst}
            </span>
          )}
          <span className="w-12 shrink-0 text-right text-slate-600">{goalDate(g.date)}</span>
        </li>
      ))}
    </ul>
  )
}

export default function GoldenBoot({ matches }) {
  const teamLookup = useMemo(() => buildTeamLookup(matches), [matches])
  const scorers = useMemo(() => buildScorers(matches, teamLookup), [matches, teamLookup])
  const [query, setQuery] = useState('')
  const [openKey, setOpenKey] = useState(null)

  const topGoals = scorers[0]?.goals ?? 0
  const q = norm(query.trim())
  const filtered = q
    ? scorers.filter((s) => norm(s.name).includes(q) || norm(s.team).includes(q) || norm(s.abbrev).includes(q))
    : scorers

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
        <h2 className="text-lg font-bold text-slate-100">🥇 Golden Boot &amp; player search</h2>
        <p className="text-sm text-slate-500">
          Every goal so far, across all matches. Search a player to see exactly which games they scored
          in. Tap any row to expand. Ties broken by fewest penalties.
        </p>
      </div>

      <div className="relative mb-3">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a player (e.g. Messi, Jiménez) or country…"
          className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2.5 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-6 text-center text-sm text-slate-500">
          No scorer matches “{query.trim()}”. Only players who've scored show up here — if they haven't
          found the net yet, they won't appear.
        </p>
      ) : (
        <>
          {q && (
            <p className="mb-2 text-xs text-slate-500">
              {filtered.length} {filtered.length === 1 ? 'player' : 'players'} matching “{query.trim()}”
            </p>
          )}
          <div className="overflow-hidden rounded-lg border border-slate-800">
            {filtered.map((s) => {
              const key = `${s.name}-${s.teamId}`
              const rank = scorers.indexOf(s) + 1
              const leader = s.goals === topGoals
              const open = openKey === key
              return (
                <div key={key} className={leader ? 'bg-amber-500/10' : 'odd:bg-slate-900/40'}>
                  <button
                    type="button"
                    onClick={() => setOpenKey(open ? null : key)}
                    aria-expanded={open}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-slate-800/40"
                  >
                    <span className="w-6 shrink-0 text-right tabular-nums text-slate-500">{rank}</span>
                    {s.logo ? (
                      <img src={s.logo} alt="" className="h-5 w-5 shrink-0" />
                    ) : (
                      <span className="h-5 w-5 shrink-0" />
                    )}
                    <span className="min-w-0 flex-1 truncate">
                      <span className={leader ? 'font-semibold text-amber-200' : 'text-slate-200'}>{s.name}</span>
                      <span className="ml-2 text-xs text-slate-500">{s.abbrev || s.team}</span>
                    </span>
                    {s.penalties > 0 && <span className="shrink-0 text-xs text-slate-500">{s.penalties} pen</span>}
                    <span
                      className={`w-8 shrink-0 text-right text-base font-bold tabular-nums ${
                        leader ? 'text-amber-300' : 'text-slate-100'
                      }`}
                    >
                      {s.goals}
                    </span>
                    <span className={`shrink-0 text-slate-600 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
                  </button>
                  {open && <GoalBreakdown goalsList={s.goalsList} />}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
