import {NextResponse} from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function config() {
  const projectId = process.env.SANITY_PROJECT_ID
  const dataset = process.env.SANITY_DATASET || 'production'
  const token = process.env.SANITY_API_TOKEN

  if (!projectId || !token) {
    throw new Error('Sanity project ID or API token is missing.')
  }

  return {projectId, dataset, token}
}

async function querySanity(query: string, params: Record<string, unknown> = {}) {
  const {projectId, dataset, token} = config()
  const search = new URLSearchParams({query})

  for (const [key, value] of Object.entries(params)) {
    search.set(`$${key}`, JSON.stringify(value))
  }

  const response = await fetch(
    `https://${projectId}.api.sanity.io/v2025-02-19/data/query/${encodeURIComponent(dataset)}?${search.toString()}`,
    {
      headers: {Authorization: `Bearer ${token}`},
      cache: 'no-store',
    },
  )

  if (!response.ok) {
    throw new Error(await response.text())
  }

  const data = await response.json()
  return data.result
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const slug = String(url.searchParams.get('slug') || '').trim()

    const projects = await querySanity(
      `*[_type == "project"] | order(name asc) {
        _id,
        _type,
        name,
        "slug": slug.current,
        developer,
        developerWebsite,
        developerStatus,
        status,
        homesProposed
      }`,
    )

    const selectedProject = slug
      ? await querySanity(
          `*[_type == "project" && slug.current == $slug][0] {
            _id,
            _type,
            name,
            "slug": slug.current,
            developer,
            developerWebsite,
            developerStatus,
            status,
            homesProposed
          }`,
          {slug},
        )
      : null

    const linkedMedia = slug
      ? await querySanity(
          `*[_type == "projectMedia" && project->slug.current == $slug] | order(displayOrder asc, title asc) {
            _id,
            _type,
            title,
            category,
            isPublic,
            displayOrder,
            sourcePage,
            "projectRef": project._ref,
            "projectSlug": project->slug.current,
            "hasImage": defined(image.asset._ref),
            "assetRef": image.asset._ref,
            "imageUrl": image.asset->url
          }`,
          {slug},
        )
      : []

    const idMatchedMedia = slug
      ? await querySanity(
          `*[_type == "projectMedia" && _id match $pattern] | order(displayOrder asc, title asc) {
            _id,
            _type,
            title,
            category,
            isPublic,
            displayOrder,
            sourcePage,
            "projectRef": project._ref,
            "projectSlug": project->slug.current,
            "hasImage": defined(image.asset._ref),
            "assetRef": image.asset._ref,
            "imageUrl": image.asset->url
          }`,
          {pattern: `*${slug}*`},
        )
      : []

    const recentMedia = await querySanity(
      `*[_type == "projectMedia"] | order(_updatedAt desc)[0...25] {
        _id,
        _updatedAt,
        title,
        category,
        isPublic,
        "projectRef": project._ref,
        "projectName": project->name,
        "projectSlug": project->slug.current,
        "hasImage": defined(image.asset._ref),
        "assetRef": image.asset._ref
      }`,
    )

    const typeCounts = await querySanity(
      `{
        "projects": count(*[_type == "project"]),
        "media": count(*[_type == "projectMedia"]),
        "publicMedia": count(*[_type == "projectMedia" && isPublic == true]),
        "orphanMedia": count(*[_type == "projectMedia" && !defined(project._ref)]),
        "missingImages": count(*[_type == "projectMedia" && !defined(image.asset._ref)])
      }`,
    )

    return NextResponse.json({
      ok: true,
      dataset: config().dataset,
      projects,
      selectedProject,
      linkedMedia,
      idMatchedMedia,
      recentMedia,
      typeCounts,
    })
  } catch (error) {
    return NextResponse.json(
      {error: error instanceof Error ? error.message : 'Inspection failed.'},
      {status: 500},
    )
  }
}
