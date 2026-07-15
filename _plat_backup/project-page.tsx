import {notFound} from 'next/navigation'
import {Header} from '@/components/Header'
import {Footer} from '@/components/Footer'
import {StatusBadge} from '@/components/StatusBadge'
import {FactCard} from '@/components/FactCard'
import {Timeline} from '@/components/Timeline'
import {ResourceGrid} from '@/components/ResourceGrid'
import {PageHero} from '@/components/PageHero'
import {GraphicGallery} from '@/components/GraphicGallery'
import {DocumentList} from '@/components/DocumentList'
import {Tabs} from '@/components/Tabs'
import {HiltonBluffsPlat} from '@/components/HiltonBluffsPlat'
import {
  getProjectBySlug,
  getMediaByProjectSlug,
  getDocumentsByProjectSlug,
} from '@/lib/queries'

type Props = {
  params: Promise<{slug: string}>
}

export default async function ProjectPage({params}: Props) {
  const {slug} = await params

  const [project, graphics, documents] = await Promise.all([
    getProjectBySlug(slug),
    getMediaByProjectSlug(slug),
    getDocumentsByProjectSlug(slug),
  ])

  if (!project) notFound()

  const siteAcres = project.siteAcres ?? project.totalSiteAcres

  return (
    <main className="min-h-screen bg-[#f3f5f2] text-[#142033]">
      <Header />

      <section className="mx-auto max-w-6xl space-y-10 px-6 py-10">
        <PageHero
          eyebrow="Development"
          title={project.name}
          description={project.summary}
        >
          <StatusBadge status={project.status} />
        </PageHero>

        <section className="grid gap-5 md:grid-cols-4">
          <FactCard label="Homes Proposed" value={project.homesProposed} />
          <FactCard label="Site Acres" value={siteAcres} />
          <FactCard label="County" value={project.countyName} />
          <FactCard label="Approving Authority" value={project.approvingAuthority} />
        </section>

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
            {label: 'Timeline', content: <Timeline timeline={project.timeline} />},
            {
              label: 'Graphics',
              content: (
                <div className="space-y-8">
                  {slug === 'hilton-bluffs' && <HiltonBluffsPlat />}
                  <GraphicGallery graphics={graphics} />
                </div>
              ),
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
