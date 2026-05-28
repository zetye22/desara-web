"use client"

import { useState, useEffect } from "react"
import { formatTanggal, formatRupiah } from "@/lib/utils"
import { CalendarClock, CreditCard, Loader2 } from "lucide-react"
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

interface PaymentLog {
  id: string
  status_lama: string | null
  status_baru: string
  nominal: number | null
  metode: string | null
  catatan: string | null
  admin_nama: string | null
  created_at: string
}

interface TimelineEvent {
  id: string
  type: "booking_dibuat" | "reschedule" | "pembayaran"
  created_at: string
  data: RescheduleLog | PaymentLog | null
  index?: number
}

function labelStatus(s: string) {
  const map: Record<string, string> = {
    belum_dp: "Belum DP", dp_ok: "DP OK", lunas: "Lunas",
  }
  return map[s] ?? s
}

interface TabRiwayatProps {
  bookingId: string
  createdAt: string
  kodeBooking: string
}

export default function TabRiwayat({ bookingId, createdAt, kodeBooking }: TabRiwayatProps) {
  const [logs, setLogs] = useState<RescheduleLog[]>([])
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/bookings/${bookingId}/reschedule-log`).then((r) => r.json()),
      fetch(`/api/bookings/${bookingId}/payment-log`).then((r) => r.json()),
    ])
      .then(([reschedule, payment]) => {
        setLogs(Array.isArray(reschedule) ? reschedule : [])
        setPaymentLogs(Array.isArray(payment?.items) ? payment.items : [])
      })
      .catch(() => { setLogs([]); setPaymentLogs([]) })
      .finally(() => setLoading(false))
  }, [bookingId])

  // Realtime: reschedule baru
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`riwayat-reschedule-${bookingId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "booking_reschedule_log", filter: `booking_id=eq.${bookingId}` },
        (payload) => {
          const newLog = payload.new as RescheduleLog
          setLogs((prev) => prev.some((l) => l.id === newLog.id) ? prev : [...prev, newLog])
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "booking_payment_log", filter: `booking_id=eq.${bookingId}` },
        (payload) => {
          const newLog = payload.new as PaymentLog
          setPaymentLogs((prev) => prev.some((l) => l.id === newLog.id) ? prev : [...prev, newLog])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [bookingId])

  // Gabung dan sort semua events
  const events: TimelineEvent[] = [
    { id: "booking-dibuat", type: "booking_dibuat", created_at: createdAt, data: null },
    ...logs.map((l, i) => ({ id: l.id, type: "reschedule" as const, created_at: l.created_at, data: l, index: i + 1 })),
    ...paymentLogs.map((p) => ({ id: p.id, type: "pembayaran" as const, created_at: p.created_at, data: p })),
  ].sort((a, b) => a.created_at.localeCompare(b.created_at))

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Riwayat Perubahan
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Memuat riwayat...
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-3 top-3.5 bottom-3.5 w-0.5 bg-gray-200" />

          <div className="space-y-4">
            {events.map((ev) => {
              if (ev.type === "booking_dibuat") {
                return (
                  <div key={ev.id} className="flex gap-3">
                    <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white text-[10px] font-bold">✓</div>
                    <div className="flex-1 pt-0.5">
                      <p className="text-sm font-semibold text-gray-800">Booking Dibuat</p>
                      <p className="text-xs text-gray-500">{kodeBooking}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(ev.created_at).toLocaleString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                )
              }

              if (ev.type === "pembayaran") {
                const p = ev.data as PaymentLog
                const isDp = p.status_baru === "dp_ok"
                const isLunas = p.status_baru === "lunas"
                return (
                  <div key={ev.id} className="flex gap-3">
                    <div className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${isLunas ? "bg-green-500" : isDp ? "bg-amber-500" : "bg-gray-400"}`}>
                      <CreditCard className="w-3 h-3" />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className="text-sm font-semibold text-gray-800">
                        {isLunas ? "Pelunasan" : isDp ? "Konfirmasi DP" : `Pembayaran → ${labelStatus(p.status_baru)}`}
                      </p>
                      <div className={`mt-1.5 rounded-lg border p-2.5 text-xs space-y-1 ${isLunas ? "border-green-100 bg-green-50" : "border-amber-100 bg-amber-50"}`}>
                        {p.status_lama && (
                          <p className="text-gray-500">
                            {labelStatus(p.status_lama)} → <span className="font-semibold">{labelStatus(p.status_baru)}</span>
                          </p>
                        )}
                        {p.nominal != null && p.nominal > 0 && (
                          <p className="font-semibold text-gray-700">{formatRupiah(p.nominal)}</p>
                        )}
                        {p.metode && <p className="text-gray-500">Metode: {p.metode}</p>}
                        {p.catatan && <p className="text-gray-500 italic">{p.catatan}</p>}
                        {p.admin_nama && <p className="text-gray-400">Oleh: {p.admin_nama}</p>}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(ev.created_at).toLocaleString("id-ID", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                )
              }

              // type === "reschedule"
              const log = ev.data as RescheduleLog
              return (
                <div key={ev.id} className="flex gap-3">
                  <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
                    <CalendarClock className="w-3 h-3" />
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-sm font-semibold text-gray-800">Reschedule #{ev.index}</p>
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
                        <p className="text-gray-500 italic border-t border-amber-100 pt-1.5">&ldquo;{log.alasan}&rdquo;</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(log.created_at).toLocaleString("id-ID", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              )
            })}

            {events.length === 1 && (
              <p className="pl-9 text-xs text-gray-400 italic">Belum ada perubahan.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
