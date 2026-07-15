'use client'

import {useState} from 'react'

type Tab = {
  label: string
  content: React.ReactNode
}

export function Tabs({tabs, initialTab}: {tabs: Tab[]; initialTab?: string}) {
  const [active, setActive] = useState(initialTab || tabs[0]?.label)

  return (
    <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 p-3">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActive(tab.label)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              active === tab.label ? 'bg-[#142033] text-white' : 'bg-[#f3f5f2] text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6 md:p-8">
        {tabs.find((tab) => tab.label === active)?.content}
      </div>
    </section>
  )
}
