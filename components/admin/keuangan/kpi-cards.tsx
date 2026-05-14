"use client"

import { Wallet, TrendingDown, TrendingUp, Percent } from "lucide-react"
import { formatRupiah } from "@/lib/utils"
import type { LaporanData } from "./types"

interface KpiCardsProps {
  data: LaporanData
  showComparison: boolean
}

// Badge delta: tampilkan persentase perubahan
function DeltaBadge({
  pct,
  inversed = false,
}: {
  pct: number
  inversed?: boolean // untuk pengeluaran: turun = bagus (hijau)
}) {
  const pctDisplay = (pct * 100).toFixed(1)
  // Tentukan warna: untuk pengeluaran (inversed=true), negatif = hijau
  const isPositive = inversed ? pct < 0 : pct > 0
  const isNeutral = pct === 0

  if (isNeutral) {
    return (
      <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
        0%
      </span>
    )
  }

  return (
    <span
      className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
        isPositive
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {pct > 0 ? "+" : ""}{pctDisplay}%
    </span>
  )
}

export function KpiCards({ data, showComparison }: KpiCardsProps) {
  const marginPct = data.margin * 100
  const marginKelas =
    marginPct >= 40
      ? "text-green-600"
      : marginPct >= 20
      ? "text-yellow-600"
      : "text-red-600"

  const labaPositif = data.laba >= 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Pemasukan */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500">Total Pemasukan</p>
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-[#0d1f3c]" />
          </div>
        </div>
        <p className="text-xl font-bold text-[#0d1f3c] leading-tight">
          {formatRupiah(data.pemasukan.total)}
        </p>
        {showComparison && data.comparison && (
          <div className="mt-2 flex items-center gap-2">
            <DeltaBadge pct={data.comparison.pemasukan.pct} />
            <span className="text-xs text-gray-400">vs bulan lalu</span>
          </div>
        )}
      </div>

      {/* Total Pengeluaran */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500">Total Pengeluaran</p>
          <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
            <TrendingDown className="w-4 h-4 text-orange-500" />
          </div>
        </div>
        <p className="text-xl font-bold text-orange-600 leading-tight">
          {formatRupiah(data.pengeluaran.total)}
        </p>
        {showComparison && data.comparison && (
          <div className="mt-2 flex items-center gap-2">
            {/* Untuk pengeluaran: naik = merah, turun = hijau */}
            <DeltaBadge pct={data.comparison.pengeluaran.pct} inversed />
            <span className="text-xs text-gray-400">vs bulan lalu</span>
          </div>
        )}
      </div>

      {/* Laba Bersih */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500">Laba Bersih</p>
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              labaPositif ? "bg-green-50" : "bg-red-50"
            }`}
          >
            <TrendingUp
              className={`w-4 h-4 ${labaPositif ? "text-green-600" : "text-red-500"}`}
            />
          </div>
        </div>
        <p
          className={`text-xl font-bold leading-tight ${
            labaPositif ? "text-green-600" : "text-red-600"
          }`}
        >
          {formatRupiah(data.laba)}
        </p>
        {showComparison && data.comparison && (
          <div className="mt-2 flex items-center gap-2">
            <DeltaBadge pct={data.comparison.laba.pct} />
            <span className="text-xs text-gray-400">vs bulan lalu</span>
          </div>
        )}
      </div>

      {/* Margin Profit */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500">Margin Profit</p>
          <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
            <Percent className="w-4 h-4 text-purple-600" />
          </div>
        </div>
        <p className={`text-xl font-bold leading-tight ${marginKelas}`}>
          {marginPct.toFixed(1)}%
        </p>
        <p className="mt-1 text-xs text-gray-400">
          {marginPct >= 40
            ? "Sangat baik"
            : marginPct >= 20
            ? "Cukup baik"
            : "Perlu ditingkatkan"}
        </p>
      </div>
    </div>
  )
}
