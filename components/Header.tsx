import Link from 'next/link'
import {navigation} from '@/site.config'
import {MobileNav} from './MobileNav'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#dce5df] bg-[#fbfcfa]/95 backdrop-blur">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center bg-[#18372f] font-serif text-lg font-bold text-white">CF</div>
          <div>
            <div className="text-sm font-black tracking-wide text-[#10251f]">CAPE FEAR</div>
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#62756d]">Development Tracker</div>
          </div>
        </Link>
        <nav className="hidden gap-7 text-xs font-black uppercase tracking-wide text-[#62756d] md:flex">
          {navigation.map((item) => <Link key={item.href} href={item.href} className="hover:text-[#2f8a55]">{item.label}</Link>)}
        </nav>
        <MobileNav />
      </div>
    </header>
  )
}
