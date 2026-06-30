// Lightweight visit counter for the hidden "owner stats" panel (unlock: tap the
// ⚽ logo 5×). Reuses the same public Supabase project + anon key as Pick'em —
// see src/lib/picks.js. Writes go through the SECURITY DEFINER `track_visit`
// RPC (anon can't touch the table directly); reads are an open SELECT on the
// aggregate-only `site_visits` table (day / views / uniques — nothing sensitive).
const SUPABASE_URL = 'https://hufgsqlyaolefwhtvbub.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1ZmdzcWx5YW9sZWZ3aHR2YnViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMzYzNTgsImV4cCI6MjA5NzcxMjM1OH0.acFeiSkSk9Xn89mnVP0hEZwWWGLi5S46hhdDz3wvs6I'

const HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
}

const todayKey = () => new Date().toISOString().slice(0, 10) // YYYY-MM-DD (UTC)

// Count this page load. `is_unique` is true the first time a device shows up on
// a given day, so `uniques` tracks unique-devices/day while `views` is raw
// pageviews. Fire-and-forget: a counter must never break the dashboard.
export async function trackVisit() {
  if (typeof localStorage === 'undefined') return
  const flag = `wc_visit_${todayKey()}`
  const isUnique = !localStorage.getItem(flag)
  if (isUnique) localStorage.setItem(flag, '1')
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/track_visit`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ is_unique: isUnique }),
      keepalive: true,
    })
  } catch {
    /* offline / file:// — no-op */
  }
}

// Pull the full daily series (one tiny row per day) for the stats panel.
// Returns [{ day, views, uniques }] ascending, or [] on any failure.
export async function fetchVisitStats() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/site_visits?select=day,views,uniques&order=day.asc`,
      { headers: HEADERS },
    )
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}
