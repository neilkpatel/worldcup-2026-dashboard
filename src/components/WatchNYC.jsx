import { NYC_BARS } from '../data/nycBars'

const barMapUrl = (b) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${b.name} ${b.area}`)}`
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
const dateLabel = (d) => d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
const timeLabel = (d) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

function BarCard({ bar }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <span className="font-semibold text-slate-100">{bar.name}</span>
        <a
          href={barMapUrl(bar)}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-[11px] font-medium text-sky-300/90 hover:text-sky-200 hover:underline"
        >
          {bar.area} ↗
        </a>
      </div>
      <div className="mt-0.5 text-[11px] font-medium text-emerald-400/80">{bar.vibe}</div>
      <div className="mt-1 text-xs leading-snug text-slate-400">{bar.why}</div>
    </div>
  )
}

export default function WatchNYC({ matches }) {
  const now = new Date()
  const real = (m) => m.home.abbrev && m.away.abbrev
  const todayK = dayKey(now)

  let games = matches.filter((m) => dayKey(m.date) === todayK && real(m))
  let heading = `Today · ${dateLabel(now)}`
  if (games.length === 0) {
    const next = matches.find((m) => m.date > now && real(m))
    if (next) {
      const k = dayKey(next.date)
      games = matches.filter((m) => dayKey(m.date) === k && real(m))
      heading = `Next up · ${dateLabel(next.date)}`
    }
  }
  games = [...games].sort((a, b) => a.date - b.date)

  const spotsFor = (m) => {
    const out = []
    for (const side of [m.home, m.away]) {
      const list = NYC_BARS.byCountry[side.name]
      if (list?.length) out.push({ country: side.name, bars: list })
    }
    return out
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-400">
          🍺 Where to watch in NYC
        </h2>
        <p className="mb-4 max-w-2xl text-xs text-slate-500">
          Hand-researched watch-party spots for each match — supporters'-club home bars and real
          fan-scene venues, Manhattan-first but expanding to the boroughs where a team's crowd
          actually gathers. Tap an address for directions.
        </p>

        <div className="mb-2 text-xs font-semibold text-slate-300">{heading}</div>
        {games.length === 0 ? (
          <p className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-6 text-center text-sm text-slate-500">
            No games scheduled right now — see the always-good-bet pubs below.
          </p>
        ) : (
          <div className="space-y-4">
            {games.map((m) => {
              const spots = spotsFor(m)
              return (
                <div key={m.id} className="rounded-xl border border-slate-800 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-100">
                    {m.home.logo && <img src={m.home.logo} alt="" className="h-5 w-5 object-contain" />}
                    {m.home.name} <span className="text-slate-500">v</span> {m.away.name}
                    {m.away.logo && <img src={m.away.logo} alt="" className="h-5 w-5 object-contain" />}
                    <span className="ml-auto text-xs font-normal text-slate-500">{timeLabel(m.date)}</span>
                  </div>
                  {spots.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {spots.map((s) => (
                        <div key={s.country}>
                          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400/80">
                            {s.country} fans
                          </div>
                          <div className="space-y-2">
                            {s.bars.map((b) => (
                              <BarCard key={b.name} bar={b} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      No country-specific bar for these teams — any soccer pub below works great.
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-400">
          ⚽ Always a good bet — NYC soccer pubs
        </h2>
        <p className="mb-3 text-xs text-slate-500">These show every match, whoever's playing.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {NYC_BARS.generalSoccerPubs.map((b) => (
            <BarCard key={b.name} bar={b} />
          ))}
        </div>
      </section>
    </div>
  )
}
