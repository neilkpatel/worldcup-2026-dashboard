import { useEffect, useMemo, useState } from 'react'
import ResultCard from './ResultCard'
import Explainer from './Explainer'
import { lastCompletedDay } from '../recap'
import { fetchMatchSummary } from '../api'
import { matchStakes, MARQUEE } from '../stakes'
import { buildStandingMap, ordinal } from '../stats'
import TeamStanding from './TeamStanding'
import reports from '../data/reports.json'

// Lazily fetch per-match recap detail (scorers, stats, headline) for a set of
// finished matches. Returns { [id]: summary }. Best-effort per match so one bad
// response never blanks the rest; refetches only when the set of ids changes.
function useMatchSummaries(matches) {
  const [summaries, setSummaries] = useState({})
  const ids = matches.map((m) => m.id).join(',')

  useEffect(() => {
    if (!ids) return
    let cancelled = false
    Promise.all(
      ids.split(',').map(async (id) => {
        try {
          return [id, await fetchMatchSummary(id)]
        } catch {
          return [id, null]
        }
      })
    ).then((entries) => {
      if (!cancelled) setSummaries(Object.fromEntries(entries))
    })
    return () => {
      cancelled = true
    }
  }, [ids])

  return summaries
}

function dayKey(date) {
  return date.toDateString()
}

function dateLabel(date) {
  return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
}

function timeLabel(date) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function timeAgo(date) {
  if (!date) return ''
  const mins = Math.round((Date.now() - date.getTime()) / 60000)
  if (mins < 60) return `${Math.max(mins, 1)}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

const isLogistics = (a) => /how to watch|tv channel|live ?stream|kick-off time/i.test(a.headline)

// Best article for a specific game: prefer pieces naming BOTH teams, then any
// naming one, putting real analysis ahead of "how to watch" logistics, newest first.
function newsForMatch(news, match) {
  const text = (a) => `${a.headline} ${a.description}`
  const has = (a, name) => name.length > 3 && text(a).includes(name)
  const h = match.home.name
  const aw = match.away.name
  const both = news.filter((a) => has(a, h) && has(a, aw))
  const pool = both.length ? both : news.filter((a) => has(a, h) || has(a, aw))
  return [...pool].sort((x, y) => {
    const lg = (isLogistics(x) ? 1 : 0) - (isLogistics(y) ? 1 : 0)
    return lg || (y.published?.getTime() ?? 0) - (x.published?.getTime() ?? 0)
  })
}

// One news link row, with optional game label (for game-tied previews).
function NewsLink({ article, label }) {
  return (
    <li>
      {label && <div className="text-xs font-medium text-slate-500">{label}</div>}
      <a
        href={article.link}
        target="_blank"
        rel="noreferrer"
        className={`group flex items-baseline gap-2 text-sm ${label ? 'mt-0.5' : ''}`}
      >
        <span className="text-slate-600 group-hover:text-emerald-400">›</span>
        <span className="text-slate-300 group-hover:text-slate-100">
          {article.headline}
          {article.published && (
            <span className="ml-2 text-xs text-slate-600">{timeAgo(article.published)}</span>
          )}
        </span>
      </a>
    </li>
  )
}

// Single news block: game-tied previews first (with the fixture as a label),
// then general headlines. Replaces the old separate "why it matters" + headlines.
function News({ previews, headlines }) {
  if (previews.length === 0 && headlines.length === 0) return null
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-slate-400 uppercase">
        📰 News
      </h2>
      <ul className="space-y-3">
        {previews.map(({ match, article }) => (
          <NewsLink key={match.id} article={article} label={`${match.home.name} v ${match.away.name}`} />
        ))}
        {headlines.map((a) => (
          <NewsLink key={a.id} article={a} />
        ))}
      </ul>
    </section>
  )
}

// Classify a finished match against a marquee side: a non-marquee team beating a
// giant is an 'upset'; holding one to a draw is a 'shock'.
function upsetKind(m) {
  if (m.state !== 'post') return null
  const hBig = MARQUEE.has(m.home.name)
  const aBig = MARQUEE.has(m.away.name)
  if (hBig === aBig) return null
  const giant = hBig ? m.home : m.away
  const minnow = hBig ? m.away : m.home
  if (minnow.winner) return { kind: 'upset', text: `Upset — ${minnow.name} beat ${giant.name}` }
  if (!giant.winner) return { kind: 'shock', text: `Shock — ${giant.name} held by ${minnow.name}` }
  return null
}

function kickoffCountdown(date) {
  const ms = date.getTime() - Date.now()
  if (ms <= 0) return 'kicking off'
  const m = Math.round(ms / 60000)
  if (m < 60) return `in ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `in ${h}h ${m % 60}m`
  return `in ${Math.floor(h / 24)}d ${h % 24}h`
}

