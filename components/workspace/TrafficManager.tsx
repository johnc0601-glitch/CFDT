'use client'

import {downloadJson, ProjectSelector, useProjectWorkspace} from '@/components/workspace/WorkspaceTools'

type TrafficData={tiaDate:string;trafficEngineer:string;dailyTrips:number;amPeakTrips:number;pmPeakTrips:number;buildOutYear:number;accessRoads:string;improvements:string;notes:string}
const initial:TrafficData={tiaDate:'',trafficEngineer:'',dailyTrips:0,amPeakTrips:0,pmPeakTrips:0,buildOutYear:0,accessRoads:'',improvements:'',notes:''}

export function TrafficManager(){
  const workspace=useProjectWorkspace<TrafficData>('traffic',initial)
  const update=<K extends keyof TrafficData>(key:K,value:TrafficData[K])=>workspace.setValue({...workspace.value,[key]:value})
  return <div className="space-y-6">
    <ProjectSelector projectSlug={workspace.projectSlug} setProjectSlug={workspace.setProjectSlug} onLoad={()=>workspace.load()}/>
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Text label="TIA date" type="date" value={workspace.value.tiaDate} onChange={(v)=>update('tiaDate',v)}/>
        <Text label="Traffic engineer" value={workspace.value.trafficEngineer} onChange={(v)=>update('trafficEngineer',v)}/>
        <NumberField label="Build-out year" value={workspace.value.buildOutYear} onChange={(v)=>update('buildOutYear',v)}/>
        <NumberField label="Daily trips" value={workspace.value.dailyTrips} onChange={(v)=>update('dailyTrips',v)}/>
        <NumberField label="AM peak trips" value={workspace.value.amPeakTrips} onChange={(v)=>update('amPeakTrips',v)}/>
        <NumberField label="PM peak trips" value={workspace.value.pmPeakTrips} onChange={(v)=>update('pmPeakTrips',v)}/>
      </div>
      <TextArea label="Access roads" value={workspace.value.accessRoads} onChange={(v)=>update('accessRoads',v)}/>
      <TextArea label="Required improvements" value={workspace.value.improvements} onChange={(v)=>update('improvements',v)}/>
      <TextArea label="Notes" value={workspace.value.notes} onChange={(v)=>update('notes',v)}/>
      <div className="mt-5 flex gap-3"><button onClick={()=>workspace.save()} className="rounded-lg bg-[#244f73] px-5 py-3 font-bold text-white">Save traffic data</button><button onClick={()=>downloadJson(`${workspace.projectSlug}-traffic.json`,workspace.value)} className="rounded-lg border border-slate-300 px-5 py-3 font-bold">Export JSON</button></div>
    </section>
  </div>
}
function Text({label,value,onChange,type='text'}:{label:string;value:string;onChange:(v:string)=>void;type?:string}){return <label><span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span><input type={type} value={value} onChange={(e)=>onChange(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"/></label>}
function NumberField({label,value,onChange}:{label:string;value:number;onChange:(v:number)=>void}){return <label><span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span><input type="number" value={value} onChange={(e)=>onChange(Number(e.target.value)||0)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"/></label>}
function TextArea({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}){return <label className="mt-5 block"><span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span><textarea value={value} onChange={(e)=>onChange(e.target.value)} className="mt-2 min-h-24 w-full rounded-lg border border-slate-300 p-3"/></label>}
