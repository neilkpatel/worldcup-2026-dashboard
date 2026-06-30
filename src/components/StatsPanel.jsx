import { useEffect, useMemo, useState } from 'react'
import { fetchVisitStats } from '../lib/visits'

// Hidden owner-only panel — unlocked by tapping the ⚽ logo 5×. Shows the
// self-hosted visit counter (Supabase) plus a deep link to the full Vercel
// Web Analytics dashboard (countries / referrers / top pages live there).
const VERCEL_ANALYTICS_URL =
  'https://vercel.com/neilkpatel-gmailcoms-projects/worldcup-2026-dashboard/analytics'

const fmt = (n) => (n ?? 0).toLocaleString('en-US')
const todayKey = () => new Date().toISOString().slice(0, 10)

function Sparkline({ data }) {
  if (data.length < 2) return null
  const w = 280
  const h = 48
  const max = Math.max(...data.map((d) => d.views), 1)
  const step = w / (data.length - 1)
  const pts = data.map((d, i) => [i * step, h - (d.views / max) * (h - 6) - 3])
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const area = `${line} L${w} ${h} L0 ${h} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-12 w-full" preserveAspectRatio="none">
      <path d={area} fill="url(#sg)" opacity="0.25" />
      <path d={line} fill="none" stroke="#34d399" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-lg bg-slate-800/60 px-4 py-3">
      <div className="text-2xl font-bold tabular-nums text-white">{value}</div>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-emerald-400">{sub}</div>}
    </div>
  )
}

export default function StatsPanel({ onClose }) {
  const [rows, setRows] = useState(null) // null = loading

  useEffect(() => {
    fetchVisitStats().then(setRows)
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const s = useMemo(() => {
    if (!rows) return null
    const totalViews = rows.reduce((a, r) => a + Number(r.views), 0)
    const totalUniques = rows.reduce((a, r) => a + Number(r.uniques), 0)
    const today = rows.find((r) => r.day === todayKey())
    const last7 = rows.slice(-7).reduce((a, r) => a + Number(r.views), 0)
    const busiest = rows.reduce((b, r) => (Number(r.views) > Number(b?.views ?? -1) ? r : b), null)
    return { totalViews, totalUniques, today, last7, busiest, series: rows.slice(-30) }
  }, [rows])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="text-lg font-bold text-white">📊 Owner Stats</div>
            <div className="text-xs text-slate-500">psst — you found the secret panel ⚽×5</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {!s ? (
          <div className="py-10 text-center text-sm text-slate-400">Loading visits…</div>
        ) : s.totalViews === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">
            No visits logged yet — counting starts now. Check back soon. ⚽
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Total views" value={fmt(s.totalViews)} />
              <Stat label="Unique devices" value={fmt(s.totalUniques)} />
              <Stat
                label="Today"
                value={fmt(s.today?.views)}
                sub={s.today ? `${fmt(s.today.uniques)} unique` : '—'}
              />
              <Stat label="Last 7 days" value={fmt(s.last7)} />
            </div>

            {s.series.length > 1 && (
              <div className="mt-4">
                <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Daily views (last {s.series.length}d)
                </div>
                <Sparkline data={s.series} />
              </div>
            )}

            {s.busiest && (
              <div className="mt-3 text-xs text-slate-400">
                🔥 Busiest day:{' '}
                <span className="font-semibold text-slate-200">
                  {new Date(s.busiest.day + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>{' '}
                — {fmt(s.busiest.views)} views
              </div>
            )}
          </>
        )}

        <a
          href={VERCEL_ANALYTICS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 block rounded-lg bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-500"
        >
          Open full analytics (countries · referrers) ↗
        </a>
        <div className="mt-2 text-center text-[11px] text-slate-600">
          Raw pageviews incl. bots · clean human numbers on Vercel
        </div>
      </div>
    </div>
  )
}
