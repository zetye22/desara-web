"use client"

import { useEffect, useState } from "react"
import { Camera, Sparkles } from "lucide-react"

// ── Count-up ────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1200, delay = 400) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const timer = setTimeout(() => {
      const start = performance.now()
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1)
        setCount(Math.round((1 - Math.pow(1 - p, 3)) * target))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, delay)
    return () => clearTimeout(timer)
  }, [target, duration, delay])
  return count
}

// ── Camera iris SVG ─────────────────────────────────────────────
function CameraIris() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
      <div className="relative w-[700px] h-[700px] max-w-[100vw] opacity-[0.055]">
        {/* Outer ring slow */}
        <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full animate-spin-slow">
          <circle cx="200" cy="200" r="195" fill="none" stroke="#C9A84C" strokeWidth="0.8"
            strokeDasharray="12 8" />
          {Array.from({length: 12}, (_, i) => {
            const a = (i * 30) * Math.PI / 180
            return (
              <line key={i}
                x1={200 + 150 * Math.cos(a)} y1={200 + 150 * Math.sin(a)}
                x2={200 + 193 * Math.cos(a)} y2={200 + 193 * Math.sin(a)}
                stroke="#C9A84C" strokeWidth="0.8" />
            )
          })}
        </svg>
        {/* Middle ring reverse */}
        <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full animate-spin-reverse">
          <circle cx="200" cy="200" r="130" fill="none" stroke="#C9A84C" strokeWidth="0.6"
            strokeDasharray="6 10" />
          {Array.from({length: 8}, (_, i) => {
            const a = (i * 45 + 22.5) * Math.PI / 180
            return (
              <line key={i}
                x1={200 + 90 * Math.cos(a)} y1={200 + 90 * Math.sin(a)}
                x2={200 + 128 * Math.cos(a)} y2={200 + 128 * Math.sin(a)}
                stroke="#C9A84C" strokeWidth="0.6" />
            )
          })}
        </svg>
        {/* Inner circle */}
        <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full animate-spin-slow">
          <circle cx="200" cy="200" r="58" fill="none" stroke="#C9A84C" strokeWidth="0.5"
            strokeDasharray="4 6" />
        </svg>
      </div>
    </div>
  )
}


interface HeroProps {
  jamBuka?: string
  jamTutup?: string
  jumlahBackground?: number
  jumlahPaket?: number
}

