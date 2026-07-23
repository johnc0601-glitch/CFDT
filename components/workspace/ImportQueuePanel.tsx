'use client'

import Link from 'next/link'
import {useEffect, useMemo, useState} from 'react'
import {importQueue, type ImportQueueItem, type ImportQueueStatus} from '@/lib/importQueue'

type PublishedProject = {
  name?: string
  slug?: string
  homesProposed?: number
}

type ArticleSuggestion = {
  title: string
  url: string
  sourceName: string
  publishedAt?: string
  summary?: string
}

type QueueRow = ImportQueueItem & {
  imported: boolean
  publishedSlug?: string
}

type QueueFilter = 'all' | 'todo' | ImportQueueItem['county']

const statusLabels: Record<ImportQueueStatus, string> = {
  'import-ready': 'Import ready',
  'needs-pdf': 'Needs PDF',
  watchlist: 'Watchlist',
  'below-threshold': 'Below threshold',
}

const statusStyles: Record<ImportQueueStatus, string> = {
  'import-ready': 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  'needs-pdf': 'bg-amber-50 text-amber-900 ring-amber-200',
  watchlist: 'bg-slate-100 text-slate-700 ring-slate-200',
  'below-threshold': 'bg-slate-50 text-slate-500 ring-slate-200',
}

function formatNumber(value?: number) {
  if (!value) return 'TBD'
  return value.toLocaleString()
}

function normalizeSlug(value?: string) {
  return (value || '').toLowerCase().trim()
}

function isImported(item: ImportQueueItem, published: Map<string, PublishedProject>) {
  return Boolean(findPublishedProject(item, published))
}

function findPublishedProject(
  item: ImportQueueItem,
  published: Map<string, PublishedProject>,
) {
  const exact = published.get(item.slug)
  if (exact) return exact

  const itemName = item.name.toLowerCase()
  for (const project of published.values()) {
    if (project.name?.toLowerCase() === itemName) return project
  }

  return null
}

