import type {Project} from '@/types/project'

export function LatestUpdate({project}: {project: Project}) {
  if (!project.latestUpdate) return null

  return (
    <section className="rounded-2xl bg-[#eef6ee] p-8 ring-1 ring-[#cfe0c8]">
      <p className="text-xs font-bold uppercase tracking-widest text-[#315127]">
        Current Status
      </p>
      <h2 className="mt-2 text-3xl font-semibold">Latest Update</h2>
      {project.latestUpdateDate && (
        <p className="mt-2 text-sm font-semibold text-[#315127]">
          {project.latestUpdateDate}
        </p>
      )}
      <p className="mt-5 max-w-4xl whitespace-pre-line text-lg leading-8 text-slate-700">
        {project.latestUpdate}
      </p>
    </section>
  )
}
