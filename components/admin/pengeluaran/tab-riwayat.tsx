"use client"

import { useMemo } from "react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { formatRupiah } from "@/lib/utils"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts"

interface RiwayatBulan {
  bulan: string        // "YYYY-MM"
  bulanLabel: string   // "Jan 2026"
  total: number
  byKategori: Array<{ nama: string; warna: string; total: number }>
}

interface TabRiwayatProps {
  data: RiwayatBulan[]
  loading: boolean
}

function formatJuta(val: number) {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)} jt`
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)} rb`
  return String(val)
}

export function TabRiwayat({ data, loading }: TabRiwayatProps) {
  const chartData = useMemo(() => data.map((d) => ({
    name: d.bulanLabel.slice(0, 6), // "Jan 26"
    total: d.total,
    label: d.bulanLabel,
  })), [data])

  const totalSemua = data.reduce((s, d) => s + d.total, 0)
  const rataRata = data.length > 0 ? Math.round(totalSemua / data.length) : 0

  const maxBulan = data.reduce((max, d) => d.total > max.total ? d : max, data[0] ?? { bulanLabel: "—", total: 0 })

  if (loading) {
    return (
      <div className="py-10 text-center text-gray-400 text-sm">
        Memuat data riwayat...
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="py-10 text-center text-gray-400 text-sm">
        Belum ada data riwayat.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs text-gray-500 font-medium">Total 12 Bulan</p>
          <p className="text-xl font-bold text-[#0d1f3c] mt-0.5">{formatRupiah(totalSemua)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs text-gray-500 font-medium">Rata-rata/Bulan</p>
          <p className="text-xl font-bold text-[#0d1f3c] mt-0.5">{formatRupiah(rataRata)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs text-gray-500 font-medium">Tertinggi</p>
          <p className="text-lg font-bold text-red-600 mt-0.5">{formatRupiah(maxBulan.total)}</p>
          <p className="text-xs text-gray-400">{maxBulan.bulanLabel}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h3 className="text-sm font-semibold text-[#0d1f3c] mb-4">Tren Pengeluaran 12 Bulan</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} />
            <YAxis tickFormatter={formatJuta} tick={{ fontSize: 11, fill: "#6b7280" }} width={48} />
            <Tooltip
              formatter={(val) => [formatRupiah(Number(val)), "Total Pengeluaran"]}
              labelFormatter={(label) => {
                const d = chartData.find(c => c.name === label)
                return d?.label ?? label
              }}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
            />
            <Bar dataKey="total" fill="#0d1f3c" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabel riwayat bulanan */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-[#0d1f3c]">Rincian Per Bulan</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-xs uppercase">
                <th className="px-5 py-2.5 text-left font-medium">Bulan</th>
                <th className="px-5 py-2.5 text-right font-medium">Total</th>
                <th className="px-5 py-2.5 text-right font-medium">vs Rata-rata</th>
                <th className="px-5 py-2.5 text-left font-medium">Distribusi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...data].reverse().map((d) => {
                const diff = d.total - rataRata
                const pct = rataRata > 0 ? Math.round((diff / rataRata) * 100) : 0
                return (
                  <tr key={d.bulan} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5 font-medium text-[#0d1f3c]">{d.bulanLabel}</td>
                    <td className="px-5 py-2.5 text-right font-semibold text-gray-700">
                      {formatRupiah(d.total)}
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      {d.total === 0 ? (
                        <span className="text-gray-400 text-xs">—</span>
                      ) : diff > 0 ? (
                        <span className="inline-flex items-center gap-1 text-red-500 text-xs">
                          <TrendingUp className="w-3 h-3" />
                          +{pct}%
                        </span>
                      ) : diff < 0 ? (
                        <span className="inline-flex items-center gap-1 text-green-600 text-xs">
                          <TrendingDown className="w-3 h-3" />
                          {pct}%
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-400 text-xs">
                          <Minus className="w-3 h-3" />
                          0%
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-2.5">
                      {d.byKategori.length === 0 ? (
                        <span className="text-gray-300 text-xs">—</span>
                      ) : (
                        <div className="flex items-center gap-1 flex-wrap">
                          {d.byKategori.slice(0, 4).map((k) => (
                            <span
                              key={k.nama}
                              className="text-xs px-1.5 py-0.5 rounded-full"
                              style={{ backgroundColor: k.warna + "20", color: k.warna }}
                              title={`${k.nama}: ${formatRupiah(k.total)}`}
                            >
                              {k.nama}
                            </span>
                          ))}
                          {d.byKategori.length > 4 && (
                            <span className="text-xs text-gray-400">+{d.byKategori.length - 4}</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-[#0d1f3c] text-white font-semibold">
                <td className="px-5 py-3">Total 12 Bulan</td>
                <td className="px-5 py-3 text-right">{formatRupiah(totalSemua)}</td>
                <td colSpan={2} className="px-5 py-3 text-right text-sm font-normal opacity-70">
                  rata-rata {formatRupiah(rataRata)}/bulan
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