function StatusPill({ m }) {
  if (m.state === 'in')
    return (
      <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
        {m.clock || 'LIVE'}
      </span>
    )
  if (m.state === 'post')
    return (
      <span className="rounded-full bg-slate-700/50 px-2 py-0.5 text-[11px] font-semibold text-slate-300">FT</span>
    )
  return (
    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
      {m.date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
    </span>
  )
}

function FixtureSide({ team, state, winner, standing }) {
  const dim = state === 'post' && !winner
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
      <img
        src={team.logo}
        alt=""
        loading="lazy"
        className={`h-9 w-9 object-contain transition-transform group-hover:scale-110 ${dim ? 'opacity-50' : ''}`}
      />
      <span
        className={`text-center text-xs leading-tight ${
          winner ? 'font-bold text-slate-100' : dim ? 'text-slate-500' : 'text-slate-200'
        }`}
      >
        {team.shortName || team.name}
      </span>
      {standing && <TeamStanding s={standing} />}
    </div>
  )
}

// Colored W/D/L chips for a team's recent results, shown oldest → newest.
function FormChips({ label, games }) {
  if (!games || games.length === 0) return null
  return (
    <div className="flex items-center gap-1">
      <span className="w-9 shrink-0 font-semibold text-slate-400">{label}</span>
      {games
        .slice(0, 5)
        .reverse()
        .map((g, i) => (
          <span
            key={i}
            title={`${g.result} ${g.score}${g.opponent ? ` v ${g.opponent}` : ''}`}
            className={`inline-flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold ${
              g.result === 'W'
                ? 'bg-emerald-500/20 text-emerald-400'
                : g.result === 'L'
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'bg-slate-600/40 text-slate-300'
            }`}
          >
            {g.result}
          </span>
        ))}
    </div>
  )
}

