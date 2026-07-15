import type {Meeting} from '@/types/meeting'

export function NextAction({meetings}: {meetings: Meeting[]}) {
  const now = new Date()
  const upcoming = meetings
    .filter((meeting) => meeting.meetingDate && new Date(meeting.meetingDate) >= now)
    .sort((a, b) => new Date(a.meetingDate || '').getTime() - new Date(b.meetingDate || '').getTime())[0]

  if (!upcoming) return null

  return (
    <section className="rounded-2xl bg-[#142033] p-8 text-white shadow-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-[#cfe0e6]">Next Public Action</p>
      <h2 className="mt-3 text-2xl font-semibold">{upcoming.title}</h2>
      {upcoming.meetingDate && <p className="mt-2 text-white/80">{upcoming.meetingDate}</p>}
      {upcoming.location && <p className="mt-1 text-white/80">{upcoming.location}</p>}
      <div className="mt-5 flex flex-wrap gap-2">
        {upcoming.agendaUrl && <a className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#142033]" href={upcoming.agendaUrl} target="_blank">Agenda</a>}
        {upcoming.packetUrl && <a className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/30" href={upcoming.packetUrl} target="_blank">Packet</a>}
      </div>
    </section>
  )
}
