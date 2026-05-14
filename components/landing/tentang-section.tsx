import { Clock, Camera, MapPin } from "lucide-react"

interface TentangProps {
  jamBuka?: string
  jamTutup?: string
  jumlahBackground?: number
  alamat?: string
}

export function TentangSection({ jamBuka = "10:00", jamTutup = "21:00", jumlahBackground = 4, alamat }: TentangProps) {
  const jamDisplay = `${jamBuka.replace(":00", ".00").replace(":30", ".30")} – ${jamTutup.replace(":00", ".00").replace(":30", ".30")} WIB`

  const info = [
    {
      Icon: Clock,
      judul: "Jam Operasional",
      isi: `Setiap Hari · ${jamDisplay}`,
      detail: "Termasuk hari libur & akhir pekan",
    },
    {
      Icon: Camera,
      judul: "Background Tersedia",
      isi: `${jumlahBackground} Background Pilihan`,
      detail: "Booking paralel tersedia, cek slot real-time",
    },
    {
      Icon: MapPin,
      judul: "Lokasi Studio",
      isi: "Desara Home Studio",
      detail: alamat || "Hubungi kami via WhatsApp untuk alamat lengkap",
    },
  ]
  return (
    <section id="tentang" className="py-16 sm:py-20 bg-[#F8F5F0] overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-14 px-4">
          <span className="text-[#C9A84C] text-sm font-semibold tracking-widest uppercase">
            Tentang Studio
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0d1f3c] mt-3 mb-3">
            Kenapa Pilih Kami?
          </h2>
          <p className="text-gray-500 text-sm sm:text-base">
            Studio foto nyaman dengan tim profesional yang siap mengabadikan momen terbaik Anda
          </p>
        </div>

        {/* Mobile: horizontal snap | Desktop: grid */}
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 pb-4 sm:pb-0
          sm:grid sm:grid-cols-3 sm:overflow-visible sm:gap-8 sm:px-4
          [-webkit-overflow-scrolling:touch] scrollbar-none [scrollbar-width:none]"
        >
          {info.map(({ Icon, judul, isi, detail }) => (
            <div
              key={judul}
              className="snap-center shrink-0 w-[75vw] sm:w-auto
                bg-white rounded-2xl p-6 sm:p-8 text-center
                shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#0d1f3c] mb-4 sm:mb-6">
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#C9A84C]" />
              </div>
              <h3 className="text-[10px] sm:text-xs font-semibold text-gray-400 tracking-widest uppercase mb-1.5 sm:mb-2">
                {judul}
              </h3>
              <p className="text-base sm:text-xl font-bold text-[#0d1f3c] mb-1.5 sm:mb-2">{isi}</p>
              <p className="text-xs sm:text-sm text-gray-500">{detail}</p>
            </div>
          ))}
        </div>

        {/* CTA strip */}
        <div className="mt-10 sm:mt-14 mx-4 bg-[#0d1f3c] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <h3 className="text-white text-lg sm:text-xl font-bold mb-1">Siap foto bareng kami?</h3>
            <p className="text-blue-200/60 text-xs sm:text-sm">Booking sekarang dan dapatkan slot terbaik Anda</p>
          </div>
          <a
            href="#paket"
            className="shrink-0 bg-[#C9A84C] hover:bg-[#b8963d] text-white font-semibold px-7 py-2.5 sm:px-8 sm:py-3 rounded-full transition-colors text-sm sm:text-base"
          >
            Lihat Paket
          </a>
        </div>
      </div>
    </section>
  )
}
