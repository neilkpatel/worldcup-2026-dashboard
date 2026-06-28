import { useLayoutEffect, useRef, useState } from 'react'
import { venueInfo, venueLocation, venueLocalKickoff } from '../venues'
import FifaRank from './FifaRank'

const ROUND_ORDER = ['round-of-32', 'round-of-16', 'quarterfinals', 'semifinals', 'final']

const ROUND_LABEL = {
  'round-of-32': 'Round of 32',
  'round-of-16': 'Round of 16',
  quarterfinals: 'Quarterfinals',
  semifinals: 'Semifinals',
  final: 'Final',
  '3rd-place-match': '3rd-place match',
}

// Short labels for the mobile round switcher.
const ROUND_SHORT = {
  'round-of-32': 'R32',
  'round-of-16': 'R16',
  quarterfinals: 'QF',
  semifinals: 'SF',
  '3rd-place-match': '3rd',
  final: 'Final',
}

// Chronological order for the phone view (3rd-place match comes just before the final).
const MOBILE_ROUNDS = [
  'round-of-32',
  'round-of-16',
  'quarterfinals',
  'semifinals',
  '3rd-place-match',
  'final',
]

const KO_SLUGS = new Set(Object.keys(ROUND_LABEL))

// Neil's two tickets, by official match number (MetLife R16, Hard Rock QF) — flagged
// in the tree with a 🎟️ so they stand out. Mirrors src/components/MyTickets.jsx.
const MY_MATCHES = new Set([91, 99])

// Official bracket structure: each knockout match → the two matches that feed it.
// Drives the desktop connector lines. (3rd-place match 103 is a consolation off the
// semis and isn't drawn into the main tree.)
const FEEDERS = {
  89: [74, 77], 90: [73, 75], 91: [76, 78], 92: [79, 80],
  93: [83, 84], 94: [81, 82], 95: [86, 88], 96: [85, 87],
  97: [89, 90], 98: [93, 94], 99: [91, 92], 100: [95, 96],
  101: [97, 98], 102: [99, 100],
  104: [101, 102],
}

// FIFA numbers knockouts by schedule slot, NOT bracket position, so numeric order
// would make feeders non-adjacent and the connector lines cross. This is the order
// to stack each column (top→bottom) so every feeding pair sits next to each other and
// each parent lands centered between its two children. Derived from FEEDERS.
const TREE_ORDER = {
  'round-of-32': [74, 77, 73, 75, 83, 84, 81, 82, 76, 78, 79, 80, 86, 88, 85, 87],
  'round-of-16': [89, 90, 93, 94, 91, 92, 95, 96],
  quarterfinals: [97, 98, 99, 100],
  semifinals: [101, 102],
  final: [104],
}

function cardBorder(focus, mine, isFinal) {
  if (focus) return 'border-emerald-500 ring-1 ring-emerald-500/40 shadow-lg shadow-emerald-900/30'
  if (isFinal) return 'border-amber-400/60 ring-1 ring-amber-400/20'
  if (mine) return 'border-amber-500/40'
  return 'border-slate-800'
}

function TeamRow({ team, state, isWinner }) {
  const dim = state === 'post' && !isWinner
  return (
    <div className={`flex items-center gap-1.5 ${dim ? 'opacity-40' : ''}`}>
      {team.logo ? (
        <img src={team.logo} alt="" className="h-4 w-4 shrink-0 object-contain" loading="lazy" />
      ) : (
        <span className="h-4 w-4 shrink-0 rounded-full border border-dashed border-slate-700" />
      )}
      <span className="min-w-0 flex-1 truncate" title={team.name}>
        {team.name}
      </span>
      <FifaRank abbrev={team.abbrev} className="shrink-0 text-[9px]" />
      {state !== 'pre' && (
        <span className={`shrink-0 tabular-nums ${isWinner ? 'font-bold' : ''}`}>{team.score}</span>
      )}
    </div>
  )
}

