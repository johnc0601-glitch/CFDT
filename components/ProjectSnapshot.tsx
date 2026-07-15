import type {Project} from '@/types/project'
import type {Meeting} from '@/types/meeting'

function nextMeeting(meetings: Meeting[]) {
  const now = new Date()
  return meetings
    .filter((meeting) => meeting.meetingDate && new Date(meeting.meetingDate) >= now)
    .sort((a, b) => new Date(a.meetingDate || '').getTime() - new Date(b.meetingDate || '').getTime())[0]
}

export function ProjectSnapshot({
  project,
  meetings,
}: {
  project: Project
  meetings: Meeting[]
}) {
  const meeting = nextMeeting(meetings)
  const siteAcres = project.siteAcres ?? project.totalSiteAcres

  const items = [
    {label: 'Status', value: project.status},
    {label: 'Next Meeting', value: meeting?.meetingDate},
    {label: 'Homes', value: project.homesProposed?.toLocaleString()},
    {label: 'Acres', value: siteAcres?.toLocaleString()},
    {label: 'Developer', value: project.developer},
    {label: 'Last Updated', value: project.latestUpdateDate},
    {label: 'Engineer', value: project.engineer},
    {label: 'County', value: project.countyName},
  ].filter((item) => item.value)

  return (
    <aside className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-black uppercase tracking-widest text-[#0b5a35]">
        Project Snapshot
      </p>

      <div className="mt-5 grid gap-0 overflow-hidden rounded-2xl border border-slate-200 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="border-b border-r border-slate-200 p-4 last:border-b-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              {item.label}
            </p>
            <p className="mt-1 font-semibold text-[#142033]">{item.value}</p>
          </div>
        ))}
      </div>

      <a
        href="#documents"
        className="mt-5 block rounded-xl border border-[#0b5a35] px-4 py-3 text-center text-sm font-bold text-[#0b5a35]"
      >
        View Project Documents
      </a>
    </aside>
  )
}
