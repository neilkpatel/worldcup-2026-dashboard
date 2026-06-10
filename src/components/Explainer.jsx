import { useState } from 'react'

function Item({ q, children }) {
  return (
    <div>
      <dt className="font-semibold text-slate-200">{q}</dt>
      <dd className="mt-1 text-slate-400">{children}</dd>
    </div>
  )
}

export default function Explainer() {
  const [open, setOpen] = useState(true)

  return (
    <section className="mb-8 rounded-xl border border-slate-800 bg-slate-900/60">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="font-semibold">
          🧭 How the tournament works — and how teams advance
        </span>
        <span className="text-slate-500">{open ? '–' : '+'}</span>
      </button>

      {open && (
        <dl className="grid gap-5 border-t border-slate-800 px-4 py-4 text-sm sm:grid-cols-2">
          <Item q="The format (new for 2026)">
            48 teams in <strong>12 groups of 4</strong>. Each team plays the other
            three in its group once. It's the first World Cup with this size — 104
            matches across the USA, Canada and Mexico.
          </Item>

          <Item q="How you reach the knockouts">
            The <strong className="text-emerald-400">top 2 of every group</strong>{' '}
            advance (24 teams), plus the{' '}
            <strong className="text-amber-400">8 best 3rd-placed teams</strong> out
            of 12 — for a 32-team knockout bracket (round of 32 → 16 → quarters →
            semis → final).
          </Item>

          <Item q="Group tiebreakers (in order)">
            1) Points · 2) Goal difference · 3) Goals scored · 4) Head-to-head
            among tied teams (points, then GD, then goals) · 5) Fair-play record ·
            6) Drawing of lots.
          </Item>

          <Item q="The 3rd-place race">
            All twelve 3rd-placed teams are ranked against each other (points, then
            GD, then goals scored). The top 8 squeeze in — so a strong loss or a
            single goal can be the difference between going home and going through.
          </Item>

          <Item q="Points">
            Win = 3, draw = 1, loss = 0. Knockout rounds are single elimination —
            tied games go to extra time, then penalties.
          </Item>

          <Item q="Key dates">
            Group stage <strong>June 11–27</strong> · Round of 32 from June 28 ·
            Quarterfinals July 9–11 · Semis July 14–15 ·{' '}
            <strong>Final July 19</strong> at MetLife Stadium, New Jersey.
          </Item>
        </dl>
      )}

      {open && (
        <p className="border-t border-slate-800 px-4 py-2 text-xs text-slate-600">
          "What's at stake" notes are computed live from the standings and stay
          conservative — they account for the top-two race; the cross-group
          3rd-place math is flagged as a lifeline, not a guarantee.
        </p>
      )}
    </section>
  )
}
