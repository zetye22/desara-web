import { Metadata } from "next"
import { PengeluaranClient } from "@/components/admin/pengeluaran/pengeluaran-client"

export const metadata: Metadata = {
  title: "Kelola Pengeluaran — Desara Studio Admin",
}

export default function PengeluaranPage() {
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0d1f3c]">Kelola Pengeluaran</h1>
        <p className="text-sm text-gray-500 mt-1">
          Atur pengeluaran tetap bulanan, catat pengeluaran harian, dan lihat tren 12 bulan.
        </p>
      </div>

      <PengeluaranClient />
    </div>
  )
}
