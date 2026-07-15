'use client'

import {useState} from 'react'
import {downloadJson, ProjectSelector, useProjectWorkspace} from '@/components/workspace/WorkspaceTools'

type DocumentItem = {
  id: string
  title: string
  category: string
  date?: string
  url: string
  sourceName?: string
  notes?: string
}

export function DocumentsManager() {
  const workspace = useProjectWorkspace<DocumentItem[]>('documents', [])
  const [draft, setDraft] = useState<Omit<DocumentItem, 'id'>>({
    title: '',
    category: 'Official Record',
    date: '',
    url: '',
    sourceName: '',
    notes: '',
  })

  function add() {
    if (!draft.title.trim() || !draft.url.trim()) return
    const next = [{...draft, id: crypto.randomUUID()}, ...workspace.value]
    workspace.save(next)
    setDraft({title: '', category: 'Official Record', date: '', url: '', sourceName: '', notes: ''})
  }

  function remove(id: string) {
    workspace.save(workspace.value.filter((item) => item.id !== id))
  }

  return (
    <div className="space-y-6">
      <ProjectSelector projectSlug={workspace.projectSlug} setProjectSlug={workspace.setProjectSlug} onLoad={() => workspace.load()} />

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold">Add document</h2>
          <div className="mt-5 space-y-4">
            <Field label="Title" value={draft.title} onChange={(value) => setDraft({...draft, title: value})} />
            <Field label="Category" value={draft.category} onChange={(value) => setDraft({...draft, category: value})} />
            <Field label="Date" type="date" value={draft.date || ''} onChange={(value) => setDraft({...draft, date: value})} />
            <Field label="Source name" value={draft.sourceName || ''} onChange={(value) => setDraft({...draft, sourceName: value})} />
            <Field label="Official URL" value={draft.url} onChange={(value) => setDraft({...draft, url: value})} />
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Notes</span>
              <textarea value={draft.notes} onChange={(e)=>setDraft({...draft,notes:e.target.value})} className="mt-2 min-h-24 w-full rounded-lg border border-slate-300 p-3"/>
            </label>
            <button onClick={add} className="w-full rounded-lg bg-[#244f73] px-4 py-3 font-bold text-white">Add document</button>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-4">
            <div><h2 className="text-xl font-bold">Project documents</h2><p className="mt-1 text-sm text-slate-500">{workspace.value.length} saved</p></div>
            <button onClick={()=>downloadJson(`${workspace.projectSlug}-documents.json`, workspace.value)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold">Export JSON</button>
          </div>
          <div className="mt-5 space-y-3">
            {workspace.value.map((item)=>(
              <article key={item.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div><p className="text-xs font-bold uppercase tracking-wider text-[#6f8b63]">{item.category}</p><h3 className="mt-2 font-bold">{item.title}</h3><p className="mt-1 text-sm text-slate-500">{item.date || 'No date'} · {item.sourceName || 'Source not entered'}</p></div>
                  <button onClick={()=>remove(item.id)} className="text-sm font-bold text-red-700">Delete</button>
                </div>
                <a href={item.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-bold text-blue-700">Open source ↗</a>
              </article>
            ))}
            {!workspace.value.length && <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600">No documents saved for this project.</p>}
          </div>
        </section>
      </div>
    </div>
  )
}

function Field({label,value,onChange,type='text'}:{label:string;value:string;onChange:(value:string)=>void;type?:string}) {
  return <label className="block"><span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span><input type={type} value={value} onChange={(e)=>onChange(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"/></label>
}
