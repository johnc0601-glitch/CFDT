import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const required = [
  'app/page.tsx',
  'app/layout.tsx',
  'app/projects/[slug]/page.tsx',
  'components/Header.tsx',
  'components/Footer.tsx',
  'components/Timeline.tsx',
  'components/GraphicViewer.tsx',
  'lib/queries.ts',
  'package.json',
]

let failed = false

for (const file of required) {
  const exists = fs.existsSync(path.join(root, file))
  console.log(`${exists ? 'PASS' : 'FAIL'} ${file}`)
  if (!exists) failed = true
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
for (const dep of ['next', 'react', 'react-dom', '@sanity/client']) {
  const exists = Boolean(pkg.dependencies?.[dep] || pkg.devDependencies?.[dep])
  console.log(`${exists ? 'PASS' : 'FAIL'} dependency: ${dep}`)
  if (!exists) failed = true
}

if (failed) {
  console.error('\nLaunch check failed.')
  process.exit(1)
}

console.log('\nCore launch files are present. Run npm run build for the final verification.')
