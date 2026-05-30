import { Star, Quote } from "lucide-react"

interface TestimoniItem {
  id: string
  nama: string
  paket: string
  teks: string
  bintang: number
  inisial: string
}

interface TestimoniProps {
  items?: TestimoniItem[]
}

const DEFAULT_TESTIMONI: TestimoniItem[] = [
  { id: "1", nama: "Rina & Dika",       paket: "Paket Gold Prewedding",    teks: "Hasilnya luar biasa! Foto prewedding kami terlihat sangat profesional. Tim photographer ramah dan sabar banget. Pasti balik lagi!", bintang: 5, inisial: "RD" },
  { id: "2", nama: "Keluarga Santoso",  paket: "Foto Keluarga",            teks: "Studio bersih, nyaman, dan backgroundnya bagus-bagus. Anak-anak yang biasanya susah difoto malah enjoy banget. Harga juga sangat terjangkau.", bintang: 5, inisial: "KS" },
  { id: "3", nama: "Melati",            paket: "Paket Silver Wisuda",      teks: "Pelayanannya ramah, hasil edit fotonya cantik dan natural. Cetak 12R-nya juga bagus kualitasnya. Sangat rekomen untuk foto wisuda!", bintang: 5, inisial: "ML" },
]

// Warna avatar per inisial
const AVATAR_COLORS = [
  "from-[#C9A84C] to-[#b8963d]",
  "from-blue-500 to-blue-700",
  "from-emerald-500 to-emerald-700",
  "from-rose-500 to-rose-700",
  "from-purple-500 to-purple-700",
]

export function TestimoniSection({ items }: TestimoniProps) {
  const testimoni = items && items.length > 0 ? items : DEFAULT_TESTIMONI

  return (
    <section id="testimoni" className="py-20 sm:py-28 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-14 reveal">
          <span className="inline-block text-[#C9A84C] text-xs font-bold tracking-[0.25em] uppercase mb-4 px-4 py-1.5 rounded-full bg-[#C9A84C]/8 border border-[#C9A84C]/15">
            Testimoni
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0d1f3c] mt-1 mb-4">
            Kata <span className="text-[#C9A84C]">Mereka</span>
          </h2>
          <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto">
            Kepuasan setiap client adalah kebanggaan kami
          </p>
        </div>

        {/* Cards */}
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 sm:pb-0
          sm:grid sm:grid-cols-3 sm:overflow-visible sm:gap-6
          [-webkit-overflow-scrolling:touch] scrollbar-none [scrollbar-width:none]"
          data-stagger="100"
        >
          {testimoni.map((item, i) => (
            <article
              key={item.id}
              className={`snap-center shrink-0 w-[85vw] sm:w-auto reveal flex flex-col`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="bg-[#F8F5F0] rounded-2xl p-6 sm:p-7 flex flex-col flex-1 h-full
                hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-[#C9A84C]/10 group"
              >
                {/* Top: stars + quote icon */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex gap-0.5">
                    {Array.from({ length: item.bintang }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-[#C9A84C] text-[#C9A84C]" />
                    ))}
                  </div>
                  <Quote className="w-7 h-7 text-[#C9A84C]/20 group-hover:text-[#C9A84C]/40 transition-colors" />
                </div>

                {/* Quote text */}
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed flex-1 mb-6">
                  {item.teks}
                </p>

                {/* Divider */}
                <div className="h-px bg-gray-200 mb-4" />

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm`}>
                    {item.inisial}
                  </div>
                  <div>
                    <p className="font-bold text-[#0d1f3c] text-sm">{item.nama}</p>
                    <p className="text-[#C9A84C] text-xs font-medium">{item.paket}</p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Dot indicator (mobile only) */}
        {testimoni.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-4 sm:hidden">
            {testimoni.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === 0 ? "w-5 bg-[#C9A84C]" : "w-1.5 bg-gray-200"}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
