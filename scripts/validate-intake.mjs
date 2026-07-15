import fs from 'node:fs'
import path from 'node:path'

const filename = process.argv[2] || 'templates/project-intake.json'
const fullPath = path.resolve(filename)

if (!fs.existsSync(fullPath)) {
  console.error(`Missing intake file: ${fullPath}`)
  process.exit(1)
}

const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'))
const required = [
  'projectName',
  'county',
  'projectType',
  'caseNumber',
  'status',
  'locationDescription',
  'summary',
  'officialDocumentUrl',
]

const missing = required.filter((key) => !String(data[key] ?? '').trim())

console.log(`Checking: ${fullPath}`)
if (missing.length) {
  console.error(`Missing required fields: ${missing.join(', ')}`)
  process.exit(1)
}

console.log('Intake file is ready for project creation.')
