import {Header} from '@/components/Header'
import {Footer} from '@/components/Footer'
import {PageHero} from '@/components/PageHero'
import {MeetingList} from '@/components/MeetingList'
import {getUpcomingMeetings, getRecentMeetings} from '@/lib/queries'

export default async function MeetingsPage() {
  const [upcoming, recent] = await Promise.all([getUpcomingMeetings(20), getRecentMeetings(20)])
  return (
    <main className="min-h-screen bg-[#f3f5f2] text-[#142033]">
      <Header />
      <section className="mx-auto max-w-6xl space-y-10 px-6 py-10">
        <PageHero eyebrow="Meetings" title="Development Meetings" description="Upcoming and recent public meetings connected to tracked developments." />
        <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200"><MeetingList meetings={upcoming} title="Upcoming Meetings" /></section>
        <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200"><MeetingList meetings={recent} title="Recent Meetings" /></section>
      </section>
      <Footer />
    </main>
  )
}
