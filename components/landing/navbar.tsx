"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, MapPin } from "lucide-react"

interface NavbarProps {
  mapsUrl?: string
}

export function Navbar({ mapsUrl }: NavbarProps) {
  const [scrolled, setScrolled]   = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)
  const [activeLink, setActive]   = useState("")

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Tutup menu saat resize ke desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMenuOpen(false) }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const links = [
    { label: "Paket",    href: "#paket" },
    { label: "Portfolio", href: "#portfolio" },
    { label: "Tentang",  href: "#tentang" },
    { label: "Testimoni", href: "#testimoni" },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/90 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-gray-100/80"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className={`font-bold text-lg tracking-tight transition-all duration-300 group ${
            scrolled ? "text-[#0d1f3c]" : "text-white"
          }`}
        >
          <span className="group-hover:opacity-80 transition-opacity">Desara</span>
          {" "}
          <span className="text-[#C9A84C]">Home Studio</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setActive(link.href)}
              className={`relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 group ${
                scrolled
                  ? "text-gray-600 hover:text-[#0d1f3c] hover:bg-gray-50"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              {link.label}
              <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-[#C9A84C] rounded-full transition-all duration-300 ${
                activeLink === link.href ? "w-4" : "w-0 group-hover:w-4"
              }`} />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Maps link */}
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Lihat lokasi di Google Maps"
              className={`hidden md:inline-flex items-center gap-1.5 rounded-full px-3 h-9 text-xs font-semibold transition-all duration-300 ${
                scrolled
                  ? "text-gray-500 hover:text-[#0d1f3c] hover:bg-gray-50 border border-gray-200"
                  : "text-white/70 hover:text-white hover:bg-white/10 border border-white/15"
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              Lokasi
            </a>
          )}
          <Button
            asChild
            className={`hidden md:inline-flex rounded-full px-6 h-9 text-sm font-semibold transition-all duration-300 ${
              scrolled
                ? "bg-[#C9A84C] hover:bg-[#b8963d] text-white shadow-sm hover:shadow-md hover:shadow-[#C9A84C]/25 hover:-translate-y-0.5"
                : "bg-white/15 hover:bg-[#C9A84C] text-white border border-white/25 hover:border-[#C9A84C] backdrop-blur-sm"
            }`}
          >
            <a href="#paket">Booking</a>
          </Button>

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            className={`md:hidden p-2 rounded-xl transition-all duration-200 ${
              scrolled
                ? "text-[#0d1f3c] hover:bg-gray-100"
                : "text-white hover:bg-white/10"
            }`}
          >
            <span className={`block transition-all duration-200 ${menuOpen ? "rotate-90 opacity-0 absolute" : "rotate-0 opacity-100"}`}>
              <Menu className="w-5 h-5" />
            </span>
            <span className={`block transition-all duration-200 ${menuOpen ? "rotate-0 opacity-100" : "-rotate-90 opacity-0 absolute"}`}>
              <X className="w-5 h-5" />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          menuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-white/95 backdrop-blur-xl border-t border-gray-100 px-4 py-4 space-y-1">
          {links.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center px-4 py-3 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:text-[#0d1f3c] transition-colors animate-slide-menu"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              {link.label}
            </a>
          ))}
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 text-gray-600 font-medium rounded-xl hover:bg-gray-50 hover:text-[#0d1f3c] transition-colors"
            >
              <MapPin className="w-4 h-4 text-[#C9A84C]" />
              Lihat Lokasi di Maps
            </a>
          )}
          <a
            href="#paket"
            onClick={() => setMenuOpen(false)}
            className="flex items-center justify-center mt-1 bg-[#C9A84C] hover:bg-[#b8963d] text-white py-3 rounded-full font-semibold transition-colors"
          >
            Booking Sekarang
          </a>
        </div>
      </div>
    </header>
  )
}
