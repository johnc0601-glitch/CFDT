type Props = {
  label: string
  value?: string | number
  suffix?: string
}

export function FactCard({label, value, suffix}: Props) {
  if (value === undefined || value === null || value === '') return null

  return (
    <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
      <div className="text-3xl font-semibold">
        {typeof value === 'number' ? value.toLocaleString() : value}
        {suffix ? <span className="text-xl"> {suffix}</span> : null}
      </div>
      <div className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-500">
        {label}
      </div>
    </div>
  )
}
