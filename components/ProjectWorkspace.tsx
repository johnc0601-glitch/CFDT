import {ProjectMetrics} from "./ProjectMetrics"
import {DocumentSidebar} from "./DocumentSidebar"

export function ProjectWorkspace({project,documents,children}:any){
 return(
  <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
   <div className="space-y-8">
    <ProjectMetrics project={project}/>
    {children}
   </div>
   <aside className="xl:sticky xl:top-24 h-fit">
    <DocumentSidebar documents={documents}/>
   </aside>
  </div>
 )
}
