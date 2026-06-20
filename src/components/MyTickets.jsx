// The two matches I have tickets to, defined by their fixed bracket slots.
// The 2026 bracket is pre-drawn, so each match can only be reached by certain
// group finishers. Standings are low-signal this early, so rather than naming
// today's provisional winner/runner-up we list EVERY team in each feeding
// group, labelled by the route it would need to take.
//
//   Match 91 (R16, MetLife)  = Winner(M76: 1C v 2F) vs Winner(M78: 2E v 2I)
//   Match 99 (QF, Hard Rock) = Winner(M91) vs Winner(M92: M79[1A v 3rd] v M80[1L v 3rd])

const TICKETS = [
  {
    id: 'nyc-r16',
    round: 'Round of 16',
    matchNo: 91,
    venue: 'MetLife Stadium',
    city: 'East Rutherford, NJ',
    date: 'Sun · July 5, 2026',
    note: 'One team from each column advances here by winning its Round-of-32 tie.',
    sides: [
      {
        label: 'From Match 76',
        routes: [
          { label: 'Group winner', groups: ['C'] },
          { label: 'Runner-up', groups: ['F'] },
        ],
      },
      {
        label: 'From Match 78',
        routes: [
          { label: 'Runner-up', groups: ['E'] },
          { label: 'Runner-up', groups: ['I'] },
        ],
      },
    ],
  },
  {
    id: 'miami-qf',
    round: 'Quarterfinal',
    matchNo: 99,
    venue: 'Hard Rock Stadium',
    city: 'Miami Gardens, FL',
    date: 'Sat · July 11, 2026',
    note: 'The winner of my NYC Round-of-16 match can advance straight into this one.',
    sides: [
      {
        label: 'My NYC R16 winner',
        routes: [
          { label: 'Group winner', groups: ['C'] },
          { label: 'Runner-up', groups: ['F'] },
          { label: 'Runner-up', groups: ['E'] },
          { label: 'Runner-up', groups: ['I'] },
        ],
      },
      {
        label: 'Mexico City R16 winner',
        routes: [
          { label: 'Group winner', groups: ['A'] },
          { label: 'Group winner', groups: ['L'] },
          { label: 'Best 3rd', groups: ['C', 'E', 'F', 'H', 'I'] },
          { label: 'Best 3rd', groups: ['E', 'H', 'I', 'J', 'K'] },
        ],
      },
    ],
  },
]

// Marquee Round-of-16 scenarios for my NYC match (Match 91, MetLife). One side is
// fed by 1C or 2F, the other by 2E or 2I — each leg names a team and the slot the
// bracket needs it to finish in to land at MetLife.
const NYC_DREAMS = [
  {
    name: 'Brazil vs France',
    blurb: 'Two favorites colliding in the last 16 — a final that arrived early.',
    legs: [
      { team: 'Brazil', letter: 'C', pos: 1, route: 'win Group C' },
      { team: 'France', letter: 'I', pos: 2, route: 'runner-up in Group I' },
    ],
  },
  {
    name: 'Japan vs France',
    blurb: "Japan's pressing machine against Les Bleus — a tactical feast.",
    legs: [
      { team: 'Japan', letter: 'F', pos: 2, route: 'runner-up in Group F' },
      { team: 'France', letter: 'I', pos: 2, route: 'runner-up in Group I' },
    ],
  },
  {
    name: 'Brazil vs Germany',
    blurb: 'Seleção against the four-time champions under the MetLife lights.',
    legs: [
      { team: 'Brazil', letter: 'C', pos: 1, route: 'win Group C' },
      { team: 'Germany', letter: 'E', pos: 2, route: 'runner-up in Group E' },
    ],
  },
]

// Marquee quarterfinal scenarios worth watching at Hard Rock. Each leg names the
// team and the finishing slot the bracket requires for it to reach Match 99.
const MIAMI_DREAMS = [
  {
    name: 'Brazil vs Argentina',
    blurb: 'Superclásico in a quarterfinal — Miami goes nuclear.',
    legs: [
      { team: 'Brazil', letter: 'C', pos: 1, route: 'win Group C' },
      { team: 'Argentina', letter: 'J', pos: 3, route: '3rd in Group J (best-third)' },
    ],
  },
  {
    name: 'Brazil vs Mexico',
    blurb: 'Brazil against a de facto home crowd — the realistic blockbuster.',
    legs: [
      { team: 'Brazil', letter: 'C', pos: 1, route: 'win Group C' },
      { team: 'Mexico', letter: 'A', pos: 1, route: 'win Group A' },
    ],
  },
  {
    name: 'Brazil vs England',
    blurb: 'Top combined pedigree, both via realistic group-winner routes.',
    legs: [
      { team: 'Brazil', letter: 'C', pos: 1, route: 'win Group C' },
      { team: 'England', letter: 'L', pos: 1, route: 'win Group L' },
    ],
  },
]

