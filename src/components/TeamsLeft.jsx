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
// Short tag for the round a team went out in (mobile list).
const ROUND_SHORT = {
  'round-of-32': 'R32',
  'round-of-16': 'R16',
  quarterfinals: 'QF',
  semifinals: 'SF',
  final: 'Final',
}
const TOTAL = 32
const SEEN_KEY = 'wc_teams_left_seen'

// Every completed main-bracket match knocks out exactly one team: the loser. Use the
// `winner` flag (not the score) so penalty-shootout exits — tied on the scoreboard — are
// still attributed to the side that went home. Ordered by kickoff DESC (most recent out
// first); the 3rd-place match is excluded upstream (KO_MAIN), so no double-counting.
function eliminatedTeams(matches) {
  return matches
    .filter((m) => KO_MAIN.has(m.round) && m.completed)
    .map((m) => {
      const loser = m.home.winner ? m.away : m.away.winner ? m.home : null
      return loser && { ...loser, round: m.round, date: m.date }
    })
    .filter(Boolean)
    .sort((a, b) => b.date - a.date)
}

function Chevron({ open }) {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      className={`transition-transform ${open ? 'rotate-180' : ''}`}
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

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
  const eliminated = eliminatedTeams(matches)
  // Mobile only: tap the hero to reveal who's out (desktop shows the list inline).
  const [open, setOpen] = useState(false)

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

  const hasOut = eliminated.length > 0

  return (
    <section className="mb-6">
      <div className="alive-pulse overflow-hidden rounded-2xl border border-emerald-600/40 bg-gradient-to-br from-emerald-950/40 to-slate-900/40">
        <div className="flex items-center gap-5 px-5 py-4">
          {/* Counter + label. On mobile this whole block is the tap target that reveals
              the eliminated list; on desktop the list is always shown inline (right). */}
          <button
            type="button"
            onClick={() => hasOut && setOpen((v) => !v)}
            aria-expanded={hasOut ? open : undefined}
            className="flex shrink-0 items-center gap-5 rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 sm:cursor-default sm:focus-visible:ring-0"
          >
            <div className="text-6xl font-black tabular-nums text-emerald-300 sm:text-7xl">
              {display}
            </div>
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
              {hasOut && (
                <div className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-emerald-300/80 sm:hidden">
                  {open ? 'Hide eliminated' : `See who's out (${eliminated.length})`}
                  <Chevron open={open} />
                </div>
              )}
            </div>
          </button>

          {/* Desktop: eliminated teams fill the dead space, most recent out first. */}
          {hasOut && (
            <div className="ml-auto hidden min-w-0 flex-1 self-start sm:block">
              <div className="mb-1.5 text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
                Out of the tournament · latest first
              </div>
              <div className="flex flex-wrap gap-x-3.5 gap-y-1.5">
                {eliminated.map((t, i) => (
                  <span
                    key={t.id}
                    className={`inline-flex items-center gap-1.5 text-sm ${
                      i === 0 ? 'text-rose-300' : 'text-slate-400'
                    }`}
                  >
                    {t.logo && (
                      <img
                        src={t.logo}
                        alt=""
                        className={`h-4 w-4 object-contain ${i === 0 ? '' : 'opacity-60 grayscale'}`}
                      />
                    )}
                    <span className="line-through decoration-slate-500/70 decoration-2">
                      {t.shortName || t.name}
                    </span>
                    {i === 0 && (
                      <span className="rounded bg-rose-500/15 px-1 py-px text-[9px] font-semibold tracking-wide text-rose-300 uppercase no-underline">
                        latest
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mobile expandable panel — same list, revealed on tap. */}
        {hasOut && open && (
          <div className="border-t border-emerald-600/20 px-5 py-3 sm:hidden">
            <div className="mb-2 text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
              Out of the tournament · latest first
            </div>
            <ul className="space-y-2">
              {eliminated.map((t, i) => (
                <li key={t.id} className="flex items-center gap-2 text-sm">
                  {t.logo && (
                    <img
                      src={t.logo}
                      alt=""
                      className={`h-4 w-4 object-contain ${i === 0 ? '' : 'opacity-60 grayscale'}`}
                    />
                  )}
                  <span
                    className={`line-through decoration-slate-500/70 decoration-2 ${
                      i === 0 ? 'text-rose-300' : 'text-slate-400'
                    }`}
                  >
                    {t.shortName || t.name}
                  </span>
                  {i === 0 && (
                    <span className="rounded bg-rose-500/15 px-1 py-px text-[9px] font-semibold tracking-wide text-rose-300 uppercase">
                      latest
                    </span>
                  )}
                  <span className="ml-auto text-[10px] text-slate-500">
                    {ROUND_SHORT[t.round]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
