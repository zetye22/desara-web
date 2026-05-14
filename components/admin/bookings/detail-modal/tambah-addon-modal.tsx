"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ADD_ONS } from "@/lib/constants"
import { formatRupiah } from "@/lib/utils"

// Tipe addon
type AddonJenis =
  | "tambahan_waktu"
  | "tambahan_orang"
  | "tambahan_background"
  | "cetak_12r"
  | "cetak_20r"
  | "lainnya"

interface TambahAddonModalProps {
  bookingId: string
  kategoriSesi: string
  namaPaket: string
  existingAddonJenis: AddonJenis[]
  onSuccess: () => void
  onClose: () => void
}

// Konfigurasi tombol cepat
const QUICK_BUTTONS: {
  jenis: AddonJenis
  label: string
  emoji: string
  getNamaItem: () => string
  getHarga: () => number
}[] = [
  {
    jenis: "tambahan_waktu",
    label: "Tambahan Waktu",
    emoji: "⏱️",
    getNamaItem: () => "Tambahan Waktu 10 menit",
    getHarga: () => ADD_ONS.tambahanWaktu.harga,
  },
  {
    jenis: "tambahan_orang",
    label: "Tambahan Orang",
    emoji: "👤",
    getNamaItem: () => "Tambahan 1 Orang",
    getHarga: () => ADD_ONS.tambahanOrang.harga,
  },
  {
    jenis: "tambahan_background",
    label: "Tambahan Background",
    emoji: "🎨",
    getNamaItem: () => "Tambahan 1 Background",
    getHarga: () => ADD_ONS.tambahanBackground.harga,
  },
  {
    jenis: "cetak_12r",
    label: "Cetak 12R",
    emoji: "🖼️",
    getNamaItem: () => "Cetak Foto 12R",
    getHarga: () => ADD_ONS.cetak12R.harga,
  },
  {
    jenis: "cetak_20r",
    label: "Cetak 20R",
    emoji: "🖼️",
    getNamaItem: () => "Cetak Foto 20R + Frame",
    getHarga: () => ADD_ONS.cetak20R.harga,
  },
  {
    jenis: "lainnya",
    label: "Lainnya",
    emoji: "➕",
    getNamaItem: () => "",
    getHarga: () => 0,
  },
]

