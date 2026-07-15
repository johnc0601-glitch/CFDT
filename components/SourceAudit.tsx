import type {Project} from '@/types/project'

function daysOld(date?: string) {
  if (!date) return undefined
  const value = new Date(date)
  if (Number.isNaN(value.getTime())) return undefined
  return Math.floor((Date.now() - value.getTime()) / 86_400_000)
}

export function SourceAudit({projects}: {projects: Project[]}) {
  const rows = projects
    .map((project) => {
      const age = daysOld(project.latestUpdateDate)
      const issues = [
        !project.summary && 'Missing summary',
        !project.officialResources?.length && 'Missing official source',
        !project.latestUpdateDate && 'Missing update date',
        age !== undefined && age > 180 && `Stale: ${age} days`,
        !project.timeline?.length && 'Missing timeline',
      ].filter(Boolean) as string[]

      return {project, issues}
    })
    .filter((row) => row.issues.length)
    .sort((a, b) => b.issues.length - a.issues.length)

  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-bold uppercase tracking-widest text-[#6f8b63]">Quality control</p>
      <h2 className="mt-2 text-2xl font-semibold">Source & Freshness Audit</h2>
      <p className="mt-2 text-slate-600">{rows.length} development records need review.</p>

      <div className="mt-6 divide-y divide-slate-200">
        {rows.slice(0, 15).map(({project, issues}) => (
          <div key={project._id} className="py-4">
            <p className="font-semibold">{project.name}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {issues.map((issue) => (
                <span key={issue} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  {issue}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
