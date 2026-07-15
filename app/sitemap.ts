import type {MetadataRoute} from 'next'
import {getAllProjects} from '@/lib/queries'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const projects = await getAllProjects()

  const staticRoutes = [
    '',
    '/search',
    '/meetings',
    '/developers',
    '/counties/new-hanover',
    '/counties/pender',
    '/counties/brunswick',
  ]

  return [
    ...staticRoutes.map((route) => ({
      url: `${base}${route}`,
      changeFrequency: route === '' ? 'daily' as const : 'weekly' as const,
      priority: route === '' ? 1 : 0.7,
    })),
    ...projects.map((project) => ({
      url: `${base}/projects/${project.slug}`,
      lastModified: project.latestUpdateDate ? new Date(project.latestUpdateDate) : undefined,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}
