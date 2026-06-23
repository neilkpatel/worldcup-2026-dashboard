// Status for the "Is the war with Iran over?" indicator in the Iran followed-team
// popout. Three states so it can tell the truth instead of forcing a misleading
// yes/no. This is a manual snapshot — UPDATE `state` + `asOf` when the situation
// changes. The live-coverage `source` link is the always-current fallback, so a
// click shows real reporting even if this chip goes stale.
//
//   state: 'over'      → war ended / peace deal      (YES)
//          'active'    → active war, fighting        (NO)
//          'ceasefire' → ceasefire in place, fragile (FRAGILE CEASEFIRE)
//
// As of 2026-06-23: US–Iran signed a 60-day ceasefire MoU (mid-June) and the
// Strait of Hormuz is reopening, but there have been repeated violations and
// Lebanon/Hezbollah flare-ups — i.e. holding, but shaky.
export const IRAN_WAR_STATUS = {
  state: 'ceasefire',
  asOf: '2026-06-23',
  source: 'https://news.google.com/search?q=Iran%20war%20ceasefire%20latest',
}
