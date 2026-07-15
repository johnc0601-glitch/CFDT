import type {Project} from '@/types/project'

function ageInDays(date?: string) {
  if (!date) return undefined
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return undefined
  return Math.floor((Date.now() - parsed.getTime()) / 86_400_000)
}

export function SourceFreshness({project}: {project: Project}) {
  const age = ageInDays(project.latestUpdateDate)
  const hasSources = Boolean(project.officialResources?.length)
  const stale = age !== undefined && age > 180

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="grid gap-4 text-sm md:grid-cols-3">
        <div>
          <p className="font-bold text-[#315127]">Official-source tracking</p>
          <p className="mt-1 text-slate-500">
            {hasSources ? 'Official links are attached to this record.' : 'Official links still need to be added.'}
          </p>
        </div>

        <div>
          <p className="font-bold text-[#244f73]">Latest verified update</p>
          <p className="mt-1 text-slate-500">
            {project.latestUpdateDate || 'Date not yet entered'}
          </p>
        </div>

        <div>
          <p className={`font-bold ${stale ? 'text-amber-600' : 'text-[#315127]'}`}>
            {stale ? 'Review recommended' : 'Current record'}
          </p>
          <p className="mt-1 text-slate-500">
            {age === undefined
              ? 'Update age is unknown.'
              : stale
                ? `${age} days since the latest verified update.`
                : `${age} days since the latest verified update.`}
          </p>
        </div>
      </div>
    </section>
  )
}
