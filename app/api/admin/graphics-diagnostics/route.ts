import {NextResponse} from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function config() {
  const projectId =
    process.env.SANITY_PROJECT_ID ||
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID

  const dataset =
    process.env.SANITY_DATASET ||
    process.env.NEXT_PUBLIC_SANITY_DATASET ||
    'production'

  const token = process.env.SANITY_API_TOKEN

  if (!projectId) {
    throw new Error('Sanity project ID is missing.')
  }

  return {projectId, dataset, token}
}

async function querySanity(
  query: string,
  params: Record<string, unknown> = {},
) {
  const {projectId, dataset, token} = config()
  const search = new URLSearchParams({
    query,
    perspective: 'raw',
  })

  for (const [key, value] of Object.entries(params)) {
    search.set(`$${key}`, JSON.stringify(value))
  }

  const response = await fetch(
    `https://${projectId}.api.sanity.io/v2026-07-08/data/query/${encodeURIComponent(dataset)}?${search.toString()}`,
    {
      headers: token
        ? {Authorization: `Bearer ${token}`}
        : undefined,
      cache: 'no-store',
    },
  )

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return (await response.json()).result
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const slug = String(
      url.searchParams.get('slug') || 'hilton-bluffs',
    ).trim()

    const data = await querySanity(
      `{
        "projects": *[
          _type == "project" &&
          slug.current == $slug
        ]{
          _id,
          _type,
          name,
          "slug": slug.current,
          developer,
          "isDraft": _id in path("drafts.**")
        },
        "allGraphics": *[
          _type == "projectGraphic"
        ] | order(_updatedAt desc)[0...100]{
          _id,
          _type,
          _createdAt,
          _updatedAt,
          title,
          category,
          displayStatus,
          description,
          sourceDocument,
          sourcePage,
          "projectRef": project._ref,
          "projectName": project->name,
          "projectSlug": project->slug.current,
          "hasImage": defined(image.asset._ref),
          "imageRef": image.asset._ref,
          "imageUrl": image.asset->url,
          "isDraft": _id in path("drafts.**")
        },
        "matchingGraphics": *[
          _type == "projectGraphic" &&
          (
            project->slug.current == $slug ||
            project._ref in *[
              _type == "project" &&
              slug.current == $slug
            ]._id
          )
        ]{
          _id,
          title,
          category,
          displayStatus,
          "projectRef": project._ref,
          "projectSlug": project->slug.current,
          "hasImage": defined(image.asset._ref),
          "imageUrl": image.asset->url,
          "isDraft": _id in path("drafts.**")
        },
        "publicGraphics": *[
          _type == "projectGraphic" &&
          !(_id in path("drafts.**")) &&
          (
            project->slug.current == $slug ||
            project._ref in *[
              _type == "project" &&
              slug.current == $slug &&
              !(_id in path("drafts.**"))
            ]._id
          ) &&
          lower(coalesce(displayStatus, "library")) in [
            "featured",
            "library"
          ]
        ]{
          _id,
          title,
          category,
          displayStatus,
          "projectRef": project._ref,
          "projectSlug": project->slug.current,
          "hasImage": defined(image.asset._ref),
          "imageUrl": image.asset->url
        }
      }`,
      {slug},
    )

    return NextResponse.json({
      ok: true,
      checkedAt: new Date().toISOString(),
      projectId: config().projectId,
      dataset: config().dataset,
      usingToken: Boolean(config().token),
      ...data,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Graphics diagnostics failed.',
      },
      {status: 500},
    )
  }
}
