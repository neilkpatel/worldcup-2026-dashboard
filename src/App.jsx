import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { fetchSchedule, fetchStandings, fetchNews, buildGroupMap, isKnockoutRound } from './api'
import StatsPanel from './components/StatsPanel'
import { trackVisit } from './lib/visits'
import Today from './components/Today'
import Groups from './components/Groups'
import GoldenBoot from './components/GoldenBoot'
import Bracket from './components/Bracket'
import Schedule from './components/Schedule'
import PickEm from './components/PickEm'
import WatchNYC from './components/WatchNYC'
// "My Tickets" shows which matches Neil is attending + dream-matchup scenarios.
// Public on Neil's request (note: this exposes the venues/dates he'll be at).
const MyTickets = lazy(() => import('./components/MyTickets'))

// Bracket sits 2nd — it becomes the main event once the group stage ends, so it
// stays prominent (and the tab grows a live pulse when a knockout game is on).
const TABS = ['Today', 'Bracket', 'Schedule', 'Groups', 'Golden Boot', ...(MyTickets ? ["Neil's Tickets"] : []), 'Bars', "Pick'em"]
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
  // "NEW" badge on the Pick'em tab — drops away per-visitor once they've opened it.
  const [pickemSeen, setPickemSeen] = useState(
    () => typeof localStorage !== 'undefined' && localStorage.getItem('wc_pickem_seen') === '1',
  )
  const [matches, setMatches] = useState([])
  const [groups, setGroups] = useState([])
  const [news, setNews] = useState([])
  const [updatedAt, setUpdatedAt] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  // Hidden owner-stats panel: tap the ⚽ logo 5× (within ~1.2s of each tap) to
  // unlock. Kept silent (no pointer cursor) so casual visitors never find it.
  const [showStats, setShowStats] = useState(false)
  const logoTaps = useRef(0)
  const logoTimer = useRef(null)
  function handleLogoTap() {
    logoTaps.current += 1
    clearTimeout(logoTimer.current)
    if (logoTaps.current >= 5) {
      logoTaps.current = 0
      setShowStats(true)
      return
    }
    logoTimer.current = setTimeout(() => (logoTaps.current = 0), 1200)
  }

  // Count this page load once (self-hosted counter; powers the panel above).
  useEffect(() => {
    trackVisit()
  }, [])

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
  // A knockout game in progress lights a pulse on the Bracket tab.
  const knockoutLive = matches.some((m) => isKnockoutRound(m.round) && m.state === 'in')

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4">
          <h1 className="text-xl font-bold tracking-tight">
            <span className="mr-2 select-none" onClick={handleLogoTap}>
              ⚽
            </span>
            World Cup 2026
          </h1>
          {liveCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              {liveCount} LIVE
            </span>
          )}
          <nav className="order-last -mx-1 flex w-full gap-1 overflow-x-auto px-1 sm:order-none sm:w-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t)
                  if (t === "Pick'em" && !pickemSeen) {
                    setPickemSeen(true)
                    localStorage.setItem('wc_pickem_seen', '1')
                  }
                }}
                className={`relative shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  tab === t
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {t === 'Bars' ? '🍻 Bars' : t === 'Bracket' ? '🏆 Bracket' : t}
                {t === 'Bracket' && knockoutLive && (
                  <span
                    className="ml-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400 align-middle"
                    title="Knockout match live now"
                  />
                )}
                {t === "Pick'em" && !pickemSeen && (
                  <span className="ml-1.5 inline-flex animate-pulse rounded-full bg-amber-400 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-slate-900 align-[1px]">
                    New
                  </span>
                )}
              </button>
            ))}
          </nav>
          <div className="ml-auto text-right text-xs text-slate-500">
            <div>
              🕐 <span className="sm:hidden">{TZ_SHORT}</span>
              <span className="hidden sm:inline">Times in {TZ_NAME} ({TZ_SHORT})</span>
            </div>
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
            {tab === "Pick'em" && <PickEm matches={matches} groupMap={groupMap} />}
            {tab === 'Bars' && <WatchNYC />}
            {tab === 'Groups' && <Groups groups={groups} matches={matches} />}
            {tab === 'Golden Boot' && <GoldenBoot matches={matches} />}
            {tab === 'Bracket' && <Bracket matches={matches} />}
            {tab === 'Schedule' && (
              <Schedule matches={matches} groupMap={groupMap} groups={groups} />
            )}
            {MyTickets && tab === "Neil's Tickets" && (
              <Suspense fallback={null}>
                <MyTickets matches={matches} />
              </Suspense>
            )}
          </>
        )}
      </main>
      {showStats && <StatsPanel onClose={() => setShowStats(false)} />}
      <Analytics />
    </div>
  )
}

export default App
