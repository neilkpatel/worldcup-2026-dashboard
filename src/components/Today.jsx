import MatchCard from './MatchCard'
import Explainer from './Explainer'
import Recap from './Recap'
import { lastCompletedDay } from '../recap'
import { matchStakes, rankByStakes } from '../stakes'

function dayKey(date) {
  return date.toDateString()
}

function Section({ title, matches, groupMap, groups }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-slate-400 uppercase">
        {title}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {matches.map((m) => (
          <MatchCard
            key={m.id}
            match={m}
            groupMap={groupMap}
            stakes={matchStakes(m, groups)}
          />
        ))}
      </div>
    </section>
  )
}

// Compact "what matters right now" panel pinned at the top of the tab.
function ThingsToWatch({ matches, groups, title }) {
  const ranked = rankByStakes(matches, groups)
  // Prefer genuinely consequential matches; if a matchday has none yet
  // (everything still "info"), fall back to the top fixtures so the panel
  // still orients the day rather than disappearing.
  const notable = ranked.filter((r) => r.stakes && r.stakes.level !== 'info')
  const picks = (notable.length > 0 ? notable : ranked).slice(0, 3)
  if (picks.length === 0) return null

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-amber-300/90 uppercase">
        👀 {title}
      </h2>
      <ul className="space-y-2 text-sm">
        {picks.map(({ match, stakes }) => (
          <li key={match.id} className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
            <span className="font-medium text-slate-200 sm:w-56 sm:shrink-0">
              {match.home.name} v {match.away.name}
            </span>
            <span className="text-slate-400">{stakes?.text}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function Today({ matches, groupMap, groups }) {
  const now = new Date()
  const todayKey = dayKey(now)

  const todayMatches = matches.filter((m) => dayKey(m.date) === todayKey)
  const recapMatches = lastCompletedDay(matches, now)

  // If nothing today, surface the next match day so the tab is never empty
  let upcoming = []
  let upcomingLabel = ''
  if (todayMatches.length === 0) {
    const next = matches.find((m) => m.date > now)
    if (next) {
      upcoming = matches.filter((m) => dayKey(m.date) === dayKey(next.date))
      upcomingLabel = next.date.toLocaleDateString([], {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    }
  }

  const live = todayMatches.filter((m) => m.state === 'in')
  // The "things to watch" panel summarizes today's slate, else the next day's.
  const primary = todayMatches.length > 0 ? todayMatches : upcoming
  const watchTitle =
    todayMatches.length > 0 ? 'Things to watch today' : `Coming up · ${upcomingLabel}`

  return (
    <div>
      <ThingsToWatch matches={primary} groups={groups} title={watchTitle} />

      {live.length > 0 && (
        <Section title="Live now" matches={live} groupMap={groupMap} groups={groups} />
      )}
      {todayMatches.length > 0 && (
        <Section
          title={`Today · ${now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}`}
          matches={todayMatches.filter((m) => m.state !== 'in')}
          groupMap={groupMap}
          groups={groups}
        />
      )}
      {upcoming.length > 0 && (
        <Section
          title={`Next matches · ${upcomingLabel}`}
          matches={upcoming}
          groupMap={groupMap}
          groups={groups}
        />
      )}

      {todayMatches.length === 0 && upcoming.length === 0 && (
        <p className="py-16 text-center text-slate-500">
          No upcoming matches — the tournament is over.
        </p>
      )}

      <Recap matches={recapMatches} groups={groups} />
      <Explainer />
    </div>
  )
}
