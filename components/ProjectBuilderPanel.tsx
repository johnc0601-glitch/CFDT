'use client'

import {useState} from 'react'

type ImportProject = {
  project?: {
    name?: string
    slug?: string
    county?: string
    homesProposed?: number
    status?: string
  }
  timeline?: unknown[]
  metrics?: Record<string, unknown>
  documents?: unknown[]
  sources?: unknown[]
}

export function ProjectBuilderPanel() {
  const [fileName, setFileName] = useState('')
  const [data, setData] = useState<ImportProject | null>(null)
  const [error, setError] = useState('')

  async function readFile(file?: File) {
    setError('')
    setData(null)
    setFileName(file?.name || '')
    if (!file) return

    try {
      const parsed = JSON.parse(await file.text()) as ImportProject
      if (!parsed.project?.name || !parsed.project?.county) {
        throw new Error('The package needs project.name and project.county.')
      }
      setData(parsed)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The JSON file could not be read.')
    }
  }

  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#6f8b63]">
            Data Import
          </p>
          <h2 className="mt-2 text-2xl font-semibold">CFDT Project Builder</h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            Load a standardized CFDT JSON package, review the core project fields,
            then enter or publish the verified record in Sanity.
          </p>
        </div>
        <a
          href="/templates/CFDT-project-import-template.json"
          download
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-[#244f73]"
        >
          Download template
        </a>
      </div>

      <label className="mt-6 block rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6">
        <span className="font-semibold">Choose a CFDT JSON package</span>
        <input
          className="mt-3 block w-full text-sm"
          type="file"
          accept=".json,application/json"
          onChange={(event) => readFile(event.target.files?.[0])}
        />
      </label>

      {fileName && <p className="mt-3 text-sm text-slate-500">Loaded: {fileName}</p>}
      {error && (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      {data?.project && (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <ReviewField label="Project" value={data.project.name} />
          <ReviewField label="County" value={data.project.county} />
          <ReviewField label="Homes" value={data.project.homesProposed?.toLocaleString()} />
          <ReviewField label="Status" value={data.project.status} />
          <ReviewField label="Timeline Items" value={String(data.timeline?.length || 0)} />
        </div>
      )}

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
        This review step does not publish automatically. It keeps imported data visible
        for verification before it is entered into Sanity.
      </div>
    </section>
  )
}

function ReviewField({label, value}: {label: string; value?: string}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 font-semibold">{value || 'Not entered'}</p>
    </div>
  )
}
