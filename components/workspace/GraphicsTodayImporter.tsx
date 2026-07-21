'use client'

import {useEffect, useMemo, useRef, useState} from 'react'

type PageRole = 'primary' | 'graphic' | 'none'

type PageChoice = {
  page: number
  role: PageRole
  thumbnail: string
  category: string
  title: string
  description: string
  sourceType: 'pdf' | 'image'
  sourceName: string
  imageFile?: File
  imageObjectUrl?: string
}

type SanityProjectOption = {
  id: string
  name: string
  slug: string
}

const categories = [
  'Hero',
  'Location',
  'Site Plan',
  'Existing Conditions',
  'Amenity Plan',
  'Landscape Plan',
  'Utility Plan',
  'Lighting Plan',
  'Entrance Plan',
  'Traffic Exhibit',
  'Rendering',
  'Photo',
  'Other',
]

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const anchor = window.document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function GraphicsTodayImporter() {
  const [file, setFile] = useState<File | null>(null)
  const [projectName, setProjectName] = useState('')
  const [projectSlug, setProjectSlug] = useState('')
  const [pages, setPages] = useState<PageChoice[]>([])
  const [loading, setLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [renderedCount, setRenderedCount] = useState(0)
  const [message, setMessage] = useState('')
  const [projectOptions, setProjectOptions] = useState<SanityProjectOption[]>([])
  const [autoMatched, setAutoMatched] = useState(false)
  const [preferredProjectSlug, setPreferredProjectSlug] = useState('')
  const [inspectingPage, setInspectingPage] = useState<PageChoice | null>(null)
  const [inspectImage, setInspectImage] = useState('')
  const [inspectZoom, setInspectZoom] = useState(1.25)
  const [inspectLoading, setInspectLoading] = useState(false)
  const pdfRef = useRef<any>(null)
  const inspectImageUrlRef = useRef<string | null>(null)
  const imageObjectUrlsRef = useRef<string[]>([])
  const cancelled = useRef(false)

  useEffect(() => {
    const querySlug = new URLSearchParams(window.location.search).get('projectSlug')
    if (querySlug) setPreferredProjectSlug(slugify(querySlug))

    return () => {
      cancelled.current = true
      if (inspectImageUrlRef.current) {
        URL.revokeObjectURL(inspectImageUrlRef.current)
      }
      clearImageObjectUrls()
    }
  }, [])

  const selected = useMemo(
    () => pages.filter((item) => item.role !== 'none'),
    [pages],
  )

  async function loadProjectOptions() {
    try {
      const response = await fetch('/api/graphics/projects', {
        cache: 'no-store',
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Could not load website projects.')
      }

      const options = Array.isArray(result.projects)
        ? result.projects
        : []

      setProjectOptions(options)
      return options as SanityProjectOption[]
    } catch {
      setProjectOptions([])
      return [] as SanityProjectOption[]
    }
  }

  function normalizeMatchText(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  function clearImageObjectUrls() {
    imageObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    imageObjectUrlsRef.current = []
  }

  function findBestProjectMatch(
    text: string,
    options: SanityProjectOption[],
  ) {
    const normalizedText = ` ${normalizeMatchText(text)} `

    const ranked = options
      .map((option) => {
        const normalizedName = normalizeMatchText(option.name)
        const normalizedSlug = normalizeMatchText(option.slug)
        let score = 0

        if (
          normalizedName &&
          normalizedText.includes(` ${normalizedName} `)
        ) {
          score += 100 + normalizedName.length
        }

        if (
          normalizedSlug &&
          normalizedText.includes(` ${normalizedSlug} `)
        ) {
          score += 80 + normalizedSlug.length
        }

        const words = normalizedName
          .split(' ')
          .filter((word) => word.length >= 4)

        for (const word of words) {
          if (normalizedText.includes(` ${word} `)) {
            score += 5
          }
        }

        return {option, score}
      })
      .sort((a, b) => b.score - a.score)

    return ranked[0]?.score >= 20
      ? ranked[0].option
      : null
  }

  async function loadPdf(nextFile: File | null) {
    if (!nextFile) return

    clearImageObjectUrls()
    setLoading(true)
    setMessage('Reading plan title and rendering page thumbnails…')
    setFile(nextFile)
    setAutoMatched(false)
    pdfRef.current = null
    const initialName = nextFile.name
      .replace(/\.pdf$/i, '')
      .replace(/[-_]+/g, ' ')
    const requestedSlug =
      preferredProjectSlug ||
      new URLSearchParams(window.location.search).get('projectSlug') ||
      ''
    setProjectName(initialName)
    setProjectSlug(requestedSlug || slugify(initialName))
    setPages([])
    setRenderedCount(0)
    cancelled.current = false

    try {
      const pdfjs = await import('pdfjs-dist')
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
      ).toString()

      const pdfDocument = await pdfjs.getDocument({
        data: new Uint8Array(await nextFile.arrayBuffer()),
      }).promise

      pdfRef.current = pdfDocument

      const options = projectOptions.length
        ? projectOptions
        : await loadProjectOptions()

      const requestedProject = options.find(
        (option) => option.slug === slugify(requestedSlug),
      )

      let identificationText = nextFile.name
      const pagesToRead = Math.min(3, pdfDocument.numPages)

      for (let pageNumber = 1; pageNumber <= pagesToRead; pageNumber += 1) {
        const identityPage = await pdfDocument.getPage(pageNumber)
        const textContent = await identityPage.getTextContent()
        identificationText += ' ' + textContent.items
          .map((item: any) =>
            typeof item?.str === 'string'
              ? item.str
              : '',
          )
          .join(' ')
      }

      const matchedProject = findBestProjectMatch(
        identificationText,
        options,
      )

      if (requestedProject) {
        setProjectName(requestedProject.name)
        setProjectSlug(requestedProject.slug)
        setAutoMatched(true)
      } else if (matchedProject) {
        setProjectName(matchedProject.name)
        setProjectSlug(matchedProject.slug)
        setAutoMatched(true)
      }

      setPages(
        Array.from({length: pdfDocument.numPages}, (_, index) => ({
          page: index + 1,
          role: 'none' as PageRole,
          thumbnail: '',
          category: index === 0 ? 'Hero' : 'Site Plan',
          title: `Plan Sheet ${index + 1}`,
          description: '',
          sourceType: 'pdf' as const,
          sourceName: nextFile.name,
        })),
      )

      for (
        let pageNumber = 1;
        pageNumber <= pdfDocument.numPages;
        pageNumber += 1
      ) {
        if (cancelled.current) return

        const pdfPage = await pdfDocument.getPage(pageNumber)
        const baseViewport = pdfPage.getViewport({scale: 1})
        const scale = Math.min(0.42, 250 / baseViewport.width)
        const viewport = pdfPage.getViewport({scale})
        const canvas = window.document.createElement('canvas')
        canvas.width = Math.ceil(viewport.width)
        canvas.height = Math.ceil(viewport.height)

        const context = canvas.getContext('2d')
        if (!context) continue

        await pdfPage.render({
          canvas,
          canvasContext: context,
          viewport,
        }).promise

        const thumbnail = canvas.toDataURL('image/jpeg', 0.72)

        setPages((current) =>
          current.map((item) =>
            item.page === pageNumber
              ? {...item, thumbnail}
              : item,
          ),
        )
        setRenderedCount(pageNumber)

        if (pageNumber % 4 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0))
        }
      }

      setMessage(
        matchedProject
          ? `Matched this plan to ${matchedProject.name}. Rendered ${pdfDocument.numPages} pages.`
          : `Rendered ${pdfDocument.numPages} pages. Confirm the website project before publishing.`,
      )
    } catch (error) {
      pdfRef.current = null
      setPages([])
      setFile(null)
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not render the PDF.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function loadImages(files: File[]) {
    const imageFiles = files.filter((item) => item.type.startsWith('image/'))
    if (!imageFiles.length) return

    clearImageObjectUrls()

    setLoading(true)
    setMessage('Preparing image graphics...')
    setFile(imageFiles[0])
    setAutoMatched(false)
    setPages([])
    setRenderedCount(0)
    pdfRef.current = null
    cancelled.current = false

    const requestedSlug =
      preferredProjectSlug ||
      new URLSearchParams(window.location.search).get('projectSlug') ||
      ''
    const initialName = imageFiles[0].name
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/[-_]+/g, ' ')

    setProjectName(initialName)
    setProjectSlug(requestedSlug || slugify(initialName))

    try {
      const options = projectOptions.length
        ? projectOptions
        : await loadProjectOptions()

      const requestedProject = options.find(
        (option) => option.slug === slugify(requestedSlug),
      )
      const matchedProject = findBestProjectMatch(
        imageFiles.map((item) => item.name).join(' '),
        options,
      )

      if (requestedProject) {
        setProjectName(requestedProject.name)
        setProjectSlug(requestedProject.slug)
        setAutoMatched(true)
      } else if (matchedProject) {
        setProjectName(matchedProject.name)
        setProjectSlug(matchedProject.slug)
        setAutoMatched(true)
      }

      const imagePages = imageFiles.map((imageFile, index) => {
        const imageUrl = URL.createObjectURL(imageFile)
        imageObjectUrlsRef.current.push(imageUrl)
        const title = imageFile.name
          .replace(/\.[a-z0-9]+$/i, '')
          .replace(/[-_]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()

        return {
          page: index + 1,
          role: index === 0 ? 'primary' as PageRole : 'graphic' as PageRole,
          thumbnail: imageUrl,
          category: index === 0 ? 'Hero' : 'Site Plan',
          title: title || `Image Graphic ${index + 1}`,
          description: '',
          sourceType: 'image' as const,
          sourceName: imageFile.name,
          imageFile,
          imageObjectUrl: imageUrl,
        }
      })

      setPages(imagePages)
      setRenderedCount(imagePages.length)
      setMessage(
        matchedProject
          ? `Matched ${imagePages.length} image graphic${imagePages.length === 1 ? '' : 's'} to ${matchedProject.name}.`
          : `Prepared ${imagePages.length} image graphic${imagePages.length === 1 ? '' : 's'}. Confirm the website project before publishing.`,
      )
    } catch (error) {
      setPages([])
      setFile(null)
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not prepare the image graphics.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function loadGraphicFiles(files: File[]) {
    const pdfFiles = files.filter(
      (item) =>
        item.type === 'application/pdf' ||
        item.name.toLowerCase().endsWith('.pdf'),
    )
    const imageFiles = files.filter((item) => item.type.startsWith('image/'))

    if (pdfFiles.length) {
      await loadPdf(pdfFiles[0])
      return
    }

    if (imageFiles.length) {
      await loadImages(imageFiles)
      return
    }

    setMessage('Choose a PDF, JPG, PNG, or WebP file.')
  }

  function updatePage(pageNumber: number, patch: Partial<PageChoice>) {
    setPages((current) =>
      current.map((item) =>
        item.page === pageNumber
          ? {...item, ...patch}
          : item,
      ),
    )
  }

  function selectPage(pageNumber: number, role: PageRole) {
    setPages((current) =>
      current.map((item) => {
        if (role === 'primary') {
          if (item.page === pageNumber) {
            return {
              ...item,
              role: 'primary',
              category: 'Hero',
              title:
                item.title.startsWith('Plan Sheet')
                  ? `${projectName} — Overall Plan`
                  : item.title,
            }
          }

          if (item.role === 'primary') {
            return {...item, role: 'none'}
          }

          return item
        }

        if (item.page !== pageNumber) return item

        return {
          ...item,
          role,
          category:
            role === 'graphic' && item.category === 'Hero'
              ? 'Site Plan'
              : item.category,
        }
      }),
    )
  }

  async function renderHighResolution(pageNumber: number) {
    const pdfDocument = pdfRef.current
    if (!pdfDocument) throw new Error('PDF is not loaded.')

    const pdfPage = await pdfDocument.getPage(pageNumber)
    const baseViewport = pdfPage.getViewport({scale: 1})
    const maxWidth = 2400
    const scale = Math.min(3, maxWidth / baseViewport.width)
    const viewport = pdfPage.getViewport({scale})
    const canvas = window.document.createElement('canvas')
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)

    const context = canvas.getContext('2d')
    if (!context) throw new Error('Could not create image canvas.')

    await pdfPage.render({
      canvas,
      canvasContext: context,
      viewport,
    }).promise

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) =>
          result
            ? resolve(result)
            : reject(new Error('Could not create PNG image.')),
        'image/png',
      )
    })

    return blob
  }

  async function renderDirectImage(item: PageChoice) {
    if (!item.imageFile) throw new Error('Image file is not loaded.')

    const bitmap = await createImageBitmap(item.imageFile)
    const maxWidth = 2400
    const scale = Math.min(1, maxWidth / bitmap.width)
    const canvas = window.document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))

    const context = canvas.getContext('2d')
    if (!context) throw new Error('Could not create image canvas.')

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) =>
          result
            ? resolve(result)
            : reject(new Error('Could not create PNG image.')),
        'image/png',
      )
    })

    bitmap.close()
    return blob
  }

  async function renderGraphicImage(item: PageChoice) {
    if (item.sourceType === 'image') return renderDirectImage(item)
    return renderHighResolution(item.page)
  }

  async function openInspector(item: PageChoice) {
    if (item.sourceType === 'pdf' && !pdfRef.current) {
      setMessage('Upload the PDF before inspecting this graphic.')
      return
    }

    setInspectingPage(item)
    setInspectImage('')
    setInspectZoom(1.25)
    setInspectLoading(true)

    try {
      if (inspectImageUrlRef.current) {
        URL.revokeObjectURL(inspectImageUrlRef.current)
        inspectImageUrlRef.current = null
      }

      const blob = await renderGraphicImage(item)
      const url = URL.createObjectURL(blob)
      inspectImageUrlRef.current = url
      setInspectImage(url)
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not open the graphic inspector.',
      )
      setInspectingPage(null)
    } finally {
      setInspectLoading(false)
    }
  }

  function closeInspector() {
    setInspectingPage(null)
    setInspectImage('')
    setInspectZoom(1.25)
    if (inspectImageUrlRef.current) {
      URL.revokeObjectURL(inspectImageUrlRef.current)
      inspectImageUrlRef.current = null
    }
  }

  async function downloadSelected() {
    if (!selected.length) {
      setMessage('Select at least one graphic.')
      return
    }

    setPublishing(true)
    setMessage('Creating high-resolution graphics…')

    try {
      for (const item of selected) {
        const blob = await renderGraphicImage(item)
        downloadBlob(
          `${projectSlug || 'project'}-${item.category
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')}-page-${item.page}.png`,
          blob,
        )
        await new Promise((resolve) => setTimeout(resolve, 200))
      }

      setMessage(`Downloaded ${selected.length} graphic image${selected.length === 1 ? '' : 's'}.`)
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not create graphics.',
      )
    } finally {
      setPublishing(false)
    }
  }

  async function publishSelected() {
    if (!projectSlug) {
      setMessage('Enter the project slug used by the website.')
      return
    }

    if (!selected.length) {
      setMessage('Select at least one graphic.')
      return
    }

    setPublishing(true)
    setMessage('Publishing graphics to Sanity…')

    try {
      let published = 0
      const verifiedIds: string[] = []

      for (let index = 0; index < selected.length; index += 1) {
        const item = selected[index]
        setMessage(
          `Publishing ${index + 1} of ${selected.length}: ${item.title}`,
        )

        const image = await renderGraphicImage(item)
        const form = new FormData()
        form.set('projectSlug', projectSlug)
        form.set('title', item.title)
        form.set('category', item.category)
        form.set('caption', item.description)
        form.set(
          'publicDescription',
          item.description ||
            `Official project plan graphic from page ${item.page}.`,
        )
        form.set('sourceDocument', item.sourceName || file?.name || 'Project graphic')
        form.set('sourcePage', String(item.page))
        form.set('displayOrder', String(index))
        form.set(
          'image',
          image,
          `${projectSlug}-${item.category
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')}-page-${item.page}.png`,
        )

        const response = await fetch('/api/graphics/publish', {
          method: 'POST',
          body: form,
        })
        const result = await response.json()

        if (!response.ok) {
          throw new Error(
            result.error || `Could not publish page ${item.page}.`,
          )
        }

        if (!result.verified || !result.graphic?._id) {
          throw new Error(
            `The server did not verify page ${item.page} in Sanity.`,
          )
        }

        verifiedIds.push(result.graphic._id)
        published += 1
      }

      setMessage(
        `Verified ${published} graphic${published === 1 ? '' : 's'} in Sanity. Opening the project page...`,
      )
      window.setTimeout(() => {
        window.location.href = `/projects/${projectSlug}`
      }, 700)
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Graphics publishing failed.',
      )
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f8b63]">
          Graphics today
        </p>
        <h2 className="mt-2 text-2xl font-bold">
          Select plan graphics and publish them
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Choose the complete PDF or drop already-found plan images, label them,
          and publish web-ready graphics directly to the existing project page.
        </p>

        <label
          className="mt-5 block cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"
          onDragOver={(event) => {
            event.preventDefault()
          }}
          onDrop={(event) => {
            event.preventDefault()
            void loadGraphicFiles(Array.from(event.dataTransfer.files))
          }}
        >
          <span className="font-bold">Choose or drop PDF/images</span>
          <span className="mt-1 block text-sm text-slate-500">
            Use PDFs for full packets, or JPG/PNG/WebP files for older developments.
          </span>
          <input
            type="file"
            multiple
            accept=".pdf,application/pdf,image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(event) =>
              void loadGraphicFiles(Array.from(event.target.files || []))
            }
          />
        </label>

        {file && (
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
                  setAutoMatched(false)
                }}
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"
              />
            </label>

            <label>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Existing website project slug
              </span>
              <input
                list="sanity-project-slugs"
                value={projectSlug}
                onChange={(event) => {
                  const slug = slugify(event.target.value)
                  setProjectSlug(slug)
                  const matched = projectOptions.find(
                    (option) => option.slug === slug,
                  )
                  if (matched) {
                    setProjectName(matched.name)
                  }
                  setAutoMatched(Boolean(matched))
                }}
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"
              />
              <datalist id="sanity-project-slugs">
                {projectOptions.map((option) => (
                  <option
                    key={option.id}
                    value={option.slug}
                  >
                    {option.name}
                  </option>
                ))}
              </datalist>
              <span className={`mt-2 block text-xs font-bold ${
                autoMatched
                  ? 'text-emerald-700'
                  : 'text-amber-700'
              }`}>
                {autoMatched
                  ? 'Matched automatically to an existing Sanity project.'
                  : 'Not automatically matched. Choose an existing project slug.'}
              </span>
            </label>
          </div>
        )}

        {file && (
          <p className="mt-4 text-sm text-slate-600">
            {pages[0]?.sourceType === 'image'
              ? `${renderedCount} image graphic${renderedCount === 1 ? '' : 's'} ready`
              : `${renderedCount} of ${pages.length} thumbnails rendered`}
          </p>
        )}
      </section>

      {pages.length > 0 && (
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-bold">Choose graphics</h2>
              <p className="mt-2 text-sm text-slate-600">
                Mark one item as Hero and any other useful items as Graphic.
                Then set the website category and title.
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold">
              {selected.length} selected
            </span>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {pages.map((item) => (
              <article
                key={item.page}
                className={`overflow-hidden rounded-xl border-2 ${
                  item.role === 'primary'
                    ? 'border-blue-600'
                    : item.role === 'graphic'
                      ? 'border-emerald-600'
                      : 'border-slate-200'
                }`}
              >
                <div className="bg-slate-100 p-2">
                  {item.thumbnail ? (
                    <button
                      type="button"
                      onClick={() => void openInspector(item)}
                      className="group relative block w-full"
                      aria-label={`Inspect ${item.sourceType === 'image' ? 'image' : 'page'} ${item.page}`}
                    >
                      <img
                        src={item.thumbnail}
                        alt={`${item.sourceType === 'image' ? 'Image graphic' : 'PDF page'} ${item.page}`}
                        className="mx-auto max-h-72 w-auto object-contain"
                      />
                      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-md bg-slate-950 px-3 py-2 text-xs font-bold text-white opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-visible:opacity-100">
                        Inspect graphic
                      </span>
                    </button>
                  ) : (
                    <div className="flex h-56 items-center justify-center text-sm text-slate-500">
                      Preparing item {item.page}...
                    </div>
                  )}
                </div>

                <div className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <strong>{item.sourceType === 'image' ? 'Image' : 'Page'} {item.page}</strong>
                    <span className="text-xs font-bold uppercase text-slate-500">
                      {item.role}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => void openInspector(item)}
                      disabled={!item.thumbnail}
                      className="col-span-3 rounded-md border border-slate-300 px-2 py-2 text-xs font-bold disabled:opacity-40"
                    >
                      Inspect / zoom
                    </button>

                    <button
                      type="button"
                      onClick={() => selectPage(item.page, 'primary')}
                      className={`rounded-md px-2 py-2 text-xs font-bold ${
                        item.role === 'primary'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100'
                      }`}
                    >
                      Hero
                    </button>

                    <button
                      type="button"
                      onClick={() => selectPage(item.page, 'graphic')}
                      className={`rounded-md px-2 py-2 text-xs font-bold ${
                        item.role === 'graphic'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100'
                      }`}
                    >
                      Graphic
                    </button>

                    <button
                      type="button"
                      onClick={() => selectPage(item.page, 'none')}
                      className="rounded-md bg-slate-100 px-2 py-2 text-xs font-bold"
                    >
                      Clear
                    </button>
                  </div>

                  {item.role !== 'none' && (
                    <>
                      <select
                        value={item.category}
                        onChange={(event) =>
                          updatePage(item.page, {
                            category: event.target.value,
                          })
                        }
                        className="h-11 w-full rounded-lg border border-slate-300 px-3"
                      >
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>

                      <input
                        value={item.title}
                        onChange={(event) =>
                          updatePage(item.page, {
                            title: event.target.value,
                          })
                        }
                        className="h-11 w-full rounded-lg border border-slate-300 px-3"
                        placeholder="Graphic title"
                      />

                      <textarea
                        value={item.description}
                        onChange={(event) =>
                          updatePage(item.page, {
                            description: event.target.value,
                          })
                        }
                        className="min-h-20 w-full rounded-lg border border-slate-300 p-3"
                        placeholder="Plain-language description (optional)"
                      />
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {file && (
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold">Finish</h2>
          <p className="mt-2 text-sm text-slate-600">
            Download the PNG files for backup, or publish them directly to the
            matching Sanity project.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void downloadSelected()}
              disabled={!selected.length || publishing || loading}
              className="rounded-lg border border-slate-300 px-5 py-3 font-bold disabled:opacity-40"
            >
              Download selected PNGs
            </button>

            <button
              type="button"
              onClick={() => void publishSelected()}
              disabled={!selected.length || !projectSlug || publishing || loading}
              className="rounded-lg bg-[#244f73] px-5 py-3 font-bold text-white disabled:opacity-40"
            >
              {publishing
                ? 'Publishing…'
                : 'Publish graphics to website'}
            </button>

            {projectSlug && (
              <a
                href={`/projects/${projectSlug}`}
                className="rounded-lg border border-slate-300 px-5 py-3 font-bold"
              >
                View project page
              </a>
            )}
          </div>
        </section>
      )}

      {message && (
        <div className="rounded-xl border border-slate-300 bg-white p-4 text-sm font-semibold">
          {message}
        </div>
      )}

      {inspectingPage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 p-3 md:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Inspect ${inspectingPage.sourceType === 'image' ? 'image' : 'page'} ${inspectingPage.page}`}
        >
          <div className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Graphic inspector
                </p>
                <h2 className="mt-1 text-lg font-bold">
                  {inspectingPage.sourceType === 'image' ? 'Image' : 'Page'} {inspectingPage.page}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInspectZoom((value) => Math.max(0.75, value - 0.25))}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold"
                >
                  Zoom out
                </button>
                <input
                  type="range"
                  min="0.75"
                  max="3"
                  step="0.25"
                  value={inspectZoom}
                  onChange={(event) => setInspectZoom(Number(event.target.value))}
                  className="w-32"
                  aria-label="Sheet zoom"
                />
                <button
                  type="button"
                  onClick={() => setInspectZoom((value) => Math.min(3, value + 0.25))}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold"
                >
                  Zoom in
                </button>
                <button
                  type="button"
                  onClick={closeInspector}
                  className="rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-slate-100 p-4">
              {inspectLoading && (
                <div className="flex h-full min-h-[60vh] items-center justify-center text-sm font-bold text-slate-600">
                  Preparing high-resolution graphic...
                </div>
              )}

              {!inspectLoading && inspectImage && (
                <img
                  src={inspectImage}
                  alt={`High-resolution ${inspectingPage.sourceType === 'image' ? 'image graphic' : 'PDF page'} ${inspectingPage.page}`}
                  className="block max-w-none rounded-lg bg-white shadow"
                  style={{width: `${inspectZoom * 100}%`}}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
