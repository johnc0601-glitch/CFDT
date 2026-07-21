import Link from 'next/link'
import {Header} from '@/components/Header'
import {Footer} from '@/components/Footer'
import {getAllProjects, getRecentUpdates} from '@/lib/queries'
import {getProjectStats} from '@/lib/stats'
import {counties} from '@/site.config'
import type {Project} from '@/types/project'

function normalizeCountyName(name?: string) {
  return name?.toLowerCase().replace(/\s+county$/, '').trim() || ''
}

function formatNumber(value?: number | null) {
  if (typeof value !== 'number') return '-'
  return value.toLocaleString()
}

function projectHref(project?: Project) {
  return project?.slug?.current ? `/projects/${project.slug.current}` : '/search'
}

function imageUrl(project?: Project, width = 520, height = 360) {
  const url = project?.heroImageUrl
  if (!url) return undefined
  if (!url.includes('cdn.sanity.io')) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}w=${width}&h=${height}&fit=crop&auto=format`
}

function statusTone(status?: string) {
  const value = status?.toLowerCase() || ''
  if (value.includes('approval')) return 'bg-[#dce9dd] text-[#18372f]'
  if (value.includes('pending')) return 'bg-[#fbf0cf] text-[#795b0b]'
  return 'bg-[#e8edf1] text-[#29445f]'
}

function countyCounts(projects: Project[]) {
  return counties.map((county) => {
    const normalizedName = normalizeCountyName(county.name)
    const count = projects.filter((project) => {
      const projectCounty = normalizeCountyName(project.countyName)
      const projectMunicipality = project.municipalityName?.toLowerCase().trim()
      const countyName = county.name.toLowerCase().trim()
      return projectCounty === normalizedName || projectMunicipality === countyName
    }).length

    return {...county, count}
  })
}

function PhotoHero({projects, featured}: {projects: Project[]; featured?: Project}) {
  const backgroundImage =
    imageUrl(featured, 1200, 620) ||
    imageUrl(projects.find((project) => project.heroImageUrl), 1200, 620)

  return (
    <div className="relative min-h-[430px] overflow-hidden border border-[#d7e1dc] bg-[#dfe9e4] shadow-sm">
      {backgroundImage ? (
        <img
          src={backgroundImage}
          alt="Cape Fear regional development context"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
          decoding="async"
        />
      ) : (
        <div className="absolute inset-0 bg-[#dfe9e4]" />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.42)_0%,rgba(255,255,255,0.13)_40%,rgba(13,74,52,0.16)_100%)]" />
      <div className="absolute inset-0 bg-[#e8f0eb]/15" />
      <div className="absolute bottom-5 left-5 z-10 border border-[#d7e1dc] bg-white/95 px-4 py-3 text-xs text-[#53685f] shadow-sm">
        <strong className="block text-[#18372f]">Cape Fear region</strong>
        A visual entry point for tracked development.
      </div>
    </div>
  )
}

function StatBlock({value, label}: {value: number; label: string}) {
  return (
    <div className="border-[#d7e1dc] px-5 py-4 first:pl-0 sm:border-l sm:first:border-l-0">
      <div className="font-serif text-4xl leading-none text-[#10251f]">
        {formatNumber(value)}
      </div>
      <div className="mt-2 text-[11px] font-black uppercase tracking-wide text-[#53685f]">
        {label}
      </div>
    </div>
  )
}

function FeaturedProject({project}: {project?: Project}) {
  return (
    <article className="grid overflow-hidden border border-[#d7e1dc] bg-white shadow-sm md:grid-cols-[minmax(0,0.86fr)_minmax(0,1fr)_94px]">
      {imageUrl(project) ? (
        <img
          src={imageUrl(project)}
          alt={project?.heroImageAlt || project?.name || 'Featured project'}
          className="h-64 w-full object-cover md:h-full"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="h-64 bg-[#e9efeb] md:h-full" />
      )}
      <div className="p-6">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#246b49]">
          Featured project
        </p>
        <h2 className="mt-4 font-serif text-4xl font-normal leading-none text-[#10251f]">
          {project?.name || 'Project snapshot'}
        </h2>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className={`px-3 py-1 font-black uppercase ${statusTone(project?.status)}`}>
            {project?.status || 'Pending'}
          </span>
          <span className="font-bold text-[#53685f]">
            {project?.countyName || 'Cape Fear'} / {project?.projectType || 'Development'}
          </span>
        </div>
        <p className="mt-4 max-w-xl text-sm leading-6 text-[#53685f]">
          {project?.latestUpdate || project?.summary || 'Project details are available for review.'}
        </p>
        <Link
          href={projectHref(project)}
          className="mt-5 inline-flex min-h-10 items-center border border-[#b9c8c0] px-4 text-xs font-black uppercase tracking-wide text-[#18372f]"
        >
          View project
        </Link>
      </div>
      <div className="flex min-h-36 flex-col justify-end bg-[#0d4a34] p-4 text-right text-white">
        <div className="font-serif text-5xl leading-none">
          {formatNumber(project?.homesProposed)}
        </div>
        <div className="mt-2 text-[10px] font-black uppercase tracking-wide text-[#c9dfd1]">
          Homes proposed
        </div>
      </div>
    </article>
  )
}

function CountyList({items}: {items: ReturnType<typeof countyCounts>}) {
  return (
    <aside className="border border-[#d7e1dc] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#246b49]">
          Browse by county
        </p>
        <Link href="/counties" className="text-xs font-black uppercase text-[#18372f]">
          All counties
        </Link>
      </div>
      <div className="mt-4 divide-y divide-[#d7e1dc]">
        {items.filter((county) => county.enabled).map((county) => (
          <Link
            href={county.href || '/counties'}
            key={county.name}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-4"
          >
            <span className="text-sm font-black leading-tight text-[#18372f]">
              {county.name}
            </span>
            <span className="text-xs font-bold text-[#53685f]">
              {county.count} projects
            </span>
          </Link>
        ))}
      </div>
    </aside>
  )
}

function ProjectCard({project}: {project: Project}) {
  return (
    <Link
      href={projectHref(project)}
      className="block border border-[#d7e1dc] bg-white shadow-sm transition hover:-translate-y-0.5"
    >
      {imageUrl(project, 460, 240) ? (
        <img
          src={imageUrl(project, 460, 240)}
          alt={project.heroImageAlt || project.name}
          className="h-36 w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="h-36 bg-[#e9efeb]" />
      )}
      <div className="p-4">
        <span className={`px-2 py-1 text-[10px] font-black uppercase ${statusTone(project.status)}`}>
          {project.status || 'Pending'}
        </span>
        <h3 className="mt-3 min-h-12 text-lg font-black leading-tight text-[#10251f]">
          {project.name}
        </h3>
        <p className="mt-2 text-sm text-[#53685f]">
          {project.countyName || 'Cape Fear County'}
        </p>
        <p className="mt-1 text-sm text-[#53685f]">
          {formatNumber(project.homesProposed)} homes
        </p>
        <p className="mt-4 text-xs font-black uppercase tracking-wide text-[#18372f]">
          View project
        </p>
      </div>
    </Link>
  )
}

export default async function Home() {
  const [projects, updates] = await Promise.all([getAllProjects(), getRecentUpdates(4)])
  const stats = getProjectStats(projects)
  const countySnapshots = countyCounts(projects)
  const acresUnderReview = projects.reduce(
    (sum, project) => sum + (project.siteAcres ?? project.totalSiteAcres ?? 0),
    0,
  )
  const pendingDecisions = projects.filter((project) => {
    const status = project.status?.toLowerCase() || ''
    return status.includes('pending') || status.includes('review')
  }).length
  const featured =
    projects.find((project) => project.name.toLowerCase().includes('piver')) ||
    projects.find((project) => project.heroImageUrl) ||
    projects[0]
  const featuredProjects = projects
    .filter((project) => project._id !== featured?._id)
    .slice(0, 3)

  return (
    <main className="min-h-screen bg-[#f7f9f6] text-[#19372f]">
      <Header />

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-7 md:px-6 lg:grid-cols-[minmax(330px,0.58fr)_minmax(0,1fr)]">
        <div className="relative z-10 flex min-h-[430px] flex-col justify-center border border-[#d7e1dc] bg-white/92 p-7 shadow-sm lg:-mr-16 lg:border-r-0">
          <h1 className="max-w-md font-serif text-5xl font-normal leading-[0.98] text-[#10251f] md:text-6xl">
            Understand what&apos;s being built.
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-7 text-[#53685f]">
            Track proposed and active development across the Cape Fear region
            with official documents, timelines, maps, and meeting details.
          </p>
          <div className="mt-6 border border-[#d7e1dc] bg-[#f7f9f6] p-2">
            <div className="flex">
              <div className="flex min-h-12 flex-1 items-center bg-white px-4 text-sm text-[#6a7d74]">
                Search projects, developers, counties, or parcel ID
              </div>
              <Link
                href="/search"
                className="grid min-h-12 w-14 place-items-center bg-[#0d4a34] text-sm font-black text-white"
              >
                Go
              </Link>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/search"
              className="bg-[#0d4a34] px-5 py-3 text-xs font-black uppercase tracking-wide text-white"
            >
              View all projects
            </Link>
          </div>
        </div>
        <PhotoHero projects={projects} featured={featured} />
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid border-y border-[#c8d3cc] bg-white sm:grid-cols-4">
          <StatBlock value={stats.totalProjects} label="Developments" />
          <StatBlock value={stats.totalHomes} label="Homes proposed" />
          <StatBlock value={acresUnderReview} label="Acres under review" />
          <StatBlock value={pendingDecisions} label="Pending decisions" />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <FeaturedProject project={featured} />
        <CountyList items={countySnapshots} />
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-8 md:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="border border-[#d7e1dc] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#246b49]">
              Recent updates
            </p>
            <Link href="/meetings" className="text-xs font-black uppercase text-[#18372f]">
              View all updates
            </Link>
          </div>
          <div className="mt-4 divide-y divide-[#d7e1dc]">
            {updates.slice(0, 4).map((update) => (
              <article
                key={update._id}
                className="grid grid-cols-[24px_minmax(0,1fr)] gap-3 py-4 first:pt-0 last:pb-0"
              >
                <div className="mt-1 grid h-5 w-5 place-items-center border border-[#b9c8c0] text-[10px] text-[#246b49]">
                  •
                </div>
                <div>
                  <h3 className="text-sm font-black leading-tight text-[#10251f]">
                    {update.title}
                  </h3>
                  <p className="mt-1 text-xs text-[#53685f]">
                    {[update.projectName, update.date].filter(Boolean).join(' / ')}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#246b49]">
              Featured developments
            </p>
            <Link href="/search" className="text-xs font-black uppercase text-[#18372f]">
              View all projects
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {featuredProjects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        </section>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8 md:px-6">
        <div className="flex flex-col gap-4 border border-[#d7e1dc] bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-bold text-[#18372f]">
            Stay informed. Get updates on projects that matter to you.
          </p>
          <Link
            href="/meetings"
            className="bg-[#0d4a34] px-5 py-3 text-xs font-black uppercase tracking-wide text-white"
          >
            Subscribe for updates
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
