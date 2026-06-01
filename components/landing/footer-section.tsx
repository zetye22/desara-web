interface FooterProps {
  wa?: string
  instagram?: string
  jamBuka?: string
  jamTutup?: string
}

export function FooterSection({ wa = "6281234567890", instagram = "@desarahomestudio", jamBuka = "06:00", jamTutup = "21:00" }: FooterProps) {
  const waDisplay = wa.startsWith("62")
    ? `+${wa.slice(0, 2)} ${wa.slice(2, 5)}-${wa.slice(5, 9)}-${wa.slice(9)}`
    : wa
  const jamDisplay = `${jamBuka.replace(":00", ".00").replace(":30", ".30")} – ${jamTutup.replace(":00", ".00").replace(":30", ".30")} WIB`
  const instagramHandle = instagram.startsWith("@") ? instagram : `@${instagram}`

  return (
    <footer className="bg-gradient-to-br from-[#070f1e] via-[#0d1f3c] to-[#0a1528] text-white pt-14 pb-24 sm:pb-14 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#C9A84C]/4 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-blue-500/4 blur-[80px] pointer-events-none" />
      <div className="max-w-6xl mx-auto relative z-10">

        {/* Mobile: stacked compact | Desktop: 3-col grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10 mb-8 sm:mb-10">
          {/* Brand */}
          <div>
            <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">
              Desara <span className="text-[#C9A84C]">Home Studio</span>
            </h3>
            <p className="text-blue-200/60 text-sm leading-relaxed">
              Studio foto profesional untuk semua momen istimewa Anda.
            </p>
          </div>

          {/* Nav + Kontak — gabung di mobile agar lebih compact */}
          <div className="sm:hidden grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-[#C9A84C] mb-3 text-xs tracking-widest uppercase">
                Menu
              </h4>
              <ul className="space-y-2 text-sm text-blue-200/70">
                {[
                  { label: "Paket Foto", href: "#paket" },
                  { label: "Tentang", href: "#tentang" },
                  { label: "Testimoni", href: "#testimoni" },
                  { label: "Booking", href: "/booking" },
                ].map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="hover:text-[#C9A84C] transition-colors">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-[#C9A84C] mb-3 text-xs tracking-widest uppercase">
                Kontak
              </h4>
              <ul className="space-y-2 text-sm text-blue-200/70">
                <li>
                  <a href={`https://wa.me/${wa.replace(/\D/g, "")}`} className="hover:text-[#C9A84C] transition-colors flex items-center gap-1.5">
                    <span>📱</span> WhatsApp
                  </a>
                </li>
                <li>
                  <a href={`https://instagram.com/${instagramHandle.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A84C] transition-colors flex items-center gap-1.5">
                    <span>📸</span> {instagramHandle}
                  </a>
                </li>
                <li className="flex items-start gap-1.5">
                  <span>🕐</span>
                  <span className="text-xs">{jamDisplay}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Desktop only: Navigasi */}
          <div className="hidden sm:block">
            <h4 className="font-semibold text-[#C9A84C] mb-4 text-xs tracking-widest uppercase">
              Navigasi
            </h4>
            <ul className="space-y-2 text-sm text-blue-200/70">
              {[
                { label: "Paket Foto", href: "#paket" },
                { label: "Tentang Studio", href: "#tentang" },
                { label: "Testimoni", href: "#testimoni" },
                { label: "Booking Sekarang", href: "/booking" },
              ].map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="hover:text-[#C9A84C] transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Desktop only: Kontak */}
          <div className="hidden sm:block">
            <h4 className="font-semibold text-[#C9A84C] mb-4 text-xs tracking-widest uppercase">
              Kontak
            </h4>
            <ul className="space-y-3 text-sm text-blue-200/70">
              <li className="flex items-start gap-2.5">
                <span className="text-[#C9A84C] shrink-0">📱</span>
                <span>
                  WhatsApp:{" "}
                  <a href={`https://wa.me/${wa.replace(/\D/g, "")}`} className="hover:text-[#C9A84C] transition-colors">
                    {waDisplay}
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#C9A84C] shrink-0">📸</span>
                <span>
                  Instagram:{" "}
                  <a href={`https://instagram.com/${instagramHandle.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A84C] transition-colors">
                    {instagramHandle}
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#C9A84C] shrink-0">🕐</span>
                <span>Buka setiap hari, {jamDisplay}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-blue-200/35 text-xs sm:text-sm">
            © 2026 Desara Home Studio · All rights reserved.
          </p>
          <p className="text-[#C9A84C]/40 text-xs">Dibuat dengan ♥ untuk momen istimewa</p>
        </div>
      </div>
    </footer>
  )
}
