import type {Project} from '@/types/project'

type Fact = {
  label: string
  value?: string | number
}

export function QuickFacts({project}: {project: Project}) {
  const siteAcres = project.siteAcres ?? project.totalSiteAcres

  const facts: Fact[] = [
    {label: 'Homes Proposed', value: project.homesProposed},
    {label: 'Site Acres', value: siteAcres},
    {label: 'Developer', value: project.developer},
    {label: 'Engineer / Planner', value: project.engineer},
    {label: 'Current Status', value: project.status},
    {label: 'Approving Authority', value: project.approvingAuthority},
    {label: 'County', value: project.countyName},
    {label: 'Municipality', value: project.municipalityName},
    {label: 'Parcel ID', value: project.parcelId},
    {label: 'Zoning', value: project.zoning},
    {label: 'Future Land Use', value: project.futureLandUse},
    {label: 'Water Provider', value: project.waterProvider},
    {label: 'Sewer Provider', value: project.sewerProvider},
    {label: 'Last Updated', value: project.latestUpdateDate},
  ].filter((fact) => fact.value !== undefined && fact.value !== null && fact.value !== '')

  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-bold uppercase tracking-widest text-[#6f8b63]">
        Project Details
      </p>
      <h2 className="mt-2 text-3xl font-semibold">Quick Facts</h2>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {facts.map((fact) => (
          <div key={fact.label} className="rounded-xl border border-slate-200 p-5">
            <dt className="text-xs font-bold uppercase tracking-widest text-slate-500">
              {fact.label}
            </dt>
            <dd className="mt-2 text-lg font-semibold text-[#142033]">
              {typeof fact.value === 'number'
                ? fact.value.toLocaleString()
                : fact.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
