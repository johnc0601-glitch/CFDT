import type {Project} from '@/types/project'

export function ProjectMetrics({project}: {project: Project}) {
  const items = [
    ['Homes Proposed', project.homesProposed],
    ['Developable Acres', project.siteAcres],
    ['Conservation / Floodplain', project.conservationFloodplainAcres],
    ['Current Status', project.status],
  ].filter(([, value]) => value !== undefined && value !== null && value !== '')

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(([label, value]) => (
        <div key={String(label)} className="rounded-2xl bg-[#0b5a35] p-6 text-white shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-white/70">{label}</p>
          <p className="mt-3 text-3xl font-semibold">
            {typeof value === 'number' ? value.toLocaleString() : String(value)}
            {String(label).includes('Acres') || String(label).includes('Floodplain') ? ' acres' : ''}
          </p>
        </div>
      ))}
    </section>
  )
}
