import { useState } from 'react'

// A one-time, dismissible "new feature" announcement — meant to feel exciting (a
// bright NEW FEATURE badge), not like fine print. Remembers dismissal per device
// in localStorage (key wc_tip_<id>), so it shows once and never nags again.
export default function DismissibleTip({ id, badge = '🎉 New feature', children }) {
  const key = `wc_tip_${id}`
  const [shown, setShown] = useState(
    () => typeof localStorage === 'undefined' || localStorage.getItem(key) !== '1',
  )
  if (!shown) return null
  const dismiss = () => {
    setShown(false)
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, '1')
  }
  return (
    <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-500/50 bg-gradient-to-r from-emerald-950/50 to-slate-900/30 px-3 py-2.5 shadow-sm shadow-emerald-900/20">
      <div className="flex-1 text-xs leading-relaxed text-emerald-50/90">
        <span className="mr-2 inline-block rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
          {badge}
        </span>
        {children}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded px-1 text-emerald-300/70 hover:bg-emerald-900/40 hover:text-emerald-100"
      >
        ✕
      </button>
    </div>
  )
}
