import { Award, TrendingUp, BarChart2 } from "lucide-react"
import { formatRupiah } from "@/lib/utils"
import type { QuickStats } from "./types"

export function QuickStatsSidebar({ stats }: { stats: QuickStats }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
      <p className="text-sm font-semibold text-gray-700">Statistik Bulan Ini</p>

      <StatItem
        icon={<Award className="w-4 h-4 text-[#C9A84C]" />}
        label="Paket Terlaris"
        value={stats.paketTerlaris || "—"}
      />
      <StatItem
        icon={<TrendingUp className="w-4 h-4 text-indigo-500" />}
        label="Rata-rata Tagihan"
        value={stats.rataTagihan > 0 ? formatRupiah(stats.rataTagihan) : "—"}
      />
      <StatItem
        icon={<BarChart2 className="w-4 h-4 text-green-500" />}
        label="Rata-rata / Hari"
        value={stats.rataHariIni > 0 ? `${stats.rataHariIni.toFixed(1)} booking` : "—"}
      />
    </div>
  )
}

function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
      </div>
    </div>
  )
}
