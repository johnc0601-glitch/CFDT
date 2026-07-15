import Link from 'next/link'
import {Header} from '@/components/Header'
import {Footer} from '@/components/Footer'
import {PageHero} from '@/components/PageHero'
import {AdminPanel} from '@/components/AdminPanel'
import {SearchBox} from '@/components/SearchBox'
import {DashboardSummary} from '@/components/DashboardSummary'
import {MeetingList} from '@/components/MeetingList'
import {IntakeList} from '@/components/IntakeList'
import {ProjectBuilderPanel} from '@/components/ProjectBuilderPanel'
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

        <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f8b63]">One-step Intake</p>
              <h2 className="mt-2 text-2xl font-semibold">Project Intake Wizard</h2>
              <p className="mt-3 max-w-2xl text-slate-600">Split oversized PDFs, organize files, and upload the whole project package in one workflow.</p>
            </div>
            <Link href="/admin/intake-wizard" className="inline-flex rounded-xl bg-[#244f73] px-5 py-3 text-sm font-bold text-white">Open Intake Wizard →</Link>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f8b63]">Phase 2</p><h2 className="mt-2 text-2xl font-semibold">AI Project Importer</h2><p className="mt-3 max-w-2xl text-slate-600">Prepare standardized project packages from county records.</p></div>
            <Link href="/admin/importer" className="inline-flex rounded-xl bg-[#244f73] px-5 py-3 text-sm font-bold text-white">Open Importer →</Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Link href="/admin/graphics" className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-bold">Graphics Import</h2><p className="mt-2 text-sm leading-6 text-slate-600">Review AI-suggested plan sheets and publish approved graphics.</p><span className="mt-4 inline-flex text-sm font-bold text-[#244f73]">Open module →</span></Link>
          <Link href="/admin/documents" className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-bold">Documents Manager</h2><p className="mt-2 text-sm leading-6 text-slate-600">Official links and supporting records.</p><span className="mt-4 inline-flex text-sm font-bold text-[#244f73]">Open module →</span></Link>
          <Link href="/admin/timeline-updates" className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-bold">Timeline & Updates</h2><p className="mt-2 text-sm leading-6 text-slate-600">Verified milestones and public updates.</p><span className="mt-4 inline-flex text-sm font-bold text-[#244f73]">Open module →</span></Link>
          <Link href="/admin/county-data" className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-bold">County Data</h2><p className="mt-2 text-sm leading-6 text-slate-600">County totals and growth metrics.</p><span className="mt-4 inline-flex text-sm font-bold text-[#244f73]">Open module →</span></Link>
          <Link href="/admin/publish" className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-bold">Publish Manager</h2><p className="mt-2 text-sm leading-6 text-slate-600">Assemble reviewable project packages.</p><span className="mt-4 inline-flex text-sm font-bold text-[#244f73]">Open module →</span></Link>
          <Link href="/admin/traffic" className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-bold">Traffic Analysis</h2><p className="mt-2 text-sm leading-6 text-slate-600">TIA metrics, access, and improvements.</p><span className="mt-4 inline-flex text-sm font-bold text-[#244f73]">Open module →</span></Link>
        </section>

        <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f8b63]">Platform Management</p><h2 className="mt-2 text-2xl font-semibold">CFDT Module Manager</h2><p className="mt-3 max-w-2xl text-slate-600">Review installed modules, versions, routes, and change history.</p></div>
            <Link href="/admin/modules" className="inline-flex w-fit rounded-xl bg-[#244f73] px-5 py-3 text-sm font-bold text-white">Open Module Manager →</Link>
          </div>
        </section>
        <ProjectBuilderPanel />
        <AdminPanel projects={projects} />
        <IntakeList intakes={intakes} />
        <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200"><MeetingList meetings={meetings} title="Upcoming Meetings" /></section>
        <section><h2 className="text-2xl font-semibold">Development Records</h2><div className="mt-6"><SearchBox projects={projects} /></div></section>
      </section>
      <Footer />
    </main>
  )
}
