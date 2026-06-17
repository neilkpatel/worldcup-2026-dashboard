#!/usr/bin/env node
// Generates Claude-written per-match verdicts (was it deserved? what decided it?
// what does it reveal?) for the 2026 World Cup dashboard, cached in
// src/data/reports.json keyed by ESPN event id.
//
// Re-runnable + incremental — only (re)does matches that are new or whose score
// changed. Self-contained: talks to ESPN + Claude directly.
//
//   ANTHROPIC_API_KEY=... npm run reports            # fill in what's new
//   ANTHROPIC_API_KEY=... npm run reports -- --force # regenerate everything

import { writeFile, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import Anthropic from '@anthropic-ai/sdk'

const MODEL = 'claude-haiku-4-5' // analysis is well within Haiku; ~free per match
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const REPORTS = join(ROOT, 'src', 'data', 'reports.json')
const BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world'
const STANDINGS = 'https://site.web.api.espn.com/apis/v2/sports/soccer/fifa.world/standings?season=2026'

const force = process.argv.includes('--force')

async function getJSON(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json()
}

const stripHtml = (s) => (s ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
const scoreOf = (e) => {
  const c = e.competitions[0].competitors
  return `${c.find((x) => x.homeAway === 'home').score}-${c.find((x) => x.homeAway === 'away').score}`
}

// team id -> "Group F: 3pts (1W-0D-0L), rank 1 of 4" snapshot for "what it means"
async function buildStandingsContext() {
  const data = await getJSON(STANDINGS)
  const ctx = {}
  for (const g of data.children ?? []) {
    const letter = g.name.replace('Group ', '')
    for (const e of g.standings.entries) {
      const stat = (n) => e.stats.find((s) => s.name === n)?.value ?? 0
      ctx[e.team.id] = {
        group: letter,
        line: `Group ${letter}: ${stat('points')}pts (${stat('wins')}W-${stat('ties')}D-${stat('losses')}L), rank ${stat('rank')} of 4`,
      }
    }
  }
  return ctx
}

// ---- per-match inputs -------------------------------------------------------

function extractOdds(d, homeName, awayName) {
  const p = (d.pickcenter ?? [])[0]
  if (!p) return 'Pre-match expectation: no odds available'
  const fav = p.homeTeamOdds?.favorite ? homeName : p.awayTeamOdds?.favorite ? awayName : null
  const hML = p.homeTeamOdds?.moneyLine
  const aML = p.awayTeamOdds?.moneyLine
  if (!fav) return `Pre-match expectation: roughly even (${homeName} ML ${hML}, ${awayName} ML ${aML})`
  return `Pre-match expectation: ${fav} were favourites (moneyline ${homeName} ${hML} / ${awayName} ${aML})`
}

function extractForm(d, teamId, name) {
  const block = (d.lastFiveGames ?? []).find((b) => b.team?.id === teamId)
  const gms = (block?.events ?? []).slice(0, 5)
  if (gms.length === 0) return `${name} recent form: n/a`
  const detail = gms
    .map((g) => `${g.gameResult} ${g.score} v ${g.opponent?.abbreviation ?? g.opponent?.displayName ?? '?'}`)
    .join(', ')
  return `${name} recent form (most recent first): ${detail}`
}

function summarize(d, standings) {
  const comp = d.header?.competitions?.[0] ?? {}
  const cs = comp.competitors ?? []
  const home = cs.find((c) => c.homeAway === 'home')
  const away = cs.find((c) => c.homeAway === 'away')
  const nameOf = (c) => c?.team?.displayName ?? '?'
  const hId = home?.team?.id
  const aId = away?.team?.id

  const goals = (d.keyEvents ?? [])
    .filter((k) => k.scoringPlay)
    .map((k) => {
      const who = (k.participants ?? []).map((p) => p.athlete?.displayName).filter(Boolean)
      const assist = who[1] ? ` (assist ${who[1]})` : ''
      return `${k.clock?.displayValue ?? ''} ${who[0] ?? '?'}${assist} [${k.team?.displayName ?? ''}]`
    })
  const cards = (d.keyEvents ?? [])
    .filter((k) => /card/i.test(k.type?.text ?? ''))
    .map((k) => `${k.clock?.displayValue ?? ''} ${k.type?.text} ${(k.participants ?? [])[0]?.athlete?.displayName ?? ''} [${k.team?.displayName ?? ''}]`)

  const stat = (team, n) => team?.statistics?.find((s) => s.name === n)?.displayValue ?? '?'
  const bs = {}
  for (const t of d.boxscore?.teams ?? []) {
    bs[t.homeAway] = `possession ${stat(t, 'possessionPct')}%, ${stat(t, 'totalShots')} shots (${stat(t, 'shotsOnTarget')} on target), ${stat(t, 'wonCorners')} corners, ${stat(t, 'foulsCommitted')} fouls`
  }
  const formation = (t) => d.rosters?.find((r) => r.homeAway === t)?.formation ?? '?'
  const story = stripHtml(d.article?.story).slice(0, 2500)

  return [
    `Match: ${nameOf(home)} ${home?.score ?? ''}-${away?.score ?? ''} ${nameOf(away)}`,
    extractOdds(d, nameOf(home), nameOf(away)),
    extractForm(d, hId, nameOf(home)),
    extractForm(d, aId, nameOf(away)),
    `Goals (context for the turning point — do not just relist these): ${goals.length ? goals.join('; ') : 'none'}`,
    cards.length ? `Cards: ${cards.join('; ')}` : 'Cards: none',
    `Underlying performance — ${nameOf(home)}: ${bs.home ?? 'n/a'} (formation ${formation('home')})`,
    `Underlying performance — ${nameOf(away)}: ${bs.away ?? 'n/a'} (formation ${formation('away')})`,
    `Standings after this result — ${nameOf(home)}: ${standings[hId]?.line ?? 'n/a'}; ${nameOf(away)}: ${standings[aId]?.line ?? 'n/a'}`,
    story
      ? `Professional match report (real reporting — mine it for tactical and contextual detail the stats can't show, e.g. chances missed, who dominated, injuries, momentum; synthesise in your own words, do NOT copy its sentences):\n${story}`
      : '',
  ]
    .filter(Boolean)
    .join('\n')
}

const REPORT_SYSTEM = `You are a sharp football analyst writing the verdict on a 2026 World Cup match for fans who ALREADY know the score and who scored. Your job is analysis, not a recap.

Do NOT narrate the goals in order or list the scorers — the reader can see the goal timeline. Instead:
- Lead with a verdict: was the result deserved on the balance of play, an upset, a smash-and-grab, or routine? Anchor it to the pre-match expectation (odds/form provided) and the underlying numbers (possession, shots, shots on target — did the chances match the scoreline?).
- Explain what actually decided the match: a tactical edge or mismatch, ruthless finishing vs profligacy, a red card, a formation problem, or a single decisive individual — and WHY.
- Note one thing that was genuinely revealing or surprising about either side.
- Close with the stakes: what the result does to their qualification picture.

When a professional match report is provided, mine it for the eye-test detail the numbers can't show (who dominated midfield, big chances spurned, injuries, momentum swings) and weave that into your verdict — but synthesise in your own words and never copy its phrasing.

Be specific; cite the numbers that justify your read. Clear British football vocabulary. No clichés, no hype, no filler sentences, no betting talk, no invented details — reason only from the data and reporting given. 90-130 words.`

const REPORT_SCHEMA = {
  type: 'object',
  properties: {
    headline: { type: 'string', description: 'An analytical angle (an insight or verdict), not a scoreline. <= 12 words.' },
    report: { type: 'string', description: '90-130 word analytical verdict per the system instructions.' },
  },
  required: ['headline', 'report'],
  additionalProperties: false,
}

async function askJSON(client, system, schema, content) {
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system,
    output_config: { format: { type: 'json_schema', schema } },
    messages: [{ role: 'user', content }],
  })
  const text = res.content.find((b) => b.type === 'text')?.text ?? '{}'
  return JSON.parse(text)
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('✗ ANTHROPIC_API_KEY is not set. export ANTHROPIC_API_KEY=sk-ant-... and retry.')
    process.exit(1)
  }
  const client = new Anthropic()

  const reports = JSON.parse(await readFile(REPORTS, 'utf8').catch(() => '{}'))
  const [board, standings] = await Promise.all([
    getJSON(`${BASE}/scoreboard?dates=20260611-20260719&limit=200`),
    buildStandingsContext(),
  ])
  const done = (board.events ?? []).filter((e) => e.status?.type?.state === 'post')

  const todo = done.filter((e) => force || !reports[e.id] || reports[e.id].score !== scoreOf(e))
  console.log(`Match verdicts: ${done.length} completed, ${todo.length} to generate${force ? ' (forced)' : ''}.`)
  for (const e of todo) {
    try {
      const d = await getJSON(`${BASE}/summary?event=${e.id}`)
      const { headline, report } = await askJSON(client, REPORT_SYSTEM, REPORT_SCHEMA, summarize(d, standings))
      reports[e.id] = { headline, report, score: scoreOf(e), model: MODEL, generatedAt: new Date().toISOString() }
      console.log(`  ✓ ${e.name} — ${headline}`)
      await writeFile(REPORTS, JSON.stringify(reports, null, 2) + '\n')
    } catch (err) {
      console.error(`  ✗ ${e.name}: ${err.message}`)
    }
  }

  console.log(`Done. ${Object.keys(reports).length} verdicts cached → ${REPORTS}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
