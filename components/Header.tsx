import Link from 'next/link'
import {navigation} from '@/site.config'
import {MobileNav} from './MobileNav'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-[#0b5a35] text-lg font-black text-white">CF</div>
          <div>
            <div className="text-sm font-black tracking-wide text-[#142033]">CAPE FEAR</div>
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Development Tracker</div>
          </div>
        </Link>
        <nav className="hidden gap-7 text-sm font-semibold text-slate-700 md:flex">
          {navigation.map((item) => <Link key={item.href} href={item.href} className="hover:text-[#0b5a35]">{item.label}</Link>)}
        </nav>
        <MobileNav />
      </div>
    </header>
  )
}
