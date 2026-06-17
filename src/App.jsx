import { useEffect, useMemo, useState } from 'react'
import { fetchSchedule, fetchStandings, fetchNews, buildGroupMap } from './api'
import Today from './components/Today'
import Groups from './components/Groups'
import GoldenBoot from './components/GoldenBoot'
import Bracket from './components/Bracket'
import Schedule from './components/Schedule'
import MyTickets from './components/MyTickets'

const TABS = ['Today', 'Groups', 'Golden Boot', 'Bracket', 'Schedule', 'My Tickets']
const REFRESH_MS = 60_000

// The IANA zone + short label of the viewer's machine — every kickoff time on the
// dashboard is converted into this zone, so label it explicitly.
const TZ_NAME = Intl.DateTimeFormat().resolvedOptions().timeZone
const TZ_SHORT =
  new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
    .formatToParts(new Date())
    .find((p) => p.type === 'timeZoneName')?.value ?? ''

function App() {
  const [tab, setTab] = useState('Today')
  const [matches, setMatches] = useState([])
  const [groups, setGroups] = useState([])
  const [news, setNews] = useState([])
  const [updatedAt, setUpdatedAt] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [schedule, standings, headlines] = await Promise.all([
          fetchSchedule(),
          fetchStandings(),
          fetchNews().catch(() => []), // best-effort; never blocks the dashboard
        ])
        if (cancelled) return
        setMatches(schedule)
        setGroups(standings)
        setNews(headlines)
        setUpdatedAt(new Date())
        setError(null)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    const interval = setInterval(load, REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const groupMap = useMemo(() => buildGroupMap(groups), [groups])
  const liveCount = matches.filter((m) => m.state === 'in').length

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4">
          <h1 className="text-xl font-bold tracking-tight">
            <span className="mr-2">⚽</span>World Cup 2026
          </h1>
          {liveCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              {liveCount} LIVE
            </span>
          )}
          <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === t
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </nav>
          <div className="ml-auto text-right text-xs text-slate-500">
            <div>🕐 Times in {TZ_NAME} ({TZ_SHORT})</div>
            {updatedAt && (
              <div>
                Updated{' '}
                {updatedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {error && (
          <div className="mb-4 rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-300">
            Couldn't reach ESPN ({error}) — showing last loaded data.
          </div>
        )}
        {loading ? (
          <p className="py-16 text-center text-slate-500">Loading tournament data…</p>
        ) : (
          <>
            {tab === 'Today' && (
              <Today matches={matches} groupMap={groupMap} groups={groups} news={news} />
            )}
            {tab === 'Groups' && <Groups groups={groups} matches={matches} />}
            {tab === 'Golden Boot' && <GoldenBoot matches={matches} />}
            {tab === 'Bracket' && <Bracket matches={matches} />}
            {tab === 'Schedule' && (
              <Schedule matches={matches} groupMap={groupMap} groups={groups} />
            )}
            {tab === 'My Tickets' && <MyTickets groups={groups} />}
          </>
        )}
      </main>
    </div>
  )
}

export default App
