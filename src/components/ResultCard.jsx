import { useState } from 'react'
import { templateReport, matchTags } from '../reports'

const TAG_STYLE = {
  Upset: 'bg-amber-500/20 text-amber-300',
  Shock: 'bg-amber-500/20 text-amber-300',
  Demolition: 'bg-rose-500/20 text-rose-300',
  Dominant: 'bg-emerald-500/20 text-emerald-300',
  'Smash & grab': 'bg-sky-500/20 text-sky-300',
  Cagey: 'bg-slate-600/30 text-slate-300',
  'Goal fest': 'bg-fuchsia-500/20 text-fuchsia-300',
}

// A goal/card line: "66' Mbappé (pen)". Cards get a colored square, own goals
// and penalties get a tag. Players[0] is the scorer/booked player.
function eventLabel(e) {
  const who = e.players[0] ?? ''
  const tags = []
  if (e.penalty) tags.push('pen')
  if (e.ownGoal) tags.push('OG')
  const tag = tags.length ? ` (${tags.join(', ')})` : ''
  return `${e.minute} ${who}${tag}`
}

function EventList({ events, align }) {
  if (events.length === 0) return <div className="min-h-[1rem]" />
  return (
    <ul className={`space-y-0.5 text-xs ${align === 'right' ? 'text-right' : ''}`}>
      {events.map((e, i) => (
        <li key={i} className="flex items-center gap-1.5" style={align === 'right' ? { flexDirection: 'row-reverse' } : {}}>
          <span aria-hidden>
            {e.isGoal ? (
              '⚽'
            ) : (
              <span
                className={`inline-block h-3 w-2 rounded-[1px] align-middle ${
                  e.card === 'red' ? 'bg-red-500' : 'bg-amber-400'
                }`}
              />
            )}
          </span>
          <span className="text-slate-300">{eventLabel(e)}</span>
        </li>
      ))}
    </ul>
  )
}

// Flag + name, matching the Today fixture cards' look. Winner emphasized.
function Side({ team, winner }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1.5">
      {team.logo && (
        <img src={team.logo} alt="" loading="lazy" className={`h-9 w-9 object-contain ${winner ? '' : 'opacity-60'}`} />
      )}
      <span className={`text-center text-xs leading-tight ${winner ? 'font-bold text-slate-100' : 'text-slate-400'}`}>
        {team.shortName || team.name}
      </span>
    </div>
  )
}

// One stat compared between the two sides as a split bar.
function StatBar({ label, home, away }) {
  const h = parseFloat(home) || 0
  const a = parseFloat(away) || 0
  const total = h + a
  const homePct = total > 0 ? (h / total) * 100 : 50
  return (
    <div className="text-xs">
      <div className="mb-0.5 flex justify-between text-slate-400">
        <span className="font-medium text-slate-200">{home ?? '—'}</span>
        <span className="uppercase tracking-wide">{label}</span>
        <span className="font-medium text-slate-200">{away ?? '—'}</span>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div className="bg-emerald-500/70" style={{ width: `${homePct}%` }} />
        <div className="bg-sky-500/60" style={{ width: `${100 - homePct}%` }} />
      </div>
    </div>
  )
}

