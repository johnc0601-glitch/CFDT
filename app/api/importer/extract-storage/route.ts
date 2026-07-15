import {NextResponse} from 'next/server'
import {createClient} from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 300

type PartialResult = {
  sourcePath: string
  facts: Record<string, unknown>
  timeline: Array<Record<string, unknown>>
  traffic: Record<string, unknown>
  documents: Array<Record<string, unknown>>
  reviewNotes: string[]
}

const trafficSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'tiaDate',
    'trafficEngineer',
    'dailyTrips',
    'amPeakTrips',
    'pmPeakTrips',
    'buildOutYear',
    'accessRoads',
    'improvements',
    'notes',
  ],
  properties: {
    tiaDate: {type: 'string'},
    trafficEngineer: {type: 'string'},
    dailyTrips: {type: 'number'},
    amPeakTrips: {type: 'number'},
    pmPeakTrips: {type: 'number'},
    buildOutYear: {type: 'number'},
    accessRoads: {type: 'array', items: {type: 'string'}},
    improvements: {type: 'array', items: {type: 'string'}},
    notes: {type: 'string'},
  },
}

const timelineSchema = {
  type: 'array',
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['title', 'date', 'stageStatus', 'description', 'sourceDocument'],
    properties: {
      title: {type: 'string'},
      date: {type: 'string'},
      stageStatus: {
        type: 'string',
        enum: ['complete', 'current', 'future'],
      },
      description: {type: 'string'},
      sourceDocument: {type: 'string'},
    },
  },
}

const documentsSchema = {
  type: 'array',
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['title', 'category', 'date', 'sourceName', 'storagePath'],
    properties: {
      title: {type: 'string'},
      category: {type: 'string'},
      date: {type: 'string'},
      sourceName: {type: 'string'},
      storagePath: {type: 'string'},
    },
  },
}

const factsSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'projectName',
    'county',
    'caseNumber',
    'status',
    'homesProposed',
    'siteAcres',
    'buildableAcres',
    'developer',
    'engineer',
    'zoning',
    'latestUpdateDate',
    'latestUpdate',
    'nextStep',
    'summary',
  ],
  properties: {
    projectName: {type: 'string'},
    county: {type: 'string'},
    caseNumber: {type: 'string'},
    status: {type: 'string'},
    homesProposed: {type: 'number'},
    siteAcres: {type: 'number'},
    buildableAcres: {type: 'number'},
    developer: {type: 'string'},
    engineer: {type: 'string'},
    zoning: {type: 'string'},
    latestUpdateDate: {type: 'string'},
    latestUpdate: {type: 'string'},
    nextStep: {type: 'string'},
    summary: {type: 'string'},
  },
}

const partialSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['facts', 'timeline', 'traffic', 'documents', 'reviewNotes'],
  properties: {
    facts: factsSchema,
    timeline: timelineSchema,
    traffic: trafficSchema,
    documents: documentsSchema,
    reviewNotes: {type: 'array', items: {type: 'string'}},
  },
}

const finalProjectSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'name',
    'slug',
    'county',
    'caseNumber',
    'status',
    'homesProposed',
    'siteAcres',
    'buildableAcres',
    'developer',
    'engineer',
    'zoning',
    'latestUpdateDate',
    'latestUpdate',
    'nextStep',
    'summary',
  ],
  properties: {
    name: {type: 'string'},
    slug: {type: 'string'},
    county: {type: 'string'},
    caseNumber: {type: 'string'},
    status: {type: 'string'},
    homesProposed: {type: 'number'},
    siteAcres: {type: 'number'},
    buildableAcres: {type: 'number'},
    developer: {type: 'string'},
    engineer: {type: 'string'},
    zoning: {type: 'string'},
    latestUpdateDate: {type: 'string'},
    latestUpdate: {type: 'string'},
    nextStep: {type: 'string'},
    summary: {type: 'string'},
  },
}

const finalSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['project', 'timeline', 'traffic', 'documents', 'reviewNotes'],
  properties: {
    project: finalProjectSchema,
    timeline: timelineSchema,
    traffic: trafficSchema,
    documents: documentsSchema,
    reviewNotes: {type: 'array', items: {type: 'string'}},
  },
}

function getOutputText(response: any): string {
  if (typeof response?.output_text === 'string') return response.output_text

  for (const item of response?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === 'output_text' && typeof content?.text === 'string') {
        return content.text
      }
    }
  }

  throw new Error('OpenAI returned no structured output.')
}

function cleanSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function uploadToOpenAI(file: Blob, filename: string, apiKey: string) {
  const form = new FormData()
  form.set('purpose', 'user_data')
  form.set('file', file, filename)

  const response = await fetch('https://api.openai.com/v1/files', {
    method: 'POST',
    headers: {Authorization: `Bearer ${apiKey}`},
    body: form,
  })

  if (!response.ok) {
    throw new Error(
      `OpenAI file upload failed for ${filename}: ${await response.text()}`,
    )
  }

  return response.json()
}

