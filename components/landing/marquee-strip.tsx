import { Camera } from "lucide-react"

const ITEMS = [
  "Foto Wisuda",
  "Foto Keluarga",
  "Foto Prewedding",
  "Foto Portrait",
  "Foto Group",
  "Cetak 12R & 20R",
  "Edit Foto Profesional",
  "Booking Real-time",
]

export function MarqueeStrip() {
  const doubled = [...ITEMS, ...ITEMS]

  return (
    <div className="relative overflow-hidden bg-[#C9A84C] py-3.5 border-y border-[#b8963d]">
      <div className="flex whitespace-nowrap animate-marquee">
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-3 px-6 text-white/90 font-bold text-xs sm:text-sm uppercase tracking-widest">
            <Camera className="w-3.5 h-3.5 text-white/60 shrink-0" />
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
