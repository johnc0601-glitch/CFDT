import type {Metadata} from 'next'
import type {Project} from '@/types/project'

const SITE_NAME = 'CFDT'
const DEFAULT_DESCRIPTION =
  'Clear, source-based information about major development projects and county approval processes.'

export function projectMetadata(project: Project): Metadata {
  const title = `${project.name} | ${SITE_NAME}`
  const description =
    project.summary?.slice(0, 155) ||
    `${project.name}, a tracked development project in ${project.countyName || 'southeastern North Carolina'}.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: SITE_NAME,
      images: project.heroImageUrl ? [{url: project.heroImageUrl}] : undefined,
    },
    twitter: {
      card: project.heroImageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      images: project.heroImageUrl ? [project.heroImageUrl] : undefined,
    },
  }
}

export function countyMetadata(countyName: string): Metadata {
  const title = `${countyName} Developments | ${SITE_NAME}`
  const description = `Major development projects, approval stages, official resources, and county planning information for ${countyName}.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: SITE_NAME,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export const defaultMetadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    type: 'website',
    siteName: SITE_NAME,
  },
}
