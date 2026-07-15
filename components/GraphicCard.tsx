import type {ProjectMedia} from '@/types/projectMedia'
import {ZoomableGraphic} from './ZoomableGraphic'

export function GraphicCard({item}: {item: ProjectMedia}) {
  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <ZoomableGraphic item={item} />

      <div className="p-6">
        <h3 className="text-2xl font-semibold">{item.title}</h3>

        {item.caption && (
          <p className="mt-2 font-medium text-slate-700">{item.caption}</p>
        )}

        {item.publicDescription && (
          <p className="mt-3 leading-7 text-slate-600">
            {item.publicDescription}
          </p>
        )}

        {(item.sourceDocument || item.sourcePage) && (
          <div className="mt-5 flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-4 text-sm text-slate-500">
            <span>{item.sourceDocument || 'Official project file'}</span>
            {item.sourcePage && <span>Page {item.sourcePage}</span>}
          </div>
        )}
      </div>
    </article>
  )
}
