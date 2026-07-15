import type {Project} from '@/types/project'
import {getProjectStats} from '@/lib/stats'

export function DashboardSummary({projects}: {projects: Project[]}) {
  const stats = getProjectStats(projects)
  const missingHero = projects.filter((project) => !project.heroImageUrl).length
  const missingSummary = projects.filter((project) => !project.summary).length
  const missingLocation = projects.filter((project) => !project.latitude || !project.longitude).length

  return (
    <div className="grid gap-5 md:grid-cols-3">
      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200"><p className="text-xs font-bold uppercase tracking-widest text-[#6f8b63]">Projects</p><h2 className="mt-3 text-3xl font-semibold">{stats.totalProjects}</h2><p className="mt-2 text-slate-600">{stats.activeProjects} active</p></div>
      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200"><p className="text-xs font-bold uppercase tracking-widest text-[#6f8b63]">Homes Proposed</p><h2 className="mt-3 text-3xl font-semibold">{stats.totalHomes.toLocaleString()}</h2><p className="mt-2 text-slate-600">Across tracked records</p></div>
      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200"><p className="text-xs font-bold uppercase tracking-widest text-[#6f8b63]">Missing Content</p><h2 className="mt-3 text-3xl font-semibold">{missingHero + missingSummary + missingLocation}</h2><p className="mt-2 text-slate-600">{missingHero} hero, {missingSummary} summary, {missingLocation} location</p></div>
    </div>
  )
}
