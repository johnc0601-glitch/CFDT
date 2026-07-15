import type {Project} from '@/types/project'
import type {Meeting} from '@/types/meeting'
import {ProjectSnapshot} from './ProjectSnapshot'
import {StatusBadge} from './StatusBadge'
import {WatchButton} from './WatchButton'
import {CompareButton} from './CompareButton'

export function ProjectHeroLayout({
  project,
  meetings,
}: {
  project: Project
  meetings: Meeting[]
}) {
  return (
    <section className="overflow-hidden rounded-3xl bg-[#053f29] text-white shadow-sm">
      <div className="grid md:grid-cols-[1fr_430px]">
        <div className="relative min-h-[420px]">
          {project.heroImageUrl && (
            <img
              src={project.heroImageUrl}
              alt={project.heroImageAlt || project.name}
              className="absolute inset-0 h-full w-full object-cover opacity-65"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#053f29] via-[#053f29]/85 to-transparent" />

          <div className="relative z-10 flex min-h-[420px] flex-col justify-end p-8 md:p-12">
            <p className="text-sm font-bold uppercase tracking-widest text-green-100">
              Development
            </p>
            <h1 className="mt-3 max-w-3xl text-5xl font-semibold leading-tight md:text-7xl">
              {project.name}
            </h1>
            {project.projectType && (
              <p className="mt-3 text-2xl font-semibold text-green-100">
                {project.projectType}
              </p>
            )}
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/90">
              {project.summary || 'Add a public project summary in Sanity.'}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <StatusBadge status={project.status} />
              <WatchButton projectName={project.name} />
              <CompareButton projectName={project.name} />
            </div>
          </div>
        </div>

        <div className="bg-[#06351f] p-6 md:p-8">
          <ProjectSnapshot project={project} meetings={meetings} />
        </div>
      </div>
    </section>
  )
}
