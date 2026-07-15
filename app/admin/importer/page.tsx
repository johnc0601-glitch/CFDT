import {Header} from '@/components/Header'
import {Footer} from '@/components/Footer'
import {WorkspaceShell} from '@/components/workspace/WorkspaceTools'
import {AIProjectImporter} from '@/components/workspace/AIProjectImporter'

export default function Page() {
  return (
    <main className="min-h-screen bg-[#f3f5f2] text-[#142033]">
      <Header />
      <WorkspaceShell
        eyebrow="Primary Workflow"
        title="Import Development"
        description="Drop official planning PDFs, review what AI found, and create or update the project."
      >
        <AIProjectImporter />
      </WorkspaceShell>
      <Footer />
    </main>
  )
}
