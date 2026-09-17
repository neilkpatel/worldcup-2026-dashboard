// Snapshot ESPN's tournament data into public/espn-archive.json.
//
//   npm run archive
//
// Why this exists: on 9/17/26 ESPN started rejecting the scoreboard date-range query
// the dashboard had used all tournament long, and every tab rendered empty behind a
// "Couldn't reach ESPN" banner. The World Cup is over, so the data is final and there
// is no reason for the site to depend on a third-party API staying reachable. api.js
// falls back to this file whenever the live calls fail, so the dashboard always fills.
//
// Re-run only if you want to refresh the archived copy (e.g. ESPN backfills something).
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, 'public/espn-archive.json')

const SOURCES = {
  scoreboard:
    'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=2026&limit=200',
  standings:
    'https://site.web.api.espn.com/apis/v2/sports/soccer/fifa.world/standings?season=2026',
  news: 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/news?limit=50',
}

const archive = { archivedAt: new Date().toISOString(), source: 'ESPN unofficial API' }

for (const [key, url] of Object.entries(SOURCES)) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${key}: HTTP ${res.status}`)
  archive[key] = await res.json()
}

const events = archive.scoreboard.events ?? []
const groups = archive.standings.children ?? []
const finished = events.filter((e) => e.status?.type?.state === 'post').length
// A half-fetched archive is worse than none, since it would silently replace a real
// tournament with a fragment. 104 matches, 12 groups, all final.
if (events.length !== 104) throw new Error(`expected 104 matches, got ${events.length}`)
if (groups.length !== 12) throw new Error(`expected 12 groups, got ${groups.length}`)
if (finished !== events.length) throw new Error(`${events.length - finished} matches not final`)

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify(archive))
const kb = (JSON.stringify(archive).length / 1024).toFixed(0)
console.log(`archived ${events.length} matches, ${groups.length} groups, ${archive.news.articles?.length ?? 0} headlines -> public/espn-archive.json (${kb} KB)`)
