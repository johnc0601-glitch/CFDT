const GIS_ROOT = 'https://gis.nhcgov.com/server/rest/services'
const PARCEL_LAYER = `${GIS_ROOT}/Layers/Parcels/FeatureServer/0/query`
const LAND_CONTEXT = `${GIS_ROOT}/Thematic/LandDevChar/FeatureServer`

type ArcGisGeometry = {rings?: number[][][]}
type ArcGisFeature = {
  attributes?: Record<string, unknown>
  geometry?: ArcGisGeometry
  centroid?: {x?: number; y?: number}
}
type ArcGisResponse = {
  features?: ArcGisFeature[]
  count?: number
  error?: {message?: string; details?: string[]}
}

export type VerifiedParcel = {
  _key?: string
  sourceId: string
  matchedBy?: 'PID' | 'PIN' | 'MAPID' | 'MAPIDKEY'
  matchQuality?: 'exact' | 'normalized'
  pid?: string
  pin?: string
  mapId?: string
  mapIdKey?: string
  featureType?: string
  acres?: number
  objectId?: number
}

export type NewHanoverGisContext = {
  provider: 'New Hanover County GIS'
  status: 'verified' | 'partial' | 'unavailable'
  verifiedAt: string
  requestedParcelIds: string[]
  unmatchedParcelIds: string[]
  parcels: VerifiedParcel[]
  parcelAcres?: number
  latitude?: number
  longitude?: number
  municipalityName?: string
  approvingAuthority?: string
  currentZoning?: string[]
  floodZones?: string[]
  waterConsultation?: string[]
  sewerConsultation?: string[]
  sourceUrl: string
  message?: string
  warnings?: string[]
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function number(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function cleanParcelId(value: unknown) {
  const cleaned = text(value)
    .replace(/^(?:parcel\s*(?:id|ids|pin|pins)?|pid|pin)\s*[:#-]?\s*/i, '')
    .trim()
  if (!cleaned || cleaned.length > 40) return ''
  if (!/^[a-z0-9][a-z0-9.\-\s]*$/i.test(cleaned)) return ''
  return cleaned
}

function normalizedParcelId(value: unknown) {
  return cleanParcelId(value).toUpperCase().replace(/[^A-Z0-9]/g, '')
}

function parcelIdVariants(value: string) {
  const cleaned = cleanParcelId(value).toUpperCase()
  const normalized = normalizedParcelId(cleaned)
  const variants = [cleaned]

  // NHC PIDs are commonly printed as R00900-001-001-000. OCR often drops separators.
  if (/^[A-Z]\d{14}$/.test(normalized)) {
    variants.push(
      `${normalized.slice(0, 6)}-${normalized.slice(6, 9)}-${normalized.slice(9, 12)}-${normalized.slice(12)}`,
    )
  }
  return Array.from(new Set(variants))
}

function parcelValues(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(parcelValues)
  if (value && typeof value === 'object') {
    const item = value as Record<string, unknown>
    return parcelValues(item.pid || item.pin || item.parcelId || item.id)
  }
  if (typeof value !== 'string') return []
  return value.split(/[,;\n]+/).map(cleanParcelId).filter(Boolean)
}

export function extractParcelIds(project: Record<string, unknown>) {
  const candidates = [
    ...parcelValues(project.parcelIds),
    ...parcelValues(project.parcelId),
    ...parcelValues(project.parcels),
  ]
  return Array.from(
    new Map(candidates.map((value) => [normalizedParcelId(value), value])).values(),
  ).slice(0, 25)
}

function sqlString(value: string) {
  return value.replace(/'/g, "''")
}

async function arcGisQuery(
  url: string,
  parameters: Record<string, string>,
): Promise<ArcGisResponse> {
  let lastError: unknown
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: new URLSearchParams({f: 'json', ...parameters}),
        cache: 'no-store',
        signal: AbortSignal.timeout(12_000),
      })
      if (!response.ok) throw new Error(`County GIS returned ${response.status}.`)

      const result = await response.json() as ArcGisResponse
      if (result.error) {
        throw new Error(
          [result.error.message, ...(result.error.details || [])]
            .filter(Boolean).join(' ') || 'County GIS query failed.',
        )
      }
      return result
    } catch (error) {
      lastError = error
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 250))
    }
  }
  throw lastError
}

function comparable(value: unknown) {
  return text(value).toUpperCase()
}

const PARCEL_ID_FIELDS = ['PID', 'PIN', 'MAPID', 'MAPIDKEY'] as const

