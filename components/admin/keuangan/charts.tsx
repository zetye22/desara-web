"use client"

import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import type { LaporanData } from "./types"

const fmt = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v)

const fmtShort = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}rb`
  return String(v)
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-xl px-4 py-3 text-xs min-w-[160px]">
      {label && <p className="font-semibold text-gray-600 mb-2">{label}</p>}
      {payload.map((e) => (
        <div key={e.name} className="flex items-center justify-between gap-4 mb-1">
          <span style={{ color: e.color }} className="font-medium">{e.name}</span>
          <span className="font-bold text-gray-800">{fmt(e.value)}</span>
        </div>
      ))}
    </div>
  )
}

interface ChartsProps { data: LaporanData }

export function Charts({ data }: ChartsProps) {
  const pieData = [
    { nama: "HPP", value: data.pengeluaran.totalHpp, fill: "#0d1f3c" },
    { nama: "Operasional", value: data.pengeluaran.totalOperasional, fill: "#C9A84C" },
    { nama: "Lainnya", value: data.pengeluaran.totalLainnya, fill: "#94A3B8" },
  ].filter((d) => d.value > 0)

  const totalPengeluaran = data.pengeluaran.total

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Tren 6 Bulan */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="mb-4">
          <p className="text-sm font-semibold text-[#0d1f3c]">Tren 6 Bulan Terakhir</p>
          <p className="text-xs text-gray-400 mt-0.5">Pemasukan, pengeluaran & laba bersih</p>
        </div>
        {data.tren6Bulan.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-gray-300 text-sm">
            Belum ada data tren
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.tren6Bulan} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gPemasukan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d1f3c" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#0d1f3c" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gLaba" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16A34A" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={44} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="pemasukan" name="Pemasukan" stroke="#0d1f3c" strokeWidth={2} fill="url(#gPemasukan)" dot={{ r: 3, fill: "#0d1f3c" }} activeDot={{ r: 5 }} />
              <Area type="monotone" dataKey="pengeluaran" name="Pengeluaran" stroke="#F97316" strokeWidth={2} fill="none" dot={{ r: 3, fill: "#F97316" }} activeDot={{ r: 5 }} />
              <Area type="monotone" dataKey="laba" name="Laba" stroke="#16A34A" strokeWidth={2} fill="url(#gLaba)" dot={{ r: 3, fill: "#16A34A" }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Distribusi Pengeluaran */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="mb-4">
          <p className="text-sm font-semibold text-[#0d1f3c]">Komposisi Pengeluaran</p>
          <p className="text-xs text-gray-400 mt-0.5">Bulan ini</p>
        </div>
        {pieData.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-gray-300 text-sm">
            Belum ada pengeluaran
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            {pieData.map((d) => {
              const pct = totalPengeluaran > 0 ? (d.value / totalPengeluaran) * 100 : 0
              return (
                <div key={d.nama}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.fill }} />
                      <span className="text-xs text-gray-600 font-medium">{d.nama}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-gray-700">
                        {new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(d.value)}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">({pct.toFixed(0)}%)</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: d.fill }} />
                  </div>
                </div>
              )
            })}
            <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs text-gray-500 font-medium">Total Pengeluaran</span>
              <span className="text-sm font-bold text-[#0d1f3c]">
                {new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(totalPengeluaran)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bar: Pemasukan per Kategori */}
      <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="mb-4">
          <p className="text-sm font-semibold text-[#0d1f3c]">Revenue per Kategori Sesi</p>
          <p className="text-xs text-gray-400 mt-0.5">Berdasarkan tanggal foto bulan ini</p>
        </div>
        {data.pemasukan.perKategori.length === 0 ? (
          <div className="h-[160px] flex items-center justify-center text-gray-300 text-sm">
            Tidak ada booking di periode ini
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data.pemasukan.perKategori} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="kategori" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={44} />
              <Tooltip formatter={(v: unknown) => [fmt(Number(v)), "Revenue"]} cursor={{ fill: "#f8f5f0" }} />
              <Bar dataKey="total" name="Revenue" fill="#C9A84C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
