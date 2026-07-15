import {sanity} from './sanity'
import type {Project} from '@/types/project'
import type {ProjectDocument} from '@/types/projectDocument'
import type {ProjectMedia} from '@/types/projectMedia'
import type {ProjectUpdate} from '@/types/projectUpdate'
import type {Meeting} from '@/types/meeting'
import type {ProjectIntake} from '@/types/projectIntake'

const projectFields = `
  _id,
  homesRemaining,
  homesBuilt,
  homesApproved,
  buildableAcres,
  caseNumber,
  name,
  status,
  homesProposed,
  siteAcres,
  totalPropertyAcres,
  conservationFloodplainAcres,
  developer,
  engineer,
  parcelId,
  projectType,
  approvingAuthority,
  locationDescription,
  summary,
  latestUpdateDate,
  latestUpdate,
  nextStep,
  zoning,
  futureLandUse,
  waterProvider,
  sewerProvider,
  timeline,
  officialResources,
  sourcesUsed,
  latitude,
  longitude,
  slug,
  "countyName": county->name,
  "municipalityName": municipality->name,
  "heroImageUrl": heroImage.asset->url,
  "heroImageAlt": heroImage.alt,
  "heroImageCaption": heroImage.caption
`

const meetingFields = `
  _id,
  title,
  meetingDate,
  meetingType,
  location,
  agendaUrl,
  packetUrl,
  minutesUrl,
  videoUrl,
  result,
  summary,
  "projectName": project->name,
  "projectSlug": project->slug.current
`

export async function getAllProjects(): Promise<Project[]> {
  return sanity.fetch(`*[_type == "project"] | order(name asc) { ${projectFields} }`)
}

export async function getProjectsByCounty(countyName: string): Promise<Project[]> {
  return sanity.fetch(
    `*[_type == "project" && county->name == $countyName] | order(name asc) { ${projectFields} }`,
    {countyName}
  )
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  return sanity.fetch(
    `*[_type == "project" && slug.current == $slug][0] { ${projectFields} }`,
    {slug}
  )
}

export async function getMediaByProjectSlug(slug: string): Promise<ProjectMedia[]> {
  return sanity.fetch(
    `*[
      _type == "projectGraphic" &&
      (
        project._ref in *[
          _type == "project" &&
          slug.current == $slug
        ]._id ||
        project->slug.current == $slug
      ) &&
      lower(coalesce(displayStatus, "library")) in [
        "featured",
        "library"
      ]
    ] | order(
      select(
        lower(coalesce(displayStatus, "library")) == "featured" => 0,
        1
      ) asc,
      title asc
    ) {
      _id,
      title,
      category,
      "caption": coalesce(description, caption),
      "publicDescription": coalesce(description, publicDescription),
      sourceDocument,
      sourcePage,
      "displayOrder": select(
        lower(coalesce(displayStatus, "library")) == "featured" => 0,
        1
      ),
      "imageUrl": coalesce(image.asset->url, graphic.asset->url),
      "imageAlt": coalesce(image.alt, graphic.alt, title)
    }`,
    {slug},
    {
      cache: 'no-store',
      next: {revalidate: 0},
      perspective: 'published',
    }
  )
}

export async function getDocumentsByProjectSlug(slug: string): Promise<ProjectDocument[]> {
  return sanity.fetch(
    `*[_type == "projectDocument" && project->slug.current == $slug && publicDisplay == true] | order(displayOrder asc, documentDate desc) {
      _id,
      title,
      documentType,
      documentDate,
      officialUrl,
      summary,
      publicDisplay,
      displayOrder,
      "fileUrl": fileUpload.asset->url
    }`,
    {slug}
  )
}

export async function getRecentUpdates(limit = 6): Promise<ProjectUpdate[]> {
  return sanity.fetch(
    `*[_type == "projectUpdate"] | order(date desc)[0...$limit] {
      _id,
      title,
      date,
      summary,
      sourceUrl,
      sourceName,
      sourceType,
      isFeatured,
      "projectName": project->name,
      "projectSlug": project->slug.current
    }`,
    {limit}
  )
}

export async function getMeetingsByProjectSlug(slug: string): Promise<Meeting[]> {
  return sanity.fetch(
    `*[_type == "meeting" && project->slug.current == $slug && isPublic == true] | order(meetingDate desc) {
      ${meetingFields}
    }`,
    {slug}
  )
}

export async function getUpcomingMeetings(limit = 10): Promise<Meeting[]> {
  return sanity.fetch(
    `*[_type == "meeting" && isPublic == true && meetingDate >= now()] | order(meetingDate asc)[0...$limit] {
      ${meetingFields}
    }`,
    {limit}
  )
}

export async function getRecentMeetings(limit = 10): Promise<Meeting[]> {
  return sanity.fetch(
    `*[_type == "meeting" && isPublic == true] | order(meetingDate desc)[0...$limit] {
      ${meetingFields}
    }`,
    {limit}
  )
}

export async function getProjectIntakes(limit = 20): Promise<ProjectIntake[]> {
  return sanity.fetch(
    `*[_type == "projectIntake"] | order(_createdAt desc)[0...$limit] {
      _id,
      title,
      status,
      projectName,
      countyName,
      municipalityName,
      developer,
      engineer,
      parcelIds,
      homesProposed,
      siteAcres,
      zoning,
      futureLandUse,
      waterProvider,
      sewerProvider,
      trafficNotes,
      environmentalNotes,
      staffRecommendation,
      conditionsOfApproval,
      draftSummary,
      sourceUrl
    }`,
    {limit}
  )
}

export async function getDevelopers(): Promise<
  {developer: string; count: number; homes: number}[]
> {
  const projects = await getAllProjects()
  const grouped = new Map<
    string,
    {developer: string; count: number; homes: number}
  >()

  for (const project of projects) {
    if (!project.developer) continue

    const current = grouped.get(project.developer) || {
      developer: project.developer,
      count: 0,
      homes: 0,
    }

    current.count += 1
    current.homes += project.homesProposed || 0
    grouped.set(project.developer, current)
  }

  return Array.from(grouped.values()).sort((a, b) =>
    a.developer.localeCompare(b.developer)
  )
}


export async function getUpdatesByProjectSlug(slug: string): Promise<ProjectUpdate[]> {
  return sanity.fetch(
    `*[_type == "projectUpdate" && project->slug.current == $slug] | order(date desc) {
      _id,
      title,
      date,
      summary,
      sourceUrl,
      sourceName,
      sourceType,
      isFeatured,
      "projectName": project->name,
      "projectSlug": project->slug.current
    }`,
    {slug}
  )
}
