import type {ProjectDocument} from '@/types/projectDocument'

const typeOrder = [
  'Staff Report',
  'Site Plan',
  'Traffic Study',
  'Environmental Report',
  'Utility Letter',
  'Stormwater Report',
  'Agenda Packet',
  'Meeting Minutes',
  'Other',
]

export function DocumentSidebar({documents}: {documents: ProjectDocument[]}) {
  if (documents.length === 0) {
    return (
      <aside className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-2xl font-semibold">Documents</h2>
        <p className="mt-4 text-slate-600">No documents added yet.</p>
      </aside>
    )
  }

  return (
    <aside className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-2xl font-semibold">Documents</h2>

      <div className="mt-5 space-y-5">
        {typeOrder.map((type) => {
          const items = documents.filter((doc) => (doc.documentType || 'Other') === type)
          if (!items.length) return null

          return (
            <section key={type}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                {type}
              </h3>
              <ul className="mt-2 space-y-2">
                {items.map((doc) => (
                  <li key={doc._id}>
                    <a
                      href={doc.officialUrl || doc.fileUrl || '#'}
                      target="_blank"
                      className="block rounded-lg px-3 py-2 font-medium text-[#0b5a35] hover:bg-[#eef6ee]"
                    >
                      {doc.title}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </aside>
  )
}
