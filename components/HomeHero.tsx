import Link from 'next/link'
import type {Project} from '@/types/project'

export function HomeHero({featured}: {featured?: Project}) {
  return (
    <section className="overflow-hidden rounded-3xl bg-[#053f29] text-white shadow-sm">
      <div className="grid min-h-[480px] lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative z-10 flex flex-col justify-center p-8 md:p-12">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-100">Cape Fear Development Tracker</p>
          <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-tight md:text-7xl">Understand what&apos;s being built.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/85">
            Clear summaries, official documents, timelines, maps, and meeting information for major development projects across the Cape Fear region.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/search" className="rounded-xl bg-white px-5 py-3 font-bold text-[#053f29]">Search Developments</Link>
            <Link href="/counties/new-hanover" className="rounded-xl bg-white/10 px-5 py-3 font-bold text-white ring-1 ring-white/30">Browse New Hanover</Link>
          </div>
        </div>
        <div className="relative min-h-[320px] lg:min-h-full">
          {featured?.heroImageUrl ? (
            <img src={featured.heroImageUrl} alt={featured.heroImageAlt || featured.name} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#477454] via-[#2f6042] to-[#173f2b]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#053f29] via-transparent to-transparent lg:from-[#053f29]/80" />
          {featured && (
            <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-white/95 p-5 text-[#142033] shadow-lg backdrop-blur md:left-auto md:w-[360px]">
              <p className="text-xs font-bold uppercase tracking-widest text-[#6f8b63]">Featured Development</p>
              <h2 className="mt-2 text-2xl font-semibold">{featured.name}</h2>
              <p className="mt-2 text-sm text-slate-600">{featured.status || 'Status pending'}</p>
              {featured.slug?.current && <Link href={`/projects/${featured.slug.current}`} className="mt-4 inline-block font-bold text-[#0b5a35]">View project →</Link>}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
