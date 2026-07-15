export function FactHighlight({label,value}:{label:string,value:string|number}){
return(
<div className="rounded-xl bg-slate-50 p-5 ring-1 ring-slate-200">
<div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
<div className="mt-2 text-2xl font-bold">{value}</div>
</div>
)}
