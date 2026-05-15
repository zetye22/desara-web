"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ADD_ONS } from "@/lib/constants"
import { formatRupiah } from "@/lib/utils"

type AddonJenis =
  | "tambahan_waktu"
  | "tambahan_orang"
  | "tambahan_background"
  | "cetak_12r"
  | "cetak_20r"
  | "lainnya"

interface AddonButton {
  jenis: AddonJenis
  label: string
  emoji: string
  namaItem: string
  harga: number
  isCustom?: boolean
}

interface TambahAddonModalProps {
  bookingId: string
  kategoriSesi: string
  namaPaket: string
  existingAddonJenis: AddonJenis[]
  onSuccess: () => void
  onClose: () => void
}

// Mapping key settings → config tombol standar
const STANDARD_CONFIGS: Record<string, {
  jenis: AddonJenis; emoji: string; label: string; namaItem: string; defaultHarga: number
}> = {
  addon_tambahan_waktu: { jenis: "tambahan_waktu",    emoji: "⏱️", label: "Tambahan Waktu",       namaItem: "Tambahan Waktu 10 menit",    defaultHarga: ADD_ONS.tambahanWaktu.harga },
  addon_tambahan_orang: { jenis: "tambahan_orang",    emoji: "👤", label: "Tambahan Orang",       namaItem: "Tambahan 1 Orang",           defaultHarga: ADD_ONS.tambahanOrang.harga },
  addon_tambahan_bg:    { jenis: "tambahan_background", emoji: "🎨", label: "Tambahan Background", namaItem: "Tambahan 1 Background",      defaultHarga: ADD_ONS.tambahanBackground.harga },
  addon_cetak_12r:      { jenis: "cetak_12r",         emoji: "🖼️", label: "Cetak 12R",            namaItem: "Cetak Foto 12R",             defaultHarga: ADD_ONS.cetak12R.harga },
  addon_cetak_20r:      { jenis: "cetak_20r",         emoji: "🖼️", label: "Cetak 20R",            namaItem: "Cetak Foto 20R + Frame",     defaultHarga: ADD_ONS.cetak20R.harga },
}

const STANDARD_KEY_SET = new Set(Object.keys(STANDARD_CONFIGS))

const FALLBACK_BUTTONS: AddonButton[] = [
  ...Object.values(STANDARD_CONFIGS).map((c) => ({
    jenis: c.jenis, label: c.label, emoji: c.emoji, namaItem: c.namaItem, harga: c.defaultHarga,
  })),
  { jenis: "lainnya", label: "Lainnya", emoji: "📝", namaItem: "", harga: 0 },
]

