type Props = {
  eyebrow?: string
  title: string
  description?: string
}

export function SectionHeader({eyebrow, title, description}: Props) {
  return (
    <div>
      {eyebrow && (
        <p className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.14em] text-[#2f8a55] before:h-0.5 before:w-6 before:bg-[#2f8a55]">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-2 font-serif text-4xl font-normal leading-none text-[#10251f]">{title}</h2>
      {description && <p className="mt-3 max-w-2xl text-[#62756d]">{description}</p>}
    </div>
  )
}
