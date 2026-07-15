export type ProjectIntake = {
  _id: string
  title: string
  status?: string
  projectName?: string
  countyName?: string
  municipalityName?: string
  developer?: string
  engineer?: string
  parcelIds?: string[]
  homesProposed?: number
  siteAcres?: number
  zoning?: string
  futureLandUse?: string
  waterProvider?: string
  sewerProvider?: string
  trafficNotes?: string
  environmentalNotes?: string
  staffRecommendation?: string
  conditionsOfApproval?: string[]
  draftSummary?: string
  sourceUrl?: string
}