async function deleteOpenAIFile(fileId: string, apiKey: string) {
  try {
    await fetch(`https://api.openai.com/v1/files/${fileId}`, {
      method: 'DELETE',
      headers: {Authorization: `Bearer ${apiKey}`},
    })
  } catch {
    // Cleanup failure should not discard a successful extraction.
  }
}

async function extractOneFile(
  blob: Blob,
  storagePath: string,
  apiKey: string,
  model: string,
): Promise<PartialResult> {
  const filename = storagePath.split('/').pop() || 'project-file.pdf'
  const uploaded = await uploadToOpenAI(blob, filename, apiKey)

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: `Extract only supported facts from this public planning record.

Source storage path: ${storagePath}

Rules:
- Do not invent values.
- Use empty strings or 0 for unsupported fields.
- Use YYYY-MM-DD when an exact date is present.
- Timeline events must be directly supported by this document.
- Include a future event only when an official source explicitly states it is required or expected.
- Preserve conflicts and uncertainty in reviewNotes.
- Keep the summary neutral and concise.
- Set every document storagePath to exactly: ${storagePath}`,
              },
              {
                type: 'input_file',
                file_id: uploaded.id,
              },
            ],
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'cfdt_partial_project',
            strict: true,
            schema: partialSchema,
          },
        },
      }),
    })

    if (!response.ok) {
      throw new Error(
        `OpenAI extraction failed for ${filename}: ${await response.text()}`,
      )
    }

    const parsed = JSON.parse(getOutputText(await response.json()))
    return {
      sourcePath: storagePath,
      ...parsed,
    }
  } finally {
    await deleteOpenAIFile(uploaded.id, apiKey)
  }
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({error: 'OPENAI_API_KEY is missing.'}, {status: 500})
    }

    const {projectSlug: rawSlug} = await request.json()
    const projectSlug = cleanSlug(String(rawSlug || ''))

    if (!projectSlug) {
      return NextResponse.json(
        {error: 'Choose an uploaded project.'},
        {status: 400},
      )
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        {error: 'Supabase server variables are missing.'},
        {status: 500},
      )
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {persistSession: false, autoRefreshToken: false},
    })

    const manifestPath = `${projectSlug}/project-manifest.json`
    const {data: manifestBlob, error: manifestError} = await supabase.storage
      .from('cfdt-project-files')
      .download(manifestPath)

    if (manifestError) {
      throw new Error(
        `Could not read project manifest: ${manifestError.message}`,
      )
    }

    const manifest = JSON.parse(await manifestBlob.text())
    const storagePaths = Array.from(
      new Set(
        (manifest.files || [])
          .map(
            (item: {relativePath?: string}) =>
              `${projectSlug}/${String(item.relativePath || '')}`,
          )
          .filter((path: string) => path.toLowerCase().endsWith('.pdf')),
      ),
    ) as string[]

    if (!storagePaths.length) {
      return NextResponse.json(
        {error: 'No PDFs were found in the project manifest.'},
        {status: 400},
      )
    }

    if (storagePaths.length > 25) {
      return NextResponse.json(
        {
          error: `This project has ${storagePaths.length} PDFs. The current extraction limit is 25.`,
        },
        {status: 400},
      )
    }

    const model = process.env.OPENAI_EXTRACTION_MODEL || 'gpt-5-mini'
    const partials: PartialResult[] = []

    for (const storagePath of storagePaths) {
      const {data: blob, error} = await supabase.storage
        .from('cfdt-project-files')
        .download(storagePath)

      if (error) {
        throw new Error(`Could not download ${storagePath}: ${error.message}`)
      }

      partials.push(
        await extractOneFile(blob, storagePath, apiKey, model),
      )
    }

    const mergeResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: `Merge these verified partial extractions into one CFDT project package.

Project slug must be exactly: ${projectSlug}

Rules:
- Prefer official approval documents over plans, and plans over supporting material.
- Do not average conflicting numbers.
- Put unresolved conflicts in reviewNotes.
- Remove duplicate timeline events and duplicate documents.
- Sort timeline events chronologically when dates are known.
- Mark only the most recent verified completed milestone as current.
- Keep unsupported numeric fields at 0.
- Keep unsupported text fields empty.
- Keep storagePath values unchanged.

PARTIAL EXTRACTIONS:
${JSON.stringify(partials)}`,
              },
            ],
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'cfdt_final_project',
            strict: true,
            schema: finalSchema,
          },
        },
      }),
    })

    if (!mergeResponse.ok) {
      throw new Error(`OpenAI merge failed: ${await mergeResponse.text()}`)
    }

    const result = JSON.parse(getOutputText(await mergeResponse.json()))

    return NextResponse.json({
      ok: true,
      projectSlug,
      fileCount: storagePaths.length,
      result,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Storage extraction failed.',
      },
      {status: 500},
    )
  }
}
