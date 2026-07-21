import {extractParcelIds} from './newHanover'

const GIS_ROOT = 'https://bcgis.brunswickcountync.gov/arcgis/rest/services'
const PARCEL_LAYER = `${GIS_ROOT}/Layers/Parcelpoly/FeatureServer/0/query`
const PARCEL_CONTEXT_LAYER = `${GIS_ROOT}/Layers/parcelZonings/FeatureServer/0/query`
const MUNICIPAL_LAYER = `${GIS_ROOT}/Layers/Municipalities/FeatureServer/0/query`

type ArcGisGeometry = {rings?: number[][][]}
type ArcGisFeature = {
  attributes?: Record<string, unknown>
  geometry?: ArcGisGeometry
}
type ArcGisResponse = {
  features?: ArcGisFeature[]
  error?: {message?: string; details?: string[]}
}

type BrunswickParcel = {
  _key?: string
  sourceId: string
  matchedBy?: 'PARCEL_ID' | 'PIN'
  matchQuality?: 'exact' | 'normalized'
  parcelId?: string
  pin?: string
  acres?: number
  calculatedAcres?: number
  objectId?: number
}

export type BrunswickGisContext = {
  provider: 'Brunswick County GIS'
  status: 'verified' | 'partial' | 'unavailable'
  verifiedAt: string
  requestedParcelIds: string[]
  unmatchedParcelIds: string[]
  parcels: BrunswickParcel[]
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
    .replace(/^(?:parcel\s*(?:id|ids|number|numbers|pin|pins)?|pid|pin)\s*[:#-]?\s*/i, '')
    .trim()
  if (!cleaned || cleaned.length > 40) return ''
  if (!/^[a-z0-9][a-z0-9.\-\s]*$/i.test(cleaned)) return ''
  return cleaned
}

function normalizedParcelId(value: unknown) {
  return cleanParcelId(value).toUpperCase().replace(/[^A-Z0-9]/g, '')
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

const PARCEL_ID_FIELDS = ['PARCEL_ID', 'PIN'] as const

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
    const unique = Array.from(new Map(matches.map((match) => {
      const attributes = match.feature.attributes || {}
      const identity = [attributes.PARCEL_ID, attributes.PIN]
        .map(normalizedParcelId).filter(Boolean).join('|')
      return [identity || String(attributes.OBJECTID), match]
    })).values())
    if (unique.length === 1) return {match: unique[0], ambiguous: false}
    if (unique.length > 1) return {ambiguous: true}
  }
  return {ambiguous: false}
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

function splitValues(features: ArcGisFeature[], field: string) {
  return Array.from(new Set(
    features.flatMap((feature) => text(feature.attributes?.[field]).split(/[,;]+/))
      .map((value) => value.trim()).filter(Boolean),
  ))
}

const MUNICIPALITY_NAMES: Record<string, string> = {
  BEL: 'Belville',
  BHI: 'Bald Head Island',
  BOL: 'Bolivia',
  BSL: 'Boiling Spring Lakes',
  CAL: 'Calabash',
  CSH: 'Carolina Shores',
  CWB: 'Caswell Beach',
  HLB: 'Holden Beach',
  LEL: 'Leland',
  NAV: 'Navassa',
  NRW: 'Northwest',
  OAK: 'Oak Island',
  OIB: 'Ocean Isle Beach',
  SCR: 'Sandy Creek',
  SHL: 'Shallotte',
  SPT: 'Southport',
  STJ: 'St. James',
  SUN: 'Sunset Beach',
  VAR: 'Varnamtown',
}

function municipalityName(value: unknown) {
  const code = text(value).toUpperCase().replace(/X$/, '')
  return MUNICIPALITY_NAMES[code] || text(value)
}

async function municipalityQuery(geometry: ArcGisGeometry) {
  const result = await arcGisQuery(MUNICIPAL_LAYER, {
    where: '1=1',
    geometry: JSON.stringify({...geometry, spatialReference: {wkid: 4326}}),
    geometryType: 'esriGeometryPolygon',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'TYPE,STATUS',
    returnGeometry: 'false',
  })
  return result.features || []
}

export async function resolveBrunswickParcels(
  parcelIds: string[],
): Promise<BrunswickGisContext> {
  const requestedParcelIds = Array.from(new Map(
    parcelIds.map(cleanParcelId).filter(Boolean)
      .map((value) => [normalizedParcelId(value), value]),
  ).values()).slice(0, 25)
  const verifiedAt = new Date().toISOString()
  const sourceUrl = PARCEL_LAYER.replace(/\/query$/, '')

  if (!requestedParcelIds.length) {
    return {
      provider: 'Brunswick County GIS', status: 'unavailable', verifiedAt,
      requestedParcelIds: [], unmatchedParcelIds: [], parcels: [], sourceUrl,
      message: 'No parcel IDs were supplied.',
    }
  }

  try {
    const where = requestedParcelIds.flatMap((parcelId) => {
      const values = Array.from(new Set([
        cleanParcelId(parcelId).toUpperCase(),
        normalizedParcelId(parcelId),
      ]))
      return values.flatMap((variant) => PARCEL_ID_FIELDS.map(
        (field) => `${field} = '${sqlString(variant)}'`,
      ))
    }).join(' OR ')
    const parcelResult = await arcGisQuery(PARCEL_LAYER, {
      where,
      outFields: 'OBJECTID,PIN,PARCEL_ID,CALCAC,PARCELTYPE',
      returnGeometry: 'true',
      outSR: '4326',
    })
    const features = parcelResult.features || []
    const verifiedFeatures: ArcGisFeature[] = []
    const parcels: BrunswickParcel[] = []
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
      const calculatedAcres = number(attributes.CALCAC)
      verifiedFeatures.push(feature)
      parcels.push({
        _key: `parcel-${number(attributes.OBJECTID) || parcels.length}`,
        sourceId,
        matchedBy: field,
        matchQuality: quality,
        parcelId: text(attributes.PARCEL_ID) || undefined,
        pin: text(attributes.PIN) || undefined,
        acres: calculatedAcres,
        calculatedAcres,
        objectId: number(attributes.OBJECTID),
      })
      if (quality === 'normalized') {
        warnings.push(`${sourceId} matched ${text(attributes[field])} after normalizing separators.`)
      }
    }

    const uniqueFeatures = Array.from(new Map(
      verifiedFeatures.map((feature) => [String(feature.attributes?.OBJECTID), feature]),
    ).values())
    const rings = uniqueFeatures.flatMap((feature) => feature.geometry?.rings || [])
    const center = mapCenter(uniqueFeatures)
    const parcelAcresTotal = parcels.reduce((sum, parcel) => sum + (parcel.acres || 0), 0)
    const parcelAcres = parcelAcresTotal ? Number(parcelAcresTotal.toFixed(4)) : undefined

    if (!parcels.length) {
      return {
        provider: 'Brunswick County GIS', status: 'unavailable', verifiedAt,
        requestedParcelIds, unmatchedParcelIds, parcels, sourceUrl,
        message: 'No exact parcel matches were found.',
      }
    }

    const canonicalParcelIds = Array.from(new Set(
      parcels.map((parcel) => parcel.parcelId).filter((value): value is string => Boolean(value)),
    ))
    let parcelContext: ArcGisFeature[] = []
    if (canonicalParcelIds.length) {
      try {
        const contextWhere = canonicalParcelIds
          .map((value) => `PARCEL_ID = '${sqlString(value)}'`).join(' OR ')
        const contextResult = await arcGisQuery(PARCEL_CONTEXT_LAYER, {
          where: contextWhere,
          outFields: 'PARCEL_ID,ZONE_LID_VALUE,ZCODE,LON,LAT',
          returnGeometry: 'false',
        })
        parcelContext = contextResult.features || []
        const linkedIds = new Set(parcelContext.map((feature) => (
          normalizedParcelId(feature.attributes?.PARCEL_ID)
        )))
        for (const parcelId of canonicalParcelIds) {
          if (!linkedIds.has(normalizedParcelId(parcelId))) {
            warnings.push(`No parcel-linked zoning record was found for ${parcelId}.`)
          }
        }
      } catch {
        warnings.push('County parcel-linked zoning and flood context was unavailable during this lookup.')
      }
    }

    let municipalities: ArcGisFeature[] = []
    if (rings.length) {
      try {
        const municipal = await municipalityQuery({rings})
        municipalities = municipal
      } catch {
        warnings.push('County municipal boundaries were unavailable during this lookup.')
      }
    } else {
      warnings.push('Parcel records matched, but boundary geometry was unavailable.')
    }

    const incorporatedNames = Array.from(new Set(
      municipalities.filter((feature) => /^city$/i.test(text(feature.attributes?.STATUS)))
        .map((feature) => municipalityName(feature.attributes?.TYPE)).filter(Boolean),
    ))
    const etjNames = Array.from(new Set(
      municipalities.filter((feature) => /^etj$/i.test(text(feature.attributes?.STATUS)))
        .map((feature) => municipalityName(feature.attributes?.TYPE)).filter(Boolean),
    ))
    if (!incorporatedNames.length && etjNames.length) {
      warnings.push(`Parcel intersects the ${etjNames.join(', ')} ETJ; confirm the approving authority from the planning record.`)
    }
    const jurisdiction = incorporatedNames.length
      ? incorporatedNames.join(', ')
      : etjNames.length ? `${etjNames.join(', ')} ETJ` : 'Unincorporated Brunswick County'

    return {
      provider: 'Brunswick County GIS',
      status: unmatchedParcelIds.length || warnings.length ? 'partial' : 'verified',
      verifiedAt, requestedParcelIds, unmatchedParcelIds, parcels,
      parcelAcres, ...center, municipalityName: jurisdiction,
      approvingAuthority: incorporatedNames.length
        ? incorporatedNames.join(', ')
        : etjNames.length ? undefined : 'Brunswick County',
      currentZoning: splitValues(parcelContext, 'ZCODE'),
      floodZones: splitValues(parcelContext, 'ZONE_LID_VALUE'),
      sourceUrl,
      warnings,
      message: warnings.length ? warnings.join(' ') : undefined,
    }
  } catch (error) {
    return {
      provider: 'Brunswick County GIS', status: 'unavailable', verifiedAt,
      requestedParcelIds, unmatchedParcelIds: requestedParcelIds, parcels: [],
      sourceUrl,
      message: error instanceof Error ? error.message : 'County GIS lookup failed.',
    }
  }
}

export async function enrichProjectWithBrunswickGis(project: Record<string, unknown>) {
  const county = text(project.county || project.countyName).toLowerCase()
  const parcelIds = extractParcelIds(project)
  if (!county.includes('brunswick') || !parcelIds.length) return project

  const gisContext = await resolveBrunswickParcels(parcelIds)
  const documentedSiteAcres = number(project.siteAcres || project.totalSiteAcres)
  if (documentedSiteAcres && gisContext.parcelAcres) {
    const difference = Math.abs(gisContext.parcelAcres - documentedSiteAcres)
    if (difference > 1 && difference / documentedSiteAcres > 0.1) {
      const warning = `County parcel geometry totals ${gisContext.parcelAcres.toLocaleString()} acres; the planning record lists ${documentedSiteAcres.toLocaleString()} project acres. The project may use only part of the matched parcels.`
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
