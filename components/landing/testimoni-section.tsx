import { Star } from "lucide-react"

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
  { id: "1", nama: "Rina & Dika",       paket: "Paket Gold",    teks: "Hasilnya luar biasa! Foto prewedding kami terlihat sangat profesional. Tim photographer ramah dan sabar banget. Pasti balik lagi!", bintang: 5, inisial: "RD" },
  { id: "2", nama: "Keluarga Santoso",  paket: "Foto Keluarga", teks: "Studio bersih, nyaman, dan backgroundnya bagus-bagus. Anak-anak yang biasanya susah difoto malah enjoy banget. Harga juga sangat terjangkau.", bintang: 5, inisial: "KS" },
  { id: "3", nama: "Melati",            paket: "Paket Silver",  teks: "Pelayanannya ramah, hasil edit fotonya cantik dan natural. Cetak 12R-nya juga bagus kualitasnya. Sangat rekomen untuk foto wisuda!", bintang: 5, inisial: "ML" },
]

export function TestimoniSection({ items }: TestimoniProps) {
  const testimoni = (items && items.length > 0) ? items : DEFAULT_TESTIMONI
  return (
    <section id="testimoni" className="py-16 sm:py-20 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-14 px-4">
          <span className="text-[#C9A84C] text-sm font-semibold tracking-widest uppercase">
            Testimoni
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0d1f3c] mt-3 mb-3">
            Kata Mereka
          </h2>
          <p className="text-gray-500 text-sm sm:text-base">
            Kepuasan client adalah prioritas utama kami
          </p>
        </div>

        {/* Mobile: horizontal snap scroll | Desktop: grid */}
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 pb-4 sm:pb-0
          sm:grid sm:grid-cols-3 sm:overflow-visible sm:gap-6 sm:px-4
          [-webkit-overflow-scrolling:touch] scrollbar-none [scrollbar-width:none]"
        >
          {testimoni.map((item) => (
            <article
              key={item.id}
              className="snap-center shrink-0 w-[82vw] sm:w-auto
                bg-white rounded-2xl border border-gray-100 shadow-sm
                hover:shadow-md transition-all duration-200 hover:-translate-y-0.5
                p-5 sm:p-6 flex flex-col"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-3 sm:mb-4">
                {Array.from({ length: item.bintang }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-[#C9A84C] text-[#C9A84C]" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-600 text-sm leading-relaxed mb-5 flex-1 italic">
                &ldquo;{item.teks}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#0d1f3c] flex items-center justify-center text-white text-xs sm:text-sm font-bold shrink-0">
                  {item.inisial}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{item.nama}</p>
                  <p className="text-gray-400 text-xs">{item.paket}</p>
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
                className={`h-1.5 rounded-full transition-all ${i === 0 ? "w-4 bg-[#C9A84C]" : "w-1.5 bg-gray-200"}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
