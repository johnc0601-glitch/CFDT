'use client'

import Link from 'next/link'
import {useEffect, useState} from 'react'

type Resource = {
  label?: string
  url?: string
}

type ProjectEditorData = {
  _id: string
  name: string
  slug?: string
  caseNumber?: string
  status?: string
  approvalStatus?: string
  projectType?: string
  homesProposed?: number
  homesApproved?: number
  homesBuilt?: number
  homesRemaining?: number
  singleFamilyDetachedUnits?: number
  singleFamilyAttachedUnits?: number
  multifamilyUnits?: number
  siteAcres?: number
  totalSiteAcres?: number
  developer?: string
  engineer?: string
  zoning?: string
  locationDescription?: string
  parcelId?: string
  parcelIds?: string[]
  parcelAcres?: number
  latitude?: number
  longitude?: number
  municipalityName?: string
  currentZoning?: string[]
  floodZones?: string[]
  possibleWetlands?: boolean
  waterProvider?: string
  sewerProvider?: string
  gisContext?: {status?: string; verifiedAt?: string; message?: string}
  countyName?: string
  summary?: string
  latestUpdateDate?: string
  latestUpdate?: string
  nextStep?: string
  officialResources?: Resource[]
}

const emptyProject: ProjectEditorData = {
  _id: '',
  name: '',
  officialResources: [],
}

function normalizeProject(project: ProjectEditorData): ProjectEditorData {
  return {
    ...emptyProject,
    ...project,
    siteAcres: project.siteAcres || project.totalSiteAcres,
    officialResources: Array.isArray(project.officialResources)
      ? project.officialResources
      : [],
  }
}

