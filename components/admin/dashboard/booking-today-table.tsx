"use client"

import { useState } from "react"
import { CalendarDays } from "lucide-react"
import { BACKGROUNDS } from "@/lib/constants"
import { BookingDetailModal } from "./booking-detail-modal"
import type { BookingRow } from "./types"

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  booked:       { label: "Booked",       cls: "bg-gray-100 text-gray-600" },
  dp_ok:        { label: "DP OK",        cls: "bg-green-100 text-green-700" },
  selesai_foto: { label: "Foto Selesai", cls: "bg-blue-100 text-blue-700" },
  selesai_edit: { label: "Edit Selesai", cls: "bg-purple-100 text-purple-700" },
  diambil:      { label: "Diambil",      cls: "bg-teal-100 text-teal-700" },
  cancel:       { label: "Cancel",       cls: "bg-red-100 text-red-700" },
}

export function BookingTodayTable({ bookings }: { bookings: BookingRow[] }) {
  const [selected, setSelected] = useState<BookingRow | null>(null)

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
        <CalendarDays className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-500">Tidak ada booking hari ini.</p>
        <p className="text-sm text-gray-400 mt-0.5">Selamat istirahat! 😊</p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50">
              <Th>Jam</Th>
              <Th>Nama Client</Th>
              <Th>Paket</Th>
              <Th>Background</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => {
              const s = STATUS_CFG[b.status_sesi] ?? { label: b.status_sesi, cls: "bg-gray-100 text-gray-600" }
              const bgNama = (b.background_dipilih ?? [])
                .map((id) => BACKGROUNDS.find((bg) => bg.id === id)?.nama ?? id)
                .join(", ")
              return (
                <tr
                  key={b.id}
                  onClick={() => setSelected(b)}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 cursor-pointer transition-colors"
                >
                  <Td>
                    <span className="font-semibold text-[#0d1f3c]">{b.jam_mulai.slice(0, 5)}</span>
                    <span className="text-gray-400 text-xs block">{b.jam_selesai.slice(0, 5)}</span>
                  </Td>
                  <Td>
                    <span className="font-medium text-gray-800">{b.nama_client}</span>
                    <span className="text-gray-400 text-xs block">{b.kode_booking}</span>
                  </Td>
                  <Td>{b.nama_paket}</Td>
                  <Td className="text-gray-500">{bgNama || "—"}</Td>
                  <Td>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {bookings.map((b) => {
          const s = STATUS_CFG[b.status_sesi] ?? { label: b.status_sesi, cls: "bg-gray-100 text-gray-600" }
          return (
            <div
              key={b.id}
              onClick={() => setSelected(b)}
              className="bg-white rounded-2xl border border-gray-100 px-4 py-3.5 flex items-center gap-3 cursor-pointer active:bg-gray-50"
            >
              <div className="text-center w-14 shrink-0">
                <p className="text-base font-bold text-[#0d1f3c]">{b.jam_mulai.slice(0, 5)}</p>
                <p className="text-xs text-gray-400">{b.jam_selesai.slice(0, 5)}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{b.nama_client}</p>
                <p className="text-xs text-gray-400 truncate">{b.nama_paket}</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${s.cls}`}>{s.label}</span>
            </div>
          )
        })}
      </div>

      <BookingDetailModal booking={selected} onClose={() => setSelected(null)} />
    </>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
      {children}
    </th>
  )
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-4 py-3.5 ${className ?? "text-gray-700"}`}>{children}</td>
  )
}
