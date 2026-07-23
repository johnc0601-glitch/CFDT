import {NextResponse} from 'next/server'
import {sanity} from '@/lib/sanity'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const projects = await sanity.fetch<
      {name?: string; slug?: string; homesProposed?: number}[]
    >(
      `*[_type == "project" && defined(slug.current)] {
        name,
        "slug": slug.current,
        homesProposed
      }`,
      {},
      {cache: 'no-store', next: {revalidate: 0}},
    )

    return NextResponse.json({projects})
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not load import queue status.',
      },
      {status: 500},
    )
  }
}

