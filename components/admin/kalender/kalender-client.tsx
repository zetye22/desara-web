"use client"

import { useRouter } from "next/navigation"
import { formatTanggal } from "@/lib/utils"
import { timeToMinutes } from "@/lib/time-utils"
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"

const JAM_MULAI  = 10 * 60   // 600
const JAM_SELESAI = 21 * 60  // 1260
const HOUR_PX    = 80        // px per jam
const HOURS      = Array.from({ length: 12 }, (_, i) => 10 + i) // 10..21
const TOTAL_H    = (HOURS.length - 1) * HOUR_PX  // 880px

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

const STATUS_CFG: Record<string, { label: string; bg: string; border: string; text: string; dot: string }> = {
  booked:       { label: "Booked",       bg: "bg-sky-50",     border: "border-sky-400",     text: "text-sky-900",     dot: "bg-sky-400" },
  dp_ok:        { label: "DP OK",        bg: "bg-amber-50",   border: "border-amber-400",   text: "text-amber-900",   dot: "bg-amber-400" },
  selesai_foto: { label: "Selesai Foto", bg: "bg-violet-50",  border: "border-violet-400",  text: "text-violet-900",  dot: "bg-violet-400" },
  selesai_edit: { label: "Selesai Edit", bg: "bg-indigo-50",  border: "border-indigo-400",  text: "text-indigo-900",  dot: "bg-indigo-400" },
  diambil:      { label: "Diambil",      bg: "bg-emerald-50", border: "border-emerald-400", text: "text-emerald-900", dot: "bg-emerald-400" },
  cancel:       { label: "Cancel",       bg: "bg-gray-50",    border: "border-gray-300",    text: "text-gray-400",    dot: "bg-gray-300" },
}

interface PlacedBooking {
  booking: BookingKalender
  col: number
  totalCols: number
  topPx: number
  heightPx: number
}

function placeBookings(bookings: BookingKalender[]): PlacedBooking[] {
  const sorted = [...bookings].sort(
    (a, b) => timeToMinutes(a.jam_mulai) - timeToMinutes(b.jam_mulai)
  )
  const placed: PlacedBooking[] = []
  const colEnds: number[] = []

  for (const b of sorted) {
    const start = timeToMinutes(b.jam_mulai)
    const end   = timeToMinutes(b.jam_selesai)
    let col = colEnds.findIndex((e) => e <= start)
    if (col === -1) { col = colEnds.length; colEnds.push(end) }
    else colEnds[col] = end

    placed.push({
      booking:   b,
      col,
      totalCols: 1,
      topPx:     ((start - JAM_MULAI) / 60) * HOUR_PX,
      heightPx:  Math.max(((end - start) / 60) * HOUR_PX, 32),
    })
  }

  // Hitung totalCols berdasarkan overlap
  for (const item of placed) {
    const s1 = timeToMinutes(item.booking.jam_mulai)
    const e1 = timeToMinutes(item.booking.jam_selesai)
    item.totalCols = placed
      .filter(o => timeToMinutes(o.booking.jam_mulai) < e1 && timeToMinutes(o.booking.jam_selesai) > s1)
      .reduce((max, o) => Math.max(max, o.col), 0) + 1
  }

  return placed
}

