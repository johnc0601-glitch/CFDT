import {NextResponse} from 'next/server'
import {createClient} from '@supabase/supabase-js'

function client() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase server variables are missing.')
  return createClient(url, key, {
    auth: {persistSession: false, autoRefreshToken: false},
  })
}

export async function GET(request: Request) {
  try {
    const slug = new URL(request.url).searchParams.get('projectSlug') || ''
    if (!slug) {
      return NextResponse.json({error: 'Project slug is required.'}, {status: 400})
    }

    const {data, error} = await client().storage
      .from('cfdt-project-files')
      .list(slug, {limit: 1000, sortBy: {column: 'name', order: 'asc'}})

    if (error) throw error

    return NextResponse.json({
      files: (data || []).map((file) => ({
        name: file.name,
        path: `${slug}/${file.name}`,
        size: file.metadata?.size || 0,
      })),
    })
  } catch (error) {
    return NextResponse.json(
      {error: error instanceof Error ? error.message : 'Could not list files.'},
      {status: 500},
    )
  }
}
