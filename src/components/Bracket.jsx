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

function TeamRow({ team, state, isWinner }) {
  const dim = state === 'post' && !isWinner
  return (
    <div className={`flex items-center gap-2 ${dim ? 'opacity-40' : ''}`}>
      {team.logo ? (
        <img src={team.logo} alt="" className="h-4 w-4 shrink-0 object-contain" loading="lazy" />
      ) : (
        <span className="h-4 w-4 shrink-0 rounded-full border border-dashed border-slate-700" />
      )}
      <span className="flex-1 truncate" title={team.name}>
        {team.name}
      </span>
      <FifaRank abbrev={team.abbrev} className="shrink-0 text-[9px]" />
      {state !== 'pre' && (
        <span className={`tabular-nums ${isWinner ? 'font-bold' : ''}`}>{team.score}</span>
      )}
    </div>
  )
}

function BracketMatch({ match }) {
  const dateLabel = match.date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  const info = venueInfo(match.venue)
  const location = venueLocation(match)
  // Kickoff in the stadium's own timezone — the knockouts run from Pacific
  // (SoFi, Seattle, Vancouver) to Eastern, so "your" time alone is ambiguous.
  const localKick = match.state === 'pre' ? venueLocalKickoff(match.date, match.venue) : null
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-xs">
      <div className="mb-1 flex items-center justify-between text-[10px] text-slate-500">
        <span>{dateLabel}</span>
        {match.state === 'in' ? (
          <span className="flex items-center gap-1 font-semibold text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            {match.clock}
          </span>
        ) : match.state === 'post' ? (
          <span className="font-semibold text-slate-400">FT</span>
        ) : (
          <span>
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
  const byRound = (slug) =>
    matches.filter((m) => m.round === slug).sort((a, b) => a.date - b.date)

  const thirdPlace = byRound('3rd-place-match')

  return (
    <div>
      <p className="mb-4 text-xs text-slate-500">
        Single-elimination from the round of 32 (June 28) to the final (July 19).
        Slots show the qualification path until teams lock in, then fill with flags
        and scores. Each game lists its stadium, location, local kickoff time and TV
        channel. Scroll sideways to follow the bracket →
      </p>

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-4">
          {ROUND_ORDER.map((slug) => {
            const round = byRound(slug)
            if (round.length === 0) return null
            return (
              <div key={slug} className="w-64 shrink-0">
                <h3 className="mb-3 text-sm font-semibold text-slate-300">
                  {ROUND_LABEL[slug]}
                  <span className="ml-1 text-xs font-normal text-slate-600">
                    {round.length}
                  </span>
                </h3>
                <div className="space-y-3">
                  {round.map((m) => (
                    <BracketMatch key={m.id} match={m} />
                  ))}
                </div>
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
          {thirdPlace.map((m) => (
            <BracketMatch key={m.id} match={m} />
          ))}
        </div>
      )}
    </div>
  )
}
