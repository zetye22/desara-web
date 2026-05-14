"use client"

import { Zap } from "lucide-react"
import { formatRupiah } from "@/lib/utils"
import type { LaporanData } from "./types"

interface AddonInsightCardProps {
  insight: LaporanData["addonInsight"]
  detailAddonLapangan: LaporanData["detailAddonLapangan"]
}

export function AddonInsightCard({ insight, detailAddonLapangan }: AddonInsightCardProps) {
  if (insight.totalBooking === 0) return null

  const conversionPct =
    insight.totalBooking > 0
      ? ((insight.jumlahBookingAdaAddon / insight.totalBooking) * 100).toFixed(0)
      : "0"

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Zap className="w-4 h-4 text-amber-500" />
        <h3 className="font-semibold text-[#0d1f3c] text-base">Insight Add-on Lapangan</h3>
      </div>

      {insight.totalRevenueLapangan === 0 ? (
        <div className="px-5 py-8 text-center text-gray-400 text-sm">
          Tidak ada add-on lapangan di periode ini
        </div>
      ) : (
        <div className="p-5">
          {/* 4 metric cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="bg-amber-50 rounded-lg px-4 py-3 text-center">
              <p className="text-xs text-amber-600 font-medium mb-1">Revenue Add-on</p>
              <p className="text-base font-bold text-amber-800 leading-tight">
                {formatRupiah(insight.totalRevenueLapangan)}
              </p>
            </div>
            <div className="bg-amber-50 rounded-lg px-4 py-3 text-center">
              <p className="text-xs text-amber-600 font-medium mb-1">% dari Pemasukan</p>
              <p className="text-base font-bold text-amber-800">
                {(insight.pctDariPemasukan * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-amber-50 rounded-lg px-4 py-3 text-center">
              <p className="text-xs text-amber-600 font-medium mb-1">Avg per Client</p>
              <p className="text-base font-bold text-amber-800 leading-tight">
                {formatRupiah(insight.avgPerBookingAdaAddon)}
              </p>
            </div>
            <div className="bg-amber-50 rounded-lg px-4 py-3 text-center">
              <p className="text-xs text-amber-600 font-medium mb-1">Top Item</p>
              <p className="text-sm font-bold text-amber-800 leading-tight line-clamp-2">
                {insight.topItem ?? "—"}
              </p>
            </div>
          </div>

          {/* Conversion rate bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-gray-500">
                {insight.jumlahBookingAdaAddon} dari {insight.totalBooking} booking ada add-on lapangan
              </span>
              <span className="text-xs font-semibold text-amber-700">{conversionPct}% konversi</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, parseFloat(conversionPct))}%` }}
              />
            </div>
          </div>

          {/* Daftar top items */}
          {detailAddonLapangan.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                Frekuensi per Jenis
              </p>
              <div className="space-y-2">
                {detailAddonLapangan.slice(0, 5).map((d, idx) => (
                  <div key={d.jenis} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-5 text-right">{idx + 1}.</span>
                      <span className="text-gray-700">{d.namaItem}</span>
                      <span className="text-xs text-gray-400">({d.jumlah}×)</span>
                    </div>
                    <span className="font-semibold text-[#0d1f3c]">
                      {formatRupiah(d.totalRevenue)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
