"use client"

import { useState } from "react"
import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"
import { RoleProvider, type UserRole } from "@/lib/role-context"

interface AdminLayoutClientProps {
  namaAdmin: string
  role: UserRole
  children: React.ReactNode
}

export function AdminLayoutClient({ namaAdmin, role, children }: AdminLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <RoleProvider role={role}>
    <div className="flex h-screen overflow-hidden bg-[#F8F5F0]">
      {/* Sidebar Desktop — selalu tampil */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar />
      </div>

      {/* Sidebar Mobile — overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Konten utama */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          namaAdmin={namaAdmin}
          onMenuToggle={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6">
          {children}
        </main>
      </div>
    </div>
    </RoleProvider>
  )
}
