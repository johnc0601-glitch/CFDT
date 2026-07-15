import {notFound} from 'next/navigation'
import {Header} from '@/components/Header'
import {Footer} from '@/components/Footer'
import {DevelopmentCard} from '@/components/DevelopmentCard'
import {PageHero} from '@/components/PageHero'
import {SearchBox} from '@/components/SearchBox'
import {SectionHeader} from '@/components/SectionHeader'
import {StatsGrid} from '@/components/StatsGrid'
import {getProjectsByCounty} from '@/lib/queries'
import {getProjectStats} from '@/lib/stats'
import {countyDirectory} from '@/lib/countyDirectory'

type Props = {
  params: Promise<{slug: string}>
}

export default async function CountyPage({params}: Props) {
  const {slug} = await params
  const county = countyDirectory.find((item) => item.slug === slug)
  if (!county) notFound()

  const projects = await getProjectsByCounty(county.name)
  const stats = getProjectStats(projects)

  return (
    <main className="min-h-screen bg-[#f3f5f2] text-[#142033]">
      <Header />
      <section className="mx-auto max-w-7xl space-y-10 px-4 py-8 md:px-6">
        <PageHero
          eyebrow="County"
          title={county.name}
          description={county.description}
        />

        <StatsGrid
          stats={[
            {label: 'Developments', value: stats.totalProjects},
            {label: 'Homes Proposed', value: stats.totalHomes},
            {label: 'Active Projects', value: stats.activeProjects},
            {label: 'Homes Remaining', value: stats.homesRemaining},
          ]}
        />

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <SectionHeader
            title="Official County Resources"
            description="Planning, project records, development rules, and mapping."
          />
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {county.resources.map((resource) => (
              <a
                key={resource.title}
                href={resource.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-slate-200 p-4 hover:border-[#6f8b63]"
              >
                <h3 className="font-bold text-[#244f73]">{resource.title} →</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {resource.description}
                </p>
              </a>
            ))}
          </div>
        </section>

        <section>
          <SectionHeader
            title="Search Developments"
            description="Search by name, status, developer, engineer, or parcel ID."
          />
          <div className="mt-5">
            <SearchBox projects={projects} />
          </div>
        </section>

        <section>
          <SectionHeader
            title="Major Residential Developments"
            description={`${projects.length} tracked project${projects.length === 1 ? '' : 's'}.`}
          />
          {projects.length ? (
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <DevelopmentCard key={project._id} project={project} />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl bg-white p-8 text-slate-600 shadow-sm ring-1 ring-slate-200">
              Projects assigned to {county.name} will appear here automatically.
            </div>
          )}
        </section>
      </section>
      <Footer />
    </main>
  )
}
