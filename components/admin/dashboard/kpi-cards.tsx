"use client"

import { CalendarDays, CalendarRange, Wallet, AlertCircle, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { formatRupiah } from "@/lib/utils"
import type { KpiData } from "./types"

export function KpiCards({ data }: { data: KpiData }) {
  const pctMinggu = data.bookingMingguLalu === 0
    ? null
    : Math.round(((data.bookingMingguIni - data.bookingMingguLalu) / data.bookingMingguLalu) * 100)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {/* Card 1: Booking Hari Ini */}
      <KpiCard
        icon={<CalendarDays className="w-5 h-5" />}
        label="Booking Hari Ini"
        value={String(data.bookingHariIni)}
        subtitle={
          data.bookingHariIni === 0
            ? "Belum ada booking"
            : `${data.bookingHariIniLunas} lunas · ${data.bookingHariIniPending} menunggu`
        }
        color="blue"
      />

      {/* Card 2: Booking Minggu Ini */}
      <KpiCard
        icon={<CalendarRange className="w-5 h-5" />}
        label="Booking Minggu Ini"
        value={String(data.bookingMingguIni)}
        subtitle={
          pctMinggu === null
            ? "Tidak ada data minggu lalu"
            : pctMinggu > 0
              ? `+${pctMinggu}% dari minggu lalu`
              : pctMinggu < 0
                ? `${pctMinggu}% dari minggu lalu`
                : "Sama dengan minggu lalu"
        }
        subtitleIcon={
          pctMinggu === null ? null
          : pctMinggu > 0 ? <TrendingUp className="w-3 h-3" />
          : pctMinggu < 0 ? <TrendingDown className="w-3 h-3" />
          : <Minus className="w-3 h-3" />
        }
        subtitleColor={
          pctMinggu === null ? "gray"
          : pctMinggu > 0 ? "green"
          : pctMinggu < 0 ? "red"
          : "gray"
        }
        color="green"
      />

      {/* Card 3: Omzet Bulan Ini */}
      <KpiCard
        icon={<Wallet className="w-5 h-5" />}
        label="Omzet Bulan Ini"
        value={formatRupiah(data.omzetBulanIni)}
        subtitle={`Dari ${data.jumlahBookingBulanIni} booking`}
        color="indigo"
      />

      {/* Card 4: Pending DP */}
      <KpiCard
        icon={<AlertCircle className="w-5 h-5" />}
        label="Pending DP"
        value={String(data.pendingDp)}
        subtitle={`Total nilai: ${formatRupiah(data.nilaiPendingDp)}`}
        subtitleColor={data.pendingDp > 0 ? "orange" : "gray"}
        color="orange"
      />
    </div>
  )
}

type BadgeColor = "blue" | "green" | "indigo" | "orange"
type SubColor   = "green" | "red" | "gray" | "orange"

function KpiCard({
  icon, label, value, subtitle, subtitleIcon, subtitleColor = "gray", color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  subtitle: string
  subtitleIcon?: React.ReactNode | null
  subtitleColor?: SubColor
  color: BadgeColor
}) {
  const iconBg: Record<BadgeColor, string> = {
    blue:   "bg-blue-50 text-blue-600",
    green:  "bg-green-50 text-green-600",
    indigo: "bg-indigo-50 text-indigo-600",
    orange: "bg-orange-50 text-orange-600",
  }
  const subCls: Record<SubColor, string> = {
    green:  "text-green-600",
    red:    "text-red-500",
    gray:   "text-gray-400",
    orange: "text-orange-500",
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4 ${iconBg[color]}`}>
        {icon}
      </div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-[#0d1f3c] leading-tight mb-1 truncate">{value}</p>
      <div className={`flex items-center gap-1 text-xs ${subCls[subtitleColor]}`}>
        {subtitleIcon}
        <span>{subtitle}</span>
      </div>
    </div>
  )
}
