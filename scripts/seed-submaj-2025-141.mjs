import {createClient} from '@sanity/client'

const token = process.env.SANITY_WRITE_TOKEN
if (!token) {
  throw new Error(
    'Missing SANITY_WRITE_TOKEN. In PowerShell run: $env:SANITY_WRITE_TOKEN="PASTE_TOKEN_HERE"'
  )
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vluqmdns',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-07-08',
  useCdn: false,
  token,
})

const projectId = 'project-east-village-hawksbill-cove'
const officialUrl =
  'https://www.pendercountync.gov/DocumentCenter/View/4858/SUBMAJ-2025-141-East-Village-Hawksbill-Cove'

const county = await client.fetch(
  `*[_type == "county" && name == "Pender County"][0]{_id}`
)

if (!county?._id) {
  throw new Error(
    'Pender County was not found in Sanity. Add the county record before running this seed.'
  )
}

const project = {
  _id: projectId,
  _type: 'project',
  name: 'East Village at Hawksbill Cove',
  slug: {_type: 'slug', current: 'east-village-hawksbill-cove'},
  county: {_type: 'reference', _ref: county._id},
  status: 'Preliminary Plat Under Review',
  homesProposed: 485,
  siteAcres: 164.47,
  totalPropertyAcres: 376.2,
  developer: 'Ryan Homes',
  engineer: 'WithersRavenel',
  parcelId:
    '4203-74-3682-0000; 4203-64-1002-0000; 4203-45-2426-0000; 4203-54-0458-0000; 4203-43-7857-0000; 4203-64-4531-0000; 4203-53-9769-0000; 4203-45-4049-0000; 4203-53-8553-0000',
  projectType: 'Major Subdivision – Preliminary Plat',
  approvingAuthority: 'Pender County Planning & Community Development',
  locationDescription:
    'Off Country Club Drive between Avila Avenue and Velinza Plantation Road, Hampstead, Pender County.',
  summary:
    'East Village at Hawksbill Cove is a proposed 485-lot single-family subdivision on approximately 164.47 acres within a larger 376.20-acre Planned Development property in Hampstead. The plans divide East Village into three phases and include roads, utilities, stormwater facilities, landscaping, and associated infrastructure.',
  latestUpdateDate: '2025-10-03',
  latestUpdate:
    'Construction-plan materials for case SUBMAJ 2025-141 were prepared for preliminary-plat review. The submitted East Village plans show 485 single-family lots across three phases.',
  nextStep:
    'Pender County staff and the Technical Review Committee must complete preliminary-plat review. Additional permits and construction-plan approvals will be required before site work and lot recording.',
  zoning: 'Planned Development (PD)',
  waterProvider: 'Pender County Utilities',
  sewerProvider: 'Pluris',
  timeline: [
    {
      _key: 'master-plan-revision',
      title: 'Master Development Plan Revision Approved',
      date: '2025-08-18',
      stageStatus: 'Complete',
      description:
        'The Hawksbill Cove Planned Development master-plan revision referenced in the application was approved by Pender County.',
    },
    {
      _key: 'application-signed',
      title: 'Preliminary Plat Application Signed',
      date: '2025-10-01',
      stageStatus: 'Complete',
      description:
        'Ryan Homes and Hampstead Properties LLC signed the subdivision application.',
    },
    {
      _key: 'plans-dated',
      title: 'Construction Plans Dated',
      date: '2025-10-03',
      stageStatus: 'Current',
      description:
        'The East Village construction plans were dated October 3, 2025 for county review.',
    },
    {
      _key: 'trc-review',
      title: 'Technical Review Committee Review',
      stageStatus: 'Future',
      description:
        'The major-subdivision preliminary plat remains subject to county technical review.',
    },
    {
      _key: 'construction-approvals',
      title: 'Construction and Permit Approvals',
      stageStatus: 'Future',
      description:
        'Road, utility, stormwater, erosion-control, environmental, and other permits must be secured before construction.',
    },
    {
      _key: 'final-plats',
      title: 'Final Plat Recording by Phase',
      stageStatus: 'Future',
      description:
        'Final plats must be approved and recorded before individual lots can be conveyed.',
    },
  ],
}

const document = {
  _id: 'document-submaj-2025-141-application-package',
  _type: 'projectDocument',
  project: {_type: 'reference', _ref: projectId},
  title: 'SUBMAJ 2025-141 Application and Construction Plan Package',
  documentType: 'Preliminary Plat Package',
  documentDate: '2025-10-03',
  officialUrl,
  summary:
    'Official Pender County application and plan package for the proposed 485-lot East Village phase of Hawksbill Cove.',
  publicDisplay: true,
  displayOrder: 1,
}

const update = {
  _id: 'update-east-village-2025-10-03',
  _type: 'projectUpdate',
  project: {_type: 'reference', _ref: projectId},
  title: 'Preliminary plat package prepared',
  date: '2025-10-03',
  summary:
    'The SUBMAJ 2025-141 package includes the application and construction plans for 485 proposed single-family lots.',
  sourceUrl: officialUrl,
  isFeatured: false,
}

const transaction = client
  .transaction()
  .createOrReplace(project)
  .createOrReplace(document)
  .createOrReplace(update)

await transaction.commit()

console.log('Created or updated:')
console.log('- East Village at Hawksbill Cove')
console.log('- SUBMAJ 2025-141 document record')
console.log('- October 3, 2025 project update')
console.log('')
console.log('Open: http://localhost:3000/projects/east-village-hawksbill-cove')
