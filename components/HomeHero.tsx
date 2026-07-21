import Link from 'next/link'
import type {Project} from '@/types/project'

type Stat = {
  label: string
  value: string | number
}

type CountySnapshot = {
  name: string
  href?: string
  enabled?: boolean
  count: number
}

function formatValue(value?: number | string) {
  if (typeof value === 'number') return value.toLocaleString()
  if (value) return value
  return 'Pending'
}

function projectHref(project?: Project) {
  return project?.slug?.current ? `/projects/${project.slug.current}` : '/search'
}

export function HomeHero({
  featured,
  stats,
  counties,
}: {
  featured?: Project
  stats: Stat[]
  counties: CountySnapshot[]
}) {
  const homesProposed =
    featured?.homesProposed ??
    featured?.singleFamilyDetachedUnits ??
    featured?.singleFamilyAttachedUnits ??
    featured?.multifamilyUnits

  return (
    <section className="space-y-8">
      <div className="grid gap-8 pt-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(310px,0.75fr)] lg:gap-12 lg:pt-12">
        <div>
          <p className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.14em] text-[#2f8a55] before:h-0.5 before:w-6 before:bg-[#2f8a55]">
            A clearer view of growth
          </p>
          <h1 className="mt-5 max-w-4xl font-serif text-5xl font-normal leading-[0.98] text-[#10251f] md:text-7xl">
            Understand what&apos;s being built.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#62756d]">
            Clear summaries of proposed and active development across the Cape
            Fear region, with official documents, timelines, maps, and meeting
            details in one place.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/search"
              className="inline-flex min-h-11 items-center bg-[#18372f] px-5 text-xs font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-[#2f8a55]"
            >
              Explore projects
            </Link>
            <Link
              href="/counties"
              className="inline-flex min-h-11 items-center text-xs font-black uppercase tracking-wide text-[#245044] transition hover:text-[#2f8a55]"
            >
              Browse by county
            </Link>
          </div>
        </div>

        <aside className="self-end border-l-4 border-[#e9b84b] bg-[#f5f7f3] px-6 py-6">
          <p className="text-xs font-black uppercase tracking-[0.13em] text-[#8a9992]">
            This week&apos;s focus
          </p>
          <p className="mt-4 max-w-sm font-serif text-2xl leading-tight text-[#18372f]">
            One place to follow a project&apos;s story from proposal to decision.
          </p>
        </aside>
      </div>

      <div className="grid border-y border-[#bdccc3] sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="min-h-28 border-[#dce5df] py-5 pr-4 sm:even:border-l lg:border-l lg:pl-6 lg:first:border-l-0 lg:first:pl-0"
          >
            <span className="block font-serif text-4xl leading-none text-[#10251f]">
              {formatValue(stat.value)}
            </span>
            <span className="mt-2 block text-xs font-black uppercase tracking-wider text-[#62756d]">
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      <div className="grid gap-8 pt-2 lg:grid-cols-[minmax(0,1.18fr)_minmax(360px,0.82fr)] lg:gap-12">
        <div>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.14em] text-[#2f8a55] before:h-0.5 before:w-6 before:bg-[#2f8a55]">
                Featured project
              </p>
              <h2 className="mt-2 font-serif text-4xl font-normal leading-none text-[#10251f]">
                {featured?.name || 'Project snapshot'}
              </h2>
            </div>
            <Link
              href={projectHref(featured)}
              className="text-xs font-black uppercase tracking-wide text-[#245044] transition hover:text-[#2f8a55]"
            >
              Open snapshot
            </Link>
          </div>

          <article className="border border-[#bdccc3] bg-white">
            <div className="flex flex-col gap-3 border-b border-[#dce5df] bg-[#f7f9f6] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs font-black uppercase tracking-[0.13em] text-[#8a9992]">
                {featured?.projectType || 'Residential development'}
              </span>
              <span className="inline-flex w-fit items-center gap-2 bg-[#fbf0cf] px-3 py-2 text-xs font-black uppercase tracking-wide text-[#795b0b] before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#e9b84b]">
                {featured?.status || 'Status pending'}
              </span>
            </div>

            <div className="grid md:grid-cols-[minmax(0,1fr)_220px]">
              <div className="flex min-h-64 flex-col justify-between px-6 py-7">
                <div>
                  <h3 className="font-serif text-4xl font-normal leading-none text-[#10251f]">
                    {featured?.name || 'Featured development'}
                  </h3>
                  <p className="mt-2 text-sm text-[#62756d]">
                    {[featured?.countyName, featured?.municipalityName]
                      .filter(Boolean)
                      .join(' / ') || 'Cape Fear region'}
                  </p>
                </div>

                <div className="mt-8 flex max-w-lg gap-3 border-t border-[#dce5df] pt-5">
                  <span className="mt-1.5 h-2.5 w-2.5 flex-none rounded-full border-2 border-[#2f8a55]" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-[#8a9992]">
                      Recent update
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#18372f]">
                      {featured?.latestUpdate ||
                        featured?.nextStep ||
                        'Project page ready for review'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative flex min-h-52 flex-col justify-between overflow-hidden bg-[#18372f] p-5 text-[#dce9dd]">
                <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full border border-white/20" />
                <div className="absolute bottom-14 right-3 h-px w-48 rotate-[-32deg] bg-white/30 shadow-[0_-28px_0_rgba(255,255,255,0.16),0_-56px_0_rgba(255,255,255,0.12)]" />
                <span className="relative text-xs font-black uppercase tracking-[0.14em] text-[#a9c5ad]">
                  Snapshot
                </span>
                <div className="relative self-end text-right">
                  <div className="font-serif text-7xl leading-[0.82] text-white">
                    {formatValue(homesProposed)}
                  </div>
                  <div className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-[#b8d1bb]">
                    Homes proposed
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>

        <aside>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.14em] text-[#2f8a55] before:h-0.5 before:w-6 before:bg-[#2f8a55]">
                Across the region
              </p>
              <h2 className="mt-2 font-serif text-4xl font-normal leading-none text-[#10251f]">
                By county
              </h2>
            </div>
            <Link
              href="/counties"
              className="text-xs font-black uppercase tracking-wide text-[#245044] transition hover:text-[#2f8a55]"
            >
              View all
            </Link>
          </div>

          <div className="grid grid-cols-2 border-y border-[#bdccc3]">
            {counties.map((county, index) => {
              const content = (
                <div
                  className={`min-h-40 border-[#dce5df] p-4 ${
                    index % 2 ? 'border-l' : ''
                  } ${index > 1 ? 'border-t' : ''}`}
                >
                  <span className="block font-serif text-4xl leading-none text-[#2f8a55]">
                    {county.count.toString().padStart(2, '0')}
                  </span>
                  <span className="mt-10 block min-h-9 text-sm font-black leading-tight text-[#18372f]">
                    {county.name}
                  </span>
                  <span className="mt-2 block text-xs font-bold uppercase tracking-wide text-[#8a9992]">
                    Projects
                  </span>
                </div>
              )

              if (!county.enabled || !county.href) {
                return <div key={county.name}>{content}</div>
              }

              return (
                <Link
                  key={county.name}
                  href={county.href}
                  className="block transition hover:bg-[#f5f7f3]"
                >
                  {content}
                </Link>
              )
            })}
          </div>
        </aside>
      </div>
    </section>
  )
}
