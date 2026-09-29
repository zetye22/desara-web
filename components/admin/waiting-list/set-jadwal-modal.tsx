"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Calendar, Clock, X, Loader2, CheckCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatRupiah, formatTanggal, parseKampusFromCatatan } from "@/lib/utils"
import { generateSlotJam } from "@/lib/time-utils"
import type { WaitingListRow } from "./types"

interface SetJadwalModalProps {
  item: WaitingListRow | null
  onClose: () => void
  onSuccess: () => void
}

const SLOT_JAM = generateSlotJam()

export function SetJadwalModal({ item, onClose, onSuccess }: SetJadwalModalProps) {
  const router = useRouter()
  const [tglFoto, setTglFoto] = useState("")
  const [jamMulai, setJamMulai] = useState("10:00")
  const [catatanAdmin, setCatatanAdmin] = useState("")
  const [loading, setLoading] = useState(false)

  if (!item) return null

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tglFoto || !jamMulai) {
      toast.error("Tanggal dan jam mulai wajib diisi")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/waiting-list/${item.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tgl_foto: tglFoto,
          jam_mulai: jamMulai,
          catatan_admin: catatanAdmin || undefined,
        }),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Gagal menjadwalkan ke booking")
        return
      }

      toast.success(`Berhasil dijadwalkan! Kode booking: ${json.kode_booking}`)
      onSuccess()
      onClose()
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error("Terjadi kesalahan sistem")
    } finally {
      setLoading(false)
    }
  }

  // Helper tanggal minimum = hari ini
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#0d1f3c] text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#C9A84C]/20 border border-[#C9A84C]/40 flex items-center justify-center text-[#E5C97A]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Tetapkan Jadwal Booking</h2>
              <p className="text-xs text-blue-200">Konversi Antrean Waiting List ke Booking Resmi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleConvert} className="p-6 space-y-4">
          {/* Detail Client Info */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-500">Nama Client:</span>
              <span className="font-bold text-gray-800">{item.nama_client}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">No. WhatsApp:</span>
              <span className="font-semibold text-gray-800">{item.no_wa}</span>
            </div>
            {(() => {
              const { kampus } = parseKampusFromCatatan(item.catatan)
              return kampus ? (
                <div className="flex justify-between">
                  <span className="text-gray-500">Kampus / Instansi:</span>
                  <span className="font-semibold text-indigo-700">🎓 {kampus}</span>
                </div>
              ) : null
            })()}
            <div className="flex justify-between">
              <span className="text-gray-500">Paket:</span>
              <span className="font-semibold text-[#0d1f3c]">{item.nama_paket}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Tagihan:</span>
              <span className="font-bold text-[#C9A84C]">{formatRupiah(item.total_tagihan)}</span>
            </div>
            {item.preferensi_jadwal && (
              <div className="pt-2 border-t border-gray-200 mt-2">
                <span className="text-gray-500 block mb-0.5 font-medium">Preferensi Client:</span>
                <span className="text-blue-900 bg-blue-100/70 px-2 py-0.5 rounded font-medium inline-block">
                  &quot;{item.preferensi_jadwal}&quot;
                </span>
              </div>
            )}
          </div>

          {/* Form Input Tanggal & Jam */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tglFoto" className="text-xs font-bold text-gray-700">
                Pilih Tanggal Foto <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tglFoto"
                type="date"
                min={todayStr}
                required
                value={tglFoto}
                onChange={(e) => setTglFoto(e.target.value)}
                className="mt-1 h-10 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="jamMulai" className="text-xs font-bold text-gray-700">
                Pilih Jam Mulai <span className="text-red-500">*</span>
              </Label>
              <select
                id="jamMulai"
                value={jamMulai}
                onChange={(e) => setJamMulai(e.target.value)}
                className="mt-1 w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:border-[#C9A84C] focus:outline-none"
              >
                {SLOT_JAM.map((jam) => (
                  <option key={jam} value={jam}>
                    {jam} WIB
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Catatan Admin */}
          <div>
            <Label htmlFor="catatanAdmin" className="text-xs font-bold text-gray-700">
              Catatan Admin <span className="text-gray-400 font-normal">(opsional)</span>
            </Label>
            <Input
              id="catatanAdmin"
              placeholder="Contoh: Disepakati via WA tgl 12"
              value={catatanAdmin}
              onChange={(e) => setCatatanAdmin(e.target.value)}
              className="mt-1 h-10 rounded-xl"
            />
          </div>

          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-xl p-3 text-xs flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Setelah disimpan, sistem akan membuat <strong>Booking ID baru</strong> berstatus Pending (menunggu DP), dan otomatis memindahkan antrean ini ke status Dijadwalkan.
            </span>
          </div>

          {/* Footer Tombol */}
          <div className="pt-2 flex justify-end gap-3 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading || !tglFoto}
              className="bg-[#C9A84C] hover:bg-[#b8963d] text-white rounded-xl font-semibold gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  Simpan ke Booking
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
