'use client'

import {useEffect, useMemo, useState} from 'react'
import {GraphicViewer} from '@/components/GraphicViewer'
import type {Project} from '@/types/project'
import type {ProjectMedia} from '@/types/projectMedia'
import type {ProjectUpdate} from '@/types/projectUpdate'

type UpdateKind = 'official' | 'news'

function formatDate(value?: string | null) {
  if (!value) return undefined
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function normalizeStage(value?: string) {
  const stage = value?.toLowerCase()
  if (stage === 'complete' || stage === 'completed') return 'complete'
  if (stage === 'current' || stage === 'in progress') return 'current'
  return 'future'
}

function getKind(update: ProjectUpdate): UpdateKind {
  if (update.sourceType?.toLowerCase() === 'news') return 'news'
  const source = `${update.sourceName || ''} ${update.sourceUrl || ''}`.toLowerCase()
  return /starnews|portcitydaily|wway|wect|whqr|news/.test(source) ? 'news' : 'official'
}

function getSourceName(update: ProjectUpdate) {
  if (update.sourceName) return update.sourceName
  if (!update.sourceUrl) return getKind(update) === 'news' ? 'News coverage' : 'Official record'
  try {
    return new URL(update.sourceUrl).hostname.replace(/^www\./, '')
  } catch {
    return getKind(update) === 'news' ? 'News coverage' : 'Official record'
  }
}

export function ProjectDashboard({
  project,
  graphics,
  updates,
}: {
  project: Project
  graphics: ProjectMedia[]
  updates: ProjectUpdate[]
}) {
  const [liveGraphics, setLiveGraphics] = useState<ProjectMedia[]>(graphics)
  const [graphicsMessage, setGraphicsMessage] = useState('')
  const [graphicIndex, setGraphicIndex] = useState(0)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | UpdateKind>('all')

  const projectSlug =
    typeof project.slug === 'string'
      ? project.slug
      : project.slug?.current || ''

  useEffect(() => {
    let cancelled = false

    async function loadLiveGraphics() {
      try {
        if (!projectSlug) return

        const response = await fetch(
          `/api/projects/${encodeURIComponent(projectSlug)}/graphics?refresh=${Date.now()}`,
          {
            cache: 'no-store',
            headers: {'Cache-Control': 'no-cache'},
          },
        )

        const result = await response.json()

        if (!response.ok) {
          throw new Error(
            result.error || 'Could not refresh project graphics.',
          )
        }

        if (!cancelled) {
          setLiveGraphics(
            Array.isArray(result.graphics)
              ? result.graphics
              : [],
          )
          setGraphicIndex(0)
          setGraphicsMessage(
            `${result.count || 0} live graphic${
              result.count === 1 ? '' : 's'
            } loaded.`,
          )
        }
      } catch (error) {
        if (!cancelled) {
          setGraphicsMessage(
            error instanceof Error
              ? error.message
              : 'Could not refresh project graphics.',
          )
        }
      }
    }

    void loadLiveGraphics()

    return () => {
      cancelled = true
    }
  }, [projectSlug])

  const timeline = project.timeline || []
  const currentStage =
    timeline.find((stage) => normalizeStage(stage.stageStatus) === 'current')?.title ||
    project.status ||
    'Status not entered'

  const displayUpdates = useMemo(
    () =>
      updates
        .map((update) => ({
          ...update,
          kind: getKind(update),
          sourceLabel: getSourceName(update),
        }))
        .filter((update) => filter === 'all' || update.kind === filter)
        .sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    [updates, filter],
  )

  const selectedGraphic = liveGraphics[graphicIndex]
  const acreage =
    project.buildableAcres ??
    project.siteAcres ??
    project.totalSiteAcres ??
    project.totalPropertyAcres

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="grid lg:grid-cols-[1.35fr_1fr_1fr_1fr_1fr]">
          <div className="border-b border-slate-200 p-6 lg:border-b-0 lg:border-r">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6f8b63]">
              Development
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-[#142033]">
              {project.name}
            </h1>
            <p className="mt-3 text-base text-slate-700">
              {(project.homesProposed || 0).toLocaleString()} Homes
              {acreage ? (
                <>
                  <span className="mx-2 text-slate-300">•</span>
                  {acreage.toLocaleString()} Acres
                </>
              ) : null}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {project.countyName || 'County not entered'}
            </p>
          </div>

          <SummaryCell label="Current Stage" value={currentStage} tone="amber" />
          <SummaryCell
            label="Case Number"
            value={project.caseNumber || project.parcelId || 'Not entered'}
            tone="blue"
          />
          <SummaryCell
            label="Last County Action"
            value={formatDate(project.latestUpdateDate) || 'Not entered'}
            tone="green"
          />
          <SummaryCell
            label="Next Expected Step"
            value={project.nextStep || 'Not entered'}
            tone="green"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="grid xl:grid-cols-[0.82fr_1.35fr_1.02fr]">
          <div className="border-b border-slate-200 p-6 xl:border-b-0 xl:border-r">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6f8b63]">
              Verified Milestones
            </p>
            <h2 className="mt-2 text-xl font-bold">Project Timeline</h2>

            <div className="mt-7">
              {timeline.length ? (
                timeline.map((stage, index) => {
                  const state = normalizeStage(stage.stageStatus)
                  return (
                    <article
                      key={`${stage.title}-${index}`}
                      className={`relative pl-11 ${index < timeline.length - 1 ? 'pb-7' : ''}`}
                    >
                      {index < timeline.length - 1 && (
                        <span
                          className={`absolute left-[15px] top-8 h-[calc(100%-1rem)] w-px ${
                            state === 'complete' ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        />
                      )}
                      <span
                        className={`absolute left-0 top-0 grid h-8 w-8 place-items-center rounded-full text-xs font-bold ring-4 ring-white ${
                          state === 'complete'
                            ? 'bg-emerald-600 text-white'
                            : state === 'current'
                              ? 'bg-amber-400 text-[#142033]'
                              : 'border border-slate-300 bg-white text-slate-500'
                        }`}
                      >
                        {state === 'complete' ? '✓' : index + 1}
                      </span>

                      <div
                        className={
                          state === 'current'
                            ? 'rounded-xl border border-amber-300 bg-amber-50 p-4'
                            : 'pt-1'
                        }
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-bold">{stage.title}</h3>
                          {state === 'current' && (
                            <span className="rounded-md border border-amber-400 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                              Current
                            </span>
                          )}
                        </div>
                        {stage.date && (
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {formatDate(stage.date)}
                          </p>
                        )}
                        {stage.description && (
                          <p className="mt-2 text-xs leading-5 text-slate-600">
                            {stage.description}
                          </p>
                        )}
                      </div>
                    </article>
                  )
                })
              ) : (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  No verified milestones have been entered.
                </p>
              )}
            </div>
          </div>

          <div className="border-b border-slate-200 p-6 xl:border-b-0 xl:border-r">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6f8b63]">
              Interactive Plans
            </p>
            <h2 className="mt-2 text-xl font-bold">Site Graphics</h2>
            <p className="mt-1 text-sm text-slate-500">
              Select a graphic, then open it for full-resolution zoom.
            </p>
            {graphicsMessage && (
              <p className="mt-2 text-xs font-semibold text-slate-500">
                {graphicsMessage}
              </p>
            )}

            {selectedGraphic?.imageUrl ? (
              <button
                type="button"
                onClick={() => setViewerOpen(true)}
                className="group relative mt-5 block w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
              >
                <img
                  src={selectedGraphic.imageUrl}
                  alt={selectedGraphic.imageAlt || selectedGraphic.title}
                  className="aspect-[4/3] w-full object-contain"
                />
                <span className="absolute right-4 top-4 rounded-lg bg-white/95 px-3 py-2 text-xs font-bold shadow">
                  Open & Zoom
                </span>
              </button>
            ) : (
              <div className="mt-5 grid aspect-[4/3] place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="text-sm text-slate-600">
                  {liveGraphics.length > 0
                    ? 'Graphic records were found, but their image field is not linked.'
                    : 'No public graphics uploaded yet.'}
                </p>
              </div>
            )}

            {liveGraphics.length > 0 && (
              <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6 xl:grid-cols-3 2xl:grid-cols-6">
                {liveGraphics.slice(0, 6).map((graphic, index) => (
                  <button
                    key={graphic._id}
                    type="button"
                    onClick={() => setGraphicIndex(index)}
                    className={`overflow-hidden rounded-lg border text-left ${
                      graphicIndex === index
                        ? 'border-blue-600 ring-2 ring-blue-100'
                        : 'border-slate-200'
                    }`}
                  >
                    {graphic.imageUrl ? (
                      <img
                        src={graphic.imageUrl}
                        alt={graphic.imageAlt || graphic.title}
                        className="aspect-square w-full object-cover"
                      />
                    ) : (
                      <div className="aspect-square bg-slate-100" />
                    )}
                    <p className="truncate px-2 py-2 text-[11px] font-semibold">
                      {graphic.category || graphic.title}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-6">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6f8b63]">
              Public Record
            </p>
            <h2 className="mt-2 text-xl font-bold">News & Updates</h2>

            <div className="mt-4 flex flex-wrap gap-2">
              {(['all', 'official', 'news'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`rounded-lg px-3 py-2 text-xs font-bold ${
                    filter === value
                      ? 'bg-[#142033] text-white'
                      : 'border border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  {value === 'all'
                    ? 'All'
                    : value === 'official'
                      ? 'Official Records'
                      : 'News Coverage'}
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-3">
              {displayUpdates.length ? (
                displayUpdates.slice(0, 8).map((update) => (
                  <article
                    key={update._id}
                    className="rounded-xl border border-slate-200 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs font-semibold text-slate-500">
                        {formatDate(update.date) || 'Update'}
                      </p>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                          update.kind === 'news'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {update.sourceLabel}
                      </span>
                    </div>
                    <h3 className="mt-3 font-bold leading-snug">{update.title}</h3>
                    {update.summary && (
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {update.summary}
                      </p>
                    )}
                    {update.sourceUrl && (
                      <a
                        href={update.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex text-xs font-bold text-blue-700 hover:underline"
                      >
                        Open source ↗
                      </a>
                    )}
                  </article>
                ))
              ) : (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  No updates in this category.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {viewerOpen && selectedGraphic && (
        <GraphicViewer
          items={graphics}
          startIndex={graphicIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  )
}

function SummaryCell({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'amber' | 'blue' | 'green'
}) {
  const dot =
    tone === 'amber'
      ? 'bg-amber-400'
      : tone === 'blue'
        ? 'bg-blue-500'
        : 'bg-emerald-500'

  return (
    <div className="border-b border-slate-200 p-5 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <div className="mt-3 flex items-start gap-3">
        <span className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${dot}`} />
        <p className="font-bold leading-snug">{value}</p>
      </div>
    </div>
  )
}
