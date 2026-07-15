'use client'

import {useEffect, useMemo, useRef, useState} from 'react'
import {createClient} from '@supabase/supabase-js'
import {PDFDocument} from 'pdf-lib'

type QueueItem = {
  id: string
  sourceName: string
  outputName: string
  relativePath: string
  blob: Blob
  sizeBytes: number
  status: 'waiting' | 'preparing' | 'uploading' | 'uploaded' | 'error'
  progress: number
  message?: string
  sourcePages?: string
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function cleanFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '-')
}

function formatSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function guessCategory(name: string) {
  const value = name.toLowerCase()
  if (value.includes('traffic') || value.includes('tia')) return 'traffic'
  if (value.includes('storm')) return 'stormwater'
  if (value.includes('utility') || value.includes('water') || value.includes('sewer')) return 'utilities'
  if (value.includes('landscape')) return 'landscaping'
  if (value.includes('wetland') || value.includes('environment')) return 'environmental'
  if (value.includes('site') || value.includes('plan') || value.includes('plat')) return 'site-plans'
  if (value.includes('approval') || value.includes('staff') || value.includes('agenda')) return 'official-records'
  return 'supporting'
}

async function pdfPart(
  source: PDFDocument,
  startPage: number,
  endPage: number,
): Promise<Blob> {
  const output = await PDFDocument.create()
  const indices = Array.from(
    {length: endPage - startPage + 1},
    (_, index) => startPage - 1 + index,
  )
  const copied = await output.copyPages(source, indices)
  copied.forEach((page) => output.addPage(page))
  const bytes = await output.save({useObjectStreams: true})
  const copiedBytes = Uint8Array.from(bytes)
  return new Blob([copiedBytes.buffer], {type: 'application/pdf'})
}

async function splitPdf(
  source: PDFDocument,
  startPage: number,
  endPage: number,
  targetBytes: number,
  baseName: string,
): Promise<QueueItem[]> {
  const blob = await pdfPart(source, startPage, endPage)

  if (blob.size <= targetBytes || startPage === endPage) {
    const pageLabel = startPage === endPage ? `${startPage}` : `${startPage}-${endPage}`
    return [{
      id: crypto.randomUUID(),
      sourceName: `${baseName}.pdf`,
      outputName: `${baseName}-pages-${pageLabel}.pdf`,
      relativePath: '',
      blob,
      sizeBytes: blob.size,
      status: 'waiting',
      progress: 0,
      sourcePages: pageLabel,
    }]
  }

  const midpoint = Math.floor((startPage + endPage) / 2)
  const left = await splitPdf(source, startPage, midpoint, targetBytes, baseName)
  const right = await splitPdf(source, midpoint + 1, endPage, targetBytes, baseName)
  return [...left, ...right]
}

