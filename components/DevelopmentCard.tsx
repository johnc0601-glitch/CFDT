import Link from 'next/link'
import type {Project} from '@/types/project'
import {StatusBadge} from './StatusBadge'

function thumbnailUrl(url?: string) {
  if (!url) return undefined
  if (!url.includes('cdn.sanity.io')) return url

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}w=640&h=260&fit=crop&auto=format`
}

export function DevelopmentCard({project}: {project: Project}) {
  const href = project.slug?.current ? `/projects/${project.slug.current}` : ''
  const imageUrl = thumbnailUrl(project.heroImageUrl)
  const card = (
    <div className="overflow-hidden border border-[#dce5df] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={project.heroImageAlt || project.name}
          loading="lazy"
          decoding="async"
          className="h-32 w-full object-cover"
        />
      ) : (
        <div className="h-20 bg-[#eef3ef]" />
      )}

      <div className="p-6">
        <p className="text-xs font-black uppercase tracking-[0.13em] text-[#2f8a55]">
          Development
        </p>
        <h3 className="mt-3 font-serif text-3xl font-normal leading-none text-[#10251f]">{project.name}</h3>
        <div className="mt-4">
          <StatusBadge status={project.status} />
        </div>

        <div className="mt-5 space-y-1 text-sm text-[#62756d]">
          {typeof project.homesProposed === 'number' && (
            <p>
              <strong>{project.homesProposed.toLocaleString()}</strong> homes
              proposed
            </p>
          )}
          {typeof (project.siteAcres ?? project.totalSiteAcres) ===
            'number' && (
            <p>
              <strong>
                {(project.siteAcres ?? project.totalSiteAcres)?.toLocaleString()}
              </strong>{' '}
              site acres
            </p>
          )}
          {project.developer && <p>Developer: {project.developer}</p>}
        </div>

        <p className="mt-6 font-semibold text-[#245044]">
          {href ? 'View development' : 'Project page pending'}
        </p>
      </div>
    </div>
  )

  if (!href) return card

  return (
    <Link href={href} className="block">
      {card}
    </Link>
  )
}
