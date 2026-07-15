'use client'

import {useMemo, useState} from 'react'
import type {ProjectMedia} from '@/types/projectMedia'
import {GraphicViewer} from './GraphicViewer'

const sections = [
  ['Hero', ['Hero']],
  ['Location', ['Location']],
  ['Site Plan', ['Site Plan']],
  ['Existing Conditions', ['Existing Conditions']],
  ['Amenity Plan', ['Amenity Plan']],
  ['Landscape Plan', ['Landscape Plan']],
  ['Utility Plan', ['Utility Plan']],
  ['Lighting Plan', ['Lighting Plan']],
  ['Entrance Plan', ['Entrance Plan']],
  ['Traffic Exhibit', ['Traffic Exhibit']],
  ['Rendering', ['Rendering']],
  ['Photos', ['Photo']],
  ['Other', ['Other']],
] as const

export function ProjectGraphics({media}: {media: ProjectMedia[]}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const ordered = useMemo(() => {
    const result: ProjectMedia[] = []

    for (const [, categories] of sections) {
      result.push(
        ...media.filter((item) =>
          categories.includes((item.category || '') as never)
        )
      )
    }

    return result
  }, [media])

  const indexOf = (id: string) =>
    ordered.findIndex((item) => item._id === id)

  if (!media.length) {
    return (
      <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-3xl font-semibold">Project Graphics</h2>
        <p className="mt-4 text-slate-600">
          No project graphics have been added yet.
        </p>
      </section>
    )
  }

  return (
    <>
      <div className="space-y-8">
        {sections.map(([title, categories]) => {
          const items = media.filter((item) =>
            categories.includes((item.category || '') as never)
          )

          if (!items.length) return null

          return (
            <section
              key={title}
              className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8"
            >
              <h2 className="text-3xl font-semibold">{title}</h2>

              <div className="mt-6 grid gap-6">
                {items.map((item, itemIndex) => (
                  <article
                    key={item._id}
                    className="overflow-hidden rounded-2xl border border-slate-200"
                  >
                    <button
                      type="button"
                      onClick={() => setActiveIndex(indexOf(item._id))}
                      className="group relative block w-full bg-slate-100"
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.imageAlt || item.title}
                          className="max-h-[760px] w-full object-contain transition group-hover:scale-[1.005]"
                        />
                      ) : (
                        <div className="grid h-72 place-items-center text-sm font-semibold text-slate-500">
                          Image not uploaded
                        </div>
                      )}

                      <span className="absolute bottom-4 right-4 rounded-full bg-black/70 px-4 py-2 text-xs font-bold text-white">
                        View Full Size
                      </span>
                    </button>

                    <div className="p-6">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        Graphic {itemIndex + 1}
                      </p>

                      <h3 className="mt-2 text-2xl font-semibold">
                        {item.title}
                      </h3>

                      {item.caption && (
                        <p className="mt-2 font-medium text-slate-700">
                          {item.caption}
                        </p>
                      )}

                      {item.publicDescription && (
                        <p className="mt-3 leading-7 text-slate-600">
                          {item.publicDescription}
                        </p>
                      )}

                      {(item.sourceDocument || item.sourcePage) && (
                        <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-500">
                          Source: {item.sourceDocument || 'Official project file'}
                          {item.sourcePage ? `, page ${item.sourcePage}` : ''}
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {activeIndex !== null && (
        <GraphicViewer
          items={ordered}
          startIndex={activeIndex}
          onClose={() => setActiveIndex(null)}
        />
      )}
    </>
  )
}
