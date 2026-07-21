'use client'

import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {useEffect, useState} from 'react'

type Config = {
  openai: boolean
  supabase: boolean
  sanity: boolean
  model: string
}

type ImportPackage = {
  packageVersion?: string
  project: Record<string, any>
  timeline?: Record<string, any>[]
  traffic?: Record<string, any>
  documents?: Record<string, any>[]
  reviewNotes?: string[]
  reviewFlags?: Record<string, any>[]
  communityConcerns?: any[]
  sourceReferences?: Record<string, any>[]
  graphicsSuggestions?: Record<string, any>[]
  parcels?: any[]
  roads?: any[]
  metrics?: Record<string, any>
}

function asRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, any>
    : null
}

function asText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function formatReviewItem(value: unknown) {
  if (typeof value === 'string') return value

  const item = asRecord(value)
  if (!item) return ''

  const prefix = item.severity ? `[${item.severity}] ` : ''
  const message = asText(item.message || item.note || item.description)
  const source = asText(item.sourceDocument || item.source)
  const page = item.sourcePage ? `, page ${item.sourcePage}` : ''

  return `${prefix}${message}${source ? ` (${source}${page})` : ''}`.trim()
}

function normalizePackage(value: unknown): ImportPackage {
  const raw = asRecord(value)
  const rawProject = asRecord(raw?.project) || asRecord(raw?.facts)

  if (!raw || !rawProject) {
    throw new Error('This file is not a CFDT package. A project object is required.')
  }

  const project = {
    ...rawProject,
    county: rawProject.county || rawProject.countyName || '',
    projectType: rawProject.projectType || rawProject.type || '',
    homesProposed: rawProject.homesProposed ?? rawProject.residentialUnits ?? 0,
    singleFamilyDetachedUnits:
      rawProject.singleFamilyDetachedUnits ?? rawProject.singleFamilyUnits ?? 0,
    singleFamilyAttachedUnits:
      rawProject.singleFamilyAttachedUnits ??
      rawProject.townhomeUnits ??
      rawProject.townhouseUnits ??
      0,
    multifamilyUnits:
      rawProject.multifamilyUnits ?? rawProject.multiFamilyUnits ?? 0,
    siteAcres: rawProject.siteAcres ?? rawProject.acreage ?? 0,
    commercialSquareFeet:
      rawProject.commercialSquareFeet ?? rawProject.commercialSqFt ?? 0,
    developer: rawProject.developer || rawProject.applicant || '',
    locationDescription: rawProject.locationDescription || rawProject.location || '',
  }

  const timeline = Array.isArray(raw.timeline)
    ? raw.timeline.map((value) => {
        const item = asRecord(value) || {}
        return {
          ...item,
          title: item.title || item.label || '',
          stageStatus: item.stageStatus || item.status || 'future',
          description: item.description || '',
        }
      })
    : []

  const reviewNotes = [
    ...(Array.isArray(raw.reviewNotes) ? raw.reviewNotes : []),
    ...(Array.isArray(raw.reviewFlags) ? raw.reviewFlags : []),
    ...(Array.isArray(raw.communityConcerns) ? raw.communityConcerns : []),
  ]
    .map(formatReviewItem)
    .filter(Boolean)

  return {
    packageVersion: asText(raw.packageVersion) || undefined,
    project,
    timeline,
    traffic: asRecord(raw.traffic) || asRecord(raw.metrics) || {},
    documents: Array.isArray(raw.documents) ? raw.documents as Record<string, any>[] : [],
    reviewNotes,
    reviewFlags: Array.isArray(raw.reviewFlags) ? raw.reviewFlags as Record<string, any>[] : [],
    communityConcerns: Array.isArray(raw.communityConcerns) ? raw.communityConcerns : [],
    sourceReferences: Array.isArray(raw.sourceReferences) ? raw.sourceReferences as Record<string, any>[] : [],
    graphicsSuggestions: Array.isArray(raw.graphicsSuggestions) ? raw.graphicsSuggestions as Record<string, any>[] : [],
    parcels: Array.isArray(raw.parcels) ? raw.parcels : [],
    roads: Array.isArray(raw.roads) ? raw.roads : [],
    metrics: asRecord(raw.metrics) || {},
  }
}

