import {Header} from '@/components/Header'
import {Footer} from '@/components/Footer'
import {WorkspaceShell} from '@/components/workspace/WorkspaceTools'
import {ProjectIntakeWizard} from '@/components/workspace/ProjectIntakeWizard'

export default function Page() {
  return (
    <main className="min-h-screen bg-[#f3f5f2] text-[#142033]">
      <Header />
      <WorkspaceShell
        eyebrow="Workspace Module"
        title="Project Intake Wizard"
        description="Prepare, split, organize, and upload an entire project package in one workflow."
      >
        <ProjectIntakeWizard />
      </WorkspaceShell>
      <Footer />
    </main>
  )
}
