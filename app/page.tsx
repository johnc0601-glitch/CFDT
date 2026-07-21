import {Header} from '@/components/Header'
import {Footer} from '@/components/Footer'
import {DevelopmentCard} from '@/components/DevelopmentCard'
import {SectionHeader} from '@/components/SectionHeader'
import {UpdatesFeed} from '@/components/UpdatesFeed'
import {HomeHero} from '@/components/HomeHero'
import {HomeSearch} from '@/components/HomeSearch'
import {getAllProjects, getRecentUpdates} from '@/lib/queries'
import {getProjectStats} from '@/lib/stats'
import {counties} from '@/site.config'

function normalizeCountyName(name?: string) {
  return name?.toLowerCase().replace(/\s+county$/, '').trim() || ''
}

export default async function Home() {
  const [projects, updates] = await Promise.all([getAllProjects(), getRecentUpdates(4)])
  const stats = getProjectStats(projects)
  const featured =
    projects.find((project) => project.name.toLowerCase().includes('piver')) ||
    projects.find((project) => project.latestUpdate || project.nextStep) ||
    projects[0]
  const featuredProjects = projects
    .filter((project) => project._id !== featured?._id)
    .slice(0, 3)
  const statItems = [
    {label: 'Developments', value: stats.totalProjects},
    {label: 'Homes Proposed', value: stats.totalHomes},
    {label: 'Active Projects', value: stats.activeProjects},
    {label: 'Homes Remaining', value: stats.homesRemaining},
  ]
  const countySnapshots = counties.map((county) => {
    const normalizedName = normalizeCountyName(county.name)
    const count = projects.filter((project) => {
      const projectCounty = normalizeCountyName(project.countyName)
      const projectMunicipality = project.municipalityName?.toLowerCase().trim()
      const countyName = county.name.toLowerCase().trim()

      return (
        projectCounty === normalizedName ||
        projectMunicipality === countyName
      )
    }).length

    return {...county, count}
  })

  return (
    <main className="min-h-screen bg-[#fbfcfa] text-[#19372f]">
      <Header />
      <section className="mx-auto max-w-7xl space-y-12 px-4 py-6 md:px-6 md:py-10">
        <HomeHero featured={featured} stats={statItems} counties={countySnapshots} />
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
