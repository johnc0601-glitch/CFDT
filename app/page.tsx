import {Header} from '@/components/Header'
import {Footer} from '@/components/Footer'
import {CountyCard} from '@/components/CountyCard'
import {DevelopmentCard} from '@/components/DevelopmentCard'
import {SectionHeader} from '@/components/SectionHeader'
import {StatsGrid} from '@/components/StatsGrid'
import {UpdatesFeed} from '@/components/UpdatesFeed'
import {HomeHero} from '@/components/HomeHero'
import {HomeSearch} from '@/components/HomeSearch'
import {getAllProjects, getRecentUpdates} from '@/lib/queries'
import {getProjectStats} from '@/lib/stats'
import {counties} from '@/site.config'

export default async function Home() {
  const [projects, updates] = await Promise.all([getAllProjects(), getRecentUpdates(4)])
  const stats = getProjectStats(projects)
  const featuredProjects = projects.slice(0, 3)
  const featured = projects.find((project) => project.heroImageUrl) || projects[0]

  return (
    <main className="min-h-screen bg-[#f3f5f2] text-[#142033]">
      <Header />
      <section className="mx-auto max-w-7xl space-y-12 px-4 py-6 md:px-6 md:py-10">
        <HomeHero featured={featured} />
        <section>
          <SectionHeader title="Browse by Jurisdiction" description="Start with the county or municipality responsible for development review." />
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {counties.map((county) => <CountyCard key={county.name} name={county.name} href={county.href} description={county.description} enabled={county.enabled} />)}
          </div>
        </section>
        <StatsGrid stats={[
          {label: 'Developments', value: stats.totalProjects},
          {label: 'Homes Proposed', value: stats.totalHomes},
          {label: 'Active Projects', value: stats.activeProjects},
          {label: 'Homes Remaining', value: stats.homesRemaining},
        ]} />
        <HomeSearch projects={projects} />
        <section>
          <SectionHeader title="Featured Developments" description="A quick look at active or recently updated projects." />
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {featuredProjects.map((project) => <DevelopmentCard key={project._id} project={project} />)}
          </div>
        </section>
        <UpdatesFeed updates={updates} />
      </section>
      <Footer />
    </main>
  )
}
