import { useMemo, useState } from 'react'
import MatchCard from './MatchCard'
import Autocomplete from './Autocomplete'
import DismissibleTip from './DismissibleTip'
import { matchStakes } from '../stakes'

const VIEWS = ['upcoming', 'completed', 'all']

export default function Schedule({ matches, groupMap, groups }) {
  const [filter, setFilter] = useState('')
  // Default to upcoming so the tab opens on what's next, not finished games.
  const [view, setView] = useState('upcoming')

  // Distinct real team names for search autocomplete. Only the 48 nations play in
  // the group stage, so deriving from group-stage matches cleanly excludes every
  // knockout placeholder slot ("Group F runner-up", "Winner of Round of 32 #7", …).
  const teamOptions = useMemo(
    () =>
      [
        ...new Set(
          matches
            .filter((m) => m.round === 'group-stage')
            .flatMap((m) => [m.home, m.away])
            .filter((t) => t.abbrev)
            .map((t) => t.name),
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [matches],
  )

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    let list = matches
    if (view === 'upcoming') list = list.filter((m) => m.state !== 'post') // live + future
    else if (view === 'completed') list = list.filter((m) => m.state === 'post')
    if (q) {
      list = list.filter(
        (m) =>
          m.home.name.toLowerCase().includes(q) ||
          m.away.name.toLowerCase().includes(q)
      )
    }
    return list
  }, [matches, filter, view])

  const byDay = useMemo(() => {
    const days = []
    let current = null
    for (const match of filtered) {
      const key = match.date.toDateString()
      if (!current || current.key !== key) {
        current = { key, date: match.date, matches: [] }
        days.push(current)
      }
      current.matches.push(match)
    }
    // Completed: show the most recent day first.
    return view === 'completed' ? days.reverse() : days
  }, [filtered, view])

  return (
    <div>
      <DismissibleTip id="schedule-search">
        Search the schedule for your <span className="font-semibold">favorite team</span> — just start
        typing a name (try “U”) and pick it from the list. ⚽
      </DismissibleTip>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-sm">
          {VIEWS.map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-md px-3 py-1.5 font-medium capitalize transition-colors ${
                view === v ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="w-full sm:max-w-xs">
          <Autocomplete
            value={filter}
            onChange={setFilter}
            options={teamOptions}
            placeholder="Filter by team — e.g. United States"
            ariaLabel="Filter schedule by team"
          />
        </div>
      </div>
      {byDay.map((day) => (
        <section key={day.key} className="mb-8">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-slate-400 uppercase">
            {day.date.toLocaleDateString([], {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {day.matches.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                groupMap={groupMap}
                stakes={matchStakes(m, groups)}
              />
            ))}
          </div>
        </section>
      ))}
      {byDay.length === 0 && (
        <p className="py-16 text-center text-slate-500">
          {filter
            ? `No ${view === 'all' ? '' : view + ' '}matches found for "${filter}".`
            : `No ${view} matches.`}
        </p>
      )}
    </div>
  )
}
