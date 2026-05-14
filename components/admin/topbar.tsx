"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"

const BREADCRUMB: Record<string, string> = {
  "/admin/dashboard":  "Dashboard",
  "/admin/bookings":   "Manajemen Booking",
  "/admin/clients":    "Data Client",
  "/admin/portfolio":  "Portfolio",
  "/admin/laporan":    "Laporan Keuangan",
  "/admin/settings":   "Pengaturan",
}

interface TopbarProps {
  namaAdmin: string
  onMenuToggle: () => void
}

export function Topbar({ namaAdmin, onMenuToggle }: TopbarProps) {
  const pathname  = usePathname()
  const [jam, setJam] = useState("")

  // Jam real-time Asia/Jakarta
  useEffect(() => {
    const update = () => {
      setJam(new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(new Date()))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  const title = Object.entries(BREADCRUMB).find(([key]) =>
    pathname === key || pathname.startsWith(key + "/")
  )?.[1] ?? "Admin"

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center px-4 gap-3 shrink-0">
      {/* Hamburger — hanya tampil di mobile */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden text-gray-400 hover:text-gray-700"
        aria-label="Buka menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Judul halaman */}
      <h1 className="text-sm font-semibold text-[#0d1f3c] flex-1">{title}</h1>

      {/* Info admin + jam */}
      <div className="flex items-center gap-3 text-right">
        <div className="hidden sm:block">
          <p className="text-xs font-medium text-gray-700 leading-tight">{namaAdmin}</p>
          <p className="text-xs text-gray-400">{jam} WIB</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#0d1f3c] flex items-center justify-center text-[#C9A84C] text-sm font-bold">
          {namaAdmin.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
