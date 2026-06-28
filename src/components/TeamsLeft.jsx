import { useEffect, useState } from 'react'
import { groupStageComplete } from '../api'

// Main-bracket rounds — each completed match here eliminates one team. The 3rd-place
// match is excluded (both its teams already lost their semis, so it removes no one new).
const KO_MAIN = new Set(['round-of-32', 'round-of-16', 'quarterfinals', 'semifinals', 'final'])
const ROUND_ORDER = ['round-of-32', 'round-of-16', 'quarterfinals', 'semifinals', 'final']
const ROUND_LABEL = {
  'round-of-32': 'Round of 32',
  'round-of-16': 'Round of 16',
  quarterfinals: 'Quarterfinals',
  semifinals: 'Semifinals',
  final: 'Final',
}
const TOTAL = 32
const SEEN_KEY = 'wc_teams_left_seen'

// Tween a number from `from` → `target` (ease-out). Animates only on a real drop and
// when motion is allowed; otherwise it just returns `target` (no state churn). Every
// setState happens inside the rAF callback, never synchronously in the effect body.
function useCountTween(target, from) {
  const reduce =
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const animate = from != null && from !== target && !reduce
  const [val, setVal] = useState(from ?? target)
  useEffect(() => {
    if (!animate) return
    let raf
    const start = performance.now()
    const dur = 1100
    const step = (now) => {
      const t = Math.min(1, (now - start) / dur)
      const eased = 1 - Math.pow(1 - t, 3)
      setVal(Math.round(from + (target - from) * eased))
      if (t < 1) raf = requestAnimationFrame(step)
      else setVal(target)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [animate, target, from])
  return animate ? val : target
}

// Big "teams still alive" counter for the knockout phase: 32 → … → 1. Counts down by
// game (each completed bracket match = one team out). It remembers the value YOU last
// saw on this device and animates the drop since then (e.g. 32 → 24) with a flourish.
export default function TeamsLeft({ matches }) {
  const completed = matches.filter((m) => KO_MAIN.has(m.round) && m.completed).length
  const teamsLeft = Math.max(1, TOTAL - completed)
  const currentRound =
    ROUND_ORDER.find((r) => matches.some((m) => m.round === r && m.state !== 'post')) ?? 'final'

  const finalMatch = matches.find((m) => m.round === 'final')
  const champion = finalMatch?.completed
    ? finalMatch.home.winner
      ? finalMatch.home
      : finalMatch.away.winner
        ? finalMatch.away
        : null
    : null

  // Value last shown on this device — animate only on a DROP since then.
  const [fromVal] = useState(() => {
    if (typeof localStorage === 'undefined') return null
    const v = localStorage.getItem(SEEN_KEY)
    const n = v == null ? null : Number(v)
    return n != null && Number.isFinite(n) && n > teamsLeft ? n : null
  })
  const display = useCountTween(teamsLeft, fromVal)
  const dropped = fromVal != null ? fromVal - teamsLeft : 0
  const [showDrop, setShowDrop] = useState(dropped > 0)

  useEffect(() => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(SEEN_KEY, String(teamsLeft))
  }, [teamsLeft])
  useEffect(() => {
    if (!showDrop) return
    const t = setTimeout(() => setShowDrop(false), 5000)
    return () => clearTimeout(t)
  }, [showDrop])

  // Only relevant once the bracket exists.
  if (!groupStageComplete(matches)) return null

  if (champion) {
    return (
      <section className="mb-6">
        <div className="flex items-center gap-4 rounded-2xl border border-amber-400/50 bg-gradient-to-r from-amber-500/20 to-amber-600/5 px-5 py-4">
          <span className="text-5xl" aria-hidden>🏆</span>
          {champion.logo && <img src={champion.logo} alt="" className="h-12 w-12 object-contain" />}
          <div>
            <div className="text-[10px] font-semibold tracking-wide text-amber-300/80 uppercase">
              World Champions
            </div>
            <div className="text-2xl font-black text-amber-100">{champion.name}</div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mb-6">
      <div className="alive-pulse flex items-center gap-5 rounded-2xl border border-emerald-600/40 bg-gradient-to-br from-emerald-950/40 to-slate-900/40 px-5 py-4">
        <div className="text-6xl font-black tabular-nums text-emerald-300 sm:text-7xl">{display}</div>
        <div className="min-w-0">
          <div className="text-base font-bold text-slate-100">teams still alive</div>
          <div className="text-xs text-slate-400">
            {ROUND_LABEL[currentRound]} · {completed} eliminated so far
          </div>
          {showDrop && dropped > 0 && (
            <div className="mt-1.5 inline-block rounded bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-300">
              ▼ {dropped} out since your last visit
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
