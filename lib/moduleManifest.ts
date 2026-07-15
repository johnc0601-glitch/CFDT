import fs from 'node:fs'
import path from 'node:path'

export type CFDTModule = {
  id: string
  name: string
  version: string
  status: 'installed' | 'disabled' | 'planned'
  area: string
  description: string
  route?: string | null
}

export type CFDTModuleManifest = {
  platformVersion: string
  manifestVersion: string
  updatedAt: string
  modules: CFDTModule[]
  history: {date:string;version:string;module:string;action:string;note:string}[]
}

export function getModuleManifest(): CFDTModuleManifest {
  const file = path.join(process.cwd(), 'public', 'cfdt', 'module-manifest.json')
  return JSON.parse(fs.readFileSync(file, 'utf8')) as CFDTModuleManifest
}
