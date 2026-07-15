import {createClient} from '@sanity/client'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_STUDIO_DATASET || 'production'
const token = process.env.SANITY_WRITE_TOKEN

if (!projectId) throw new Error('Missing Sanity project ID.')
if (!token) throw new Error('Missing SANITY_WRITE_TOKEN.')

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2026-07-10',
  token,
  useCdn: false,
})

const sourceApproval =
  'https://laserfiche.nhcgov.com/WebLink/DocView.aspx?id=5447222&dbid=0&repo=NHC'

const projectData = {
  name: 'Hilton Bluffs',
  slug: {current: 'hilton-bluffs'},
  projectType: 'Performance Residential Development',
  status: 'Conditional Preliminary Approval',
  homesProposed: 1800,
  siteAcres: 581.2,
  totalPropertyAcres: 1809.78,
  conservationFloodplainAcres: 1228.58,
  locationDescription: '4000 block of Castle Hayne Road, Castle Hayne, New Hanover County',
  parcelId: 'R00900-001-001-000',
  developer: 'Copper Builders',
  engineer: 'Paramounte Engineering',
  approvingAuthority: 'New Hanover County Technical Review Committee',
  zoning: 'Rural Agricultural (RA)',
  waterProvider: 'Cape Fear Public Utility Authority',
  sewerProvider: 'Cape Fear Public Utility Authority',
  summary:
    'Hilton Bluffs is a proposed 1,800-home residential subdivision in Castle Hayne. The approved preliminary plan covers approximately 1,809.78 acres, but the homes are planned within about 581.20 acres of uplands. Much of the remaining property contains floodplain, Class IV soils, wetlands, and other conservation resources. The New Hanover County Technical Review Committee granted conditional preliminary approval on March 10, 2026. Before construction plans for lots beyond the first 581 can be approved, the required conservation area must be permanently protected.',
  latestUpdateDate: '2026-03-10',
  latestUpdate:
    'The New Hanover County Technical Review Committee conditionally approved the preliminary plan for 1,800 single-family detached homes. The approval is subject to conservation, transportation, permitting, tree-protection, and other development conditions.',
  nextStep:
    'The applicant must satisfy the conditions of approval and obtain the required county, state, and federal permits. Construction plans for lots beyond the initial 581 upland lots cannot be approved until the required conservation easement or another permitted conservation method is completed.',
  timeline: [
    {
      _key: 'tia-original',
      title: 'Traffic Impact Analysis submitted',
      date: '2025-10-15',
      stageStatus: 'Complete',
      description: 'The original Transportation Impact Analysis was submitted for review.',
    },
    {
      _key: 'tia-revision',
      title: 'Traffic Impact Analysis revised',
      date: '2025-12-16',
      stageStatus: 'Complete',
      description: 'The transportation analysis was revised, including a Phase 3 improvement update.',
    },
    {
      _key: 'trc-approval',
      title: 'TRC conditional preliminary approval',
      date: '2026-03-10',
      stageStatus: 'Current',
      description:
        'New Hanover County conditionally approved the 1,800-unit preliminary plan, subject to eight listed conditions and additional permits.',
    },
    {
      _key: 'conservation',
      title: 'Conservation requirements',
      stageStatus: 'Future',
      description:
        'Required Class IV soils and conservation resources must be permanently conserved before construction plans for lots beyond the initial 581 upland lots may be approved.',
    },
    {
      _key: 'construction-plans',
      title: 'Construction plan review',
      stageStatus: 'Future',
      description:
        'Each phase must receive construction-plan approval and all applicable county, state, and federal permits.',
    },
    {
      _key: 'final-plat',
      title: 'Final plat and development',
      stageStatus: 'Future',
      description:
        'Final plats may be recorded by phase after applicable conditions and approvals are satisfied.',
    },
  ],
  officialResources: [
    {
      _key: 'conditional-approval',
      label: 'TRC Conditional Preliminary Approval',
      url: sourceApproval,
    },
  ],
  sourcesUsed: [
    {
      _key: 'trc-source',
      title: 'Hilton Bluffs Preliminary Plan Conditional Approval',
      url: sourceApproval,
      sourceDate: '2026-03-10',
    },
  ],
}

let project = await client.fetch(
  `*[_type == "project" && slug.current == "hilton-bluffs"][0]{_id}`
)

if (!project?._id) {
  project = await client.create({
    _type: 'project',
    ...projectData,
  })
  console.log(`Created project: ${project._id}`)
} else {
  await client.patch(project._id).set(projectData).commit()
  console.log(`Updated project: ${project._id}`)
}

const documents = [
  {
    title: 'Preliminary Plan Conditional Approval',
    documentType: 'Staff Report',
    documentDate: '2026-03-10',
    officialUrl: sourceApproval,
    summary:
      'Official New Hanover County conditional approval for the 1,800-unit preliminary plan. It lists conservation, transportation, permitting, and tree-protection conditions.',
    publicDisplay: true,
    displayOrder: 10,
  },
  {
    title: 'Transportation Impact Analysis',
    documentType: 'Traffic Study',
    documentDate: '2025-12-16',
    summary:
      'Transportation analysis prepared for Copper Builders. The TRC approval requires the transportation improvements associated with Phase 3 of the approved analysis unless an updated phasing plan is accepted.',
    publicDisplay: true,
    displayOrder: 20,
  },
]

for (const doc of documents) {
  const existing = await client.fetch(
    `*[_type == "projectDocument" && project._ref == $projectId && title == $title][0]{_id}`,
    {projectId: project._id, title: doc.title}
  )

  if (existing?._id) {
    await client.patch(existing._id).set(doc).commit()
    console.log(`Updated document: ${doc.title}`)
  } else {
    await client.create({
      _type: 'projectDocument',
      project: {_type: 'reference', _ref: project._id},
      ...doc,
    })
    console.log(`Created document: ${doc.title}`)
  }
}

console.log('Hilton Bluffs content seed complete.')
