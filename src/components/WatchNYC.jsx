import { useMemo, useState } from 'react'
import { WATCH_BARS, MOODS, ZONES, VISITED, zoneOf } from '../data/watchBars'
import { WATCH_PARTIES } from '../data/watchParties'

const barMapUrl = (b) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${b.name} ${b.area} New York`)}`

// TV-confidence styling. The whole point of the list: can you see the goal and
// hear the room? MEDIUM = "verify" per Neil's app rule — don't push as a sure thing.
const TV = {
  high: { label: 'TVs: High', cls: 'bg-emerald-500/15 text-emerald-300' },
  medhigh: { label: 'TVs: Solid', cls: 'bg-teal-500/15 text-teal-300' },
  medium: { label: 'Verify TVs', cls: 'bg-amber-500/15 text-amber-300' },
}

const tagList = (s) => s.split('·').map((t) => t.trim()).filter(Boolean)

// "Collected" bars — a per-device checklist you build as you watch games out. The
// VISITED seed pre-fills the ones we've already hit; taps add more, saved locally.
const COLLECTED_KEY = 'wc_bars_collected'

function useCollected() {
  const [ids, setIds] = useState(() => {
    if (typeof localStorage === 'undefined') return new Set(VISITED)
    const raw = localStorage.getItem(COLLECTED_KEY)
    if (raw == null) return new Set(VISITED)
    try {
      const arr = JSON.parse(raw)
      return new Set(Array.isArray(arr) ? arr : VISITED)
    } catch {
      return new Set(VISITED)
    }
  })
  const toggle = (id) =>
    setIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      if (typeof localStorage !== 'undefined') localStorage.setItem(COLLECTED_KEY, JSON.stringify([...next]))
      return next
    })
  return [ids, toggle]
}

// Featured watch parties — collapsed by default (popout) so the tall list doesn't
// dominate the tab. Deep-searched + cross-checked; source links shown so each
// claim is auditable.
function WatchParties() {
  const [open, setOpen] = useState(false)
  return (
    <section className="rounded-xl border border-emerald-800/40 bg-emerald-950/10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-3 text-left"
      >
        <span className="text-sm font-semibold uppercase tracking-wide text-emerald-300">✅ Validated watch parties</span>
        <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
          {WATCH_PARTIES.length}
        </span>
        <span className={`ml-auto text-emerald-300/70 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open ? (
        <div className="border-t border-emerald-800/30 p-3">
          <p className="mb-3 text-[11px] text-slate-500">
            Deep-searched and cross-checked across 2+ sources — official fan zones plus organized venue
            parties. Confirm exact times on the linked page.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {WATCH_PARTIES.map((p) => (
              <div key={p.id} className="flex flex-col rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-300">
                    {p.kind}
                  </span>
                  <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[9px] font-semibold text-slate-300">
                    {p.cost}
                  </span>
                </div>
                <div className="mt-1.5 font-semibold text-slate-100">{p.name}</div>
                <div className="text-xs text-slate-500">{p.area}</div>
                <div className="mt-1.5 text-[11px] font-medium text-emerald-300/90">🗓 {p.when}</div>
                <p className="mt-1 text-sm leading-snug text-slate-300">{p.what}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                  <a href={p.link} target="_blank" rel="noreferrer" className="font-medium text-sky-300 hover:text-sky-200">
                    Details / RSVP →
                  </a>
                  <span className="flex items-center gap-1.5 text-slate-600">
                    sources:
                    {p.sources.map((s, i) => (
                      <a key={i} href={s} target="_blank" rel="noreferrer" className="text-slate-500 underline hover:text-slate-300">
                        {i + 1}
                      </a>
                    ))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="px-3 pb-3 text-[11px] text-slate-500">
          Official fan zones + organized venue parties, cross-checked across 2+ sources. Tap to view.
        </p>
      )}
    </section>
  )
}

function MoodChip({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
      }`}
    >
      {label}
    </button>
  )
}

