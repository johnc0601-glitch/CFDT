import type {Project} from '@/types/project'

export function CommunityImpact({project}: {project: Project}) {
  const estimatedPopulation = project.homesProposed ? Math.round(project.homesProposed * 2.35) : undefined

  return (
    <section>
      <h2 className="text-2xl font-semibold">Community Impact</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {estimatedPopulation && (
          <div className="rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-[#6f8b63]">Estimated Population</p>
            <p className="mt-2 text-2xl font-semibold">{estimatedPopulation.toLocaleString()}</p>
            <p className="mt-2 text-sm text-slate-600">Rough estimate based on homes proposed.</p>
          </div>
        )}
        {project.waterProvider && (
          <div className="rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-[#6f8b63]">Water</p>
            <p className="mt-2 text-xl font-semibold">{project.waterProvider}</p>
          </div>
        )}
        {project.sewerProvider && (
          <div className="rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-[#6f8b63]">Sewer</p>
            <p className="mt-2 text-xl font-semibold">{project.sewerProvider}</p>
          </div>
        )}
        {project.schoolDistrict && (
          <div className="rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-[#6f8b63]">Schools</p>
            <p className="mt-2 text-xl font-semibold">{project.schoolDistrict}</p>
          </div>
        )}
        {project.fireDistrict && (
          <div className="rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-[#6f8b63]">Fire District</p>
            <p className="mt-2 text-xl font-semibold">{project.fireDistrict}</p>
          </div>
        )}
      </div>
    </section>
  )
}
