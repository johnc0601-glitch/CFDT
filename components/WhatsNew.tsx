import type {Project} from '@/types/project'
import type {ProjectDocument} from '@/types/projectDocument'
import type {Meeting} from '@/types/meeting'

export function WhatsNew({
  project,
  documents,
  meetings,
}: {
  project: Project
  documents: ProjectDocument[]
  meetings: Meeting[]
}) {
  const items = [
    project.latestUpdate ? {label: project.latestUpdate, date: project.latestUpdateDate} : null,
    documents[0] ? {label: `${documents[0].title} added`, date: documents[0].documentDate} : null,
    meetings[0] ? {label: `${meetings[0].title} scheduled`, date: meetings[0].meetingDate} : null,
  ].filter(Boolean) as {label: string; date?: string}[]

  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-2xl font-semibold">What&apos;s New</h2>

      {items.length === 0 ? (
        <p className="mt-4 text-slate-600">No recent updates yet.</p>
      ) : (
        <div className="mt-5 space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0">
              <p className="text-slate-700">✓ {item.label}</p>
              {item.date && <p className="shrink-0 text-sm text-slate-500">{item.date}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
