import {NextResponse} from 'next/server'
import {revalidatePath} from 'next/cache'

export const runtime = 'nodejs'
export const maxDuration = 120

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

  if (!response.ok) throw new Error(await response.text())
  return (await response.json()).result
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const slug = String(body.slug || '').trim()
    const developer = String(body.developer || '').trim()

    if (!slug) {
      return NextResponse.json({error: 'Project slug is required.'}, {status: 400})
    }

    const project = await querySanity(
      `*[_type == "project" && slug.current == $slug][0]{
        _id,
        name,
        "slug": slug.current
      }`,
      {slug},
    )

    if (!project?._id) {
      return NextResponse.json(
        {error: `No project found with slug "${slug}".`},
        {status: 404},
      )
    }

    const candidates = await querySanity(
      `*[_type == "projectMedia" && (
        _id match $pattern ||
        project->slug.current == $slug ||
        !defined(project._ref)
      )]{
        _id,
        "projectRef": project._ref
      }`,
      {slug, pattern: `*${slug}*`},
    )

    const mutations: any[] = []

    for (const media of candidates || []) {
      mutations.push({
        patch: {
          id: media._id,
          set: {
            project: {_type: 'reference', _ref: project._id},
            isPublic: true,
          },
        },
      })
    }

    if (developer) {
      mutations.push({
        patch: {
          id: project._id,
          set: {developer},
        },
      })
    }

    if (!mutations.length) {
      return NextResponse.json({
        ok: true,
        repairedMedia: 0,
        developerUpdated: false,
        message: 'Nothing needed repair.',
      })
    }

    const {projectId, dataset, token} = config()
    const response = await fetch(
      `https://${projectId}.api.sanity.io/v2025-02-19/data/mutate/${encodeURIComponent(dataset)}?returnIds=true`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({mutations}),
      },
    )

    if (!response.ok) throw new Error(await response.text())

    revalidatePath(`/projects/${slug}`)
    revalidatePath('/projects/[slug]', 'page')

    return NextResponse.json({
      ok: true,
      repairedMedia: (candidates || []).length,
      developerUpdated: Boolean(developer),
      result: await response.json(),
    })
  } catch (error) {
    return NextResponse.json(
      {error: error instanceof Error ? error.message : 'Repair failed.'},
      {status: 500},
    )
  }
}
