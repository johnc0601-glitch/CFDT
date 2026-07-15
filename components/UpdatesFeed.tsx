import Link from 'next/link'
import type {ProjectUpdate} from '@/types/projectUpdate'

export function UpdatesFeed({updates}: {updates: ProjectUpdate[]}) {
  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-2xl font-semibold">Recent Updates</h2>

      {updates.length === 0 ? (
        <p className="mt-4 text-slate-600">No updates published yet.</p>
      ) : (
        <div className="mt-6 divide-y divide-slate-200">
          {updates.map((update) => (
            <article key={update._id} className="py-5 first:pt-0 last:pb-0">
              <p className="text-xs font-bold uppercase tracking-widest text-[#6f8b63]">
                {update.date || 'Update'}
              </p>
              <h3 className="mt-2 text-xl font-semibold">{update.title}</h3>
              {update.projectName && update.projectSlug && (
                <Link href={`/projects/${update.projectSlug}`} className="mt-1 inline-block text-sm font-semibold text-[#244f73]">
                  {update.projectName}
                </Link>
              )}
              {update.summary && <p className="mt-3 text-slate-600">{update.summary}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
