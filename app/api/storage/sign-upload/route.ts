import {NextResponse} from 'next/server'
import {createClient} from '@supabase/supabase-js'

export const runtime = 'nodejs'

function clean(value: string) {
  return value
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean)
    .map((part) => part.replace(/[^a-zA-Z0-9._-]+/g, '-'))
    .join('/')
}

export async function POST(request: Request) {
  try {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      return NextResponse.json(
        {error: 'Supabase server variables are missing.'},
        {status: 500},
      )
    }

    const body = await request.json()
    const projectSlug = clean(String(body.projectSlug || ''))
    const relativePath = clean(String(body.relativePath || body.filename || 'file'))

    if (!projectSlug || !relativePath) {
      return NextResponse.json(
        {error: 'Project slug and filename are required.'},
        {status: 400},
      )
    }

    const path = `${projectSlug}/${relativePath}`
    const supabase = createClient(url, key, {
      auth: {persistSession: false, autoRefreshToken: false},
    })

    const {data, error} = await supabase.storage
      .from('cfdt-project-files')
      .createSignedUploadUrl(path, {upsert: true})

    if (error) {
      return NextResponse.json({error: error.message}, {status: 500})
    }

    return NextResponse.json({path, token: data.token})
  } catch (error) {
    return NextResponse.json(
      {error: error instanceof Error ? error.message : 'Could not sign upload.'},
      {status: 500},
    )
  }
}
