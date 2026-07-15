export const siteConfig = {
  name: 'Cape Fear Development Tracker',
  tagline: 'Development made easier to understand.',
  description: 'Track major development proposals, approvals, project documents, maps, photos, and official resources across the Cape Fear region.',
}

export const counties = [
  {name: 'New Hanover County', slug: 'new-hanover', href: '/counties/new-hanover', description: 'Major development activity in New Hanover County.', enabled: true, resources: []},
  {name: 'City of Wilmington', slug: 'wilmington', href: '#', description: 'Municipal projects reviewed by the City of Wilmington.', enabled: false, resources: []},
  {name: 'Brunswick County', slug: 'brunswick', href: '#', description: 'Brunswick County projects will be added as records are entered.', enabled: false, resources: []},
  {name: 'Pender County', slug: 'pender', href: '#', description: 'Pender County projects will be added as records are entered.', enabled: false, resources: []},
]

export const navigation = [
  {label: 'Home', href: '/'},
  {label: 'Search', href: '/search'},
  {label: 'Map', href: '/map'},
  {label: 'Meetings', href: '/meetings'},
  {label: 'Developers', href: '/developers'},
  {label: 'Workspace', href: '/admin'},
]