// Fixture card with an always-visible preview: venue, TV and what's at stake, plus
// (for upcoming games) recent form + head-to-head from the match summary.
function FixtureCard({ m, group, stakes, standingMap, summary }) {
  const pre = m.state === 'pre'
  const upset = upsetKind(m)
  const showStanding = m.round === 'group-stage'
  const where = [m.venue, m.city].filter(Boolean).join(', ')
  const form = summary?.form
  const h2h = summary?.h2h
  const showStake = stakes && m.state !== 'post'
  const hasForm = pre && form && (form[m.home.id] || form[m.away.id])
  const hasPreview = where || m.tv || showStake || hasForm || (pre && h2h)

  return (
    <div
      className={`group flex flex-col rounded-xl border bg-slate-900/40 p-3 transition duration-150 hover:-translate-y-0.5 hover:bg-slate-900 hover:shadow-lg hover:shadow-black/30 ${
        upset ? 'border-amber-500/40' : 'border-slate-800 hover:border-emerald-600/50'
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
          {group ? `Group ${group}` : 'Knockout'}
        </span>
        <StatusPill m={m} />
      </div>

      <div className="flex items-center gap-1">
        <FixtureSide team={m.home} state={m.state} winner={m.home.winner} standing={showStanding ? standingMap?.[m.home.id] : null} />
        <div className="shrink-0 px-2 text-center">
          {pre ? (
            <div className="text-sm font-semibold text-slate-500">v</div>
          ) : (
            <div className="text-2xl font-bold tabular-nums text-slate-100">
              {m.home.score}
              <span className="mx-1 text-slate-600">–</span>
              {m.away.score}
            </div>
          )}
        </div>
        <FixtureSide team={m.away} state={m.state} winner={m.away.winner} standing={showStanding ? standingMap?.[m.away.id] : null} />
      </div>

      {pre && (
        <div className="mt-2 text-center text-[11px] font-medium text-emerald-400/80">
          ⏱ kicks off {kickoffCountdown(m.date)}
        </div>
      )}
      {upset && (
        <div className="mt-2 text-center text-[11px] font-semibold text-amber-400">⚡ {upset.text}</div>
      )}

      {hasPreview && (
        <div className="mt-2 space-y-1 border-t border-slate-800 pt-2 text-[11px] text-slate-400">
          {where && <div>📍 {where}</div>}
          {m.tv && <div>📺 {m.tv}</div>}
          {showStake && <div className="text-slate-300">🎯 {stakes.text}</div>}
          {hasForm && (
            <div className="space-y-0.5 pt-0.5">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Recent form</div>
              <FormChips label={m.home.abbrev} games={form[m.home.id]} />
              <FormChips label={m.away.abbrev} games={form[m.away.id]} />
            </div>
          )}
          {pre && h2h && (
            <div>
              🤝 {h2h.count === 1 ? 'Last meeting' : `Last of ${h2h.count} meetings`}: {h2h.lastScore}
              {h2h.lastYear ? ` (${h2h.lastYear})` : ''}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// "What to watch" ordering: live first, then upcoming, then finished.
const STATE_RANK = { in: 0, pre: 1, post: 2 }
const byWatchOrder = (a, b) => STATE_RANK[a.state] - STATE_RANK[b.state] || a.date - b.date

function Scores({ title, matches, groupMap, groups, standingMap }) {
  // Pull summaries for upcoming games so each card can show form + head-to-head
  // (keyed by match-id set, so it only refetches when the slate changes).
  const summaries = useMatchSummaries(matches.filter((m) => m.state === 'pre'))
  if (matches.length === 0) return null
  const ordered = [...matches].sort(byWatchOrder)
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-slate-400 uppercase">
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ordered.map((m) => (
          <FixtureCard key={m.id} m={m} group={groupMap[m.home.id]} stakes={matchStakes(m, groups)} standingMap={standingMap} summary={summaries[m.id]} />
        ))}
      </div>
    </section>
  )
}

// Pinned panel for a team the user follows — its group standing plus its live /
// next / last fixture, surfaced at the very top of the Today tab.
function FollowedTeam({ abbrev, matches, groups }) {
  let standing = null
  let groupLetter = null
  for (const g of groups) {
    const t = g.teams.find((x) => x.abbrev === abbrev)
    if (t) {
      standing = t
      groupLetter = g.name.replace('Group ', '')
      break
    }
  }
  const mine = matches.filter((m) => m.home.abbrev === abbrev || m.away.abbrev === abbrev)
  if (mine.length === 0) return null
  const selfOf = (m) => (m.home.abbrev === abbrev ? m.home : m.away)
  const oppOf = (m) => (m.home.abbrev === abbrev ? m.away : m.home)
  const me = selfOf(mine.find((m) => selfOf(m).logo) ?? mine[0])

  const live = mine.find((m) => m.state === 'in')
  const next = mine.filter((m) => m.state === 'pre').sort((a, b) => a.date - b.date)[0]
  const last = mine.filter((m) => m.state === 'post').sort((a, b) => b.date - a.date)[0]

  const renderFixture = (m, kind) => {
    const s = selfOf(m)
    const o = oppOf(m)
    if (kind === 'next') {
      const where = [m.venue, m.city].filter(Boolean).join(', ')
      return (
        <span>
          <span className="text-slate-500">Next</span> · vs {o.name} · {dateLabel(m.date)} · {timeLabel(m.date)}{' '}
          <span className="text-emerald-400">({kickoffCountdown(m.date)})</span>
          {where && <span className="mt-0.5 block text-xs text-slate-500">📍 {where}</span>}
        </span>
      )
    }
    const res = s.winner ? 'W' : o.winner ? 'L' : 'D'
    const resCls = res === 'W' ? 'text-emerald-400' : res === 'L' ? 'text-rose-400' : 'text-slate-400'
    return (
      <span>
        <span className="text-slate-500">{kind === 'live' ? 'Live' : 'Last'}</span> · {s.name}{' '}
        <span className="font-semibold text-slate-100">{s.score}–{o.score}</span> {o.name}{' '}
        {kind === 'live' ? (
          <span className="font-semibold text-emerald-400">{m.clock || 'LIVE'}</span>
        ) : (
          <span className={`font-semibold ${resCls}`}>({res})</span>
        )}
      </span>
    )
  }

  return (
    <section className="mb-8">
      <div className="rounded-xl border border-emerald-700/40 bg-gradient-to-br from-emerald-950/40 to-slate-900/40 p-4">
        <div className="flex items-center gap-3">
          {me.logo && <img src={me.logo} alt="" className="h-10 w-10 object-contain" />}
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400/80">
              ★ Following
            </div>
            <div className="text-lg font-bold text-slate-100">{me.name}</div>
          </div>
          {standing && (
            <div className="ml-auto text-right text-xs text-slate-400">
              <div className="font-semibold text-slate-200">
                Group {groupLetter} · {ordinal(standing.rank)}
              </div>
              <div>
                {standing.points} pts · {standing.wins}-{standing.draws}-{standing.losses}
              </div>
            </div>
          )}
        </div>
        <div className="mt-3 space-y-1 border-t border-emerald-800/30 pt-3 text-sm text-slate-300">
          {live && <div>{renderFixture(live, 'live')}</div>}
          {next && <div>{renderFixture(next, 'next')}</div>}
          {last && <div>{renderFixture(last, 'last')}</div>}
        </div>
      </div>
    </section>
  )
}

function LatestResults({ matches, standingMap }) {
  const summaries = useMatchSummaries(matches)
  if (matches.length === 0) return null
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-slate-400 uppercase">
        ⚽ Latest results · {dateLabel(matches[0].date)}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {matches.map((m) => (
          <ResultCard
            key={m.id}
            match={m}
            summary={summaries[m.id]}
            loading={!(m.id in summaries)}
            cachedReport={reports[m.id]}
            standingMap={standingMap}
          />
        ))}
      </div>
    </section>
  )
}

export default function Today({ matches, groupMap, groups, news = [] }) {
  const standingMap = useMemo(() => buildStandingMap(groups), [groups])
  const now = new Date()
  const todayKey = dayKey(now)

  const todayMatches = matches.filter((m) => dayKey(m.date) === todayKey)
  const recapMatches = lastCompletedDay(matches, now) ?? []

  // Next match day's slate — used on off-days (nothing scheduled today)
  const nextMatch = matches.find((m) => m.date > now)
  const nextDayMatches = nextMatch
    ? matches.filter((m) => dayKey(m.date) === dayKey(nextMatch.date))
    : []
  const nextLabel = nextMatch ? dateLabel(nextMatch.date) : ''

  // The still-to-come games (today's, else next day's)
  const futureToday = todayMatches.filter((m) => m.state !== 'post')
  const stakesMatches = futureToday.length > 0 ? futureToday : nextDayMatches

  // Tie a real article to each upcoming game; the rest become general headlines.
  const usedIds = new Set()
  const previews = []
  for (const m of stakesMatches) {
    const pick = newsForMatch(news, m).find((a) => !usedIds.has(a.id))
    if (pick) {
      usedIds.add(pick.id)
      previews.push({ match: m, article: pick })
    }
  }
  const headlineItems = news.filter((a) => !usedIds.has(a.id)).slice(0, 4)

  const tournamentOver = todayMatches.length === 0 && nextDayMatches.length === 0

  return (
    <div>
      {/* ── Followed team, pinned ── */}
      <FollowedTeam abbrev="USA" matches={matches} groups={groups} />

      {/* ── Today's fixtures (or the next slate on off-days) ── */}
      {todayMatches.length > 0 ? (
        <Scores
          title={`⚽ Today · ${dateLabel(now)}`}
          matches={todayMatches}
          groupMap={groupMap}
          groups={groups}
          standingMap={standingMap}
        />
      ) : nextDayMatches.length > 0 ? (
        <Scores
          title={`⏭ Next up · ${nextLabel}`}
          matches={nextDayMatches}
          groupMap={groupMap}
          groups={groups}
          standingMap={standingMap}
        />
      ) : null}

      {tournamentOver && (
        <p className="py-16 text-center text-slate-500">
          No upcoming matches — the tournament is over.
        </p>
      )}

      {/* ── Latest results ── */}
      <LatestResults matches={recapMatches} standingMap={standingMap} />

      {/* ── News last ── */}
      <News previews={previews} headlines={headlineItems} />

      <Explainer />
    </div>
  )
}
