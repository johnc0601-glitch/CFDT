'use client'

import {useCallback, useEffect, useMemo, useState} from 'react'
import Link from 'next/link'
import {GraphicViewer} from '@/components/GraphicViewer'
import {HiltonBluffsPlanButton} from '@/components/HiltonBluffsPlanButton'
import {getCountyWorkflow} from '@/lib/countyWorkflows'
import type {Project} from '@/types/project'
import type {ProjectMedia} from '@/types/projectMedia'
import type {ProjectUpdate} from '@/types/projectUpdate'

type UpdateKind = 'official' | 'news'
type TimelineStage = NonNullable<Project['timeline']>[number]

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

function normalizedText(value?: string | null) {
  return value?.trim().toLowerCase() || ''
}

function findTimelineMatch(stageTitle: string, timeline: TimelineStage[]) {
  const title = normalizedText(stageTitle)
  const words = title.split(/\s+/).filter((word) => word.length > 3)

  return timeline.find((item) => {
    const candidate = normalizedText(item.title)
    if (candidate === title) return true
    return words.some((word) => candidate.includes(word))
  })
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

function hasMapPoint(project: Project) {
  return Number.isFinite(project.latitude) && Number.isFinite(project.longitude)
}

function osmEmbedUrl(latitude: number, longitude: number) {
  const spread = 0.025
  const params = new URLSearchParams({
    bbox: [
      longitude - spread,
      latitude - spread,
      longitude + spread,
      latitude + spread,
    ].join(','),
    layer: 'mapnik',
    marker: `${latitude},${longitude}`,
  })

  return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`
}

function googleMapsUrl(latitude: number, longitude: number) {
  const params = new URLSearchParams({
    api: '1',
    query: `${latitude},${longitude}`,
  })

  return `https://www.google.com/maps/search/?${params.toString()}`
}

function countyGis(project: Project) {
  const county = project.countyName?.toLowerCase() || ''
  if (county.includes('new hanover')) {
    return {label: 'New Hanover GIS', url: 'https://gis.nhcgov.com/'}
  }
  if (county.includes('brunswick')) {
    return {label: 'Brunswick GIS', url: 'https://experience.arcgis.com/experience/0201d27723244840aea67c9f85892953'}
  }
  return {label: 'Pender GIS', url: 'https://gis.pendercountync.gov/maps/'}
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
  const [graphicTitle, setGraphicTitle] = useState('')
  const [graphicsBusy, setGraphicsBusy] = useState(false)
  const [showAdminControls, setShowAdminControls] = useState(false)

  const projectSlug =
    typeof project.slug === 'string'
      ? project.slug
      : project.slug?.current || ''

  const loadLiveGraphics = useCallback(
    async (options?: {quiet?: boolean}) => {
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

        const nextGraphics = Array.isArray(result.graphics)
          ? result.graphics
          : []

        setLiveGraphics(nextGraphics)
        setGraphicIndex((current) =>
          nextGraphics.length
            ? Math.min(current, nextGraphics.length - 1)
            : 0,
        )

        if (!options?.quiet) {
          setGraphicsMessage(
            `${result.count || 0} live graphic${
              result.count === 1 ? '' : 's'
            } loaded.`,
          )
        }
      } catch (error) {
        setGraphicsMessage(
          error instanceof Error
            ? error.message
            : 'Could not refresh project graphics.',
        )
      }
    },
    [projectSlug],
  )

  useEffect(() => {
    void loadLiveGraphics()
  }, [loadLiveGraphics])

  useEffect(() => {
    const host = window.location.hostname
    setShowAdminControls(host === 'localhost' || host === '127.0.0.1')
  }, [])

  const selectedGraphic = liveGraphics[graphicIndex]
  const heroGraphic =
    liveGraphics.find((graphic) => graphic.category?.toLowerCase() === 'hero') ||
    liveGraphics[0]

  useEffect(() => {
    setGraphicTitle(selectedGraphic?.title || '')
  }, [selectedGraphic?._id, selectedGraphic?.title])

  const timeline = project.timeline || []
  const countyWorkflow = getCountyWorkflow(project.countyName, project.projectType)
  const dashboardTimeline: TimelineStage[] = countyWorkflow.length
    ? countyWorkflow.map((stage) => {
        const match = findTimelineMatch(stage.title, timeline)
        return {
          title: stage.title,
          description: match?.description || stage.description,
          date: match?.date,
          stageStatus: match?.stageStatus || 'Future',
        }
      })
    : timeline
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

  const acreage =
    project.buildableAcres ??
    project.siteAcres ??
    project.totalSiteAcres ??
    project.totalPropertyAcres
  const explicitDensity =
    typeof project.densityUnitsPerAcre === 'number'
      ? project.densityUnitsPerAcre
      : undefined
  const density =
    explicitDensity ??
    (project.homesProposed && acreage ? project.homesProposed / acreage : undefined)
  const proposedTrafficTrips =
    project.trafficMetrics?.dailyTrips ??
    (typeof project.estimatedWeekdayVehicleTrips === 'number'
      ? project.estimatedWeekdayVehicleTrips
      : undefined)
  const housingMix = [
    ['Single-family detached', project.singleFamilyDetachedUnits],
    ['Townhomes / attached', project.singleFamilyAttachedUnits],
    ['Multifamily', project.multifamilyUnits],
  ].filter(([, value]) => typeof value === 'number' && value > 0) as [string, number][]

  async function renameSelectedGraphic() {
    if (!projectSlug || !selectedGraphic?._id) return
    const title = graphicTitle.trim()
    if (!title) {
      setGraphicsMessage('Enter a graphic title.')
      return
    }

    setGraphicsBusy(true)
    setGraphicsMessage('Renaming graphic...')

    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectSlug)}/graphics`,
        {
          method: 'PATCH',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({graphicId: selectedGraphic._id, title}),
        },
      )
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Could not rename graphic.')
      }

      await loadLiveGraphics({quiet: true})
      setGraphicsMessage('Graphic renamed.')
    } catch (error) {
      setGraphicsMessage(
        error instanceof Error ? error.message : 'Could not rename graphic.',
      )
    } finally {
      setGraphicsBusy(false)
    }
  }

  async function deleteSelectedGraphic() {
    if (!projectSlug || !selectedGraphic?._id) return

    const confirmed = window.confirm(
      `Delete "${selectedGraphic.title}" from this project?`,
    )
    if (!confirmed) return

    setGraphicsBusy(true)
    setGraphicsMessage('Deleting graphic...')

    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectSlug)}/graphics`,
        {
          method: 'DELETE',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({graphicId: selectedGraphic._id}),
        },
      )
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Could not delete graphic.')
      }

      setGraphicIndex(0)
      await loadLiveGraphics({quiet: true})
      setGraphicsMessage('Graphic deleted.')
    } catch (error) {
      setGraphicsMessage(
        error instanceof Error ? error.message : 'Could not delete graphic.',
      )
    } finally {
      setGraphicsBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="grid">
          <div>
            <div>
            {heroGraphic?.imageUrl && (
              <img
                src={heroGraphic.imageUrl}
                alt={heroGraphic.imageAlt || heroGraphic.title || project.name}
                className="h-[260px] w-full bg-slate-100 object-cover md:h-[340px] xl:h-[420px]"
              />
            )}
            <div className="p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6f8b63]">
              Development
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#142033] xl:text-4xl">
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
            <p className="mt-5 max-w-5xl text-base leading-7 text-slate-700">
              {project.summary || 'A plain-English project summary has not been entered yet.'}
            </p>
            {(projectSlug === 'hilton-bluffs' || (showAdminControls && projectSlug)) && (
              <div className="mt-5 flex flex-wrap gap-3">
                {projectSlug === 'hilton-bluffs' && <HiltonBluffsPlanButton />}
                {showAdminControls && projectSlug && (
                  <Link
                    href={`/admin/projects/${projectSlug}/edit`}
                    className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-[#244f73]"
                  >
                    Edit development
                  </Link>
                )}
              </div>
            )}
            </div>
            </div>
          </div>

          <div className="grid border-t border-slate-200 md:grid-cols-4">
            <SummaryCell
              label="Homes Proposed"
              value={(project.homesProposed || 0).toLocaleString()}
              tone="amber"
            />
            <SummaryCell
              label="Acres"
              value={acreage ? acreage.toLocaleString() : 'Not entered'}
              tone="blue"
            />
            <SummaryCell
              label="Density"
              value={density ? `${density.toFixed(2)} units/ac` : 'Not entered'}
              tone="slate"
            />
            <SummaryCell
              label="Daily Vehicle Trips"
              value={proposedTrafficTrips ? proposedTrafficTrips.toLocaleString() : 'Not entered'}
              tone="rose"
            />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="grid xl:grid-cols-[0.82fr_1.35fr_1.02fr]">
          <div className="border-b border-slate-200 p-6 xl:border-b-0 xl:border-r">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6f8b63]">
              {countyWorkflow.length
                ? `${project.countyName || 'County'} Process`
                : 'Verified Milestones'}
            </p>
            <h2 className="mt-2 text-xl font-bold">Approval Timeline</h2>
            {countyWorkflow.length > 0 && (
              <p className="mt-2 text-sm leading-6 text-slate-500">
                County process steps with project-specific milestones overlaid.
              </p>
            )}

            <div className="mt-7">
              {dashboardTimeline.length ? (
                dashboardTimeline.map((stage, index) => {
                  const state = normalizeStage(stage.stageStatus)
                  return (
                    <article
                      key={`${stage.title}-${index}`}
                      className={`relative pl-11 ${index < dashboardTimeline.length - 1 ? 'pb-7' : ''}`}
                    >
                      {index < dashboardTimeline.length - 1 && (
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

            {showAdminControls && selectedGraphic && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  Graphic tools
                </p>
                <label className="mt-3 block">
                  <span className="text-xs font-bold text-slate-600">
                    Graphic title
                  </span>
                  <input
                    value={graphicTitle}
                    onChange={(event) => setGraphicTitle(event.target.value)}
                    className="mt-2 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                  />
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void renameSelectedGraphic()}
                    disabled={graphicsBusy}
                    className="rounded-lg bg-[#244f73] px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
                  >
                    Rename graphic
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteSelectedGraphic()}
                    disabled={graphicsBusy}
                    className="rounded-lg border border-red-300 px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-40"
                  >
                    Delete graphic
                  </button>
                </div>
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

      {hasMapPoint(project) && (
        <LocationMap project={project} />
      )}

      {viewerOpen && selectedGraphic && (
        <GraphicViewer
          items={liveGraphics}
          startIndex={graphicIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  )
}

function LocationMap({project}: {project: Project}) {
  const latitude = project.latitude as number
  const longitude = project.longitude as number
  const officialGis = countyGis(project)
  const hasPlanningContext = Boolean(
    project.approvingAuthority || project.parcelAcres || project.currentZoning?.length ||
    project.floodZones?.length || project.waterProvider || project.sewerProvider,
  )

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="grid gap-0 lg:grid-cols-[1.35fr_0.85fr]">
        <div className="min-h-[360px] bg-slate-100">
          <iframe
            title={`${project.name} location map`}
            src={osmEmbedUrl(latitude, longitude)}
            className="h-[360px] w-full border-0"
            loading="lazy"
          />
        </div>
        <div className="p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6f8b63]">
            Location Reference
          </p>
          <h2 className="mt-2 text-xl font-bold">Project Map</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Use the map to zoom, pan, and understand nearby roads. {officialGis.label}
            {' '}remains the official parcel source.
          </p>
          {project.locationDescription && (
            <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {project.locationDescription}
            </p>
          )}
          <div className="mt-4 grid gap-2 text-sm">
            <div className="rounded-lg border border-slate-200 px-3 py-2">
              <span className="font-bold">Coordinates:</span>{' '}
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </div>
            {project.parcelId && (
              <div className="rounded-lg border border-slate-200 px-3 py-2">
                <span className="font-bold">Parcel PINs:</span>{' '}
                {project.parcelId}
              </div>
            )}
          </div>
          {hasPlanningContext && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                Official planning context
              </p>
              <dl className="mt-3 grid gap-2 text-sm">
                {project.approvingAuthority && <ContextRow label="Approving authority" value={project.approvingAuthority} />}
                {project.parcelAcres && <ContextRow label="Parcel acreage" value={project.parcelAcres.toLocaleString()} />}
                {project.municipalityName && <ContextRow label="Jurisdiction" value={project.municipalityName} />}
                {project.currentZoning?.length && <ContextRow label="Parcel zoning intersections" value={project.currentZoning.join(', ')} />}
                {project.floodZones?.length && <ContextRow label="Flood-zone intersection" value={project.floodZones.join(', ')} />}
                {project.waterProvider && <ContextRow label="Water guidance" value={project.waterProvider} />}
                {project.sewerProvider && <ContextRow label="Sewer guidance" value={project.sewerProvider} />}
              </dl>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Project zoning comes from the planning record. GIS intersections describe the full matched parcel and are informational, not legal surveys.
              </p>
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={googleMapsUrl(latitude, longitude)}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-[#244f73] px-4 py-2 text-sm font-bold text-white"
            >
              Open in Google Maps
            </a>
            <a
              href={officialGis.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-[#244f73]"
            >
              Open {officialGis.label}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

function ContextRow({label, value}: {label: string; value: string}) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3">
      <dt className="font-semibold text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-800">{value}</dd>
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
  tone: 'amber' | 'blue' | 'green' | 'slate' | 'rose'
}) {
  const dot =
    tone === 'amber'
      ? 'bg-amber-400'
      : tone === 'blue'
        ? 'bg-blue-500'
        : tone === 'slate'
          ? 'bg-slate-500'
          : tone === 'rose'
            ? 'bg-rose-500'
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
