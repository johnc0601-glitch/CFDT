export type Project = {
  _id: string
  _updatedAt?: string
  name: string
  status?: string
  homesProposed?: number
  singleFamilyDetachedUnits?: number
  singleFamilyAttachedUnits?: number
  multifamilyUnits?: number
  siteAcres?: number
  totalPropertyAcres?: number
  conservationFloodplainAcres?: number
  developer?: string
  engineer?: string
  parcelId?: string
  parcelIds?: string[]
  parcelAcres?: number
  projectType?: string
  approvingAuthority?: string
  locationDescription?: string
  summary?: string
  latestUpdateDate?: string
  latestUpdate?: string | null
  nextStep?: string
  countyName?: string
  municipalityName?: string
  currentZoning?: string[]
  floodZones?: string[]
  possibleWetlands?: boolean
  gisContext?: {
    provider?: string
    status?: 'verified' | 'partial' | 'unavailable'
    verifiedAt?: string
    requestedParcelIds?: string[]
    unmatchedParcelIds?: string[]
    warnings?: string[]
    sourceUrl?: string
    message?: string
  }
  heroImageUrl?: string
  heroImageAlt?: string
  heroImageCaption?: string
  zoning?: string
  futureLandUse?: string
  waterProvider?: string
  sewerProvider?: string
  slug?: {current?: string}
  timeline?: {
    title?: string
    date?: string | null
    stageStatus?: string
    description?: string
  }[]
  officialResources?: {
    label?: string
    url?: string
  }[]
  sourcesUsed?: {
    title?: string
    url?: string
    sourceDate?: string
  }[]
  totalSiteAcres?: number
  openSpaceAcres?: number
  wetlandsAcres?: number
  schoolDistrict?: string
  fireDistrict?: string
  latitude?: number
  longitude?: number
  commercialSquareFeet?: number
  affordableHousingUnits?: number
  caseNumber?: string
  relatedCaseNumbers?: string[]
  stormwaterNotes?: string
  floodplainAcres?: number
  trafficMetrics?: {
    dailyTrips?: number
    amPeakTrips?: number
    pmPeakTrips?: number
    buildOutYear?: number
    tiaDate?: string
    trafficEngineer?: string
    accessRoads?: string[]
    improvements?: string[]
  }
  homesApproved?: number
  homesBuilt?: number
  homesRemaining?: number
  buildableAcres?: number
  wetlandAcres?: number
  floodZone?: string
  watershed?: string
  applicant?: string
  owner?: string
  [key: string]: unknown
}