export function PublishedProjectEditor({slug}: {slug: string}) {
  const [project, setProject] = useState<ProjectEditorData>(emptyProject)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadProject() {
      setLoading(true)
      setMessage('')

      try {
        const response = await fetch(
          `/api/projects/${encodeURIComponent(slug)}/details`,
          {cache: 'no-store'},
        )
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Could not load project.')
        }

        if (!cancelled) {
          setProject(normalizeProject(result.project))
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error instanceof Error ? error.message : 'Could not load project.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadProject()

    return () => {
      cancelled = true
    }
  }, [slug])

  function update<K extends keyof ProjectEditorData>(
    field: K,
    value: ProjectEditorData[K],
  ) {
    setProject((current) => ({...current, [field]: value}))
  }

  function updateResource(index: number, patch: Partial<Resource>) {
    setProject((current) => ({
      ...current,
      officialResources: (current.officialResources || []).map((resource, itemIndex) =>
        itemIndex === index ? {...resource, ...patch} : resource,
      ),
    }))
  }

  function addResource() {
    setProject((current) => ({
      ...current,
      officialResources: [
        ...(current.officialResources || []),
        {label: '', url: ''},
      ],
    }))
  }

  function removeResource(index: number) {
    setProject((current) => ({
      ...current,
      officialResources: (current.officialResources || []).filter(
        (_resource, itemIndex) => itemIndex !== index,
      ),
    }))
  }

  async function saveProject() {
    if (!project._id) return

    setSaving(true)
    setMessage('Saving changes...')

    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(slug)}/details`,
        {
          method: 'PATCH',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(project),
        },
      )
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Could not save project.')
      }

      setMessage('Project saved.')
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not save project.',
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="font-semibold text-slate-600">Loading project editor...</p>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f8b63]">
              Published project
            </p>
            <h2 className="mt-2 text-2xl font-bold">Edit development</h2>
            <p className="mt-2 text-sm text-slate-600">
              Update public facts after the project has been created.
            </p>
          </div>
          <Link
            href={`/projects/${slug}`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold"
          >
            View project page
          </Link>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-xl font-bold">Core facts</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <TextField label="Project name" value={project.name} onChange={(value) => update('name', value)} />
          <TextField label="Case number" value={project.caseNumber} onChange={(value) => update('caseNumber', value)} />
          <TextField label="Status" value={project.status} onChange={(value) => update('status', value)} />
          <SelectField
            label="Approval designator"
            value={project.approvalStatus}
            options={['Pending', 'Approved', 'Partially approved', 'Denied', 'Built / completed']}
            onChange={(value) => update('approvalStatus', value)}
          />
          <TextField label="Project type" value={project.projectType} onChange={(value) => update('projectType', value)} />
          <NumberField label="Homes proposed" value={project.homesProposed} onChange={(value) => update('homesProposed', value)} />
          <NumberField label="Homes approved" value={project.homesApproved} onChange={(value) => update('homesApproved', value)} />
          <NumberField label="Homes built" value={project.homesBuilt} onChange={(value) => update('homesBuilt', value)} />
          <NumberField label="Homes remaining" value={project.homesRemaining} onChange={(value) => update('homesRemaining', value)} />
          <NumberField label="Single-family detached" value={project.singleFamilyDetachedUnits} onChange={(value) => update('singleFamilyDetachedUnits', value)} />
          <NumberField label="Townhomes / attached" value={project.singleFamilyAttachedUnits} onChange={(value) => update('singleFamilyAttachedUnits', value)} />
          <NumberField label="Multifamily" value={project.multifamilyUnits} onChange={(value) => update('multifamilyUnits', value)} />
          <NumberField label="Site acres" value={project.siteAcres} onChange={(value) => update('siteAcres', value)} />
          <TextField label="Developer / applicant" value={project.developer} onChange={(value) => update('developer', value)} />
          <TextField label="Engineer / planner" value={project.engineer} onChange={(value) => update('engineer', value)} />
          <TextField label="Zoning" value={project.zoning} onChange={(value) => update('zoning', value)} />
          <TextField label="Location" value={project.locationDescription} onChange={(value) => update('locationDescription', value)} />
          <TextField label="Parcel IDs" value={project.parcelIds?.join(', ') || project.parcelId} onChange={(value) => update('parcelIds', value.split(/[,;\n]+/).map((item) => item.trim()).filter(Boolean))} />
        </div>
        {project.gisContext && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-bold">Automatic parcel lookup: {project.gisContext.status}</p>
            <p className="mt-1">
              {project.parcelAcres ? `${project.parcelAcres.toLocaleString()} official parcel acres` : 'Parcel acreage unavailable'}
              {project.municipalityName ? ` | ${project.municipalityName}` : ''}
            </p>
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-xl font-bold">Mapping</h3>
        <p className="mt-2 text-sm text-slate-600">
          Use latitude and longitude to move the project marker. Updating parcel IDs may refresh county GIS details when the record is saved.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <NumberField label="Latitude" value={project.latitude} onChange={(value) => update('latitude', value)} step="any" />
          <NumberField label="Longitude" value={project.longitude} onChange={(value) => update('longitude', value)} step="any" />
          <NumberField label="Official parcel acres" value={project.parcelAcres} onChange={(value) => update('parcelAcres', value)} step="any" />
          <TextField label="Municipality / jurisdiction" value={project.municipalityName} onChange={(value) => update('municipalityName', value)} />
          <TextField label="Current zoning" value={project.currentZoning?.join(', ')} onChange={(value) => update('currentZoning', splitList(value))} />
          <TextField label="Flood zones" value={project.floodZones?.join(', ')} onChange={(value) => update('floodZones', splitList(value))} />
          <TextField label="Water provider" value={project.waterProvider} onChange={(value) => update('waterProvider', value)} />
          <TextField label="Sewer provider" value={project.sewerProvider} onChange={(value) => update('sewerProvider', value)} />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-xl font-bold">Public text</h3>
        <div className="mt-5 space-y-4">
          <TextArea label="Summary" value={project.summary} onChange={(value) => update('summary', value)} />
          <TextField label="Latest update date" type="date" value={project.latestUpdateDate} onChange={(value) => update('latestUpdateDate', value)} />
          <TextArea label="Latest update" value={project.latestUpdate} onChange={(value) => update('latestUpdate', value)} />
          <TextArea label="Next step" value={project.nextStep} onChange={(value) => update('nextStep', value)} />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold">Resources</h3>
            <p className="mt-1 text-sm text-slate-600">
              Use broad context links here, not project PDFs.
            </p>
          </div>
          <button
            type="button"
            onClick={addResource}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold"
          >
            Add resource
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {(project.officialResources || []).map((resource, index) => (
            <div key={index} className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[1fr_1.5fr_auto]">
              <TextField label="Label" value={resource.label} onChange={(value) => updateResource(index, {label: value})} />
              <TextField label="URL" value={resource.url} onChange={(value) => updateResource(index, {url: value})} />
              <button
                type="button"
                onClick={() => removeResource(index)}
                className="self-end rounded-lg border border-red-300 px-4 py-2 text-sm font-bold text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void saveProject()}
            disabled={saving}
            className="rounded-lg bg-[#244f73] px-5 py-3 font-bold text-white disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          {message && <p className="text-sm font-semibold text-slate-600">{message}</p>}
        </div>
      </section>
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value?: string
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <input
        type={type}
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"
      />
    </label>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value?: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <select
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"
      >
        <option value="">Not designated</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function NumberField({
  label,
  value,
  onChange,
  step = '1',
}: {
  label: string
  value?: number
  onChange: (value: number | undefined) => void
  step?: string
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <input
        type="number"
        step={step}
        value={value || ''}
        onChange={(event) =>
          onChange(event.target.value ? Number(event.target.value) : undefined)
        }
        className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"
      />
    </label>
  )
}

function splitList(value: string) {
  return value
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string
  value?: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <textarea
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-28 w-full rounded-lg border border-slate-300 p-3"
      />
    </label>
  )
}
