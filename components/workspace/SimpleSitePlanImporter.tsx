'use client'

import {useMemo, useState} from 'react'
import {PDFDocument} from 'pdf-lib'

type SheetFile = {
  file: File
  pageCount: number
  primaryPage: number
  graphicsPages: number[]
}

type GraphicCandidate = {
  type: string
  title: string
  page: number
  sourcePage: number
  reason: string
  status: 'selected' | 'alternate' | 'rejected'
}

type PackageData = {
  project: Record<string, any>
  graphics: GraphicCandidate[]
  platMaps: GraphicCandidate[]
  reviewNotes: string[]
}

const graphicTypes = [
  'hero',
  'overall-site-plan',
  'entrance',
  'phasing',
  'traffic',
  'utilities',
  'stormwater',
  'wetlands',
  'floodplain',
  'open-space',
  'lot-layout',
  'road-section',
  'plat-map',
  'other',
]

const expectedShape = {
  project: {
    name: '',
    slug: '',
    county: '',
    caseNumber: '',
    planType: '',
    planDate: '',
    projectNumber: '',
    location: '',
    homesProposed: 0,
    siteAcres: 0,
    buildableAcres: 0,
    developer: '',
    applicant: '',
    engineer: '',
    surveyor: '',
    zoning: '',
    density: '',
    phases: [],
    accessRoads: [],
    utilities: [],
    wetlandsSummary: '',
    floodplainSummary: '',
    summary: '',
  },
  graphics: [
    {
      type: 'hero',
      title: '',
      page: 1,
      sourcePage: 1,
      reason: '',
      status: 'selected',
    },
  ],
  platMaps: [],
  reviewNotes: [],
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function downloadText(filename: string, text: string, type = 'text/plain') {
  downloadBlob(filename, new Blob([text], {type}))
}

function parsePages(value: string, maxPage: number) {
  const pages = new Set<number>()
  for (const token of value.split(',')) {
    const trimmed = token.trim()
    if (!trimmed) continue

    if (trimmed.includes('-')) {
      const [startRaw, endRaw] = trimmed.split('-', 2)
      const start = Number(startRaw)
      const end = Number(endRaw)
      if (!Number.isInteger(start) || !Number.isInteger(end)) continue
      for (let page = Math.min(start, end); page <= Math.max(start, end); page += 1) {
        if (page >= 1 && page <= maxPage) pages.add(page)
      }
    } else {
      const page = Number(trimmed)
      if (Number.isInteger(page) && page >= 1 && page <= maxPage) pages.add(page)
    }
  }
  return [...pages].sort((a, b) => a - b)
}

async function extractPages(file: File, pages: number[]) {
  const source = await PDFDocument.load(await file.arrayBuffer(), {
    updateMetadata: false,
  })
  const output = await PDFDocument.create()
  const copied = await output.copyPages(source, pages.map((page) => page - 1))
  copied.forEach((page) => output.addPage(page))
  const bytes = Uint8Array.from(await output.save({useObjectStreams: true}))
  return new Blob([bytes.buffer], {type: 'application/pdf'})
}

function validatePackage(value: unknown): PackageData {
  if (!value || typeof value !== 'object') {
    throw new Error('The JSON file does not contain a project package.')
  }

  const data = value as Partial<PackageData>
  if (!data.project || typeof data.project !== 'object') {
    throw new Error('The JSON file is missing the project object.')
  }

  const normalize = (items: unknown, prefix: string) =>
    Array.isArray(items)
      ? items.map((item: any, index) => ({
          type: String(item?.type || (prefix === 'plat' ? 'plat-map' : 'other')),
          title: String(item?.title || `${prefix} ${index + 1}`),
          page: Number(item?.page) || 1,
          sourcePage: Number(item?.sourcePage) || Number(item?.page) || 1,
          reason: String(item?.reason || ''),
          status:
            item?.status === 'alternate' || item?.status === 'rejected'
              ? item.status
              : 'selected',
        }))
      : []

  return {
    project: data.project,
    graphics: normalize(data.graphics, 'graphic'),
    platMaps: normalize(data.platMaps, 'plat'),
    reviewNotes: Array.isArray(data.reviewNotes) ? data.reviewNotes.map(String) : [],
  }
}

export function SimpleSitePlanImporter() {
  const [sheet, setSheet] = useState<SheetFile | null>(null)
  const [projectName, setProjectName] = useState('')
  const [graphicsInput, setGraphicsInput] = useState('')
  const [data, setData] = useState<PackageData | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function choosePdf(file: File | null) {
    if (!file) return
    setBusy(true)
    setMessage('Reading PDF…')
    setData(null)

    try {
      const pdf = await PDFDocument.load(await file.arrayBuffer(), {
        updateMetadata: false,
      })
      setSheet({
        file,
        pageCount: pdf.getPageCount(),
        primaryPage: 1,
        graphicsPages: [],
      })
      setProjectName(file.name.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' '))
      setGraphicsInput('')
      setMessage(`Loaded ${pdf.getPageCount()} pages. Choose the primary site-plan sheet.`)
    } catch (error) {
      setSheet(null)
      setMessage(error instanceof Error ? error.message : 'Could not read the PDF.')
    } finally {
      setBusy(false)
    }
  }

  const prompt = useMemo(() => {
    if (!sheet) return ''

    const selectedPages = [sheet.primaryPage, ...sheet.graphicsPages]
    const uniquePages = [...new Set(selectedPages)].sort((a, b) => a - b)

    return `You are preparing a simplified CFDT project intake from selected plan sheets.

PROJECT WORKING NAME
${projectName || 'Unknown'}

ATTACHED PDF
The attached PDF contains only selected pages extracted from the original plan set.
Original source file: ${sheet.file.name}
Primary information sheet: original page ${sheet.primaryPage}
Additional graphics pages: ${sheet.graphicsPages.length ? sheet.graphicsPages.join(', ') : 'none'}
Pages included in attachment: ${uniquePages.join(', ')}

TASK
1. Use the primary sheet to extract the project's basic facts.
2. Examine all included sheets for useful public-facing graphics and plat maps.
3. Read visible title blocks, notes, tables, labels, maps, and plan callouts.
4. Do not invent approval status, timeline milestones, traffic totals, or permit actions that are not shown.
5. Use empty strings, empty arrays, or 0 for unsupported values.
6. Return only valid JSON. Do not use markdown fences or commentary.

GRAPHICS
- Identify useful source sheets only. Do not crop or generate images.
- Allowed types: ${graphicTypes.join(', ')}.
- page and sourcePage must use the ORIGINAL page number listed above.
- status must be selected, alternate, or rejected.
- Prefer one selected hero/overall-plan candidate.
- Put plats and parcel-layout sheets in platMaps.

REQUIRED JSON SHAPE
${JSON.stringify(expectedShape, null, 2)}
`
  }, [projectName, sheet])

  async function downloadPrimary() {
    if (!sheet) return
    setBusy(true)
    setMessage('Preparing primary sheet…')
    try {
      const blob = await extractPages(sheet.file, [sheet.primaryPage])
      downloadBlob(`${slugify(projectName) || 'project'}-primary-sheet.pdf`, blob)
      setMessage('Primary sheet downloaded. Upload it to ChatGPT with the prompt.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not extract the sheet.')
    } finally {
      setBusy(false)
    }
  }

  async function downloadSelectedPackage() {
    if (!sheet) return
    const pages = [...new Set([sheet.primaryPage, ...sheet.graphicsPages])].sort((a, b) => a - b)
    setBusy(true)
    setMessage('Preparing selected-sheet package…')
    try {
      const blob = await extractPages(sheet.file, pages)
      downloadBlob(`${slugify(projectName) || 'project'}-selected-sheets.pdf`, blob)
      setMessage(`Downloaded ${pages.length} selected sheet${pages.length === 1 ? '' : 's'}.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not extract selected sheets.')
    } finally {
      setBusy(false)
    }
  }

  async function importJson(file: File | null) {
    if (!file) return
    try {
      setData(validatePackage(JSON.parse(await file.text())))
      setMessage('Project JSON loaded. Review the facts and graphic shortlist.')
    } catch (error) {
      setData(null)
      setMessage(error instanceof Error ? error.message : 'Could not read JSON.')
    }
  }

  function updateProject(key: string, value: string | number) {
    if (!data) return
    setData({...data, project: {...data.project, [key]: value}})
  }

  function updateCandidate(
    collection: 'graphics' | 'platMaps',
    index: number,
    key: keyof GraphicCandidate,
    value: string | number,
  ) {
    if (!data) return
    const next = [...data[collection]]
    next[index] = {...next[index], [key]: value}
    setData({...data, [collection]: next})
  }

  function exportDiscovery() {
    if (!data) return
    downloadText(
      `${data.project.slug || slugify(data.project.name || projectName) || 'project'}-graphics-discovery.json`,
      JSON.stringify(
        {
          schemaVersion: '1.0',
          project: {
            name: data.project.name || projectName,
            slug: data.project.slug || slugify(data.project.name || projectName),
          },
          graphics: data.graphics.filter((item) => item.status !== 'rejected'),
          platMaps: data.platMaps.filter((item) => item.status !== 'rejected'),
        },
        null,
        2,
      ),
      'application/json',
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f8b63]">
          Phase 1
        </p>
        <h2 className="mt-2 text-2xl font-bold">Scan one site-plan sheet</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Start with one PDF and one strong cover, overall-plan, or preliminary-plat sheet.
          That sheet creates the project. Supporting records can be added later.
        </p>

        <label className="mt-5 block cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <span className="font-bold">Choose plan PDF</span>
          <span className="mt-1 block text-sm text-slate-500">
            Nothing uploads automatically.
          </span>
          <input
            type="file"
            accept=".pdf,application/pdf"
            className="sr-only"
            onChange={(event) => void choosePdf(event.target.files?.[0] || null)}
          />
        </label>

        {sheet && (
          <div className="mt-6 space-y-5">
            <div className="grid gap-4 md:grid-cols-[1fr_180px]">
              <label>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Project working name
                </span>
                <input
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"
                />
              </label>

              <label>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Primary sheet
                </span>
                <input
                  type="number"
                  min={1}
                  max={sheet.pageCount}
                  value={sheet.primaryPage}
                  onChange={(event) =>
                    setSheet({
                      ...sheet,
                      primaryPage: Math.max(
                        1,
                        Math.min(sheet.pageCount, Number(event.target.value) || 1),
                      ),
                    })
                  }
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"
                />
              </label>
            </div>

            <p className="text-sm text-slate-600">
              {sheet.file.name} · {sheet.pageCount} pages
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => void downloadPrimary()}
                disabled={busy}
                className="rounded-lg bg-[#244f73] px-5 py-3 font-bold text-white disabled:opacity-40"
              >
                Download primary sheet
              </button>
              <button
                onClick={() => {
                  void navigator.clipboard.writeText(prompt)
                  setMessage('Prompt copied. Upload the primary sheet to ChatGPT and paste it.')
                }}
                className="rounded-lg border border-slate-300 px-5 py-3 font-bold"
              >
                Copy AI prompt
              </button>
              <button
                onClick={() =>
                  downloadText(
                    `${slugify(projectName) || 'project'}-site-plan-prompt.txt`,
                    prompt,
                  )
                }
                className="rounded-lg border border-slate-300 px-5 py-3 font-bold"
              >
                Download prompt
              </button>
            </div>
          </div>
        )}
      </section>

      {sheet && (
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f8b63]">
            Phase 2
          </p>
          <h2 className="mt-2 text-2xl font-bold">Add graphics and plat sheets</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Optional. Enter only promising page numbers, such as
            <strong> 3, 8, 12-14</strong>. They are combined with the primary sheet into one small PDF.
          </p>

          <label className="mt-5 block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Additional page numbers
            </span>
            <input
              value={graphicsInput}
              onChange={(event) => {
                const value = event.target.value
                setGraphicsInput(value)
                setSheet({
                  ...sheet,
                  graphicsPages: parsePages(value, sheet.pageCount).filter(
                    (page) => page !== sheet.primaryPage,
                  ),
                })
              }}
              placeholder="3, 8, 12-14"
              className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"
            />
          </label>

          <p className="mt-3 text-sm text-slate-600">
            Selected: {[sheet.primaryPage, ...sheet.graphicsPages].join(', ')}
          </p>

          <button
            onClick={() => void downloadSelectedPackage()}
            disabled={busy}
            className="mt-5 rounded-lg bg-[#244f73] px-5 py-3 font-bold text-white disabled:opacity-40"
          >
            Download selected-sheet package
          </button>
        </section>
      )}

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-xl font-bold">Import ChatGPT JSON</h2>
        <p className="mt-2 text-sm text-slate-600">
          Load the JSON returned by ChatGPT to review project facts and the graphics shortlist.
        </p>

        <label className="mt-5 block cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <span className="font-bold">Choose project JSON</span>
          <input
            type="file"
            accept=".json,application/json"
            className="sr-only"
            onChange={(event) => void importJson(event.target.files?.[0] || null)}
          />
        </label>
      </section>

      {data && (
        <>
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-bold">Review project facts</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                ['name', 'Project name', 'text'],
                ['slug', 'Slug', 'text'],
                ['county', 'County', 'text'],
                ['caseNumber', 'Case number', 'text'],
                ['planType', 'Plan type', 'text'],
                ['planDate', 'Plan date', 'date'],
                ['projectNumber', 'Project number', 'text'],
                ['location', 'Location', 'text'],
                ['homesProposed', 'Homes proposed', 'number'],
                ['siteAcres', 'Site acres', 'number'],
                ['developer', 'Developer', 'text'],
                ['applicant', 'Applicant', 'text'],
                ['engineer', 'Engineer', 'text'],
                ['zoning', 'Zoning', 'text'],
              ].map(([key, label, type]) => (
                <label key={key}>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {label}
                  </span>
                  <input
                    type={type}
                    value={data.project[key] ?? ''}
                    onChange={(event) =>
                      updateProject(
                        key,
                        type === 'number'
                          ? Number(event.target.value) || 0
                          : event.target.value,
                      )
                    }
                    className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"
                  />
                </label>
              ))}
            </div>

            <label className="mt-5 block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Plain-language summary
              </span>
              <textarea
                value={data.project.summary || ''}
                onChange={(event) => updateProject('summary', event.target.value)}
                className="mt-2 min-h-28 w-full rounded-lg border border-slate-300 p-3"
              />
            </label>
          </section>

          {(['graphics', 'platMaps'] as const).map((collection) => (
            <section
              key={collection}
              className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
            >
              <h2 className="text-xl font-bold">
                {collection === 'graphics' ? 'Graphics shortlist' : 'Plat maps'}
              </h2>

              <div className="mt-5 space-y-4">
                {data[collection].map((item, index) => (
                  <article
                    key={`${collection}-${index}`}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="grid gap-3 md:grid-cols-[180px_1fr_110px_130px]">
                      <select
                        value={item.type}
                        onChange={(event) =>
                          updateCandidate(collection, index, 'type', event.target.value)
                        }
                        className="h-11 rounded-lg border border-slate-300 px-3"
                      >
                        {graphicTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      <input
                        value={item.title}
                        onChange={(event) =>
                          updateCandidate(collection, index, 'title', event.target.value)
                        }
                        className="h-11 rounded-lg border border-slate-300 px-3"
                      />
                      <input
                        type="number"
                        min={1}
                        value={item.sourcePage}
                        onChange={(event) =>
                          updateCandidate(
                            collection,
                            index,
                            'sourcePage',
                            Number(event.target.value) || 1,
                          )
                        }
                        className="h-11 rounded-lg border border-slate-300 px-3"
                      />
                      <select
                        value={item.status}
                        onChange={(event) =>
                          updateCandidate(collection, index, 'status', event.target.value)
                        }
                        className="h-11 rounded-lg border border-slate-300 px-3"
                      >
                        <option value="selected">Selected</option>
                        <option value="alternate">Alternate</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    <textarea
                      value={item.reason}
                      onChange={(event) =>
                        updateCandidate(collection, index, 'reason', event.target.value)
                      }
                      className="mt-3 min-h-20 w-full rounded-lg border border-slate-300 p-3"
                    />
                  </article>
                ))}

                {data[collection].length === 0 && (
                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                    No candidates were identified.
                  </p>
                )}
              </div>
            </section>
          ))}

          {data.reviewNotes.length > 0 && (
            <section className="rounded-2xl border border-amber-300 bg-amber-50 p-6">
              <h2 className="font-bold text-amber-950">Needs verification</h2>
              <ul className="mt-3 space-y-2 text-sm text-amber-950">
                {data.reviewNotes.map((note, index) => (
                  <li key={index}>• {note}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-bold">Export</h2>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() =>
                  downloadText(
                    `${data.project.slug || slugify(data.project.name || projectName) || 'project'}-reviewed.json`,
                    JSON.stringify(data, null, 2),
                    'application/json',
                  )
                }
                className="rounded-lg border border-slate-300 px-5 py-3 font-bold"
              >
                Download reviewed project JSON
              </button>
              <button
                onClick={exportDiscovery}
                className="rounded-lg bg-[#244f73] px-5 py-3 font-bold text-white"
              >
                Export graphics discovery
              </button>
            </div>
          </section>
        </>
      )}

      {message && (
        <div className="rounded-xl border border-slate-300 bg-white p-4 text-sm font-semibold">
          {message}
        </div>
      )}
    </div>
  )
}
