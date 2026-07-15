'use client'

import Link from 'next/link'
import {useState} from 'react'
import {navigation} from '@/site.config'

export function MobileNav() {
  const [open, setOpen] = useState(false)
  return (
    <div className="md:hidden">
      <button type="button" onClick={() => setOpen((value) => !value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold" aria-expanded={open}>
        Menu
      </button>
      {open && (
        <div className="absolute left-4 right-4 top-[68px] z-50 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200">
          <nav className="grid gap-2">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  )
}
