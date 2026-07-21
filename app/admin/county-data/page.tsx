import Link from 'next/link'
import {Header} from '@/components/Header'
import {Footer} from '@/components/Footer'
import {WorkspaceShell} from '@/components/workspace/WorkspaceTools'
import {countyDirectory} from '@/lib/countyDirectory'
import {getProjectStats} from '@/lib/stats'
import {sanity} from '@/lib/sanity'
import type {Project} from '@/types/project'

export const dynamic = 'force-dynamic'

type HealthProject = Project & {
  documentCount?: number
  graphicCount?: number
}

const healthProjectFields = `
  _id,
  name,
  status,
  homesProposed,
  homesRemaining,
  homesBuilt,
  homesApproved,
  siteAcres,
  totalPropertyAcres,
  developer,
  summary,
  latestUpdate,
  latestUpdateDate,
  nextStep,
  timeline,
  officialResources,
  slug,
  "countyName": coalesce(county->name, countyName),
  "municipalityName": municipality->name,
  "documentCount": count(*[
    _type == "projectDocument" &&
    project._ref == ^._id &&
    publicDisplay == true
  ]),
  "graphicCount": count(*[
    _type == "projectGraphic" &&
    (
      project._ref == ^._id ||
      project->slug.current == ^.slug.current
    ) &&
    lower(coalesce(displayStatus, "library")) in ["featured", "library"]
  ])
`

function normalizeCountyName(name?: string) {
  return name?.toLowerCase().replace(/\s+county$/, '').trim() || ''
}

function formatNumber(value?: number) {
  return typeof value === 'number' ? value.toLocaleString() : '0'
}

function projectHref(project: HealthProject) {
  return project.slug?.current ? `/projects/${project.slug.current}` : '#'
}

function adminEditHref(project: HealthProject) {
  return project.slug?.current
    ? `/admin/projects/${project.slug.current}/edit`
    : '/admin/importer'
}

function getProjectIssues(project: HealthProject) {
  const issues = [
    !project.countyName && 'County',
    !project.slug?.current && 'Slug',
    !project.status && 'Status',
    typeof project.homesProposed !== 'number' && 'Homes',
    !project.summary && 'Summary',
    !project.latestUpdate && !project.nextStep && 'Update',
    !project.timeline?.length && 'Timeline',
    !project.documentCount && 'Documents',
    !project.graphicCount && 'Graphics',
  ]

  return issues.filter(Boolean) as string[]
}

function projectsForCounty(projects: HealthProject[], countyName: string) {
  const normalizedName = normalizeCountyName(countyName)
  return projects.filter(
    (project) => normalizeCountyName(project.countyName) === normalizedName,
  )
}

export default async function Page() {
  const projects = await sanity.fetch<HealthProject[]>(
    `*[_type == "project"] | order(name asc) { ${healthProjectFields} }`,
    {},
    {cache: 'no-store'},
  )

  const countySummaries = countyDirectory.map((county) => {
    const countyProjects = projectsForCounty(projects, county.name)
    const stats = getProjectStats(countyProjects)
    const issueCount = countyProjects.reduce(
      (sum, project) => sum + getProjectIssues(project).length,
      0,
    )

    return {
      ...county,
      projects: countyProjects,
      stats,
      issueCount,
    }
  })

  const unassignedProjects = projects.filter((project) => !project.countyName)
  const projectsWithIssues = projects
    .map((project) => ({project, issues: getProjectIssues(project)}))
    .filter((item) => item.issues.length > 0)
  const totalIssues = projectsWithIssues.reduce(
    (sum, item) => sum + item.issues.length,
    0,
  )

  return (
    <main className="min-h-screen bg-[#f3f5f2] text-[#142033]">
      <Header />
      <WorkspaceShell
        eyebrow="Workspace Module"
        title="County Data Health"
        description="A quick management check for county totals and missing project fields before they become public-page surprises."
      >
        <section className="grid gap-5 md:grid-cols-4">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f8b63]">
              Projects
            </p>
            <h2 className="mt-3 text-3xl font-semibold">{projects.length}</h2>
            <p className="mt-2 text-sm text-slate-600">Total records checked</p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f8b63]">
              Counties
            </p>
            <h2 className="mt-3 text-3xl font-semibold">{countySummaries.length}</h2>
            <p className="mt-2 text-sm text-slate-600">Tracked public areas</p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f8b63]">
              Missing Items
            </p>
            <h2 className="mt-3 text-3xl font-semibold">{totalIssues}</h2>
            <p className="mt-2 text-sm text-slate-600">Across all checks</p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f8b63]">
              Unassigned
            </p>
            <h2 className="mt-3 text-3xl font-semibold">
              {unassignedProjects.length}
            </h2>
            <p className="mt-2 text-sm text-slate-600">Projects missing county</p>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          {countySummaries.map((county) => (
            <article
              key={county.slug}
              className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f8b63]">
                    County
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">{county.name}</h2>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    county.issueCount
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {county.issueCount ? `${county.issueCount} issues` : 'Clean'}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-slate-50 p-4">
                  <strong className="block text-xl text-[#142033]">
                    {formatNumber(county.stats.totalProjects)}
                  </strong>
                  <span className="text-slate-600">Developments</span>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <strong className="block text-xl text-[#142033]">
                    {formatNumber(county.stats.totalHomes)}
                  </strong>
                  <span className="text-slate-600">Homes proposed</span>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <strong className="block text-xl text-[#142033]">
                    {formatNumber(county.stats.activeProjects)}
                  </strong>
                  <span className="text-slate-600">Active</span>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <strong className="block text-xl text-[#142033]">
                    {formatNumber(county.stats.homesRemaining)}
                  </strong>
                  <span className="text-slate-600">Homes remaining</span>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold">
                <Link href={`/counties/${county.slug}`} className="text-[#244f73]">
                  Public page
                </Link>
                <Link href="/admin/importer" className="text-[#244f73]">
                  Importer
                </Link>
              </div>
            </article>
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f8b63]">
              Review Queue
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Projects needing attention</h2>
            <p className="mt-2 text-sm text-slate-600">
              Start with rows that have missing county, homes, slug, documents,
              or graphics.
            </p>
          </div>

          {projectsWithIssues.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Project</th>
                    <th className="px-5 py-4">County</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Homes</th>
                    <th className="px-5 py-4">Docs</th>
                    <th className="px-5 py-4">Graphics</th>
                    <th className="px-5 py-4">Missing</th>
                    <th className="px-5 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projectsWithIssues.map(({project, issues}) => (
                    <tr key={project._id} className="align-top">
                      <td className="px-5 py-4">
                        <strong className="block text-[#142033]">{project.name}</strong>
                        {project.developer && (
                          <span className="mt-1 block text-xs text-slate-500">
                            {project.developer}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {project.countyName || 'Missing'}
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {project.status || 'Missing'}
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {formatNumber(project.homesProposed)}
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {formatNumber(project.documentCount)}
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {formatNumber(project.graphicCount)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {issues.map((issue) => (
                            <span
                              key={issue}
                              className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800"
                            >
                              {issue}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-2 font-bold text-[#244f73]">
                          <Link href={adminEditHref(project)}>Edit</Link>
                          <Link href={projectHref(project)}>Public</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-6 text-slate-600">
              No missing county data or content checks found.
            </p>
          )}
        </section>
      </WorkspaceShell>
      <Footer />
    </main>
  )
}
