'use client'

import {useMemo, useState} from 'react'
import type {Project} from '@/types/project'
import {DevelopmentCard} from './DevelopmentCard'

export function SearchBox({projects}: {projects: Project[]}) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')
  const [county, setCounty] = useState('All')

  const statuses = useMemo(() => ['All', ...Array.from(new Set(projects.map((p) => p.status).filter(Boolean)))], [projects])
  const counties = useMemo(() => ['All', ...Array.from(new Set(projects.map((p) => p.countyName).filter(Boolean)))], [projects])

  const filtered = projects.filter((project) => {
    const searchText = [
      project.name,
      project.status,
      project.developer,
      project.projectType,
      project.countyName,
      project.municipalityName,
      project.parcelId,
      project.engineer,
    ].filter(Boolean).join(' ').toLowerCase()

    return (
      searchText.includes(query.toLowerCase()) &&
      (status === 'All' || project.status === status) &&
      (county === 'All' || project.countyName === county)
    )
  })

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="grid gap-4 md:grid-cols-[1fr_220px_220px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search developments, developers, parcel IDs..."
          className="rounded-2xl border border-slate-200 px-5 py-4 text-lg outline-none focus:border-[#244f73]"
        />

        <select value={county} onChange={(event) => setCounty(event.target.value)} className="rounded-2xl border border-slate-200 px-5 py-4 text-lg outline-none focus:border-[#244f73]">
          {counties.map((item) => <option key={item}>{item}</option>)}
        </select>

        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-2xl border border-slate-200 px-5 py-4 text-lg outline-none focus:border-[#244f73]">
          {statuses.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>

      <p className="mt-4 text-sm text-slate-500">Showing {filtered.length} of {projects.length} developments</p>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl bg-[#f3f5f2] p-8 text-slate-600">No matching developments found.</div>
        ) : (
          filtered.map((project) => <DevelopmentCard key={project._id} project={project} />)
        )}
      </div>
    </section>
  )
}
