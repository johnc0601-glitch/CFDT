import type {Project} from '@/types/project'

export function ProjectFacts({project}: {project: Project}) {
  const facts = [
    ['Homes Proposed', project.homesProposed],
    ['Developable Acres', project.siteAcres],
    ['Total Property', project.totalPropertyAcres],
    ['Conservation / Floodplain', project.conservationFloodplainAcres],
    ['Location', project.locationDescription],
    ['Developer / Applicant', project.developer],
    ['Engineer / Planner', project.engineer],
    ['Approving Authority', project.approvingAuthority],
    ['Parcel ID', project.parcelId],
    ['Zoning', project.zoning],
    ['Water', project.waterProvider],
    ['Sewer', project.sewerProvider],
    ['Last Updated', project.latestUpdateDate],
  ].filter(([, value]) => value !== undefined && value !== null && value !== '')

  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-bold uppercase tracking-widest text-[#6f8b63]">
        At a Glance
      </p>
      <h2 className="mt-2 text-3xl font-semibold">Project Facts</h2>

      <dl className="mt-6 grid gap-x-10 md:grid-cols-2">
        {facts.map(([label, value]) => {
          const acreage = [
            'Developable Acres',
            'Total Property',
            'Conservation / Floodplain',
          ].includes(String(label))

          return (
            <div
              key={String(label)}
              className="flex items-start justify-between gap-6 border-b border-slate-200 py-4"
            >
              <dt className="font-semibold text-slate-500">{label}</dt>
              <dd className="max-w-[62%] text-right font-bold text-[#142033]">
                {typeof value === 'number'
                  ? value.toLocaleString()
                  : String(value)}
                {acreage ? ' acres' : ''}
              </dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}
