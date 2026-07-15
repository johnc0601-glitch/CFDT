'use client'

import Link from 'next/link'
import {useEffect, useState} from 'react'

type Config = {
  openai: boolean
  supabase: boolean
  sanity: boolean
  model: string
}

type ImportPackage = {
  project: Record<string, any>
  timeline?: any[]
  documents?: any[]
  reviewNotes?: string[]
}

export function AIProjectImporter() {
  const [files, setFiles] = useState<File[]>([])
  const [config, setConfig] = useState<Config | null>(null)
  const [data, setData] = useState<ImportPackage | null>(null)
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

  async function createProject() {
    if (!data?.project?.name) {
      setMessage('Project name is required.')
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

      setCreated(true)
      setMessage(`${data.project.name} was created successfully.`)
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

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f8b63]">
          Step 1
        </p>
        <h2 className="mt-2 text-2xl font-bold">Drop the planning documents</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          AI will identify the project, extract the main facts, prepare a summary, and build a draft timeline.
        </p>

        <label className="mt-5 block cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <span className="font-bold">Choose one or more PDFs</span>
          <span className="mt-1 block text-sm text-slate-500">
            Official plans, staff reports, traffic studies, and related records can be uploaded together.
          </span>
          <input
            className="sr-only"
            type="file"
            multiple
            accept=".pdf,application/pdf"
            onChange={(event) => {
              setFiles(Array.from(event.target.files || []))
              setData(null)
              setCreated(false)
              setMessage('')
            }}
          />
        </label>

        {files.length > 0 && (
          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">
            <strong>{files.length} file{files.length === 1 ? '' : 's'} selected</strong>
            <ul className="mt-2 space-y-1 text-slate-600">
              {files.map((file) => <li key={file.name}>• {file.name}</li>)}
            </ul>
          </div>
        )}

        <button
          type="button"
          onClick={() => void analyze()}
          disabled={!files.length || busy !== '' || !config?.openai}
          className="mt-5 rounded-lg bg-[#244f73] px-5 py-3 font-bold text-white disabled:opacity-40"
        >
          {busy === 'analyze' ? 'Analyzing documents…' : 'Analyze and prepare project'}
        </button>

        {!config?.openai && config && (
          <p className="mt-3 text-sm font-semibold text-red-700">
            OpenAI is not configured for this deployment.
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
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                <div className="rounded-lg bg-slate-100 px-3 py-2">{documentCount}<br />Documents</div>
                <div className="rounded-lg bg-slate-100 px-3 py-2">{timelineCount}<br />Milestones</div>
                <div className={`rounded-lg px-3 py-2 ${reviewNotes.length ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>
                  {reviewNotes.length}<br />Review items
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                ['name', 'Project name', 'text'],
                ['county', 'County', 'text'],
                ['caseNumber', 'Case number', 'text'],
                ['status', 'Status', 'text'],
                ['homesProposed', 'Homes proposed', 'number'],
                ['siteAcres', 'Site acres', 'number'],
                ['developer', 'Developer / applicant', 'text'],
                ['engineer', 'Engineer', 'text'],
                ['latestUpdateDate', 'Latest record date', 'date'],
              ].map(([key, label, type]) => (
                <label key={key}>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {label}
                  </span>
                  <input
                    type={type}
                    value={project[key] ?? ''}
                    onChange={(event) => updateField(
                      key,
                      type === 'number' ? Number(event.target.value) || 0 : event.target.value,
                    )}
                    className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"
                  />
                </label>
              ))}
            </div>

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

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f8b63]">
              Step 3
            </p>
            <h2 className="mt-2 text-2xl font-bold">Create the project</h2>
            <p className="mt-2 text-sm text-slate-600">
              This creates the project, timeline, and document records in Sanity. Nothing is created until you click the button.
            </p>

            {!created ? (
              <button
                type="button"
                onClick={() => void createProject()}
                disabled={busy !== '' || !config?.sanity}
                className="mt-5 rounded-lg bg-[#0b5a35] px-6 py-3 font-bold text-white disabled:opacity-40"
              >
                {busy === 'create' ? 'Creating project…' : `Create ${project.name || 'project'}`}
              </button>
            ) : (
              <div className="mt-5 rounded-xl bg-emerald-50 p-5 text-emerald-900">
                <strong>Project created.</strong>
                <p className="mt-1 text-sm">Continue to the graphics page to attach the plan sheets you already reviewed.</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href="/admin/graphics" className="rounded-lg bg-[#244f73] px-5 py-3 font-bold text-white">
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
