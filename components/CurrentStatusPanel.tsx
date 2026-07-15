import type {Project} from '@/types/project'

export function CurrentStatusPanel({project}: {project: Project}) {
  if (!project.latestUpdate && !project.nextStep) return null

  return (
    <section className="grid gap-5 lg:grid-cols-2">
      {project.latestUpdate && (
        <article className="rounded-2xl bg-[#eef6ee] p-8 ring-1 ring-[#cfe0c8]">
          <p className="text-xs font-bold uppercase tracking-widest text-[#315127]">
            Latest Action
          </p>

          {project.latestUpdateDate && (
            <p className="mt-2 text-sm font-semibold text-[#315127]">
              {project.latestUpdateDate}
            </p>
          )}

          <p className="mt-4 whitespace-pre-line text-lg leading-8 text-slate-700">
            {project.latestUpdate}
          </p>
        </article>
      )}

      {project.nextStep && (
        <article className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-bold uppercase tracking-widest text-[#6f8b63]">
            Next Step
          </p>

          <p className="mt-4 whitespace-pre-line text-lg leading-8 text-slate-700">
            {project.nextStep}
          </p>
        </article>
      )}
    </section>
  )
}
