import type {Project} from '@/types/project'

export function SourcesUsed({sources}: {sources?: Project['sourcesUsed']}) {
  if (!sources?.length) return null

  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-3xl font-semibold">Sources Used</h2>
      <p className="mt-2 text-slate-600">
        Official records used to prepare this project page.
      </p>

      <ul className="mt-6 divide-y divide-slate-200">
        {sources.map((source, index) => (
          <li
            key={`${source.title}-${index}`}
            className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="font-semibold">{source.title || 'Official source'}</p>
              {source.sourceDate && (
                <p className="text-sm text-slate-500">{source.sourceDate}</p>
              )}
            </div>

            {source.url && (
              <a
                href={source.url}
                target="_blank"
                className="font-bold text-[#0b5a35]"
              >
                View official source →
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
