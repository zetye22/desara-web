"use client"

import { useState, useEffect } from "react"

export function MobileBookingBar() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 sm:hidden transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 py-3 flex items-center gap-3 shadow-2xl">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400">Studio Foto Profesional</p>
          <p className="text-sm font-semibold text-[#0d1f3c] truncate">Desara Home Studio</p>
        </div>
        <a
          href="#paket"
          className="shrink-0 bg-[#C9A84C] hover:bg-[#b8963d] text-white font-semibold px-5 py-2.5 rounded-full text-sm transition-colors"
        >
          Booking Sekarang
        </a>
      </div>
    </div>
  )
}
