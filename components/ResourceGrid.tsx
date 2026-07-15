import type {Project} from '@/types/project'

export function ResourceGrid({resources}: {resources?: Project['officialResources']}) {
  return (
    <section>
      <h2 className="text-2xl font-semibold">Official Resources</h2>

      {!resources || resources.length === 0 ? (
        <p className="mt-4 text-slate-600">Official links coming soon.</p>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {resources.map((resource, index) => (
            <a
              key={index}
              href={resource.url || '#'}
              className="rounded-xl border border-slate-200 p-5 font-semibold text-[#244f73]"
              target="_blank"
            >
              {resource.label || 'Official Resource'} →
            </a>
          ))}
        </div>
      )}
    </section>
  )
}
