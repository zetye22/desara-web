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

interface TabelPemasukanProps {
  data: LaporanData["pemasukan"]
  detailAddonLapangan: LaporanData["detailAddonLapangan"]
}

export function TabelPemasukan({ data, detailAddonLapangan }: TabelPemasukanProps) {
  const [showDetail, setShowDetail] = useState(false)

  const rows = [
    {
      key: "paket",
      label: "Pemasukan Paket",
      sublabel: `${data.totalBooking} booking`,
      total: data.totalPaket,
      colorText: "text-[#0d1f3c]",
      hasDetail: false,
    },
    {
      key: "addon_awal",
      label: "Add-on Booking Awal",
      sublabel: "Dipilih saat booking",
      total: data.addonBookingAwal,
      colorText: "text-blue-700",
      hasDetail: false,
    },
    {
      key: "addon_lapangan",
      label: "Add-on Lapangan",
      sublabel: "Ditambah saat sesi",
      total: data.addonLapangan,
      colorText: "text-amber-700",
      hasDetail: true,
    },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-[#0d1f3c] text-base">Rincian Pemasukan</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Breakdown sumber pendapatan · {data.totalBooking} booking aktif
        </p>
      </div>

      {/* Desktop: Tabel */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
              <th className="px-5 py-3 text-left font-medium">Sumber Pemasukan</th>
              <th className="px-5 py-3 text-right font-medium">Total</th>
              <th className="px-5 py-3 text-right font-medium">% dari Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.totalBooking === 0 ? (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-gray-400">
                  Tidak ada booking di periode ini
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <Fragment key={row.key}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-medium ${row.colorText}`}>{row.label}</span>
                        <span className="text-xs text-gray-400">{row.sublabel}</span>
                        {row.hasDetail && detailAddonLapangan.length > 0 && (
                          <button
                            onClick={() => setShowDetail(!showDetail)}
                            className="flex items-center gap-0.5 text-xs text-amber-600 hover:text-amber-800 font-medium"
                          >
                            {showDetail
                              ? <ChevronDown className="w-3.5 h-3.5" />
                              : <ChevronRight className="w-3.5 h-3.5" />
                            }
                            {showDetail ? "Sembunyikan" : "Lihat Detail"}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className={`px-5 py-3 text-right font-semibold ${row.colorText}`}>
                      {formatRupiah(row.total)}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-500">
                      {data.total > 0
                        ? `${((row.total / data.total) * 100).toFixed(1)}%`
                        : "—"}
                    </td>
                  </tr>

                  {/* Expandable detail add-on lapangan */}
                  {row.hasDetail && showDetail && detailAddonLapangan.map((d) => (
                    <tr key={d.jenis} className="bg-amber-50/40">
                      <td className="px-5 py-2 pl-12 text-sm text-amber-800">
                        ↳ {JENIS_LABEL[d.jenis] ?? d.jenis}
                        <span className="ml-2 text-xs text-amber-500">{d.jumlah}× transaksi</span>
                      </td>
                      <td className="px-5 py-2 text-right text-sm font-medium text-amber-700">
                        {formatRupiah(d.totalRevenue)}
                      </td>
                      <td className="px-5 py-2 text-right text-xs text-amber-500">
                        {data.addonLapangan > 0
                          ? `${((d.totalRevenue / data.addonLapangan) * 100).toFixed(0)}%`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))
            )}
          </tbody>

          {/* Footer Total */}
          <tfoot>
            <tr className="bg-[#0d1f3c] text-white">
              <td className="px-5 py-3.5 font-bold">Total Pemasukan</td>
              <td className="px-5 py-3.5 text-right font-bold">
                {formatRupiah(data.total)}
              </td>
              <td className="px-5 py-3.5 text-right font-semibold">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile: Card layout */}
      <div className="sm:hidden divide-y divide-gray-100">
        {data.totalBooking === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">
            Tidak ada booking di periode ini
          </div>
        ) : (
          rows.map((row) => (
            <Fragment key={row.key}>
              <div className="px-5 py-3.5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`font-medium text-sm ${row.colorText}`}>{row.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{row.sublabel}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${row.colorText}`}>
                      {formatRupiah(row.total)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {data.total > 0
                        ? `${((row.total / data.total) * 100).toFixed(1)}%`
                        : ""}
                    </p>
                  </div>
                </div>
                {row.hasDetail && detailAddonLapangan.length > 0 && (
                  <button
                    onClick={() => setShowDetail(!showDetail)}
                    className="mt-2 flex items-center gap-1 text-xs text-amber-600 font-medium"
                  >
                    {showDetail
                      ? <ChevronDown className="w-3 h-3" />
                      : <ChevronRight className="w-3 h-3" />
                    }
                    {showDetail ? "Sembunyikan detail" : "Lihat detail add-on"}
                  </button>
                )}
              </div>

              {/* Detail mobile */}
              {row.hasDetail && showDetail && detailAddonLapangan.map((d) => (
                <div key={d.jenis} className="px-5 py-2 pl-10 bg-amber-50/40 flex justify-between items-center">
                  <span className="text-xs text-amber-700">
                    ↳ {JENIS_LABEL[d.jenis] ?? d.jenis}
                    <span className="ml-1 text-amber-500">({d.jumlah}×)</span>
                  </span>
                  <span className="text-xs font-semibold text-amber-700">
                    {formatRupiah(d.totalRevenue)}
                  </span>
                </div>
              ))}
            </Fragment>
          ))
        )}

        {/* Footer mobile */}
        <div className="px-5 py-4 bg-[#0d1f3c] text-white">
          <div className="flex justify-between">
            <span className="font-bold">Total Pemasukan</span>
            <span className="font-bold">{formatRupiah(data.total)}</span>
          </div>
          <div className="text-xs text-blue-200 mt-0.5">{data.totalBooking} booking total</div>
        </div>
      </div>
    </div>
  )
}
