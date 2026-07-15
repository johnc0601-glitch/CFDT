import {Header} from '@/components/Header'
import {Footer} from '@/components/Footer'
import {WorkspaceShell} from '@/components/workspace/WorkspaceTools'
import {PublishManager} from '@/components/workspace/PublishManager'

export default function Page() {
  return <main className="min-h-screen bg-[#f3f5f2] text-[#142033]"><Header/><WorkspaceShell eyebrow="Workspace Module" title="Publish Manager" description="Assemble project workspace records into one reviewable package."><PublishManager/></WorkspaceShell><Footer/></main>
}
