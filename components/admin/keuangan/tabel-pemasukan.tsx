"use client"

import { Fragment, useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { formatRupiah } from "@/lib/utils"
import type { LaporanData } from "./types"

const JENIS_LABEL: Record<string, string> = {
  tambahan_waktu: "Tambahan Waktu",
  tambahan_orang: "Tambahan Orang",
  tambahan_background: "Tambahan Background",
  cetak_12r: "Cetak 12R",
  cetak_20r: "Cetak 20R",
  lainnya: "Lainnya",
}

const KATEGORI_LABEL: Record<string, string> = {
  wisuda: "Wisuda", prewed: "Prewedding", keluarga: "Keluarga",
  group: "Group", portrait: "Portrait",
}

interface TabelPemasukanProps {
  data: LaporanData["pemasukan"]
  detailAddonLapangan: LaporanData["detailAddonLapangan"]
  addonInsight: LaporanData["addonInsight"]
}

export function TabelPemasukan({ data, detailAddonLapangan, addonInsight }: TabelPemasukanProps) {
  const [showAddon, setShowAddon] = useState(false)

  const rows = [
    { key: "paket", label: "Pendapatan Paket", sub: `${data.totalBooking} booking`, value: data.totalPaket },
    { key: "addon_awal", label: "Add-on Booking Awal", sub: "Dipilih saat pemesanan", value: data.addonBookingAwal },
    { key: "addon_lapangan", label: "Add-on Lapangan", sub: "Ditambah saat sesi berlangsung", value: data.addonLapangan, hasDetail: true },
  ]

  return (
    <div className="space-y-4">
      {/* Sumber Pemasukan */}
      <div className="rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wide">
              <th className="px-5 py-3 text-left font-medium">Sumber Pendapatan</th>
              <th className="px-5 py-3 text-right font-medium">Nominal</th>
              <th className="px-5 py-3 text-right font-medium">Porsi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.totalBooking === 0 ? (
              <tr>
                <td colSpan={3} className="px-5 py-10 text-center text-gray-300 text-sm">
                  Tidak ada booking di periode ini
                </td>
              </tr>
            ) : rows.map((row) => (
              <Fragment key={row.key}>
                <tr className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-700">{row.label}</span>
                      <span className="text-xs text-gray-400">{row.sub}</span>
                      {row.hasDetail && detailAddonLapangan.length > 0 && (
                        <button
                          onClick={() => setShowAddon(!showAddon)}
                          className="flex items-center gap-0.5 text-xs text-[#C9A84C] hover:text-[#a8893c] font-medium"
                        >
                          {showAddon ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          {showAddon ? "Tutup" : "Detail"}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-gray-700">{formatRupiah(row.value)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full hidden sm:block">
                        <div className="h-full bg-[#C9A84C] rounded-full" style={{ width: `${data.total > 0 ? (row.value / data.total) * 100 : 0}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 w-10 text-right">
                        {data.total > 0 ? `${((row.value / data.total) * 100).toFixed(1)}%` : "—"}
                      </span>
                    </div>
                  </td>
                </tr>
                {row.hasDetail && showAddon && detailAddonLapangan.map((d) => (
                  <tr key={d.jenis} className="bg-amber-50/40">
                    <td className="px-5 py-2 pl-12 text-xs text-gray-500">
                      ↳ {JENIS_LABEL[d.jenis] ?? d.jenis}
                      <span className="ml-2 text-gray-400">{d.jumlah}× transaksi</span>
                    </td>
                    <td className="px-5 py-2 text-right text-xs font-medium text-gray-600">{formatRupiah(d.totalRevenue)}</td>
                    <td className="px-5 py-2 text-right text-xs text-gray-400">
                      {data.addonLapangan > 0 ? `${((d.totalRevenue / data.addonLapangan) * 100).toFixed(0)}%` : "—"}
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[#0d1f3c] text-white">
              <td className="px-5 py-3.5 font-bold text-sm">Total Pemasukan</td>
              <td className="px-5 py-3.5 text-right font-bold text-sm">{formatRupiah(data.total)}</td>
              <td className="px-5 py-3.5 text-right text-sm font-medium opacity-70">100%</td>
            </tr>
          </tfoot>
        </table>
        </div>
      </div>

      {/* Per Kategori Sesi */}
      {data.perKategori.length > 0 && (
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Breakdown per Kategori Sesi</p>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="text-gray-400 text-xs uppercase tracking-wide">
                <th className="px-5 py-2.5 text-left font-medium">Kategori</th>
                <th className="px-5 py-2.5 text-right font-medium">Booking</th>
                <th className="px-5 py-2.5 text-right font-medium">Revenue</th>
                <th className="px-5 py-2.5 text-right font-medium">Rata-rata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.perKategori.map((k) => (
                <tr key={k.kategori} className="hover:bg-gray-50/60">
                  <td className="px-5 py-3 font-medium text-gray-700">{KATEGORI_LABEL[k.kategori] ?? k.kategori}</td>
                  <td className="px-5 py-3 text-right text-gray-500">{k.jumlah}</td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-700">{formatRupiah(k.total)}</td>
                  <td className="px-5 py-3 text-right text-gray-500">{formatRupiah(k.rata)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Add-on Insight mini */}
      {addonInsight.totalBooking > 0 && addonInsight.totalRevenueLapangan > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Revenue Add-on", value: formatRupiah(addonInsight.totalRevenueLapangan) },
            { label: "% dari Pemasukan", value: `${(addonInsight.pctDariPemasukan * 100).toFixed(1)}%` },
            { label: "Avg per Client", value: formatRupiah(addonInsight.avgPerBookingAdaAddon) },
            { label: "Konversi Add-on", value: `${addonInsight.totalBooking > 0 ? ((addonInsight.jumlahBookingAdaAddon / addonInsight.totalBooking) * 100).toFixed(0) : 0}%` },
          ].map((m) => (
            <div key={m.label} className="bg-amber-50 rounded-xl px-4 py-3 text-center">
              <p className="text-xs text-amber-600 font-medium mb-1">{m.label}</p>
              <p className="text-sm font-bold text-amber-800">{m.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
