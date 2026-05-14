"use client"

import { useState, useEffect } from "react"
import { formatTanggal } from "@/lib/utils"
import { CalendarClock, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface RescheduleLog {
  id: string
  tgl_foto_lama: string
  jam_mulai_lama: string
  jam_selesai_lama: string
  tgl_foto_baru: string
  jam_mulai_baru: string
  jam_selesai_baru: string
  alasan: string | null
  created_at: string
}

interface TabRiwayatProps {
  bookingId: string
  createdAt: string
  kodeBooking: string
}

export default function TabRiwayat({ bookingId, createdAt, kodeBooking }: TabRiwayatProps) {
  const [logs, setLogs] = useState<RescheduleLog[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch awal
  useEffect(() => {
    fetch(`/api/bookings/${bookingId}/reschedule-log`)
      .then((r) => r.json())
      .then((data) => setLogs(Array.isArray(data) ? data : []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [bookingId])

  // Realtime: tambah log reschedule baru tanpa reload
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`riwayat-reschedule-${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "booking_reschedule_log",
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          const newLog = payload.new as RescheduleLog
          setLogs((prev) => {
            // Jangan duplikat kalau sudah ada
            if (prev.some((l) => l.id === newLog.id)) return prev
            return [...prev, newLog]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [bookingId])

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Riwayat Perubahan Jadwal
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Memuat riwayat...
        </div>
      ) : (
        <div className="relative">
          {/* Garis vertikal timeline */}
          <div className="absolute left-3 top-3.5 bottom-3.5 w-0.5 bg-gray-200" />

          <div className="space-y-4">
            {/* Event: Booking dibuat */}
            <div className="flex gap-3">
              <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white text-[10px] font-bold">
                ✓
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm font-semibold text-gray-800">Booking Dibuat</p>
                <p className="text-xs text-gray-500">{kodeBooking}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(createdAt).toLocaleString("id-ID", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {/* Events: Reschedule */}
            {logs.map((log, i) => (
              <div key={log.id} className="flex gap-3">
                <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
                  <CalendarClock className="w-3 h-3" />
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="text-sm font-semibold text-gray-800">Reschedule #{i + 1}</p>
                  <div className="mt-1.5 rounded-lg border border-amber-100 bg-amber-50 p-2.5 text-xs space-y-1.5">
                    <div className="flex items-start gap-3">
                      <div>
                        <p className="text-gray-400 mb-0.5">Sebelum</p>
                        <p className="font-medium text-gray-700">{formatTanggal(log.tgl_foto_lama)}</p>
                        <p className="text-gray-500">{log.jam_mulai_lama}–{log.jam_selesai_lama} WIB</p>
                      </div>
                      <span className="text-gray-400 text-sm mt-3">→</span>
                      <div>
                        <p className="text-gray-400 mb-0.5">Sesudah</p>
                        <p className="font-medium text-[#C9A84C]">{formatTanggal(log.tgl_foto_baru)}</p>
                        <p className="text-gray-500">{log.jam_mulai_baru}–{log.jam_selesai_baru} WIB</p>
                      </div>
                    </div>
                    {log.alasan && (
                      <p className="text-gray-500 italic border-t border-amber-100 pt-1.5">
                        &ldquo;{log.alasan}&rdquo;
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(log.created_at).toLocaleString("id-ID", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}

            {logs.length === 0 && (
              <p className="pl-9 text-xs text-gray-400 italic">Belum ada perubahan jadwal.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
