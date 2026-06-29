import { useEffect, useState } from 'react'
import { fetchTitleOdds } from '../api'

// Followed-team names as Polymarket labels them — bolded so Neil's teams stand out.
const HIGHLIGHT = new Set(['USA', 'United States', 'Norway'])
const TOP_N = 10

// "Who wins it all" board — implied championship odds from Polymarket's public market,
// fetched client-side (CORS is open, no key). Best-effort: renders nothing until/unless
// the data loads, so a Polymarket hiccup just hides the card rather than breaking Today.
export default function TitleRace() {
  const [odds, setOdds] = useState([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let alive = true
    const load = () =>
      fetchTitleOdds()
        .then((rows) => alive && setOdds(rows))
        .catch(() => {})
    load()
    // Title odds drift slowly — a light refresh every 10 min is plenty.
    const id = setInterval(load, 600_000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  if (odds.length === 0) return null
  const top = odds.slice(0, TOP_N)
  const max = top[0].prob

  return (
    <section className="mb-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2.5 text-left transition-colors hover:border-emerald-600/40 hover:bg-slate-900/70"
      >
        <span className="shrink-0 text-sm font-semibold tracking-wide text-slate-300 uppercase">
          🏆 Betting odds
        </span>
        {!open && (
          <span className="truncate text-xs text-slate-500">
            · {top[0].team} {Math.round(top[0].prob * 100)}% favorite
          </span>
        )}
        <span className="ml-auto flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-400">
          {open ? 'Hide' : 'Tap to expand'}
          <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
        </span>
      </button>
      {open && (
        <p className="mt-2 mb-2 text-xs text-slate-500">
          Implied odds to win the World Cup — live from{' '}
          <a href="https://polymarket.com" target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">
            Polymarket
          </a>
          .
        </p>
      )}
      {open && (
      <div className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-900/40 p-3">
        {top.map((row, i) => {
          const mine = HIGHLIGHT.has(row.team)
          const pct = Math.round(row.prob * 100)
          return (
            <div key={row.team} className="flex items-center gap-2 text-sm">
              <span className="w-4 shrink-0 text-right text-xs tabular-nums text-slate-600">
                {i + 1}
              </span>
              <span
                className={`w-28 shrink-0 truncate ${mine ? 'font-bold text-emerald-300' : 'text-slate-200'}`}
                title={row.team}
              >
                {row.team}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full ${mine ? 'bg-emerald-400' : 'bg-sky-500/70'}`}
                  style={{ width: `${Math.max(3, (row.prob / max) * 100)}%` }}
                />
              </div>
              <span
                className={`w-10 shrink-0 text-right text-xs font-semibold tabular-nums ${
                  mine ? 'text-emerald-300' : 'text-slate-300'
                }`}
              >
                {pct < 1 ? '<1' : pct}%
              </span>
            </div>
          )
        })}
      </div>
      )}
    </section>
  )
}
