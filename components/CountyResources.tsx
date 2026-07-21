type Resource = {
  title: string
  description: string
  href: string
}

const countyResources: Record<string, Resource[]> = {
  'New Hanover County': [
    {title: 'Unified Development Ordinance', description: 'County development regulations and procedures.', href: 'https://www.nhcgov.com/536/Applications-Ordinances'},
    {title: 'Planning & Land Use', description: 'Applications, contacts, meetings, and development review.', href: 'https://www.nhcgov.com/155/Planning-Land-Use'},
    {title: 'County GIS', description: 'Parcel, zoning, floodplain, and map information.', href: 'https://gis.nhcgov.com/'},
    {title: 'Meeting Calendar', description: 'Public meetings and county agendas.', href: 'https://www.nhcgov.com/calendar.aspx'},
  ],
  'Pender County': [
    {title: 'Unified Development Ordinance', description: 'County zoning and subdivision regulations.', href: 'https://nc-pendercounty.civicplus.com/DocumentCenter/View/265/Pender-County-Unified-Development-Ordinance-PDF'},
    {title: 'Planning & Community Development', description: 'Applications, staff contacts, and development review.', href: 'https://www.pendercountync.gov/184/Planning-Community-Development'},
    {title: 'County GIS', description: 'Parcel and mapping tools.', href: 'https://gis.pendercountync.gov/'},
    {title: 'Meetings', description: 'County boards, agendas, and public meetings.', href: 'https://www.pendercountync.gov/calendar.aspx'},
  ],
  'Brunswick County': [
    {title: 'Unified Development Ordinance', description: 'County development and subdivision standards.', href: 'https://www.brunswickcountync.gov/DocumentCenter/View/5460'},
    {title: 'Planning Department', description: 'Applications, review procedures, and contacts.', href: 'https://www.brunswickcountync.gov/1139/Planning'},
    {title: 'County GIS', description: 'Parcel, zoning, and mapping information.', href: 'https://experience.arcgis.com/experience/0201d27723244840aea67c9f85892953'},
    {title: 'Meetings', description: 'Planning Board and county meeting information.', href: 'https://www.brunswickcountync.gov/calendar.aspx'},
  ],
}

export function CountyResources({countyName}: {countyName: string}) {
  const resources = countyResources[countyName] || []

  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-bold uppercase tracking-widest text-[#6f8b63]">Official sources</p>
      <h2 className="mt-2 text-2xl font-semibold">County Resources</h2>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {resources.map((resource) => (
          <a
            key={resource.title}
            href={resource.href}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-[#6f8b63] hover:shadow-sm"
          >
            <h3 className="font-semibold text-[#244f73]">{resource.title} →</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{resource.description}</p>
          </a>
        ))}
      </div>
    </section>
  )
}
