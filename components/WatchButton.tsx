'use client'

import {useEffect, useState} from 'react'

export function WatchButton({projectName}: {projectName: string}) {
  const [watching, setWatching] = useState(false)

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('cfdt-watchlist') || '[]') as string[]
    setWatching(stored.includes(projectName))
  }, [projectName])

  function toggle() {
    const stored = JSON.parse(localStorage.getItem('cfdt-watchlist') || '[]') as string[]
    const next = stored.includes(projectName) ? stored.filter((name) => name !== projectName) : [...stored, projectName]
    localStorage.setItem('cfdt-watchlist', JSON.stringify(next))
    setWatching(next.includes(projectName))
  }

  return (
    <button onClick={toggle} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#142033] shadow-sm ring-1 ring-slate-200">
      {watching ? '★ Watching' : '☆ Watch'}
    </button>
  )
}
