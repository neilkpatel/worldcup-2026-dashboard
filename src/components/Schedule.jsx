import { useMemo, useState } from 'react'
import MatchCard from './MatchCard'
import { matchStakes } from '../stakes'

export default function Schedule({ matches, groupMap, groups }) {
  const [filter, setFilter] = useState('')

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return matches
    return matches.filter(
      (m) =>
        m.home.name.toLowerCase().includes(q) ||
        m.away.name.toLowerCase().includes(q)
    )
  }, [matches, filter])

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
    return days
  }, [filtered])

  return (
    <div>
      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter by team — e.g. United States"
        className="mb-6 w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm placeholder-slate-600 focus:border-emerald-600 focus:outline-none sm:max-w-xs"
      />
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
        <p className="py-16 text-center text-slate-500">No matches found for "{filter}"</p>
      )}
    </div>
  )
}
