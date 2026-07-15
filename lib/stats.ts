import type {Project} from '@/types/project'
import type {ProjectDocument} from '@/types/projectDocument'
import type {ProjectMedia} from '@/types/projectMedia'

export function getProjectStats(projects: Project[]) {
  return {
    totalProjects: projects.length,
    totalHomes: projects.reduce((sum, project) => sum + (project.homesProposed || 0), 0),
    homesRemaining: projects.reduce(
      (sum, project) =>
        sum +
        (project.homesRemaining ??
          Math.max((project.homesApproved ?? project.homesProposed ?? 0) - (project.homesBuilt ?? 0), 0)),
      0
    ),
    activeProjects: projects.filter((project) =>
      !['Completed', 'Paused / Appealed'].includes(project.status || '')
    ).length,
    counties: new Set(projects.map((project) => project.countyName).filter(Boolean)).size,
  }
}

export function getContentHealth(project: Project, media: ProjectMedia[], documents: ProjectDocument[]) {
  const checks = [
    {label: 'Summary', complete: Boolean(project.summary)},
    {label: 'Hero Photo', complete: Boolean(project.heroImageUrl)},
    {label: 'Homes Proposed', complete: typeof project.homesProposed === 'number'},
    {label: 'Site Acres', complete: typeof (project.siteAcres ?? project.totalSiteAcres) === 'number'},
    {label: 'Timeline', complete: Boolean(project.timeline?.length)},
    {label: 'Project Library', complete: media.length > 0},
    {label: 'Documents', complete: documents.length > 0},
    {label: 'Official Resources', complete: Boolean(project.officialResources?.length)},
    {label: 'Latest Update', complete: Boolean(project.latestUpdate)},
  ]

  const completeCount = checks.filter((check) => check.complete).length
  return {
    checks,
    score: Math.round((completeCount / checks.length) * 100),
    missing: checks.filter((check) => !check.complete),
  }
}
