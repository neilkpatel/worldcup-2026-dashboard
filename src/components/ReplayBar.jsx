import { useEffect, useRef, useState } from 'react'
import { REPLAY_DAYS, formatReplayDay, replayDay } from '../replay'

// Lets a visitor who never saw the tournament live rewind the whole dashboard to the
// end of a past matchday. Collapsed to one quiet line until used, so the default view
// stays the finished tournament.
export default function ReplayBar({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const active = value ? replayDay(value) : null

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    const onEsc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  const pick = (date) => {
    onChange(date)
    setOpen(false)
  }

  return (
    <div ref={wrapRef} className="relative">
      {active ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-amber-700/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
          <span className="font-medium">
            📼 Replaying {formatReplayDay(active.date)}
          </span>
          <span className="text-amber-200/70">
            {active.label} · {active.blurb}. Everything after this day is unplayed.
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setOpen((v) => !v)}
              className="rounded border border-amber-700/60 px-2.5 py-1 text-xs text-amber-200 transition-colors hover:border-amber-400 hover:text-amber-100"
            >
              Another day ▾
            </button>
            <button
              onClick={() => pick(null)}
              className="rounded bg-amber-600 px-2.5 py-1 text-xs font-medium text-black transition-colors hover:bg-amber-500"
            >
              Back to the final result
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2.5 text-left text-sm text-slate-400 transition-colors hover:border-emerald-700 hover:text-slate-200"
        >
          <span>📼</span>
          <span>
            Didn't catch it live? <span className="text-emerald-400">Replay a matchday</span> and
            see the dashboard as it looked that night.
          </span>
          <span className="ml-auto text-xs text-slate-500">▾</span>
        </button>
      )}

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-slate-700 bg-slate-950 shadow-xl">
          {REPLAY_DAYS.map((day) => (
            <button
              key={day.date}
              onClick={() => pick(day.date)}
              className={`block w-full px-4 py-2.5 text-left transition-colors hover:bg-slate-800 ${
                day.date === value ? 'bg-slate-800/60' : ''
              }`}
            >
              <div className="text-sm text-slate-100">
                {day.label}
                {day.date === value && <span className="ml-2 text-xs text-amber-400">now showing</span>}
              </div>
              <div className="text-xs text-slate-500">
                {formatReplayDay(day.date)} · {day.blurb}
              </div>
            </button>
          ))}
          {value && (
            <button
              onClick={() => pick(null)}
              className="block w-full border-t border-slate-800 px-4 py-2.5 text-left text-sm text-emerald-400 transition-colors hover:bg-slate-800"
            >
              🏆 Back to the final result
            </button>
          )}
        </div>
      )}
    </div>
  )
}
