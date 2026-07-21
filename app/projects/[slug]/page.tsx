import {notFound} from 'next/navigation'
import {Header} from '@/components/Header'
import {Footer} from '@/components/Footer'
import {Timeline} from '@/components/Timeline'
import {ResourceGrid} from '@/components/ResourceGrid'
import {GraphicGallery} from '@/components/GraphicGallery'
import {DocumentList} from '@/components/DocumentList'
import {Tabs} from '@/components/Tabs'
import {ProjectDashboard} from '@/components/ProjectDashboard'
import {
  getProjectBySlug,
  getMediaByProjectSlug,
  getDocumentsByProjectSlug,
  getUpdatesByProjectSlug,
} from '@/lib/queries'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Props = {
  params: Promise<{slug: string}>
}

export default async function ProjectPage({params}: Props) {
  const {slug} = await params

  const [project, graphics, documents, updates] = await Promise.all([
    getProjectBySlug(slug),
    getMediaByProjectSlug(slug),
    getDocumentsByProjectSlug(slug),
    getUpdatesByProjectSlug(slug),
  ])

  if (!project) notFound()

  return (
    <main className="min-h-screen bg-[#f3f5f2] text-[#142033]">
      <Header />

      <section className="mx-auto max-w-[1500px] space-y-10 px-4 py-6 md:px-6 md:py-10">
        <ProjectDashboard project={project} graphics={graphics} updates={updates} />

        <Tabs
          tabs={[
            {
              label: 'Overview',
              content: (
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <h2 className="text-2xl font-semibold">Latest Update</h2>
                    {project.latestUpdateDate && (
                      <p className="mt-3 text-sm font-bold uppercase tracking-widest text-[#6f8b63]">
                        {project.latestUpdateDate}
                      </p>
                    )}
                    <p className="mt-3 text-slate-600">
                      {project.latestUpdate || 'No public update entered yet.'}
                    </p>
                  </div>

                  <div>
                    <h2 className="text-2xl font-semibold">Project Details</h2>
                    <dl className="mt-5 space-y-3 text-sm">
                      {project.developer && (
                        <div>
                          <dt className="font-bold">Developer / Applicant</dt>
                          <dd>{project.developer}</dd>
                        </div>
                      )}
                      {project.engineer && (
                        <div>
                          <dt className="font-bold">Engineer / Planner</dt>
                          <dd>{project.engineer}</dd>
                        </div>
                      )}
                      {project.projectType && (
                        <div>
                          <dt className="font-bold">Project Type</dt>
                          <dd>{project.projectType}</dd>
                        </div>
                      )}
                      {project.parcelId && (
                        <div>
                          <dt className="font-bold">Parcel ID</dt>
                          <dd>{project.parcelId}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              ),
            },
            {label: 'Timeline', content: <Timeline timeline={project.timeline} countyName={project.countyName} projectType={project.projectType} />},
            {
              label: 'Graphics',
              content: <GraphicGallery graphics={graphics} />,
            },
            {label: 'Documents', content: <DocumentList documents={documents} />},
            {label: 'Resources', content: <ResourceGrid resources={project.officialResources} />},
          ]}
        />
      </section>

      <Footer />
    </main>
  )
}
