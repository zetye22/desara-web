"use client"

import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts"
import type { LaporanData } from "./types"

// Format Rupiah untuk tooltip chart
const fmtRupiah = (v: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(v)

// Format singkat untuk axis Y
const fmtSingkat = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}rb`
  return String(v)
}

const WARNA_PIE = ["#0d1f3c", "#C9A84C", "#94A3B8"]

interface ChartsProps {
  data: LaporanData
}

// Tooltip custom Rupiah
function TooltipRupiah({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      {label && <p className="font-semibold text-gray-700 mb-1">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {fmtRupiah(entry.value)}
        </p>
      ))}
    </div>
  )
}

export function Charts({ data }: ChartsProps) {
  // Data pie distribusi pengeluaran
  const pieData = [
    { name: "HPP", value: data.pengeluaran.totalHpp },
    { name: "Operasional", value: data.pengeluaran.totalOperasional },
    { name: "Lain-lain", value: data.pengeluaran.totalLainnya },
  ].filter((d) => d.value > 0)

  // Data bar distribusi pemasukan (paket vs addon)
  const barData = [
    { nama: "Paket", revenue: data.pemasukan.totalPaket },
    { nama: "Add-on Awal", revenue: data.pemasukan.addonBookingAwal },
    { nama: "Add-on Lapangan", revenue: data.pemasukan.addonLapangan },
  ].filter((d) => d.revenue > 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* ── Chart 1: Tren Profit 6 Bulan ──────────────────────────────── */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-semibold text-[#0d1f3c] text-sm mb-4">
          Tren Profit 6 Bulan Terakhir
        </h3>
        {data.tren6Bulan.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
            Belum ada data tren
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.tren6Bulan} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={fmtSingkat}
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip content={<TooltipRupiah />} />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
              />
              <Line
                type="monotone"
                dataKey="pemasukan"
                name="Pemasukan"
                stroke="#0d1f3c"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="pengeluaran"
                name="Pengeluaran"
                stroke="#F97316"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="laba"
                name="Laba"
                stroke="#16A34A"
                strokeWidth={2}
                strokeDasharray="4 2"
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Chart 3: Distribusi Pengeluaran (Pie) ─────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-semibold text-[#0d1f3c] text-sm mb-4">
          Distribusi Pengeluaran
        </h3>
        {pieData.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
            Belum ada pengeluaran
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="45%"
                outerRadius={75}
                dataKey="value"
                label={({ percent }: { percent?: number }) => percent != null ? `${(percent * 100).toFixed(0)}%` : ""}
                labelLine={false}
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={WARNA_PIE[index % WARNA_PIE.length]} />
                ))}
              </Pie>
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [fmtRupiah(Number(value)), ""]}
              />
              <Legend
                wrapperStyle={{ fontSize: "11px", paddingTop: "4px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Chart 2: Distribusi Pemasukan (Bar) ───────────────────────── */}
      <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-semibold text-[#0d1f3c] text-sm mb-4">
          Distribusi Sumber Pemasukan
        </h3>
        {barData.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
            Belum ada data revenue
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="nama"
                tick={{ fontSize: 12, fill: "#6B7280" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={fmtSingkat}
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [fmtRupiah(Number(value)), "Revenue"]}
                cursor={{ fill: "#f9f5ed" }}
              />
              <Bar dataKey="revenue" name="Revenue" fill="#C9A84C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
