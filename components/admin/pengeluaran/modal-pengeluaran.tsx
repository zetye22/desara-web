"use client"

import { useState, useEffect } from "react"
import { X, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { formatRupiah } from "@/lib/utils"
import type { Pengeluaran, KategoriPengeluaran } from "./types"

interface ModalPengeluaranProps {
  item?: Pengeluaran
  kategoriList: KategoriPengeluaran[]
  defaultBulan: string // "YYYY-MM"
  onClose: () => void
  onSuccess: () => void
}

export function ModalPengeluaran({ item, kategoriList, defaultBulan, onClose, onSuccess }: ModalPengeluaranProps) {
  const isEdit = !!item

  // Default tanggal = tanggal sekarang di bulan defaultBulan
  const defaultTanggal = item?.tanggal ?? `${defaultBulan}-${String(new Date().getDate()).padStart(2, "0")}`

  const [tanggal, setTanggal] = useState(defaultTanggal)
  const [kategoriId, setKategoriId] = useState(item?.kategori_id ?? "")
  const [deskripsi, setDeskripsi] = useState(item?.deskripsi ?? "")
  const [nominal, setNominal] = useState(item ? String(item.nominal) : "")
  const [catatan, setCatatan] = useState(item?.catatan ?? "")
  const [saving, setSaving] = useState(false)

  const nominalFormatted = nominal
    ? Number(nominal.replace(/\D/g, "")).toLocaleString("id-ID")
    : ""

  function handleNominalChange(val: string) {
    setNominal(val.replace(/\D/g, ""))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const nominalNum = parseInt(nominal.replace(/\D/g, "") || "0", 10)
    if (!tanggal) { toast.error("Tanggal wajib diisi"); return }
    if (nominalNum <= 0) { toast.error("Nominal harus lebih dari 0"); return }

    setSaving(true)
    try {
      const url = isEdit ? `/api/pengeluaran/${item!.id}` : "/api/pengeluaran"
      const method = isEdit ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggal,
          kategori_id: kategoriId || null,
          deskripsi: deskripsi.trim() || null,
          nominal: nominalNum,
          catatan: catatan.trim() || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Gagal menyimpan"); return }

      toast.success(isEdit ? "Pengeluaran berhasil diupdate" : "Pengeluaran berhasil ditambahkan")
      onSuccess()
      onClose()
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#0d1f3c]">
            {isEdit ? "Edit Pengeluaran" : "Tambah Pengeluaran"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Tanggal */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Tanggal *</label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full h-9 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20"
              required
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Kategori</label>
            <select
              value={kategoriId}
              onChange={(e) => setKategoriId(e.target.value)}
              className="w-full h-9 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20"
            >
              <option value="">-- Pilih kategori --</option>
              {kategoriList.map((k) => (
                <option key={k.id} value={k.id}>{k.nama} ({k.tipe})</option>
              ))}
            </select>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Deskripsi</label>
            <input
              type="text"
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Contoh: Bayar tagihan listrik April..."
              className="w-full h-9 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20"
            />
          </div>

          {/* Nominal */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Nominal (Rp) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">Rp</span>
              <input
                type="text"
                value={nominalFormatted}
                onChange={(e) => handleNominalChange(e.target.value)}
                placeholder="0"
                className="w-full h-9 rounded-lg border border-gray-200 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20"
                required
              />
            </div>
            {nominal && (
              <p className="text-xs text-gray-400 mt-1">{formatRupiah(parseInt(nominal))}</p>
            )}
          </div>

          {/* Catatan */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Catatan</label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Catatan opsional..."
              className="w-full h-9 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20"
            />
          </div>

          {/* Tombol */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 h-9 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 bg-white disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-9 px-4 bg-[#0d1f3c] text-white text-sm rounded-xl font-medium hover:bg-[#162d56] disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
