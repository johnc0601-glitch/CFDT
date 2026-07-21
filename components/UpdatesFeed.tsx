import Link from 'next/link'
import type {ProjectUpdate} from '@/types/projectUpdate'

export function UpdatesFeed({updates}: {updates: ProjectUpdate[]}) {
  return (
    <section className="border border-[#dce5df] bg-white p-8 shadow-sm">
      <h2 className="font-serif text-4xl font-normal leading-none text-[#10251f]">Recent Updates</h2>

      {updates.length === 0 ? (
        <p className="mt-4 text-[#62756d]">No updates published yet.</p>
      ) : (
        <div className="mt-6 divide-y divide-[#dce5df]">
          {updates.map((update) => (
            <article key={update._id} className="py-5 first:pt-0 last:pb-0">
              <p className="text-xs font-black uppercase tracking-[0.13em] text-[#2f8a55]">
                {update.date || 'Update'}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-[#10251f]">{update.title}</h3>
              {update.projectName && update.projectSlug && (
                <Link href={`/projects/${update.projectSlug}`} className="mt-1 inline-block text-sm font-semibold text-[#245044] hover:text-[#2f8a55]">
                  {update.projectName}
                </Link>
              )}
              {update.summary && <p className="mt-3 text-[#62756d]">{update.summary}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
