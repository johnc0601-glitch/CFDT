export function ConfidenceBar() {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="grid gap-4 text-sm md:grid-cols-3">
        <div>
          <p className="font-bold text-[#315127]">● Verified</p>
          <p className="text-slate-500">From official documents</p>
        </div>
        <div>
          <p className="font-bold text-amber-600">● Estimated</p>
          <p className="text-slate-500">From plans or analysis</p>
        </div>
        <div>
          <p className="font-bold text-sky-600">● Needs Review</p>
          <p className="text-slate-500">Missing or incomplete data</p>
        </div>
      </div>
    </section>
  )
}
