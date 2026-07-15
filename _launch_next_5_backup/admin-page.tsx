import {Header} from '@/components/Header'
import {Footer} from '@/components/Footer'
import {PageHero} from '@/components/PageHero'
import {AdminPanel} from '@/components/AdminPanel'
import {SearchBox} from '@/components/SearchBox'
import {DashboardSummary} from '@/components/DashboardSummary'
import {MeetingList} from '@/components/MeetingList'
import {IntakeList} from '@/components/IntakeList'
import {getAllProjects, getUpcomingMeetings, getProjectIntakes} from '@/lib/queries'

export default async function AdminPage() {
  const [projects, meetings, intakes] = await Promise.all([
    getAllProjects(),
    getUpcomingMeetings(5),
    getProjectIntakes(10),
  ])

  return (
    <main className="min-h-screen bg-[#f3f5f2] text-[#142033]">
      <Header />
      <section className="mx-auto max-w-6xl space-y-10 px-6 py-10">
        <PageHero eyebrow="Workspace" title="CFDT Workspace" description="Maintain development records, review intake drafts, and check missing content." />
        <DashboardSummary projects={projects} />
        <AdminPanel projects={projects} />
        <IntakeList intakes={intakes} />
        <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200"><MeetingList meetings={meetings} title="Upcoming Meetings" /></section>
        <section><h2 className="text-2xl font-semibold">Development Records</h2><div className="mt-6"><SearchBox projects={projects} /></div></section>
      </section>
      <Footer />
    </main>
  )
}
