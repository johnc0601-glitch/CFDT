'use client'

import {useEffect, useState} from 'react'

type InspectorData = {
  dataset: string
  projects: Array<any>
  selectedProject: any
  linkedMedia: Array<any>
  idMatchedMedia: Array<any>
  recentMedia: Array<any>
  typeCounts: Record<string, number>
}

export function SanityInspector() {
  const [data, setData] = useState<InspectorData | null>(null)
  const [slug, setSlug] = useState('hilton-bluffs')
  const [developer, setDeveloper] = useState('Copper Builders')
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    void inspect('hilton-bluffs')
  }, [])

  async function inspect(nextSlug = slug) {
    setBusy('inspect')
    setMessage('Inspecting Sanity records…')

    try {
      const response = await fetch(
        `/api/admin/sanity-inspector?slug=${encodeURIComponent(nextSlug)}`,
        {cache: 'no-store'},
      )
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Inspection failed.')
      setData(result)
      setMessage('Inspection complete.')
      if (result.selectedProject?.developer) {
        setDeveloper(result.selectedProject.developer)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Inspection failed.')
    } finally {
      setBusy('')
    }
  }

  async function repair() {
    setBusy('repair')
    setMessage('Repairing project references and public visibility…')

    try {
      const response = await fetch('/api/admin/sanity-repair', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({slug, developer}),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Repair failed.')

      setMessage(
        `Repair complete: ${result.repairedMedia} media record(s) linked; developer ${
          result.developerUpdated ? 'updated' : 'unchanged'
        }.`,
      )
      await inspect(slug)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Repair failed.')
    } finally {
      setBusy('')
    }
  }

  const linkedCount = data?.linkedMedia?.length || 0
  const idMatchedCount = data?.idMatchedMedia?.length || 0

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f8b63]">
          Diagnose before guessing
        </p>
        <h2 className="mt-2 text-2xl font-bold">Sanity Inspector</h2>
        <p className="mt-3 text-sm text-slate-600">
          See exactly what exists in Sanity, then repair media links and restore
          the project developer value.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <label>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Project slug
            </span>
            <select
              value={slug}
              onChange={(event) => {
                setSlug(event.target.value)
                void inspect(event.target.value)
              }}
              className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"
            >
              {(data?.projects || []).map((project) => (
                <option key={project._id} value={project.slug}>
                  {project.name} — {project.slug}
                </option>
              ))}
              {!data?.projects?.length && (
                <option value={slug}>{slug}</option>
              )}
            </select>
          </label>

          <label>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Developer
            </span>
            <input
              value={developer}
              onChange={(event) => setDeveloper(event.target.value)}
              className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"
            />
          </label>

          <button
            type="button"
            onClick={() => void inspect()}
            disabled={Boolean(busy)}
            className="self-end rounded-lg border border-slate-300 px-5 py-3 font-bold disabled:opacity-40"
          >
            Refresh
          </button>
        </div>
      </section>

      {data && (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[
              ['Projects', data.typeCounts.projects],
              ['Media', data.typeCounts.media],
              ['Public media', data.typeCounts.publicMedia],
              ['Orphan media', data.typeCounts.orphanMedia],
              ['Missing images', data.typeCounts.missingImages],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {label}
                </p>
                <p className="mt-2 text-3xl font-bold">{value ?? 0}</p>
              </div>
            ))}
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h3 className="text-xl font-bold">Selected project</h3>
            {data.selectedProject ? (
              <dl className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-xs font-bold uppercase text-slate-500">Name</dt>
                  <dd className="mt-1 font-semibold">{data.selectedProject.name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase text-slate-500">Document ID</dt>
                  <dd className="mt-1 break-all text-sm">{data.selectedProject._id}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase text-slate-500">Developer</dt>
                  <dd className="mt-1 font-semibold">
                    {data.selectedProject.developer || 'Missing'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase text-slate-500">Linked media</dt>
                  <dd className="mt-1 text-2xl font-bold">{linkedCount}</dd>
                </div>
              </dl>
            ) : (
              <p className="mt-4 text-red-700">Project not found.</p>
            )}
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h3 className="text-xl font-bold">Graphics diagnosis</h3>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className={`rounded-xl p-5 ${
                linkedCount > 0
                  ? 'bg-emerald-50 text-emerald-950'
                  : 'bg-red-50 text-red-950'
              }`}>
                <p className="text-sm font-bold">Correctly linked records</p>
                <p className="mt-2 text-3xl font-bold">{linkedCount}</p>
              </div>

              <div className={`rounded-xl p-5 ${
                idMatchedCount > linkedCount
                  ? 'bg-amber-50 text-amber-950'
                  : 'bg-slate-50'
              }`}>
                <p className="text-sm font-bold">Records matching slug in ID</p>
                <p className="mt-2 text-3xl font-bold">{idMatchedCount}</p>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="p-3">Title</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Public</th>
                    <th className="p-3">Image</th>
                    <th className="p-3">Project slug</th>
                    <th className="p-3">ID</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.idMatchedMedia || []).map((item) => (
                    <tr key={item._id} className="border-b border-slate-100">
                      <td className="p-3 font-semibold">{item.title}</td>
                      <td className="p-3">{item.category}</td>
                      <td className="p-3">{item.isPublic ? 'Yes' : 'No'}</td>
                      <td className="p-3">{item.hasImage ? 'Yes' : 'No'}</td>
                      <td className="p-3">{item.projectSlug || 'Not linked'}</td>
                      <td className="p-3 break-all text-xs">{item._id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!idMatchedCount && (
              <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-950">
                No projectMedia records containing this slug were found. The prior
                upload may have created only image assets, not media documents.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
            <h3 className="text-xl font-bold text-blue-950">Repair selected project</h3>
            <p className="mt-2 text-sm leading-6 text-blue-950">
              This links matching or orphaned projectMedia records to the selected
              project, sets them public, and writes the developer value.
            </p>
            <button
              type="button"
              onClick={() => void repair()}
              disabled={Boolean(busy) || !data.selectedProject}
              className="mt-5 rounded-lg bg-[#244f73] px-5 py-3 font-bold text-white disabled:opacity-40"
            >
              {busy === 'repair' ? 'Repairing…' : 'Repair media and developer'}
            </button>
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
