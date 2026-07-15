'use client'

import {useMemo, useRef, useState} from 'react'

type Decision = 'accepted' | 'skipped' | 'review'
type Confidence = 'high' | 'medium' | 'low'

type PageChoice = {
  page: number
  thumbnail: string
  category: string
  title: string
  description: string
  confidence: Confidence
  reason: string
  decision: Decision
  selected: boolean
}

type SanityProjectOption = {id: string; name: string; slug: string}

const categories = [
  'Hero', 'Location', 'Site Plan', 'Existing Conditions', 'Amenity Plan',
  'Landscape Plan', 'Utility Plan', 'Lighting Plan', 'Entrance Plan',
  'Traffic Exhibit', 'Rendering', 'Photo', 'Other',
]

const categoryRules: Array<{category: string; words: string[]}> = [
  {category: 'Traffic Exhibit', words: ['traffic', 'transportation', 'turn lane', 'circulation', 'roadway']},
  {category: 'Utility Plan', words: ['utility', 'utilities', 'water', 'sewer', 'sanitary', 'force main']},
  {category: 'Entrance Plan', words: ['entrance', 'entry', 'access', 'driveway']},
  {category: 'Amenity Plan', words: ['amenity', 'recreation', 'clubhouse', 'pool']},
  {category: 'Landscape Plan', words: ['landscape', 'buffer', 'planting', 'open space']},
  {category: 'Lighting Plan', words: ['lighting', 'photometric', 'luminaire']},
  {category: 'Existing Conditions', words: ['existing conditions', 'wetland', 'floodplain', 'survey']},
  {category: 'Location', words: ['vicinity', 'location map', 'parcel map']},
  {category: 'Rendering', words: ['rendering', 'elevation', 'perspective']},
  {category: 'Site Plan', words: ['site plan', 'overall plan', 'master plan', 'preliminary plat', 'subdivision']},
]

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function classifySheet(text: string, page: number) {
  const normalized = text.toLowerCase().replace(/\s+/g, ' ')
  let best = {category: page === 1 ? 'Hero' : 'Site Plan', score: page === 1 ? 3 : 0, reason: page === 1 ? 'First sheet is often the best project overview.' : 'No strong sheet label was found.'}

  for (const rule of categoryRules) {
    const matches = rule.words.filter((word) => normalized.includes(word))
    const score = matches.length * 4
    if (score > best.score) {
      best = {category: rule.category, score, reason: `Matched sheet text: ${matches.slice(0, 3).join(', ')}.`}
    }
  }

  const confidence: Confidence = best.score >= 8 ? 'high' : best.score >= 4 ? 'medium' : 'low'
  return {category: best.category, confidence, reason: best.reason}
}

function confidenceLabel(value: Confidence) {
  return value === 'high' ? 'High confidence' : value === 'medium' ? 'Medium confidence' : 'Needs review'
}

