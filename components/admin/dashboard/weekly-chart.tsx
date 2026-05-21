"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts"
import type { ChartPoint } from "./types"

export function WeeklyChart({ data }: { data: ChartPoint[] }) {
  const max = Math.max(...data.map((d) => d.jumlah), 1)

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <p className="text-sm font-semibold text-gray-700 mb-4">Booking 7 Hari Terakhir</p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} barSize={28} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
          <XAxis
            dataKey="tanggal"
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "#F9FAFB" }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              return (
                <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm text-xs">
                  <p className="text-gray-500 mb-0.5">{label}</p>
                  <p className="font-semibold text-[#0d1f3c]">{payload[0].value} booking</p>
                </div>
              )
            }}
          />
          <Bar dataKey="jumlah" radius={[6, 6, 0, 0]}>
            {data.map((entry, idx) => (
              <Cell
                key={idx}
                fill={entry.jumlah === max && max > 0 ? "#C9A84C" : "#E5E7EB"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
