import MatchCard from './MatchCard'
import Explainer from './Explainer'
import { lastCompletedDay } from '../recap'
import { matchStakes, MARQUEE } from '../stakes'

function dayKey(date) {
  return date.toDateString()
}

function dateLabel(date) {
  return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
}

function timeAgo(date) {
  if (!date) return ''
  const mins = Math.round((Date.now() - date.getTime()) / 60000)
  if (mins < 60) return `${Math.max(mins, 1)}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
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

// Article-backed "why it matters": each upcoming game linked to a real story.
function WhyItMatters({ previews, title }) {
  if (previews.length === 0) return null
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-amber-300/90 uppercase">
        🎯 {title}
      </h2>
      <ul className="space-y-3">
        {previews.map(({ match, article }) => (
          <li key={match.id}>
            <div className="text-sm font-medium text-slate-200">
              {match.home.name} v {match.away.name}
            </div>
            <a
              href={article.link}
              target="_blank"
              rel="noreferrer"
              className="group mt-0.5 flex items-baseline gap-2 text-sm"
            >
              <span className="text-slate-600 group-hover:text-emerald-400">›</span>
              <span className="text-slate-400 group-hover:text-slate-200">
                {article.headline}
                {article.published && (
                  <span className="ml-2 text-xs text-slate-600">{timeAgo(article.published)}</span>
                )}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

// General World Cup headlines (whatever wasn't already tied to a specific game).
function Headlines({ items }) {
  if (items.length === 0) return null
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-slate-400 uppercase">
        📰 Headlines
      </h2>
      <ul className="space-y-2">
        {items.map((a) => (
          <li key={a.id}>
            <a
              href={a.link}
              target="_blank"
              rel="noreferrer"
              className="group flex items-baseline gap-2 text-sm"
            >
              <span className="text-slate-600 group-hover:text-emerald-400">›</span>
              <span className="text-slate-300 group-hover:text-slate-100">
                {a.headline}
                {a.published && (
                  <span className="ml-2 text-xs text-slate-600">{timeAgo(a.published)}</span>
                )}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

function scoreStatus(m) {
  if (m.state === 'pre')
    return m.date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (m.state === 'in') return m.clock || 'LIVE'
  return m.statusDetail || 'FT'
}

// Classify a finished match against a marquee side: a non-marquee team beating a
// giant is an 'upset'; holding one to a draw is a 'shock'. Used for row shading.
function upsetKind(m) {
  if (m.state !== 'post') return null
  const hBig = MARQUEE.has(m.home.name)
  const aBig = MARQUEE.has(m.away.name)
  if (hBig === aBig) return null // both giants or neither — no upset angle
  const giant = hBig ? m.home : m.away
  const minnow = hBig ? m.away : m.home
  if (minnow.winner) return { kind: 'upset', text: `Upset — ${minnow.name} beat ${giant.name}` }
  if (!giant.winner) return { kind: 'shock', text: `Shock — ${giant.name} held by ${minnow.name}` }
  return null
}

// One flat scoreline — every game gets equal billing. Centered, fixed-width
// columns so scores align vertically and the status sits next to the match.
// Live games get a flashing ring; upset results get amber shading.
function ScoreRow({ m }) {
  const pre = m.state === 'pre'
  const live = m.state === 'in'
  const upset = upsetKind(m)
  const rowBg = live
    ? 'bg-emerald-500/10 live-row'
    : upset?.kind === 'upset'
      ? 'bg-amber-500/15'
      : upset?.kind === 'shock'
        ? 'bg-amber-500/10'
        : 'odd:bg-slate-900/40'
  const nameCls = (winner) =>
    `min-w-0 truncate ${
      winner
        ? upset?.kind === 'upset'
          ? 'font-semibold text-amber-300'
          : 'font-semibold text-slate-100'
        : 'text-slate-300'
    }`
  return (
    <div
      title={upset?.text}
      className={`flex items-center justify-center gap-2 px-3 py-2 text-sm sm:gap-3 ${rowBg}`}
    >
      <span className="flex w-28 items-center justify-end gap-1.5 sm:w-40">
        <span className={nameCls(m.home.winner)}>{m.home.name}</span>
        {m.home.logo && <img src={m.home.logo} alt="" className="h-4 w-4 shrink-0" />}
      </span>
      <span className="w-14 shrink-0 text-center tabular-nums">
        {pre ? (
          <span className="text-slate-600">v</span>
        ) : (
          <span className="font-semibold text-slate-100">
            {m.home.score}–{m.away.score}
          </span>
        )}
      </span>
      <span className="flex w-28 items-center gap-1.5 sm:w-40">
        {m.away.logo && <img src={m.away.logo} alt="" className="h-4 w-4 shrink-0" />}
        <span className={nameCls(m.away.winner)}>{m.away.name}</span>
      </span>
      <span
        className={`flex w-14 shrink-0 items-center justify-end gap-1 text-right text-xs ${
          live ? 'font-semibold text-emerald-400' : 'text-slate-500'
        }`}
      >
        {live && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />}
        {scoreStatus(m)}
      </span>
    </div>
  )
}

function Scores({ title, matches }) {
  if (matches.length === 0) return null
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-slate-400 uppercase">
        {title}
      </h2>
      <div className="overflow-hidden rounded-lg border border-slate-800">
        {matches.map((m) => (
          <ScoreRow key={m.id} m={m} />
        ))}
      </div>
    </section>
  )
}

export default function Today({ matches, groupMap, groups, news = [] }) {
  const now = new Date()
  const todayKey = dayKey(now)

  const todayMatches = matches.filter((m) => dayKey(m.date) === todayKey)
  const live = todayMatches.filter((m) => m.state === 'in')
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
  const stakesTitle =
    futureToday.length > 0 ? "Why today's games matter" : `Why ${nextLabel}'s games matter`

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
  const headlineItems = news.filter((a) => !usedIds.has(a.id)).slice(0, 5)

  const tournamentOver = todayMatches.length === 0 && nextDayMatches.length === 0

  return (
    <div>
      <Scores title={`⚽ Today · ${dateLabel(now)}`} matches={todayMatches} />

      <WhyItMatters previews={previews} title={stakesTitle} />
      <Headlines items={headlineItems} />

      {live.length > 0 && (
        <Section title="Live now" matches={live} groupMap={groupMap} groups={groups} />
      )}

      {/* On off-days, show the next slate as detailed cards */}
      {todayMatches.length === 0 && nextDayMatches.length > 0 && (
        <Section
          title={`Next matches · ${nextLabel}`}
          matches={nextDayMatches}
          groupMap={groupMap}
          groups={groups}
        />
      )}

      {tournamentOver && (
        <p className="py-16 text-center text-slate-500">
          No upcoming matches — the tournament is over.
        </p>
      )}

      <Scores
        title={`⚽ Latest results · ${recapMatches.length ? dateLabel(recapMatches[0].date) : ''}`}
        matches={recapMatches}
      />

      <Explainer />
    </div>
  )
}
