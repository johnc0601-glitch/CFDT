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

async function query(query: string, params: Record<string, unknown> = {}) {
  const {projectId, dataset, token} = config()
  const search = new URLSearchParams({query})

  for (const [key, value] of Object.entries(params)) {
    search.set(`$${key}`, JSON.stringify(value))
  }

  const response = await fetch(
    `https://${projectId}.api.sanity.io/v2025-02-19/data/query/${encodeURIComponent(dataset)}?${search}`,
    {
      headers: {Authorization: `Bearer ${token}`},
      cache: 'no-store',
    },
  )

  if (!response.ok) throw new Error(await response.text())
  return (await response.json()).result
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const slug = url.searchParams.get('slug') || 'hilton-bluffs'

    const result = await query(
      `{
        "project": *[_type == "project" && slug.current == $slug][0]{
          _id,
          _type,
          name,
          "slug": slug.current,
          developer,
          developerWebsite,
          developerStatus
        },
        "projectGraphics": *[
          _type == "projectGraphic" &&
          project->slug.current == $slug
        ] | order(displayOrder asc){
          _id,
          _type,
          title,
          category,
          isPublic,
          publicDisplay,
          "projectRef": project._ref,
          "hasImage": defined(image.asset._ref),
          "imageUrl": image.asset->url
        },
        "legacyMedia": *[
          _type == "projectMedia" &&
          project->slug.current == $slug
        ]{
          _id,
          _type,
          title,
          category,
          isPublic,
          "projectRef": project._ref,
          "hasImage": defined(image.asset._ref)
        },
        "counts": {
          "projectGraphic": count(*[_type == "projectGraphic"]),
          "projectMedia": count(*[_type == "projectMedia"]),
          "imageAssets": count(*[_type == "sanity.imageAsset"])
        }
      }`,
      {slug},
    )

    return NextResponse.json({
      ok: true,
      dataset: config().dataset,
      ...result,
    })
  } catch (error) {
    return NextResponse.json(
      {error: error instanceof Error ? error.message : 'Inspection failed.'},
      {status: 500},
    )
  }
}
