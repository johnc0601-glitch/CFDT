import type {Project} from '@/types/project'
import {StatusBadge} from './StatusBadge'

export function ProjectHero({project}: {project: Project}) {
  const siteAcres = project.siteAcres ?? project.totalSiteAcres

  return (
    <section className="overflow-hidden rounded-3xl bg-[#053f29] text-white shadow-sm">
      <div className="relative min-h-[520px]">
        {project.heroImageUrl ? (
          <img
            src={project.heroImageUrl}
            alt={project.heroImageAlt || project.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#477454] via-[#2f6042] to-[#173f2b]" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#053f29] via-[#053f29]/75 to-transparent" />

        <div className="relative z-10 flex min-h-[520px] flex-col justify-end p-8 md:p-12">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-100">
            Major Residential Development
          </p>

          <h1 className="mt-4 text-5xl font-semibold leading-tight md:text-7xl">
            {project.name}
          </h1>

          <p className="mt-3 text-xl text-green-100">
            {[project.municipalityName, project.countyName]
              .filter(Boolean)
              .join(' • ')}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <StatusBadge status={project.status} />

            {project.homesProposed && (
              <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold ring-1 ring-white/20">
                {project.homesProposed.toLocaleString()} homes
              </span>
            )}

            {siteAcres && (
              <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold ring-1 ring-white/20">
                {siteAcres.toLocaleString()} acres
              </span>
            )}

            {project.latestUpdateDate && (
              <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold ring-1 ring-white/20">
                Updated {project.latestUpdateDate}
              </span>
            )}
          </div>
        </div>
      </div>

      {project.heroImageCaption && (
        <p className="px-6 py-4 text-sm text-white/75">
          {project.heroImageCaption}
        </p>
      )}
    </section>
  )
}
