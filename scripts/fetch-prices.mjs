#!/usr/bin/env node
// Fetches live secondary-market ticket prices for the matches Neil is attending
// and caches them in src/data/prices.json, keyed by the ticket ids used in
// src/components/MyTickets.jsx ('nyc-r16', 'miami-qf').
//
// Why this source: SeatGeek/StubHub list the matches but gate prices behind
// DataDome (curl + headless browsers both get 403'd), and SeatGeek's free API
// returns empty `stats` for World Cup events. TickPick's event pages, by contrast,
// are SEO-rendered and embed a schema.org AggregateOffer in plain HTML — so a
// simple fetch gets the get-in (`lowPrice`) and top-of-range (`highPrice`) with no
// bot-wall, no API key, no browser. TickPick is all-in/no-fee, so the number's honest.
//
// Granularity note: this is an EVENT-level get-in + range, NOT a per-section
// (upper/lower bowl) split — that listing detail loads via a bot-protected call
// and isn't fetchable headless.
//
// Re-runnable + incremental: appends a history point each run so the app draws a
// price-over-time sparkline + a ▲/▼ trend vs the last check.
//
//   npm run prices

import { writeFile, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PRICES = join(ROOT, 'src', 'data', 'prices.json')

// The matches Neil holds tickets to. `tickpick` is the scrape source; `seatgeek`
// is kept only as a human "view listings" link (its prices aren't fetchable).
const TICKETS = [
  {
    id: 'nyc-r16',
    label: 'Round of 16 · MetLife',
    tickpick:
      'https://www.tickpick.com/buy-fifa-world-cup-26-round-of-16-w76-vs-w78-match-91-tickets-metlife-stadium-7-5-26-4pm/6259587/',
    seatgeek:
      'https://seatgeek.com/fifa-world-cup-tickets/international-soccer/2026-07-05-4-pm/17269677',
  },
  {
    id: 'miami-qf',
    label: 'Quarterfinal · Hard Rock',
    tickpick:
      'https://www.tickpick.com/buy-fifa-world-cup-26-quarter-finals-w91-vs-w92-match-99-tickets-hard-rock-stadium-7-11-26-5pm/6259553/',
    seatgeek:
      'https://seatgeek.com/fifa-world-cup-tickets/international-soccer/2026-07-11-5-pm/17164019',
  },
]

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'en-US,en;q=0.9' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

// Pull lowPrice/highPrice out of the schema.org AggregateOffer JSON-LD embedded
// in the page. Falls back to a bare lowPrice match if the block shape shifts.
function parseOffer(html) {
  const low = html.match(/"lowPrice":\s*"?([0-9]+(?:\.[0-9]+)?)"?/)
  const high = html.match(/"highPrice":\s*"?([0-9]+(?:\.[0-9]+)?)"?/)
  if (!low) return null
  return {
    low: Math.round(Number(low[1])),
    high: high ? Math.round(Number(high[1])) : null,
  }
}

async function main() {
  let data = {}
  try {
    data = JSON.parse(await readFile(PRICES, 'utf8'))
  } catch {
    /* first run — start empty */
  }
  data.tickets ??= {}

  const stamp = new Date().toISOString()
  for (const ticket of TICKETS) {
    const prev = data.tickets[ticket.id]
    try {
      const offer = parseOffer(await fetchHtml(ticket.tickpick))
      if (!offer) {
        console.warn(`• ${ticket.id}: couldn't parse a price (${ticket.label}). Keeping prior data.`)
        continue
      }
      const history = prev?.history ?? []
      history.push({ t: stamp, low: offer.low, high: offer.high })
      data.tickets[ticket.id] = {
        source: 'TickPick',
        low: offer.low,
        high: offer.high,
        url: ticket.tickpick,
        seatgeekUrl: ticket.seatgeek,
        checkedAt: stamp,
        history: history.slice(-200),
      }

      const trend = prev?.low != null ? offer.low - prev.low : null
      const arrow = trend == null ? '' : trend > 0 ? ` (▲ $${trend})` : trend < 0 ? ` (▼ $${-trend})` : ' (flat)'
      console.log(
        `✓ ${ticket.id}: get-in $${offer.low}${arrow} · up to $${offer.high ?? '—'} — ${ticket.label}`,
      )
    } catch (err) {
      console.error(`✗ ${ticket.id}: ${err.message}`)
    }
  }

  data.updatedAt = stamp
  await writeFile(PRICES, JSON.stringify(data, null, 2) + '\n')
  console.log(`\nWrote ${PRICES.replace(ROOT + '/', '')} at ${stamp}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
