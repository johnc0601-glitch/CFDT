'use client'

import {useEffect, useMemo, useState} from 'react'

type UploadedProject = {
  slug: string
  name: string
}

type ManifestFile = {
  sourceName?: string
  outputName?: string
  relativePath?: string
  sizeBytes?: number
  sourcePages?: string | null
}

type ProjectManifest = {
  schemaVersion?: string
  projectName?: string
  projectSlug?: string
  generatedAt?: string
  files?: ManifestFile[]
}

type PackageData = {
  project: Record<string, any>
  timeline: Array<Record<string, any>>
  traffic: Record<string, any>
  documents: Array<Record<string, any>>
  reviewNotes: string[]
}

const expectedShape = {
  project: {
    name: '',
    slug: '',
    county: '',
    caseNumber: '',
    status: '',
    homesProposed: 0,
    siteAcres: 0,
    buildableAcres: 0,
    developer: '',
    engineer: '',
    zoning: '',
    latestUpdateDate: '',
    latestUpdate: '',
    nextStep: '',
    summary: '',
  },
  timeline: [],
  traffic: {
    tiaDate: '',
    trafficEngineer: '',
    dailyTrips: 0,
    amPeakTrips: 0,
    pmPeakTrips: 0,
    buildOutYear: 0,
    accessRoads: [],
    improvements: [],
    notes: '',
  },
  documents: [],
  reviewNotes: [],
}

