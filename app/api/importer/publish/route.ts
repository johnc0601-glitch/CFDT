import {createHash} from 'node:crypto'
import {NextResponse} from 'next/server'
import {enrichProjectWithCountyGis, extractParcelIds} from '@/lib/gis'

export const runtime = 'nodejs'

type ImportPackage = {
  project?: Record<string, unknown>
  timeline?: Record<string, unknown>[]
  traffic?: Record<string, unknown>
  documents?: Record<string, unknown>[]
  sourceReferences?: Record<string, unknown>[]
  reviewFlags?: unknown[]
  communityConcerns?: unknown[]
  graphicsSuggestions?: unknown[]
}

type SanityContext = {
  projectId: string
  dataset: string
  token: string
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function positiveNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : undefined
}

function coordinateNumber(value: unknown) {
  const number = typeof value === 'number' ? value : Number(text(value))
  return Number.isFinite(number) ? number : undefined
}

function removeUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  )
}

function getSanityContext(): SanityContext {
  const projectId = process.env.SANITY_PROJECT_ID
  const dataset = process.env.SANITY_DATASET
  const token = process.env.SANITY_API_TOKEN

  if (!projectId || !dataset || !token) {
    throw new Error('Sanity publishing variables are incomplete.')
  }

  return {projectId, dataset, token}
}

async function querySanity<T>(
  context: SanityContext,
  query: string,
  params: Record<string, unknown>,
) {
  const search = new URLSearchParams({query})

  for (const [key, value] of Object.entries(params)) {
    search.set(`$${key}`, JSON.stringify(value))
  }

  const response = await fetch(
    `https://${context.projectId}.api.sanity.io/v2025-02-19/data/query/${encodeURIComponent(context.dataset)}?${search.toString()}`,
    {
      headers: {Authorization: `Bearer ${context.token}`},
      cache: 'no-store',
    },
  )

  if (!response.ok) {
    throw new Error(`Sanity lookup failed: ${await response.text()}`)
  }

  const result = await response.json()
  return result.result as T
}

function buildTimeline(pkg: ImportPackage) {
  if (!Array.isArray(pkg.timeline) || pkg.timeline.length === 0) {
    return undefined
  }

  return pkg.timeline.map((item, index) =>
    removeUndefined({
      _key: `stage-${index}`,
      title: text(item.title) || `Stage ${index + 1}`,
      date: text(item.date) || undefined,
      stageStatus: text(item.stageStatus || item.status) || 'Future',
      description: text(item.description) || undefined,
    }),
  )
}

function buildOfficialResources(pkg: ImportPackage) {
  const candidates = Array.isArray(pkg.sourceReferences)
    ? pkg.sourceReferences
    : []
  const seen = new Set<string>()

  const resources = candidates.flatMap((item, index) => {
    const url = text(item.officialUrl || item.url || item.sourceUrl)
    if (!url || seen.has(url)) return []
    seen.add(url)

    return [{
      _key: `resource-${index}-${createHash('sha1').update(url).digest('hex').slice(0, 8)}`,
      label: text(item.title || item.label || item.name) || 'Official document',
      url,
    }]
  })

  return resources.length > 0 ? resources : undefined
}

function buildProjectDocuments(
  pkg: ImportPackage,
  projectId: string,
  slug: string,
) {
  if (!Array.isArray(pkg.documents)) return []

  return pkg.documents.flatMap((item) => {
    const title = text(item.title || item.label || item.name)
    if (!title) return []

    const officialUrl = text(item.officialUrl || item.url || item.sourceUrl)
    if (!officialUrl) return []

    const documentDate = text(item.documentDate || item.date)
    const identity = officialUrl || `${title}|${documentDate}`
    const suffix = createHash('sha1').update(identity).digest('hex').slice(0, 16)

    return [removeUndefined({
      _id: `projectDocument.${slug}.${suffix}`,
      _type: 'projectDocument',
      title,
      project: {_type: 'reference', _ref: projectId},
      documentType: text(item.documentType || item.type) || 'Other',
      documentDate: documentDate || undefined,
      officialUrl: officialUrl || undefined,
      summary: text(item.summary || item.description) || undefined,
      publicDisplay: item.publicDisplay !== false,
    })]
  })
}

