import { KeuanganClient } from "@/components/admin/keuangan/keuangan-client"

// Halaman Laporan Keuangan — Server Component minimal
export default function KeuanganPage() {
  // Periode default: bulan ini dalam timezone Asia/Jakarta
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
  )
  const initialPeriode = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <KeuanganClient initialPeriode={initialPeriode} />
      </div>
    </div>
  )
}
