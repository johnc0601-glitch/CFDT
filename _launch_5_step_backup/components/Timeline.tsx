import type {Project} from '@/types/project'
import {getCountyWorkflow} from '@/lib/countyWorkflows'

type TimelineItem = NonNullable<Project['timeline']>[number]

function normalized(value?: string) {
  return value?.trim().toLowerCase() || ''
}

function stageState(status?: string) {
  const value = normalized(status)
  if (value === 'complete' || value === 'completed') return 'complete'
  if (value === 'current' || value === 'in progress') return 'current'
  return 'future'
}

function findProjectEntry(stageTitle: string, timeline: TimelineItem[]) {
  const title = normalized(stageTitle)
  const words = title.split(/\s+/).filter((word) => word.length > 3)

  return timeline.find((item) => {
    const candidate = normalized(item.title)
    if (candidate === title) return true
    return words.some((word) => candidate.includes(word))
  })
}

export function Timeline({
  timeline,
  countyName,
  projectType,
}: {
  timeline?: Project['timeline']
  countyName?: string
  projectType?: string
}) {
  const entries = timeline || []
  const workflow = getCountyWorkflow(countyName, projectType)

  const stages: TimelineItem[] =
    workflow.length > 0
      ? workflow.map((stage) => {
          const match = findProjectEntry(stage.title, entries)
          return {
            title: stage.title,
            description: match?.description || stage.description,
            date: match?.date,
            stageStatus: match?.stageStatus || 'Future',
          }
        })
      : entries

  if (!stages.length) {
    return <p className="text-slate-600">Timeline stages coming soon.</p>
  }

  return (
    <section>
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#6f8b63]">
            {countyName ? `${countyName} approval process` : 'Approval process'}
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Project Timeline</h2>
        </div>
        <p className="text-sm text-slate-500">Scroll sideways to view every stage.</p>
      </div>

      <div className="mt-8 overflow-x-auto pb-5" role="region" aria-label="Project approval stages" tabIndex={0}>
        <div className="flex min-w-max gap-7 px-1">
          {stages.map((item, index) => {
            const state = stageState(item.stageStatus)
            const complete = state === 'complete'
            const current = state === 'current'

            const dot = complete
              ? 'bg-[#315127] text-white ring-[#315127]/20'
              : current
                ? 'bg-[#244f73] text-white ring-[#244f73]/20'
                : 'bg-slate-200 text-slate-600 ring-slate-200/60'

            const line = complete ? 'bg-[#315127]' : 'bg-slate-200'
            const card = complete
              ? 'border-[#bed1b5] bg-[#f7faf5]'
              : current
                ? 'border-[#b9ccdc] bg-[#f7fafc]'
                : 'border-slate-200 bg-white'

            return (
              <article key={`${item.title}-${index}`} className="relative w-[250px] min-w-[250px] snap-start md:w-[280px] md:min-w-[280px]">
                <div className="relative flex h-12 items-center">
                  <div className={`relative z-10 grid h-11 w-11 place-items-center rounded-full text-sm font-bold ring-8 ${dot}`}>
                    {complete ? '✓' : index + 1}
                  </div>
                  {index < stages.length - 1 && (
                    <div className={`absolute left-11 right-[-28px] top-1/2 h-1 -translate-y-1/2 ${line}`} />
                  )}
                </div>

                <div className={`mt-4 min-h-[190px] rounded-2xl border p-5 shadow-sm ${card}`}>
                  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    {item.stageStatus || 'Future'}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold leading-snug">{item.title}</h3>
                  {item.date && <p className="mt-2 text-sm font-semibold text-[#6f8b63]">{item.date}</p>}
                  {item.description && <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