function getTodayJkt(): string {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }))
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export default function KalenderClient({ tanggal, bookings }: KalenderClientProps) {
  const router   = useRouter()
  const todayJkt = getTodayJkt()
  const isToday  = tanggal === todayJkt

  function navDate(days: number) {
    const d  = new Date(tanggal + "T00:00:00")
    d.setDate(d.getDate() + days)
    const y  = d.getFullYear()
    const mo = String(d.getMonth() + 1).padStart(2, "0")
    const dy = String(d.getDate()).padStart(2, "0")
    router.push(`/admin/kalender?tanggal=${y}-${mo}-${dy}`)
  }

  const aktifCount = bookings.filter(b => b.status_sesi !== "cancel").length
  const placed     = placeBookings(bookings)

  const statusCounts = bookings.reduce((acc, b) => {
    acc[b.status_sesi] = (acc[b.status_sesi] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Posisi garis "sekarang"
  const nowJkt  = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }))
  const nowMin  = nowJkt.getHours() * 60 + nowJkt.getMinutes()
  const nowTop  = isToday && nowMin >= JAM_MULAI && nowMin <= JAM_SELESAI
    ? ((nowMin - JAM_MULAI) / 60) * HOUR_PX
    : null

  return (
    <div className="space-y-4">

      {/* ── Header navigasi ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navDate(-1)}
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-[#C9A84C] shrink-0" />
              <p className="font-bold text-[#0d1f3c]">{formatTanggal(tanggal)}</p>
              {isToday && (
                <span className="text-[10px] font-semibold bg-[#C9A84C]/20 text-[#a07c28] px-2 py-0.5 rounded-full">
                  Hari Ini
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {aktifCount} booking aktif
              {bookings.length !== aktifCount ? ` · ${bookings.length - aktifCount} cancel` : ""}
            </p>
          </div>

          <button
            onClick={() => navDate(1)}
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Pills status */}
        {bookings.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-50">
            {Object.entries(statusCounts).map(([status, count]) => {
              const cfg = STATUS_CFG[status]
              if (!cfg) return null
              return (
                <span
                  key={status}
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                  {count}× {cfg.label}
                </span>
              )
            })}
          </div>
        )}

        {/* Tombol kembali ke hari ini */}
        {!isToday && (
          <div className="mt-3 pt-3 border-t border-gray-50 text-center">
            <button
              onClick={() => router.push("/admin/kalender")}
              className="text-xs font-medium text-[#0d1f3c] hover:underline"
            >
              ← Kembali ke Hari Ini
            </button>
          </div>
        )}
      </div>

      {/* ── Timeline ── */}
      {bookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
          <CalendarDays className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500">Tidak ada booking pada tanggal ini</p>
          <p className="text-xs text-gray-400 mt-1">Selamat istirahat! 😊</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="relative flex" style={{ height: TOTAL_H }}>

            {/* Kolom jam */}
            <div className="w-14 shrink-0 border-r border-gray-100 relative">
              {HOURS.map((hour, i) => (
                <div
                  key={hour}
                  className="absolute w-full text-right pr-2"
                  style={{ top: i * HOUR_PX - 7 }}
                >
                  <span className="text-[10px] font-medium text-gray-400 leading-none">
                    {String(hour).padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Area grid + events */}
            <div className="flex-1 relative overflow-hidden">

              {/* Garis jam (solid) */}
              {HOURS.map((_, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 border-t border-gray-100"
                  style={{ top: i * HOUR_PX }}
                />
              ))}

              {/* Garis setengah jam (dashed, lebih samar) */}
              {HOURS.slice(0, -1).map((_, i) => (
                <div
                  key={`h${i}`}
                  className="absolute left-0 right-0 border-t border-dashed border-gray-50"
                  style={{ top: i * HOUR_PX + HOUR_PX / 2 }}
                />
              ))}

              {/* Garis waktu sekarang */}
              {nowTop !== null && (
                <div
                  className="absolute left-0 right-0 z-20 flex items-center"
                  style={{ top: nowTop }}
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 -ml-1" />
                  <div className="flex-1 border-t border-red-400" />
                </div>
              )}

              {/* Booking events */}
              {placed.map(({ booking, col, totalCols, topPx, heightPx }) => {
                const cfg      = STATUS_CFG[booking.status_sesi] ?? STATUS_CFG.booked
                const isCancel = booking.status_sesi === "cancel"
                const wPct     = 100 / totalCols

                return (
                  <div
                    key={booking.id}
                    className={`absolute rounded-lg border-l-[3px] overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${cfg.bg} ${cfg.border} ${isCancel ? "opacity-40" : ""}`}
                    style={{
                      top:     topPx + 2,
                      height:  heightPx - 4,
                      left:    `calc(${col * wPct}% + 3px)`,
                      width:   `calc(${wPct}% - 6px)`,
                      padding: "5px 6px 5px 9px",
                    }}
                    title={`${booking.nama_client} · ${booking.jam_mulai.slice(0, 5)}–${booking.jam_selesai.slice(0, 5)} · ${booking.nama_paket}`}
                  >
                    <p className={`text-[11px] font-bold leading-tight truncate ${cfg.text}`}>
                      {booking.nama_client}
                    </p>

                    {heightPx >= 46 && (
                      <p className={`text-[10px] leading-tight truncate mt-0.5 ${cfg.text} opacity-70`}>
                        {booking.jam_mulai.slice(0, 5)}–{booking.jam_selesai.slice(0, 5)}
                      </p>
                    )}

                    {heightPx >= 64 && (
                      <p className={`text-[10px] leading-tight truncate ${cfg.text} opacity-55`}>
                        {booking.nama_paket}
                      </p>
                    )}

                    {heightPx < 46 && (
                      <p className={`text-[9px] leading-tight truncate ${cfg.text} opacity-60`}>
                        {booking.jam_mulai.slice(0, 5)}–{booking.jam_selesai.slice(0, 5)}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Legend ── */}
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {Object.entries(STATUS_CFG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-sm ${cfg.dot}`} />
            <span className="text-xs text-gray-500">{cfg.label}</span>
          </div>
        ))}
      </div>

    </div>
  )
}
