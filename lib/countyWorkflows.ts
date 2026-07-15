export type WorkflowStage = {
  key: string
  title: string
  description: string
}

type WorkflowGroup = {
  majorSubdivision: WorkflowStage[]
  rezoning: WorkflowStage[]
  default: WorkflowStage[]
}

const newHanover: WorkflowGroup = {
  majorSubdivision: [
    {key: 'pre-application', title: 'Pre-Application', description: 'Early coordination with county staff and reviewing agencies.'},
    {key: 'submitted', title: 'Plan Submitted', description: 'A complete preliminary plan application is filed.'},
    {key: 'staff-review', title: 'Staff Review', description: 'Planning and technical agencies review the plan for completeness and compliance.'},
    {key: 'trc', title: 'TRC Review', description: 'The Technical Review Committee considers the preliminary plan and comments.'},
    {key: 'preliminary-approval', title: 'Preliminary Plan Decision', description: 'The preliminary plan is approved, approved with conditions, or denied.'},
    {key: 'construction-plans', title: 'Construction Plans', description: 'Detailed engineering plans are reviewed before land disturbance and infrastructure work.'},
    {key: 'permits', title: 'Permits & Infrastructure', description: 'Required county, state, federal, utility, stormwater, and transportation approvals are secured.'},
    {key: 'final-plat', title: 'Final Plat', description: 'The final plat is reviewed after required improvements or guarantees are in place.'},
    {key: 'recordation', title: 'Plat Recorded', description: 'The approved plat is recorded with the Register of Deeds.'},
    {key: 'building', title: 'Building Permits', description: 'Individual lots may move into building-permit review.'},
  ],
  rezoning: [
    {key: 'pre-application', title: 'Pre-Application', description: 'Applicant meets with county staff.'},
    {key: 'submitted', title: 'Application Submitted', description: 'The rezoning application is filed and reviewed for completeness.'},
    {key: 'community-meeting', title: 'Community Information', description: 'Required neighborhood or community information steps occur when applicable.'},
    {key: 'planning-board', title: 'Planning Board', description: 'The Planning Board holds its review and recommendation.'},
    {key: 'commissioners', title: 'County Commissioners', description: 'The Board of Commissioners conducts the legislative hearing and decision.'},
    {key: 'effective', title: 'Zoning Effective', description: 'The zoning map and approved conditions take effect.'},
  ],
  default: [],
}

const pender: WorkflowGroup = {
  majorSubdivision: [
    {key: 'pre-submittal', title: 'Pre-Submittal', description: 'The applicant coordinates with county staff before filing.'},
    {key: 'master-plan', title: 'Master Development Plan', description: 'A master development plan is reviewed when required by zoning or project structure.'},
    {key: 'submitted', title: 'Preliminary Plat Submitted', description: 'The major-subdivision preliminary plat is filed.'},
    {key: 'trc', title: 'Technical Review', description: 'County departments and reviewing agencies conduct technical review.'},
    {key: 'planning-board', title: 'Planning Board', description: 'Planning Board review occurs when required by the applicable procedure.'},
    {key: 'preliminary-approval', title: 'Preliminary Approval', description: 'The preliminary plat is approved, conditionally approved, or denied.'},
    {key: 'construction', title: 'Construction & Permits', description: 'Engineering plans, utilities, roads, stormwater, erosion control, and permits are completed.'},
    {key: 'final-plat', title: 'Final Plat Approval', description: 'The final plat is reviewed after improvements or guarantees are accepted.'},
    {key: 'recordation', title: 'Plat Recorded', description: 'The approved final plat is recorded.'},
  ],
  rezoning: [
    {key: 'pre-submittal', title: 'Pre-Submittal', description: 'Applicant coordinates with county planning staff.'},
    {key: 'submitted', title: 'Application Submitted', description: 'The rezoning application is filed.'},
    {key: 'public-input', title: 'Public Input Meeting', description: 'Public input and notice requirements are completed when applicable.'},
    {key: 'planning-board', title: 'Planning Board', description: 'The Planning Board reviews the request and makes a recommendation.'},
    {key: 'commissioners', title: 'County Commissioners', description: 'The Board of Commissioners holds the public hearing and makes the final decision.'},
    {key: 'effective', title: 'Zoning Effective', description: 'The approved zoning action becomes effective.'},
  ],
  default: [],
}

const brunswick: WorkflowGroup = {
  majorSubdivision: [
    {key: 'planning-session', title: 'Project Planning Session', description: 'The applicant begins with county planning and technical coordination.'},
    {key: 'sketch-plan', title: 'Sketch Plan', description: 'A sketch plan is reviewed before the formal preliminary plat.'},
    {key: 'submitted', title: 'Preliminary Plat Submitted', description: 'The major-subdivision preliminary plat is filed.'},
    {key: 'trc', title: 'Technical Review', description: 'The Technical Review Committee evaluates the proposal.'},
    {key: 'staff-report', title: 'Staff Report', description: 'Staff prepares findings and recommendations.'},
    {key: 'planning-board', title: 'Planning Board Hearing', description: 'The Planning Board conducts the required review and decision.'},
    {key: 'preliminary-approval', title: 'Preliminary Approval', description: 'The preliminary plat is approved, approved with conditions, or denied.'},
    {key: 'construction', title: 'Construction & Improvements', description: 'Infrastructure, permits, and required improvements are completed or guaranteed.'},
    {key: 'final-plat', title: 'Final Plat Approval', description: 'The final plat is reviewed by the authorized county official.'},
    {key: 'recordation', title: 'Plat Recorded', description: 'The approved plat is recorded.'},
  ],
  rezoning: [
    {key: 'planning-session', title: 'Project Planning Session', description: 'The applicant meets with county staff.'},
    {key: 'submitted', title: 'Application Submitted', description: 'The rezoning request is filed.'},
    {key: 'staff-review', title: 'Staff Review', description: 'Staff evaluates the request and prepares a report.'},
    {key: 'planning-board', title: 'Planning Board', description: 'The Planning Board conducts the hearing and action provided by the UDO.'},
    {key: 'appeal-window', title: 'Appeal Window', description: 'The decision may proceed through the applicable appeal process.'},
    {key: 'effective', title: 'Zoning Effective', description: 'The final zoning action becomes effective.'},
  ],
  default: [],
}

const workflows: Record<string, WorkflowGroup> = {
  'new hanover county': newHanover,
  'pender county': pender,
  'brunswick county': brunswick,
}

function projectKind(projectType?: string) {
  const value = projectType?.toLowerCase() || ''
  if (value.includes('rezon')) return 'rezoning'
  if (
    value.includes('subdivision') ||
    value.includes('preliminary') ||
    value.includes('residential development')
  ) {
    return 'majorSubdivision'
  }
  return 'default'
}

export function getCountyWorkflow(countyName?: string, projectType?: string) {
  const workflow = workflows[countyName?.toLowerCase() || '']
  if (!workflow) return []
  return workflow[projectKind(projectType)]
}
