import type {Project} from '@/types/project'

export function DevelopmentMetrics({project}: {project: Project}) {
  const siteAcres = project.siteAcres ?? project.totalSiteAcres
  const density = project.homesProposed && siteAcres ? project.homesProposed / siteAcres : undefined
  const openSpacePercent = project.openSpaceAcres && siteAcres ? (project.openSpaceAcres / siteAcres) * 100 : undefined
  const wetlandsPercent = project.wetlandsAcres && siteAcres ? (project.wetlandsAcres / siteAcres) * 100 : undefined

  const metrics = [
    {label: 'Density', value: density ? density.toFixed(2) : undefined, suffix: 'units/ac'},
    {label: 'Open Space', value: openSpacePercent ? openSpacePercent.toFixed(1) : undefined, suffix: '%'},
    {label: 'Wetlands', value: wetlandsPercent ? wetlandsPercent.toFixed(1) : undefined, suffix: '%'},
    {label: 'Commercial SF', value: project.commercialSquareFeet},
    {label: 'Affordable Units', value: project.affordableHousingUnits},
  ].filter((item) => item.value !== undefined && item.value !== null)

  if (metrics.length === 0) {
    return <p className="text-slate-600">Development metrics will appear when enough data is entered.</p>
  }

  return (
    <section>
      <h2 className="text-2xl font-semibold">Development Metrics</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl border border-slate-200 p-5 text-center">
            <div className="text-3xl font-semibold">
              {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
              {metric.suffix && <span className="text-base"> {metric.suffix}</span>}
            </div>
            <div className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-500">{metric.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
