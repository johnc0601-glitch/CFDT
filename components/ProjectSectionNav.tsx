'use client'

const sections = [
  ['summary', 'Summary'],
  ['facts', 'Project Facts'],
  ['status', 'Current Status'],
  ['timeline', 'Timeline'],
  ['graphics', 'Graphics'],
  ['documents', 'Documents'],
  ['meetings', 'Meetings'],
  ['resources', 'Resources'],
]

export function ProjectSectionNav() {
  return (
    <nav className="sticky top-[73px] z-40 overflow-x-auto rounded-2xl bg-white/95 p-3 shadow-sm ring-1 ring-slate-200 backdrop-blur">
      <div className="flex min-w-max gap-2">
        {sections.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-[#eef6ee] hover:text-[#0b5a35]"
          >
            {label}
          </a>
        ))}
      </div>
    </nav>
  )
}
