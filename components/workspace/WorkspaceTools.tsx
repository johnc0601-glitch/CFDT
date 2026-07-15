'use client'

import {useEffect, useState} from 'react'

export type WorkspaceRecord = Record<string, unknown>

export function useProjectWorkspace<T>(section: string, initialValue: T) {
  const [projectSlug, setProjectSlug] = useState('hilton-bluffs')
  const [value, setValue] = useState<T>(initialValue)
  const [loaded, setLoaded] = useState(false)

  function key(slug = projectSlug) {
    return `cfdtWorkspace:${slug}:${section}`
  }

  function load(slug = projectSlug) {
    const normalized = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
    setProjectSlug(normalized || 'unassigned')
    try {
      const stored = localStorage.getItem(key(normalized || 'unassigned'))
      setValue(stored ? JSON.parse(stored) as T : initialValue)
    } catch {
      setValue(initialValue)
    }
    setLoaded(true)
  }

  function save(next = value) {
    localStorage.setItem(key(), JSON.stringify(next))
    setValue(next)
  }

  useEffect(() => {
    try {
      const active = localStorage.getItem('cfdtWorkspace:activeProject') || 'hilton-bluffs'
      setProjectSlug(active)
      const stored = localStorage.getItem(`cfdtWorkspace:${active}:${section}`)
      setValue(stored ? JSON.parse(stored) as T : initialValue)
    } catch {
      setValue(initialValue)
    }
    setLoaded(true)
  }, [section])

  useEffect(() => {
    if (loaded) localStorage.setItem('cfdtWorkspace:activeProject', projectSlug)
  }, [projectSlug, loaded])

  return {projectSlug, setProjectSlug, value, setValue, load, save, loaded}
}

export function ProjectSelector({
  projectSlug,
  setProjectSlug,
  onLoad,
}: {
  projectSlug: string
  setProjectSlug: (value: string) => void
  onLoad: () => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-end">
      <label className="flex-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Project slug</span>
        <input
          value={projectSlug}
          onChange={(event) => setProjectSlug(event.target.value)}
          className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3"
          placeholder="hilton-bluffs"
        />
      </label>
      <button
        type="button"
        onClick={onLoad}
        className="h-11 rounded-lg bg-[#244f73] px-5 text-sm font-bold text-white"
      >
        Load project
      </button>
    </div>
  )
}

export function WorkspaceShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f8b63]">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold">{title}</h1>
        <p className="mt-3 max-w-3xl text-slate-600">{description}</p>
      </div>
      {children}
    </section>
  )
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'})
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
