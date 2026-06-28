import pricesData from '../data/prices.json'

// The two matches I have tickets to, by their fixed FIFA match number. The bracket is
// now drawn, so each is shown by the actual Round-of-32 ties that feed it (real teams),
// rather than the group-finish routes used before the draw locked.
//
//   Match 91 (R16, MetLife)  = Winner(Match 76) vs Winner(Match 78)
//   Match 99 (QF, Hard Rock) = Winner(Match 91 = my R16) vs Winner(Match 92)
const TICKETS = [
  {
    id: 'nyc-r16',
    round: 'Round of 16',
    matchNo: 91,
    venue: 'MetLife Stadium',
    city: 'East Rutherford, NJ',
    date: 'Sun · July 5, 2026',
    feeders: [76, 78],
    note: 'One winner from each Round-of-32 tie below advances here to MetLife.',
  },
  {
    id: 'miami-qf',
    round: 'Quarterfinal',
    matchNo: 99,
    venue: 'Hard Rock Stadium',
    city: 'Miami Gardens, FL',
    date: 'Sat · July 11, 2026',
    feeders: [91, 92],
    note: 'The winner of my MetLife Round-of-16 (Match 91) advances straight into this one.',
  },
]

// Neil's followed teams (as ESPN names them) — bolded if they appear in a feeder tie.
const FOLLOW = new Set(['United States', 'Norway'])

function TeamLine({ team, state, follow }) {
  const mine = follow.has(team.name)
  const won = state === 'post' && team.winner
  const dim = state === 'post' && !team.winner
  return (
    <div className={`flex items-center gap-2 text-sm ${dim ? 'opacity-40' : ''}`}>
      {team.logo ? (
        <img src={team.logo} alt="" className="h-4 w-4 shrink-0 object-contain" loading="lazy" />
      ) : (
        <span className="h-4 w-4 shrink-0 rounded-full border border-dashed border-slate-700" />
      )}
      <span className={`min-w-0 flex-1 truncate ${mine ? 'font-bold text-emerald-300' : 'text-slate-200'}`}>
        {team.name}
      </span>
      {won && <span title="advanced" className="shrink-0 text-emerald-400">✓</span>}
      {state !== 'pre' && <span className="shrink-0 tabular-nums text-slate-400">{team.score}</span>}
    </div>
  )
}

// One feeding tie for a ticket. Real R32 ties show both teams; a feeder that's itself a
// later-round match (e.g. my R16 feeding the QF) shows "Winner of Match N" until it's set.
function FeederMatch({ num, matches, follow }) {
  const m = matches.find((x) => x.number === num)
  const own = TICKETS.find((t) => t.matchNo === num)
  if (!m) {
    return (
      <li className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-400">
        Winner of Match {num}
      </li>
    )
  }
  const real = !!(m.home.abbrev && m.away.abbrev)
  const dateLabel = m.date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  return (
    <li className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2">
      <div className="mb-1 flex items-center justify-between gap-2 text-[11px] text-slate-500">
        <span className="font-semibold text-slate-400">
          Match {num}
          {own && <span className="font-normal text-emerald-400/80"> · my {own.round}</span>}
        </span>
        <span className="truncate text-right">
          {dateLabel}
          {m.venue ? ` · ${m.venue}` : ''}
        </span>
      </div>
      {real ? (
        <div className="space-y-1">
          <TeamLine team={m.home} state={m.state} follow={follow} />
          <TeamLine team={m.away} state={m.state} follow={follow} />
        </div>
      ) : (
        <div className="text-sm text-slate-400">Winner of Match {num} — to be decided</div>
      )}
    </li>
  )
}

const fmtUSD = (n) => (n == null ? '—' : `$${Math.round(n).toLocaleString('en-US')}`)

