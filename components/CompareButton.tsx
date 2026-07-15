'use client'

import {useEffect, useState} from 'react'

export function CompareButton({projectName}: {projectName: string}) {
  const [selected, setSelected] = useState(false)

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('cfdt-compare') || '[]') as string[]
    setSelected(stored.includes(projectName))
  }, [projectName])

  function toggle() {
    const stored = JSON.parse(localStorage.getItem('cfdt-compare') || '[]') as string[]
    const next = stored.includes(projectName) ? stored.filter((name) => name !== projectName) : [...stored, projectName].slice(-4)
    localStorage.setItem('cfdt-compare', JSON.stringify(next))
    setSelected(next.includes(projectName))
  }

  return (
    <button onClick={toggle} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#142033] shadow-sm ring-1 ring-slate-200">
      {selected ? '✓ Compare' : '+ Compare'}
    </button>
  )
}
