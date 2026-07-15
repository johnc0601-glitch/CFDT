import type {ProjectGraphic} from '@/types/projectGraphic'

export function GraphicGallery({graphics}: {graphics: ProjectGraphic[]}) {
  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-2xl font-semibold">Project Graphics</h2>

      {graphics.length === 0 ? (
        <p className="mt-4 text-slate-600">Graphics coming soon.</p>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {graphics.map((graphic) => (
            <article key={graphic._id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              {graphic.imageUrl ? (
                <img
                  src={graphic.imageUrl}
                  alt={graphic.title}
                  className="h-48 w-full object-cover"
                />
              ) : (
                <div className="flex h-48 items-center justify-center bg-[#eef3ef] text-sm font-semibold text-slate-500">
                  Image not uploaded yet
                </div>
              )}

              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-[#6f8b63]">
                  {graphic.category || 'Graphic'}
                </p>
                <h3 className="mt-2 text-xl font-semibold">{graphic.title}</h3>
                {graphic.publicDescription && (
                  <p className="mt-3 text-sm text-slate-600">{graphic.publicDescription}</p>
                )}
                {graphic.sourceDocument && (
                  <p className="mt-4 text-xs text-slate-500">
                    Source: {graphic.sourceDocument}
                    {graphic.sourcePage ? `, page ${graphic.sourcePage}` : ''}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
