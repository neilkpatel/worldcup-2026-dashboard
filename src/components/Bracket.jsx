import { useState } from 'react'
import { venueInfo, venueLocation, venueLocalKickoff } from '../venues'
import FifaRank from './FifaRank'

const ROUND_ORDER = [
  'round-of-32',
  'round-of-16',
  'quarterfinals',
  'semifinals',
  'final',
]

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

function TeamRow({ team, state, isWinner }) {
  const dim = state === 'post' && !isWinner
  return (
    <div className={`flex items-center gap-2 ${dim ? 'opacity-40' : ''}`}>
      {team.logo ? (
        <img src={team.logo} alt="" className="h-4 w-4 shrink-0 object-contain" loading="lazy" />
      ) : (
        <span className="h-4 w-4 shrink-0 rounded-full border border-dashed border-slate-700" />
      )}
      <div className="flex min-w-0 flex-1 items-baseline gap-1">
        <span className="truncate" title={team.name}>
          {team.name}
        </span>
        <FifaRank abbrev={team.abbrev} className="shrink-0 text-[9px]" />
      </div>
      {state !== 'pre' && (
        <span className={`tabular-nums ${isWinner ? 'font-bold' : ''}`}>{team.score}</span>
      )}
    </div>
  )
}

// `focus` = this is the live game (or, if none are live, the next one to kick off) —
// it gets an emerald ring so the eye lands on what matters now. `mine` = Neil's ticket.
function BracketMatch({ match, focus = false, mine = false }) {
  const dateLabel = match.date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  const info = venueInfo(match.venue)
  const location = venueLocation(match)
  // Kickoff in the stadium's own timezone — the knockouts run from Pacific
  // (SoFi, Seattle, Vancouver) to Eastern, so "your" time alone is ambiguous.
  const localKick = match.state === 'pre' ? venueLocalKickoff(match.date, match.venue) : null
  return (
    <div
      className={`rounded-lg border bg-slate-900 p-2 text-xs ${
        focus
          ? 'border-emerald-500 ring-1 ring-emerald-500/40 shadow-lg shadow-emerald-900/30'
          : mine
            ? 'border-amber-500/40'
            : 'border-slate-800'
      }`}
    >
      <div className="mb-1 flex items-center justify-between text-[10px] text-slate-500">
        <span>
          {match.number ? <span className="font-semibold text-slate-400">Match {match.number} · </span> : null}
          {dateLabel}
          {mine && <span title="Neil's ticket" className="ml-1">🎟️</span>}
        </span>
        {match.state === 'in' ? (
          <span className="flex items-center gap-1 font-semibold text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            {match.clock}
          </span>
        ) : match.state === 'post' ? (
          <span className="font-semibold text-slate-400">FT</span>
        ) : (
          <span className="flex items-center gap-1.5">
            {focus && (
              <span className="rounded bg-amber-500/20 px-1 py-px text-[9px] font-bold uppercase tracking-wide text-amber-300">
                Next up
              </span>
            )}
            {match.date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <TeamRow team={match.home} state={match.state} isWinner={match.home.winner} />
        <TeamRow team={match.away} state={match.state} isWinner={match.away.winner} />
      </div>

      {(match.venue || match.tv) && (
        <div className="mt-2 space-y-0.5 border-t border-slate-800 pt-1.5 text-[10px] leading-snug text-slate-500">
          {match.venue && (
            <div className="flex items-start gap-1">
              <span aria-hidden>🏟</span>
              <span className="flex-1">
                <span className="text-slate-400">{match.venue}</span>
                {location && <span> · {location}</span>}
                {info && (
                  <span className="block text-slate-600">
                    {info.fifaName} · {info.capacity.toLocaleString()} seats
                  </span>
                )}
              </span>
            </div>
          )}
          {localKick && (
            <div className="flex items-center gap-1">
              <span aria-hidden>🕑</span>
              <span>{localKick} local kickoff</span>
            </div>
          )}
          {match.tv && (
            <div className="flex items-center gap-1">
              <span aria-hidden>📺</span>
              <span>{match.tv}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Bracket({ matches }) {
  // Mobile shows one round at a time; null = follow the live/current round.
  const [mobileRound, setMobileRound] = useState(null)

  // Order each column by official match number (not kickoff time) so the cards run in
  // bracket order — that's what makes the "Winner of Match N" feeder labels easy to trace.
  const byRound = (slug) =>
    matches
      .filter((m) => m.round === slug)
      .sort((a, b) => (a.number ?? 0) - (b.number ?? 0) || a.date - b.date)

  // Spotlight the live game, or — when nothing's live — the next knockout to kick off.
  const liveIds = new Set(matches.filter((m) => m.state === 'in').map((m) => m.id))
  const nextUp = liveIds.size
    ? null
    : matches
        .filter((m) => KO_SLUGS.has(m.round) && m.state === 'pre')
        .sort((a, b) => a.date - b.date)[0]
  const isFocus = (m) => liveIds.has(m.id) || (!!nextUp && m.id === nextUp.id)

  const renderMatch = (m) => (
    <BracketMatch key={m.id} match={m} focus={isFocus(m)} mine={MY_MATCHES.has(m.number)} />
  )

  const thirdPlace = byRound('3rd-place-match')

  // Phone view: rounds that exist + which one to show first (the current/live round).
  const available = MOBILE_ROUNDS.filter((slug) => byRound(slug).length > 0)
  const currentRound =
    available.find((slug) => byRound(slug).some((m) => m.state !== 'post')) ?? available[available.length - 1]
  const selected = mobileRound && available.includes(mobileRound) ? mobileRound : currentRound

  return (
    <div>
      <p className="mb-4 text-xs text-slate-500">
        Single-elimination from the round of 32 (June 28) to the final (July 19). Slots
        show the qualification path until teams lock in, then fill with flags and scores.
        Each game lists its stadium, location, local kickoff time and TV channel. On a
        phone, tap a round below; on a wider screen, scroll sideways to follow the bracket →
      </p>

      {/* ── Mobile: one round at a time, with a round switcher ── */}
      <div className="sm:hidden">
        <div className="mb-3 -mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
              <span className="ml-1 text-[10px] opacity-70">{byRound(slug).length}</span>
            </button>
          ))}
        </div>
        <h3 className="mb-3 text-sm font-semibold text-slate-300">{ROUND_LABEL[selected]}</h3>
        <div className="space-y-3">{byRound(selected).map(renderMatch)}</div>
      </div>

      {/* ── Desktop: full horizontal bracket ── */}
      <div className="hidden sm:block">
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max gap-4">
            {ROUND_ORDER.map((slug) => {
              const round = byRound(slug)
              if (round.length === 0) return null
              return (
                <div key={slug} className="w-64 shrink-0">
                  <h3 className="mb-3 text-sm font-semibold text-slate-300">
                    {ROUND_LABEL[slug]}
                    <span className="ml-1 text-xs font-normal text-slate-600">{round.length}</span>
                  </h3>
                  <div className="space-y-3">{round.map(renderMatch)}</div>
                </div>
              )
            })}
          </div>
        </div>

        {thirdPlace.length > 0 && (
          <div className="mt-6 max-w-64">
            <h3 className="mb-3 text-sm font-semibold text-slate-300">
              {ROUND_LABEL['3rd-place-match']}
            </h3>
            {thirdPlace.map(renderMatch)}
          </div>
        )}
      </div>
    </div>
  )
}
