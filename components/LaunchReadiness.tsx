import type {Project} from '@/types/project'

function projectChecks(project: Project) {
  return [
    Boolean(project.summary),
    typeof project.homesProposed === 'number',
    typeof (project.siteAcres ?? project.totalSiteAcres) === 'number',
    Boolean(project.countyName),
    Boolean(project.status),
    Boolean(project.timeline?.length),
    Boolean(project.latestUpdate),
    Boolean(project.officialResources?.length),
  ]
}

export function LaunchReadiness({projects}: {projects: Project[]}) {
  const rows = projects.map((project) => {
    const checks = projectChecks(project)
    const score = Math.round((checks.filter(Boolean).length / checks.length) * 100)
    return {project, score}
  })

  const ready = rows.filter((row) => row.score >= 75).length
  const average = rows.length
    ? Math.round(rows.reduce((sum, row) => sum + row.score, 0) / rows.length)
    : 0

  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#6f8b63]">Launch readiness</p>
          <h2 className="mt-2 text-2xl font-semibold">{average}% Average Completion</h2>
          <p className="mt-2 text-slate-600">{ready} of {rows.length} developments are at least 75% ready.</p>
        </div>
      </div>

      <div className="mt-7 divide-y divide-slate-200">
        {rows
          .sort((a, b) => a.score - b.score)
          .slice(0, 12)
          .map(({project, score}) => (
            <div key={project._id} className="grid gap-3 py-4 md:grid-cols-[1fr_220px_60px] md:items-center">
              <div>
                <p className="font-semibold">{project.name}</p>
                <p className="text-sm text-slate-500">{project.countyName || 'County missing'}</p>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={score >= 75 ? 'h-full bg-[#315127]' : score >= 50 ? 'h-full bg-amber-500' : 'h-full bg-rose-500'}
                  style={{width: `${score}%`}}
                />
              </div>
              <p className="text-right font-bold">{score}%</p>
            </div>
          ))}
      </div>
    </section>
  )
}
