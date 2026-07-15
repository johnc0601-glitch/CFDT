import type {Project} from '@/types/project'

export function ProjectOverview({project}: {project: Project}) {
  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-bold uppercase tracking-widest text-[#6f8b63]">
        Overview
      </p>
      <h2 className="mt-2 text-3xl font-semibold">What is {project.name}?</h2>

      <p className="mt-5 max-w-4xl whitespace-pre-line text-lg leading-8 text-slate-700">
        {project.summary || 'A project summary has not been added yet.'}
      </p>
    </section>
  )
}
