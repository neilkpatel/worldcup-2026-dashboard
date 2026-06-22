import { useEffect, useMemo, useState } from 'react'
import {
  PICKS_ENABLED,
  getClientId,
  getName,
  setName as persistName,
  fetchPicks,
  savePick,
  matchResult,
  buildLeaderboard,
} from '../lib/picks'

const REFRESH_MS = 45_000

const dayLabel = (d) =>
  d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
const timeLabel = (d) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
// Group by LOCAL calendar day (matches dayLabel); toISOString would key by UTC
// and split a single local evening across two buckets.
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

// A team is "real" (pickable) once it's not a knockout placeholder like
// "Winner Group A" — those have no abbreviation yet.
const isReal = (m) => Boolean(m.home.abbrev && m.away.abbrev)

function TeamCell({ team, align = 'left' }) {
  return (
    <span className={`flex items-center gap-1.5 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
      {team.logo && <img src={team.logo} alt="" className="h-5 w-5 shrink-0 object-contain" />}
      <span className="truncate text-sm font-medium text-slate-200">{team.abbrev || team.name}</span>
    </span>
  )
}

// One match row with Home / Draw / Away buttons. Locks once kicked off.
function PickRow({ m, group, mine, onPick, saving }) {
  const locked = m.state !== 'pre' || m.date <= new Date()
  const result = matchResult(m)
  const allowDraw = m.round === 'group-stage'
  const opts = allowDraw ? ['home', 'draw', 'away'] : ['home', 'away']

  const btn = (key) => {
    const picked = mine === key
    const isResult = result === key
    const correct = result && mine === result
    let cls =
      'flex-1 rounded-md px-2 py-2 text-xs font-semibold transition-colors disabled:cursor-default '
    if (picked) {
      cls += locked
        ? result
          ? correct
            ? 'bg-emerald-600 text-white'
            : 'bg-rose-600/80 text-white'
          : 'bg-emerald-700/70 text-white'
        : 'bg-emerald-600 text-white'
    } else if (locked && isResult) {
      cls += 'bg-slate-700 text-slate-200 ring-1 ring-emerald-500/40'
    } else {
      cls += 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
    }
    const label =
      key === 'draw'
        ? 'Draw'
        : key === 'home'
          ? m.home.abbrev || 'Home'
          : m.away.abbrev || 'Away'
    return (
      <button key={key} type="button" disabled={locked || saving} onClick={() => onPick(key)} className={cls}>
        {label}
      </button>
    )
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-2">
          <TeamCell team={m.home} />
          <span className="text-[11px] font-semibold tabular-nums text-slate-500">
            {m.state === 'post' ? `${m.home.score}–${m.away.score}` : 'v'}
          </span>
          <TeamCell team={m.away} align="right" />
        </div>
      </div>
      <div className="flex items-center gap-1.5">{opts.map(btn)}</div>
      <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
        <span>
          {group ? `Group ${group}` : 'Knockout'} · {timeLabel(m.date)}
        </span>
        {m.state === 'post' ? (
          <span className={mine ? (mine === result ? 'text-emerald-400' : 'text-rose-400') : ''}>
            {mine ? (mine === result ? '✓ +1' : '✗ 0') : 'Final'}
          </span>
        ) : locked ? (
          <span className="text-amber-400">🔒 locked</span>
        ) : mine ? (
          <span className="text-emerald-400">✓ picked</span>
        ) : (
          <span>tap to pick</span>
        )}
      </div>
    </div>
  )
}

function Leaderboard({ rows, clientId }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-6 text-center text-sm text-slate-500">
        No picks yet — be the first on the board.
      </p>
    )
  }
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-900 text-[10px] uppercase tracking-wide text-slate-500">
            <th className="px-3 py-2 text-left font-semibold">#</th>
            <th className="px-3 py-2 text-left font-semibold">Player</th>
            <th className="px-3 py-2 text-right font-semibold">Pts</th>
            <th className="px-3 py-2 text-right font-semibold">Correct</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const me = r.clientId === clientId
            return (
              <tr
                key={r.clientId}
                className={`border-t border-slate-800 ${me ? 'bg-emerald-950/40' : 'odd:bg-slate-900/30'}`}
              >
                <td className="px-3 py-2 text-slate-400 tabular-nums">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </td>
                <td className="px-3 py-2 font-medium text-slate-200">
                  {r.name || 'Anon'} {me && <span className="text-[10px] text-emerald-400">(you)</span>}
                </td>
                <td className="px-3 py-2 text-right font-bold tabular-nums text-slate-100">{r.points}</td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-400">
                  {r.correct}/{r.decided}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function PickEm({ matches, groupMap }) {
  const clientId = useMemo(() => (PICKS_ENABLED ? getClientId() : ''), [])
  const [name, setNameState] = useState(getName)
  const [nameInput, setNameInput] = useState('')
  const [picks, setPicks] = useState([])
  const [savingId, setSavingId] = useState(null)
  const [error, setError] = useState(null)

  const refresh = () =>
    fetchPicks()
      .then(setPicks)
      .catch(() => setError('Could not reach the leaderboard.'))

  useEffect(() => {
    if (!PICKS_ENABLED) return
    refresh()
    const t = setInterval(refresh, REFRESH_MS)
    return () => clearInterval(t)
  }, [])

  const myPicks = useMemo(() => {
    const map = {}
    for (const p of picks) if (p.client_id === clientId) map[p.match_id] = p.pick
    return map
  }, [picks, clientId])

  const leaderboard = useMemo(() => buildLeaderboard(picks, matches), [picks, matches])
  const me = leaderboard.find((r) => r.clientId === clientId)

  if (!PICKS_ENABLED) {
    return (
      <p className="py-16 text-center text-slate-500">
        Pick'em isn't connected yet — check back soon.
      </p>
    )
  }

  if (!name) {
    return (
      <div className="mx-auto max-w-sm py-12 text-center">
        <div className="mb-2 text-4xl">🎯</div>
        <h2 className="text-lg font-bold text-slate-100">Join the Pick'em</h2>
        <p className="mt-1 mb-5 text-sm text-slate-400">
          Pick the winner of every match. +1 point each time you're right. No sign-up — just a name.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const v = nameInput.trim()
            if (!v) return
            persistName(v)
            setNameState(v)
          }}
          className="flex gap-2"
        >
          <input
            autoFocus
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            maxLength={24}
            placeholder="Your name"
            className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Join
          </button>
        </form>
      </div>
    )
  }

  const now = new Date()
  const upcoming = matches
    .filter((m) => m.state === 'pre' && m.date > now && isReal(m))
    .sort((a, b) => a.date - b.date)
  const myFinished = matches
    .filter((m) => m.state === 'post' && myPicks[m.id])
    .sort((a, b) => b.date - a.date)

  // Group upcoming picks by day for a readable sheet.
  const days = []
  for (const m of upcoming) {
    const k = dayKey(m.date)
    let bucket = days.find((d) => d.key === k)
    if (!bucket) {
      bucket = { key: k, label: dayLabel(m.date), items: [] }
      days.push(bucket)
    }
    bucket.items.push(m)
  }

  const onPick = (m, pick) => {
    setSavingId(m.id)
    setPicks((prev) => {
      const rest = prev.filter((p) => !(p.client_id === clientId && p.match_id === m.id))
      return [...rest, { client_id: clientId, name, match_id: m.id, pick, updated_at: new Date().toISOString() }]
    })
    savePick({ clientId, name, matchId: m.id, pick })
      .then(refresh)
      .catch(() => setError('Pick didn’t save — try again.'))
      .finally(() => setSavingId(null))
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">🏆 Leaderboard</h2>
          <span className="text-xs text-slate-500">
            Playing as <span className="font-semibold text-emerald-400">{name}</span>
            {me ? ` · ${me.points} pts · ${me.correct}/${me.decided}` : ''}
          </span>
        </div>
        <Leaderboard rows={leaderboard} clientId={clientId} />
      </section>

      {error && <p className="text-center text-xs text-rose-400">{error}</p>}

      <section>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-400">⚽ Your picks</h2>
        <p className="mb-3 text-xs text-slate-500">Picks lock at kickoff. Tap to change before then.</p>
        {upcoming.length === 0 ? (
          <p className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-6 text-center text-sm text-slate-500">
            No upcoming matches to pick right now.
          </p>
        ) : (
          <div className="space-y-5">
            {days.map((d) => (
              <div key={d.key}>
                <div className="mb-2 text-xs font-semibold text-slate-400">{d.label}</div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {d.items.map((m) => (
                    <PickRow
                      key={m.id}
                      m={m}
                      group={groupMap[m.home.id]}
                      mine={myPicks[m.id]}
                      saving={savingId === m.id}
                      onPick={(pick) => onPick(m, pick)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {myFinished.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">📋 Your results</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {myFinished.map((m) => (
              <PickRow key={m.id} m={m} group={groupMap[m.home.id]} mine={myPicks[m.id]} onPick={() => {}} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
