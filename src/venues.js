// Static enrichment for the 16 host stadiums, keyed by ESPN's `venue.fullName`.
// ESPN already gives us the stadium name, city, state and TV per match; this adds
// the bits ESPN doesn't carry: the venue's FIFA tournament name (FIFA rebrands the
// sponsor-named stadiums for the World Cup), its capacity, and its IANA timezone so
// we can show the kickoff in the *stadium's* local time (the knockouts span PT→ET
// plus Mexico City and Vancouver). Anything not in this map degrades gracefully —
// the card still shows whatever ESPN returned.
const VENUES = {
  'MetLife Stadium': { fifaName: 'New York New Jersey Stadium', capacity: 82500, tz: 'America/New_York' },
  'AT&T Stadium': { fifaName: 'Dallas Stadium', capacity: 80000, tz: 'America/Chicago' },
  'SoFi Stadium': { fifaName: 'Los Angeles Stadium', capacity: 70000, tz: 'America/Los_Angeles' },
  'NRG Stadium': { fifaName: 'Houston Stadium', capacity: 72000, tz: 'America/Chicago' },
  'Mercedes-Benz Stadium': { fifaName: 'Atlanta Stadium', capacity: 71000, tz: 'America/New_York' },
  'Gillette Stadium': { fifaName: 'Boston Stadium', capacity: 65000, tz: 'America/New_York' },
  'Lincoln Financial Field': { fifaName: 'Philadelphia Stadium', capacity: 69000, tz: 'America/New_York' },
  'Hard Rock Stadium': { fifaName: 'Miami Stadium', capacity: 65000, tz: 'America/New_York' },
  'GEHA Field at Arrowhead Stadium': { fifaName: 'Kansas City Stadium', capacity: 76000, tz: 'America/Chicago' },
  "Levi's Stadium": { fifaName: 'San Francisco Bay Area Stadium', capacity: 68500, tz: 'America/Los_Angeles' },
  'Lumen Field': { fifaName: 'Seattle Stadium', capacity: 69000, tz: 'America/Los_Angeles' },
  'BC Place': { fifaName: 'Vancouver Stadium', capacity: 54500, tz: 'America/Vancouver' },
  'BMO Field': { fifaName: 'Toronto Stadium', capacity: 45000, tz: 'America/Toronto' },
  'Estadio Banorte': { fifaName: 'Mexico City Stadium', capacity: 87000, tz: 'America/Mexico_City' },
  'Estadio BBVA': { fifaName: 'Monterrey Stadium', capacity: 53500, tz: 'America/Monterrey' },
}

// US states come back from ESPN as full names; abbreviate to keep cards compact.
const STATE_ABBR = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA',
  Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', Florida: 'FL', Georgia: 'GA',
  Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL', Indiana: 'IN', Iowa: 'IA',
  Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD',
  Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS',
  Missouri: 'MO', Montana: 'MT', Nebraska: 'NE', Nevada: 'NV', 'New Hampshire': 'NH',
  'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC',
  'North Dakota': 'ND', Ohio: 'OH', Oklahoma: 'OK', Oregon: 'OR', Pennsylvania: 'PA',
  'Rhode Island': 'RI', 'South Carolina': 'SC', 'South Dakota': 'SD', Tennessee: 'TN',
  Texas: 'TX', Utah: 'UT', Vermont: 'VT', Virginia: 'VA', Washington: 'WA',
  'West Virginia': 'WV', Wisconsin: 'WI', Wyoming: 'WY',
}

export function venueInfo(fullName) {
  return VENUES[fullName] ?? null
}

// "Inglewood, CA" for US venues; "Vancouver, Canada" / "Mexico City, Mexico" abroad.
// ESPN gives US venues a "City, State" string in `city` (state spelled out, no
// separate field), and a bare city + country for Canada/Mexico.
export function venueLocation(match) {
  const { city, country } = match
  if (!city) return ''
  if (country && country !== 'USA') return `${city}, ${country}`
  const parts = city.split(',').map((s) => s.trim())
  if (parts.length === 2 && STATE_ABBR[parts[1]]) {
    return `${parts[0]}, ${STATE_ABBR[parts[1]]}`
  }
  return city
}

// Kickoff in the stadium's local time, e.g. "4:00 PM PT". Falls back to null when
// we don't know the tz (so the caller can just show the viewer-local time).
export function venueLocalKickoff(date, fullName) {
  const info = VENUES[fullName]
  if (!info) return null
  try {
    return new Intl.DateTimeFormat([], {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: info.tz,
      timeZoneName: 'short',
    }).format(date)
  } catch {
    return null
  }
}
