import {Header} from '@/components/Header'
import {Footer} from '@/components/Footer'
import {WorkspaceShell} from '@/components/workspace/WorkspaceTools'
import {GraphicsDiagnostics} from '@/components/workspace/GraphicsDiagnostics'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function Page() {
  return (
    <main className="min-h-screen bg-[#f3f5f2] text-[#142033]">
      <Header />
      <WorkspaceShell
        eyebrow="Workspace Module"
        title="Graphics Diagnostics"
        description="Trace the exact project-to-graphic relationship used by the public website."
      >
        <GraphicsDiagnostics />
      </WorkspaceShell>
      <Footer />
    </main>
  )
}
