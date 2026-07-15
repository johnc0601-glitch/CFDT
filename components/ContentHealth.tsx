import type {Project} from '@/types/project'
import type {ProjectMedia} from '@/types/projectMedia'
import type {ProjectDocument} from '@/types/projectDocument'
import {getContentHealth} from '@/lib/stats'

export function ContentHealth({
  project,
  media,
  documents,
}: {
  project: Project
  media: ProjectMedia[]
  documents: ProjectDocument[]
}) {
  const health = getContentHealth(project, media, documents)

  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#6f8b63]">Content Health</p>
          <h2 className="mt-2 text-2xl font-semibold">{health.score}% Complete</h2>
        </div>

        <div className="h-4 overflow-hidden rounded-full bg-slate-100 md:w-64">
          <div className="h-full rounded-full bg-[#6f8b63]" style={{width: `${health.score}%`}} />
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {health.checks.map((check) => (
          <div
            key={check.label}
            className={`rounded-xl p-4 text-sm font-semibold ${
              check.complete ? 'bg-[#dfe9d7] text-[#315127]' : 'bg-[#f3f5f2] text-slate-600'
            }`}
          >
            {check.complete ? '✓' : '□'} {check.label}
          </div>
        ))}
      </div>
    </section>
  )
}
