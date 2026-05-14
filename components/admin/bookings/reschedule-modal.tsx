"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Calendar } from "@/components/ui/calendar"
import { CalendarClock, Clock, Loader2, AlertTriangle } from "lucide-react"
import { formatTanggal } from "@/lib/utils"
import { timeToMinutes } from "@/lib/time-utils"

interface BookingRow {
  id: string
  kode_booking: string
  nama_client: string
  nama_paket: string
  tgl_foto: string
  jam_mulai: string
  jam_selesai: string
}

interface SlotInfo {
  jam: string
  available: boolean
  alasan: string | null
}

interface RescheduleModalProps {
  booking: BookingRow
  onClose: () => void
  onSuccess: () => void
}

export default function RescheduleModal({ booking, onClose, onSuccess }: RescheduleModalProps) {
  const [tglBaru, setTglBaru]     = useState("")
  const [jamBaru, setJamBaru]     = useState("")
  const [alasan, setAlasan]       = useState("")
  const [tambahCharge, setTambahCharge] = useState(false)
  const [slotStatus, setSlotStatus] = useState<Record<string, SlotInfo>>({})
  const [loadingSlot, setLoadingSlot] = useState(false)
  const [saving, setSaving]       = useState(false)

  const durasiMenit = timeToMinutes(booking.jam_selesai) - timeToMinutes(booking.jam_mulai)

  // Cek apakah reschedule mendadak (booking H-1 atau hari-H)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const bookingDate = new Date(booking.tgl_foto + "T00:00:00")
  const daysLeft = Math.ceil((bookingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const isMendadak = daysLeft <= 1

  // Tanggal minimum untuk reschedule: besok
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  const fetchSlot = useCallback(async (tanggal: string) => {
    setLoadingSlot(true)
    setSlotStatus({})
    setJamBaru("")
    try {
      const params = new URLSearchParams({
        tanggal,
        durasi_menit: String(durasiMenit),
        exclude_booking_id: booking.id,
      })
      const res  = await fetch(`/api/bookings/cek-slot?${params}`)
      const json = await res.json() as { slots?: SlotInfo[] }
      if (json.slots) {
        const map: Record<string, SlotInfo> = {}
        json.slots.forEach((s) => { map[s.jam] = s })
        setSlotStatus(map)
      }
    } catch {
      toast.error("Gagal memuat ketersediaan slot")
    } finally {
      setLoadingSlot(false)
    }
  }, [durasiMenit, booking.id])

  useEffect(() => {
    if (tglBaru) fetchSlot(tglBaru)
  }, [tglBaru, fetchSlot])

  async function handleSave() {
    if (!tglBaru || !jamBaru) return toast.error("Pilih tanggal dan jam baru")
    setSaving(true)
    try {
      const res = await fetch(`/api/bookings/${booking.id}/reschedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tgl_foto_baru:  tglBaru,
          jam_mulai_baru: jamBaru,
          alasan:         alasan.trim() || null,
          tambah_charge:  tambahCharge,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Gagal reschedule")
        return
      }
      toast.success("Jadwal berhasil diubah! WA notifikasi dikirim ke client.")
      onSuccess()
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  const jamSelesaiBaru = jamBaru
    ? (() => {
        const [h, m] = jamBaru.split(":").map(Number)
        const selesai = new Date(0, 0, 0, h, m + durasiMenit)
        return `${String(selesai.getHours()).padStart(2, "0")}:${String(selesai.getMinutes()).padStart(2, "0")}`
      })()
    : null

  const selectedDate = tglBaru ? new Date(tglBaru + "T00:00:00") : undefined

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 sticky top-0 bg-[#0d1f3c] z-10">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-[#C9A84C]" />
            <div>
              <p className="text-xs text-white/60">Reschedule Booking</p>
              <h3 className="font-bold text-white">{booking.kode_booking}</h3>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-lg">✕</button>
        </div>

        <div className="p-5 space-y-5">
          {/* Info booking saat ini */}
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm">
            <p className="font-semibold text-amber-800 mb-1">Jadwal Saat Ini</p>
            <p className="text-amber-700">
              {booking.nama_client} · {booking.nama_paket}
            </p>
            <p className="text-amber-600">
              📅 {formatTanggal(booking.tgl_foto)} · ⏰ {booking.jam_mulai}–{booking.jam_selesai} WIB
              <span className="ml-2 text-xs">({durasiMenit} menit)</span>
            </p>
          </div>

          {/* Warning reschedule mendadak */}
          {isMendadak && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-red-700">Reschedule Mendadak</p>
                  <p className="text-red-600 mt-0.5">
                    Booking ini dijadwalkan {daysLeft <= 0 ? "hari ini" : "besok"}.
                    Biasanya dikenakan charge admin Rp 50.000.
                  </p>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tambahCharge}
                      onChange={(e) => setTambahCharge(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-red-700 font-medium">Tambahkan charge Rp 50.000 ke booking</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Pilih tanggal baru */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Tanggal Baru</p>
            <div className="border border-gray-200 rounded-xl overflow-hidden w-fit">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => {
                  if (d) setTglBaru(d.toISOString().split("T")[0])
                }}
                disabled={(d) => d < tomorrow}
                className="p-3"
              />
            </div>
            {tglBaru && (
              <p className="mt-1.5 text-sm text-[#C9A84C] font-medium">
                ✓ {formatTanggal(tglBaru)}
              </p>
            )}
          </div>

          {/* Pilih jam baru */}
          {tglBaru && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Jam Mulai Baru
                <span className="ml-1 text-xs font-normal text-gray-400">(Durasi: {durasiMenit} menit)</span>
              </p>

              {loadingSlot ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mengecek ketersediaan...
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {Object.values(slotStatus).map((slot) => (
                    <button
                      key={slot.jam}
                      onClick={() => slot.available && setJamBaru(slot.jam)}
                      disabled={!slot.available}
                      title={!slot.available && slot.alasan ? slot.alasan : undefined}
                      className={`flex items-center justify-center gap-1 rounded-lg border py-2 text-xs font-medium transition
                        ${jamBaru === slot.jam
                          ? "border-[#C9A84C] bg-[#C9A84C] text-white"
                          : !slot.available
                          ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                        }`}
                    >
                      <Clock className="w-3 h-3" />
                      {slot.jam}
                    </button>
                  ))}
                </div>
              )}

              {jamBaru && jamSelesaiBaru && (
                <p className="mt-2 text-sm text-blue-600 font-medium">
                  Sesi baru: {jamBaru} – {jamSelesaiBaru} WIB
                </p>
              )}
            </div>
          )}

          {/* Alasan */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">
              Alasan Reschedule <span className="font-normal text-gray-400">(opsional)</span>
            </label>
            <textarea
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              rows={2}
              placeholder="Contoh: Client minta jadwal sore..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20"
            />
          </div>

          {/* Tombol */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={!tglBaru || !jamBaru || saving}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
              style={{ backgroundColor: "#0d1f3c" }}
            >
              {saving ? "Menyimpan..." : "Konfirmasi Reschedule"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
