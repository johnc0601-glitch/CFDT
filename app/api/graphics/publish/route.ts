import {NextResponse} from 'next/server'
import {revalidatePath} from 'next/cache'

export const runtime = 'nodejs'
export const maxDuration = 120

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
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

  if (!projectId || !token) {
    throw new Error('Sanity project ID or API token is missing.')
  }

  return {projectId, dataset, token}
}

async function sanityRequest(path: string, options: RequestInit) {
  const {projectId} = getConfig()
  const response = await fetch(
    `https://${projectId}.api.sanity.io${path}`,
    options,
  )

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return response.json()
}

async function querySanity(
  query: string,
  params: Record<string, unknown> = {},
) {
  const {dataset, token} = getConfig()
  const search = new URLSearchParams({
    query,
    perspective: 'raw',
  })

  for (const [key, value] of Object.entries(params)) {
    search.set(`$${key}`, JSON.stringify(value))
  }

  return sanityRequest(
    `/v2026-07-08/data/query/${encodeURIComponent(dataset)}?${search.toString()}`,
    {
      headers: {Authorization: `Bearer ${token}`},
      cache: 'no-store',
    },
  )
}

export async function POST(request: Request) {
  try {
    const {dataset, token} = getConfig()
    const form = await request.formData()

    const projectSlug = slugify(String(form.get('projectSlug') || ''))
    const title = String(form.get('title') || '').trim()
    const category = String(form.get('category') || 'Other').trim()
    const description = String(
      form.get('publicDescription') ||
      form.get('caption') ||
      '',
    ).trim()
    const sourceDocument = String(
      form.get('sourceDocument') || '',
    ).trim()
    const sourcePage = Number(form.get('sourcePage') || 0)
    const image = form.get('image')

    if (!projectSlug || !title || !(image instanceof File)) {
      return NextResponse.json(
        {error: 'Project slug, title, and image are required.'},
        {status: 400},
      )
    }

    const projectResult = await querySanity(
      `*[
        _type == "project" &&
        slug.current == $slug &&
        !(_id in path("drafts.**"))
      ][0]{
        _id,
        name,
        "slug": slug.current
      }`,
      {slug: projectSlug},
    )

    const project = projectResult.result

    if (!project?._id) {
      return NextResponse.json(
        {error: `No published project found with slug "${projectSlug}".`},
        {status: 404},
      )
    }

    const asset = await sanityRequest(
      `/v2026-07-08/assets/images/${encodeURIComponent(dataset)}?filename=${encodeURIComponent(image.name)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': image.type || 'image/png',
        },
        body: image,
      },
    )

    const assetId = asset.document?._id
    if (!assetId) {
      throw new Error('Sanity did not return an image asset ID.')
    }

    const normalizedCategory = category.toLowerCase()
    const displayStatus =
      normalizedCategory === 'hero' ||
      normalizedCategory === 'site plan' ||
      normalizedCategory === 'overall site plan'
        ? 'featured'
        : 'library'

    const graphicId =
      `projectGraphic.${projectSlug}.` +
      `${String(sourcePage).padStart(4, '0')}.` +
      slugify(category)

    const graphicDocument = {
      _id: graphicId,
      _type: 'projectGraphic',
      title,
      category,
      description,
      sourceDocument,
      sourcePage,
      displayStatus,
      project: {
        _type: 'reference',
        _ref: project._id,
      },
      image: {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: assetId,
        },
        alt: title,
      },
    }

    const mutation = await sanityRequest(
      `/v2026-07-08/data/mutate/${encodeURIComponent(dataset)}?returnDocuments=true&visibility=sync`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mutations: [{createOrReplace: graphicDocument}],
        }),
      },
    )

    const verificationResult = await querySanity(
      `*[_id == $id][0]{
        _id,
        _type,
        title,
        category,
        displayStatus,
        "projectRef": project._ref,
        "projectSlug": project->slug.current,
        "hasImage": defined(image.asset._ref),
        "imageUrl": image.asset->url
      }`,
      {id: graphicId},
    )

    const verified = verificationResult.result

    if (
      !verified ||
      verified._type !== 'projectGraphic' ||
      verified.projectRef !== project._id ||
      verified.projectSlug !== projectSlug ||
      !verified.hasImage
    ) {
      throw new Error(
        `Sanity write could not be verified. Document ID: ${graphicId}`,
      )
    }

    revalidatePath(`/projects/${projectSlug}`)
    revalidatePath('/projects/[slug]', 'page')

    return NextResponse.json({
      ok: true,
      verified: true,
      project: {
        id: project._id,
        name: project.name,
        slug: projectSlug,
      },
      graphic: verified,
      assetId,
      mutationTransactionId: mutation.transactionId || '',
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Graphic publishing failed.',
      },
      {status: 500},
    )
  }
}
