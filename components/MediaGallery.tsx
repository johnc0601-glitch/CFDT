import type {ProjectMedia} from '@/types/projectMedia'

const categoryOrder = [
  'Photos',
  'Location Map',
  'Site Plan',
  'Environmental',
  'Transportation',
  'Utilities',
  'Stormwater',
  'Open Space',
  'Renderings',
  'Other',
]

const categoryDescriptions: Record<string, string> = {
  Photos: 'General photos related to the development.',
  'Location Map': 'Maps showing where the development is located.',
  'Site Plan': 'Plans showing the proposed layout of the development.',
  Environmental: 'Wetlands, buffers, conservation areas, and other environmental exhibits.',
  Transportation: 'Road access, traffic improvements, entrances, and circulation.',
  Utilities: 'Water, sewer, and utility-related exhibits.',
  Stormwater: 'Drainage, stormwater, and flood-related exhibits.',
  'Open Space': 'Parks, conservation areas, buffers, and preserved land.',
  Renderings: 'Conceptual or architectural renderings.',
  Other: 'Other supporting visuals.',
}

function groupMedia(media: ProjectMedia[]) {
  return categoryOrder
    .map((category) => ({
      category,
      items: media.filter((item) => item.category === category),
    }))
    .filter((group) => group.items.length > 0)
}

export function MediaGallery({media}: {media: ProjectMedia[]}) {
  const groups = groupMedia(media)

  return (
    <section className="space-y-8">
      {media.length === 0 ? (
        <div>
          <h2 className="text-2xl font-semibold">Project Library</h2>
          <p className="mt-4 text-slate-600">No visuals have been added yet.</p>
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.category}>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#6f8b63]">Project Library</p>
              <h2 className="mt-2 text-2xl font-semibold">{group.category}</h2>
              <p className="mt-2 text-sm text-slate-600">{categoryDescriptions[group.category]}</p>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {group.items.map((item) => (
                <article key={item._id} className="overflow-hidden rounded-xl border border-slate-200">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.imageAlt || item.title} className="h-52 w-full object-cover" />
                  ) : (
                    <div className="flex h-52 items-center justify-center bg-[#eef3ef] text-sm font-semibold text-slate-500">
                      Image not uploaded
                    </div>
                  )}

                  <div className="p-5">
                    <h3 className="text-xl font-semibold">{item.title}</h3>
                    {item.caption && <p className="mt-2 text-sm text-slate-600">{item.caption}</p>}
                    {item.publicDescription && <p className="mt-3 text-sm text-slate-600">{item.publicDescription}</p>}
                    {item.sourceDocument && (
                      <p className="mt-4 text-xs text-slate-500">
                        Source: {item.sourceDocument}{item.sourcePage ? `, page ${item.sourcePage}` : ''}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))
      )}
    </section>
  )
}
