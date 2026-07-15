import {Header} from '@/components/Header'
import {Footer} from '@/components/Footer'
import {WorkspaceShell} from '@/components/workspace/WorkspaceTools'
import {DocumentsManager} from '@/components/workspace/DocumentsManager'

export default function Page() {
  return <main className="min-h-screen bg-[#f3f5f2] text-[#142033]"><Header/><WorkspaceShell eyebrow="Workspace Module" title="Documents Manager" description="Manage official links and supporting records for each project."><DocumentsManager/></WorkspaceShell><Footer/></main>
}