export default function TambahAddonModal({
  bookingId,
  kategoriSesi,
  namaPaket,
  existingAddonJenis,
  onSuccess,
  onClose,
}: TambahAddonModalProps) {
  const [selectedJenis, setSelectedJenis] = useState<AddonJenis | null>(null)
  const [namaItem, setNamaItem] = useState("")
  const [qty, setQty] = useState(1)
  const [hargaSatuan, setHargaSatuan] = useState(0)
  const [catatan, setCatatan] = useState("")
  const [loading, setLoading] = useState(false)

  // Hitung subtotal real-time
  const subtotal = qty * hargaSatuan

  // Pilih tombol cepat → isi form
  function handleQuickButton(btn: (typeof QUICK_BUTTONS)[number]) {
    setSelectedJenis(btn.jenis)
    setNamaItem(btn.getNamaItem())
    setHargaSatuan(btn.getHarga())
    setQty(1)
    setCatatan("")
  }

  // Reset form setelah simpan
  function resetForm() {
    setSelectedJenis(null)
    setNamaItem("")
    setQty(1)
    setHargaSatuan(0)
    setCatatan("")
  }

  // Kirim ke API
  async function submitAddon(): Promise<boolean> {
    if (!selectedJenis) {
      toast.error("Pilih jenis addon terlebih dahulu")
      return false
    }
    if (!namaItem.trim()) {
      toast.error("Nama item wajib diisi")
      return false
    }
    if (qty < 1) {
      toast.error("Qty minimal 1")
      return false
    }
    if (hargaSatuan < 0) {
      toast.error("Harga satuan tidak valid")
      return false
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/addons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jenis: selectedJenis,
          nama_item: namaItem.trim(),
          qty,
          harga_satuan: hargaSatuan,
          catatan: catatan.trim() || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Gagal menambah addon")
        return false
      }

      toast.success("Addon berhasil ditambahkan")
      onSuccess()
      return true
    } catch {
      toast.error("Terjadi kesalahan, coba lagi")
      return false
    } finally {
      setLoading(false)
    }
  }

  // Simpan & Tambah Lain
  async function handleSimpanLagi() {
    const ok = await submitAddon()
    if (ok) resetForm()
  }

  // Simpan & Tutup
  async function handleSimpanTutup() {
    const ok = await submitAddon()
    if (ok) onClose()
  }

  // Tentukan saran berdasarkan kategori/paket/existing
  const suggestions: AddonJenis[] = []
  if (
    kategoriSesi === "wisuda" &&
    !existingAddonJenis.includes("tambahan_orang")
  ) {
    suggestions.push("tambahan_orang")
  }
  if (
    (namaPaket.includes("Bronze") || namaPaket.includes("Silver")) &&
    !existingAddonJenis.includes("cetak_12r")
  ) {
    suggestions.push("cetak_12r")
  }

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-0 md:p-4"
      onClick={onClose}
    >
      {/* Modal card */}
      <div
        className="relative flex h-full w-full flex-col overflow-y-auto bg-white md:h-auto md:max-h-[90vh] md:max-w-lg md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between border-b px-5 py-4"
          style={{ backgroundColor: "#0d1f3c" }}
        >
          <h2 className="text-lg font-semibold text-white">
            Tambah Add-on Lapangan
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-white/70 transition hover:text-white"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-5 p-5">
          {/* Saran */}
          {suggestions.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-gray-500">
                Saran berdasarkan paket/kategori:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => {
                  const btn = QUICK_BUTTONS.find((b) => b.jenis === s)
                  if (!btn) return null
                  return (
                    <button
                      key={s}
                      onClick={() => handleQuickButton(btn)}
                      className="rounded-full border border-amber-400 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
                    >
                      {btn.emoji} {btn.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Tombol cepat */}
          <div>
            <p className="mb-2 text-xs font-medium text-gray-500">
              Pilih jenis add-on:
            </p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {QUICK_BUTTONS.map((btn) => (
                <button
                  key={btn.jenis}
                  onClick={() => handleQuickButton(btn)}
                  className={`flex flex-col items-center rounded-xl border-2 px-3 py-3 text-sm font-medium transition ${
                    selectedJenis === btn.jenis
                      ? "border-[#0d1f3c] bg-[#0d1f3c] text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:border-[#0d1f3c]/40 hover:bg-gray-50"
                  }`}
                >
                  <span className="mb-1 text-xl">{btn.emoji}</span>
                  <span className="text-center text-xs leading-tight">
                    {btn.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Form detail (muncul setelah pilih jenis) */}
          {selectedJenis && (
            <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <h3 className="font-medium text-gray-800">Detail Add-on</h3>

              {/* Nama item */}
              <div className="space-y-1">
                <Label htmlFor="nama_item">Nama Item</Label>
                <Input
                  id="nama_item"
                  value={namaItem}
                  onChange={(e) => setNamaItem(e.target.value)}
                  placeholder="Nama item addon"
                />
              </div>

              {/* Qty & Harga */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="qty">Qty</Label>
                  <Input
                    id="qty"
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) =>
                      setQty(Math.max(1, parseInt(e.target.value) || 1))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="harga_satuan">Harga Satuan (Rp)</Label>
                  <Input
                    id="harga_satuan"
                    type="number"
                    min={0}
                    value={hargaSatuan}
                    onChange={(e) =>
                      setHargaSatuan(Math.max(0, parseInt(e.target.value) || 0))
                    }
                  />
                </div>
              </div>

              {/* Subtotal (read-only) */}
              <div className="rounded-lg bg-white px-4 py-3 text-center">
                <p className="text-xs text-gray-500">Subtotal</p>
                <p className="text-xl font-bold" style={{ color: "#0d1f3c" }}>
                  {formatRupiah(subtotal)}
                </p>
              </div>

              {/* Catatan */}
              <div className="space-y-1">
                <Label htmlFor="catatan">Catatan (opsional)</Label>
                <Input
                  id="catatan"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Catatan tambahan..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer tombol */}
        {selectedJenis && (
          <div className="sticky bottom-0 flex gap-3 border-t bg-white px-5 py-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleSimpanLagi}
              disabled={loading}
            >
              {loading ? "Menyimpan..." : "Simpan & Tambah Lain"}
            </Button>
            <Button
              className="flex-1 text-white"
              style={{ backgroundColor: "#0d1f3c" }}
              onClick={handleSimpanTutup}
              disabled={loading}
            >
              {loading ? "Menyimpan..." : "Simpan & Tutup"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
