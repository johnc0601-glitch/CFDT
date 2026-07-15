import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const checks = [
  ['Homepage', 'app/page.tsx'],
  ['Project page', 'app/projects/[slug]/page.tsx'],
  ['Sitemap', 'app/sitemap.ts'],
  ['Robots', 'app/robots.ts'],
  ['404 page', 'app/not-found.tsx'],
  ['Global error', 'app/global-error.tsx'],
  ['SEO helper', 'lib/seo.ts'],
  ['Timeline', 'components/Timeline.tsx'],
  ['Graphic viewer', 'components/GraphicViewer.tsx'],
]

let failed = false
for (const [label, relative] of checks) {
  const exists = fs.existsSync(path.join(root, relative))
  console.log(`${exists ? 'PASS' : 'FAIL'} ${label}: ${relative}`)
  if (!exists) failed = true
}

if (failed) {
  console.error('\nPrelaunch audit failed.')
  process.exit(1)
}

console.log('\nPrelaunch file audit passed.')
console.log('Run npm run build to verify compilation.')
