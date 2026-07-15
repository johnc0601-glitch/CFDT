'use client'

import {useState} from 'react'
import {downloadJson, ProjectSelector, useProjectWorkspace} from '@/components/workspace/WorkspaceTools'

type TimelineItem = {id:string;title:string;date?:string;stageStatus:'complete'|'current'|'future';description?:string;sourceUrl?:string}
type UpdateItem = {id:string;title:string;date?:string;summary?:string;sourceName?:string;sourceType:'official'|'news';sourceUrl?:string}
type Data = {timeline: TimelineItem[]; updates: UpdateItem[]}

export function TimelineUpdatesManager() {
  const workspace = useProjectWorkspace<Data>('timeline-updates', {timeline:[],updates:[]})
  const [mode,setMode]=useState<'timeline'|'updates'>('timeline')
  const [title,setTitle]=useState('')
  const [date,setDate]=useState('')
  const [description,setDescription]=useState('')
  const [sourceUrl,setSourceUrl]=useState('')
  const [status,setStatus]=useState<'complete'|'current'|'future'>('future')
  const [sourceType,setSourceType]=useState<'official'|'news'>('official')
  const [sourceName,setSourceName]=useState('')

  function add() {
    if(!title.trim()) return
    if(mode==='timeline'){
      const item:TimelineItem={id:crypto.randomUUID(),title,date,stageStatus:status,description,sourceUrl}
      workspace.save({...workspace.value,timeline:[...workspace.value.timeline,item]})
    } else {
      const item:UpdateItem={id:crypto.randomUUID(),title,date,summary:description,sourceName,sourceType,sourceUrl}
      workspace.save({...workspace.value,updates:[item,...workspace.value.updates]})
    }
    setTitle('');setDate('');setDescription('');setSourceUrl('');setSourceName('')
  }

  function remove(kind:'timeline'|'updates',id:string){
    workspace.save({...workspace.value,[kind]:workspace.value[kind].filter((item)=>item.id!==id)})
  }

  return <div className="space-y-6">
    <ProjectSelector projectSlug={workspace.projectSlug} setProjectSlug={workspace.setProjectSlug} onLoad={()=>workspace.load()} />
    <div className="flex gap-2">
      <button onClick={()=>setMode('timeline')} className={`rounded-lg px-4 py-2 text-sm font-bold ${mode==='timeline'?'bg-[#142033] text-white':'border border-slate-300 bg-white'}`}>Timeline</button>
      <button onClick={()=>setMode('updates')} className={`rounded-lg px-4 py-2 text-sm font-bold ${mode==='updates'?'bg-[#142033] text-white':'border border-slate-300 bg-white'}`}>Updates</button>
    </div>
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-xl font-bold">Add {mode==='timeline'?'milestone':'update'}</h2>
        <div className="mt-5 space-y-4">
          <Input label="Title" value={title} setValue={setTitle}/>
          <Input label="Date" type="date" value={date} setValue={setDate}/>
          {mode==='timeline' ? (
            <label className="block"><span className="text-xs font-bold uppercase tracking-wider text-slate-500">Stage status</span><select value={status} onChange={(e)=>setStatus(e.target.value as typeof status)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"><option value="complete">Complete</option><option value="current">Current</option><option value="future">Future</option></select></label>
          ) : (
            <>
              <Input label="Source name" value={sourceName} setValue={setSourceName}/>
              <label className="block"><span className="text-xs font-bold uppercase tracking-wider text-slate-500">Source type</span><select value={sourceType} onChange={(e)=>setSourceType(e.target.value as typeof sourceType)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"><option value="official">Official</option><option value="news">News</option></select></label>
            </>
          )}
          <label className="block"><span className="text-xs font-bold uppercase tracking-wider text-slate-500">Description</span><textarea value={description} onChange={(e)=>setDescription(e.target.value)} className="mt-2 min-h-28 w-full rounded-lg border border-slate-300 p-3"/></label>
          <Input label="Source URL" value={sourceUrl} setValue={setSourceUrl}/>
          <button onClick={add} className="w-full rounded-lg bg-[#244f73] px-4 py-3 font-bold text-white">Add {mode==='timeline'?'milestone':'update'}</button>
        </div>
      </section>
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-bold">{mode==='timeline'?'Timeline':'Updates'}</h2><p className="mt-1 text-sm text-slate-500">{workspace.value[mode].length} saved</p></div><button onClick={()=>downloadJson(`${workspace.projectSlug}-${mode}.json`,workspace.value[mode])} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold">Export JSON</button></div>
        <div className="mt-5 space-y-3">
          {workspace.value[mode].map((item:any)=>(
            <article key={item.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-[#6f8b63]">{item.stageStatus || item.sourceType}</p><h3 className="mt-2 font-bold">{item.title}</h3><p className="mt-1 text-sm text-slate-500">{item.date || 'No date'}</p></div><button onClick={()=>remove(mode,item.id)} className="text-sm font-bold text-red-700">Delete</button></div>
              {(item.description||item.summary)&&<p className="mt-3 text-sm leading-6 text-slate-600">{item.description||item.summary}</p>}
            </article>
          ))}
          {!workspace.value[mode].length&&<p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600">No records saved.</p>}
        </div>
      </section>
    </div>
  </div>
}

function Input({label,value,setValue,type='text'}:{label:string;value:string;setValue:(value:string)=>void;type?:string}){return <label className="block"><span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span><input type={type} value={value} onChange={(e)=>setValue(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"/></label>}
