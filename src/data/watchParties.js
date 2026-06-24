// VALIDATED World Cup 2026 watch parties in NYC — organized/official events, as
// opposed to "just a bar with the game on" (that's WATCH_BARS). Each was deep-
// searched and cross-checked across ≥2 sources (official host-committee / venue
// pages + press). `sources` are the triangulation links shown in the UI so the
// claim is auditable. Schedules can shift — the UI tells users to confirm times
// on the linked page. Order: big public/official fan zones first, then organized
// venue series. NEVER add an unverified party here.

export const WATCH_PARTIES = [
  {
    id: 'queens-fanzone',
    name: 'NYNJ Fan Zone — Queens',
    kind: 'Official fan zone',
    cost: 'Ticketed / free events',
    area: 'USTA Billie Jean King NTC (Louis Armstrong Stadium), Flushing, Queens',
    when: 'Jun 11–27 · group stage',
    what: 'The official NY/NJ host-committee fan zone: live match broadcasts on the big screen plus 40+ live performances (Nas, Wyclef Jean, Busta Rhymes, Ella Mai).',
    link: 'https://nynjfwc26.com/queens/',
    sources: ['https://nynjfwc26.com/queens/', 'https://www.cbsnews.com/newyork/news/world-cup-watch-parties-nyc-nj-fan-zones-guide/'],
  },
  {
    id: 'rock-center',
    name: 'World Cup Fan Village — Rockefeller Center',
    kind: 'Official fan village',
    cost: 'Free',
    area: 'Rockefeller Center, Midtown',
    when: 'Jul 6–19',
    what: 'Official fan village with live match broadcasts around a temporary pitch, alongside the Telemundo Fan Village programming.',
    link: 'https://www.rockefellercenter.com/events/world-cup-2026',
    sources: ['https://www.rockefellercenter.com/events/world-cup-2026', 'https://www.nyctourism.com/worldcup26/world-cup-fan-zones/'],
  },
  {
    id: 'central-park-final',
    name: 'Final Watch Party — Central Park Great Lawn',
    kind: 'Public watch party',
    cost: 'Free w/ lottery ticket',
    area: 'Great Lawn, Central Park',
    when: 'Jul 19 · the Final',
    what: '50,000 fans on the Great Lawn for the Final, presented by Global Citizen. Free, but requires a ticket allocated by random-draw lottery.',
    link: 'https://www.globalcitizen.org/en/events-broadcasts/fifa-world-cup-final-watch-party/',
    sources: ['https://www.globalcitizen.org/en/events-broadcasts/fifa-world-cup-final-watch-party/', 'https://www.timeout.com/newyork/news/global-citizen-is-hosting-a-free-world-cup-watch-party-in-central-park-next-month-060926'],
  },
  {
    id: 'bk-bridge-park',
    name: 'Brooklyn Bridge Park watch parties',
    kind: 'Public watch party',
    cost: 'Free',
    area: 'Brooklyn Bridge Park, DUMBO',
    when: 'Jun 13–Jul 19 · daily 12–10pm',
    what: 'Daily waterfront watch parties with concerts and live entertainment throughout the tournament.',
    link: 'https://nynjfwc26.com/fan-events/',
    sources: ['https://nynjfwc26.com/fan-events/', 'https://www.nyctourism.com/worldcup26/world-cup-fan-zones/'],
  },
  {
    id: 'portugal-house',
    name: 'Portugal House — Time Out Market',
    kind: 'Official federation house',
    cost: 'Free / ticketed per match',
    area: 'Time Out Market, DUMBO, Brooklyn (55 Water St)',
    when: 'Jun 13–Jul 20 · Portugal: vs Congo Jun 17 · vs Uzbekistan Jun 23 · vs Colombia Jun 27',
    what: 'Official fan zone of the Portuguese Football Federation — every Portugal match on the screens, a 5th-floor rooftop with Portuguese food, beer & wine, and halftime fan games.',
    link: 'https://www.timeout.com/time-out-market-new-york/things-to-do/portugal-house-at-time-out-market',
    sources: ['https://www.timeout.com/about/latest-news/time-out-market-new-york-brooklyn-and-the-portuguese-football-federation-launch-portugal-house-for-fifa-world-cup-2026-061226', 'https://www.eventbrite.com/e/portugal-watch-party-at-time-out-market-tickets-1991484404463'],
  },
  {
    id: 'sobs',
    name: "SOB's World Cup watch parties",
    kind: 'Bar watch-party series',
    cost: 'Free w/ RSVP',
    area: 'Hudson Square, Manhattan (204 Varick St)',
    when: 'Throughout · Brazil / Mexico / USA / Colombia nights',
    what: "Free-with-RSVP parties on a 16'×18' LED wall with DJs, 21+. Reserve the specific match through their KYD ticket page.",
    link: 'https://sobs.com/worldcup/',
    sources: ['https://sobs.com/worldcup/', 'https://www.tastingtable.com/2192375/best-nyc-bars-watch-world-cup/'],
  },
  {
    id: 'brickyard-series',
    name: 'Brickyard — all 104 matches',
    kind: 'Bar watch-party series',
    cost: 'Ticketed',
    area: 'Tribeca / FiDi edge (23 Park Pl)',
    when: 'Every match · USA group games Jun 12 / 19 / 25 + all knockouts',
    what: 'Ticketed watch-party series across all 104 matches on 50 TVs / video walls, with dedicated USA-match and knockout-round parties.',
    link: 'https://www.eventbrite.com/e/fifa-world-cup-2026-watch-parties-matches-live-at-brickyard-craft-kitchen-tickets-1988048986034',
    sources: ['https://www.eventbrite.com/e/fifa-world-cup-2026-watch-parties-matches-live-at-brickyard-craft-kitchen-tickets-1988048986034', 'https://www.tastingtable.com/2192375/best-nyc-bars-watch-world-cup/'],
  },
]
