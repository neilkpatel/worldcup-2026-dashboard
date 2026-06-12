import { buildRecap } from '../recap'

// "What happened yesterday" card: scores, storylines, and group implications
// for the most recent completed match day.
export default function Recap({ matches, groups }) {
  const recap = buildRecap(matches, groups)
  if (!recap) return null

  const dateLabel = recap.date.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <section className="mb-8 rounded-xl border border-sky-500/30 bg-sky-500/5 p-4">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-sky-300 uppercase">
        📋 Last match day · {dateLabel}
      </h2>

      {recap.headlines.length > 0 && (
        <ul className="mb-4 space-y-1 text-sm text-slate-200">
          {recap.headlines.map((h) => (
            <li key={h} className="flex gap-2">
              <span className="text-sky-400">›</span>
              <span>{h}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-3">
        {recap.groupNotes.map((g, i) => (
          <div
            key={g.letter ?? `ko-${i}`}
            className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm"
          >
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="font-semibold text-slate-200">
                {g.letter ? `Group ${g.letter}` : 'Knockout'}
              </span>
              {g.table && (
                <span className="truncate text-xs text-slate-500 tabular-nums">
                  {g.table}
                </span>
              )}
            </div>
            <div className="text-slate-300">{g.results.join(' · ')}</div>
            <div className="mt-1 text-xs text-slate-400">{g.note}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
