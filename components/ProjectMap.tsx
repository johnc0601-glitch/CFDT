'use client'

import {useMemo, useState} from 'react'
import type {Project} from '@/types/project'

export function ProjectMap({projects}: {projects: Project[]}) {
  const [status, setStatus] = useState('All')
  const [county, setCounty] = useState('All')
  const statuses = useMemo(() => ['All', ...Array.from(new Set(projects.map((p) => p.status).filter(Boolean)))], [projects])
  const counties = useMemo(() => ['All', ...Array.from(new Set(projects.map((p) => p.countyName).filter(Boolean)))], [projects])
  const filtered = projects.filter((project) => (status === 'All' || project.status === status) && (county === 'All' || project.countyName === county))

  return (
    <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <div className="mb-6 grid gap-4 md:grid-cols-[1fr_220px_220px] md:items-end">
        <div>
          <h2 className="text-2xl font-semibold">Project Map</h2>
          <p className="mt-2 text-slate-600">Simple project map view. County GIS links remain the source for parcel-level mapping.</p>
        </div>
        <select value={county} onChange={(event) => setCounty(event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3">{counties.map((item) => <option key={item}>{item}</option>)}</select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3">{statuses.map((item) => <option key={item}>{item}</option>)}</select>
      </div>
      <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
        <div className="relative min-h-[460px] overflow-hidden rounded-2xl bg-[#eef3ef] ring-1 ring-slate-200">
          <div className="absolute inset-0 opacity-70">
            <div className="absolute left-[8%] top-[15%] h-44 w-72 rounded-full bg-[#dfe9d7]" />
            <div className="absolute right-[8%] top-[10%] h-56 w-56 rounded-full bg-[#cfe0e6]" />
            <div className="absolute bottom-[10%] left-[25%] h-52 w-96 rounded-full bg-[#f3ead6]" />
          </div>
          {filtered.map((project, index) => (
            <a key={project._id} href={project.slug?.current ? `/projects/${project.slug.current}` : '#'} className="absolute z-10 rounded-full bg-[#142033] px-3 py-2 text-xs font-bold text-white shadow-md" style={{left: `${15 + ((index * 21) % 70)}%`, top: `${18 + ((index * 27) % 58)}%`}}>
              {project.name}
            </a>
          ))}
          <div className="absolute bottom-4 left-4 rounded-xl bg-white/95 p-4 text-sm shadow-sm">
            <p className="font-semibold">Map-ready view</p>
            <p className="text-slate-600">Use county GIS for parcel detail.</p>
          </div>
        </div>
        <div>
          <p className="text-sm text-slate-500">Showing {filtered.length} of {projects.length} developments</p>
          <div className="mt-5 space-y-3">
            {filtered.map((project) => (
              <a key={project._id} href={project.slug?.current ? `/projects/${project.slug.current}` : '#'} className="block rounded-xl border border-slate-200 p-4 hover:bg-slate-50">
                <p className="font-semibold">{project.name}</p>
                <p className="text-sm text-slate-600">{project.status || 'Status pending'}</p>
                {project.countyName && <p className="text-xs text-slate-500">{project.countyName}</p>}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
