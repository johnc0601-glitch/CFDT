export type ProjectDocument = {
  _id: string
  title: string
  documentType?: string
  documentDate?: string
  officialUrl?: string
  fileUrl?: string
  summary?: string
  publicDisplay?: boolean
  displayOrder?: number
}
