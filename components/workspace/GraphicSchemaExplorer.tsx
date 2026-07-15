'use client'

import {useEffect, useState} from 'react'

export function GraphicSchemaExplorer() {
  const [slug, setSlug] = useState('hilton-bluffs')
  const [data, setData] = useState<any>(null)
  const [message, setMessage] = useState('')

  async function inspect() {
    setMessage('Inspecting live Sanity records…')

    try {
      const response = await fetch(
        `/api/admin/graphic-schema?slug=${encodeURIComponent(slug)}`,
        {cache: 'no-store'},
      )
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Inspection failed.')
      }

      setData(result)
      setMessage('Inspection complete.')
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Inspection failed.',
      )
    }
  }

  useEffect(() => {
    void inspect()
  }, [])

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f8b63]">
          Live Sanity alignment
        </p>
        <h2 className="mt-2 text-2xl font-bold">Graphic Schema Explorer</h2>

        <div className="mt-5 flex gap-3">
          <input
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            className="h-11 flex-1 rounded-lg border border-slate-300 px-3"
          />
          <button
            onClick={() => void inspect()}
            className="rounded-lg bg-[#244f73] px-5 py-3 font-bold text-white"
          >
            Inspect
          </button>
        </div>
      </section>

      {data && (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            {[
              ['Project Graphics', data.counts?.projectGraphic || 0],
              ['Legacy Project Media', data.counts?.projectMedia || 0],
              ['Image Assets', data.counts?.imageAssets || 0],
            ].map(([label, count]) => (
              <div
                key={String(label)}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
              >
                <p className="text-xs font-bold uppercase text-slate-500">
                  {label}
                </p>
                <p className="mt-2 text-3xl font-bold">{count}</p>
              </div>
            ))}
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h3 className="text-xl font-bold">Project</h3>
            <pre className="mt-4 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-white">
              {JSON.stringify(data.project, null, 2)}
            </pre>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h3 className="text-xl font-bold">
              projectGraphic documents
            </h3>
            <pre className="mt-4 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-white">
              {JSON.stringify(data.projectGraphics, null, 2)}
            </pre>
          </section>

          {data.legacyMedia?.length > 0 && (
            <section className="rounded-2xl border border-amber-300 bg-amber-50 p-6">
              <h3 className="text-xl font-bold text-amber-950">
                Legacy projectMedia records detected
              </h3>
              <pre className="mt-4 overflow-auto rounded-xl bg-white p-4 text-xs">
                {JSON.stringify(data.legacyMedia, null, 2)}
              </pre>
            </section>
          )}
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
