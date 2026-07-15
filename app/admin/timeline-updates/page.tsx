import {Header} from '@/components/Header'
import {Footer} from '@/components/Footer'
import {WorkspaceShell} from '@/components/workspace/WorkspaceTools'
import {TimelineUpdatesManager} from '@/components/workspace/TimelineUpdatesManager'

export default function Page() {
  return <main className="min-h-screen bg-[#f3f5f2] text-[#142033]"><Header/><WorkspaceShell eyebrow="Workspace Module" title="Timeline & Updates" description="Maintain verified milestones and sourced public updates."><TimelineUpdatesManager/></WorkspaceShell><Footer/></main>
}
