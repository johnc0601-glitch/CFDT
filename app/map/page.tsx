import {Header} from '@/components/Header'
import {Footer} from '@/components/Footer'
import {PageHero} from '@/components/PageHero'
import {ProjectMap} from '@/components/ProjectMap'
import {getAllProjects} from '@/lib/queries'

export default async function MapPage() {
  const projects = await getAllProjects()
  return (
    <main className="min-h-screen bg-[#f3f5f2] text-[#142033]">
      <Header />
      <section className="mx-auto max-w-6xl space-y-10 px-6 py-10">
        <PageHero eyebrow="Map" title="Development Map" description="Browse tracked developments visually. County GIS remains the source for parcel-level mapping." />
        <ProjectMap projects={projects} />
      </section>
      <Footer />
    </main>
  )
}