export function GraphicsSmartImporter() {
  const [file, setFile] = useState<File | null>(null)
  const [projectName, setProjectName] = useState('')
  const [projectSlug, setProjectSlug] = useState('')
  const [pages, setPages] = useState<PageChoice[]>([])
  const [projects, setProjects] = useState<SanityProjectOption[]>([])
  const [loading, setLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [message, setMessage] = useState('')
  const pdfRef = useRef<any>(null)

  const selected = useMemo(() => pages.filter((page) => page.selected && page.decision === 'accepted'), [pages])

  function updatePage(page: number, patch: Partial<PageChoice>) {
    setPages((current) => current.map((item) => item.page === page ? {...item, ...patch} : item))
  }

  async function loadProjects() {
    try {
      const response = await fetch('/api/graphics/projects', {cache: 'no-store'})
      const result = await response.json()
      const options = Array.isArray(result.projects) ? result.projects : []
      setProjects(options)
      return options as SanityProjectOption[]
    } catch {
      return [] as SanityProjectOption[]
    }
  }

  async function loadPdf(nextFile: File | null) {
    if (!nextFile) return
    setLoading(true)
    setMessage('Reading sheet labels and preparing recommendations…')
    setFile(nextFile)
    const initialName = nextFile.name.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ')
    setProjectName(initialName)
    setProjectSlug(slugify(initialName))
    setPages([])

    try {
      const pdfjs = await import('pdfjs-dist')
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
      const pdf = await pdfjs.getDocument({data: new Uint8Array(await nextFile.arrayBuffer())}).promise
      pdfRef.current = pdf

      const options = projects.length ? projects : await loadProjects()
      let identity = nextFile.name.toLowerCase()
      const prepared: PageChoice[] = []

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const pdfPage = await pdf.getPage(pageNumber)
        const textContent = await pdfPage.getTextContent()
        const text = textContent.items.map((item: any) => typeof item?.str === 'string' ? item.str : '').join(' ')
        if (pageNumber <= 3) identity += ` ${text.toLowerCase()}`

        const suggestion = classifySheet(text, pageNumber)
        const viewportBase = pdfPage.getViewport({scale: 1})
        const viewport = pdfPage.getViewport({scale: Math.min(0.42, 250 / viewportBase.width)})
        const canvas = document.createElement('canvas')
        canvas.width = Math.ceil(viewport.width)
        canvas.height = Math.ceil(viewport.height)
        const context = canvas.getContext('2d')
        if (context) await pdfPage.render({canvas, canvasContext: context, viewport}).promise

        const recommended = suggestion.confidence !== 'low' || pageNumber === 1
        prepared.push({
          page: pageNumber,
          thumbnail: canvas.toDataURL('image/jpeg', 0.72),
          category: suggestion.category,
          title: `${suggestion.category} — Sheet ${pageNumber}`,
          description: '',
          confidence: suggestion.confidence,
          reason: suggestion.reason,
          decision: recommended ? 'review' : 'skipped',
          selected: recommended,
        })
      }

      const match = options
        .map((option) => ({option, score: identity.includes(option.name.toLowerCase()) || identity.includes(option.slug.toLowerCase()) ? option.name.length : 0}))
        .sort((a, b) => b.score - a.score)[0]
      if (match?.score) {
        setProjectName(match.option.name)
        setProjectSlug(match.option.slug)
      }

      setPages(prepared)
      setMessage(`Reviewed ${prepared.length} sheets. Accept the useful suggestions, replace a category, or skip a sheet.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not read the PDF.')
    } finally {
      setLoading(false)
    }
  }

  async function renderHighResolution(pageNumber: number) {
    const pdfPage = await pdfRef.current.getPage(pageNumber)
    const base = pdfPage.getViewport({scale: 1})
    const viewport = pdfPage.getViewport({scale: Math.min(3, 2400 / base.width)})
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Could not create image canvas.')
    await pdfPage.render({canvas, canvasContext: context, viewport}).promise
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not create image.')), 'image/png'))
  }

  async function publishSelected() {
    if (!projectSlug || !selected.length) return
    setPublishing(true)
    try {
      for (let index = 0; index < selected.length; index += 1) {
        const item = selected[index]
        setMessage(`Publishing ${index + 1} of ${selected.length}: ${item.title}`)
        const form = new FormData()
        form.set('projectSlug', projectSlug)
        form.set('title', item.title)
        form.set('category', item.category)
        form.set('caption', item.description)
        form.set('publicDescription', item.description || `Official ${item.category.toLowerCase()} from page ${item.page}.`)
        form.set('sourceDocument', file?.name || 'Official project plan')
        form.set('sourcePage', String(item.page))
        form.set('displayOrder', String(index))
        form.set('image', await renderHighResolution(item.page), `${projectSlug}-${item.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-page-${item.page}.png`)
        const response = await fetch('/api/graphics/publish', {method: 'POST', body: form})
        const result = await response.json()
        if (!response.ok || !result.verified) throw new Error(result.error || `Could not publish page ${item.page}.`)
      }
      setMessage(`Published and verified ${selected.length} graphic${selected.length === 1 ? '' : 's'} in Sanity.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Graphics publishing failed.')
    } finally {
      setPublishing(false)
    }
  }

  return <div className="space-y-6">
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f8b63]">Smart graphics review</p>
      <h2 className="mt-2 text-2xl font-bold">Drop the plan set. Review the suggestions.</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">CFDT reads visible sheet labels, recommends useful graphics, and leaves the final choice to you.</p>
      <label className="mt-5 block cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <span className="font-bold">Choose project-plan PDF</span>
        <span className="mt-1 block text-sm text-slate-500">The PDF stays in your browser until you publish selected images.</span>
        <input type="file" accept=".pdf,application/pdf" className="sr-only" onChange={(event) => void loadPdf(event.target.files?.[0] || null)} />
      </label>
      {file && <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label><span className="text-xs font-bold uppercase tracking-wider text-slate-500">Project name</span><input value={projectName} onChange={(e) => {setProjectName(e.target.value); setProjectSlug(slugify(e.target.value))}} className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3" /></label>
        <label><span className="text-xs font-bold uppercase tracking-wider text-slate-500">Website project</span><input list="smart-projects" value={projectSlug} onChange={(e) => setProjectSlug(slugify(e.target.value))} className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3" /><datalist id="smart-projects">{projects.map((project) => <option key={project.id} value={project.slug}>{project.name}</option>)}</datalist></label>
      </div>}
    </section>

    {pages.length > 0 && <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold">AI suggestions</h2><p className="mt-2 text-sm text-slate-600">Accept, replace the category, or skip. Nothing publishes automatically.</p></div><span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold">{selected.length} accepted</span></div>
      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{pages.map((item) => <article key={item.page} className={`overflow-hidden rounded-xl border-2 ${item.decision === 'accepted' ? 'border-emerald-600' : item.decision === 'skipped' ? 'border-slate-200 opacity-70' : 'border-amber-400'}`}>
        <div className="bg-slate-100 p-2"><img src={item.thumbnail} alt={`PDF page ${item.page}`} className="mx-auto max-h-72 w-auto object-contain" /></div>
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between"><strong>Page {item.page}</strong><span className={`rounded-full px-2 py-1 text-xs font-bold ${item.confidence === 'high' ? 'bg-emerald-100 text-emerald-800' : item.confidence === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>{confidenceLabel(item.confidence)}</span></div>
          <p className="text-xs leading-5 text-slate-500">{item.reason}</p>
          <select value={item.category} onChange={(e) => updatePage(item.page, {category: e.target.value, decision: 'review', selected: true})} className="h-11 w-full rounded-lg border border-slate-300 px-3">{categories.map((category) => <option key={category}>{category}</option>)}</select>
          <input value={item.title} onChange={(e) => updatePage(item.page, {title: e.target.value})} className="h-11 w-full rounded-lg border border-slate-300 px-3" />
          {item.decision !== 'skipped' && <textarea value={item.description} onChange={(e) => updatePage(item.page, {description: e.target.value})} className="min-h-20 w-full rounded-lg border border-slate-300 p-3" placeholder="Plain-language description (optional)" />}
          <div className="grid grid-cols-3 gap-2"><button type="button" onClick={() => updatePage(item.page, {decision: 'accepted', selected: true})} className={`rounded-md px-2 py-2 text-xs font-bold ${item.decision === 'accepted' ? 'bg-emerald-600 text-white' : 'bg-slate-100'}`}>Accept</button><button type="button" onClick={() => updatePage(item.page, {decision: 'review', selected: true})} className={`rounded-md px-2 py-2 text-xs font-bold ${item.decision === 'review' ? 'bg-amber-500 text-white' : 'bg-slate-100'}`}>Replace</button><button type="button" onClick={() => updatePage(item.page, {decision: 'skipped', selected: false})} className="rounded-md bg-slate-100 px-2 py-2 text-xs font-bold">Skip</button></div>
        </div>
      </article>)}</div>
    </section>}

    {file && <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-bold">Finish</h2><p className="mt-2 text-sm text-slate-600">Only accepted graphics will be published.</p><button type="button" onClick={() => void publishSelected()} disabled={!selected.length || !projectSlug || publishing || loading} className="mt-5 rounded-lg bg-[#244f73] px-5 py-3 font-bold text-white disabled:opacity-40">{publishing ? 'Publishing…' : `Publish ${selected.length} accepted graphic${selected.length === 1 ? '' : 's'}`}</button></section>}
    {message && <div className="rounded-xl border border-slate-300 bg-white p-4 text-sm font-semibold">{message}</div>}
  </div>
}
