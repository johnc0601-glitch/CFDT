export function InfoCallout({title,text}:{title:string,text:string}){
return(
<div className="rounded-2xl border-l-4 border-[#0b5a35] bg-[#f6fbf6] p-6">
<h3 className="text-xl font-semibold">{title}</h3>
<p className="mt-3 leading-7 text-slate-700">{text}</p>
</div>
)}
