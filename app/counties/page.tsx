import Link from 'next/link'
import {Header} from '@/components/Header'
import {Footer} from '@/components/Footer'
import {PageHero} from '@/components/PageHero'
import {getAllProjects} from '@/lib/queries'
import {getProjectStats} from '@/lib/stats'
import {countyDirectory} from '@/lib/countyDirectory'
import type {Project} from '@/types/project'

function normalizeCountyName(name?: string) {
  return name?.toLowerCase().replace(/\s+county$/, '').trim() || ''
}

function projectsForCounty(projects: Project[], countyName: string) {
  const normalizedName = normalizeCountyName(countyName)
  return projects.filter(
    (project) => normalizeCountyName(project.countyName) === normalizedName,
  )
}

function formatNumber(value: number) {
  return value.toLocaleString()
}

export default async function CountiesPage() {
  const projects = await getAllProjects()
  const countySummaries = countyDirectory.map((county) => {
    const countyProjects = projectsForCounty(projects, county.name)
    const stats = getProjectStats(countyProjects)
    const largestProject = [...countyProjects].sort(
      (a, b) => (b.homesProposed || 0) - (a.homesProposed || 0),
    )[0]

    return {
      ...county,
      stats,
      largestProject,
    }
  })

  return (
    <main className="min-h-screen bg-[#fbfcfa] text-[#19372f]">
      <Header />
      <section className="mx-auto max-w-7xl space-y-10 px-4 py-8 md:px-6">
        <PageHero
          eyebrow="Counties"
          title="Browse by county"
          description="Compare tracked development activity across the Cape Fear region, then open a county page for project lists, search, and official resources."
        />

        <section className="grid gap-5 lg:grid-cols-3">
          {countySummaries.map((county) => (
            <Link
              key={county.slug}
              href={`/counties/${county.slug}`}
              className="group flex min-h-[390px] flex-col border border-[#dce5df] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.14em] text-[#2f8a55] before:h-0.5 before:w-6 before:bg-[#2f8a55]">
                County
              </p>
              <h2 className="mt-4 font-serif text-4xl font-normal leading-none text-[#10251f]">
                {county.name}
              </h2>
              <p className="mt-4 text-sm leading-6 text-[#62756d]">
                {county.description}
              </p>

              <div className="mt-7 grid grid-cols-2 border-y border-[#dce5df]">
                <div className="border-r border-[#dce5df] py-4 pr-4">
                  <span className="block font-serif text-3xl leading-none text-[#10251f]">
                    {formatNumber(county.stats.totalProjects)}
                  </span>
                  <span className="mt-2 block text-[11px] font-black uppercase tracking-wide text-[#62756d]">
                    Developments
                  </span>
                </div>
                <div className="py-4 pl-4">
                  <span className="block font-serif text-3xl leading-none text-[#10251f]">
                    {formatNumber(county.stats.totalHomes)}
                  </span>
                  <span className="mt-2 block text-[11px] font-black uppercase tracking-wide text-[#62756d]">
                    Homes proposed
                  </span>
                </div>
                <div className="border-r border-t border-[#dce5df] py-4 pr-4">
                  <span className="block font-serif text-3xl leading-none text-[#10251f]">
                    {formatNumber(county.stats.activeProjects)}
                  </span>
                  <span className="mt-2 block text-[11px] font-black uppercase tracking-wide text-[#62756d]">
                    Active
                  </span>
                </div>
                <div className="border-t border-[#dce5df] py-4 pl-4">
                  <span className="block font-serif text-3xl leading-none text-[#10251f]">
                    {formatNumber(county.stats.homesRemaining)}
                  </span>
                  <span className="mt-2 block text-[11px] font-black uppercase tracking-wide text-[#62756d]">
                    Homes remaining
                  </span>
                </div>
              </div>

              <div className="mt-auto pt-6">
                <p className="text-xs font-black uppercase tracking-[0.13em] text-[#8a9992]">
                  Largest tracked project
                </p>
                <p className="mt-2 font-semibold text-[#18372f]">
                  {county.largestProject?.name || 'No tracked projects yet'}
                </p>
                <p className="mt-5 text-sm font-bold text-[#245044] group-hover:text-[#2f8a55]">
                  View county
                </p>
              </div>
            </Link>
          ))}
        </section>
      </section>
      <Footer />
    </main>
  )
}
