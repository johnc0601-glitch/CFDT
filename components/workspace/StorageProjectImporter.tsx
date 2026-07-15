'use client'

import {useEffect, useMemo, useState} from 'react'

type UploadedProject = {
  slug: string
  name: string
}

type PackageData = {
  project: Record<string, any>
  timeline: Array<Record<string, any>>
  traffic: Record<string, any>
  documents: Array<Record<string, any>>
  reviewNotes: string[]
}

export function StorageProjectImporter() {
  const [projects, setProjects] = useState<UploadedProject[]>([])
  const [selected, setSelected] = useState('')
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
        throw new Error(result.error || 'Could not load projects.')
      }

      const uploadedProjects = result.projects || []
      setProjects(uploadedProjects)

      if (!selected && uploadedProjects[0]?.slug) {
        setSelected(uploadedProjects[0].slug)
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not load projects.',
      )
    }
  }

  async function extract() {
    if (!selected) {
      setMessage('Choose an uploaded project.')
      return
    }

    setBusy('extract')
    setMessage('Reading stored PDFs and extracting verified project data…')
    setData(null)

    try {
      const response = await fetch('/api/importer/extract-storage', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({projectSlug: selected}),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Extraction failed.')
      }

      setData(result.result)
      setMessage(
        `Extraction complete. ${result.fileCount} stored PDFs were reviewed.`,
      )
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Extraction failed.',
      )
    } finally {
      setBusy('')
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

  function downloadJson() {
    if (!data) return

    const blob = new Blob(
      [JSON.stringify(data, null, 2)],
      {type: 'application/json'},
    )
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')

    anchor.href = url
    anchor.download = `${data.project.slug || selected}-reviewed.json`
    anchor.click()
    URL.revokeObjectURL(url)
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

  const canPublish = useMemo(
    () => Boolean(data?.project?.name),
    [data],
  )

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f8b63]">
          Uploaded Project
        </p>
        <h2 className="mt-2 text-2xl font-bold">AI Project Importer 3.1</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Select a project already stored in Supabase. CFDT reads its manifest,
          extracts each PDF separately, merges the findings, and opens a review screen.
        </p>

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <select
            value={selected}
            onChange={(event) => {
              setSelected(event.target.value)
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
            onClick={() => void extract()}
            disabled={!selected || Boolean(busy)}
            className="rounded-lg bg-[#244f73] px-5 py-3 font-bold text-white disabled:opacity-40"
          >
            {busy === 'extract'
              ? 'Extracting…'
              : 'Extract uploaded project'}
          </button>
        </div>
      </section>

      {data && (
        <>
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h3 className="text-xl font-bold">Review project details</h3>

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

          {data.reviewNotes?.length > 0 && (
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
            <h3 className="text-xl font-bold">Finish</h3>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={downloadJson}
                className="rounded-lg border border-slate-300 px-5 py-3 font-bold"
              >
                Download reviewed JSON
              </button>

              <button
                type="button"
                onClick={() => void publish()}
                disabled={!canPublish || Boolean(busy)}
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