function StatusBit({ match, focus }) {
  if (match.state === 'in') {
    return (
      <span className="flex items-center gap-1 font-semibold text-emerald-400">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
        {match.clock}
      </span>
    )
  }
  if (match.state === 'post') return <span className="font-semibold text-slate-400">FT</span>
  return (
    <span className="flex items-center gap-1.5">
      {focus && (
        <span className="rounded bg-amber-500/20 px-1 py-px text-[9px] font-bold uppercase tracking-wide text-amber-300">
          Next up
        </span>
      )}
      {match.date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
    </span>
  )
}

// Shared compact face: header (Match # · date · 🎟️ · status) + the two team/slot rows.
function CardFace({ match, focus, mine, isFinal }) {
  const dateLabel = match.date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  return (
    <>
      <div className="mb-1 flex items-center justify-between text-[10px] text-slate-500">
        <span className="truncate">
          {match.number ? (
            <span className="font-semibold text-slate-400">
              {isFinal ? '🏆 Final' : `Match ${match.number}`} ·{' '}
            </span>
          ) : null}
          {dateLabel}
          {mine && <span title="Neil's ticket" className="ml-1">🎟️</span>}
        </span>
        <span className="shrink-0 pl-1">
          <StatusBit match={match} focus={focus} />
        </span>
      </div>
      <div className="space-y-1 text-xs">
        <TeamRow team={match.home} state={match.state} isWinner={match.home.winner} />
        <TeamRow team={match.away} state={match.state} isWinner={match.away.winner} />
      </div>
    </>
  )
}

// Desktop tree card: uniform height (so the bracket aligns), location one-liner, with
// full stadium/TV/capacity detail in a native hover tooltip. `my-2` gives the columns
// breathing room while keeping every item the same height for clean centering.
function TreeCard({ match, focus, mine, isFinal, cardRef }) {
  const city = venueLocation(match)
  const info = venueInfo(match.venue)
  const localKick = match.state === 'pre' ? venueLocalKickoff(match.date, match.venue) : null
  const tip = [match.venue, info && `${info.capacity.toLocaleString()} seats`, localKick && `${localKick} local`, match.tv]
    .filter(Boolean)
    .join(' · ')
  return (
    <div
      ref={cardRef}
      title={tip || undefined}
      className={`relative z-10 my-2 rounded-lg border bg-slate-900 p-2 text-xs ${cardBorder(focus, mine, isFinal)}`}
    >
      <CardFace match={match} focus={focus} mine={mine} isFinal={isFinal} />
      {city && (
        <div className="mt-1.5 truncate border-t border-slate-800 pt-1 text-[10px] text-slate-500">📍 {city}</div>
      )}
    </div>
  )
}

// Mobile list card: same compact face, with stadium/TV/capacity behind a tap.
function ListCard({ match, focus, mine, isFinal }) {
  const [open, setOpen] = useState(false)
  const city = venueLocation(match)
  const info = venueInfo(match.venue)
  const localKick = match.state === 'pre' ? venueLocalKickoff(match.date, match.venue) : null
  const hasDetails = match.venue || match.tv
  return (
    <div className={`rounded-lg border bg-slate-900 p-2.5 text-xs ${cardBorder(focus, mine, isFinal)}`}>
      <CardFace match={match} focus={focus} mine={mine} isFinal={isFinal} />
      {hasDetails && (
        <>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="mt-1.5 flex w-full items-center gap-1 border-t border-slate-800 pt-1.5 text-left text-[10px] text-slate-500"
          >
            <span aria-hidden>🏟</span>
            <span className="min-w-0 flex-1 truncate">
              {match.venue}
              {city && ` · ${city}`}
            </span>
            <span className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
          </button>
          {open && (
            <div className="mt-1 space-y-0.5 text-[10px] leading-snug text-slate-500">
              {info && <div>{info.fifaName} · {info.capacity.toLocaleString()} seats</div>}
              {localKick && <div>🕑 {localKick} local kickoff</div>}
              {match.tv && <div>📺 {match.tv}</div>}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Measure each card's box and draw an orthogonal connector (child right → midpoint →
// parent left) for every feeder pair. Recomputed on resize / data change so the lines
// always track the cards — no dependence on exact CSS spacing.
function useConnectorPaths(containerRef, cardRefs, matches) {
  const [paths, setPaths] = useState([])
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const compute = () => {
      const cr = container.getBoundingClientRect()
      const out = []
      for (const [parent, feeders] of Object.entries(FEEDERS)) {
        const pEl = cardRefs.current[parent]
        if (!pEl) continue
        const p = pEl.getBoundingClientRect()
        const px = p.left - cr.left
        const py = p.top - cr.top + p.height / 2
        for (const f of feeders) {
          const cEl = cardRefs.current[f]
          if (!cEl) continue
          const c = cEl.getBoundingClientRect()
          const cx = c.right - cr.left
          const cy = c.top - cr.top + c.height / 2
          const midX = (cx + px) / 2
          out.push(`M${cx.toFixed(1)},${cy.toFixed(1)} H${midX.toFixed(1)} V${py.toFixed(1)} H${px.toFixed(1)}`)
        }
      }
      setPaths(out)
    }
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(container)
    window.addEventListener('resize', compute)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', compute)
    }
  }, [matches, containerRef, cardRefs])
  return paths
}

export default function Bracket({ matches }) {
  // Mobile shows one round at a time; null = follow the live/current round.
  const [mobileRound, setMobileRound] = useState(null)
  const containerRef = useRef(null)
  const cardRefs = useRef({})
  const paths = useConnectorPaths(containerRef, cardRefs, matches)

  const inRound = (slug) => matches.filter((m) => m.round === slug)
  // Mobile lists read best in plain match-number order.
  const byNumber = (slug) =>
    inRound(slug).sort((a, b) => (a.number ?? 0) - (b.number ?? 0) || a.date - b.date)
  // Desktop columns stack in bracket order so feeders are adjacent + lines stay clean.
  const byTree = (slug) => {
    const order = TREE_ORDER[slug] ?? []
    return inRound(slug).sort((a, b) => order.indexOf(a.number) - order.indexOf(b.number))
  }

  // Spotlight the live game, or — when nothing's live — the next knockout to kick off.
  const liveIds = new Set(matches.filter((m) => m.state === 'in').map((m) => m.id))
  const nextUp = liveIds.size
    ? null
    : matches
        .filter((m) => KO_SLUGS.has(m.round) && m.state === 'pre')
        .sort((a, b) => a.date - b.date)[0]
  const isFocus = (m) => liveIds.has(m.id) || (!!nextUp && m.id === nextUp.id)

  // Champion, once the final is decided.
  const finalMatch = matches.find((m) => m.round === 'final')
  const champion = finalMatch?.completed
    ? finalMatch.home.winner
      ? finalMatch.home
      : finalMatch.away.winner
        ? finalMatch.away
        : null
    : null

  const thirdPlace = byNumber('3rd-place-match')

  // Phone view: rounds that exist + which one to show first (the current/live round).
  const available = MOBILE_ROUNDS.filter((slug) => inRound(slug).length > 0)
  const currentRound =
    available.find((slug) => inRound(slug).some((m) => m.state !== 'post')) ??
    available[available.length - 1]
  const selected = mobileRound && available.includes(mobileRound) ? mobileRound : currentRound
  const selIdx = available.indexOf(selected)
  const dateRange = (slug) => {
    const ds = inRound(slug)
      .map((m) => m.date)
      .sort((a, b) => a - b)
    if (!ds.length) return ''
    const fmt = (d) => d.toLocaleDateString([], { month: 'short', day: 'numeric' })
    const a = fmt(ds[0])
    const b = fmt(ds[ds.length - 1])
    return a === b ? a : `${a} – ${b}`
  }

  return (
    <div>
      {champion && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-amber-400/50 bg-gradient-to-r from-amber-500/20 to-amber-600/5 px-4 py-3">
          <span className="text-3xl" aria-hidden>🏆</span>
          {champion.logo && <img src={champion.logo} alt="" className="h-9 w-9 object-contain" />}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-300/80">
              World Champions
            </div>
            <div className="text-lg font-bold text-amber-100">{champion.name}</div>
          </div>
        </div>
      )}

      <p className="mb-4 text-xs text-slate-500">
        Single-elimination from the round of 32 (June 28) to the final (July 19). Slots show
        the qualification path until teams lock in, then fill with flags and scores. On a phone,
        tap a round below and tap any card for stadium + TV; on a wider screen, follow the lines
        across the tree (hover a card for details).
      </p>

      {/* ── Mobile: one round at a time, with a switcher + prev/next ── */}
      <div className="sm:hidden">
        <div className="-mx-1 mb-3 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {available.map((slug) => (
            <button
              key={slug}
              onClick={() => setMobileRound(slug)}
              className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                selected === slug
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {ROUND_SHORT[slug]}
              <span className="ml-1 text-[10px] opacity-70">{inRound(slug).length}</span>
            </button>
          ))}
        </div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <button
            onClick={() => setMobileRound(available[selIdx - 1])}
            disabled={selIdx <= 0}
            className="rounded-md px-2 py-1 text-sm text-slate-400 disabled:opacity-25"
            aria-label="Previous round"
          >
            ‹
          </button>
          <div className="text-center">
            <h3 className="text-sm font-semibold text-slate-300">{ROUND_LABEL[selected]}</h3>
            <div className="text-[10px] text-slate-500">{dateRange(selected)}</div>
          </div>
          <button
            onClick={() => setMobileRound(available[selIdx + 1])}
            disabled={selIdx >= available.length - 1}
            className="rounded-md px-2 py-1 text-sm text-slate-400 disabled:opacity-25"
            aria-label="Next round"
          >
            ›
          </button>
        </div>
        <div className="space-y-2.5">
          {byNumber(selected).map((m) => (
            <ListCard
              key={m.id}
              match={m}
              focus={isFocus(m)}
              mine={MY_MATCHES.has(m.number)}
              isFinal={m.round === 'final'}
            />
          ))}
        </div>
      </div>

      {/* ── Desktop: full bracket tree with connector lines ── */}
      <div className="hidden sm:block">
        <div className="overflow-x-auto pb-2">
          <div className="inline-block min-w-max">
            {/* Round headers, aligned above their columns */}
            <div className="flex gap-12">
              {ROUND_ORDER.map((slug) => {
                const n = inRound(slug).length
                if (n === 0) return null
                return (
                  <h3 key={slug} className="w-56 shrink-0 text-sm font-semibold text-slate-300">
                    {ROUND_LABEL[slug]}
                    <span className="ml-1 text-xs font-normal text-slate-600">{n}</span>
                  </h3>
                )
              })}
            </div>

            {/* Columns + the SVG connector overlay behind the cards */}
            <div ref={containerRef} className="relative mt-2">
              <svg className="pointer-events-none absolute inset-0 h-full w-full" fill="none" aria-hidden>
                {paths.map((d, i) => (
                  <path key={i} d={d} stroke="#475569" strokeWidth="1.5" />
                ))}
              </svg>
              <div className="flex gap-12">
                {ROUND_ORDER.map((slug) => {
                  const round = byTree(slug)
                  if (round.length === 0) return null
                  return (
                    <div key={slug} className="flex w-56 shrink-0 flex-col justify-around">
                      {round.map((m) => (
                        <TreeCard
                          key={m.id}
                          match={m}
                          focus={isFocus(m)}
                          mine={MY_MATCHES.has(m.number)}
                          isFinal={m.round === 'final'}
                          cardRef={(el) => {
                            cardRefs.current[m.number] = el
                          }}
                        />
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {thirdPlace.length > 0 && (
          <div className="mt-6 max-w-64">
            <h3 className="mb-3 text-sm font-semibold text-slate-300">
              {ROUND_LABEL['3rd-place-match']}
            </h3>
            {thirdPlace.map((m) => (
              <TreeCard key={m.id} match={m} focus={isFocus(m)} mine={false} isFinal={false} cardRef={() => {}} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