function ordinal(n) {
  return n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`
}

function groupTeams(groups, letter) {
  const g = groups.find((x) => x.name === `Group ${letter}`)
  return g ? g.teams : []
}

// Is `leg.team` currently in the slot it needs? Returns null if standings aren't
// loaded or the team isn't found (group stage not started, name mismatch, etc.).
function legStatus(groups, leg) {
  const team = groupTeams(groups, leg.letter).find((t) => t.name === leg.team)
  if (!team) return null
  const rank = team.rank || 0
  return { rank, onTrack: rank === leg.pos, played: team.played }
}

function DreamMatchups({ groups, title, dreams }) {
  return (
    <section className="mb-8">
      <h2 className="mb-1 text-sm font-semibold tracking-wide text-amber-300/90 uppercase">
        🔮 {title}
      </h2>
      <p className="mb-3 text-xs text-slate-500">
        Live read on whether a blockbuster is firming up — each leg checks if the
        team currently sits in the slot the bracket needs.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {dreams.map((dream) => {
          const legs = dream.legs.map((leg) => ({ leg, st: legStatus(groups, leg) }))
          const bothOn = legs.every(({ st }) => st && st.onTrack)
          return (
            <div
              key={dream.name}
              className={`rounded-xl border p-3 ${
                bothOn
                  ? 'border-emerald-500/50 bg-emerald-500/10'
                  : 'border-slate-800 bg-slate-900/40'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-200">{dream.name}</span>
                {bothOn && <span title="both legs on track">🔥</span>}
              </div>
              <p className="mt-0.5 mb-2 text-xs text-slate-500">{dream.blurb}</p>
              <ul className="space-y-1">
                {legs.map(({ leg, st }) => (
                  <li key={leg.team} className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="text-slate-300">
                      {leg.team}
                      <span className="text-xs text-slate-500"> — {leg.route}</span>
                    </span>
                    <span
                      className={`shrink-0 text-xs ${
                        st?.onTrack ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {!st
                        ? '—'
                        : st.onTrack
                          ? '✓ on track'
                          : `now ${ordinal(st.rank)}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function TeamChip({ team }) {
  return (
    <span className="inline-flex items-center gap-1 text-slate-300">
      {team.logo && <img src={team.logo} alt="" className="h-3.5 w-3.5" />}
      {team.name}
    </span>
  )
}

function Route({ groups, route }) {
  const isPool = route.groups.length > 1
  const scope = isPool
    ? `Groups ${route.groups.join('/')}`
    : `Group ${route.groups[0]}`

  return (
    <li className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2">
      <div className="text-xs font-medium tracking-wide text-slate-500 uppercase">
        {route.label} · {scope}
      </div>
      <div className="mt-1.5 space-y-1">
        {route.groups.map((L) => (
          <div key={L} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {isPool && (
              <span className="w-4 shrink-0 text-xs font-semibold text-slate-600">
                {L}
              </span>
            )}
            {groupTeams(groups, L).map((t) => (
              <TeamChip key={t.id} team={t} />
            ))}
          </div>
        ))}
      </div>
    </li>
  )
}

function TicketCard({ ticket, groups }) {
  return (
    <section className="mb-8 overflow-hidden rounded-xl border border-emerald-600/30 bg-slate-900/40">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-800 bg-emerald-600/10 px-4 py-3">
        <h2 className="font-semibold text-emerald-300">
          🎟️ {ticket.round}
          <span className="ml-2 text-xs font-normal text-slate-500">
            Match {ticket.matchNo}
          </span>
        </h2>
        <div className="text-sm text-slate-400">
          {ticket.venue} · {ticket.city} &nbsp;·&nbsp; {ticket.date}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-2">
        {ticket.sides.map((side, i) => (
          <div key={side.label}>
            <div className="mb-2 text-sm font-semibold text-slate-300">
              {side.label}
              {i === 0 && <span className="text-slate-600"> &nbsp;— vs —</span>}
            </div>
            <ul className="space-y-2">
              {side.routes.map((route) => (
                <Route key={`${route.label}-${route.groups.join('')}`} groups={groups} route={route} />
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="border-t border-slate-800 px-4 py-2 text-xs text-slate-500">
        {ticket.note}
      </p>
    </section>
  )
}

export default function MyTickets({ groups }) {
  return (
    <div>
      <p className="mb-6 text-sm text-slate-400">
        The bracket is pre-drawn, so only specific group finishers can reach these
        matches. Standings are low-signal this early, so every team in each feeding
        group is listed — labelled by the route it would need (win its group,
        finish runner-up, or sneak through as a best-third). One team from each
        side will play.
      </p>

      {TICKETS.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} groups={groups} />
      ))}

      <DreamMatchups groups={groups} title="Dream R16 matchups · NYC" dreams={NYC_DREAMS} />
      <DreamMatchups groups={groups} title="Dream QF matchups · Miami" dreams={MIAMI_DREAMS} />

      <p className="rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3 text-xs text-slate-500">
        ⚠️ The <span className="text-slate-400">slots</span> are fixed; which teams
        fill them won't be decided until the group stage ends June 27. Best-third
        routes only apply to a group's 3rd-placed team if it finishes among the 8
        qualifying third-place sides.
      </p>
    </div>
  )
}
