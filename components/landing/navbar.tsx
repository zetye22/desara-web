"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const links = [
    { label: "Paket", href: "#paket" },
    { label: "Tentang", href: "#tentang" },
    { label: "Testimoni", href: "#testimoni" },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className={`font-bold text-lg tracking-tight transition-colors ${
            scrolled ? "text-[#0d1f3c]" : "text-white"
          }`}
        >
          Desara <span className="text-[#C9A84C]">Home Studio</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                scrolled ? "text-gray-600 hover:text-[#0d1f3c]" : "text-white/80 hover:text-white"
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button
            asChild
            className="hidden md:inline-flex bg-[#C9A84C] hover:bg-[#b8963d] text-white rounded-full px-6"
          >
            <a href="#paket">Booking Sekarang</a>
          </Button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`md:hidden p-2 ${scrolled ? "text-[#0d1f3c]" : "text-white"}`}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t px-4 py-4 space-y-3">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block text-gray-700 font-medium py-1"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#paket"
            onClick={() => setMenuOpen(false)}
            className="block bg-[#C9A84C] text-white text-center py-2.5 rounded-full font-semibold"
          >
            Booking Sekarang
          </a>
        </div>
      )}
    </header>
  )
}
