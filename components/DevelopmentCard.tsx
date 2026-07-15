import Link from 'next/link'
import type {Project} from '@/types/project'
import {StatusBadge} from './StatusBadge'

export function DevelopmentCard({project}: {project: Project}) {
  const href = project.slug?.current ? `/projects/${project.slug.current}` : '#'

  return (
    <Link
      href={href}
      className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {project.heroImageUrl ? (
        <img src={project.heroImageUrl} alt={project.heroImageAlt || project.name} className="h-40 w-full object-cover" />
      ) : (
        <div className="h-40 bg-[#eef3ef]" />
      )}

      <div className="p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-[#6f8b63]">Development</p>
        <h3 className="mt-3 text-2xl font-semibold">{project.name}</h3>
        <div className="mt-4"><StatusBadge status={project.status} /></div>

        <div className="mt-5 space-y-1 text-sm text-slate-700">
          {typeof project.homesProposed === 'number' && (
            <p><strong>{project.homesProposed.toLocaleString()}</strong> homes proposed</p>
          )}
          {typeof (project.siteAcres ?? project.totalSiteAcres) === 'number' && (
            <p><strong>{(project.siteAcres ?? project.totalSiteAcres)?.toLocaleString()}</strong> site acres</p>
          )}
          {project.developer && <p>Developer: {project.developer}</p>}
        </div>

        <p className="mt-6 font-semibold text-[#244f73]">View development →</p>
      </div>
    </Link>
  )
}