function formatSize(bytes = 0) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function downloadText(filename: string, text: string, type = 'text/plain') {
  const blob = new Blob([text], {type})
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function validatePackage(value: unknown): PackageData {
  if (!value || typeof value !== 'object') {
    throw new Error('The JSON file does not contain a project package.')
  }

  const packageData = value as Partial<PackageData>

  if (!packageData.project || typeof packageData.project !== 'object') {
    throw new Error('The JSON file is missing the project object.')
  }

  if (!Array.isArray(packageData.timeline)) {
    throw new Error('The JSON file is missing the timeline array.')
  }

  if (!packageData.traffic || typeof packageData.traffic !== 'object') {
    throw new Error('The JSON file is missing the traffic object.')
  }

  if (!Array.isArray(packageData.documents)) {
    throw new Error('The JSON file is missing the documents array.')
  }

  return {
    project: packageData.project,
    timeline: packageData.timeline,
    traffic: packageData.traffic,
    documents: packageData.documents,
    reviewNotes: Array.isArray(packageData.reviewNotes)
      ? packageData.reviewNotes
      : [],
  }
}

export function ChatGPTManualImporter() {
  const [projects, setProjects] = useState<UploadedProject[]>([])
  const [selected, setSelected] = useState('')
  const [manifest, setManifest] = useState<ProjectManifest | null>(null)
  const [data, setData] = useState<PackageData | null>(null)
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    void loadProjects()
  }, [])

  async function loadProjects() {
    setMessage('')

    try {
      const response = await fetch('/api/importer/projects', {
        cache: 'no-store',
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Could not load uploaded projects.')
      }

      const nextProjects = result.projects || []
      setProjects(nextProjects)

      if (!selected && nextProjects[0]?.slug) {
        setSelected(nextProjects[0].slug)
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not load uploaded projects.',
      )
    }
  }

  async function loadManifest() {
    if (!selected) {
      setMessage('Choose an uploaded project.')
      return
    }

    setBusy('manifest')
    setMessage('Reading the project manifest…')

    try {
      const response = await fetch('/api/importer/project-manifest', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({projectSlug: selected}),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Could not load the manifest.')
      }

      setManifest(result.manifest)
      setMessage(
        `Manifest loaded. ${result.manifest?.files?.length || 0} files are listed.`,
      )
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not load the manifest.',
      )
    } finally {
      setBusy('')
    }
  }

  const prompt = useMemo(() => {
    if (!manifest) return ''

    const fileLines = (manifest.files || [])
      .map((file, index) => {
        const pages = file.sourcePages
          ? `; source pages ${file.sourcePages}`
          : ''
        return `${index + 1}. ${file.relativePath || file.outputName || file.sourceName || 'Unknown file'} (${formatSize(file.sizeBytes || 0)}${pages})`
      })
      .join('\n')

    return `You are preparing a verified CFDT development-project package from the attached public planning records.

PROJECT
Name: ${manifest.projectName || ''}
Slug: ${manifest.projectSlug || selected}

FILES EXPECTED
${fileLines}

TASK
1. Read every attached file.
2. Extract only facts supported by the files.
3. Prefer official approval records over plans, and plans over supporting material.
4. Do not average conflicting numbers.
5. Put unresolved conflicts or uncertain facts in reviewNotes.
6. Use YYYY-MM-DD for exact dates.
7. Include only timeline events directly supported by the documents.
8. A future timeline event may be included only when an official source states it is required or expected.
9. Keep the tone neutral.
10. Return only valid JSON with no markdown fences and no commentary.

REQUIRED JSON SHAPE
${JSON.stringify(expectedShape, null, 2)}

DOCUMENT RULES
- Each documents item should include: title, category, date, sourceName, storagePath.
- Use the relative path shown in FILES EXPECTED as storagePath.
- Timeline items should include: title, date, stageStatus, description, sourceDocument.
- stageStatus must be complete, current, or future.
- Mark only the most recent verified completed milestone as current.
- Use empty strings or 0 when a value is not supported.
- Do not create a project score.
`
  }, [manifest, selected])

  function copyPrompt() {
    if (!prompt) return
    void navigator.clipboard.writeText(prompt)
    setMessage('Prompt copied. Upload the project PDFs to ChatGPT and paste it.')
  }

  function downloadPrompt() {
    if (!prompt) return
    downloadText(
      `${selected || 'project'}-chatgpt-prompt.txt`,
      prompt,
    )
  }

  function downloadManifest() {
    if (!manifest) return
    downloadText(
      `${selected || 'project'}-manifest.json`,
      JSON.stringify(manifest, null, 2),
      'application/json',
    )
  }

  async function importJson(file: File | null) {
    if (!file) return

    setMessage('')

    try {
      const parsed = JSON.parse(await file.text())
      setData(validatePackage(parsed))
      setMessage('ChatGPT project JSON loaded. Review it before publishing.')
    } catch (error) {
      setData(null)
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not read the JSON file.',
      )
    }
  }

  function updateProject(key: string, value: string | number) {
    if (!data) return

    setData({
      ...data,
      project: {
        ...data.project,
        [key]: value,
      },
    })
  }

  function updateTimeline(index: number, key: string, value: string) {
    if (!data) return

    const timeline = [...data.timeline]
    timeline[index] = {
      ...timeline[index],
      [key]: value,
    }

    setData({...data, timeline})
  }

  function downloadReviewedJson() {
    if (!data) return

    downloadText(
      `${data.project.slug || selected || 'project'}-reviewed.json`,
      JSON.stringify(data, null, 2),
      'application/json',
    )
  }

  async function publish() {
    if (!data) return

    setBusy('publish')
    setMessage('Publishing reviewed project to Sanity…')

    try {
      const response = await fetch('/api/importer/publish-storage', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({package: data}),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Publish failed.')
      }

      setMessage('Published to Sanity.')
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Publish failed.',
      )
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f8b63]">
          No API processing required
        </p>
        <h2 className="mt-2 text-2xl font-bold">
          Import with ChatGPT
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Build a project-specific prompt, use your existing ChatGPT subscription
          to analyze the PDFs, then load the returned JSON here for review and publishing.
        </p>

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <select
            value={selected}
            onChange={(event) => {
              setSelected(event.target.value)
              setManifest(null)
              setData(null)
              setMessage('')
            }}
            className="h-12 min-w-72 rounded-lg border border-slate-300 px-3"
          >
            <option value="">Choose an uploaded project</option>
            {projects.map((project) => (
              <option key={project.slug} value={project.slug}>
                {project.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => void loadProjects()}
            className="rounded-lg border border-slate-300 px-5 py-3 font-bold"
          >
            Refresh projects
          </button>

          <button
            type="button"
            onClick={() => void loadManifest()}
            disabled={!selected || Boolean(busy)}
            className="rounded-lg bg-[#244f73] px-5 py-3 font-bold text-white disabled:opacity-40"
          >
            {busy === 'manifest'
              ? 'Reading manifest…'
              : 'Create ChatGPT package'}
          </button>
        </div>
      </section>

      {manifest && (
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h3 className="text-xl font-bold">Step 1 — Send to ChatGPT</h3>

          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            <strong>{manifest.projectName || selected}</strong>
            <br />
            {(manifest.files || []).length} files in the project manifest
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={copyPrompt}
              className="rounded-lg bg-[#244f73] px-5 py-3 font-bold text-white"
            >
              Copy ChatGPT prompt
            </button>

            <button
              type="button"
              onClick={downloadPrompt}
              className="rounded-lg border border-slate-300 px-5 py-3 font-bold"
            >
              Download prompt
            </button>

            <button
              type="button"
              onClick={downloadManifest}
              className="rounded-lg border border-slate-300 px-5 py-3 font-bold"
            >
              Download manifest
            </button>
          </div>

          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-950">
            Open ChatGPT, upload the split project PDFs, paste the copied prompt,
            and ask it to return the JSON as a downloadable file.
          </div>

          <details className="mt-5 rounded-xl border border-slate-200">
            <summary className="cursor-pointer p-4 font-bold">
              Preview generated prompt
            </summary>
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap border-t border-slate-200 p-4 text-xs">
              {prompt}
            </pre>
          </details>
        </section>
      )}

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-xl font-bold">
          Step 2 — Import ChatGPT JSON
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Choose the JSON file returned by ChatGPT. It stays in your browser until
          you publish or download the reviewed copy.
        </p>

        <label className="mt-5 block cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <span className="font-bold">Choose project JSON</span>
          <input
            type="file"
            accept=".json,application/json"
            className="sr-only"
            onChange={(event) =>
              void importJson(event.target.files?.[0] || null)
            }
          />
        </label>
      </section>

      {data && (
        <>
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h3 className="text-xl font-bold">
              Step 3 — Review project details
            </h3>

            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                ['name', 'Project name', 'text'],
                ['slug', 'Slug', 'text'],
                ['county', 'County', 'text'],
                ['caseNumber', 'Case number', 'text'],
                ['status', 'Status', 'text'],
                ['homesProposed', 'Homes proposed', 'number'],
                ['siteAcres', 'Site acres', 'number'],
                ['buildableAcres', 'Buildable acres', 'number'],
                ['developer', 'Developer', 'text'],
                ['engineer', 'Engineer', 'text'],
                ['zoning', 'Zoning', 'text'],
                ['latestUpdateDate', 'Latest update date', 'date'],
                ['nextStep', 'Next step', 'text'],
              ].map(([key, label, type]) => (
                <label key={key}>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {label}
                  </span>
                  <input
                    type={type}
                    value={data.project[key] ?? ''}
                    onChange={(event) =>
                      updateProject(
                        key,
                        type === 'number'
                          ? Number(event.target.value) || 0
                          : event.target.value,
                      )
                    }
                    className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"
                  />
                </label>
              ))}
            </div>

            <label className="mt-5 block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Summary
              </span>
              <textarea
                value={data.project.summary || ''}
                onChange={(event) =>
                  updateProject('summary', event.target.value)
                }
                className="mt-2 min-h-28 w-full rounded-lg border border-slate-300 p-3"
              />
            </label>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h3 className="text-xl font-bold">Verify timeline</h3>

            <div className="mt-5 space-y-4">
              {data.timeline.map((item, index) => (
                <article
                  key={`${item.title}-${index}`}
                  className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[1fr_160px_140px]"
                >
                  <input
                    value={item.title || ''}
                    onChange={(event) =>
                      updateTimeline(index, 'title', event.target.value)
                    }
                    className="h-11 rounded-lg border border-slate-300 px-3"
                  />

                  <input
                    type="date"
                    value={item.date || ''}
                    onChange={(event) =>
                      updateTimeline(index, 'date', event.target.value)
                    }
                    className="h-11 rounded-lg border border-slate-300 px-3"
                  />

                  <select
                    value={item.stageStatus || 'complete'}
                    onChange={(event) =>
                      updateTimeline(
                        index,
                        'stageStatus',
                        event.target.value,
                      )
                    }
                    className="h-11 rounded-lg border border-slate-300 px-3"
                  >
                    <option value="complete">Complete</option>
                    <option value="current">Current</option>
                    <option value="future">Future</option>
                  </select>

                  <textarea
                    value={item.description || ''}
                    onChange={(event) =>
                      updateTimeline(
                        index,
                        'description',
                        event.target.value,
                      )
                    }
                    className="min-h-20 rounded-lg border border-slate-300 p-3 md:col-span-3"
                  />
                </article>
              ))}
            </div>
          </section>

          {data.reviewNotes.length > 0 && (
            <section className="rounded-2xl border border-amber-300 bg-amber-50 p-6">
              <h3 className="font-bold text-amber-950">
                Items requiring review
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-amber-950">
                {data.reviewNotes.map((note, index) => (
                  <li key={index}>• {note}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h3 className="text-xl font-bold">
              Step 4 — Finish
            </h3>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={downloadReviewedJson}
                className="rounded-lg border border-slate-300 px-5 py-3 font-bold"
              >
                Download reviewed JSON
              </button>

              <button
                type="button"
                onClick={() => void publish()}
                disabled={Boolean(busy)}
                className="rounded-lg bg-[#244f73] px-5 py-3 font-bold text-white disabled:opacity-40"
              >
                {busy === 'publish'
                  ? 'Publishing…'
                  : 'Publish to Sanity'}
              </button>
            </div>
          </section>
        </>
      )}

      {message && (
        <div className="rounded-xl border border-slate-300 bg-white p-4 text-sm font-semibold">
          {message}
        </div>
      )}
    </div>
  )
}
