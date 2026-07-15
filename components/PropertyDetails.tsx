import type {Project} from '@/types/project'

const fields: {label: string; key: keyof Project}[] = [
  {label: 'Zoning', key: 'zoning'},
  {label: 'Future Land Use', key: 'futureLandUse'},
  {label: 'Water Provider', key: 'waterProvider'},
  {label: 'Sewer Provider', key: 'sewerProvider'},
  {label: 'School District', key: 'schoolDistrict'},
  {label: 'Fire District', key: 'fireDistrict'},
  {label: 'Flood Zone', key: 'floodZone'},
  {label: 'Watershed', key: 'watershed'},
]

export function PropertyDetails({project}: {project: Project}) {
  const visible = fields.filter((field) => project[field.key])

  if (visible.length === 0) {
    return <p className="text-slate-600">Property details have not been added yet.</p>
  }

  return (
    <section>
      <h2 className="text-2xl font-semibold">Property Details</h2>
      <dl className="mt-6 grid gap-4 md:grid-cols-2">
        {visible.map((field) => (
          <div key={field.label} className="rounded-xl border border-slate-200 p-5">
            <dt className="text-xs font-bold uppercase tracking-widest text-[#6f8b63]">{field.label}</dt>
            <dd className="mt-2 text-lg font-semibold">{project[field.key] as string}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