function findMatch(
  sourceId: string,
  features: ArcGisFeature[],
): {
  match?: {feature: ArcGisFeature; field: typeof PARCEL_ID_FIELDS[number]; quality: 'exact' | 'normalized'}
  ambiguous: boolean
} {
  const exactKey = comparable(sourceId)
  const normalizedKey = normalizedParcelId(sourceId)

  for (const quality of ['exact', 'normalized'] as const) {
    const matches = features.flatMap((feature) => PARCEL_ID_FIELDS.flatMap((field) => {
      const value = feature.attributes?.[field]
      const isMatch = quality === 'exact'
        ? comparable(value) === exactKey
        : normalizedParcelId(value) === normalizedKey
      return isMatch ? [{feature, field, quality}] : []
    }))
    const unique = Array.from(new Map(
      matches.map((match) => [String(match.feature.attributes?.OBJECTID), match]),
    ).values())
    if (unique.length === 1) return {match: unique[0], ambiguous: false}
    if (unique.length > 1) return {ambiguous: true}
  }
  return {ambiguous: false}
}

function uniqueStrings(features: ArcGisFeature[], field: string) {
  return Array.from(new Set(
    features.map((feature) => text(feature.attributes?.[field])).filter(Boolean),
  ))
}

function mapCenter(features: ArcGisFeature[]) {
  const points = features.flatMap((feature) => {
    const x = number(feature.centroid?.x)
    const y = number(feature.centroid?.y)
    if (x !== undefined && y !== undefined) return [[x, y]]
    return (feature.geometry?.rings || []).flat()
  })
  if (!points.length) return {}

  const xs = points.map(([x]) => x).filter(Number.isFinite)
  const ys = points.map(([, y]) => y).filter(Number.isFinite)
  if (!xs.length || !ys.length) return {}
  return {
    longitude: (Math.min(...xs) + Math.max(...xs)) / 2,
    latitude: (Math.min(...ys) + Math.max(...ys)) / 2,
  }
}

async function contextQuery(
  layer: number,
  geometry: ArcGisGeometry,
  outFields: string,
) {
  const result = await arcGisQuery(`${LAND_CONTEXT}/${layer}/query`, {
    where: '1=1',
    geometry: JSON.stringify({...geometry, spatialReference: {wkid: 4326}}),
    geometryType: 'esriGeometryPolygon',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields,
    returnGeometry: 'false',
  })
  return result.features || []
}

export async function resolveNewHanoverParcels(
  parcelIds: string[],
): Promise<NewHanoverGisContext> {
  const requestedParcelIds = Array.from(
    new Map(parcelIds.map(cleanParcelId).filter(Boolean)
      .map((value) => [normalizedParcelId(value), value])).values(),
  ).slice(0, 25)
  const verifiedAt = new Date().toISOString()
  const sourceUrl = PARCEL_LAYER.replace(/\/query$/, '')

  if (!requestedParcelIds.length) {
    return {
      provider: 'New Hanover County GIS', status: 'unavailable', verifiedAt,
      requestedParcelIds: [], unmatchedParcelIds: [], parcels: [], sourceUrl,
      message: 'No parcel IDs were supplied.',
    }
  }

  try {
    const where = requestedParcelIds.flatMap((parcelId) => {
      return parcelIdVariants(parcelId).flatMap((variant) => {
        const value = sqlString(variant)
        return PARCEL_ID_FIELDS.map((field) => `${field} = '${value}'`)
      })
    }).join(' OR ')
    const parcelResult = await arcGisQuery(PARCEL_LAYER, {
      where,
      outFields: 'OBJECTID,PID,PIN,MAPID,MAPIDKEY,FTR_CODE,ACRES',
      returnGeometry: 'true', returnCentroid: 'true', outSR: '4326',
    })
    const features = parcelResult.features || []
    const verifiedFeatures: ArcGisFeature[] = []
    const parcels: VerifiedParcel[] = []
    const unmatchedParcelIds: string[] = []
    const warnings: string[] = []

    for (const sourceId of requestedParcelIds) {
      const matchResult = findMatch(sourceId, features)
      if (!matchResult.match) {
        unmatchedParcelIds.push(sourceId)
        if (matchResult.ambiguous) {
          warnings.push(`${sourceId} matched more than one county parcel and needs review.`)
        }
        continue
      }
      const match = matchResult.match
      const {feature} = match
      const attributes = feature.attributes || {}
      verifiedFeatures.push(feature)
      parcels.push({
        _key: `parcel-${number(attributes.OBJECTID) || parcels.length}`,
        sourceId,
        matchedBy: match.field,
        matchQuality: match.quality,
        pid: text(attributes.PID) || undefined,
        pin: text(attributes.PIN) || undefined,
        mapId: text(attributes.MAPID) || undefined,
        mapIdKey: text(attributes.MAPIDKEY) || undefined,
        featureType: text(attributes.FTR_CODE) || undefined,
        acres: number(attributes.ACRES),
        objectId: number(attributes.OBJECTID),
      })
      if (match.quality === 'normalized') {
        warnings.push(`${sourceId} matched ${text(attributes[match.field])} after normalizing separators.`)
      }
    }

    const uniqueFeatures = Array.from(new Map(
      verifiedFeatures.map((feature) => [String(feature.attributes?.OBJECTID), feature]),
    ).values())
    const rings = uniqueFeatures.flatMap((feature) => feature.geometry?.rings || [])
    const center = mapCenter(uniqueFeatures)
    const parcelAcres = parcels.reduce((sum, parcel) => sum + (parcel.acres || 0), 0) || undefined

    if (!rings.length) {
      return {
        provider: 'New Hanover County GIS',
        status: parcels.length ? 'partial' : 'unavailable',
        verifiedAt, requestedParcelIds, unmatchedParcelIds, parcels,
        parcelAcres, ...center, sourceUrl,
        message: parcels.length
          ? 'Parcel records matched, but boundary geometry was unavailable.'
          : 'No exact parcel matches were found.',
      }
    }

    const geometry = {rings}
    const contextRequests = [
      ['jurisdiction', contextQuery(1, geometry, 'CITY,JURIS')],
      ['zoning', contextQuery(12, geometry, 'ZONING,ZONINGTXT,CDCASE')],
      ['flood zones', contextQuery(9, geometry, 'FLOODZONE,STATIC_BFE')],
      ['water guidance', contextQuery(11, geometry, 'WATER,NAME')],
      ['sewer guidance', contextQuery(10, geometry, 'SEWER,WWTP')],
    ] as const
    const contextResults = await Promise.allSettled(contextRequests.map(([, request]) => request))
    const contextFeatures = contextResults.map((result, index) => {
      if (result.status === 'fulfilled') return result.value
      warnings.push(`County ${contextRequests[index][0]} was unavailable during this lookup.`)
      return []
    })
    const [municipal, zoning, flood, water, sewer] = contextFeatures
    const municipalities = uniqueStrings(municipal, 'CITY')
      .filter((value) => !/^unincorporated$/i.test(value))
      .map((value) => value.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()))
    const municipalityName = municipalities.length
      ? municipalities.join(', ')
      : 'Unincorporated New Hanover County'

    return {
      provider: 'New Hanover County GIS',
      status: unmatchedParcelIds.length || warnings.length ? 'partial' : 'verified',
      verifiedAt, requestedParcelIds, unmatchedParcelIds, parcels,
      parcelAcres, ...center, municipalityName,
      approvingAuthority: municipalities.length ? municipalityName : 'New Hanover County',
      currentZoning: uniqueStrings(zoning, 'ZONINGTXT'),
      floodZones: uniqueStrings(flood, 'FLOODZONE'),
      waterConsultation: uniqueStrings(water, 'WATER'),
      sewerConsultation: uniqueStrings(sewer, 'SEWER'),
      sourceUrl,
      warnings,
      message: warnings.length ? warnings.join(' ') : undefined,
    }
  } catch (error) {
    return {
      provider: 'New Hanover County GIS', status: 'unavailable', verifiedAt,
      requestedParcelIds, unmatchedParcelIds: requestedParcelIds, parcels: [],
      sourceUrl,
      message: error instanceof Error ? error.message : 'County GIS lookup failed.',
    }
  }
}

