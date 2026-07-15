import type {Project} from '@/types/project'

export function HeroPhoto({project}: {project: Project}) {
  if (project.heroImageUrl) {
    return (
      <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <img
          src={project.heroImageUrl}
          alt={project.heroImageAlt || project.name}
          className="h-[260px] w-full object-cover md:h-[420px]"
        />
        {project.heroImageCaption && (
          <p className="px-6 py-4 text-sm text-slate-600">
            {project.heroImageCaption}
          </p>
        )}
      </section>
    )
  }

  return (
    <section className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-bold uppercase tracking-widest text-[#6f8b63]">
        Hero Photo
      </p>
      <h2 className="mt-3 text-2xl font-semibold">No hero photo added yet</h2>
      <p className="mt-3 text-slate-600">
        Add one in Sanity under the development&apos;s Hero Photo field.
      </p>
    </section>
  )
}
