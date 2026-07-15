'use client'

import {useState} from 'react'
import {downloadJson, ProjectSelector} from '@/components/workspace/WorkspaceTools'

const sections=['documents','timeline-updates','traffic'] as const

export function PublishManager(){
  const [projectSlug,setProjectSlug]=useState('hilton-bluffs')
  const [bundle,setBundle]=useState<Record<string,unknown>|null>(null)

  function build(){
    const slug=projectSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-')
    const result:Record<string,unknown>={schemaVersion:'1.0',projectSlug:slug,generatedAt:new Date().toISOString()}
    for(const section of sections){
      try{result[section]=JSON.parse(localStorage.getItem(`cfdtWorkspace:${slug}:${section}`)||'null')}catch{result[section]=null}
    }
    try{result['graphics']=JSON.parse(localStorage.getItem(`cfdtGraphicsTray:${slug}`)||'[]')}catch{result['graphics']=[]}
    setBundle(result)
  }

  const ready=bundle&&sections.every((section)=>bundle[section])

  return <div className="space-y-6">
    <ProjectSelector projectSlug={projectSlug} setProjectSlug={setProjectSlug} onLoad={build}/>
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-xl font-bold">Project package readiness</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {sections.map((section)=><Status key={section} label={section} ready={Boolean(bundle?.[section])}/>)}
        <Status label="graphics" ready={Array.isArray(bundle?.graphics)&&bundle.graphics.length>0}/>
      </div>
      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
        This module creates a reviewable package. It does not publish directly to Sanity yet.
      </div>
      <div className="mt-5 flex gap-3"><button onClick={build} className="rounded-lg bg-[#244f73] px-5 py-3 font-bold text-white">Refresh package</button><button disabled={!bundle} onClick={()=>bundle&&downloadJson(`${projectSlug}-cfdt-publish-package.json`,bundle)} className="rounded-lg border border-slate-300 px-5 py-3 font-bold disabled:opacity-40">Export package</button></div>
      {bundle&&<p className={`mt-4 text-sm font-bold ${ready?'text-emerald-700':'text-amber-700'}`}>{ready?'Core sections ready for review.':'One or more core sections are still missing.'}</p>}
    </section>
  </div>
}
function Status({label,ready}:{label:string;ready:boolean}){return <div className="rounded-xl border border-slate-200 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p><p className={`mt-2 font-bold ${ready?'text-emerald-700':'text-slate-500'}`}>{ready?'Ready':'Missing'}</p></div>}
