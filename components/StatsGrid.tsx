type Stat = {
  label: string
  value: string | number
}

export function StatsGrid({stats}: {stats: Stat[]}) {
  return (
    <div className="grid gap-5 md:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
          <div className="text-3xl font-semibold">
            {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
          </div>
          <div className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-500">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}
