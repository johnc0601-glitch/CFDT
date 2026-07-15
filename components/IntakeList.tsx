import type {ProjectIntake} from '@/types/projectIntake'

export function IntakeList({intakes}: {intakes: ProjectIntake[]}) {
  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-2xl font-semibold">Project Intake / AI Drafts</h2>

      {intakes.length === 0 ? (
        <p className="mt-4 text-slate-600">No intake drafts yet. Create drafts in Sanity using Project Intake / AI Drafts.</p>
      ) : (
        <div className="mt-6 grid gap-4">
          {intakes.map((draft) => (
            <article key={draft._id} className="rounded-xl border border-slate-200 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#6f8b63]">{draft.status || 'Draft'}</p>
                  <h3 className="mt-2 text-xl font-semibold">{draft.projectName || draft.title}</h3>
                  {draft.developer && <p className="mt-1 text-sm text-slate-600">Developer: {draft.developer}</p>}
                  {draft.homesProposed && <p className="mt-1 text-sm text-slate-600">{draft.homesProposed.toLocaleString()} homes proposed</p>}
                  {draft.draftSummary && <p className="mt-3 text-slate-600">{draft.draftSummary}</p>}
                </div>
                <a className="rounded-xl bg-[#142033] px-4 py-2 text-sm font-semibold text-white" href="http://localhost:3333" target="_blank">
                  Review in Sanity
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
