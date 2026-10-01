"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Pencil, X, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { parseKampusFromCatatan } from "@/lib/utils"
import type { WaitingListRow } from "./types"

interface EditModalProps {
  item: WaitingListRow | null
  onClose: () => void
  onSuccess: (updated: Partial<WaitingListRow>) => void
}

export function EditModal({ item, onClose, onSuccess }: EditModalProps) {
  const [namaClient, setNamaClient] = useState("")
  const [noWa, setNoWa] = useState("")
  const [email, setEmail] = useState("")
  const [preferensiJadwal, setPreferensiJadwal] = useState("")
  const [jamDiinginkan, setJamDiinginkan] = useState("")
  const [kampus, setKampus] = useState("")
  const [catatanBersih, setCatatanBersih] = useState("")
  const [loading, setLoading] = useState(false)

  // Sync state saat item berubah
  useEffect(() => {
    if (!item) return
    const { kampus: k, catatanBersih: c } = parseKampusFromCatatan(item.catatan)
    setNamaClient(item.nama_client)
    setNoWa(item.no_wa)
    setEmail(item.email ?? "")
    setPreferensiJadwal(item.preferensi_jadwal ?? "")
    setJamDiinginkan(item.jam_diinginkan ?? "")
    setKampus(k ?? "")
    setCatatanBersih(c ?? "")
  }, [item])

  if (!item) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!namaClient.trim()) {
      toast.error("Nama client wajib diisi")
      return
    }
    if (!noWa.trim()) {
      toast.error("Nomor WhatsApp wajib diisi")
      return
    }

    // Rebuild catatan: gabungkan kampus + catatan bersih
    const catatanGabung = [
      kampus.trim() ? `[kampus: ${kampus.trim()}]` : "",
      catatanBersih.trim(),
    ]
      .filter(Boolean)
      .join(" ")
      .trim() || null

    setLoading(true)
    try {
      const res = await fetch(`/api/waiting-list/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "edit",
          nama_client: namaClient.trim(),
          no_wa: noWa.trim(),
          email: email.trim() || null,
          preferensi_jadwal: preferensiJadwal.trim() || null,
          jam_diinginkan: jamDiinginkan.trim() || null,
          catatan: catatanGabung,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Gagal menyimpan perubahan")
        return
      }

      toast.success("Data waiting list berhasil diperbarui")
      onSuccess({
        nama_client: namaClient.trim(),
        no_wa: noWa.trim(),
        email: email.trim() || null,
        preferensi_jadwal: preferensiJadwal.trim() || null,
        jam_diinginkan: jamDiinginkan.trim() || null,
        catatan: catatanGabung,
      })
      onClose()
    } catch (err) {
      console.error(err)
      toast.error("Terjadi kesalahan sistem")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#0d1f3c] text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#C9A84C]/20 border border-[#C9A84C]/40 flex items-center justify-center text-[#E5C97A]">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Edit Data Waiting List</h2>
              <p className="text-xs text-blue-200">Perbarui informasi client</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Nama Client */}
          <div>
            <Label htmlFor="namaClient" className="text-xs font-bold text-gray-700">
              Nama Client <span className="text-red-500">*</span>
            </Label>
            <Input
              id="namaClient"
              value={namaClient}
              onChange={(e) => setNamaClient(e.target.value)}
              placeholder="Nama lengkap client"
              className="mt-1 h-10 rounded-xl"
              required
            />
          </div>

          {/* No. WhatsApp */}
          <div>
            <Label htmlFor="noWa" className="text-xs font-bold text-gray-700">
              No. WhatsApp <span className="text-red-500">*</span>
            </Label>
            <Input
              id="noWa"
              value={noWa}
              onChange={(e) => setNoWa(e.target.value)}
              placeholder="08xx..."
              className="mt-1 h-10 rounded-xl font-mono"
              required
            />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email" className="text-xs font-bold text-gray-700">
              Email <span className="text-gray-400 font-normal">(opsional)</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@contoh.com"
              className="mt-1 h-10 rounded-xl"
            />
          </div>

          {/* Preferensi Jadwal */}
          <div>
            <Label htmlFor="preferensiJadwal" className="text-xs font-bold text-gray-700">
              Preferensi Hari/Jadwal <span className="text-gray-400 font-normal">(opsional)</span>
            </Label>
            <Input
              id="preferensiJadwal"
              value={preferensiJadwal}
              onChange={(e) => setPreferensiJadwal(e.target.value)}
              placeholder="Contoh: Sabtu atau Minggu, awal bulan"
              className="mt-1 h-10 rounded-xl"
            />
          </div>

          {/* Jam Diinginkan */}
          <div>
            <Label htmlFor="jamDiinginkan" className="text-xs font-bold text-gray-700">
              Jam yang Diinginkan <span className="text-gray-400 font-normal">(opsional)</span>
            </Label>
            <Input
              id="jamDiinginkan"
              value={jamDiinginkan}
              onChange={(e) => setJamDiinginkan(e.target.value)}
              placeholder="Contoh: 10:00"
              className="mt-1 h-10 rounded-xl"
            />
          </div>

          {/* Kampus / Instansi */}
          <div>
            <Label htmlFor="kampus" className="text-xs font-bold text-gray-700">
              Kampus / Instansi <span className="text-gray-400 font-normal">(opsional)</span>
            </Label>
            <Input
              id="kampus"
              value={kampus}
              onChange={(e) => setKampus(e.target.value)}
              placeholder="Contoh: Universitas Indonesia"
              className="mt-1 h-10 rounded-xl"
            />
          </div>

          {/* Catatan */}
          <div>
            <Label htmlFor="catatan" className="text-xs font-bold text-gray-700">
              Catatan <span className="text-gray-400 font-normal">(opsional)</span>
            </Label>
            <textarea
              id="catatan"
              value={catatanBersih}
              onChange={(e) => setCatatanBersih(e.target.value)}
              placeholder="Catatan tambahan dari client..."
              rows={3}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#C9A84C] focus:outline-none resize-none"
            />
          </div>

          {/* Info paket (read-only) */}
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-xs text-gray-600 space-y-1">
            <p className="font-semibold text-gray-700 mb-1">Info Paket (tidak dapat diubah)</p>
            <div className="flex justify-between">
              <span>Paket:</span>
              <span className="font-semibold text-[#0d1f3c]">{item.nama_paket}</span>
            </div>
            <div className="flex justify-between">
              <span>Jumlah Orang:</span>
              <span className="font-semibold">{item.jumlah_orang} orang</span>
            </div>
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
              disabled={loading}
              className="bg-[#0d1f3c] hover:bg-[#162d54] text-white rounded-xl font-semibold gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
