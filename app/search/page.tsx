import {Header} from '@/components/Header'
import {Footer} from '@/components/Footer'
import {PageHero} from '@/components/PageHero'
import {SearchBox} from '@/components/SearchBox'
import {getAllProjects} from '@/lib/queries'

export default async function SearchPage() {
  const projects = await getAllProjects()

  return (
    <main className="min-h-screen bg-[#f3f5f2] text-[#142033]">
      <Header />

      <section className="mx-auto max-w-6xl space-y-10 px-6 py-10">
        <PageHero eyebrow="Search" title="Find Developments" description="Search by development name, developer, county, project type, status, engineer, or parcel ID." />
        <SearchBox projects={projects} />
      </section>

      <Footer />
    </main>
  )
}
