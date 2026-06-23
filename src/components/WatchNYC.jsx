import { useState } from 'react'
import { NYC_BARS } from '../data/nycBars'

const barMapUrl = (b) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${b.name} ${b.area}`)}`
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
const dateLabel = (d) => d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
const timeLabel = (d) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
const isManhattan = (b) => b.area.includes('Manhattan')

const DOWNTOWN_ZONES = [
  'West & Greenwich Village · Hudson Square',
  'East Village · NoHo · Bowery · LES',
  'SoHo · Tribeca · FiDi · Seaport',
]
const zoneOf = (area) => {
  if (/East Village|Alphabet|Lower East Side|Bowery|NoHo|Nolita/.test(area)) return DOWNTOWN_ZONES[1]
  if (/SoHo|Tribeca|Financial District|Seaport|Chinatown/.test(area)) return DOWNTOWN_ZONES[2]
  return DOWNTOWN_ZONES[0]
}

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
      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-medium text-emerald-400/80">{bar.vibe}</span>
        {bar.watchParty && (
          <span className="rounded-full bg-emerald-500/15 px-1.5 py-px text-[9px] font-semibold text-emerald-400">
            🎉 watch party
          </span>
        )}
      </div>
      <div className="mt-1 text-xs leading-snug text-slate-400">{bar.why}</div>
    </div>
  )
}

// Two-column "[Team] fans" grid of bar cards.
function TeamColumns({ groups }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {groups.map((g) => (
        <div key={g.country}>
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400/80">
            {g.country} fans
          </div>
          <div className="space-y-2">
            {g.bars.map((b) => (
              <BarCard key={b.name} bar={b} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function GameBars({ m }) {
  const [showOuter, setShowOuter] = useState(false)

  const split = (filter) =>
    [m.home, m.away]
      .map((side) => ({ country: side.name, bars: (NYC_BARS.byCountry[side.name] || []).filter(filter) }))
      .filter((g) => g.bars.length > 0)

  const manhattan = split(isManhattan)
  const outer = split((b) => !isManhattan(b))
  const outerCount = outer.reduce((n, g) => n + g.bars.length, 0)

  return (
    <div className="rounded-xl border border-slate-800 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-100">
        {m.home.logo && <img src={m.home.logo} alt="" className="h-5 w-5 object-contain" />}
        {m.home.name} <span className="text-slate-500">v</span> {m.away.name}
        {m.away.logo && <img src={m.away.logo} alt="" className="h-5 w-5 object-contain" />}
        <span className="ml-auto text-xs font-normal text-slate-500">{timeLabel(m.date)}</span>
      </div>

      {manhattan.length > 0 ? (
        <TeamColumns groups={manhattan} />
      ) : (
        <p className="text-xs text-slate-500">
          No team-specific Manhattan spot for these two — grab any soccer pub below (all properly
          Manhattan, naturally). {outerCount > 0 && 'Or slum it in the boroughs 👇'}
        </p>
      )}

      {outerCount > 0 && (
        <div className="mt-3 border-t border-slate-800/70 pt-3">
          <button
            type="button"
            onClick={() => setShowOuter((v) => !v)}
            aria-expanded={showOuter}
            className="flex w-full items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-slate-200"
          >
            🌉 If you simply must leave Manhattan
            <span className="rounded-full bg-slate-800 px-1.5 py-px text-[9px] text-slate-500">{outerCount}</span>
            <span className={`ml-auto transition-transform ${showOuter ? 'rotate-180' : ''}`}>▾</span>
          </button>
          {showOuter && (
            <div className="mt-2">
              <p className="mb-2 text-[10px] italic text-slate-600">
                The outer boroughs — and, heaven forfend, New Jersey. We won't tell anyone. (We will.)
              </p>
              <TeamColumns groups={outer} />
            </div>
          )}
        </div>
      )}
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

  const manhattanPubs = NYC_BARS.generalSoccerPubs.filter(isManhattan)
  const outerPubs = NYC_BARS.generalSoccerPubs.filter((b) => !isManhattan(b))

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-400">
          🍸 Where to watch in NYC
        </h2>
        <p className="mb-4 max-w-2xl text-xs text-slate-500">
          Hand-researched watch-party spots per match — supporters'-club home bars and real fan-scene
          venues. We lead with <span className="text-slate-300">Manhattan</span>, as is only proper;
          anything requiring a bridge or tunnel is filed discreetly below. Tap an address for directions.
        </p>

        <div className="mb-2 text-xs font-semibold text-slate-300">{heading}</div>
        {games.length === 0 ? (
          <p className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-6 text-center text-sm text-slate-500">
            No games scheduled right now — see the always-good-bet pubs below.
          </p>
        ) : (
          <div className="space-y-4">
            {games.map((m) => (
              <GameBars key={m.id} m={m} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-emerald-400/90">
          🍻 Below 14th — your downtown turf
        </h2>
        <p className="mb-4 max-w-2xl text-xs text-slate-500">
          Deep-researched, cross-referenced soccer bars south of 14th St (TVs on, 🎉 = hosts watch
          parties), grouped by neighborhood. Tap an address for directions.
        </p>
        <div className="space-y-5">
          {DOWNTOWN_ZONES.map((zone) => {
            const bars = NYC_BARS.downtownPicks.filter((b) => zoneOf(b.area) === zone)
            if (bars.length === 0) return null
            return (
              <div key={zone}>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {zone}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {bars.map((b) => (
                    <BarCard key={b.name} bar={b} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-400">
          ⚽ Always a good bet — Manhattan soccer pubs
        </h2>
        <p className="mb-3 text-xs text-slate-500">These show every match, whoever's playing.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {manhattanPubs.map((b) => (
            <BarCard key={b.name} bar={b} />
          ))}
        </div>

        {outerPubs.length > 0 && (
          <details className="mt-3 rounded-xl border border-slate-800/70 px-4 py-2">
            <summary className="cursor-pointer list-none text-[11px] font-semibold text-slate-400 hover:text-slate-200">
              🌉 Two outer-borough exceptions we'll grudgingly allow
            </summary>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {outerPubs.map((b) => (
                <BarCard key={b.name} bar={b} />
              ))}
            </div>
          </details>
        )}
      </section>
    </div>
  )
}
