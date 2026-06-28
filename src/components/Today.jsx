import { useEffect, useMemo, useState } from 'react'
import ResultCard from './ResultCard'
import Explainer from './Explainer'
import { lastCompletedDay } from '../recap'
import { fetchMatchSummary, fetchTeamNews, groupStageComplete } from '../api'
import { MARQUEE } from '../stakes'
import { buildStandingMap, buildThirdPlaceRace, ordinal } from '../stats'
import TeamStanding from './TeamStanding'
import reports from '../data/reports.json'
import { IRAN_WAR_STATUS } from '../data/iranWarStatus'
import FifaRank from './FifaRank'
import WhatsNew from './WhatsNew'
import TitleRace from './TitleRace'
import TeamsLeft from './TeamsLeft'

// Lazily fetch per-match recap detail (scorers, stats, headline) for a set of
// finished matches. Returns { [id]: summary }. Best-effort per match so one bad
// response never blanks the rest; refetches only when the set of ids changes.
function useMatchSummaries(matches) {
  const [summaries, setSummaries] = useState({})
  // Refetch when the match set changes, OR when a live game ticks (its clock /
  // score moves) — so live stats stay current. Pre/finished games are stable, so
  // they fetch once.
  const key = matches
    .map((m) => (m.state === 'in' ? `${m.id}@${m.clock}@${m.home.score}-${m.away.score}` : m.id))
    .join(',')

  useEffect(() => {
    if (!key) return
    const ids = key.split(',').map((s) => s.split('@')[0])
    let cancelled = false
    Promise.all(
      ids.map(async (id) => {
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
  }, [key])

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

// ── Knockout qualification status for a followed team ──────────────────────────
const KO_ROUND_NAME = {
  'round-of-32': 'Round of 32',
  'round-of-16': 'Round of 16',
  quarterfinals: 'Quarterfinals',
  semifinals: 'Semifinals',
  '3rd-place-match': '3rd-place match',
  final: 'Final',
}

const QUAL_TONE = {
  in: { pill: 'bg-emerald-500/15 text-emerald-300', icon: '✅' },
  champ: { pill: 'bg-amber-500/20 text-amber-200', icon: '🏆' },
  track: { pill: 'bg-amber-500/15 text-amber-300', icon: '⏳' },
  risk: { pill: 'bg-orange-500/15 text-orange-300', icon: '⚠️' },
  out: { pill: 'bg-rose-500/15 text-rose-300', icon: '❌' },
}

// Verdict for a followed team: prefer the authoritative signal (the team actually
// appears in a bracket fixture), else fall back to the format rules — top 2 of a
// group always advance, plus the 8 best third-placed teams — so we can show a status
// and, when not yet through, what still has to happen. Returns { tone, short, detail }.
function knockoutStatus({ teamId, name, standing, groupLetter, matches, thirds }) {
  if (!standing) return null

  // 1) Already slotted into the bracket (real team id in a knockout fixture)?
  const koMine = matches.filter(
    (m) => m.round !== 'group-stage' && (m.home.id === teamId || m.away.id === teamId),
  )
  if (koMine.length) {
    const lost = koMine.find(
      (m) =>
        m.completed &&
        ((m.home.id === teamId && m.away.winner) || (m.away.id === teamId && m.home.winner)),
    )
    if (lost)
      return { tone: 'out', short: 'Eliminated', detail: `Knocked out in the ${KO_ROUND_NAME[lost.round]}.` }
    const wonFinal = koMine.some(
      (m) =>
        m.round === 'final' &&
        m.completed &&
        ((m.home.id === teamId && m.home.winner) || (m.away.id === teamId && m.away.winner)),
    )
    if (wonFinal)
      return { tone: 'champ', short: 'World Champions', detail: 'Won the final — champions of the world.' }
    const next =
      koMine.filter((m) => !m.completed).sort((a, b) => a.date - b.date)[0] ??
      koMine.sort((a, b) => b.date - a.date)[0]
    return {
      tone: 'in',
      short: `Into the ${KO_ROUND_NAME[next.round]}`,
      detail: `Through to the ${KO_ROUND_NAME[next.round]}.`,
    }
  }

  // 2) Not in the bracket yet — reason from the group standing + format rules.
  const remaining = matches
    .filter(
      (m) =>
        m.round === 'group-stage' &&
        m.state !== 'post' &&
        (m.home.id === teamId || m.away.id === teamId),
    )
    .sort((a, b) => a.date - b.date)
  const groupDone = remaining.length === 0
  // The 8-best-thirds cutoff is only final once EVERY group is done, so a 3rd-place
  // verdict stays provisional until then, then becomes a hard qualified/eliminated.
  const allDone = groupStageComplete(matches)
  const rank = standing.rank
  const nextGame = remaining[0]
  const oppName = nextGame ? (nextGame.home.id === teamId ? nextGame.away.name : nextGame.home.name) : null
  const when = nextGame ? dateLabel(nextGame.date) : ''

  if (rank <= 2) {
    if (groupDone) {
      return {
        tone: 'in',
        short: 'Qualified · Round of 32',
        detail:
          rank === 1
            ? `Won Group ${groupLetter} — through to the Round of 32.`
            : `Runner-up in Group ${groupLetter} — through to the Round of 32.`,
      }
    }
    return {
      tone: 'track',
      short: `In a qualifying spot (${ordinal(rank)})`,
      detail: `Sitting ${ordinal(rank)} in Group ${groupLetter}; a top-2 finish goes through. Last group game${oppName ? ` vs ${oppName}` : ''}${when ? ` (${when})` : ''}.`,
    }
  }

  if (rank === 3) {
    const me = thirds.find((t) => t.id === teamId)
    const place = me ? ordinal(me.position) : '—'
    const qualifies = !!me?.qualifying
    // Group stage over → the third-place table is locked, so give a final verdict.
    if (allDone) {
      return qualifies
        ? {
            tone: 'in',
            short: 'Qualified · Round of 32',
            detail: `${name} finished 3rd in Group ${groupLetter} and ${place} of the 12 third-placed teams — among the 8 best, so it's through to the Round of 32.`,
          }
        : {
            tone: 'out',
            short: 'Eliminated',
            detail: `${name} finished 3rd in Group ${groupLetter} and ${place} of the 12 third-placed teams — only the 8 best advanced, so it's out.`,
          }
    }
    // Groups still running → provisional, with what still has to happen.
    return qualifies
      ? {
          tone: 'track',
          short: 'On track for Round of 32',
          detail: `${name} is 3rd in Group ${groupLetter}. Each group's top 2 go through automatically, and the last 8 spots go to the best of the 12 third-placed teams — ${name} is ${place} of those 12 right now, inside the top 8, so it would qualify if that holds once the final groups finish${!groupDone && oppName ? ` (plays ${oppName} next)` : ''}.`,
        }
      : {
          tone: 'risk',
          short: 'Just missing the cut',
          detail: `${name} is 3rd in Group ${groupLetter}. The last 8 Round-of-32 spots go to the best of the 12 third-placed teams — ${name} is ${place} of those 12 right now, just outside the top 8, so it needs a third-placed team above it to slip as the remaining groups play${!groupDone && oppName ? ` (plays ${oppName} next)` : ''}.`,
        }
  }

  return {
    tone: 'out',
    short: groupDone ? 'Eliminated' : 'Long shot',
    detail: groupDone
      ? `Finished bottom of Group ${groupLetter} — out of the tournament.`
      : `${ordinal(rank)} in Group ${groupLetter} — would need to win its last game and overturn goal difference.`,
  }
}

// Lightweight status lookup the panel uses to drop eliminated teams (mirrors what
// FollowedTeam computes for itself, just enough to read the tone).
function followedQual(abbrev, matches, groups, thirds) {
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
  const first = matches.find((m) => m.home.abbrev === abbrev || m.away.abbrev === abbrev)
  const self = first ? (first.home.abbrev === abbrev ? first.home : first.away) : null
  const teamId = self?.id ?? standing?.id ?? null
  return knockoutStatus({ teamId, name: self?.name ?? abbrev, standing, groupLetter, matches, thirds })
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

// Live minute that advances locally between the 60s data refreshes so the clock
// visibly moves. Only ticks a plain running minute ("47'"); halftime, stoppage
// ("45'+2'") and extra time are shown verbatim from ESPN.
function useLiveClock(m) {
  const base = m.clock || ''
  const plain = /^\d+'$/.test(base)
  const [seenBase, setSeenBase] = useState(base)
  const [tick, setTick] = useState(0)
  if (base !== seenBase) {
    setSeenBase(base)
    setTick(0)
  }
  useEffect(() => {
    if (m.state !== 'in' || !plain) return
    const id = setInterval(() => setTick((t) => Math.min(t + 1, 2)), 60000)
    return () => clearInterval(id)
  }, [m.state, plain, base])
  if (m.state !== 'in' || !plain) return base
  return `${parseInt(base, 10) + tick}'`
}

function StatusPill({ m }) {
  const clock = useLiveClock(m)
  if (m.state === 'in') {
    const half = /ht|half/i.test(m.statusDetail || '')
    return (
      <span
        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
          half ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'
        }`}
      >
        {!half && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />}
        {half ? 'HALFTIME' : clock || 'LIVE'}
      </span>
    )
  }
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
      <div className="flex flex-wrap items-baseline justify-center gap-x-1">
        <span
          className={`text-center text-xs leading-tight ${
            winner ? 'font-bold text-slate-100' : dim ? 'text-slate-500' : 'text-slate-200'
          }`}
        >
          {team.shortName || team.name}
        </span>
        <FifaRank abbrev={team.abbrev} bare className="text-[10px]" />
      </div>
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
        .slice(-5)
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

// Goals + cards for a live or finished match, taken straight from the scoreboard
// `details` (which refreshes every 60s — so a live game's timeline fills in as it
// happens, no extra request). Same who-scored-when info the recaps show.
function EventTimeline({ m, live }) {
  const events = (m.details ?? []).filter((d) => d.scoringPlay || /card/i.test(d.type))
  if (events.length === 0) return null
  const abbrFor = (id) =>
    id === m.home.id ? m.home.abbrev : id === m.away.id ? m.away.abbrev : ''
  const icon = (d) => {
    if (d.scoringPlay) return '⚽'
    if (/red/i.test(d.type)) return '🟥'
    if (/yellow/i.test(d.type)) return '🟨'
    return '•'
  }
  return (
    <ul className="mt-2 space-y-0.5 border-t border-slate-800 pt-2 text-[11px] text-slate-400">
      {events.map((d, i) => {
        // On a live game, spotlight the most recent event ("latest action").
        const latest = live && i === events.length - 1
        return (
          <li
            key={i}
            className={`flex items-baseline gap-1.5 ${latest ? '-mx-1 rounded bg-emerald-950/50 px-1 py-0.5' : ''}`}
          >
            <span className="w-3 shrink-0 text-center">{icon(d)}</span>
            <span className="w-11 shrink-0 tabular-nums text-slate-500">{d.minute}</span>
            <span className={`min-w-0 truncate ${latest ? 'font-semibold text-emerald-300' : 'text-slate-300'}`}>
              {d.scorer || d.type}
              {d.scoringPlay && d.penalty ? ' (P)' : ''}
              {d.ownGoal ? ' (OG)' : ''}
            </span>
            {abbrFor(d.teamId) && (
              <span className="ml-auto shrink-0 font-medium text-slate-500">{abbrFor(d.teamId)}</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

// Live (or final) team stats bars — possession, shots, on-target, corners — from
// the summary boxscore. Home = emerald (left), away = sky (right).
function LiveStats({ stats }) {
  if (!stats?.home || !stats?.away) return null
  const num = (v) => {
    const n = parseInt(v, 10)
    return Number.isFinite(n) ? n : 0
  }
  const rows = [
    { label: 'Possession', h: stats.home.possession, a: stats.away.possession, pct: true },
    { label: 'Shots', h: stats.home.shots, a: stats.away.shots },
    { label: 'On target', h: stats.home.onTarget, a: stats.away.onTarget },
    { label: 'Corners', h: stats.home.corners, a: stats.away.corners },
  ].filter((r) => r.h != null || r.a != null)
  if (rows.length === 0) return null
  return (
    <div className="mt-2 space-y-1.5 border-t border-slate-800 pt-2">
      {rows.map((r) => {
        const h = num(r.h)
        const a = num(r.a)
        const share = r.pct
          ? Math.max(0, Math.min(100, h))
          : h + a > 0
            ? Math.round((h / (h + a)) * 100)
            : 50
        return (
          <div key={r.label}>
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="w-8 text-left font-semibold tabular-nums text-slate-200">{r.h ?? '–'}</span>
              <span className="uppercase tracking-wide">{r.label}</span>
              <span className="w-8 text-right font-semibold tabular-nums text-slate-200">{r.a ?? '–'}</span>
            </div>
            <div className="mt-0.5 flex h-1.5 overflow-hidden rounded-full bg-slate-700">
              <div className="bg-emerald-500" style={{ width: `${share}%` }} />
              <div className="bg-sky-500" style={{ width: `${100 - share}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// 3-way moneyline (+ total goals) from ESPN's pickcenter book. Informational —
// shows the prices and the provider, no bet links.
function OddsRow({ odds, home, away }) {
  if (!odds || (!odds.home && !odds.draw && !odds.away)) return null
  const cell = (label, val) => (
    <span className="flex items-baseline gap-1">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold tabular-nums text-slate-200">{val ?? '–'}</span>
    </span>
  )
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-800 pt-2 text-[11px] text-slate-400">
      <span title={odds.provider ? `Moneyline · ${odds.provider}` : 'Moneyline'}>💰</span>
      {cell(home.abbrev || 'Home', odds.home)}
      {cell('Draw', odds.draw)}
      {cell(away.abbrev || 'Away', odds.away)}
      {odds.total != null && cell('O/U', odds.total)}
    </div>
  )
}

// Fixture card with an always-visible preview: venue, TV and what's at stake, plus
// (for upcoming games) recent form + head-to-head from the match summary.
function FixtureCard({ m, group, standingMap, summary }) {
  const pre = m.state === 'pre'
  const live = m.state === 'in'
  const upset = upsetKind(m)
  const showStanding = m.round === 'group-stage'
  const where = [m.venue, m.city].filter(Boolean).join(', ')
  const form = summary?.form
  const hasForm = pre && form && (form[m.home.id] || form[m.away.id])
  const hasPreview = where || m.tv || hasForm

  // Goal celebration: when the combined score ticks up on a live game, flash the
  // card + pop a GOAL! banner. Detect during render (previous-value pattern);
  // a timer clears it (setState only inside the timeout, never synchronously).
  const goalTotal = (Number(m.home.score) || 0) + (Number(m.away.score) || 0)
  const [seenTotal, setSeenTotal] = useState(goalTotal)
  const [celebrate, setCelebrate] = useState(false)
  if (goalTotal !== seenTotal) {
    if (live && goalTotal > seenTotal) setCelebrate(true)
    setSeenTotal(goalTotal)
  }
  useEffect(() => {
    if (!celebrate) return
    const t = setTimeout(() => setCelebrate(false), 3500)
    return () => clearTimeout(t)
  }, [celebrate])

  return (
    <div
      className={`group relative flex flex-col rounded-xl border bg-slate-900/40 p-3 transition duration-150 hover:-translate-y-0.5 hover:bg-slate-900 hover:shadow-lg hover:shadow-black/30 ${
        celebrate ? 'goal-flash ' : ''
      }${
        live
          ? 'live-row border-emerald-500/60'
          : upset
            ? 'border-amber-500/40'
            : 'border-slate-800 hover:border-emerald-600/50'
      }`}
    >
      {celebrate && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <span className="goal-pop rounded-full bg-emerald-500 px-4 py-1.5 text-lg font-extrabold text-white shadow-lg shadow-emerald-900/50">
            ⚽ GOAL!
          </span>
        </div>
      )}
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
          {m.round && m.round !== 'group-stage' ? (
            <span className="font-semibold text-amber-300">⚔️ {KO_ROUND_NAME[m.round] ?? 'Knockout'} · elimination</span>
          ) : group ? (
            `Group ${group}`
          ) : (
            'Match'
          )}
          {m.number ? <span className="text-slate-500"> · Match {m.number}</span> : null}
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

      {(m.state === 'in' || m.state === 'post') && <EventTimeline m={m} live={live} />}

      {live && <LiveStats stats={summary?.stats} />}

      {pre && (
        <div className="mt-2 text-center text-[11px] font-medium text-emerald-400/80">
          ⏱ kicks off {kickoffCountdown(m.date)}
        </div>
      )}
      {upset && (
        <div className="mt-2 text-center text-[11px] font-semibold text-amber-400">⚡ {upset.text}</div>
      )}

      {hasPreview && (
        <div className="mt-2 flex flex-wrap items-start justify-between gap-x-4 gap-y-1 border-t border-slate-800 pt-2 text-[11px] text-slate-400">
          <div className="min-w-0 flex-1 space-y-1">
            {where && <div>📍 {where}</div>}
            {m.tv && <div>📺 {m.tv}</div>}
          </div>
          {hasForm && (
            <div className="shrink-0 space-y-0.5">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Recent form</div>
              <FormChips label={m.home.abbrev} games={form[m.home.id]} />
              <FormChips label={m.away.abbrev} games={form[m.away.id]} />
            </div>
          )}
        </div>
      )}

      {(pre || live) && <OddsRow odds={summary?.odds} home={m.home} away={m.away} />}
    </div>
  )
}

// "What to watch" ordering: live first, then upcoming, then finished.
const STATE_RANK = { in: 0, pre: 1, post: 2 }
const byWatchOrder = (a, b) => STATE_RANK[a.state] - STATE_RANK[b.state] || a.date - b.date

function Scores({ title, matches, groupMap, standingMap, highlight = false }) {
  // Pull summaries for upcoming games so each card can show form + head-to-head
  // (keyed by match-id set, so it only refetches when the slate changes).
  const summaries = useMatchSummaries(matches.filter((m) => m.state === 'pre' || m.state === 'in'))
  if (matches.length === 0) return null
  const ordered = [...matches].sort(byWatchOrder)
  const grid = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {ordered.map((m) => (
        <FixtureCard key={m.id} m={m} group={groupMap[m.home.id]} standingMap={standingMap} summary={summaries[m.id]} />
      ))}
    </div>
  )
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-slate-400 uppercase">
        {title}
      </h2>
      {highlight ? (
        <div className="today-box rounded-2xl border border-emerald-500/40 bg-emerald-950/15 p-2.5 sm:p-3">
          {grid}
        </div>
      ) : (
        grid
      )}
    </section>
  )
}

// Single-serving "Is the war with Iran over?" indicator for the Iran popout.
// Three honest states; the answer is sourced + dated, with a live-coverage link
// that's always current even if our snapshot lags. See ../data/iranWarStatus.js.
const WAR_STATES = {
  over: { answer: 'YES', sub: "it's over", badge: 'bg-emerald-500 text-white', frame: 'border-emerald-600/40 bg-emerald-950/30' },
  active: { answer: 'NO', sub: 'active war', badge: 'bg-rose-600 text-white', frame: 'border-rose-700/40 bg-rose-950/30' },
  ceasefire: { answer: 'FRAGILE CEASEFIRE', sub: 'holding, but shaky', badge: 'bg-amber-500 text-slate-900', frame: 'border-amber-600/40 bg-amber-950/20' },
}

function WarStatus() {
  const [open, setOpen] = useState(false)
  const s = WAR_STATES[IRAN_WAR_STATUS.state] ?? WAR_STATES.ceasefire
  const asOf = new Date(`${IRAN_WAR_STATUS.asOf}T00:00:00`).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return (
    <div className="mt-3 border-t border-emerald-800/30 pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400/80"
      >
        🕊️ Is the war with Iran over?
        <span className={`ml-auto transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div className={`mt-2 rounded-lg border p-3 text-center ${s.frame}`}>
          <div className={`inline-block rounded-md px-3 py-1 text-lg font-extrabold tracking-wide ${s.badge}`}>
            {s.answer}
          </div>
          <div className="mt-1 text-xs text-slate-400">{s.sub}</div>
          <div className="mt-2 text-[10px] text-slate-500">
            as of {asOf} ·{' '}
            <a
              href={IRAN_WAR_STATUS.source}
              target="_blank"
              rel="noreferrer"
              className="text-sky-300/90 underline hover:text-sky-200"
            >
              live coverage →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

// Single-serving flavor popout for the Norway Following row: the viral Viking
// "Ro!" (row) chant. Sourced; mirrors the Iran war-status popout pattern.
function NorwayChant() {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-3 border-t border-emerald-800/30 pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400/80"
      >
        🚣 The Viking "Ro!" chant
        <span className={`ml-auto transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="mt-2 rounded-lg border border-emerald-600/30 bg-emerald-950/20 p-3 text-xs leading-snug text-slate-300">
          Norway's first World Cup in 28 years comes with the tournament's coolest terrace moment:
          thousands of fans chant <span className="font-semibold text-slate-100">"Ro!"</span> — Norwegian
          for <span className="italic">row</span> — rocking in unison to a drumbeat like a Viking longship
          crew, capped with a deep <span className="font-semibold text-slate-100">"HUH!"</span>. Created by
          the official supporters' club Oljeberget to make a statement at the 2026 finals.
          <div className="mt-2 text-[10px] text-slate-500">
            <a
              href="https://sports.yahoo.com/articles/norways-soccer-chant-explained-history-100001580.html"
              target="_blank"
              rel="noreferrer"
              className="text-sky-300/90 underline hover:text-sky-200"
            >
              the story behind it →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

// Tight, collapsed-by-default panel for the teams the user follows. Each team is
// a single header row (logo · name · standing); tap to expand its fixtures +
// headlines. Keeps the top of the Today tab compact since this data is static.
function FollowingPanel({ abbrevs, matches, groups }) {
  const thirds = useMemo(() => buildThirdPlaceRace(groups), [groups])
  const present = abbrevs.filter((a) =>
    matches.some((m) => m.home.abbrev === a || m.away.abbrev === a),
  )
  // Knockouts are win-or-go-home: drop a followed team once it's eliminated, so the
  // panel narrows to who's still alive and hides entirely when they're all out.
  const alive = present.filter((a) => followedQual(a, matches, groups, thirds)?.tone !== 'out')
  if (alive.length === 0) return null
  return (
    <section className="mb-8">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-400/80">
        ★ Following
      </div>
      <div className="divide-y divide-emerald-800/30 overflow-hidden rounded-xl border border-emerald-700/40 bg-gradient-to-br from-emerald-950/30 to-slate-900/40">
        {alive.map((a) => (
          <FollowedTeam key={a} abbrev={a} matches={matches} groups={groups} thirds={thirds} />
        ))}
      </div>
    </section>
  )
}

// One collapsible team row inside FollowingPanel. Collapsed shows just the badge
// row (with a LIVE chip if they're playing now); expanded reveals fixtures +
// headlines. Auto-expands when the team goes live so a live game isn't buried.
function FollowedTeam({ abbrev, matches, groups, thirds = [] }) {
  const [news, setNews] = useState([])
  // null = follow the default (open iff live); a click pins it to a boolean.
  const [override, setOverride] = useState(null)
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
  const selfOf = (m) => (m.home.abbrev === abbrev ? m.home : m.away)
  const oppOf = (m) => (m.home.abbrev === abbrev ? m.away : m.home)
  const me = mine.length ? selfOf(mine.find((m) => selfOf(m).logo) ?? mine[0]) : null
  const teamId = me?.id ?? standing?.id ?? null
  const hasLive = mine.some((m) => m.state === 'in')
  const qual = knockoutStatus({ teamId, name: me?.name ?? abbrev, standing, groupLetter, matches, thirds })
  // Next knockout fixture for this team (drives the at-a-glance pill in the KO phase).
  const nextKO = mine
    .filter((m) => m.round !== 'group-stage' && m.state !== 'post')
    .sort((a, b) => a.date - b.date)[0]
  const koOpp = nextKO ? (nextKO.home.abbrev === abbrev ? nextKO.away : nextKO.home) : null
  const koOppName = koOpp ? koOpp.shortName || koOpp.name : ''
  const koDate = nextKO
    ? nextKO.date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
    : ''

  // Team-specific ESPN headlines for this row (USMNT, Iran, …). Best-effort —
  // a failure just leaves the row without a headlines section.
  useEffect(() => {
    if (!teamId) return
    let alive = true
    fetchTeamNews(teamId)
      .then((n) => alive && setNews(n))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [teamId])

  // Open by default while the team is live (so a live game isn't buried); a
  // manual toggle overrides that default until the next render-driven change.
  const open = override ?? hasLive

  if (mine.length === 0) return null

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
    <div>
      <button
        type="button"
        onClick={() => setOverride(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-emerald-900/15"
      >
        {me.logo && <img src={me.logo} alt="" className="h-7 w-7 shrink-0 object-contain" />}
        <div className="min-w-0">
          <div className="text-sm font-bold text-slate-100">{me.name}</div>
          {standing && (
            <div className="text-xs text-slate-400">
              Group {groupLetter} · {ordinal(standing.rank)} · {standing.points} pts · {standing.wins}-{standing.draws}-{standing.losses}
            </div>
          )}
          {qual && (
            <span
              className={`mt-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${QUAL_TONE[qual.tone].pill}`}
            >
              {qual.tone === 'champ'
                ? '🏆 Champions'
                : nextKO
                  ? `⚔️ ${KO_ROUND_NAME[nextKO.round]} · vs ${koOppName} · ${koDate}`
                  : `${QUAL_TONE[qual.tone].icon} ${qual.short}`}
            </span>
          )}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {live && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              LIVE
            </span>
          )}
          <span className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3">
          {qual && (
            <div className="border-t border-emerald-800/30 pt-3 text-xs leading-snug">
              <span className="font-semibold text-slate-200">{QUAL_TONE[qual.tone].icon} Knockout: </span>
              <span className="text-slate-400">{qual.detail}</span>
            </div>
          )}
          <div className="mt-3 space-y-1 border-t border-emerald-800/30 pt-3 text-sm text-slate-300">
            {live && <div>{renderFixture(live, 'live')}</div>}
            {next && <div>{renderFixture(next, 'next')}</div>}
            {last && <div>{renderFixture(last, 'last')}</div>}
          </div>
          {news.length > 0 && (
            <div className="mt-3 border-t border-emerald-800/30 pt-3">
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400/80">
                📰 {me.name} headlines
              </div>
              <ul className="space-y-1.5">
                {news.slice(0, 4).map((a) => (
                  <li key={a.id}>
                    <a
                      href={a.link}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-sm leading-snug text-sky-300/90 hover:text-sky-200 hover:underline"
                    >
                      {a.headline}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {abbrev === 'IRN' && <WarStatus />}
          {abbrev === 'NOR' && <NorwayChant />}
        </div>
      )}
    </div>
  )
}

// Transition callout that fires the moment the group stage finishes (data-driven —
// all 72 group fixtures final), pointing people to the now-meaningful bracket. Big
// and friendly for the top of Today; dismissible once per device so it nudges, then
// gets out of the way.
function KnockoutBanner({ matches, onGoToBracket }) {
  const KEY = 'wc_knockout_banner_2026'
  const [dismissed, setDismissed] = useState(
    () => typeof localStorage !== 'undefined' && localStorage.getItem(KEY) === '1',
  )
  if (dismissed || !groupStageComplete(matches)) return null
  const dismiss = (e) => {
    e.stopPropagation()
    setDismissed(true)
    localStorage.setItem(KEY, '1')
  }
  return (
    <div className="mb-6 flex items-stretch overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-emerald-500/10">
      <button
        type="button"
        onClick={onGoToBracket}
        className="flex flex-1 items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
      >
        <span className="text-2xl" aria-hidden>🏆</span>
        <span className="min-w-0">
          <span className="block font-bold text-amber-200">The Round of 32 is set</span>
          <span className="block text-sm text-slate-300">
            Group stage's done — the bracket is live. Tap to see who plays who →
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 px-3 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200"
      >
        ✕
      </button>
    </div>
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

export default function Today({ matches, groupMap, groups, news = [], onGoToBracket }) {
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
      {/* ── Transient "what's new" toast (once per device, auto-dismisses) ── */}
      <WhatsNew />

      {/* ── Group-stage-over → bracket nudge (fires when all 72 group games are final) ── */}
      <KnockoutBanner matches={matches} onGoToBracket={onGoToBracket} />

      {/* ── Big "teams still alive" counter (knockout phase) ── */}
      <TeamsLeft matches={matches} />

      {/* ── Followed teams, pinned (USA, Iran, Norway) — compact collapsible rows ── */}
      <FollowingPanel abbrevs={['USA', 'IRN', 'NOR']} matches={matches} groups={groups} />

      {/* ── Today's fixtures (or the next slate on off-days) ── */}
      {todayMatches.length > 0 ? (
        <Scores
          title={`⚽ Today · ${dateLabel(now)}`}
          matches={todayMatches}
          groupMap={groupMap}
          standingMap={standingMap}
          highlight
        />
      ) : nextDayMatches.length > 0 ? (
        <Scores
          title={`⏭ Next up · ${nextLabel}`}
          matches={nextDayMatches}
          groupMap={groupMap}
          standingMap={standingMap}
        />
      ) : null}

      {tournamentOver && (
        <p className="py-16 text-center text-slate-500">
          No upcoming matches — the tournament is over.
        </p>
      )}

      {/* ── Title race (Polymarket championship odds) ── */}
      <TitleRace />

      {/* ── Latest results ── */}
      <LatestResults matches={recapMatches} standingMap={standingMap} />

      {/* ── News last ── */}
      <News previews={previews} headlines={headlineItems} />

      <Explainer />
    </div>
  )
}
