// One clock for the whole app, so "replay a matchday" can move it.
//
// The tournament is over, so the live dashboard now always renders its final state.
// Replay mode rewinds the app to the end of a past matchday: results up to that day
// are final, everything after it is unplayed, and the group tables are recomputed to
// what they were that night. Components must ask this module for the time instead of
// calling `new Date()`, or half the UI would keep answering from the real clock and
// the replay would contradict itself.
let override = null

/** Current time: the real one, or the replay moment while replay mode is on. */
export function now() {
  return override ? new Date(override) : new Date()
}

/** Pass a Date to enter replay mode, or null to return to the real clock. */
export function setClockOverride(date) {
  override = date ? new Date(date) : null
}

export function isReplaying() {
  return override !== null
}
