"use client"

import { useState, useEffect, useCallback, useMemo, memo } from "react"
import { ChevronRight, ChevronLeft, Clock, Loader2, CalendarX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useBookingStore } from "@/lib/booking-store"
import { hitungHarga } from "@/lib/harga-booking"
import { generateSlotJam } from "@/lib/time-utils"
import { createClient } from "@/lib/supabase/client"

// ── Timezone helpers ────────────────────────────────────────────────────────
function toJktDateStr(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })
}
function todayJkt() { return toJktDateStr(new Date()) }
function tomorrowJkt() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return toJktDateStr(d)
}

// ── Slot types ───────────────────────────────────────────────────────────────
interface SlotInfo {
  jam: string
  available: boolean
  alasan: string | null
}

// ── Custom mini calendar ─────────────────────────────────────────────────────
const HARI  = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]
const BULAN = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
]

function MiniKalender({
  selected,
  onSelect,
  minDate,
  blockedDates,
}: {
  selected: string | null
  onSelect: (d: string) => void
  minDate: string
  blockedDates: Set<string>
}) {
  const now    = new Date()
  const [year, setYear]   = useState(selected ? parseInt(selected.slice(0, 4)) : now.getFullYear())
  const [month, setMonth] = useState(selected ? parseInt(selected.slice(5, 7)) - 1 : now.getMonth())

  const today    = todayJkt()
  const firstDay = new Date(year, month, 1).getDay()
  const lastDay  = new Date(year, month + 1, 0).getDate()

  function prevBulan() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextBulan() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: lastDay }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="select-none">
      {/* Header bulan */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevBulan}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          aria-label="Bulan sebelumnya"
        >
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <span className="text-sm font-bold text-[#0d1f3c]">
          {BULAN[month]} {year}
        </span>
        <button
          onClick={nextBulan}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          aria-label="Bulan berikutnya"
        >
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Header hari */}
      <div className="grid grid-cols-7 mb-2">
        {HARI.map((h) => (
          <div key={h} className="text-center text-[11px] font-semibold text-gray-400 py-1">
            {h}
          </div>
        ))}
      </div>

      {/* Grid tanggal */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />
          const dateStr  = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
          const isSel    = dateStr === selected
          const isToday  = dateStr === today
          const isLibur  = blockedDates.has(dateStr)
          const isDis    = dateStr < minDate || isLibur

          return (
            <button
              key={dateStr}
              onClick={() => !isDis && onSelect(dateStr)}
              disabled={isDis}
              title={isLibur ? "Studio tutup" : undefined}
              className={`
                relative mx-auto flex h-9 w-9 items-center justify-center rounded-full
                text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/50
                ${isSel
                  ? "bg-[#0d1f3c] text-white shadow-md scale-105"
                  : isLibur
                  ? "bg-red-50 text-red-300 cursor-not-allowed line-through"
                  : isDis
                  ? "text-gray-200 cursor-not-allowed"
                  : isToday
                  ? "text-[#C9A84C] font-bold hover:bg-[#C9A84C]/10"
                  : "text-gray-700 hover:bg-gray-100"
                }
              `}
            >
              {day}
              {isToday && !isSel && !isLibur && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#C9A84C]" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Slot button ──────────────────────────────────────────────────────────────
const SlotButton = memo(function SlotButton({
  jam, isSelected, available, onClick,
}: {
  jam: string
  isSelected: boolean
  available: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={available ? onClick : undefined}
      disabled={!available}
      aria-pressed={isSelected}
      className={`
        relative flex flex-col items-center justify-center rounded-xl border-2 py-2.5 px-1
        text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/50
        ${isSelected
          ? "border-[#C9A84C] bg-[#C9A84C] text-white shadow-md scale-105"
          : !available
          ? "border-gray-100 bg-gray-50 text-gray-200 cursor-not-allowed"
          : "border-gray-200 bg-white text-gray-700 hover:border-[#0d1f3c]/40 hover:bg-gray-50"
        }
      `}
    >
      {jam}
      <span className={`mt-0.5 w-1.5 h-1.5 rounded-full ${
        isSelected ? "bg-white/60" : available ? "bg-green-400" : "bg-gray-200"
      }`} />
    </button>
  )
})

// ── Main component ───────────────────────────────────────────────────────────
export function Step2PilihJadwal() {
  const {
    tanggalFoto, jamMulai, paketId, addons, katalog,
    setTanggal, setJamMulai, nextStep, prevStep,
  } = useBookingStore()

  const [slotStatus, setSlotStatus]     = useState<Record<string, SlotInfo>>({})
  const [loadingSlot, setLoadingSlot]   = useState(false)
  const [isLibur, setIsLibur]           = useState(false)
  const [liburKet, setLiburKet]         = useState<string | null>(null)
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set())

  const rincian    = useMemo(() => hitungHarga(paketId, addons, katalog), [paketId, addons, katalog])
  const bisaLanjut = !!tanggalFoto && !!jamMulai && !isLibur
  const minDate    = todayJkt()

  // Fetch daftar tanggal libur sekali saat mount
  useEffect(() => {
    fetch("/api/tanggal-libur")
      .then((r) => r.json())
      .then((d) => {
        const set = new Set<string>((d.items ?? []).map((i: { tanggal: string }) => i.tanggal))
        setBlockedDates(set)
      })
      .catch(() => { /* silent */ })
  }, [])

  // Fetch ketersediaan slot
  const fetchSlot = useCallback(async (tanggal: string) => {
    if (!rincian.durasiTotal) return
    setLoadingSlot(true)
    setSlotStatus({})
    setIsLibur(false)
    setLiburKet(null)
    try {
      const params = new URLSearchParams({
        tanggal,
        durasi_menit: String(rincian.durasiTotal),
      })
      const res  = await fetch(`/api/bookings/cek-slot?${params}`)
      const json = await res.json() as { slots?: SlotInfo[]; libur?: boolean; keterangan?: string | null }
      if (json.libur) {
        setIsLibur(true)
        setLiburKet(json.keterangan ?? null)
      }
      if (json.slots) {
        const map: Record<string, SlotInfo> = {}
        json.slots.forEach((s) => { map[s.jam] = s })
        setSlotStatus(map)
      }
    } catch {
      /* Biarkan slot tampak tersedia jika fetch gagal */
    } finally {
      setLoadingSlot(false)
    }
  }, [rincian.durasiTotal])

  useEffect(() => {
    if (tanggalFoto) fetchSlot(tanggalFoto)
  }, [tanggalFoto, fetchSlot])

  // Realtime: subscribe ke perubahan booking di tanggal ini
  useEffect(() => {
    if (!tanggalFoto) return
    const supabase = createClient()
    const channel = supabase
      .channel(`slots-${tanggalFoto}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" },
        (payload) => {
          const row = (payload.new ?? payload.old) as { tgl_foto?: string } | null
          if (row?.tgl_foto === tanggalFoto) fetchSlot(tanggalFoto)
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [tanggalFoto, fetchSlot])

  // Reset jam jika slot yang dipilih tidak lagi available
  useEffect(() => {
    if (jamMulai && slotStatus[jamMulai] && !slotStatus[jamMulai].available) {
      setJamMulai("")
    }
  }, [slotStatus, jamMulai, setJamMulai])

  // Hitung jam selesai
  const jamSelesai = useMemo(() => {
    if (!jamMulai || !rincian.durasiTotal) return null
    const [h, m] = jamMulai.split(":").map(Number)
    const totalMin = h * 60 + m + rincian.durasiTotal
    return `${String(Math.floor(totalMin / 60)).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`
  }, [jamMulai, rincian.durasiTotal])

  // Label tanggal untuk display
  const labelTanggal = tanggalFoto
    ? new Date(tanggalFoto + "T00:00:00").toLocaleDateString("id-ID", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })
    : null

  const slots = Object.keys(slotStatus).length > 0
    ? Object.values(slotStatus)
    : generateSlotJam().map((jam) => ({ jam, available: true, alasan: null }))

  return (
    <div>
      <h2 className="text-xl font-bold text-[#0d1f3c] mb-1">Pilih Tanggal & Jam</h2>
      <p className="text-sm text-gray-500 mb-6">
        Jam operasional studio: <span className="font-medium text-gray-700">10:00 – 21:00 WIB</span>
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* ── Kolom kiri: Kalender ── */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-[#0d1f3c] text-white text-xs flex items-center justify-center font-bold">1</span>
            Pilih Tanggal
          </p>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <MiniKalender
              selected={tanggalFoto}
              onSelect={(d) => { setTanggal(d); setJamMulai("") }}
              minDate={minDate}
              blockedDates={blockedDates}
            />
            {/* Legend libur */}
            {blockedDates.size > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
                <span className="w-3 h-3 rounded-full bg-red-100 border border-red-200 inline-block shrink-0" />
                Tanggal dicoret = studio tutup
              </div>
            )}
          </div>

          {/* Tanggal terpilih */}
          {labelTanggal && (
            <div className="flex items-center gap-2 rounded-xl bg-[#0d1f3c]/5 border border-[#0d1f3c]/10 px-4 py-2.5">
              <span className="text-lg">📅</span>
              <div>
                <p className="text-xs text-gray-500">Tanggal dipilih</p>
                <p className="text-sm font-semibold text-[#0d1f3c]">{labelTanggal}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Kolom kanan: Slot jam ── */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-[#0d1f3c] text-white text-xs flex items-center justify-center font-bold">2</span>
            Pilih Jam Mulai
            {rincian.durasiTotal > 0 && (
              <span className="text-xs font-normal text-gray-400 ml-1">
                ({rincian.durasiTotal} menit)
              </span>
            )}
          </p>

          {!tanggalFoto ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-12 flex flex-col items-center gap-2 text-center">
              <Clock className="w-8 h-8 text-gray-300" />
              <p className="text-sm text-gray-400">Pilih tanggal terlebih dahulu</p>
            </div>
          ) : isLibur ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 py-12 flex flex-col items-center gap-2 text-center">
              <CalendarX className="w-8 h-8 text-red-300" />
              <p className="text-sm font-semibold text-red-600">Studio Tutup</p>
              {liburKet && <p className="text-xs text-red-400">{liburKet}</p>}
              <p className="text-xs text-red-300 mt-1">Silakan pilih tanggal lain</p>
            </div>
          ) : loadingSlot ? (
            <div className="rounded-2xl border border-gray-100 bg-white py-12 flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              <p className="text-sm text-gray-400">Mengecek ketersediaan…</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {slots.map((slot) => (
                  <SlotButton
                    key={slot.jam}
                    jam={slot.jam}
                    isSelected={jamMulai === slot.jam}
                    available={slot.available}
                    onClick={() => setJamMulai(slot.jam)}
                  />
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 border-t border-gray-50">
                {[
                  { dot: "bg-[#C9A84C]", label: "Dipilih" },
                  { dot: "bg-green-400", label: "Tersedia" },
                  { dot: "bg-gray-200",  label: "Penuh / Lewat" },
                ].map(({ dot, label }) => (
                  <span key={label} className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Info sesi */}
          {jamMulai && jamSelesai && (
            <div className="flex items-center gap-3 rounded-xl bg-[#C9A84C]/8 border border-[#C9A84C]/20 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-[#C9A84C]/15 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-[#C9A84C]" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Durasi sesi</p>
                <p className="text-sm font-bold text-[#0d1f3c]">
                  {jamMulai} <span className="text-gray-400 font-normal">–</span> {jamSelesai} <span className="text-xs font-normal text-gray-500">WIB</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigasi */}
      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={prevStep} className="rounded-full px-6">
          <ChevronLeft className="w-4 h-4 mr-1" /> Kembali
        </Button>
        <Button
          onClick={nextStep}
          disabled={!bisaLanjut}
          className="bg-[#0d1f3c] hover:bg-[#1a3a6e] text-white rounded-full px-8 h-11 font-semibold disabled:opacity-40"
        >
          Lanjut ke Detail
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
