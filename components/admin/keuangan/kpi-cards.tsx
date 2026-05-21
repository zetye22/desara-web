"use client"

import { formatRupiah } from "@/lib/utils"
import type { LaporanData } from "./types"
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"

interface KpiCardsProps {
  data: LaporanData
  showComparison: boolean
}

function Delta({ pct, inversed = false }: { pct: number; inversed?: boolean }) {
  const isGood = inversed ? pct < 0 : pct > 0
  const isZero = pct === 0
  const abs = Math.abs(pct * 100).toFixed(1)

  if (isZero) return (
    <span className="inline-flex items-center gap-0.5 text-xs text-gray-400">
      <Minus className="w-3 h-3" /> 0%
    </span>
  )
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isGood ? "text-emerald-600" : "text-red-500"}`}>
      {pct > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {abs}%
    </span>
  )
}

export function KpiCards({ data, showComparison }: KpiCardsProps) {
  const marginPct = data.margin * 100
  const labaPositif = data.laba >= 0
  const saldoAkhir = data.kas?.saldoSetelahBagiHasil ?? 0

  const metrics = [
    {
      label: "Total Pemasukan",
      value: formatRupiah(data.pemasukan.total),
      sub: `${data.pemasukan.totalBooking} booking`,
      accent: "bg-blue-500",
      delta: data.comparison?.pemasukan.pct,
      inversed: false,
    },
    {
      label: "Total Pengeluaran",
      value: formatRupiah(data.pengeluaran.total),
      sub: `HPP + Operasional + Lainnya`,
      accent: "bg-orange-400",
      delta: data.comparison?.pengeluaran.pct,
      inversed: true,
    },
    {
      label: "Laba Bersih",
      value: formatRupiah(data.laba),
      sub: labaPositif ? `Margin ${marginPct.toFixed(1)}%` : "Periode ini merugi",
      accent: labaPositif ? "bg-emerald-500" : "bg-red-400",
      delta: data.comparison?.laba.pct,
      inversed: false,
      valueColor: labaPositif ? "text-emerald-600" : "text-red-600",
    },
    {
      label: "Kas Studio",
      value: formatRupiah(saldoAkhir),
      sub: "Setelah bagi hasil investor",
      accent: "bg-[#C9A84C]",
      delta: undefined,
      inversed: false,
      valueColor: saldoAkhir < 0 ? "text-red-600" : "text-[#0d1f3c]",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {metrics.map((m) => (
        <div key={m.label} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className={`h-1 w-full ${m.accent}`} />
          <div className="p-4">
            <p className="text-xs text-gray-400 font-medium mb-2">{m.label}</p>
            <p className={`text-lg font-bold leading-tight ${m.valueColor ?? "text-[#0d1f3c]"}`}>
              {m.value}
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-400 truncate">{m.sub}</span>
              {showComparison && m.delta !== undefined && (
                <Delta pct={m.delta} inversed={m.inversed} />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
