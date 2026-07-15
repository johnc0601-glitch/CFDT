import {Header} from '@/components/Header'
import {Footer} from '@/components/Footer'
import {PageHero} from '@/components/PageHero'
import {getDevelopers} from '@/lib/queries'

export default async function DevelopersPage() {
  const developers = await getDevelopers()

  return (
    <main className="min-h-screen bg-[#f3f5f2] text-[#142033]">
      <Header />

      <section className="mx-auto max-w-6xl space-y-10 px-6 py-10">
        <PageHero eyebrow="Developers" title="Developer Index" description="Summary of developers associated with tracked development records." />

        <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          {developers.length === 0 ? (
            <p className="text-slate-600">No developers found yet.</p>
          ) : (
            <div className="divide-y divide-slate-200">
              {developers.map((item) => (
                <div key={item.developer} className="flex flex-col gap-2 py-5 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{item.developer}</h2>
                    <p className="text-sm text-slate-600">{item.count} development record{item.count === 1 ? '' : 's'}</p>
                  </div>
                  <p className="font-semibold">{item.homes.toLocaleString()} homes proposed</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>

      <Footer />
    </main>
  )
}
