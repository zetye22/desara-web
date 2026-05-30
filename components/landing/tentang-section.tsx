import { Clock, Camera, MapPin, ChevronRight, Zap, CheckCircle2, ExternalLink } from "lucide-react"

interface TentangProps {
  jamBuka?: string
  jamTutup?: string
  jumlahBackground?: number
  alamat?: string
  mapsUrl?: string
}

export function TentangSection({
  jamBuka = "10:00",
  jamTutup = "21:00",
  jumlahBackground = 4,
  alamat,
  mapsUrl,
}: TentangProps) {
  const jamDisplay = `${jamBuka.replace(":00",".00")} – ${jamTutup.replace(":00",".00")}`

  return (
    <section id="tentang" className="py-20 sm:py-28 bg-[#F8F5F0] overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">

        {/* Label */}
        <div className="mb-10 sm:mb-12 reveal">
          <span className="inline-block text-[#C9A84C] text-xs font-bold tracking-[0.25em] uppercase mb-3 px-4 py-1.5 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20">
            Tentang Studio
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0d1f3c] mt-1 leading-tight">
            Kenapa Pilih <span className="text-[#C9A84C]">Desara?</span>
          </h2>
        </div>

        {/* ── Bento grid ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-auto gap-4" data-stagger="90">

          {/* [A] Large dark card — spans 2 rows on lg */}
          <div className="lg:row-span-2 bg-[#0d1f3c] rounded-3xl p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden reveal group">
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[#C9A84C]/8 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-36 h-36 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-[#C9A84C]/15 flex items-center justify-center mb-8 group-hover:bg-[#C9A84C]/25 transition-colors">
                <Camera className="w-5 h-5 text-[#C9A84C]" />
              </div>
              <p className="text-[#C9A84C] text-xs font-bold tracking-widest uppercase mb-4">Studio Profesional</p>
              <h3 className="text-white text-2xl sm:text-3xl font-black leading-tight mb-4">
                Studio foto nyaman &amp; tim berpengalaman
              </h3>
              <p className="text-blue-200/50 text-sm leading-relaxed">
                Kami menghadirkan pengalaman foto yang menyenangkan dengan peralatan profesional dan hasil edit terbaik. Setiap momen berharga layak diabadikan dengan sempurna.
              </p>
            </div>

            {/* Features list */}
            <ul className="relative mt-8 space-y-3">
              {["Fotografer profesional","Edit foto all-inclusive","Booking real-time online","Background pilihan"].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-white/70">
                  <span className="w-5 h-5 rounded-full bg-[#C9A84C]/20 flex items-center justify-center shrink-0">
                    <svg className="w-2.5 h-2.5 text-[#C9A84C]" fill="currentColor" viewBox="0 0 8 8">
                      <path d="M1 4l2 2 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                    </svg>
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* [B] Jam buka */}
          <div className="bg-white rounded-3xl p-7 flex flex-col gap-3 reveal border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">Jam Operasional</p>
              <p className="text-3xl sm:text-4xl font-black text-[#0d1f3c]">{jamDisplay}</p>
              <p className="text-sm font-semibold text-[#C9A84C] mt-1">WIB</p>
            </div>
            <p className="text-xs text-gray-400 mt-auto">Buka setiap hari, termasuk hari libur &amp; akhir pekan</p>
          </div>

          {/* [C] Background count */}
          <div className="bg-[#0d1f3c] rounded-3xl p-7 flex flex-col gap-3 reveal hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-10 h-10 rounded-2xl bg-[#C9A84C]/15 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#C9A84C]" />
            </div>
            <div>
              <p className="text-xs font-bold text-white/40 tracking-widest uppercase mb-1">Background Tersedia</p>
              <p className="text-5xl font-black text-gradient-gold">{jumlahBackground}</p>
              <p className="text-sm text-blue-200/50 mt-1">pilihan background studio</p>
            </div>
            <p className="text-xs text-blue-200/30 mt-auto">Booking paralel tersedia — cek slot real-time</p>
          </div>

          {/* [D] Lokasi */}
          <div className="bg-white rounded-3xl p-7 flex flex-col gap-3 reveal border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">Lokasi Studio</p>
              <p className="text-xl font-black text-[#0d1f3c]">Desara Home Studio</p>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                {alamat ?? "Hubungi kami via WhatsApp untuk alamat lengkap"}
              </p>
            </div>
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors group mt-1"
              >
                <MapPin className="w-4 h-4" />
                Buka di Google Maps
                <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
              </a>
            )}
          </div>

          {/* [E] Quick facts */}
          <div className="bg-white rounded-3xl p-7 flex flex-col gap-4 reveal border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-10 h-10 rounded-2xl bg-[#0d1f3c]/8 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-[#0d1f3c]" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-3">Keunggulan Kami</p>
              <ul className="space-y-2.5">
                {["Fotografer profesional","All edit foto termasuk","Link foto max 1×12 jam","Booking & cek slot online"].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Strip */}
        <div className="mt-5 reveal">
          <div className="relative bg-[#0d1f3c] rounded-3xl p-8 sm:p-10 overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#C9A84C]/6 blur-[80px] pointer-events-none" />
            <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
              <div>
                <p className="text-[#C9A84C] text-xs font-bold tracking-[0.2em] uppercase mb-2">Siap untuk foto?</p>
                <h3 className="text-white text-2xl sm:text-3xl font-black mb-1.5">Abadikan Momenmu Sekarang</h3>
                <p className="text-blue-200/40 text-sm">Slot terbatas — booking sebelum penuh</p>
              </div>
              <a href="#paket"
                className="shrink-0 inline-flex items-center gap-2 bg-[#C9A84C] hover:bg-[#b8963d] text-white font-bold px-8 py-3.5 rounded-full
                  transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#C9A84C]/30 text-sm sm:text-base"
              >
                Lihat Paket <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
