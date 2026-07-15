import Link from 'next/link'
import type {Meeting} from '@/types/meeting'

export function MeetingList({meetings, title = 'Meetings'}: {meetings: Meeting[]; title?: string}) {
  return (
    <section>
      <h2 className="text-2xl font-semibold">{title}</h2>
      {meetings.length === 0 ? (
        <p className="mt-4 text-slate-600">No meetings added yet.</p>
      ) : (
        <div className="mt-6 grid gap-4">
          {meetings.map((meeting) => (
            <article key={meeting._id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#6f8b63]">{meeting.meetingType || 'Meeting'}</p>
                  <h3 className="mt-2 text-xl font-semibold">{meeting.title}</h3>
                  {meeting.meetingDate && <p className="mt-1 text-sm text-slate-500">{meeting.meetingDate}</p>}
                  {meeting.location && <p className="mt-1 text-sm text-slate-500">{meeting.location}</p>}
                  {meeting.projectName && meeting.projectSlug && <Link href={`/projects/${meeting.projectSlug}`} className="mt-2 inline-block text-sm font-semibold text-[#244f73]">{meeting.projectName}</Link>}
                  {meeting.summary && <p className="mt-3 text-slate-600">{meeting.summary}</p>}
                  {meeting.result && <p className="mt-3 text-sm font-semibold">Result: {meeting.result}</p>}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {meeting.agendaUrl && <a className="rounded-xl bg-[#142033] px-4 py-2 text-sm font-semibold text-white" href={meeting.agendaUrl} target="_blank">Agenda</a>}
                  {meeting.packetUrl && <a className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-[#244f73]" href={meeting.packetUrl} target="_blank">Packet</a>}
                  {meeting.minutesUrl && <a className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-[#244f73]" href={meeting.minutesUrl} target="_blank">Minutes</a>}
                  {meeting.videoUrl && <a className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-[#244f73]" href={meeting.videoUrl} target="_blank">Video</a>}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
