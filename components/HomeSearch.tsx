'use client'

import {useMemo, useState} from 'react'
import Link from 'next/link'
import type {Project} from '@/types/project'

export function HomeSearch({projects}: {projects: Project[]}) {
  const [query, setQuery] = useState('')
  const results = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return []
    return projects
      .filter((project) => project.slug?.current)
      .filter((project) =>
        [
          project.name,
          project.developer,
          project.countyName,
          project.municipalityName,
          project.status,
          project.parcelId,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(value),
      )
      .slice(0, 6)
  }, [projects, query])

  return (
    <section className="border border-[#dce5df] bg-white p-6 shadow-sm md:p-8">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#2f8a55]">
        Search
      </p>
      <h2 className="mt-2 font-serif text-4xl font-normal leading-none text-[#10251f]">
        Find a Development
      </h2>
      <div className="relative mt-5">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by project, developer, county, or parcel ID"
          className="w-full border border-[#dce5df] px-5 py-4 text-lg outline-none focus:border-[#2f8a55]"
        />
        {query && (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden bg-white shadow-xl ring-1 ring-[#dce5df]">
            {results.length === 0 ? (
              <p className="p-5 text-[#62756d]">No matching developments.</p>
            ) : (
              results.map((project) => (
                <Link
                  key={project._id}
                  href={
                    project.slug?.current
                      ? `/projects/${project.slug.current}`
                      : '#'
                  }
                  className="block border-b border-[#edf1ee] px-5 py-4 last:border-0 hover:bg-[#f5f7f3]"
                >
                  <p className="font-semibold">{project.name}</p>
                  <p className="mt-1 text-sm text-[#62756d]">
                    {[project.countyName, project.status].filter(Boolean).join(' / ')}
                  </p>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  )
}
