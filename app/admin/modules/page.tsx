import Link from 'next/link'
import {Header} from '@/components/Header'
import {Footer} from '@/components/Footer'
import {getModuleManifest} from '@/lib/moduleManifest'

export default function ModuleManagerPage() {
  const manifest = getModuleManifest()
  const areas = [...new Set(manifest.modules.map((module) => module.area))]

  return (
    <main className="min-h-screen bg-[#f3f5f2] text-[#142033]">
      <Header />
      <section className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f8b63]">CFDT Platform</p>
              <h1 className="mt-2 text-3xl font-bold">Module Manager</h1>
              <p className="mt-3 max-w-2xl text-slate-600">The website manifest records what is installed so future upgrades do not depend on chat history.</p>
            </div>
            <Link href="/admin" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-[#244f73]">← Back to Workspace</Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="CFDT Version" value={manifest.platformVersion} />
            <Stat label="Installed Modules" value={String(manifest.modules.filter(m=>m.status==='installed').length)} />
            <Stat label="Manifest Version" value={manifest.manifestVersion} />
            <Stat label="Last Updated" value={manifest.updatedAt} />
          </div>
        </div>

        {areas.map((area) => (
          <section key={area}>
            <h2 className="text-xl font-bold">{area}</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {manifest.modules.filter(m=>m.area===area).map((module) => (
                <article key={module.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold">{module.name}</h3>
                      <p className="mt-1 text-xs font-semibold text-slate-500">Version {module.version}</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">{module.status}</span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{module.description}</p>
                  {module.route && <Link href={module.route} className="mt-5 inline-flex text-sm font-bold text-[#244f73] hover:underline">Open module →</Link>}
                </article>
              ))}
            </div>
          </section>
        ))}

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold">Change History</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <th className="py-3 pr-4">Date</th><th className="py-3 pr-4">Module</th><th className="py-3 pr-4">Version</th><th className="py-3 pr-4">Action</th><th className="py-3">Note</th>
              </tr></thead>
              <tbody>{manifest.history.map((item,index)=>(
                <tr key={`${item.module}-${index}`} className="border-b border-slate-100">
                  <td className="py-4 pr-4">{item.date}</td><td className="py-4 pr-4 font-semibold">{item.module}</td><td className="py-4 pr-4">{item.version}</td><td className="py-4 pr-4 capitalize">{item.action}</td><td className="py-4 text-slate-600">{item.note}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </section>
      </section>
      <Footer />
    </main>
  )
}

function Stat({label,value}:{label:string;value:string}) {
  return <div className="rounded-xl border border-slate-200 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>
}
