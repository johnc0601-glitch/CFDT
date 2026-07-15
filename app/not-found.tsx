import Link from 'next/link'
import {Header} from '@/components/Header'
import {Footer} from '@/components/Footer'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#f3f5f2] text-[#142033]">
      <Header />
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-[#6f8b63]">404</p>
        <h1 className="mt-4 text-5xl font-semibold">Page not found</h1>
        <p className="mt-5 text-lg text-slate-600">
          The page may have moved, or the development record may not be published yet.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-xl bg-[#244f73] px-5 py-3 font-bold text-white">
            Return home
          </Link>
          <Link href="/search" className="rounded-xl bg-white px-5 py-3 font-bold ring-1 ring-slate-200">
            Search developments
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  )
}