export function ProjectIntakeWizard() {
  const folderInput = useRef<HTMLInputElement>(null)
  const [projectName, setProjectName] = useState('Hilton Bluffs')
  const [projectSlug, setProjectSlug] = useState('hilton-bluffs')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    folderInput.current?.setAttribute('webkitdirectory', '')
    folderInput.current?.setAttribute('directory', '')
  }, [])

  const totalSize = useMemo(
    () => queue.reduce((sum, item) => sum + item.sizeBytes, 0),
    [queue],
  )

  function selectFiles(list: FileList | null) {
    if (!list) return
    setSelectedFiles(Array.from(list))
    setQueue([])
    setMessage('')
  }

  async function prepare() {
    if (!selectedFiles.length) {
      setMessage('Choose files or a project folder first.')
      return
    }

    setBusy(true)
    setMessage('')
    setQueue([])

    try {
      const targetBytes = 40 * 1024 * 1024
      const prepared: QueueItem[] = []

      for (const file of selectedFiles) {
        const category = guessCategory(file.name)
        const baseName = cleanFileName(file.name.replace(/\.pdf$/i, ''))

        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          if (file.size > targetBytes) {
            const source = await PDFDocument.load(await file.arrayBuffer(), {
              ignoreEncryption: false,
              updateMetadata: false,
            })
            const parts = await splitPdf(
              source,
              1,
              source.getPageCount(),
              targetBytes,
              baseName,
            )
            for (const part of parts) {
              part.relativePath = `${category}/${part.outputName}`
              prepared.push(part)
            }
          } else {
            prepared.push({
              id: crypto.randomUUID(),
              sourceName: file.name,
              outputName: cleanFileName(file.name),
              relativePath: `${category}/${cleanFileName(file.name)}`,
              blob: file,
              sizeBytes: file.size,
              status: 'waiting',
              progress: 0,
            })
          }
        } else {
          prepared.push({
            id: crypto.randomUUID(),
            sourceName: file.name,
            outputName: cleanFileName(file.name),
            relativePath: `${category}/${cleanFileName(file.name)}`,
            blob: file,
            sizeBytes: file.size,
            status: 'waiting',
            progress: 0,
          })
        }
      }

      setQueue(prepared)
      setMessage(`Prepared ${prepared.length} upload item${prepared.length === 1 ? '' : 's'}.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not prepare project package.')
    } finally {
      setBusy(false)
    }
  }

  async function uploadQueue() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      setMessage('Public Supabase URL or key is missing.')
      return
    }
    if (!queue.length) {
      setMessage('Prepare the package first.')
      return
    }

    setBusy(true)
    setMessage('')
    const supabase = createClient(url, key)

    for (const item of queue) {
      if (item.status === 'uploaded') continue

      setQueue((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? {...entry, status: 'uploading', progress: 10, message: ''}
            : entry,
        ),
      )

      try {
        const signedResponse = await fetch('/api/storage/sign-upload', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            projectSlug,
            relativePath: item.relativePath,
          }),
        })
        const signed = await signedResponse.json()
        if (!signedResponse.ok) throw new Error(signed.error || 'Could not sign upload.')

        setQueue((current) =>
          current.map((entry) =>
            entry.id === item.id ? {...entry, progress: 35} : entry,
          ),
        )

        const {error} = await supabase.storage
          .from('cfdt-project-files')
          .uploadToSignedUrl(signed.path, signed.token, item.blob, {
            contentType: item.blob.type || 'application/octet-stream',
          })

        if (error) throw error

        setQueue((current) =>
          current.map((entry) =>
            entry.id === item.id
              ? {...entry, status: 'uploaded', progress: 100}
              : entry,
          ),
        )
      } catch (error) {
        setQueue((current) =>
          current.map((entry) =>
            entry.id === item.id
              ? {
                  ...entry,
                  status: 'error',
                  progress: 0,
                  message: error instanceof Error ? error.message : 'Upload failed.',
                }
              : entry,
          ),
        )
      }
    }

    const manifest = {
      schemaVersion: '1.0',
      projectName,
      projectSlug,
      generatedAt: new Date().toISOString(),
      files: queue.map((item) => ({
        sourceName: item.sourceName,
        outputName: item.outputName,
        relativePath: item.relativePath,
        sizeBytes: item.sizeBytes,
        sourcePages: item.sourcePages || null,
      })),
    }

    try {
      const manifestBlob = new Blob(
        [JSON.stringify(manifest, null, 2)],
        {type: 'application/json'},
      )
      const response = await fetch('/api/storage/sign-upload', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          projectSlug,
          relativePath: 'project-manifest.json',
        }),
      })
      const signed = await response.json()
      if (response.ok) {
        await supabase.storage
          .from('cfdt-project-files')
          .uploadToSignedUrl(signed.path, signed.token, manifestBlob, {
            contentType: 'application/json',
          })
      }
    } catch {}

    setBusy(false)
    setMessage('Upload pass completed. Any failed items can be retried.')
  }

  const uploaded = queue.filter((item) => item.status === 'uploaded').length

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f8b63]">
          One-step intake
        </p>
        <h2 className="mt-2 text-2xl font-bold">Project Intake Wizard</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Select a project folder. Oversized PDFs are split locally into files under
          40 MB, organized by likely subject, and uploaded to private Supabase Storage.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Project name
            </span>
            <input
              value={projectName}
              onChange={(event) => {
                setProjectName(event.target.value)
                setProjectSlug(slugify(event.target.value))
              }}
              className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"
            />
          </label>
          <label>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Project slug
            </span>
            <input
              value={projectSlug}
              onChange={(event) => setProjectSlug(slugify(event.target.value))}
              className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"
            />
          </label>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <span className="font-bold">Choose files</span>
            <input
              type="file"
              multiple
              className="sr-only"
              onChange={(event) => selectFiles(event.target.files)}
            />
          </label>

          <label className="cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <span className="font-bold">Choose project folder</span>
            <input
              ref={folderInput}
              type="file"
              multiple
              className="sr-only"
              onChange={(event) => selectFiles(event.target.files)}
            />
          </label>
        </div>

        <p className="mt-4 text-sm text-slate-600">
          {selectedFiles.length} source file{selectedFiles.length === 1 ? '' : 's'} selected
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={prepare}
            disabled={busy || !selectedFiles.length}
            className="rounded-lg border border-[#244f73] px-5 py-3 font-bold text-[#244f73] disabled:opacity-40"
          >
            {busy && !queue.length ? 'Preparing…' : 'Prepare package'}
          </button>
          <button
            onClick={uploadQueue}
            disabled={busy || !queue.length}
            className="rounded-lg bg-[#244f73] px-5 py-3 font-bold text-white disabled:opacity-40"
          >
            {busy && queue.length ? 'Uploading…' : 'Upload prepared package'}
          </button>
        </div>
      </section>

      {queue.length > 0 && (
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-xl font-bold">Prepared upload queue</h3>
              <p className="mt-1 text-sm text-slate-500">
                {uploaded} of {queue.length} uploaded · {formatSize(totalSize)} total
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {queue.map((item) => (
              <article key={item.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold">{item.relativePath}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatSize(item.sizeBytes)}
                      {item.sourcePages ? ` · source pages ${item.sourcePages}` : ''}
                    </p>
                    {item.message && (
                      <p className="mt-2 text-xs font-bold text-red-700">{item.message}</p>
                    )}
                  </div>
                  <span className="text-xs font-bold uppercase">{item.status}</span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-[#244f73] transition-all"
                    style={{width: `${item.progress}%`}}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {message && (
        <div className="rounded-xl border border-slate-300 bg-white p-4 text-sm font-semibold">
          {message}
        </div>
      )}
    </div>
  )
}
