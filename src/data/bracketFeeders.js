// Which two matches feed each knockout fixture, by official FIFA match number.
// Used to draw the bracket's connector lines (Bracket.jsx) and, in replay mode, to
// decide whether a fixture's teams were known yet on the night being replayed.
// Match 103 (3rd place) is not here: it takes the two losing semifinalists.
export const FEEDERS = {
  89: [74, 77], 90: [73, 75], 91: [76, 78], 92: [79, 80],
  93: [83, 84], 94: [81, 82], 95: [86, 88], 96: [85, 87],
  97: [89, 90], 98: [93, 94], 99: [91, 92], 100: [95, 96],
  101: [97, 98], 102: [99, 100],
  104: [101, 102],
}
