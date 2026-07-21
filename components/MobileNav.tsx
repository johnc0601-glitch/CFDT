'use client'

import Link from 'next/link'
import {useState} from 'react'
import {navigation} from '@/site.config'

export function MobileNav() {
  const [open, setOpen] = useState(false)
  return (
    <div className="md:hidden">
      <button type="button" onClick={() => setOpen((value) => !value)} className="border border-[#dce5df] px-3 py-2 text-xs font-black uppercase tracking-wide text-[#18372f]" aria-expanded={open}>
        Menu
      </button>
      {open && (
        <div className="absolute left-4 right-4 top-[68px] z-50 bg-white p-4 shadow-xl ring-1 ring-[#dce5df]">
          <nav className="grid gap-2">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="px-4 py-3 text-sm font-bold text-[#18372f] hover:bg-[#f5f7f3]">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  )
}
