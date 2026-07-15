import {NextResponse} from 'next/server'
import {createClient} from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function cleanSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-|-$/g, '')
}

function getClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Supabase server variables are missing.')
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const projectSlug = cleanSlug(String(body.projectSlug || ''))

    if (!projectSlug) {
      return NextResponse.json(
        {error: 'Choose an uploaded project.'},
        {status: 400},
      )
    }

    const path = `${projectSlug}/project-manifest.json`
    const {data, error} = await getClient().storage
      .from('cfdt-project-files')
      .download(path)

    if (error) {
      throw new Error(`Could not read project manifest: ${error.message}`)
    }

    const manifest = JSON.parse(await data.text())

    return NextResponse.json({
      projectSlug,
      manifest,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not load project manifest.',
      },
      {status: 500},
    )
  }
}