function BarCard({ bar, collected, onToggle }) {
  const [open, setOpen] = useState(false)
  const tv = TV[bar.tv]
  return (
    <div
      className={`flex flex-col rounded-xl border p-3 ${
        collected ? 'border-emerald-600/60 bg-emerald-950/15' : 'border-slate-800 bg-slate-900/40'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          onClick={() => onToggle(bar.id)}
          aria-pressed={collected}
          title={collected ? 'Collected — tap to undo' : 'Tap to collect (you watched a game here)'}
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold transition-colors ${
            collected
              ? 'border-emerald-400 bg-emerald-500 text-white'
              : 'border-slate-600 text-transparent hover:border-emerald-400 hover:text-emerald-400/50'
          }`}
        >
          ✓
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-semibold text-slate-100">
                {bar.name}
                {collected && (
                  <span className="ml-1.5 align-middle text-[10px] font-bold uppercase tracking-wide text-emerald-400">
                    ✓ collected
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-xs text-slate-500">{bar.area}</div>
            </div>
            <a
              href={barMapUrl(bar)}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 rounded-md bg-slate-800 px-2 py-1 text-[11px] font-medium text-sky-300 hover:bg-slate-700"
            >
              📍 Map
            </a>
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tv.cls}`}>📺 {tv.label}</span>
        {bar.tvNote && <span className="text-[11px] text-slate-500">{bar.tvNote}</span>}
      </div>

      <p className="mt-2 text-sm leading-snug text-slate-300">{bar.blurb}</p>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-2 flex items-center gap-1 self-start text-[11px] font-medium text-slate-500 hover:text-slate-300"
      >
        {open ? 'Less' : 'Why go · best for · watch out'}
        <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="mt-2 space-y-2 border-t border-slate-800 pt-2">
          <p className="text-xs leading-snug text-slate-300">{bar.why}</p>
          <div className="flex flex-wrap gap-1">
            {tagList(bar.bestFor).map((t, i) => (
              <span key={i} className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                {t}
              </span>
            ))}
          </div>
          <p className="text-xs text-amber-300/80">⚠ {bar.watchOut}</p>
        </div>
      )}
    </div>
  )
}

export default function WatchNYC() {
  const [mood, setMood] = useState('all')
  const [collected, toggle] = useCollected()

  const total = WATCH_BARS.length
  const collectedCount = WATCH_BARS.reduce((n, b) => n + (collected.has(b.id) ? 1 : 0), 0)

  // Collected bars float to the top of whatever list they're in (stable otherwise).
  const sortCollectedFirst = (arr) =>
    [...arr].sort((a, b) => (collected.has(b.id) ? 1 : 0) - (collected.has(a.id) ? 1 : 0))

  // When a mood is picked, show its ranked shortlist flat; else group by zone.
  const moodBars = useMemo(() => {
    if (mood === 'all') return null
    const m = MOODS.find((x) => x.key === mood)
    return m ? m.picks.map((id) => WATCH_BARS.find((b) => b.id === id)).filter(Boolean) : []
  }, [mood])

  const grid = (bars) => (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {bars.map((b) => (
        <BarCard key={b.id} bar={b} collected={collected.has(b.id)} onToggle={toggle} />
      ))}
    </div>
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-slate-100">🍻 Where to watch in NYC</h1>
        <p className="text-xs text-slate-500">
          Pick by vibe, not just distance. Every spot is rated for screen confidence — because it's the
          World Cup and you need to actually see the goal.
        </p>
      </div>

      <WatchParties />

      {/* Collect-as-you-go tracker */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-200">🏆 Bars collected</span>
          <span className="font-bold tabular-nums text-emerald-400">{collectedCount} / {total}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${(collectedCount / total) * 100}%` }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">
          👉 Watched a game somewhere? <span className="font-semibold text-emerald-400">Tap the ◯ circle</span> on
          the left of its card to collect it — it gets a ✓ and jumps to the top of its neighborhood. See how many
          of the {total} you can tick off!
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-300">📺 High — built for viewing</span>
        <span className="rounded-full bg-teal-500/15 px-2 py-0.5 text-teal-300">Solid — shows games, strong setup</span>
        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-300">Verify — cool spot, confirm TVs/sound</span>
      </div>

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <MoodChip active={mood === 'all'} label={`All · ${total}`} onClick={() => setMood('all')} />
        {MOODS.map((m) => (
          <MoodChip key={m.key} active={mood === m.key} label={m.label} onClick={() => setMood(m.key)} />
        ))}
      </div>

      {mood === 'all'
        ? ZONES.map((z) => {
            const zoneBars = sortCollectedFirst(WATCH_BARS.filter((b) => zoneOf(b.area) === z.key))
            if (!zoneBars.length) return null
            return (
              <section key={z.key}>
                <div className="mb-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                    {z.label} <span className="text-slate-600">· {zoneBars.length}</span>
                  </h2>
                  {z.sub && <p className="text-[11px] text-slate-600">{z.sub}</p>}
                </div>
                {grid(zoneBars)}
              </section>
            )
          })
        : grid(sortCollectedFirst(moodBars ?? []))}
    </div>
  )
}
