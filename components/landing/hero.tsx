import { Button } from "@/components/ui/button"

interface HeroProps {
  jamBuka?: string
  jamTutup?: string
  jumlahBackground?: number
  jumlahPaket?: number
}

export function Hero({ jamBuka = "10:00", jamTutup = "21:00", jumlahBackground = 4, jumlahPaket = 6 }: HeroProps) {
  const jamDisplay = `${jamBuka.replace(":00", ".00").replace(":30", ".30")}–${jamTutup.replace(":00", ".00").replace(":30", ".30")} WIB`
  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-[#0d1f3c]">
      {/* Blob backgrounds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] rounded-full bg-[#C9A84C]/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] sm:w-[600px] sm:h-[600px] rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] sm:w-[800px] sm:h-[400px] rounded-full bg-[#1a3a6e]/50 blur-3xl" />
      </div>

      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #C9A84C 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 text-center px-5 max-w-5xl mx-auto pt-24 pb-12">
        {/* Status badge */}
        <div className="inline-flex items-center gap-2 bg-[#C9A84C]/20 border border-[#C9A84C]/30 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 mb-6 sm:mb-8">
          <span className="w-2 h-2 rounded-full bg-[#C9A84C] animate-pulse shrink-0" />
          <span className="text-[#C9A84C] text-xs sm:text-sm font-medium tracking-wide">
            Studio Foto · Buka {jamDisplay}
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-4 sm:mb-6 leading-[1.1]">
          Desara
          <br />
          <span className="text-[#C9A84C]">Home Studio</span>
        </h1>

        <p className="text-base sm:text-xl md:text-2xl text-blue-100/70 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
          Abadikan momen istimewamu bersama kami.
          <span className="hidden sm:inline">
            <br />Foto keluarga, prewedding, wisuda, dan lainnya.
          </span>
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-[#C9A84C] hover:bg-[#b8963d] text-white rounded-full px-8 h-12 sm:h-14 text-sm sm:text-base font-semibold shadow-lg shadow-[#C9A84C]/25 transition-all hover:-translate-y-0.5"
          >
            <a href="#paket">Booking Sekarang</a>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-full px-8 h-12 sm:h-14 text-sm sm:text-base font-semibold border-white/30 text-white bg-white/10 hover:bg-white/20 hover:border-white/50 backdrop-blur-sm"
          >
            <a href="#tentang">Pelajari Lebih Lanjut</a>
          </Button>
        </div>

        {/* Stats row */}
        <div className="mt-12 sm:mt-16 flex justify-center items-center gap-0 max-w-xs sm:max-w-sm mx-auto">
          {[
            { angka: String(jumlahBackground), label: "Background" },
            { angka: String(jumlahPaket), label: "Paket Foto" },
            { angka: `${jamBuka.slice(0, 2)}–${jamTutup.slice(0, 2)}`, label: "Jam Buka" },
          ].map((stat, i) => (
            <div key={stat.label} className="flex items-center flex-1">
              {i > 0 && <div className="w-px h-8 bg-white/10 shrink-0" />}
              <div className="text-center flex-1">
                <div className="text-2xl sm:text-3xl font-bold text-[#C9A84C]">{stat.angka}</div>
                <div className="text-blue-200/50 text-[11px] sm:text-sm mt-0.5">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator — hanya tampil di sm ke atas */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-2 text-white/30">
        <span className="text-xs tracking-widest">SCROLL</span>
        <div className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent animate-pulse" />
      </div>
    </section>
  )
}
