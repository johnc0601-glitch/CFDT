'use client'

import {useMemo, useState} from 'react'
import type {Project} from '@/types/project'

export function MapExplorer({projects}: {projects: Project[]}) {
  const [status, setStatus] = useState('All')

  const statuses = useMemo(() => {
    return ['All', ...Array.from(new Set(projects.map((p) => p.status).filter(Boolean)))]
  }, [projects])

  const filtered = projects.filter((project) => {
    return status === 'All' || project.status === status
  })

  return (
    <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Map Explorer</h2>
          <p className="mt-2 text-slate-600">
            Early map-ready view. Real GIS basemap comes later.
          </p>
        </div>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-xl border border-slate-200 px-4 py-3"
        >
          {statuses.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
        <div className="relative min-h-[460px] overflow-hidden rounded-2xl bg-[#eef3ef] ring-1 ring-slate-200">
          <div className="absolute inset-0 opacity-60">
            <div className="absolute left-[10%] top-[20%] h-40 w-64 rounded-full bg-[#dfe9d7]" />
            <div className="absolute right-[8%] top-[12%] h-52 w-52 rounded-full bg-[#cfe0e6]" />
            <div className="absolute bottom-[12%] left-[28%] h-48 w-80 rounded-full bg-[#f3ead6]" />
          </div>

          {filtered.map((project, index) => {
            const left = 18 + ((index * 19) % 62)
            const top = 20 + ((index * 23) % 55)

            return (
              <a
                key={project._id}
                href={project.slug?.current ? `/projects/${project.slug.current}` : '#'}
                className="absolute z-10 rounded-full bg-[#142033] px-3 py-2 text-xs font-bold text-white shadow-md"
                style={{left: `${left}%`, top: `${top}%`}}
              >
                {project.name}
              </a>
            )
          })}

          <div className="absolute bottom-4 left-4 rounded-xl bg-white/90 p-4 text-sm shadow-sm">
            <p className="font-semibold">Placeholder map</p>
            <p className="text-slate-600">MapLibre integration planned.</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-slate-500">
            Showing {filtered.length} of {projects.length} developments
          </p>

          <div className="mt-5 space-y-3">
            {filtered.length === 0 ? (
              <p className="text-slate-600">No developments match this filter.</p>
            ) : (
              filtered.map((project) => (
                <a
                  key={project._id}
                  href={project.slug?.current ? `/projects/${project.slug.current}` : '#'}
                  className="block rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
                >
                  <p className="font-semibold">{project.name}</p>
                  <p className="text-sm text-slate-600">{project.status || 'Status pending'}</p>
                  {project.countyName && (
                    <p className="text-xs text-slate-500">{project.countyName}</p>
                  )}
                </a>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
