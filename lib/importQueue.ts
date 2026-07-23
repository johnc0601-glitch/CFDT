export type ImportQueueStatus =
  | 'import-ready'
  | 'needs-pdf'
  | 'watchlist'
  | 'below-threshold'

export type ImportQueueItem = {
  name: string
  slug: string
  county: 'New Hanover County' | 'Pender County' | 'Brunswick County'
  units: number
  acres?: number
  status: ImportQueueStatus
  planningStatus: string
  sourceLabel: string
  sourceUrl: string
  notes?: string
}

const importQueueItems: ImportQueueItem[] = [
  {
    name: 'Maco Road Development Agreement',
    slug: 'maco-road-development-agreement',
    county: 'Brunswick County',
    units: 12499,
    status: 'watchlist',
    planningStatus: 'Withdrawn, likely to return',
    sourceLabel: 'Port City Daily',
    sourceUrl:
      'https://portcitydaily.com/latest-news/2026/06/17/doesnt-mean-we-can-t-come-back-developers-withdraw-agreement-for-13k-home-project/',
    notes:
      'Too large to ignore, but not import-ready until a planned development filing or new packet appears.',
  },
  {
    name: 'Canopy Planned Development',
    slug: 'canopy-planned-development',
    county: 'Brunswick County',
    units: 3200,
    acres: 986.8,
    status: 'import-ready',
    planningStatus: 'Planning Board public hearing',
    sourceLabel: 'Brunswick County PD-167',
    sourceUrl: 'https://brunswickcountync.gov/CivicAlerts.aspx?AID=718',
  },
  {
    name: 'Blake Farm',
    slug: 'blake-farm',
    county: 'Pender County',
    units: 2707,
    acres: 440,
    status: 'needs-pdf',
    planningStatus: 'Approved / continuing phases',
    sourceLabel: 'StarNews via AOL',
    sourceUrl:
      'https://www.aol.com/articles/thousands-homes-including-apartments-retirement-090216523.html',
    notes:
      'Article reports 2,707 total units, 1,389 built, and 1,318 remaining. Needs official phase packet for import.',
  },
  {
    name: 'Lanes Ferry Landing',
    slug: 'lanes-ferry-landing',
    county: 'Pender County',
    units: 2695,
    acres: 987,
    status: 'import-ready',
    planningStatus: 'Master plan / phases under review',
    sourceLabel: 'Port City Daily',
    sourceUrl:
      'https://portcitydaily.com/local-news/2024/07/29/1700-residential-units-under-review-this-week-in-pender-county/',
  },
  {
    name: 'Hilton Bluffs',
    slug: 'hilton-bluffs',
    county: 'New Hanover County',
    units: 1800,
    status: 'import-ready',
    planningStatus: 'Conditionally approved',
    sourceLabel: 'New Hanover County residential projects',
    sourceUrl: 'https://www.nhcgov.com/595/Residential-Projects',
  },
  {
    name: 'Sidbury 187',
    slug: 'sidbury-187',
    county: 'New Hanover County',
    units: 1751,
    acres: 700,
    status: 'import-ready',
    planningStatus: 'Approved',
    sourceLabel: 'New Hanover County residential projects',
    sourceUrl: 'https://www.nhcgov.com/595/Residential-Projects',
  },
  {
    name: 'Avenue One Subdivision',
    slug: 'avenue-one-subdivision',
    county: 'New Hanover County',
    units: 1462,
    status: 'import-ready',
    planningStatus: 'Under review',
    sourceLabel: 'New Hanover County residential projects',
    sourceUrl: 'https://www.nhcgov.com/595/Residential-Projects',
  },
  {
    name: 'Green Hill Planned Development',
    slug: 'green-hill-planned-development',
    county: 'Brunswick County',
    units: 1340,
    acres: 784.59,
    status: 'import-ready',
    planningStatus: 'Denied / litigation watch',
    sourceLabel: 'Brunswick County PD-161',
    sourceUrl: 'https://www.brunswickcountync.gov/m/newsflash/Home/Detail/747',
  },
  {
    name: 'Cherrytree Residential Planned Development',
    slug: 'cherrytree-residential-planned-development',
    county: 'Brunswick County',
    units: 1116,
    acres: 741.09,
    status: 'import-ready',
    planningStatus: 'Planning Board public hearing',
    sourceLabel: 'Brunswick County PD-163',
    sourceUrl: 'https://www.brunswickcountync.gov/CivicAlerts.aspx?AID=685&ARC=1843',
  },
  {
    name: 'Indigo Planned Development',
    slug: 'indigo-planned-development',
    county: 'Brunswick County',
    units: 1100,
    acres: 326.96,
    status: 'needs-pdf',
    planningStatus: 'Older planned development record',
    sourceLabel: 'Brunswick County PD-137',
    sourceUrl: 'https://brunswickcountync.gov/CivicAlerts.asp?AID=328&ARC=985',
  },
  {
    name: 'Falls Mist Garden',
    slug: 'falls-mist-garden',
    county: 'Pender County',
    units: 750,
    acres: 300,
    status: 'needs-pdf',
    planningStatus: 'Approved / phase filings active',
    sourceLabel: 'WECT',
    sourceUrl:
      'https://www.wect.com/2022/01/19/pender-county-board-commissioners-approve-new-development-rocky-point-area/',
    notes:
      'Use current Pender phase filings and WWTP support documents when importing.',
  },
  {
    name: 'East Village / Hawksbill Cove',
    slug: 'east-village-hawksbill-cove',
    county: 'Pender County',
    units: 485,
    acres: 147,
    status: 'needs-pdf',
    planningStatus: 'Master plan revision approved',
    sourceLabel: 'Pender County MDP list',
    sourceUrl: 'https://www.pendercountync.gov/400/Master-Development-Plans',
    notes: 'County list confirms filing; unit count should be tied to official packet.',
  },
  {
    name: 'Amber Glen Planned Development',
    slug: 'amber-glen-planned-development',
    county: 'Brunswick County',
    units: 417,
    acres: 122,
    status: 'import-ready',
    planningStatus: 'Planning Board public hearing',
    sourceLabel: 'Brunswick County PD-180',
    sourceUrl: 'https://brunswickcountync.gov/m/newsflash/home/detail/520',
  },
  {
    name: 'Point South',
    slug: 'point-south',
    county: 'Pender County',
    units: 418,
    acres: 77.61,
    status: 'needs-pdf',
    planningStatus: 'Under review / local report',
    sourceLabel: 'Port City Daily',
    sourceUrl:
      'https://portcitydaily.com/latest-news/2023/11/15/mcadams-homes-to-expand-local-presence-with-400-unit-scotts-hill-development/',
  },
  {
    name: 'Gray Bridge Planned Development',
    slug: 'gray-bridge-planned-development',
    county: 'Brunswick County',
    units: 400,
    acres: 98.03,
    status: 'import-ready',
    planningStatus: 'Approved by Planning Board',
    sourceLabel: 'Brunswick County PD-177',
    sourceUrl: 'https://www.brunswickcountync.gov/CivicAlerts.aspx?AID=774',
  },
  {
    name: 'Piver Tract',
    slug: 'piver-tract',
    county: 'Pender County',
    units: 355,
    acres: 147,
    status: 'import-ready',
    planningStatus: 'Planning Board approved',
    sourceLabel: 'Port City Daily',
    sourceUrl:
      'https://portcitydaily.com/latest-news/2026/01/09/safety-wise-its-a-big-issue-residents-concerned-with-approved-355-home-hampstead-development/',
  },
  {
    name: 'Mirasol Residential Planned Development',
    slug: 'mirasol-residential-planned-development',
    county: 'Brunswick County',
    units: 340,
    acres: 88.8,
    status: 'import-ready',
    planningStatus: 'Planning Board public hearing',
    sourceLabel: 'Brunswick County PD-164',
    sourceUrl: 'https://www.brunswickcountync.gov/m/newsflash/Home/Detail/687?arc=1923',
  },
  {
    name: 'Whiskey Branch Townhomes and Apartments',
    slug: 'whiskey-branch-townhomes-and-apartments',
    county: 'New Hanover County',
    units: 317,
    status: 'import-ready',
    planningStatus: 'Approved',
    sourceLabel: 'New Hanover County residential projects',
    sourceUrl: 'https://www.nhcgov.com/595/Residential-Projects',
    notes: '67 attached homes plus 250 multifamily units.',
  },
  {
    name: 'Hawthorne at Headwaters',
    slug: 'hawthorne-at-headwaters',
    county: 'Pender County',
    units: 307,
    status: 'watchlist',
    planningStatus: 'Withdrawn / possible resubmittal',
    sourceLabel: 'Port City Daily',
    sourceUrl:
      'https://portcitydaily.com/local-news/2024/07/29/1700-residential-units-under-review-this-week-in-pender-county/',
  },
  {
    name: 'Swartville Residential',
    slug: 'swartville-residential',
    county: 'New Hanover County',
    units: 292,
    status: 'import-ready',
    planningStatus: 'Under review',
    sourceLabel: 'New Hanover County residential projects',
    sourceUrl: 'https://www.nhcgov.com/595/Residential-Projects',
  },
  {
    name: 'Southport Meadows Planned Development Expansion',
    slug: 'southport-meadows-planned-development-expansion',
    county: 'Brunswick County',
    units: 281,
    acres: 72.28,
    status: 'import-ready',
    planningStatus: 'Planning Board public hearing',
    sourceLabel: 'Brunswick County PD-179',
    sourceUrl: 'https://brunswickcountync.gov/m/newsflash/home/detail/361',
  },
  {
    name: 'Blue Bay Townhomes',
    slug: 'blue-bay-townhomes',
    county: 'New Hanover County',
    units: 263,
    status: 'import-ready',
    planningStatus: 'Approved',
    sourceLabel: 'New Hanover County residential projects',
    sourceUrl: 'https://www.nhcgov.com/595/Residential-Projects',
  },
]

export const importQueue = [...importQueueItems].sort((a, b) => b.units - a.units)
