import {Header} from '@/components/Header'
import {Footer} from '@/components/Footer'
import {WorkspaceShell} from '@/components/workspace/WorkspaceTools'
import {GraphicsSmartImporter} from '@/components/workspace/GraphicsSmartImporter'

export default function Page() {
  return (
    <main className="min-h-screen bg-[#f3f5f2] text-[#142033]">
      <Header />
      <WorkspaceShell
        eyebrow="Workspace Module"
        title="Graphics Import"
        description="Review AI-suggested plan graphics and publish them directly to an existing project."
      >
        <GraphicsSmartImporter />
      </WorkspaceShell>
      <Footer />
    </main>
  )
}
