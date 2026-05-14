"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PortfolioRow {
  id: string
  image_url: string
  thumbnail_url: string | null
  alt_text: string
  kategori: string
  urutan: number
  aktif: boolean
  caption: string | null
  uploaded_by: string | null
  created_at: string
  updated_at: string
}

const KATEGORI_OPTIONS = [
  { value: "wisuda",   label: "Wisuda" },
  { value: "prewed",   label: "Prewedding" },
  { value: "keluarga", label: "Keluarga" },
  { value: "group",    label: "Group" },
  { value: "portrait", label: "Portrait" },
  { value: "couple",   label: "Couple" },
  { value: "custom",   label: "Custom" },
]

interface EditModalProps {
  item: PortfolioRow
  onClose: () => void
  onSuccess: () => void
}

export function EditModal({ item, onClose, onSuccess }: EditModalProps) {
  const [kategori, setKategori] = useState(item.kategori)
  const [altText, setAltText] = useState(item.alt_text)
  const [caption, setCaption] = useState(item.caption ?? "")
  const [aktif, setAktif] = useState(item.aktif)
  const [loading, setLoading] = useState(false)

  const handleSimpan = async () => {
    if (!kategori || !altText.trim()) {
      toast.error("Kategori dan alt text wajib diisi")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/portfolio/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kategori,
          alt_text: altText.trim(),
          caption: caption.trim() || null,
          aktif,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Gagal menyimpan" }))
        throw new Error(err.error ?? "Gagal menyimpan")
      }

      toast.success("Data foto berhasil diperbarui")
      onSuccess()
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#0d1f3c]">Edit Foto</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            aria-label="Tutup modal"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* Preview foto */}
          <div className="w-full aspect-[4/5] max-h-48 overflow-hidden rounded-xl bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image_url}
              alt={item.alt_text}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Form */}
          <div className="flex flex-col gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Kategori <span className="text-red-500">*</span>
              </Label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="mt-1.5 w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
              >
                <option value="">-- Pilih kategori --</option>
                {KATEGORI_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">
                Alt Text / Deskripsi <span className="text-red-500">*</span>
              </Label>
              <Input
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Deskripsi singkat foto"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Caption (opsional)</Label>
              <Input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Contoh: Paket Silver Wisuda"
                className="mt-1.5"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-700">Status Foto</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {aktif ? "Foto tampil di halaman publik" : "Foto tersembunyi dari halaman publik"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAktif((v) => !v)}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] ${
                  aktif ? "bg-green-500" : "bg-gray-300"
                }`}
                aria-pressed={aktif}
                aria-label="Toggle aktif/non-aktif"
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                    aktif ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer tombol */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg"
          >
            Batal
          </Button>
          <Button
            onClick={handleSimpan}
            disabled={loading || !kategori || !altText.trim()}
            className="rounded-lg bg-[#0d1f3c] hover:bg-[#0d1f3c]/90 text-white"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </div>
    </div>
  )
}
