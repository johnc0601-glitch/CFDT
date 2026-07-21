import {extractParcelIds} from './newHanover'

const GIS_ROOT = 'https://gis.pendercountync.gov/arcgis/rest/services/OperationalLayers2026/MapServer'
const PARCEL_LAYER = `${GIS_ROOT}/4/query`

type ArcGisGeometry = {rings?: number[][][]}
type ArcGisFeature = {
  attributes?: Record<string, unknown>
  geometry?: ArcGisGeometry
}
type ArcGisResponse = {
  features?: ArcGisFeature[]
  error?: {message?: string; details?: string[]}
}

type PenderParcel = {
  _key?: string
  sourceId: string
  matchedBy?: 'PIN' | 'ALPHA' | 'ALPHA_COPY'
  matchQuality?: 'exact' | 'normalized'
  pin?: string
  acres?: number
  calculatedAcres?: number
  objectId?: number
}

export type PenderGisContext = {
  provider: 'Pender County GIS'
  status: 'verified' | 'partial' | 'unavailable'
  verifiedAt: string
  requestedParcelIds: string[]
  unmatchedParcelIds: string[]
  parcels: PenderParcel[]
  parcelAcres?: number
  latitude?: number
  longitude?: number
  municipalityName?: string
  approvingAuthority?: string
  currentZoning?: string[]
  floodZones?: string[]
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

  // Pender PINs are printed as 4203-74-3682-0000. OCR often drops separators.
  if (/^\d{14}$/.test(normalized)) {
    variants.push(
      `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 10)}-${normalized.slice(10)}`,
    )
  }
  return Array.from(new Set(variants))
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

const PARCEL_ID_FIELDS = ['PIN', 'ALPHA', 'ALPHA_COPY'] as const

function findMatch(sourceId: string, features: ArcGisFeature[]) {
  const exactKey = cleanParcelId(sourceId).toUpperCase()
  const normalizedKey = normalizedParcelId(sourceId)

  for (const quality of ['exact', 'normalized'] as const) {
    const matches = features.flatMap((feature) => PARCEL_ID_FIELDS.flatMap((field) => {
      const value = feature.attributes?.[field]
      const isMatch = quality === 'exact'
        ? text(value).toUpperCase() === exactKey
        : normalizedParcelId(value) === normalizedKey
      return isMatch ? [{feature, field, quality}] : []
    }))
    const unique = Array.from(new Map(
      matches.map((match) => [String(match.feature.attributes?.OBJECTID_1), match]),
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
  const points = features.flatMap((feature) => (feature.geometry?.rings || []).flat())
  if (!points.length) return {}
  const xs = points.map(([x]) => x).filter(Number.isFinite)
  const ys = points.map(([, y]) => y).filter(Number.isFinite)
  if (!xs.length || !ys.length) return {}
  return {
    longitude: (Math.min(...xs) + Math.max(...xs)) / 2,
    latitude: (Math.min(...ys) + Math.max(...ys)) / 2,
  }
}

async function contextQuery(layer: number, geometry: ArcGisGeometry, outFields: string) {
  const result = await arcGisQuery(`${GIS_ROOT}/${layer}/query`, {
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

const ZONING_LAYERS = [
  {id: 36, name: 'county zoning', field: 'UDO_ZONING'},
  {id: 39, name: 'Burgaw zoning', field: 'Zoning_Dis'},
  {id: 40, name: 'St. Helena zoning', field: 'ZONING'},
  {id: 41, name: 'Surf City zoning', field: 'ZONE'},
  {id: 42, name: 'Topsail Beach zoning', field: 'ZONING_'},
  {id: 43, name: 'Watha zoning', field: 'ZONING_'},
] as const

export async function resolvePenderParcels(parcelIds: string[]): Promise<PenderGisContext> {
  const requestedParcelIds = Array.from(new Map(
    parcelIds.map(cleanParcelId).filter(Boolean)
      .map((value) => [normalizedParcelId(value), value]),
  ).values()).slice(0, 25)
  const verifiedAt = new Date().toISOString()
  const sourceUrl = PARCEL_LAYER.replace(/\/query$/, '')

  if (!requestedParcelIds.length) {
    return {
      provider: 'Pender County GIS', status: 'unavailable', verifiedAt,
      requestedParcelIds: [], unmatchedParcelIds: [], parcels: [], sourceUrl,
      message: 'No parcel IDs were supplied.',
    }
  }

  try {
    const where = requestedParcelIds.flatMap((parcelId) => (
      parcelIdVariants(parcelId).flatMap((variant) => {
        const value = sqlString(variant)
        return PARCEL_ID_FIELDS.map((field) => `${field} = '${value}'`)
      })
    )).join(' OR ')
    const parcelResult = await arcGisQuery(PARCEL_LAYER, {
      where,
      outFields: 'OBJECTID_1,ALPHA,PIN,ALPHA_COPY,CALCACRES,ACRES',
      returnGeometry: 'true',
      outSR: '4326',
    })
    const features = parcelResult.features || []
    const verifiedFeatures: ArcGisFeature[] = []
    const parcels: PenderParcel[] = []
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

      const {feature, field, quality} = matchResult.match
      const attributes = feature.attributes || {}
      const recordedAcres = number(attributes.ACRES)
      const calculatedAcres = number(attributes.CALCACRES)
      verifiedFeatures.push(feature)
      parcels.push({
        _key: `parcel-${number(attributes.OBJECTID_1) || parcels.length}`,
        sourceId,
        matchedBy: field,
        matchQuality: quality,
        pin: text(attributes.PIN) || text(attributes.ALPHA) || undefined,
        acres: recordedAcres || calculatedAcres,
        calculatedAcres,
        objectId: number(attributes.OBJECTID_1),
      })
      if (quality === 'normalized') {
        warnings.push(`${sourceId} matched ${text(attributes[field])} after normalizing separators.`)
      }
      if (
        recordedAcres && calculatedAcres &&
        Math.abs(recordedAcres - calculatedAcres) > 1 &&
        Math.abs(recordedAcres - calculatedAcres) / recordedAcres > 0.1
      ) {
        warnings.push(`${text(attributes.PIN) || sourceId} has ${recordedAcres.toLocaleString()} recorded acres and ${calculatedAcres.toLocaleString()} GIS-calculated acres.`)
      }
    }

    const uniqueFeatures = Array.from(new Map(
      verifiedFeatures.map((feature) => [String(feature.attributes?.OBJECTID_1), feature]),
    ).values())
    const rings = uniqueFeatures.flatMap((feature) => feature.geometry?.rings || [])
    const center = mapCenter(uniqueFeatures)
    const parcelAcresTotal = parcels.reduce((sum, parcel) => sum + (parcel.acres || 0), 0)
    const parcelAcres = parcelAcresTotal ? Number(parcelAcresTotal.toFixed(4)) : undefined

    if (!rings.length) {
      return {
        provider: 'Pender County GIS',
        status: parcels.length ? 'partial' : 'unavailable',
        verifiedAt, requestedParcelIds, unmatchedParcelIds, parcels,
        parcelAcres, ...center, sourceUrl, warnings,
        message: parcels.length
          ? 'Parcel records matched, but boundary geometry was unavailable.'
          : 'No exact parcel matches were found.',
      }
    }

    const geometry = {rings}
    const requests = [
      {name: 'municipal boundaries', field: 'ALPHA', request: contextQuery(9, geometry, 'ALPHA')},
      {name: 'municipal ETJ', field: 'ALPHA', request: contextQuery(10, geometry, 'ALPHA')},
      {name: 'flood zones', field: 'ZONE_LID_VALUE', request: contextQuery(24, geometry, 'ZONE_LID_VALUE,ZONESUB_LID_VALUE')},
      ...ZONING_LAYERS.map((layer) => ({
        name: layer.name,
        field: layer.field,
        request: contextQuery(layer.id, geometry, layer.field),
      })),
    ]
    const results = await Promise.allSettled(requests.map(({request}) => request))
    const context = results.map((result, index) => {
      if (result.status === 'fulfilled') return result.value
      warnings.push(`County ${requests[index].name} was unavailable during this lookup.`)
      return []
    })
    const municipalities = uniqueStrings(context[0], 'ALPHA')
    const etjs = uniqueStrings(context[1], 'ALPHA')
    if (!municipalities.length && etjs.length) {
      warnings.push(`Parcel intersects the ${etjs.join(', ')} ETJ; confirm the approving authority from the planning record.`)
    }
    const municipalityName = municipalities.length
      ? municipalities.join(', ')
      : etjs.length ? `${etjs.join(', ')} ETJ` : 'Unincorporated Pender County'
    const currentZoning = Array.from(new Set(
      requests.slice(3).flatMap((request, index) => uniqueStrings(context[index + 3], request.field))
        .filter((value) => !/^incorp$/i.test(value)),
    ))

    return {
      provider: 'Pender County GIS',
      status: unmatchedParcelIds.length || warnings.length ? 'partial' : 'verified',
      verifiedAt, requestedParcelIds, unmatchedParcelIds, parcels,
      parcelAcres, ...center, municipalityName,
      approvingAuthority: municipalities.length
        ? municipalities.join(', ')
        : etjs.length ? undefined : 'Pender County',
      currentZoning,
      floodZones: uniqueStrings(context[2], 'ZONE_LID_VALUE'),
      sourceUrl,
      warnings,
      message: warnings.length ? warnings.join(' ') : undefined,
    }
  } catch (error) {
    return {
      provider: 'Pender County GIS', status: 'unavailable', verifiedAt,
      requestedParcelIds, unmatchedParcelIds: requestedParcelIds, parcels: [],
      sourceUrl,
      message: error instanceof Error ? error.message : 'County GIS lookup failed.',
    }
  }
}

export async function enrichProjectWithPenderGis(project: Record<string, unknown>) {
  const county = text(project.county || project.countyName).toLowerCase()
  const parcelIds = extractParcelIds(project)
  if (!county.includes('pender') || !parcelIds.length) return project

  const gisContext = await resolvePenderParcels(parcelIds)
  const documentedSiteAcres = number(project.siteAcres || project.totalSiteAcres)
  if (documentedSiteAcres && gisContext.parcelAcres) {
    const difference = Math.abs(gisContext.parcelAcres - documentedSiteAcres)
    if (difference / documentedSiteAcres > 0.1) {
      const warning = `Official parcels total ${gisContext.parcelAcres.toLocaleString()} acres; the planning record lists ${documentedSiteAcres.toLocaleString()} project acres. The project may use only part of the matched parcels.`
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
    gisContext,
  }
  return Object.fromEntries(
    Object.entries(enriched).filter(([, value]) => value !== undefined && value !== ''),
  )
}
