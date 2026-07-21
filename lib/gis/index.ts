import {enrichProjectWithBrunswickGis} from './brunswick'
import {enrichProjectWithNewHanoverGis, extractParcelIds} from './newHanover'
import {enrichProjectWithPenderGis} from './pender'

export {extractParcelIds}

export async function enrichProjectWithCountyGis(project: Record<string, unknown>) {
  const county = String(project.county || project.countyName || '').toLowerCase()
  if (county.includes('brunswick')) return enrichProjectWithBrunswickGis(project)
  if (county.includes('pender')) return enrichProjectWithPenderGis(project)
  if (county.includes('new hanover')) return enrichProjectWithNewHanoverGis(project)
  return project
}