export default function TambahAddonModal({
  bookingId,
  kategoriSesi,
  namaPaket,
  existingAddonJenis,
  onSuccess,
  onClose,
}: TambahAddonModalProps) {
  const [buttons,       setButtons]       = useState<AddonButton[]>([])
  const [loadingBtns,   setLoadingBtns]   = useState(true)
  const [selectedJenis, setSelectedJenis] = useState<AddonJenis | null>(null)
  const [namaItem,      setNamaItem]      = useState("")
  const [qty,           setQty]           = useState(1)
  const [hargaSatuan,   setHargaSatuan]   = useState(0)
  const [catatan,       setCatatan]       = useState("")
  const [loading,       setLoading]       = useState(false)

  // Fetch daftar add-on dari DB (harga terkini + custom add-on dari pengaturan)
  useEffect(() => {
    fetch("/api/settings?kategori=addon")
      .then((r) => r.json())
      .then((data) => {
        const rows: { key: string; value: { nama: string; harga: number } }[] = data.items ?? []

        // Tombol standar — pakai harga dari DB jika ada
        const standardButtons: AddonButton[] = Object.entries(STANDARD_CONFIGS).map(([key, cfg]) => {
          const dbRow = rows.find((r) => r.key === key)
          return {
            jenis:    cfg.jenis,
            label:    dbRow?.value.nama ?? cfg.label,
            emoji:    cfg.emoji,
            namaItem: dbRow?.value.nama ?? cfg.namaItem,
            harga:    dbRow?.value.harga ?? cfg.defaultHarga,
          }
        })

        // Custom add-on dari pengaturan (key tidak termasuk yang standar)
        const customButtons: AddonButton[] = rows
          .filter((r) => !STANDARD_KEY_SET.has(r.key) && r.value.harga > 0)
          .map((r) => ({
            jenis:    "lainnya" as AddonJenis,
            label:    r.value.nama,
            emoji:    "✨",
            namaItem: r.value.nama,
            harga:    r.value.harga,
            isCustom: true,
          }))

        setButtons([
          ...standardButtons,
          ...customButtons,
          { jenis: "lainnya", label: "Lainnya", emoji: "📝", namaItem: "", harga: 0 },
        ])
      })
      .catch(() => setButtons(FALLBACK_BUTTONS))
      .finally(() => setLoadingBtns(false))
  }, [])

  const subtotal = qty * hargaSatuan

  function handleSelectBtn(btn: AddonButton) {
    setSelectedJenis(btn.jenis)
    setNamaItem(btn.namaItem)
    setHargaSatuan(btn.harga)
    setQty(1)
    setCatatan("")
  }

  function resetForm() {
    setSelectedJenis(null)
    setNamaItem("")
    setQty(1)
    setHargaSatuan(0)
    setCatatan("")
  }

  async function submitAddon(): Promise<boolean> {
    if (!selectedJenis) { toast.error("Pilih jenis addon terlebih dahulu"); return false }
    if (!namaItem.trim()) { toast.error("Nama item wajib diisi"); return false }
    if (qty < 1) { toast.error("Qty minimal 1"); return false }
    if (hargaSatuan < 0) { toast.error("Harga satuan tidak valid"); return false }

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
      if (!res.ok) { toast.error(data.error ?? "Gagal menambah addon"); return false }
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

  async function handleSimpanLagi()  { const ok = await submitAddon(); if (ok) resetForm() }
  async function handleSimpanTutup() { const ok = await submitAddon(); if (ok) onClose() }

  // Saran berdasarkan kategori/paket
  const suggestions: string[] = []
  if (kategoriSesi === "wisuda" && !existingAddonJenis.includes("tambahan_orang"))
    suggestions.push("tambahan_orang")
  if ((namaPaket.includes("Bronze") || namaPaket.includes("Silver")) && !existingAddonJenis.includes("cetak_12r"))
    suggestions.push("cetak_12r")

  const suggestionBtns = buttons.filter((b) => suggestions.includes(b.jenis) && !b.isCustom)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-0 md:p-4"
      onClick={onClose}
    >
      <div
        className="relative flex h-full w-full flex-col overflow-y-auto bg-white md:h-auto md:max-h-[90vh] md:max-w-lg md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between border-b px-5 py-4"
          style={{ backgroundColor: "#0d1f3c" }}
        >
          <h2 className="text-lg font-semibold text-white">Tambah Add-on Lapangan</h2>
          <button onClick={onClose} className="rounded-full p-1 text-white/70 transition hover:text-white" aria-label="Tutup">✕</button>
        </div>

        <div className="flex-1 space-y-5 p-5">
          {loadingBtns ? (
            <div className="flex items-center justify-center py-10 gap-2 text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Memuat daftar add-on…
            </div>
          ) : (
            <>
              {/* Saran */}
              {suggestionBtns.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-gray-500">Saran berdasarkan paket/kategori:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestionBtns.map((btn) => (
                      <button
                        key={btn.jenis + btn.label}
                        onClick={() => handleSelectBtn(btn)}
                        className="rounded-full border border-amber-400 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
                      >
                        {btn.emoji} {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tombol pilih add-on */}
              <div>
                <p className="mb-2 text-xs font-medium text-gray-500">Pilih jenis add-on:</p>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {buttons.map((btn, i) => {
                    const isActive = selectedJenis === btn.jenis && namaItem === btn.namaItem
                    return (
                      <button
                        key={i}
                        onClick={() => handleSelectBtn(btn)}
                        className={`flex flex-col items-center rounded-xl border-2 px-3 py-3 text-sm font-medium transition ${
                          isActive
                            ? "border-[#0d1f3c] bg-[#0d1f3c] text-white"
                            : "border-gray-200 bg-white text-gray-700 hover:border-[#0d1f3c]/40 hover:bg-gray-50"
                        }`}
                      >
                        <span className="mb-1 text-xl">{btn.emoji}</span>
                        <span className="text-center text-xs leading-tight">{btn.label}</span>
                        {btn.harga > 0 && (
                          <span className={`mt-1 text-[10px] ${isActive ? "text-white/70" : "text-[#C9A84C]"}`}>
                            {formatRupiah(btn.harga)}
                          </span>
                        )}
                        {btn.isCustom && (
                          <span className={`mt-0.5 text-[9px] px-1.5 py-0.5 rounded ${isActive ? "bg-white/20 text-white/60" : "bg-gray-100 text-gray-400"}`}>
                            custom
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* Form detail */}
          {selectedJenis && (
            <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <h3 className="font-medium text-gray-800">Detail Add-on</h3>

              <div className="space-y-1">
                <Label htmlFor="nama_item">Nama Item</Label>
                <Input
                  id="nama_item"
                  value={namaItem}
                  onChange={(e) => setNamaItem(e.target.value)}
                  placeholder="Nama item addon"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="qty">Qty</Label>
                  <Input
                    id="qty"
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="harga_satuan">Harga Satuan (Rp)</Label>
                  <Input
                    id="harga_satuan"
                    type="number"
                    min={0}
                    value={hargaSatuan}
                    onChange={(e) => setHargaSatuan(Math.max(0, parseInt(e.target.value) || 0))}
                  />
                </div>
              </div>

              <div className="rounded-lg bg-white px-4 py-3 text-center">
                <p className="text-xs text-gray-500">Subtotal</p>
                <p className="text-xl font-bold" style={{ color: "#0d1f3c" }}>{formatRupiah(subtotal)}</p>
              </div>

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

        {selectedJenis && (
          <div className="sticky bottom-0 flex gap-3 border-t bg-white px-5 py-4">
            <Button variant="outline" className="flex-1" onClick={handleSimpanLagi} disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan & Tambah Lain"}
            </Button>
            <Button className="flex-1 text-white" style={{ backgroundColor: "#0d1f3c" }} onClick={handleSimpanTutup} disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan & Tutup"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
