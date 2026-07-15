import {Header} from '@/components/Header'
import {Footer} from '@/components/Footer'
import {WorkspaceShell} from '@/components/workspace/WorkspaceTools'
import {GraphicSchemaExplorer} from '@/components/workspace/GraphicSchemaExplorer'

export default function Page() {
  return (
    <main className="min-h-screen bg-[#f3f5f2] text-[#142033]">
      <Header />
      <WorkspaceShell
        eyebrow="Workspace Module"
        title="Graphic Schema Explorer"
        description="Verify the live Sanity projectGraphic records and image links."
      >
        <GraphicSchemaExplorer />
      </WorkspaceShell>
      <Footer />
    </main>
  )
}
