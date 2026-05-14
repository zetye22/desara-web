"use client"

import { useState, useEffect, useCallback, useMemo, memo } from "react"
import { ChevronRight, ChevronLeft, Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { useBookingStore } from "@/lib/booking-store"
import { hitungHarga } from "@/lib/harga-booking"
import { OPERASIONAL } from "@/lib/constants"
import { generateSlotJam } from "@/lib/time-utils"
import { createClient } from "@/lib/supabase/client"

interface SlotInfo {
  jam: string
  available: boolean
  alasan: string | null
  bentrok_dengan?: {
    kode_booking: string
    jam: string
    nama_client: string
  } | null
}

export function Step2PilihJadwal() {
  const { tanggalFoto, jamMulai, paketId, addons, katalog, setTanggal, setJamMulai, nextStep, prevStep } =
    useBookingStore()

  const [slotStatus, setSlotStatus] = useState<Record<string, SlotInfo>>({})
  const [loadingSlot, setLoadingSlot] = useState(false)

  const rincian    = useMemo(() => hitungHarga(paketId, addons, katalog), [paketId, addons, katalog])
  const bisaLanjut = !!tanggalFoto && !!jamMulai

  // Tanggal minimum: besok
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  // Fetch ketersediaan slot
  const fetchSlot = useCallback(async (tanggal: string) => {
    if (!rincian.durasiTotal) return
    setLoadingSlot(true)
    setSlotStatus({})
    try {
      const params = new URLSearchParams({
        tanggal,
        durasi_menit: String(rincian.durasiTotal),
      })
      const res  = await fetch(`/api/bookings/cek-slot?${params}`)
      const json = await res.json() as { slots?: SlotInfo[] }
      if (json.slots) {
        const map: Record<string, SlotInfo> = {}
        json.slots.forEach((s) => { map[s.jam] = s })
        setSlotStatus(map)
      }
    } catch {
      // Kalau gagal fetch, biarkan semua slot tampak tersedia
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

  const selectedDate = tanggalFoto ? new Date(tanggalFoto + "T00:00:00") : undefined

  return (
    <div>
      <h2 className="text-xl font-bold text-[#0d1f3c] mb-1">Pilih Tanggal & Jam</h2>
      <p className="text-sm text-gray-500 mb-6">
        Jam buka studio: {OPERASIONAL.jamBuka} – {OPERASIONAL.jamTutup} WIB
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Calendar */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">Pilih Tanggal</p>
          <div className="border border-gray-200 rounded-xl overflow-hidden w-fit">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => {
                if (d) {
                  const iso = d.toISOString().split("T")[0]
                  setTanggal(iso)
                  setJamMulai("")
                }
              }}
              disabled={(d) => d < tomorrow}
              className="p-3"
            />
          </div>
          {tanggalFoto && (
            <p className="mt-2 text-sm text-[#C9A84C] font-medium">
              ✓ {new Date(tanggalFoto + "T00:00:00").toLocaleDateString("id-ID", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          )}
        </div>

        {/* Slot jam */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">
            Pilih Jam Mulai
            {rincian.durasiTotal > 0 && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                (Durasi: {rincian.durasiTotal} menit)
              </span>
            )}
          </p>

          {!tanggalFoto ? (
            <p className="text-sm text-gray-400 italic">Pilih tanggal terlebih dahulu</p>
          ) : loadingSlot ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Mengecek ketersediaan slot…
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {Object.keys(slotStatus).length === 0
                  ? generateSlotJam().map((jam) => (
                      <SlotButton
                        key={jam}
                        jam={jam}
                        isSelected={jamMulai === jam}
                        available
                        onClick={() => setJamMulai(jam)}
                      />
                    ))
                  : Object.values(slotStatus).map((slot) => (
                      <SlotButton
                        key={slot.jam}
                        jam={slot.jam}
                        isSelected={jamMulai === slot.jam}
                        available={slot.available}
                        alasan={slot.alasan}
                        onClick={() => slot.available && setJamMulai(slot.jam)}
                      />
                    ))
                }
              </div>

              {/* Legend */}
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C9A84C] inline-block" />
                  Dipilih
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />
                  Tersedia
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />
                  Terisi / Lewat
                </span>
              </div>
            </>
          )}

          {/* Info durasi selesai */}
          {jamMulai && rincian.durasiTotal > 0 && (
            <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-sm text-blue-700">
              Sesi berlangsung {jamMulai} –{" "}
              {(() => {
                const [h, m] = jamMulai.split(":").map(Number)
                const selesai = new Date(0, 0, 0, h, m + rincian.durasiTotal)
                return `${String(selesai.getHours()).padStart(2, "0")}:${String(selesai.getMinutes()).padStart(2, "0")}`
              })()}{" "}
              WIB
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

// ── Sub-components ──────────────────────────────────────────────

const SlotButton = memo(function SlotButton({
  jam, isSelected, available, alasan, onClick,
}: {
  jam: string
  isSelected: boolean
  available: boolean
  alasan?: string | null
  onClick: () => void
}) {
  return (
    <button
      onClick={available ? onClick : undefined}
      disabled={!available}
      aria-pressed={isSelected}
      title={!available && alasan ? alasan : undefined}
      className={`flex flex-col items-center justify-center gap-0.5 rounded-lg border py-2 px-1 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:ring-offset-1
        ${isSelected
          ? "border-[#C9A84C] bg-[#C9A84C] text-white"
          : !available
          ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
          : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
        }`}
    >
      <div className="flex items-center gap-1">
        <Clock className="w-3 h-3" />
        {jam}
      </div>
      {!isSelected && (
        <span className={`w-1.5 h-1.5 rounded-full ${available ? "bg-green-400" : "bg-gray-300"}`} />
      )}
    </button>
  )
})

// generateSlotJam diimport dari lib/time-utils