export default function ResultCard({ match: m, summary, loading, cachedReport }) {
  const [panel, setPanel] = useState(null) // 'report' | 'stats' | null
  const toggle = (p) => setPanel((cur) => (cur === p ? null : p))

  const homeEvents = (summary?.events ?? []).filter((e) => e.teamId === m.home.id)
  const awayEvents = (summary?.events ?? []).filter((e) => e.teamId === m.away.id)
  const stats = summary?.stats
  const hasStats = stats?.home && stats?.away

  // Written analysis, in order of preference: a generated Claude verdict (only if
  // its score still matches), then ESPN's own match report, then a live template.
  const score = `${m.home.score}-${m.away.score}`
  const claude = cachedReport && cachedReport.score === score ? cachedReport : null
  const espnStory = summary?.story
  const headline = claude?.headline || summary?.headline
  const body = claude?.report || espnStory || templateReport(m, summary)
  const source = claude ? 'ai' : espnStory ? 'espn' : null
  const tags = matchTags(m, summary)

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40">
      {/* Scoreline — flag-forward, matching the Today fixture cards */}
      <div className="flex items-center gap-1 px-3 pt-3">
        <Side team={m.home} winner={m.home.winner} />
        <div className="shrink-0 px-2 text-2xl font-bold tabular-nums text-slate-100">
          {m.home.score}
          <span className="mx-1 text-slate-600">–</span>
          {m.away.score}
        </div>
        <Side team={m.away} winner={m.away.winner} />
      </div>

      {/* Storyline tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5 px-4 pt-2.5">
          {tags.map((t) => (
            <span
              key={t}
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                TAG_STYLE[t] ?? 'bg-slate-600/30 text-slate-300'
              }`}
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Headline */}
      {headline && (
        <p className="px-4 pt-2 text-center text-sm font-semibold text-slate-100">{headline}</p>
      )}
      {loading && !summary && (
        <p className="px-4 pt-2 text-center text-xs text-slate-600">Loading match detail…</p>
      )}

      {/* Goal / card timeline, split by side */}
      {(homeEvents.length > 0 || awayEvents.length > 0) && (
        <div className="grid grid-cols-2 gap-3 px-4 pt-2.5">
          <EventList events={homeEvents} align="left" />
          <EventList events={awayEvents} align="right" />
        </div>
      )}

      {/* Tabs: the long report and the stats both live behind a click */}
      {(body || hasStats || summary?.attendance) && (
        <>
          <div className="mt-3 flex border-t border-slate-800/80 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {body && (
              <button
                onClick={() => toggle('report')}
                className={`flex flex-1 items-center justify-center gap-1 py-2 transition-colors hover:text-slate-200 ${panel === 'report' ? 'text-emerald-300' : ''}`}
              >
                📄 Report <span className={`transition-transform ${panel === 'report' ? 'rotate-180' : ''}`}>▾</span>
              </button>
            )}
            {(hasStats || summary?.attendance) && (
              <button
                onClick={() => toggle('stats')}
                className={`flex flex-1 items-center justify-center gap-1 py-2 transition-colors hover:text-slate-200 ${body ? 'border-l border-slate-800/80' : ''} ${panel === 'stats' ? 'text-emerald-300' : ''}`}
              >
                📊 Stats <span className={`transition-transform ${panel === 'stats' ? 'rotate-180' : ''}`}>▾</span>
              </button>
            )}
          </div>

          {panel === 'report' && body && (
            <div className="border-t border-slate-800/60 px-4 py-3">
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">{body}</p>
              {source && (
                <p className="mt-1.5 text-[10px] font-medium text-slate-600">
                  {source === 'ai' ? '✦ AI verdict' : 'Match report · ESPN'}
                </p>
              )}
            </div>
          )}

          {panel === 'stats' && (
            <div className="space-y-2 border-t border-slate-800/60 px-4 py-3">
              {hasStats && (
                <>
                  <StatBar label="Possession %" home={stats.home.possession} away={stats.away.possession} />
                  <StatBar label="Shots" home={stats.home.shots} away={stats.away.shots} />
                  <StatBar label="On target" home={stats.home.onTarget} away={stats.away.onTarget} />
                  <StatBar label="Corners" home={stats.home.corners} away={stats.away.corners} />
                </>
              )}
              {summary?.attendance && (
                <p className="pt-1 text-center text-[11px] text-slate-500">
                  👥 {summary.attendance.toLocaleString()} attendance
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* Pad bottom when there are no tabs at all */}
      {!body && !hasStats && !summary?.attendance && <div className="pb-3" />}
    </div>
  )
}