async function publishToSanity(pkg: ImportPackage) {
  const context = getSanityContext()
  const project = await enrichProjectWithCountyGis(pkg.project || {})
  const name = text(project.name)
  const slug = slugify(text(project.slug) || name)
  const countyName = text(project.county || project.countyName)

  if (!name || !slug) throw new Error('Project name is required.')
  if (!countyName) throw new Error('County is required.')

  const lookup = await querySanity<{
    projectId?: string
    countyId?: string
  }>(
    context,
    `{
      "projectId": *[_type == "project" && slug.current == $slug][0]._id,
      "countyId": *[_type == "county" && lower(name) == $countyName][0]._id
    }`,
    {slug, countyName: countyName.toLowerCase()},
  )

  const existing = Boolean(lookup.projectId)
  const sanityProjectId = lookup.projectId || `project.${slug}`
  const countyId = lookup.countyId || `county.${slugify(countyName)}`
  const timeline = buildTimeline(pkg)
  const officialResources = buildOfficialResources(pkg)
  const projectDocuments = buildProjectDocuments(pkg, sanityProjectId, slug)

  const fields = removeUndefined({
    name,
    slug: {_type: 'slug', current: slug},
    county: {_type: 'reference', _ref: countyId},
    countyName,
    caseNumber: text(project.caseNumber) || undefined,
    status: text(project.status) || undefined,
    projectType: text(project.projectType) || undefined,
    approvingAuthority: text(project.approvingAuthority) || undefined,
    locationDescription: text(project.locationDescription) || undefined,
    parcelId: text(project.parcelId) ||
      (Array.isArray(project.parcels) ? project.parcels.map(text).filter(Boolean).join(', ') : undefined),
    parcelIds: extractParcelIds(project),
    parcelAcres: positiveNumber(project.parcelAcres),
    latitude: coordinateNumber(project.latitude),
    longitude: coordinateNumber(project.longitude),
    municipalityName: text(project.municipalityName) || undefined,
    currentZoning: Array.isArray(project.currentZoning) ? project.currentZoning : undefined,
    floodZones: Array.isArray(project.floodZones) ? project.floodZones : undefined,
    possibleWetlands: typeof project.possibleWetlands === 'boolean' ? project.possibleWetlands : undefined,
    waterProvider: text(project.waterProvider) || undefined,
    sewerProvider: text(project.sewerProvider) || undefined,
    gisContext: project.gisContext || undefined,
    homesProposed: positiveNumber(project.homesProposed),
    singleFamilyDetachedUnits: positiveNumber(
      project.singleFamilyDetachedUnits || project.singleFamilyUnits,
    ),
    singleFamilyAttachedUnits: positiveNumber(
      project.singleFamilyAttachedUnits ||
        project.townhomeUnits ||
        project.townhouseUnits,
    ),
    multifamilyUnits: positiveNumber(
      project.multifamilyUnits || project.multiFamilyUnits,
    ),
    totalSiteAcres: positiveNumber(project.siteAcres || project.totalSiteAcres),
    siteAcres: positiveNumber(project.siteAcres || project.totalSiteAcres),
    buildableUplandAcres: positiveNumber(
      project.buildableAcres || project.buildableUplandAcres,
    ),
    buildableAcres: positiveNumber(
      project.buildableAcres || project.buildableUplandAcres,
    ),
    commercialSquareFeet: positiveNumber(project.commercialSquareFeet),
    developer: text(project.developer) || undefined,
    engineer: text(project.engineer) || undefined,
    zoning: text(project.zoning) || undefined,
    summary: text(project.summary) || undefined,
    latestUpdateDate: text(project.latestUpdateDate) || undefined,
    latestUpdate: text(project.latestUpdate) || undefined,
    nextStep: text(project.nextStep) || undefined,
    timeline,
    officialResources,
    trafficMetrics: pkg.traffic,
    reviewFlags: pkg.reviewFlags,
    communityConcerns: pkg.communityConcerns,
    graphicsSuggestions: pkg.graphicsSuggestions,
  })

  const mutations: Record<string, unknown>[] = []

  if (!lookup.countyId) {
    mutations.push({
      createIfNotExists: {
        _id: countyId,
        _type: 'county',
        name: countyName,
        slug: {_type: 'slug', current: slugify(countyName)},
      },
    })
  }

  mutations.push({
    createIfNotExists: {
      _id: sanityProjectId,
      _type: 'project',
      name,
      slug: {_type: 'slug', current: slug},
    },
  })
  mutations.push({patch: {id: sanityProjectId, set: fields}})

  if (projectDocuments.length > 0) {
    const documentTitles = projectDocuments
      .map((document) => text(document.title))
      .filter(Boolean)
    const documentIds = projectDocuments.map((document) => document._id)
    const staleDocuments = await querySanity<{_id: string}[]>(
      context,
      `*[
        _type == "projectDocument" &&
        project._ref == $projectId &&
        title in $titles &&
        !(_id in $ids) &&
        !defined(officialUrl) &&
        !defined(fileUpload.asset._ref)
      ]{_id}`,
      {projectId: sanityProjectId, titles: documentTitles, ids: documentIds},
    )

    for (const staleDocument of staleDocuments || []) {
      mutations.push({delete: {id: staleDocument._id}})
    }
  }

  for (const document of projectDocuments) {
    const {_id, _type, ...documentFields} = document
    mutations.push({
      createIfNotExists: {_id, _type, title: documentFields.title},
    })
    mutations.push({patch: {id: _id, set: documentFields}})
  }

  const response = await fetch(
    `https://${context.projectId}.api.sanity.io/v2025-02-19/data/mutate/${encodeURIComponent(context.dataset)}?returnIds=true`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${context.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({mutations}),
    },
  )

  if (!response.ok) {
    throw new Error(`Sanity publish failed: ${await response.text()}`)
  }

  return {
    action: existing ? 'updated' : 'created',
    projectId: sanityProjectId,
    slug,
    result: await response.json(),
  }
}

async function updateImportJob(
  jobId: string | null,
  status: string,
  pkg: ImportPackage,
) {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key || !jobId) return

  const response = await fetch(
    `${url.replace(/\/$/, '')}/rest/v1/cfdt_import_jobs?id=eq.${encodeURIComponent(jobId)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
        reviewed_package: pkg,
        published_at: status === 'published' ? new Date().toISOString() : null,
      }),
    },
  )

  if (!response.ok) {
    throw new Error(`Import tracking update failed: ${await response.text()}`)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const pkg = body?.package as ImportPackage | undefined
    const jobId = text(body?.jobId) || null
    const destination = text(body?.destination) || 'supabase'

    if (!pkg?.project?.name) {
      return NextResponse.json(
        {error: 'A reviewed project package is required.'},
        {status: 400},
      )
    }

    if (destination === 'sanity') {
      const published = await publishToSanity(pkg)
      await updateImportJob(jobId, 'published', pkg)
      return NextResponse.json({ok: true, ...published})
    }

    await updateImportJob(jobId, 'approved', pkg)
    return NextResponse.json({ok: true})
  } catch (error) {
    return NextResponse.json(
      {error: error instanceof Error ? error.message : 'Publish failed.'},
      {status: 500},
    )
  }
}
