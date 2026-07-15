import {NextResponse} from 'next/server'
import {createClient} from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase server variables are missing.')

  return createClient(url, key, {
    auth: {persistSession: false, autoRefreshToken: false},
  })
}

function titleFromSlug(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export async function GET() {
  try {
    const {data, error} = await getSupabase().storage
      .from('cfdt-project-files')
      .list('', {limit: 1000, sortBy: {column: 'name', order: 'asc'}})

    if (error) throw error

    const projects = (data || [])
      .filter((item) => Boolean(item.name) && item.metadata === null)
      .map((item) => ({
        slug: item.name,
        name: titleFromSlug(item.name),
      }))

    return NextResponse.json({projects})
  } catch (error) {
    return NextResponse.json(
      {error: error instanceof Error ? error.message : 'Could not list uploaded projects.'},
      {status: 500},
    )
  }
}
