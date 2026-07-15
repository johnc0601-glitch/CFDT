'use client'

import {downloadJson, useProjectWorkspace} from '@/components/workspace/WorkspaceTools'

type CountyData={countyName:string;projects:number;homesProposed:number;homesApproved:number;homesBuilt:number;homesRemaining:number;acres:number;lastUpdated:string;notes:string}

const initial:CountyData={countyName:'Pender County',projects:0,homesProposed:0,homesApproved:0,homesBuilt:0,homesRemaining:0,acres:0,lastUpdated:'',notes:''}

export function CountyDataManager(){
  const workspace=useProjectWorkspace<CountyData>('county-data',initial)
  function field<K extends keyof CountyData>(key:K,value:CountyData[K]){workspace.setValue({...workspace.value,[key]:value})}
  return <div className="space-y-6">
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Text label="County" value={workspace.value.countyName} onChange={(v)=>field('countyName',v)}/>
        <NumberField label="Projects" value={workspace.value.projects} onChange={(v)=>field('projects',v)}/>
        <NumberField label="Homes proposed" value={workspace.value.homesProposed} onChange={(v)=>field('homesProposed',v)}/>
        <NumberField label="Homes approved" value={workspace.value.homesApproved} onChange={(v)=>field('homesApproved',v)}/>
        <NumberField label="Homes built" value={workspace.value.homesBuilt} onChange={(v)=>field('homesBuilt',v)}/>
        <NumberField label="Homes remaining" value={workspace.value.homesRemaining} onChange={(v)=>field('homesRemaining',v)}/>
        <NumberField label="Tracked acreage" value={workspace.value.acres} onChange={(v)=>field('acres',v)}/>
        <Text label="Last updated" type="date" value={workspace.value.lastUpdated} onChange={(v)=>field('lastUpdated',v)}/>
      </div>
      <label className="mt-5 block"><span className="text-xs font-bold uppercase tracking-wider text-slate-500">Notes</span><textarea value={workspace.value.notes} onChange={(e)=>field('notes',e.target.value)} className="mt-2 min-h-28 w-full rounded-lg border border-slate-300 p-3"/></label>
      <div className="mt-5 flex flex-wrap gap-3"><button onClick={()=>workspace.save()} className="rounded-lg bg-[#244f73] px-5 py-3 font-bold text-white">Save county data</button><button onClick={()=>downloadJson(`${workspace.value.countyName.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-county-data.json`,workspace.value)} className="rounded-lg border border-slate-300 px-5 py-3 font-bold">Export JSON</button></div>
    </section>
  </div>
}

function Text({label,value,onChange,type='text'}:{label:string;value:string;onChange:(value:string)=>void;type?:string}){return <label><span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span><input type={type} value={value} onChange={(e)=>onChange(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"/></label>}
function NumberField({label,value,onChange}:{label:string;value:number;onChange:(value:number)=>void}){return <label><span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span><input type="number" value={value} onChange={(e)=>onChange(Number(e.target.value)||0)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"/></label>}
