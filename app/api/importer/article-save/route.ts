import {createHash} from 'crypto'
import {NextResponse} from 'next/server'
import {revalidatePath} from 'next/cache'
import {sanity} from '@/lib/sanity'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function dateOrToday(value: unknown) {
  const raw = text(value)
  const parsed = raw ? new Date(raw) : new Date()
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10)
  return parsed.toISOString().slice(0, 10)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const projectSlug = text(body.projectSlug)
    const title = text(body.title)
    const sourceUrl = text(body.url || body.sourceUrl)
    const sourceName = text(body.sourceName)
    const summary = text(body.summary)

    if (!projectSlug || !title || !sourceUrl) {
      return NextResponse.json(
        {error: 'Project slug, title, and article URL are required.'},
        {status: 400},
      )
    }

    const project = await sanity.fetch<{_id?: string; name?: string} | null>(
      `*[_type == "project" && slug.current == $slug][0]{
        _id,
        name
      }`,
      {slug: projectSlug},
      {cache: 'no-store', next: {revalidate: 0}},
    )

    if (!project?._id) {
      return NextResponse.json({error: 'Project not found.'}, {status: 404})
    }

    const existing = await sanity.fetch<{_id?: string} | null>(
      `*[_type == "projectUpdate" && project._ref == $projectId && sourceUrl == $sourceUrl][0]{
        _id
      }`,
      {projectId: project._id, sourceUrl},
      {cache: 'no-store', next: {revalidate: 0}},
    )

    if (existing?._id) {
      return NextResponse.json({ok: true, action: 'exists', id: existing._id})
    }

    const idSuffix = createHash('sha1')
      .update(`${projectSlug}:${sourceUrl}`)
      .digest('hex')
      .slice(0, 16)

    const result = await sanity.create({
      _id: `projectUpdate.article.${idSuffix}`,
      _type: 'projectUpdate',
      title,
      date: dateOrToday(body.publishedAt),
      summary,
      sourceUrl,
      sourceName: sourceName || 'News coverage',
      sourceType: 'news',
      isFeatured: false,
      project: {
        _type: 'reference',
        _ref: project._id,
      },
    })

    revalidatePath(`/projects/${projectSlug}`)
    revalidatePath('/projects/[slug]', 'page')
    revalidatePath('/')

    return NextResponse.json({ok: true, action: 'created', id: result._id})
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not save article.',
      },
      {status: 500},
    )
  }
}

