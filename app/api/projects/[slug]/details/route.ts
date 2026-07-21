import {NextResponse} from 'next/server'
import {revalidatePath} from 'next/cache'
import {enrichProjectWithCountyGis, extractParcelIds} from '@/lib/gis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{slug: string}>
}

function getConfig() {
  const projectId =
    process.env.SANITY_PROJECT_ID ||
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset =
    process.env.SANITY_DATASET ||
    process.env.NEXT_PUBLIC_SANITY_DATASET ||
    'production'
  const token = process.env.SANITY_API_TOKEN

  if (!projectId || !token) {
    throw new Error('Sanity project ID or API token is missing.')
  }

  return {projectId, dataset, token}
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function optionalNumber(value: unknown) {
  const number = typeof value === 'number'
    ? value
    : Number(text(value))
  return Number.isFinite(number) && number > 0 ? number : undefined
}

function optionalCoordinate(value: unknown) {
  const number = typeof value === 'number'
    ? value
    : Number(text(value))
  return Number.isFinite(number) ? number : undefined
}

function cleanResources(value: unknown) {
  if (!Array.isArray(value)) return []

  return value.flatMap((item, index) => {
    if (!item || typeof item !== 'object') return []
    const record = item as Record<string, unknown>
    const label = text(record.label || record.title || record.name)
    const url = text(record.url || record.officialUrl || record.sourceUrl)
    if (!label || !url) return []

    return [{
      _key: `resource-${index}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)}`,
      label,
      url,
    }]
  })
}

async function sanityRequest(path: string, init?: RequestInit) {
  const {projectId, dataset, token} = getConfig()
  const response = await fetch(
    `https://${projectId}.api.sanity.io${path.replace(
      '{dataset}',
      encodeURIComponent(dataset),
    )}`,
    {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
      cache: 'no-store',
    },
  )

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return response.json()
}

export async function GET(
  _request: Request,
  {params}: Props,
) {
  try {
    const {slug} = await params
    const query = `*[_type == "project" && slug.current == $slug][0]{
      _id,
      name,
      caseNumber,
      status,
      projectType,
      homesProposed,
      singleFamilyDetachedUnits,
      singleFamilyAttachedUnits,
      multifamilyUnits,
      siteAcres,
      totalSiteAcres,
      developer,
      engineer,
      zoning,
      locationDescription,
      parcelId,
      parcelIds,
      parcelAcres,
      latitude,
      longitude,
      municipalityName,
      approvingAuthority,
      currentZoning,
      floodZones,
      possibleWetlands,
      waterProvider,
      sewerProvider,
      gisContext,
      "countyName": coalesce(county->name, countyName),
      summary,
      latestUpdateDate,
      latestUpdate,
      nextStep,
      officialResources,
      "slug": slug.current
    }`
    const search = new URLSearchParams({
      query,
      '$slug': JSON.stringify(slug),
    })
    const result = await sanityRequest(
      `/v2026-07-08/data/query/{dataset}?${search.toString()}`,
    )

    if (!result?.result?._id) {
      return NextResponse.json({error: 'Project not found.'}, {status: 404})
    }

    return NextResponse.json({project: result.result})
  } catch (error) {
    return NextResponse.json(
      {error: error instanceof Error ? error.message : 'Could not load project.'},
      {status: 500},
    )
  }
}

export async function PATCH(
  request: Request,
  {params}: Props,
) {
  try {
    const {slug} = await params
    const body = await request.json()
    const projectId = text(body._id)

    if (!projectId) {
      return NextResponse.json({error: 'Project ID is required.'}, {status: 400})
    }

    const enriched = await enrichProjectWithCountyGis(body)
    const fields = Object.fromEntries(
      Object.entries({
        name: text(enriched.name) || undefined,
        caseNumber: text(enriched.caseNumber) || undefined,
        status: text(enriched.status) || undefined,
        projectType: text(enriched.projectType) || undefined,
        homesProposed: optionalNumber(enriched.homesProposed),
        singleFamilyDetachedUnits: optionalNumber(enriched.singleFamilyDetachedUnits),
        singleFamilyAttachedUnits: optionalNumber(enriched.singleFamilyAttachedUnits),
        multifamilyUnits: optionalNumber(enriched.multifamilyUnits),
        siteAcres: optionalNumber(enriched.siteAcres),
        totalSiteAcres: optionalNumber(enriched.siteAcres),
        developer: text(enriched.developer) || undefined,
        engineer: text(enriched.engineer) || undefined,
        zoning: text(enriched.zoning) || undefined,
        locationDescription: text(enriched.locationDescription) || undefined,
        parcelId: text(enriched.parcelId) || undefined,
        parcelIds: extractParcelIds(enriched),
        parcelAcres: optionalNumber(enriched.parcelAcres),
        latitude: optionalCoordinate(enriched.latitude),
        longitude: optionalCoordinate(enriched.longitude),
        municipalityName: text(enriched.municipalityName) || undefined,
        approvingAuthority: text(enriched.approvingAuthority) || undefined,
        currentZoning: Array.isArray(enriched.currentZoning) ? enriched.currentZoning : undefined,
        floodZones: Array.isArray(enriched.floodZones) ? enriched.floodZones : undefined,
        possibleWetlands: typeof enriched.possibleWetlands === 'boolean' ? enriched.possibleWetlands : undefined,
        waterProvider: text(enriched.waterProvider) || undefined,
        sewerProvider: text(enriched.sewerProvider) || undefined,
        gisContext: enriched.gisContext || undefined,
        summary: text(enriched.summary) || undefined,
        latestUpdateDate: text(enriched.latestUpdateDate) || undefined,
        latestUpdate: text(enriched.latestUpdate) || undefined,
        nextStep: text(enriched.nextStep) || undefined,
        officialResources: cleanResources(enriched.officialResources),
      }).filter(([, value]) => value !== undefined),
    )

    const result = await sanityRequest(
      '/v2026-07-08/data/mutate/{dataset}?returnDocuments=true&visibility=sync',
      {
        method: 'POST',
        body: JSON.stringify({
          mutations: [{patch: {id: projectId, set: fields}}],
        }),
      },
    )

    revalidatePath(`/projects/${slug}`)
    revalidatePath('/projects/[slug]', 'page')

    return NextResponse.json({ok: true, result})
  } catch (error) {
    return NextResponse.json(
      {error: error instanceof Error ? error.message : 'Could not save project.'},
      {status: 500},
    )
  }
}
