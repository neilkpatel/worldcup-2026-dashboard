import { useCallback, useEffect, useState } from 'react'

// Transient "what's new" toast for the Today (landing) tab. Pops in on load,
// auto-dismisses after a few seconds (or on tap/✕), and shows only ONCE per device
// (localStorage) so returning visitors aren't nagged. Bump VERSION to re-announce
// the next batch of features.
const VERSION = '2026-06-24'
const KEY = `wc_whatsnew_${VERSION}`
const AUTO_MS = 9000

export default function WhatsNew() {
  const [open, setOpen] = useState(
    () => typeof localStorage === 'undefined' || localStorage.getItem(KEY) !== '1',
  )
  const [leaving, setLeaving] = useState(false)

  const dismiss = useCallback(() => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, '1')
    setLeaving(true)
    window.setTimeout(() => setOpen(false), 300) // let the fade-out finish
  }, [])

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(dismiss, AUTO_MS)
    return () => window.clearTimeout(t)
  }, [open, dismiss])

  if (!open) return null

  return (
    <div
      role="status"
      className={`fixed left-1/2 top-[116px] z-50 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 transition-opacity duration-300 sm:top-20 ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/60 bg-emerald-950/95 px-3 py-3 shadow-lg shadow-emerald-900/50 backdrop-blur">
        <span className="shrink-0 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
          🎉 New
        </span>
        <div className="flex-1 text-xs leading-relaxed text-emerald-50">
          Fresh updates! Search <span className="font-semibold">teams</span> on Schedule and{' '}
          <span className="font-semibold">players</span> on Golden Boot — plus a revamped 🍻 Bars guide.
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded px-1 leading-none text-emerald-300/80 hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