export function ImportQueuePanel() {
  const [publishedProjects, setPublishedProjects] = useState<PublishedProject[]>([])
  const [filter, setFilter] = useState<QueueFilter>('todo')
  const [error, setError] = useState('')
  const [articleResults, setArticleResults] = useState<Record<string, ArticleSuggestion[]>>({})
  const [activeArticleSlug, setActiveArticleSlug] = useState('')
  const [articleMessage, setArticleMessage] = useState<Record<string, string>>({})
  const [articleBusy, setArticleBusy] = useState('')
  const [savingArticle, setSavingArticle] = useState('')

  useEffect(() => {
    fetch('/api/importer/queue-status', {cache: 'no-store'})
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Could not load queue status.')
        setPublishedProjects(Array.isArray(result.projects) ? result.projects : [])
      })
      .catch((queueError) => {
        setError(
          queueError instanceof Error
            ? queueError.message
            : 'Could not load queue status.',
        )
      })
  }, [])

  const publishedBySlug = useMemo(() => {
    const next = new Map<string, PublishedProject>()
    for (const project of publishedProjects) {
      const slug = normalizeSlug(project.slug)
      if (slug) next.set(slug, project)
    }
    return next
  }, [publishedProjects])

  const rows = useMemo<QueueRow[]>(() => {
    return importQueue
      .map((item) => {
        const publishedProject = findPublishedProject(item, publishedBySlug)

        return {
          ...item,
          imported: Boolean(publishedProject),
          publishedSlug: publishedProject?.slug,
        }
      })
      .filter((item) => {
        if (filter === 'todo') return !item.imported
        if (filter === 'all') return true
        return item.county === filter
      })
  }, [filter, publishedBySlug])

  const importedCount = importQueue.filter((item) => isImported(item, publishedBySlug)).length
  const readyRemaining = importQueue.filter(
    (item) => item.status === 'import-ready' && !isImported(item, publishedBySlug),
  ).length

  async function findArticles(item: QueueRow) {
    setArticleBusy(item.slug)
    setActiveArticleSlug(item.slug)
    setArticleMessage((current) => ({
      ...current,
      [item.slug]: 'Searching local and regional news...',
    }))

    try {
      const response = await fetch('/api/importer/article-search', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(item),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Could not search for articles.')
      }

      const articles = Array.isArray(result.articles) ? result.articles : []
      setArticleResults((current) => ({...current, [item.slug]: articles}))
      setArticleMessage((current) => ({
        ...current,
        [item.slug]: articles.length
          ? `${articles.length} candidate article${articles.length === 1 ? '' : 's'} found.`
          : 'No strong article matches found yet.',
      }))
    } catch (searchError) {
      setArticleMessage((current) => ({
        ...current,
        [item.slug]:
          searchError instanceof Error
            ? searchError.message
            : 'Could not search for articles.',
      }))
    } finally {
      setArticleBusy('')
    }
  }

  async function saveArticle(item: QueueRow, article: ArticleSuggestion) {
    if (!item.publishedSlug) {
      setArticleMessage((current) => ({
        ...current,
        [item.slug]: 'Import the project before saving article updates.',
      }))
      return
    }

    const saveKey = `${item.slug}:${article.url}`
    setSavingArticle(saveKey)
    setArticleMessage((current) => ({
      ...current,
      [item.slug]: 'Saving approved article to the project page...',
    }))

    try {
      const response = await fetch('/api/importer/article-save', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          ...article,
          projectSlug: item.publishedSlug,
        }),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Could not save article.')
      }

      setArticleMessage((current) => ({
        ...current,
        [item.slug]:
          result.action === 'exists'
            ? 'That article is already on the project page.'
            : 'Article saved to the project page.',
      }))
    } catch (saveError) {
      setArticleMessage((current) => ({
        ...current,
        [item.slug]:
          saveError instanceof Error
            ? saveError.message
            : 'Could not save article.',
      }))
    } finally {
      setSavingArticle('')
    }
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f8b63]">
            Import Queue
          </p>
          <h2 className="mt-2 text-2xl font-bold">Largest missing developments</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Sorted by homes proposed. Checkmarks are automatic when a matching published project exists.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
          <div className="rounded-lg bg-slate-100 px-3 py-2">
            {importQueue.length}
            <br />
            Tracked
          </div>
          <div className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800">
            {importedCount}
            <br />
            Imported
          </div>
          <div className="rounded-lg bg-amber-50 px-3 py-2 text-amber-900">
            {readyRemaining}
            <br />
            Ready
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {[
          ['todo', 'To do'],
          ['all', 'All'],
          ['New Hanover County', 'New Hanover'],
          ['Pender County', 'Pender'],
          ['Brunswick County', 'Brunswick'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value as QueueFilter)}
            className={`rounded-full px-4 py-2 text-xs font-bold ring-1 ${
              filter === value
                ? 'bg-[#0b5a35] text-white ring-[#0b5a35]'
                : 'bg-white text-slate-700 ring-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          {error}
        </div>
      )}

      <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
        <div className="hidden grid-cols-[56px_1.8fr_1fr_100px_100px_150px_130px] gap-3 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 lg:grid">
          <span>Done</span>
          <span>Development</span>
          <span>County</span>
          <span>Homes</span>
          <span>Acres</span>
          <span>Status</span>
          <span>Articles</span>
        </div>

        <div className="divide-y divide-slate-200">
          {rows.map((item) => (
            <article
              key={item.slug}
              className={`grid gap-3 px-4 py-4 lg:grid-cols-[56px_1.8fr_1fr_100px_100px_150px_130px] lg:items-center ${
                item.imported ? 'bg-emerald-50/40' : 'bg-white'
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ring-1 ${
                  item.imported
                    ? 'bg-emerald-600 text-white ring-emerald-600'
                    : 'bg-white text-slate-300 ring-slate-200'
                }`}
                title={item.imported ? 'Imported' : 'Not imported yet'}
              >
                {item.imported ? 'OK' : ''}
              </div>

              <div>
                <h3 className="font-bold">{item.name}</h3>
                <p className="mt-1 text-sm text-slate-600">{item.planningStatus}</p>
                {item.notes && (
                  <p className="mt-1 text-xs leading-5 text-slate-500">{item.notes}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-3 text-xs font-bold">
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#244f73] hover:text-[#0b5a35]"
                  >
                    {item.sourceLabel}
                  </a>
                  {!item.imported && item.status === 'import-ready' && (
                    <Link href="/admin/graphics" className="text-[#0b5a35]">
                      Add graphics after import
                    </Link>
                  )}
                </div>
              </div>

              <div className="text-sm font-semibold text-slate-700">{item.county}</div>
              <div className="text-sm">
                <span className="font-bold lg:hidden">Homes: </span>
                {formatNumber(item.units)}
              </div>
              <div className="text-sm">
                <span className="font-bold lg:hidden">Acres: </span>
                {formatNumber(item.acres)}
              </div>
              <div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${
                    statusStyles[item.status]
                  }`}
                >
                  {item.imported ? 'Imported' : statusLabels[item.status]}
                </span>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => void findArticles(item)}
                  disabled={articleBusy !== ''}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-[#244f73] disabled:opacity-40"
                >
                  {articleBusy === item.slug ? 'Searching...' : 'Find articles'}
                </button>
              </div>

              {(activeArticleSlug === item.slug ||
                articleResults[item.slug]?.length ||
                articleMessage[item.slug]) && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 lg:col-span-7">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="font-bold">Article suggestions</h4>
                      {articleMessage[item.slug] && (
                        <p className="mt-1 text-sm text-slate-600">{articleMessage[item.slug]}</p>
                      )}
                    </div>
                    {!item.imported && (
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                        Import project before saving
                      </p>
                    )}
                  </div>

                  {articleResults[item.slug]?.length ? (
                    <div className="mt-4 space-y-3">
                      {articleResults[item.slug].map((article) => {
                        const saveKey = `${item.slug}:${article.url}`

                        return (
                          <div
                            key={article.url}
                            className="rounded-lg border border-slate-200 bg-white p-4"
                          >
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div>
                                <a
                                  href={article.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-bold text-[#244f73] hover:text-[#0b5a35]"
                                >
                                  {article.title}
                                </a>
                                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                                  {article.sourceName}
                                  {article.publishedAt ? ` - ${article.publishedAt}` : ''}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => void saveArticle(item, article)}
                                disabled={!item.imported || savingArticle !== ''}
                                className="rounded-lg bg-[#0b5a35] px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
                              >
                                {savingArticle === saveKey ? 'Saving...' : 'Approve and save'}
                              </button>
                            </div>
                            {article.summary && (
                              <p className="mt-3 text-sm leading-6 text-slate-600">
                                {article.summary}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
