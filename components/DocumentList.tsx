import type {ProjectDocument} from '@/types/projectDocument'

export function DocumentList({documents}: {documents: ProjectDocument[]}) {
  if (!documents.length) {
    return <p className="text-slate-600">No documents have been added yet.</p>
  }

  return (
    <div className="grid gap-4">
      {documents.map((doc) => (
        <article
          key={doc._id}
          className="rounded-xl border border-slate-200 p-5"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#6f8b63]">
                {doc.documentType || 'Document'}
              </p>

              <h3 className="mt-2 text-xl font-semibold">{doc.title}</h3>

              {doc.documentDate && (
                <p className="mt-1 text-sm text-slate-500">
                  {doc.documentDate}
                </p>
              )}

              {doc.summary && (
                <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                  {doc.summary}
                </p>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              {doc.officialUrl && (
                <a
                  href={doc.officialUrl}
                  target="_blank"
                  className="rounded-xl bg-[#142033] px-4 py-2 text-sm font-semibold text-white"
                >
                  View Official Document
                </a>
              )}

              {doc.fileUrl && (
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-[#244f73]"
                >
                  Open Archived Copy
                </a>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
