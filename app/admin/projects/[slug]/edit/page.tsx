import {Header} from '@/components/Header'
import {Footer} from '@/components/Footer'
import {WorkspaceShell} from '@/components/workspace/WorkspaceTools'
import {PublishedProjectEditor} from '@/components/workspace/PublishedProjectEditor'

type Props = {
  params: Promise<{slug: string}>
}

export default async function EditPublishedProjectPage({params}: Props) {
  const {slug} = await params

  return (
    <main className="min-h-screen bg-[#f3f5f2] text-[#142033]">
      <Header />
      <WorkspaceShell
        eyebrow="Workspace"
        title="Edit Published Development"
        description="Make small corrections to a posted project without rebuilding the import package."
      >
        <PublishedProjectEditor slug={slug} />
      </WorkspaceShell>
      <Footer />
    </main>
  )
}
