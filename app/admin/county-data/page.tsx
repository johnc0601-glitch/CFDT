import {Header} from '@/components/Header'
import {Footer} from '@/components/Footer'
import {WorkspaceShell} from '@/components/workspace/WorkspaceTools'
import {CountyDataManager} from '@/components/workspace/CountyDataManager'

export default function Page() {
  return <main className="min-h-screen bg-[#f3f5f2] text-[#142033]"><Header/><WorkspaceShell eyebrow="Workspace Module" title="County Data Manager" description="Maintain county totals and growth metrics for dashboard use."><CountyDataManager/></WorkspaceShell><Footer/></main>
}
