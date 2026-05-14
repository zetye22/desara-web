"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { PengeluaranRow } from "./types"

const KATEGORI_OPTIONS: { value: PengeluaranRow["kategori"]; label: string }[] = [
  { value: "wifi", label: "Wifi" },
  { value: "pdam", label: "PDAM" },
  { value: "ipl", label: "IPL" },
  { value: "listrik", label: "Listrik" },
  { value: "cetak", label: "Cetak" },
  { value: "upah", label: "Upah" },
  { value: "lain", label: "Lain-lain" },
]

interface TambahPengeluaranModalProps {
  periode: string
  item?: PengeluaranRow           // jika ada = mode edit
  onClose: () => void
  onSuccess: () => void
}

export function TambahPengeluaranModal({
  periode,
  item,
  onClose,
  onSuccess,
}: TambahPengeluaranModalProps) {
  const isEdit = !!item

  const [tanggal, setTanggal] = useState(item?.tanggal ?? `${periode}-01`)
  const [kategori, setKategori] = useState<PengeluaranRow["kategori"]>(item?.kategori ?? "lain")
  const [deskripsi, setDeskripsi] = useState(item?.deskripsi ?? "")
  const [nominalInput, setNominalInput] = useState(item ? String(item.nominal) : "")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const nominalNum = Number(nominalInput.replace(/\D/g, ""))
    if (!nominalNum || nominalNum <= 0) {
      toast.error("Nominal harus lebih dari 0")
      return
    }

    setLoading(true)
    try {
      let res: Response

      if (isEdit && item) {
        // Mode edit: PATCH ke /api/keuangan/pengeluaran/[id]
        res = await fetch(`/api/keuangan/pengeluaran/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deskripsi: deskripsi || null,
            nominal: nominalNum,
            kategori,
          }),
        })
      } else {
        // Mode tambah: POST ke /api/keuangan/pengeluaran
        res = await fetch("/api/keuangan/pengeluaran", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tanggal,
            kategori,
            deskripsi: deskripsi || null,
            nominal: nominalNum,
            bulan_periode: periode,
          }),
        })
      }

      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? "Terjadi kesalahan")
        return
      }

      toast.success(isEdit ? "Pengeluaran berhasil diupdate" : "Pengeluaran berhasil ditambahkan")
      onSuccess()
      onClose()
    } catch {
      toast.error("Gagal terhubung ke server")
    } finally {
      setLoading(false)
    }
  }

  // Format nominal ke format angka saat diketik
  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "")
    setNominalInput(raw)
  }

  // Format rupiah untuk tampilan input
  const nominalDisplay = nominalInput
    ? new Intl.NumberFormat("id-ID").format(Number(nominalInput))
    : ""

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#0d1f3c]">
            {isEdit ? "Edit Pengeluaran" : "Tambah Pengeluaran"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Tanggal (hanya saat tambah) */}
          {!isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="tanggal">Tanggal</Label>
              <Input
                id="tanggal"
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                required
              />
            </div>
          )}

          {/* Kategori */}
          <div className="space-y-1.5">
            <Label htmlFor="kategori">Kategori</Label>
            <select
              id="kategori"
              value={kategori}
              onChange={(e) => setKategori(e.target.value as PengeluaranRow["kategori"])}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            >
              {KATEGORI_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Deskripsi */}
          <div className="space-y-1.5">
            <Label htmlFor="deskripsi">
              Deskripsi <span className="text-gray-400">(opsional)</span>
            </Label>
            <Input
              id="deskripsi"
              type="text"
              placeholder="Contoh: Bayar tagihan bulan Mei"
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
            />
          </div>

          {/* Nominal */}
          <div className="space-y-1.5">
            <Label htmlFor="nominal">Nominal (Rp)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                Rp
              </span>
              <Input
                id="nominal"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={nominalDisplay}
                onChange={handleNominalChange}
                className="pl-9"
                required
              />
            </div>
          </div>

          {/* Tombol aksi */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#0d1f3c] hover:bg-[#0d1f3c]/90 text-white"
              disabled={loading}
            >
              {loading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
