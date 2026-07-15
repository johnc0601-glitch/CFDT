'use client'

import {useEffect,useRef,useState} from 'react'
import {createClient} from '@supabase/supabase-js'

type Item={id:string;file:File;relativePath:string;status:'waiting'|'uploading'|'uploaded'|'error';message?:string}
type Stored={name:string;path:string;size:number}
const slugify=(v:string)=>v.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
const size=(n:number)=>`${(n/1024/1024).toFixed(1)} MB`

export function LargeProjectUploader(){
  const folderRef=useRef<HTMLInputElement>(null)
  const [projectName,setProjectName]=useState('Hilton Bluffs')
  const [projectSlug,setProjectSlug]=useState('hilton-bluffs')
  const [files,setFiles]=useState<Item[]>([])
  const [stored,setStored]=useState<Stored[]>([])
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')

  useEffect(()=>{folderRef.current?.setAttribute('webkitdirectory','');folderRef.current?.setAttribute('directory','')},[])

  function add(list:FileList|null){
    if(!list)return
    setFiles(current=>[...current,...Array.from(list).map(file=>({
      id:crypto.randomUUID(),file,
      relativePath:(file as File & {webkitRelativePath?:string}).webkitRelativePath||file.name,
      status:'waiting' as const
    }))])
  }

  async function refresh(){
    const response=await fetch(`/api/storage/project-files?projectSlug=${encodeURIComponent(projectSlug)}`)
    const result=await response.json()
    if(!response.ok){setMessage(result.error||'Could not load files.');return}
    setStored(result.files||[])
  }

  async function upload(){
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL
    const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if(!url||!key){setMessage('Public Supabase URL or key is missing.');return}
    setBusy(true);setMessage('')
    const supabase=createClient(url,key)
    for(const item of files){
      if(item.status==='uploaded')continue
      setFiles(current=>current.map(x=>x.id===item.id?{...x,status:'uploading'}:x))
      try{
        const signResponse=await fetch('/api/storage/sign-upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({projectSlug,relativePath:item.relativePath})})
        const signed=await signResponse.json()
        if(!signResponse.ok)throw new Error(signed.error||'Could not sign upload.')
        const {error}=await supabase.storage.from('cfdt-project-files').uploadToSignedUrl(signed.path,signed.token,item.file,{contentType:item.file.type||'application/octet-stream'})
        if(error)throw error
        setFiles(current=>current.map(x=>x.id===item.id?{...x,status:'uploaded'}:x))
      }catch(error){
        setFiles(current=>current.map(x=>x.id===item.id?{...x,status:'error',message:error instanceof Error?error.message:'Upload failed.'}:x))
      }
    }
    setBusy(false);await refresh()
  }

  async function open(path:string){
    const response=await fetch('/api/storage/project-files',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path})})
    const result=await response.json()
    if(response.ok)window.open(result.url,'_blank','noopener,noreferrer');else setMessage(result.error||'Could not open file.')
  }

  return <div className="space-y-6">
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-2xl font-bold">Large Project Storage</h2>
      <p className="mt-2 text-sm text-slate-600">Upload individual files or an entire project folder directly to private Supabase Storage.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label><span className="text-xs font-bold uppercase tracking-wider text-slate-500">Project name</span><input value={projectName} onChange={e=>{setProjectName(e.target.value);setProjectSlug(slugify(e.target.value))}} className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"/></label>
        <label><span className="text-xs font-bold uppercase tracking-wider text-slate-500">Project slug</span><input value={projectSlug} onChange={e=>setProjectSlug(slugify(e.target.value))} className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"/></label>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center"><span className="font-bold">Choose files</span><input type="file" multiple className="sr-only" onChange={e=>add(e.target.files)}/></label>
        <label className="cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center"><span className="font-bold">Choose project folder</span><input ref={folderRef} type="file" multiple className="sr-only" onChange={e=>add(e.target.files)}/></label>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={upload} disabled={busy||!files.length} className="rounded-lg bg-[#244f73] px-5 py-3 font-bold text-white disabled:opacity-40">{busy?'Uploading…':`Upload ${files.length} file${files.length===1?'':'s'}`}</button>
        <button onClick={refresh} className="rounded-lg border border-slate-300 px-5 py-3 font-bold">Refresh storage</button>
        <button onClick={()=>setFiles([])} disabled={busy} className="rounded-lg border border-slate-300 px-5 py-3 font-bold">Clear selection</button>
      </div>
    </section>

    {files.length>0&&<section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h3 className="text-xl font-bold">Upload queue</h3><div className="mt-4 space-y-3">{files.map(item=><article key={item.id} className="flex justify-between gap-4 rounded-xl border border-slate-200 p-4"><div><p className="font-semibold">{item.relativePath}</p><p className="text-xs text-slate-500">{size(item.file.size)}</p>{item.message&&<p className="mt-2 text-xs font-bold text-red-700">{item.message}</p>}</div><span className="text-xs font-bold uppercase">{item.status}</span></article>)}</div></section>}

    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between"><div><h3 className="text-xl font-bold">Stored project files</h3><p className="text-sm text-slate-500">{stored.length} files</p></div><button onClick={refresh} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold">Load files</button></div>
      <div className="mt-4 space-y-3">{stored.map(file=><article key={file.path} className="flex justify-between gap-4 rounded-xl border border-slate-200 p-4"><div><p className="font-semibold">{file.name}</p><p className="text-xs text-slate-500">{size(file.size)}</p></div><button onClick={()=>open(file.path)} className="text-sm font-bold text-blue-700">Open ↗</button></article>)}</div>
    </section>

    {message&&<div className="rounded-xl border border-slate-300 bg-white p-4 text-sm font-semibold">{message}</div>}
  </div>
}
