import type {Project} from '@/types/project'
import {getProjectStats} from '@/lib/stats'

export function AdminPanel({projects}: {projects: Project[]}) {
  const stats = getProjectStats(projects)
  const missingHero = projects.filter((project) => !project.heroImageUrl)
  const missingSummary = projects.filter((project) => !project.summary)

  return (
    <div className="grid gap-5 md:grid-cols-3">
      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-bold uppercase tracking-widest text-[#6f8b63]">Content</p>
        <h2 className="mt-3 text-2xl font-semibold">Sanity Studio</h2>
        <p className="mt-3 text-slate-600">Edit developments, media, documents, updates, and resources.</p>
        <a className="mt-6 inline-block font-semibold text-[#244f73]" href="http://localhost:3333" target="_blank">
          Open Studio →
        </a>
      </div>

      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-bold uppercase tracking-widest text-[#6f8b63]">Stats</p>
        <h2 className="mt-3 text-2xl font-semibold">{stats.totalProjects} Developments</h2>
        <p className="mt-3 text-slate-600">{stats.totalHomes.toLocaleString()} homes proposed across tracked records.</p>
      </div>

      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-bold uppercase tracking-widest text-[#6f8b63]">Missing Content</p>
        <h2 className="mt-3 text-2xl font-semibold">{missingHero.length + missingSummary.length} Issues</h2>
        <p className="mt-3 text-slate-600">{missingHero.length} missing hero photos. {missingSummary.length} missing summaries.</p>
      </div>
    </div>
  )
}
