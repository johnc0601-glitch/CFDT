import type {Project} from '@/types/project'

export function InPlainEnglish({project}: {project: Project}) {
  const siteAcres = project.siteAcres ?? project.totalSiteAcres

  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-2xl font-semibold">In Plain English</h2>

      <p className="mt-4 leading-7 text-slate-700">
        {project.summary ||
          `${project.name} is a tracked development project. Add a public summary in Sanity to explain what is proposed, where it is located, and what stage it is in.`}
      </p>

      <div className="mt-6 rounded-2xl bg-[#eef6ee] p-5">
        <h3 className="font-semibold">Why It Matters</h3>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
          {project.homesProposed && <p>🏠 Adds {project.homesProposed.toLocaleString()} homes</p>}
          {siteAcres && <p>🌳 Covers {siteAcres.toLocaleString()} acres</p>}
          {project.waterProvider && <p>💧 Water: {project.waterProvider}</p>}
          {project.sewerProvider && <p>🚰 Sewer: {project.sewerProvider}</p>}
          {project.status && <p>📍 Status: {project.status}</p>}
          {project.developer && <p>👤 Developer: {project.developer}</p>}
        </div>
      </div>
    </section>
  )
}
