'use client'

import {useMemo, useState} from 'react'
import Link from 'next/link'
import type {Project} from '@/types/project'

export function HomeSearch({projects}: {projects: Project[]}) {
  const [query, setQuery] = useState('')
  const results = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return []
    return projects.filter((project) =>
      [project.name, project.developer, project.countyName, project.municipalityName, project.status, project.parcelId]
        .filter(Boolean).join(' ').toLowerCase().includes(value)
    ).slice(0, 6)
  }, [projects, query])

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
      <p className="text-xs font-bold uppercase tracking-widest text-[#6f8b63]">Search</p>
      <h2 className="mt-2 text-2xl font-semibold">Find a Development</h2>
      <div className="relative mt-5">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by project, developer, county, or parcel ID" className="w-full rounded-2xl border border-slate-200 px-5 py-4 text-lg outline-none focus:border-[#0b5a35]" />
        {query && (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
            {results.length === 0 ? <p className="p-5 text-slate-600">No matching developments.</p> : results.map((project) => (
              <Link key={project._id} href={project.slug?.current ? `/projects/${project.slug.current}` : '#'} className="block border-b border-slate-100 px-5 py-4 last:border-0 hover:bg-slate-50">
                <p className="font-semibold">{project.name}</p>
                <p className="mt-1 text-sm text-slate-500">{[project.countyName, project.status].filter(Boolean).join(' · ')}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