export function Hero({
  jamBuka = "10:00",
  jamTutup = "21:00",
  jumlahBackground = 4,
  jumlahPaket = 6,
}: HeroProps) {
  const bgCount    = useCountUp(jumlahBackground, 1000, 800)
  const paketCount = useCountUp(jumlahPaket, 1000, 1000)

  const jamDisplay = `${jamBuka.replace(":00",".00")}–${jamTutup.replace(":00",".00")} WIB`

  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-[#050d1a]">

      {/* ── BG gradient mesh ────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d1f3c] via-[#070f1e] to-[#020810]" />
        {/* Moving orbs */}
        <div className="absolute top-[-10%] right-[-5%] w-[550px] h-[550px] rounded-full bg-[#C9A84C]/7 blur-[120px] animate-float-slow" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[450px] h-[450px] rounded-full bg-blue-700/8 blur-[100px] animate-float" style={{animationDelay:"-4s"}} />
        <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] rounded-full bg-[#1a3a6e]/40 blur-[80px] animate-float-slow" style={{animationDelay:"-2s"}} />
        {/* Noise grain */}
        <div className="absolute inset-0 opacity-[0.018]"
          style={{backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"}} />
      </div>

      {/* ── Camera iris ─────────────────────────────── */}
      <CameraIris />

      {/* ── Floating elements ───────────────────────── */}
      <div className="absolute left-[6%] top-[28%] hidden xl:flex items-center justify-center w-14 h-14 rounded-2xl glass animate-float pointer-events-none" style={{animationDelay:"-1s"}}>
        <Camera className="w-6 h-6 text-[#C9A84C]/80" />
      </div>
      <div className="absolute right-[7%] top-[32%] hidden xl:flex items-center justify-center w-11 h-11 rounded-xl glass animate-float pointer-events-none" style={{animationDelay:"-3.5s"}}>
        <Sparkles className="w-5 h-5 text-[#C9A84C]/70" />
      </div>
      {/* Floating dots */}
      {[
        {top:"22%",left:"18%",s:5,d:"0s"},
        {top:"72%",right:"18%",s:4,d:"-2s"},
        {top:"48%",right:"6%",s:7,d:"-1s"},
        {top:"82%",left:"22%",s:4,d:"-3s"},
        {top:"15%",right:"30%",s:3,d:"-1.5s"},
      ].map((dot, i) => (
        <div key={i} className="absolute rounded-full bg-[#C9A84C]/25 animate-float pointer-events-none"
          style={{
            top: dot.top,
            left: "left" in dot ? dot.left : undefined,
            right: "right" in dot ? dot.right : undefined,
            width: dot.s, height: dot.s,
            animationDelay: dot.d, filter:"blur(1px)",
          }} />
      ))}

      {/* ── Main content ────────────────────────────── */}
      <div className="relative z-10 text-center px-5 max-w-5xl mx-auto pt-24 pb-14">

        {/* Open badge */}
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 border border-white/10 bg-white/5 backdrop-blur-sm animate-reveal-up"
          style={{animationDelay:"0.2s", opacity:0}}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse" />
          <span className="text-white/60 text-xs tracking-wide">{jamDisplay}</span>
        </div>

        {/* Headline */}
        <h1
          className="font-black leading-[0.95] mb-7 animate-reveal-up"
          style={{animationDelay:"0.3s", opacity:0}}
        >
          <span className="block text-5xl sm:text-7xl md:text-8xl lg:text-9xl text-white tracking-tight">
            Desara
          </span>
          <span className="block text-5xl sm:text-7xl md:text-8xl lg:text-9xl text-gradient-gold tracking-tight">
            Home Studio
          </span>
        </h1>

        {/* Sub */}
        <p
          className="text-base sm:text-lg md:text-xl text-blue-100/50 mb-10 max-w-xl mx-auto leading-relaxed animate-reveal-up"
          style={{animationDelay:"0.4s", opacity:0}}
        >
          Studio foto profesional untuk setiap momen istimewamu —
          keluarga, wisuda, prewedding, dan lebih.
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col sm:flex-row gap-3 justify-center mb-16 sm:mb-20 animate-reveal-up"
          style={{animationDelay:"0.5s", opacity:0}}
        >
          <a href="#paket"
            className="inline-flex items-center justify-center gap-2 bg-[#C9A84C] hover:bg-[#b8963d] text-white font-bold rounded-full px-10 h-13 sm:h-14 text-sm sm:text-base
              shadow-lg shadow-[#C9A84C]/25 hover:shadow-xl hover:shadow-[#C9A84C]/40
              transition-all duration-300 hover:-translate-y-1.5 animate-glow-gold"
          >
            Booking Sekarang
          </a>
          <a href="#portfolio"
            className="inline-flex items-center justify-center gap-2 font-semibold rounded-full px-10 h-13 sm:h-14 text-sm sm:text-base
              glass border border-white/15 text-white/90
              hover:bg-white/10 hover:border-white/30
              transition-all duration-300 hover:-translate-y-1"
          >
            Lihat Portfolio
          </a>
        </div>

        {/* Stats */}
        <div
          className="inline-flex items-stretch divide-x divide-white/10 glass rounded-2xl overflow-hidden border border-white/8 animate-reveal-up"
          style={{animationDelay:"0.6s", opacity:0}}
        >
          {[
            {v: bgCount.toString(),  l:"Background",  u:"pilihan"},
            {v: paketCount.toString()+"+", l:"Paket Foto", u:"tersedia"},
            {v: `${parseInt(jamBuka)}–${parseInt(jamTutup)}`, l:"Jam Buka", u:"setiap hari"},
          ].map((s) => (
            <div key={s.l} className="flex flex-col items-center justify-center px-6 sm:px-8 py-4">
              <span className="text-2xl sm:text-3xl font-black text-[#C9A84C] tabular-nums">{s.v}</span>
              <span className="text-white/70 text-[11px] font-semibold tracking-wide mt-0.5">{s.l}</span>
              <span className="text-white/30 text-[10px]">{s.u}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Scroll mouse ─────────────────────────────── */}
      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-2.5">
        <div className="relative w-5 h-9 rounded-full border border-white/15 flex items-start justify-center pt-1.5 glass">
          <div className="w-1 h-2.5 rounded-full bg-[#C9A84C]/70 animate-bounce" />
        </div>
        <span className="text-white/20 text-[9px] tracking-[0.3em] uppercase">Scroll</span>
      </div>
    </section>
  )
}
