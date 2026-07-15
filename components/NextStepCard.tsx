export function NextStepCard({text}:{text?:string}){
if(!text) return null
return(
<section className="rounded-2xl bg-[#eef6ee] p-8 ring-1 ring-[#cfe0c8]">
<h2 className="text-2xl font-semibold">Next Step</h2>
<p className="mt-4 leading-7 text-slate-700">{text}</p>
</section>
)}