export function AIProjectImporter() {
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [config, setConfig] = useState<Config | null>(null)
  const [data, setData] = useState<ImportPackage | null>(null)
  const [source, setSource] = useState<'pdf' | 'package' | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const [created, setCreated] = useState(false)

  useEffect(() => {
    fetch('/api/importer/config')
      .then((response) => response.json())
      .then(setConfig)
      .catch(() => setConfig(null))
  }, [])

  async function analyze() {
    if (!files.length) {
      setMessage('Choose at least one planning PDF.')
      return
    }

    setBusy('analyze')
    setMessage('Reading the documents and preparing the project…')
    setCreated(false)
    setSource('pdf')

    try {
      const form = new FormData()
      files.forEach((file) => form.append('files', file))

      const response = await fetch('/api/importer/extract', {
        method: 'POST',
        body: form,
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Document analysis failed.')
      }

      setData(result.extracted)
      setJobId(result.jobId || null)
      setMessage('AI review is ready. Correct anything below, then create the project.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Document analysis failed.')
    } finally {
      setBusy('')
    }
  }

  async function importPackageFile(file: File | null) {
    if (!file) return

    setBusy('package')
    setMessage('Loading the CFDT package...')
    setCreated(false)

    try {
      const parsed = normalizePackage(JSON.parse(await file.text()))
      setData(parsed)
      setFiles([])
      setJobId(null)
      setSource('package')

      const missing = ['name', 'county', 'status', 'projectType']
        .filter((key) => !parsed.project[key])

      setMessage(
        missing.length
          ? `Package loaded. Add the missing field${missing.length === 1 ? '' : 's'} before creating the project: ${missing.join(', ')}.`
          : 'Package loaded. Review the facts and flags, then create the project.',
      )
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not read the package.')
    } finally {
      setBusy('')
    }
  }

  function updateField(key: string, value: any) {
    if (!data) return
    setData({
      ...data,
      project: {
        ...data.project,
        [key]: value,
      },
    })
  }

  function updateTimeline(index: number, key: string, value: any) {
    if (!data) return

    const timeline = [...(data.timeline || [])]
    timeline[index] = {...timeline[index], [key]: value}
    setData({...data, timeline})
  }

  async function downloadJson() {
    if (!data) return

    const filename = `${String(data.project.slug || data.project.name || 'cfdt-project')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'cfdt-project'}-reviewed.json`
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], {
      type: 'application/json',
    })

    try {
      const savePicker = (window as typeof window & {
        showSaveFilePicker?: (options: {
          suggestedName: string
          types: {
            description: string
            accept: Record<string, string[]>
          }[]
        }) => Promise<FileSystemFileHandle>
      }).showSaveFilePicker

      if (savePicker) {
        const handle = await savePicker({
          suggestedName: filename,
          types: [
            {
              description: 'JSON file',
              accept: {'application/json': ['.json']},
            },
          ],
        })
        const writable = await handle.createWritable()
        await writable.write(blob)
        await writable.close()
        setMessage(`Saved ${filename}.`)
        return
      }

      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename
      anchor.style.display = 'none'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setMessage(`Downloaded ${filename}. Check your Downloads folder.`)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setMessage('Download canceled.')
        return
      }
      setMessage(error instanceof Error ? error.message : 'Could not download the package.')
    }
  }

  async function createProject() {
    if (!data?.project?.name) {
      setMessage('Project name is required.')
      return
    }

    if (
      source === 'package' &&
      (!data.project.county || !data.project.status || !data.project.projectType)
    ) {
      setMessage('County, status, and project type are required before creating this package.')
      return
    }

    setBusy('create')
    setMessage('Creating the project in CFDT…')

    try {
      const response = await fetch('/api/importer/publish', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          package: data,
          jobId,
          destination: 'sanity',
        }),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Project creation failed.')
      }

      const publishedSlug = result.slug || data.project.slug
      const action = result.action === 'updated' ? 'updated' : 'created'
      const graphicsUrl = `/admin/graphics${publishedSlug ? `?projectSlug=${encodeURIComponent(publishedSlug)}` : ''}`

      setCreated(true)
      setMessage(`${data.project.name} was ${action}. Opening Graphics...`)
      router.push(graphicsUrl)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Project creation failed.')
    } finally {
      setBusy('')
    }
  }

  const project = data?.project || {}
  const timelineCount = data?.timeline?.length || 0
  const documentCount = data?.documents?.length || files.length
  const reviewNotes = data?.reviewNotes || []
  const sourceReferenceCount = data?.sourceReferences?.length || 0
  const graphicsSuggestionCount = data?.graphicsSuggestions?.length || 0
  const canAnalyzePdfs = Boolean(config?.openai)

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f8b63]">
          Step 1
        </p>
        <h2 className="mt-2 text-2xl font-bold">Import the project package</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Load a prepared CFDT package, review the facts, then create the project. This is the main workflow and does not require OpenAI.
        </p>

        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6">
          <p className="font-bold">Choose `cfdt-package.json`</p>
          <p className="mt-1 text-sm text-slate-500">
            This package is prepared outside the website, then reviewed here before publishing.
          </p>
          <label className="mt-3 inline-flex cursor-pointer rounded-lg border border-slate-300 bg-white px-5 py-3 font-bold">
            Choose package JSON
            <input
              className="sr-only"
              type="file"
              accept=".json,application/json"
              onChange={(event) =>
                void importPackageFile(event.target.files?.[0] || null)
              }
            />
          </label>
        </div>

        <div className="mt-6 border-t border-slate-200 pt-6">
          <p className="font-bold">Optional: analyze PDFs with AI</p>
          <p className="mt-1 text-sm text-slate-500">
            This is not the main path yet. It only works when OpenAI is configured for this deployment.
          </p>

          {canAnalyzePdfs ? (
            <label className="mt-4 block rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
              <span className="inline-flex cursor-pointer rounded-lg border border-slate-300 bg-white px-5 py-3 font-bold shadow-sm">
                Choose PDFs
              </span>
              <span className="mt-3 block text-sm text-slate-500">
                Official plans, staff reports, traffic studies, and related records can be uploaded together.
              </span>
              <input
                className="sr-only"
                type="file"
                multiple
                accept=".pdf,application/pdf"
                onChange={(event) => {
                  const selected = Array.from(event.target.files || [])
                  setFiles(selected)
                  setData(null)
                  setCreated(false)
                  setMessage('')
                }}
              />
            </label>
          ) : (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-5">
              <p className="font-bold text-amber-900">
                PDF analysis is not available yet.
              </p>
              <p className="mt-1 text-sm leading-6 text-amber-900">
                Upload the package here first. After the project exists, use Graphics to upload the PDF and choose the public plan sheets.
              </p>
              <Link
                href="/admin/graphics"
                className="mt-4 inline-flex rounded-lg bg-[#244f73] px-5 py-3 font-bold text-white"
              >
                Open Graphics PDF Upload
              </Link>
            </div>
          )}
        </div>

        {canAnalyzePdfs && files.length > 0 && (
          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">
            <strong>{files.length} file{files.length === 1 ? '' : 's'} selected</strong>
            <ul className="mt-2 space-y-1 text-slate-600">
              {files.map((file) => <li key={file.name}>• {file.name}</li>)}
            </ul>
          </div>
        )}

        {canAnalyzePdfs && (
        <button
          type="button"
          onClick={() => void analyze()}
          disabled={!files.length || busy !== '' || !canAnalyzePdfs}
          className="mt-5 rounded-lg bg-[#244f73] px-5 py-3 font-bold text-white disabled:opacity-40"
        >
          {busy === 'analyze' ? 'Analyzing documents…' : 'Analyze and prepare project'}
        </button>
        )}

        {false && !canAnalyzePdfs && config && (
          <p className="mt-3 text-sm font-semibold text-red-700">
            PDF upload is available, but AI analysis is not configured yet. Use the package upload above for now.
          </p>
        )}
      </section>

      {data && (
        <>
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f8b63]">
                  Step 2
                </p>
                <h2 className="mt-2 text-2xl font-bold">Review the project</h2>
                <p className="mt-2 text-sm text-slate-600">
                  These fields will become the public project record. Correct only what needs attention.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold md:grid-cols-5">
                <div className="rounded-lg bg-slate-100 px-3 py-2">{documentCount}<br />Documents</div>
                <div className="rounded-lg bg-slate-100 px-3 py-2">{timelineCount}<br />Milestones</div>
                <div className="rounded-lg bg-slate-100 px-3 py-2">{sourceReferenceCount}<br />Sources</div>
                <div className="rounded-lg bg-slate-100 px-3 py-2">{graphicsSuggestionCount}<br />Graphic ideas</div>
                <div className={`rounded-lg px-3 py-2 ${reviewNotes.length ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>
                  {reviewNotes.length}<br />Review items
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                ['name', 'Project name', 'text'],
                ['slug', 'Slug', 'text'],
                ['county', 'County', 'text'],
                ['caseNumber', 'Case number', 'text'],
                ['parcelIds', 'Parcel IDs', 'text'],
                ['status', 'Status', 'text'],
                ['projectType', 'Project type', 'text'],
                ['homesProposed', 'Homes proposed', 'number'],
                ['singleFamilyDetachedUnits', 'Single-family detached', 'number'],
                ['singleFamilyAttachedUnits', 'Townhomes / attached', 'number'],
                ['multifamilyUnits', 'Multifamily', 'number'],
                ['siteAcres', 'Site acres', 'number'],
                ['buildableAcres', 'Buildable acres', 'number'],
                ['developer', 'Developer / applicant', 'text'],
                ['engineer', 'Engineer', 'text'],
                ['zoning', 'Zoning', 'text'],
                ['latestUpdateDate', 'Latest record date', 'date'],
                ['nextStep', 'Next step', 'text'],
              ].map(([key, label, type]) => (
                <label key={key}>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {label}
                  </span>
                  <input
                    type={type}
                    value={key === 'parcelIds' && Array.isArray(project.parcelIds)
                      ? project.parcelIds.join(', ')
                      : project[key] ?? ''}
                    onChange={(event) => updateField(
                      key,
                      key === 'parcelIds'
                        ? event.target.value.split(/[,;\n]+/).map((value) => value.trim()).filter(Boolean)
                        : type === 'number' ? Number(event.target.value) || 0 : event.target.value,
                    )}
                    className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"
                  />
                </label>
              ))}
            </div>

            {project.gisContext && (
              <div className={`mt-5 rounded-xl border p-4 text-sm ${
                project.gisContext.status === 'verified'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-amber-200 bg-amber-50 text-amber-900'
              }`}>
                <p className="font-bold">
                  Parcel lookup: {project.gisContext.status}
                </p>
                <p className="mt-1">
                  {(project.gisContext.parcels || []).length} official parcel record(s) matched
                  {project.parcelAcres ? `, totaling ${Number(project.parcelAcres).toLocaleString()} parcel acres` : ''}.
                </p>
                {project.gisContext.unmatchedParcelIds?.length ? (
                  <p className="mt-1 font-semibold">
                    Not matched: {project.gisContext.unmatchedParcelIds.join(', ')}
                  </p>
                ) : null}
                {project.gisContext.message ? (
                  <p className="mt-2">{project.gisContext.message}</p>
                ) : null}
              </div>
            )}

            <label className="mt-5 block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Plain-English summary
              </span>
              <textarea
                value={project.summary || ''}
                onChange={(event) => updateField('summary', event.target.value)}
                className="mt-2 min-h-32 w-full rounded-lg border border-slate-300 p-3"
              />
            </label>
          </section>

          {reviewNotes.length > 0 && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <h3 className="text-lg font-bold text-amber-900">Check these items</h3>
              <ul className="mt-3 space-y-2 text-sm text-amber-900">
                {reviewNotes.map((note, index) => <li key={index}>• {note}</li>)}
              </ul>
            </section>
          )}

          {timelineCount > 0 && (
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h3 className="text-xl font-bold">Review the timeline</h3>
              <p className="mt-2 text-sm text-slate-600">
                Confirm dates, milestone wording, and the source record for each event.
              </p>
              <div className="mt-5 space-y-4">
                {(data.timeline || []).map((item, index) => (
                  <article
                    key={`${item.title || 'milestone'}-${index}`}
                    className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[1fr_160px_140px]"
                  >
                    <input
                      value={item.title || ''}
                      onChange={(event) => updateTimeline(index, 'title', event.target.value)}
                      className="h-11 rounded-lg border border-slate-300 px-3"
                      placeholder="Milestone"
                    />
                    <input
                      type="date"
                      value={item.date || ''}
                      onChange={(event) => updateTimeline(index, 'date', event.target.value)}
                      className="h-11 rounded-lg border border-slate-300 px-3"
                    />
                    <select
                      value={item.stageStatus || 'future'}
                      onChange={(event) => updateTimeline(index, 'stageStatus', event.target.value)}
                      className="h-11 rounded-lg border border-slate-300 px-3"
                    >
                      <option value="complete">Complete</option>
                      <option value="current">Current</option>
                      <option value="future">Future</option>
                    </select>
                    <textarea
                      value={item.description || ''}
                      onChange={(event) => updateTimeline(index, 'description', event.target.value)}
                      className="min-h-20 rounded-lg border border-slate-300 p-3 md:col-span-3"
                      placeholder="What happened or what comes next?"
                    />
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f8b63]">
              Step 3
            </p>
            <h2 className="mt-2 text-2xl font-bold">Create the project and choose graphics</h2>
            <p className="mt-2 text-sm text-slate-600">
              This safely creates a new project or updates the matching project, then opens Graphics.
            </p>

            <button
              type="button"
              onClick={() => void downloadJson()}
              className="mt-5 rounded-lg border border-slate-300 px-5 py-3 font-bold"
            >
              Download reviewed package
            </button>

            {!created ? (
              <button
                type="button"
                onClick={() => void createProject()}
                disabled={busy !== '' || !config?.sanity}
                className="mt-5 rounded-lg bg-[#0b5a35] px-6 py-3 font-bold text-white disabled:opacity-40"
              >
                {busy === 'create'
                  ? 'Saving project...'
                  : 'Create project and continue to graphics'}
              </button>
            ) : (
              <div className="mt-5 rounded-xl bg-emerald-50 p-5 text-emerald-900">
                <strong>Project created.</strong>
                <p className="mt-1 text-sm">Continue to the graphics page to attach the plan sheets you already reviewed.</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href={`/admin/graphics${project.slug ? `?projectSlug=${encodeURIComponent(project.slug)}` : ''}`} className="rounded-lg bg-[#244f73] px-5 py-3 font-bold text-white">
                    Continue to Graphics →
                  </Link>
                  {project.slug && (
                    <Link href={`/projects/${project.slug}`} className="rounded-lg bg-white px-5 py-3 font-bold ring-1 ring-slate-300">
                      View Project
                    </Link>
                  )}
                </div>
              </div>
            )}
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
