// Pick'em data layer. Talks to Supabase's REST endpoint with plain fetch (the
// supabase-js client can stall on unauthenticated calls — see project notes), so
// there are zero extra deps. The anon key is public by design; row-level security
// on `worldcup_picks` only permits reading + inserting/updating pick rows.
//
// URL + anon key are filled in once the backend project is chosen. They're safe
// to commit — anon keys are meant to ship to the browser.
const SUPABASE_URL = 'https://hufgsqlyaolefwhtvbub.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1ZmdzcWx5YW9sZWZ3aHR2YnViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMzYzNTgsImV4cCI6MjA5NzcxMjM1OH0.acFeiSkSk9Xn89mnVP0hEZwWWGLi5S46hhdDz3wvs6I'

export const PICKS_ENABLED =
  !SUPABASE_URL.startsWith('__') && !SUPABASE_ANON_KEY.startsWith('__')

const REST = `${SUPABASE_URL}/rest/v1/worldcup_picks`
const HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
}

// "No account" identity: a random device id + a display name, both in
// localStorage. The id lets someone edit their own picks across reloads without
// ever signing up.
export function getClientId() {
  let id = localStorage.getItem('wc_pick_client')
  if (!id) {
    id = crypto.randomUUID?.() ?? `c_${Math.random().toString(36).slice(2)}${Date.now()}`
    localStorage.setItem('wc_pick_client', id)
  }
  return id
}
export function getName() {
  return localStorage.getItem('wc_pick_name') || ''
}
export function setName(name) {
  localStorage.setItem('wc_pick_name', name.trim())
}

// Every pick row in the pool (small table — one row per player per match).
export async function fetchPicks() {
  if (!PICKS_ENABLED) return []
  const res = await fetch(`${REST}?select=client_id,name,match_id,pick,updated_at`, {
    headers: HEADERS,
  })
  if (!res.ok) throw new Error(`picks fetch failed: ${res.status}`)
  return res.json()
}

// Upsert a single pick (unique on client_id+match_id), so re-picking overwrites.
export async function savePick({ clientId, name, matchId, pick }) {
  if (!PICKS_ENABLED) return
  const row = {
    client_id: clientId,
    name,
    match_id: matchId,
    pick,
    updated_at: new Date().toISOString(),
  }
  const res = await fetch(`${REST}?on_conflict=client_id,match_id`, {
    method: 'POST',
    headers: { ...HEADERS, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(row),
  })
  if (!res.ok) throw new Error(`save pick failed: ${res.status}`)
}

// 'home' | 'draw' | 'away' once a match is final, else null.
export function matchResult(m) {
  if (m.state !== 'post') return null
  if (m.home.winner) return 'home'
  if (m.away.winner) return 'away'
  return 'draw'
}

// Roll every pick row up into a ranked leaderboard. +1 point per correct result.
// Players are keyed by client_id; the most-recently-used display name wins, so a
// rename doesn't split someone into two rows.
export function buildLeaderboard(picks, matches) {
  const resultById = {}
  for (const m of matches) {
    const r = matchResult(m)
    if (r) resultById[m.id] = r
  }
  const byClient = {}
  for (const p of picks) {
    const e = (byClient[p.client_id] ??= {
      clientId: p.client_id,
      name: p.name,
      latestName: '',
      points: 0,
      correct: 0,
      decided: 0,
      total: 0,
    })
    e.total++
    if (!e.latestName || p.updated_at > e.latestName) {
      e.latestName = p.updated_at
      e.name = p.name
    }
    const r = resultById[p.match_id]
    if (r) {
      e.decided++
      if (r === p.pick) {
        e.correct++
        e.points++
      }
    }
  }
  return Object.values(byClient).sort(
    (a, b) =>
      b.points - a.points || b.correct - a.correct || (a.name || '').localeCompare(b.name || ''),
  )
}
