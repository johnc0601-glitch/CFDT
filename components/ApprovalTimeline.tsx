import type {Project} from '@/types/project'

export function ApprovalTimeline({timeline}: {timeline?: Project['timeline']}) {
  if (!timeline?.length) {
    return <p className="text-slate-600">Timeline entries have not been added yet.</p>
  }

  return (
    <div className="space-y-6">
      {timeline.map((item, index) => {
        const state =
          item.stageStatus === 'Complete'
            ? 'bg-[#315127] text-white'
            : item.stageStatus === 'Current'
              ? 'bg-[#244f73] text-white'
              : 'bg-slate-200 text-slate-600'

        return (
          <article key={`${item.title}-${index}`} className="grid grid-cols-[36px_1fr] gap-4">
            <div className="flex flex-col items-center">
              <div className={`grid h-9 w-9 place-items-center rounded-full text-sm font-bold ${state}`}>
                {index + 1}
              </div>
              {index < timeline.length - 1 && <div className="mt-2 h-full w-px bg-slate-200" />}
            </div>

            <div className="pb-6">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-xl font-semibold">{item.title}</h3>
                {item.stageStatus && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-600">
                    {item.stageStatus}
                  </span>
                )}
              </div>
              {item.date && <p className="mt-1 text-sm text-slate-500">{item.date}</p>}
              {item.description && <p className="mt-3 leading-7 text-slate-700">{item.description}</p>}
            </div>
          </article>
        )
      })}
    </div>
  )
}
