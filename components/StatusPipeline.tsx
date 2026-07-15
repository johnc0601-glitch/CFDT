const stages = [
  'Concept / Early Review',
  'Under Review',
  'TRC Review',
  'Planning Board',
  'Commission / Council',
  'Conditional Preliminary Approval',
  'Approved',
  'Construction Plans',
  'Final Plat',
  'Under Construction',
  'Completed',
]

export function StatusPipeline({status}: {status?: string}) {
  const activeIndex = status ? stages.indexOf(status) : -1

  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-2xl font-semibold">Approval Status</h2>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        {stages.map((stage, index) => {
          const isActive = index === activeIndex
          const isComplete = activeIndex > index

          return (
            <div
              key={stage}
              className={`rounded-xl border p-4 text-sm font-semibold ${
                isActive
                  ? 'border-[#142033] bg-[#142033] text-white'
                  : isComplete
                    ? 'border-[#6f8b63] bg-[#dfe9d7] text-[#315127]'
                    : 'border-slate-200 bg-[#f3f5f2] text-slate-500'
              }`}
            >
              <div className="text-xs uppercase tracking-widest opacity-75">
                Step {index + 1}
              </div>
              <div className="mt-1">{stage}</div>
            </div>
          )
        })}
      </div>

      {status && activeIndex === -1 && (
        <p className="mt-4 text-sm text-slate-600">
          Current status: <strong>{status}</strong>
        </p>
      )}
    </section>
  )
}
