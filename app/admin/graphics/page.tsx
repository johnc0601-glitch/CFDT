import {Header} from '@/components/Header'
import {Footer} from '@/components/Footer'
import {WorkspaceShell} from '@/components/workspace/WorkspaceTools'
import {GraphicsTodayImporter} from '@/components/workspace/GraphicsTodayImporter'

export default function GraphicsPage() {
  return (
    <main className="min-h-screen bg-[#f3f5f2] text-[#142033]">
      <Header />
      <WorkspaceShell
        eyebrow="Workspace Module"
        title="Graphics Import"
        description="Review suggested plan graphics and publish approved sheets to an existing project."
      >
        <GraphicsTodayImporter />
      </WorkspaceShell>
      <Footer />
    </main>
  )
}
