import {NextResponse} from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const projectId = process.env.SANITY_PROJECT_ID
    const dataset = process.env.SANITY_DATASET || 'production'
    const token = process.env.SANITY_API_TOKEN

    if (!projectId || !token) {
      return NextResponse.json(
        {error: 'Sanity project ID or API token is missing.'},
        {status: 500},
      )
    }

    const query = `*[_type == "project" && defined(slug.current)] | order(name asc) {
      "id": _id,
      name,
      "slug": slug.current
    }`

    const params = new URLSearchParams({query})
    const response = await fetch(
      `https://${projectId}.api.sanity.io/v2025-02-19/data/query/${encodeURIComponent(dataset)}?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      },
    )

    if (!response.ok) {
      throw new Error(await response.text())
    }

    const result = await response.json()

    return NextResponse.json({
      projects: Array.isArray(result.result)
        ? result.result
        : [],
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not list Sanity projects.',
      },
      {status: 500},
    )
  }
}
