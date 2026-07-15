import {NextResponse} from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{slug: string}>
}

function getConfig() {
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

export async function GET(
  request: Request,
  {params}: Props,
) {
  try {
    const {slug} = await params
    const {projectId, dataset, token} = getConfig()

    const query = `*[
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
    ] | order(
      select(
        lower(coalesce(displayStatus, "library")) == "featured" => 0,
        1
      ) asc,
      title asc
    ) {
      _id,
      title,
      category,
      "caption": coalesce(description, caption),
      "publicDescription": coalesce(description, publicDescription),
      sourceDocument,
      sourcePage,
      displayStatus,
      "displayOrder": select(
        lower(coalesce(displayStatus, "library")) == "featured" => 0,
        1
      ),
      "imageUrl": coalesce(
        image.asset->url,
        graphic.asset->url,
        graphicImage.asset->url,
        planImage.asset->url,
        previewImage.asset->url
      ),
      "imageAlt": coalesce(
        image.alt,
        graphic.alt,
        graphicImage.alt,
        planImage.alt,
        title
      ),
      "imageRef": coalesce(
        image.asset._ref,
        graphic.asset._ref,
        graphicImage.asset._ref,
        planImage.asset._ref,
        previewImage.asset._ref
      )
    }`

    const search = new URLSearchParams({
      query,
      '$slug': JSON.stringify(slug),
      perspective: 'published',
    })

    const response = await fetch(
      `https://${projectId}.api.sanity.io/v2026-07-08/data/query/${encodeURIComponent(dataset)}?${search.toString()}`,
      {
        cache: 'no-store',
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
              'Cache-Control': 'no-cache',
            }
          : {
              'Cache-Control': 'no-cache',
            },
      },
    )

    if (!response.ok) {
      throw new Error(await response.text())
    }

    const result = await response.json()
    const graphics = Array.isArray(result.result)
      ? result.result
      : []

    return NextResponse.json(
      {
        ok: true,
        slug,
        count: graphics.length,
        graphics,
        checkedAt: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      },
    )
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not load project graphics.',
      },
      {status: 500},
    )
  }
}
