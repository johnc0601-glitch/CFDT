import {NextResponse} from 'next/server'
import {enrichProjectWithCountyGis, extractParcelIds} from '@/lib/gis'

export const runtime = 'nodejs'

function cleanSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const packageData = body?.package
    const incomingProject = packageData?.project

    if (!incomingProject?.name) {
      return NextResponse.json(
        {error: 'A reviewed project package is required.'},
        {status: 400},
      )
    }
    const project = await enrichProjectWithCountyGis(incomingProject)

    const projectId = process.env.SANITY_PROJECT_ID
    const dataset = process.env.SANITY_DATASET
    const token = process.env.SANITY_API_TOKEN

    if (!projectId || !dataset || !token) {
      return NextResponse.json(
        {error: 'Sanity publishing variables are incomplete.'},
        {status: 500},
      )
    }

    const slug = cleanSlug(String(project.slug || project.name))
    const sanityId = `project.${slug}`

    const document = {
      _id: sanityId,
      _type: 'project',
      name: project.name,
      slug: {_type: 'slug', current: slug},
      countyName: project.county,
      caseNumber: project.caseNumber,
      parcelId: project.parcelId,
      parcelIds: extractParcelIds(project),
      parcelAcres: project.parcelAcres,
      latitude: project.latitude,
      longitude: project.longitude,
      municipalityName: project.municipalityName,
      approvingAuthority: project.approvingAuthority,
      currentZoning: project.currentZoning,
      floodZones: project.floodZones,
      possibleWetlands: project.possibleWetlands,
      waterProvider: project.waterProvider,
      sewerProvider: project.sewerProvider,
      gisContext: project.gisContext,
      status: project.status,
      homesProposed: project.homesProposed,
      siteAcres: project.siteAcres,
      buildableAcres: project.buildableAcres,
      developer: project.developer,
      engineer: project.engineer,
      zoning: project.zoning,
      summary: project.summary,
      latestUpdateDate: project.latestUpdateDate || null,
      latestUpdate: project.latestUpdate,
      nextStep: project.nextStep,
      timeline: (packageData.timeline || []).map(
        (item: Record<string, unknown>, index: number) => ({
          _key: `timeline-${index}`,
          ...item,
          date: item.date || null,
        }),
      ),
      trafficMetrics: packageData.traffic || {},
      sourceDocuments: packageData.documents || [],
    }

    const endpoint =
      `https://${projectId}.api.sanity.io/v2025-02-19/data/mutate/` +
      `${encodeURIComponent(dataset)}?returnIds=true`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mutations: [{createOrReplace: document}],
      }),
    })

    if (!response.ok) {
      throw new Error(`Sanity publish failed: ${await response.text()}`)
    }

    return NextResponse.json({
      ok: true,
      result: await response.json(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Publish failed.',
      },
      {status: 500},
    )
  }
}