function relTime(iso) {
  if (!iso) return ''
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

// Get-in price over time, drawn from the history points the refresh job appends
// every ~6h. Renders a "building" note until there are at least 2 data points.
function PriceChart({ history }) {
  if (!history?.length) return null
  const pts = history.filter((p) => p.low != null)
  if (pts.length < 2) {
    return (
      <div className="border-b border-slate-800 bg-slate-900/40 px-4 py-3 text-xs text-slate-600">
        📈 Price history builds as the tracker refreshes (every ~6h).
      </div>
    )
  }
  const W = 640
  const H = 140
  const padL = 48
  const padR = 14
  const padT = 14
  const padB = 24
  const lows = pts.map((p) => p.low)
  const min = Math.min(...lows)
  const max = Math.max(...lows)
  const span = max - min || 1
  const t0 = new Date(pts[0].t).getTime()
  const tSpan = new Date(pts[pts.length - 1].t).getTime() - t0 || 1
  const px = (p) => padL + ((new Date(p.t).getTime() - t0) / tSpan) * (W - padL - padR)
  const py = (v) => padT + (1 - (v - min) / span) * (H - padT - padB)
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${px(p).toFixed(1)},${py(p.low).toFixed(1)}`).join(' ')
  const area = `${line} L${px(pts[pts.length - 1]).toFixed(1)},${H - padB} L${px(pts[0]).toFixed(1)},${H - padB} Z`
  const last = pts[pts.length - 1]
  const fmtDate = (t) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const up = last.low >= pts[0].low
  const stroke = up ? '#34d399' : '#fb7185'
  return (
    <div className="border-b border-slate-800 bg-slate-900/40 px-4 py-3">
      <div className="mb-1 text-xs font-medium tracking-wide text-slate-500 uppercase">Get-in price history</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Get-in price over time">
        {[max, (max + min) / 2, min].map((v, i) => (
          <g key={i}>
            <line x1={padL} y1={py(v)} x2={W - padR} y2={py(v)} stroke="#1e293b" strokeWidth="1" />
            <text x={padL - 6} y={py(v) + 4} textAnchor="end" fontSize="11" fill="#64748b">
              {fmtUSD(v)}
            </text>
          </g>
        ))}
        <text x={padL} y={H - 7} textAnchor="start" fontSize="11" fill="#64748b">
          {fmtDate(pts[0].t)}
        </text>
        <text x={W - padR} y={H - 7} textAnchor="end" fontSize="11" fill="#64748b">
          {fmtDate(last.t)}
        </text>
        <path d={area} fill={stroke} fillOpacity="0.12" />
        <path d={line} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={px(last)} cy={py(last.low)} r="3.5" fill={stroke} />
      </svg>
    </div>
  )
}

// Live secondary-market price strip for a ticket. Hidden until `npm run prices`
// has populated src/data/prices.json (so the public site never shows an empty rail).
function PriceBand({ price }) {
  if (!price || price.low == null) return null
  const hist = price.history ?? []
  const prevLow = hist.length > 1 ? hist[hist.length - 2].low : null
  const delta = prevLow != null ? price.low - prevLow : null
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-slate-800 bg-slate-900/70 px-4 py-2.5 text-sm">
      <span className="font-semibold text-slate-200">
        Live get-in <span className="text-emerald-300">{fmtUSD(price.low)}</span>
      </span>
      {delta != null && delta !== 0 && (
        <span className={`text-xs ${delta > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
          {delta > 0 ? '▲' : '▼'} {fmtUSD(Math.abs(delta))} since last check
        </span>
      )}
      {price.high != null && <span className="text-slate-500">up to {fmtUSD(price.high)}</span>}
      <span className="ml-auto text-xs text-slate-600">
        {price.checkedAt && `checked ${relTime(price.checkedAt)}`}
        {price.url && (
          <>
            {price.checkedAt ? ' · ' : ''}
            <a href={price.url} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">
              {price.source ?? 'TickPick'} ↗
            </a>
          </>
        )}
        {price.seatgeekUrl && (
          <>
            {' · '}
            <a href={price.seatgeekUrl} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">
              SeatGeek ↗
            </a>
          </>
        )}
      </span>
    </div>
  )
}

function TicketCard({ ticket, matches, price }) {
  return (
    <section className="mb-8 overflow-hidden rounded-xl border border-emerald-600/30 bg-slate-900/40">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-800 bg-emerald-600/10 px-4 py-3">
        <h2 className="font-semibold text-emerald-300">
          🎟️ {ticket.round}
          <span className="ml-2 text-xs font-normal text-slate-500">Match {ticket.matchNo}</span>
        </h2>
        <div className="text-sm text-slate-400">
          {ticket.venue} · {ticket.city} &nbsp;·&nbsp; {ticket.date}
        </div>
      </div>

      <PriceBand price={price} />
      <PriceChart history={price?.history} />

      <div className="px-4 py-4">
        <div className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Who can reach this game
        </div>
        <ul className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2">
          {ticket.feeders.map((num) => (
            <FeederMatch key={num} num={num} matches={matches} follow={FOLLOW} />
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-500">{ticket.note}</p>
      </div>
    </section>
  )
}

export default function MyTickets({ matches = [] }) {
  return (
    <div>
      <p className="mb-6 text-sm text-slate-400">
        The bracket is set. Each of my matches is shown by the ties that feed it — one
        winner from each side advances to play. Followed teams (USA, Norway) are
        highlighted if they're in the path.
      </p>

      {TICKETS.map((ticket) => (
        <TicketCard
          key={ticket.id}
          ticket={ticket}
          matches={matches}
          price={pricesData.tickets?.[ticket.id]}
        />
      ))}

      <p className="rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3 text-xs text-slate-500">
        🎟️ Match 91 at MetLife (Round of 16) and Match 99 at Hard Rock (Quarterfinal) —
        a win in my Round-of-16 feeds straight into the Miami quarterfinal.
      </p>
    </div>
  )
}
