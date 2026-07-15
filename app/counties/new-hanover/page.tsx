import {Header} from '@/components/Header'
import {Footer} from '@/components/Footer'
import {DevelopmentCard} from '@/components/DevelopmentCard'
import {PageHero} from '@/components/PageHero'
import {SectionHeader} from '@/components/SectionHeader'
import {StatsGrid} from '@/components/StatsGrid'
import {SearchBox} from '@/components/SearchBox'
import {CountyResources} from '@/components/CountyResources'
import {getProjectsByCounty} from '@/lib/queries'
import {getProjectStats} from '@/lib/stats'

export default async function NewHanoverCountyPage() {
  const projects = await getProjectsByCounty('New Hanover County')
  const stats = getProjectStats(projects)

  return (
    <main className="min-h-screen bg-[#f3f5f2] text-[#142033]">
      <Header />
      <section className="mx-auto max-w-6xl space-y-12 px-6 py-10">
        <PageHero
          eyebrow="County"
          title="New Hanover County"
          description="Major development projects tracked in New Hanover County."
        />

        <StatsGrid
          stats={[
            {label: 'Developments', value: stats.totalProjects},
            {label: 'Homes Proposed', value: stats.totalHomes},
            {label: 'Active Projects', value: stats.activeProjects},
            {label: 'County', value: 'NHC'},
          ]}
        />

        <CountyResources countyName="New Hanover County" />

        <section>
          <SectionHeader title="Search Developments" />
          <div className="mt-6">
            <SearchBox projects={projects} />
          </div>
        </section>

        <section>
          <SectionHeader title="All Developments" />
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {projects.map((project) => (
              <DevelopmentCard key={project._id} project={project} />
            ))}
          </div>
        </section>
      </section>
      <Footer />
    </main>
  )
}