export async function enrichProjectWithNewHanoverGis(
  project: Record<string, unknown>,
) {
  const county = text(project.county || project.countyName).toLowerCase()
  const parcelIds = extractParcelIds(project)
  if (!county.includes('new hanover') || !parcelIds.length) return project

  const gisContext = await resolveNewHanoverParcels(parcelIds)
  const documentedSiteAcres = number(project.siteAcres || project.totalSiteAcres)
  if (documentedSiteAcres && gisContext.parcelAcres) {
    const difference = Math.abs(gisContext.parcelAcres - documentedSiteAcres)
    if (difference / documentedSiteAcres > 0.1) {
      const warning = `Official parcels total ${gisContext.parcelAcres.toLocaleString()} acres; the planning record lists ${documentedSiteAcres.toLocaleString()} project acres. The project may use only part of the matched parcel.`
      gisContext.warnings = [...(gisContext.warnings || []), warning]
      gisContext.message = gisContext.warnings.join(' ')
      if (gisContext.status === 'verified') gisContext.status = 'partial'
    }
  }

  const enriched = {
    ...project,
    parcelIds,
    parcelId: parcelIds.join(', '),
    parcelAcres: gisContext.parcelAcres ?? project.parcelAcres,
    latitude: gisContext.latitude ?? project.latitude,
    longitude: gisContext.longitude ?? project.longitude,
    municipalityName: project.municipalityName || gisContext.municipalityName,
    approvingAuthority: project.approvingAuthority || gisContext.approvingAuthority,
    currentZoning: gisContext.currentZoning?.length ? gisContext.currentZoning : project.currentZoning,
    floodZones: gisContext.floodZones?.length ? gisContext.floodZones : project.floodZones,
    waterProvider: project.waterProvider || gisContext.waterConsultation?.join(', '),
    sewerProvider: project.sewerProvider || gisContext.sewerConsultation?.join(', '),
    gisContext,
  }
  return Object.fromEntries(
    Object.entries(enriched).filter(([, value]) => value !== undefined && value !== ''),
  )
}
