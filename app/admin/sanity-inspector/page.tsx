import {Header} from '@/components/Header'
import {Footer} from '@/components/Footer'
import {WorkspaceShell} from '@/components/workspace/WorkspaceTools'
import {SanityInspector} from '@/components/workspace/SanityInspector'

export default function Page() {
  return (
    <main className="min-h-screen bg-[#f3f5f2] text-[#142033]">
      <Header />
      <WorkspaceShell
        eyebrow="Workspace Module"
        title="Sanity Inspector"
        description="Inspect projects and graphics, repair broken links, and restore developer data."
      >
        <SanityInspector />
      </WorkspaceShell>
      <Footer />
    </main>
  )
}
