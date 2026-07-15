import type {ProjectMedia} from '@/types/projectMedia'

type Props = {
  title: string
  description?: string
  items: ProjectMedia[]
}

export function MediaSection({title, description, items}: Props) {
  if (items.length === 0) return null

  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-3xl font-semibold">{title}</h2>
      {description && <p className="mt-2 text-slate-600">{description}</p>}

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {items.map((item) => (
          <article key={item._id} className="overflow-hidden rounded-xl border border-slate-200">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.imageAlt || item.title}
                className="h-72 w-full object-cover"
              />
            ) : (
              <div className="flex h-72 items-center justify-center bg-[#eef3ef] text-sm font-semibold text-slate-500">
                Image not uploaded
              </div>
            )}

            <div className="p-5">
              <h3 className="text-xl font-semibold">{item.title}</h3>
              {item.caption && <p className="mt-2 text-slate-600">{item.caption}</p>}
              {item.publicDescription && (
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {item.publicDescription}
                </p>
              )}
              {item.sourceDocument && (
                <p className="mt-4 text-xs text-slate-500">
                  Source: {item.sourceDocument}
                  {item.sourcePage ? `, page ${item.sourcePage}` : ''}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
