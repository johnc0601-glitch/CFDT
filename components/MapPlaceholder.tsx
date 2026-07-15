import type {Project} from '@/types/project'

export function MapPlaceholder({projects}: {projects: Project[]}) {
  return (
    <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
        <div className="min-h-[420px] rounded-2xl bg-[#eef3ef] ring-1 ring-slate-200">
          <div className="flex h-full min-h-[420px] items-center justify-center p-8 text-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-[#6f8b63]">
                Map Explorer
              </p>
              <h2 className="mt-3 text-3xl font-semibold">GIS map coming soon</h2>
              <p className="mt-3 max-w-md text-slate-600">
                This page is ready for MapLibre. Projects with latitude and longitude
                can appear here as clickable points.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold">Mapped Developments</h2>
          <div className="mt-5 space-y-3">
            {projects.length === 0 ? (
              <p className="text-slate-600">No developments available yet.</p>
            ) : (
              projects.map((project) => (
                <a
                  key={project._id}
                  href={project.slug?.current ? `/projects/${project.slug.current}` : '#'}
                  className="block rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
                >
                  <p className="font-semibold">{project.name}</p>
                  <p className="text-sm text-slate-600">{project.status || 'Status pending'}</p>
                </a>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
