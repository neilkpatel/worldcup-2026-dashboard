import { useMemo, useState } from 'react'
import MatchCard from './MatchCard'
import { matchStakes } from '../stakes'

const VIEWS = ['upcoming', 'completed', 'all']

export default function Schedule({ matches, groupMap, groups }) {
  const [filter, setFilter] = useState('')
  // Default to upcoming so the tab opens on what's next, not finished games.
  const [view, setView] = useState('upcoming')

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
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by team — e.g. United States"
          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm placeholder-slate-600 focus:border-emerald-600 focus:outline-none sm:max-w-xs"
        />
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
