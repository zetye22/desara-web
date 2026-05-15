"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard, CalendarDays, CalendarRange, Users, ImageIcon,
  TrendingUp, Settings, LogOut, X, Receipt, LayoutTemplate,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const NAV_ITEMS = [
  { href: "/admin/dashboard",   label: "Dashboard",   icon: LayoutDashboard },
  { href: "/admin/bookings",    label: "Booking",     icon: CalendarDays },
  { href: "/admin/kalender",    label: "Kalender",    icon: CalendarRange },
  { href: "/admin/clients",     label: "Data Client", icon: Users },
  { href: "/admin/portfolio",   label: "Portfolio",   icon: ImageIcon },
  { href: "/admin/pengeluaran", label: "Pengeluaran", icon: Receipt },
  { href: "/admin/konten",      label: "Konten Web",  icon: LayoutTemplate },
  { href: "/admin/keuangan",    label: "Laporan",     icon: TrendingUp },
  { href: "/admin/settings",    label: "Pengaturan",  icon: Settings },
]

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/admin/login")
    router.refresh()
  }

  return (
    <div className="flex flex-col h-full bg-[#0d1f3c] text-white w-64">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
        <div>
          <p className="font-bold text-[#C9A84C] text-base leading-tight">Desara Studio</p>
          <p className="text-xs text-blue-300 mt-0.5">Admin Panel</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-blue-300 hover:text-white lg:hidden"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigasi */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-[#C9A84C] text-white"
                  : "text-blue-200 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5 border-t border-white/10 pt-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-blue-200 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Keluar
        </button>
      </div>
    </div>
  )
}
