import {Header} from '@/components/Header'
import {Footer} from '@/components/Footer'
import {WorkspaceShell} from '@/components/workspace/WorkspaceTools'
import {TrafficManager} from '@/components/workspace/TrafficManager'

export default function Page() {
  return <main className="min-h-screen bg-[#f3f5f2] text-[#142033]"><Header/><WorkspaceShell eyebrow="Workspace Module" title="Traffic Analysis" description="Capture TIA metrics, access roads, and required improvements."><TrafficManager/></WorkspaceShell><Footer/></main>
}
