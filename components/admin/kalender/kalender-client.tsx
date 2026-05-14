"use client"

import { useRouter } from "next/navigation"
import { formatTanggal } from "@/lib/utils"
import { timeToMinutes } from "@/lib/time-utils"
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"

const JAM_MULAI   = 10 * 60
const JAM_SELESAI = 21 * 60
const TOTAL_MENIT = JAM_SELESAI - JAM_MULAI

function menit2jam(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`
}

interface BookingKalender {
  id: string
  kode_booking: string
  nama_client: string
  nama_paket: string
  jam_mulai: string
  jam_selesai: string
  status_sesi: string
}

interface KalenderClientProps {
  tanggal: string
  bookings: BookingKalender[]
}

const STATUS_COLOR: Record<string, string> = {
  booked:        "bg-blue-100 border-blue-400 text-blue-800",
  dp_ok:         "bg-amber-100 border-amber-400 text-amber-800",
  selesai_foto:  "bg-purple-100 border-purple-400 text-purple-800",
  selesai_edit:  "bg-indigo-100 border-indigo-400 text-indigo-800",
  diambil:       "bg-green-100 border-green-400 text-green-800",
  cancel:        "bg-red-50 border-red-200 text-red-300 opacity-50",
}

const STATUS_LABEL: Record<string, string> = {
  booked:        "Booked",
  dp_ok:         "DP OK",
  selesai_foto:  "Selesai Foto",
  selesai_edit:  "Selesai Edit",
  diambil:       "Diambil",
  cancel:        "Cancel",
}

export default function KalenderClient({ tanggal, bookings }: KalenderClientProps) {
  const router = useRouter()

  function navDate(days: number) {
    const d = new Date(tanggal + "T00:00:00")
    d.setDate(d.getDate() + days)
    // Gunakan komponen lokal agar tidak terjadi pergeseran UTC
    const y  = d.getFullYear()
    const mo = String(d.getMonth() + 1).padStart(2, "0")
    const dy = String(d.getDate()).padStart(2, "0")
    router.push(`/admin/kalender?tanggal=${y}-${mo}-${dy}`)
  }

  // Marker jam untuk header (setiap 1 jam)
  const hourMarkers: number[] = []
  for (let m = JAM_MULAI; m <= JAM_SELESAI; m += 60) {
    hourMarkers.push(m)
  }

  // Marker setiap 30 menit untuk grid lines
  const halfHourMarkers: number[] = []
  for (let m = JAM_MULAI; m < JAM_SELESAI; m += 30) {
    halfHourMarkers.push(m)
  }

  const aktifCount = bookings.filter((b) => b.status_sesi !== "cancel").length

  return (
    <div className="space-y-4">
      {/* Navigasi tanggal */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => navDate(-1)}
          className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Kemarin</span>
        </button>

        <div className="flex items-center gap-2 text-center">
          <CalendarDays className="w-4 h-4 text-[#C9A84C] shrink-0" />
          <div>
            <p className="font-semibold text-[#0d1f3c] text-sm leading-tight">
              {formatTanggal(tanggal)}
            </p>
            <p className="text-xs text-gray-400">
              {aktifCount} booking aktif
            </p>
          </div>
        </div>

        <button
          onClick={() => navDate(1)}
          className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition"
        >
          <span className="hidden sm:inline">Besok</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Timeline */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <div style={{ minWidth: 640 }}>
          {/* Header jam */}
          <div className="flex border-b border-gray-100 bg-gray-50">
            <div className="w-28 shrink-0 px-3 py-2 text-[10px] font-medium text-gray-400 uppercase tracking-wide">
              Client
            </div>
            <div className="relative flex-1 py-2">
              {hourMarkers.map((m) => {
                const leftPct = ((m - JAM_MULAI) / TOTAL_MENIT) * 100
                return (
                  <div
                    key={m}
                    className="absolute top-0 flex flex-col items-center"
                    style={{ left: `${leftPct}%`, transform: "translateX(-50%)" }}
                  >
                    <span className="text-[10px] text-gray-400 font-medium">
                      {menit2jam(m)}
                    </span>
                  </div>
                )
              })}
              <div className="h-5" />
            </div>
          </div>

          {/* Baris booking */}
          {bookings.length === 0 ? (
            <div className="py-14 text-center">
              <CalendarDays className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Tidak ada booking pada tanggal ini</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {bookings.map((booking) => {
                const mulai    = timeToMinutes(booking.jam_mulai)
                const selesai  = timeToMinutes(booking.jam_selesai)
                const leftPct  = ((mulai - JAM_MULAI) / TOTAL_MENIT) * 100
                const widthPct = ((selesai - mulai) / TOTAL_MENIT) * 100
                const durasi   = selesai - mulai
                const color    = STATUS_COLOR[booking.status_sesi] ?? "bg-gray-100 border-gray-300 text-gray-700"

                return (
                  <div key={booking.id} className="flex items-center min-h-[56px] hover:bg-gray-50/50 transition">
                    {/* Nama client */}
                    <div className="w-28 shrink-0 px-3 py-2">
                      <p className="text-xs font-semibold text-gray-800 leading-tight truncate">
                        {booking.nama_client}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">{booking.kode_booking}</p>
                    </div>

                    {/* Bar area */}
                    <div className="relative flex-1 h-12 py-1.5">
                      {/* Grid lines setiap 30 menit */}
                      {halfHourMarkers.map((m) => (
                        <div
                          key={m}
                          className="absolute top-0 bottom-0 w-px bg-gray-100"
                          style={{ left: `${((m - JAM_MULAI) / TOTAL_MENIT) * 100}%` }}
                        />
                      ))}

                      {/* Booking bar */}
                      <div
                        className={`absolute inset-y-1.5 rounded-lg border-l-[3px] px-2 flex flex-col justify-center overflow-hidden ${color}`}
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                        title={`${booking.nama_client} | ${booking.jam_mulai}–${booking.jam_selesai} | ${booking.nama_paket}`}
                      >
                        <p className="text-[10px] font-bold leading-tight truncate">
                          {booking.jam_mulai}–{booking.jam_selesai}
                        </p>
                        {durasi >= 60 && (
                          <p className="text-[10px] leading-tight truncate opacity-75">
                            {booking.nama_paket}
                          </p>
                        )}
                        <span className="text-[9px] font-medium opacity-60">
                          {STATUS_LABEL[booking.status_sesi] ?? booking.status_sesi}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {Object.entries(STATUS_LABEL).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm border-l-2 ${STATUS_COLOR[key]}`} />
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
