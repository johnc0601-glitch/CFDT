'use client'

import {useState} from 'react'
import type {ProjectMedia} from '@/types/projectMedia'

export function ZoomableGraphic({item}: {item: ProjectMedia}) {
  const [open, setOpen] = useState(false)

  if (!item.imageUrl) {
    return (
      <div className="grid h-72 place-items-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-500">
        Image not uploaded
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block w-full overflow-hidden bg-slate-100 text-left"
      >
        <img
          src={item.imageUrl}
          alt={item.imageAlt || item.title}
          className="max-h-[760px] w-full object-contain transition duration-200 group-hover:scale-[1.01]"
        />
        <span className="absolute bottom-4 right-4 rounded-full bg-black/70 px-4 py-2 text-xs font-bold text-white">
          View Full Size
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={item.title}
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-5 top-5 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-900"
          >
            Close
          </button>

          <div
            className="max-h-[92vh] max-w-[96vw] overflow-auto rounded-xl bg-white p-3"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={item.imageUrl}
              alt={item.imageAlt || item.title}
              className="h-auto max-w-none"
            />
          </div>
        </div>
      )}
    </>
  )
}
