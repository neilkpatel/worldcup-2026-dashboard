import { buildThirdPlaceRace, buildFormMap } from '../stats'
import FifaRank from './FifaRank'

function rowAccent(rank) {
  if (rank <= 2) return 'border-l-2 border-emerald-500' // top 2 advance
  if (rank === 3) return 'border-l-2 border-amber-500' // best 8 thirds advance
  return 'border-l-2 border-transparent'
}

const FORM_DOT = { W: 'bg-emerald-500', D: 'bg-slate-500', L: 'bg-rose-500' }

function Form({ results }) {
  if (!results || results.length === 0) return <span className="text-slate-700">–</span>
  return (
    <span className="inline-flex gap-0.5">
      {results.map((r, i) => (
        <span
          key={i}
          title={r}
          className={`h-1.5 w-1.5 rounded-full ${FORM_DOT[r] ?? 'bg-slate-600'}`}
        />
      ))}
    </span>
  )
}

function GroupCard({ group, formMap }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 sm:p-4">
      <h3 className="mb-3 font-semibold">{group.name}</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-500">
            <th className="pb-2 font-normal">Team</th>
            <th className="pb-2 text-center font-normal">P</th>
            <th className="pb-2 text-center font-normal">W</th>
            <th className="pb-2 text-center font-normal">D</th>
            <th className="pb-2 text-center font-normal">L</th>
            <th className="pb-2 text-center font-normal">GD</th>
            <th className="pb-2 text-center font-normal">Pts</th>
            <th className="pb-2 text-center font-normal">Form</th>
          </tr>
        </thead>
        <tbody>
          {group.teams.map((team) => (
            <tr key={team.id} className={rowAccent(team.rank)}>
              <td className="py-1.5 pl-2">
                <div className="flex items-center gap-2">
                  <img src={team.logo} alt="" className="h-4 w-4 object-contain" loading="lazy" />
                  <span className="truncate">{team.name}</span>
                  <FifaRank abbrev={team.abbrev} className="shrink-0 text-[9px]" />
                </div>
              </td>
              <td className="text-center tabular-nums text-slate-400">{team.played}</td>
              <td className="text-center tabular-nums text-slate-400">{team.wins}</td>
              <td className="text-center tabular-nums text-slate-400">{team.draws}</td>
              <td className="text-center tabular-nums text-slate-400">{team.losses}</td>
              <td className="text-center tabular-nums text-slate-400">
                {team.gd > 0 ? `+${team.gd}` : team.gd}
              </td>
              <td className="text-center font-bold tabular-nums">{team.points}</td>
              <td className="py-1.5 text-center">
                <Form results={formMap[team.id]} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ThirdPlaceRace({ groups }) {
  const race = buildThirdPlaceRace(groups)
  if (race.length === 0) return null
  // Insert a visual cut-off after the 8th-placed team
  return (
    <div className="mt-10">
      <h2 className="text-lg font-bold text-slate-100">🎟️ Race for the best third-place spots</h2>
      <p className="mb-4 text-sm text-slate-500">
        The 8 best of 12 third-placed teams join the round of 32. Ranked by points, then goal
        difference, then goals scored.
      </p>
      <div className="overflow-hidden rounded-lg border border-slate-800">
        {race.map((t) => (
          <div key={t.id}>
            <div
              className={`flex items-center gap-3 px-3 py-2.5 text-sm ${
                t.qualifying ? 'bg-emerald-500/10' : 'odd:bg-slate-900/40'
              }`}
            >
              <span className="w-6 shrink-0 text-right tabular-nums text-slate-500">{t.position}</span>
              <span className="w-6 shrink-0 text-xs text-slate-500">{t.group}</span>
              {t.logo && <img src={t.logo} alt="" className="h-5 w-5 shrink-0 object-contain" />}
              <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
                <span
                  className={`truncate ${
                    t.qualifying ? 'font-semibold text-emerald-200' : 'text-slate-300'
                  }`}
                >
                  {t.name}
                </span>
                <FifaRank abbrev={t.abbrev} className="shrink-0 text-[10px]" />
              </div>
              <span className="shrink-0 text-xs text-slate-500">
                GD {t.gd > 0 ? `+${t.gd}` : t.gd} · GF {t.gf}
              </span>
              <span className="w-8 shrink-0 text-right font-bold tabular-nums text-slate-100">
                {t.points}
              </span>
            </div>
            {t.position === 8 && (
              <div className="border-t border-dashed border-emerald-600/50 px-3 py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-emerald-500/70">
                qualification cut-off
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Groups({ groups, matches = [] }) {
  const formMap = buildFormMap(matches)
  return (
    <div>
      <p className="mb-4 text-xs text-slate-500">
        <span className="text-emerald-400">▎</span>Top 2 advance to round of 32 ·{' '}
        <span className="text-amber-400">▎</span>3rd place — best 8 of 12 also advance
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <GroupCard key={group.name} group={group} formMap={formMap} />
        ))}
      </div>
      <ThirdPlaceRace groups={groups} />
    </div>
  )
}
