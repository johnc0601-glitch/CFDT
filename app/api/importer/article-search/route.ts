import {NextResponse} from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ArticleSuggestion = {
  title: string
  url: string
  sourceName: string
  publishedAt?: string
  summary?: string
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function getTag(item: string, tag: string) {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return match ? decodeXml(match[1]) : ''
}

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function unwrapArticleUrl(url: string) {
  try {
    const parsed = new URL(url)
    const nested = parsed.searchParams.get('url')
    return nested || url
  } catch {
    return url
  }
}

function parseRss(xml: string): ArticleSuggestion[] {
  const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) || []
  return items.flatMap((item) => {
    const title = getTag(item, 'title')
    const url = unwrapArticleUrl(getTag(item, 'link'))
    if (!title || !url) return []

    const published = getTag(item, 'pubDate')
    const publishedAt = published ? new Date(published).toISOString().slice(0, 10) : undefined
    const sourceName = hostname(url) || getTag(item, 'source') || 'News source'

    return [{
      title,
      url,
      sourceName,
      publishedAt,
      summary: getTag(item, 'description'),
    }]
  })
}

function relevanceScore(article: ArticleSuggestion, projectName: string, county: string) {
  const haystack = `${article.title} ${article.summary || ''} ${article.sourceName}`.toLowerCase()
  const stopwords = new Set([
    'planned',
    'development',
    'residential',
    'subdivision',
    'tract',
    'landing',
    'phase',
    'townhomes',
    'apartments',
    'county',
  ])
  const nameParts = projectName
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((part) => part.length > 2 && !stopwords.has(part))

  let score = 0
  let projectHits = 0
  for (const part of nameParts) {
    if (haystack.includes(part)) {
      score += 2
      projectHits += 1
    }
  }
  if (projectHits === 0) return 0

  if (haystack.includes(county.toLowerCase().replace(' county', ''))) score += 2
  if (haystack.includes('development') || haystack.includes('subdivision')) score += 1
  if (haystack.includes('homes') || haystack.includes('units')) score += 1

  return score
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const projectName = text(body.name)
    const county = text(body.county)
    const units = Number(body.units || 0)

    if (!projectName || !county) {
      return NextResponse.json(
        {error: 'Project name and county are required.'},
        {status: 400},
      )
    }

    const countyRoot = county.replace(/\s+County$/i, '')
    const queries = [
      `"${projectName}" "${countyRoot}" development`,
      `"${projectName}" subdivision homes`,
      `"${projectName}" "${countyRoot}"`,
      `"${projectName}"`,
      units ? `"${countyRoot}" "${units}" homes development` : '',
    ].filter(Boolean)

    const found = new Map<string, ArticleSuggestion>()
    for (const query of queries) {
      const searchUrl = `https://www.bing.com/news/search?${new URLSearchParams({
        q: query,
        format: 'rss',
        setlang: 'en-US',
        mkt: 'en-US',
      }).toString()}`

      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 CFDT Development Tracker article research tool',
        },
        cache: 'no-store',
      })

      if (!response.ok) continue

      for (const article of parseRss(await response.text())) {
        if (!found.has(article.url)) found.set(article.url, article)
      }
    }

    const scoredArticles = Array.from(found.values())
      .map((article) => ({
        ...article,
        score: relevanceScore(article, projectName, county),
      }))
      .filter((article) => article.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)

    const articles = scoredArticles.map((article) => ({
      title: article.title,
      url: article.url,
      sourceName: article.sourceName,
      publishedAt: article.publishedAt,
      summary: article.summary,
    }))

    return NextResponse.json({
      queries,
      articles,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not search for articles.',
      },
      {status: 500},
    )
  }
}
