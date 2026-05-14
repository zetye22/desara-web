"use client"

import { useState } from "react"
import { Pencil, Star, CheckCircle, XCircle, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { formatRupiah } from "@/lib/utils"
import type { SettingsRow, PaketValue } from "./types"
import { CETAK_OPTIONS } from "./types"

const KATEGORI_OPTIONS = [
  { value: "wisuda",   label: "Wisuda" },
  { value: "prewed",   label: "Prewedding" },
  { value: "keluarga", label: "Keluarga" },
  { value: "group",    label: "Group" },
  { value: "portrait", label: "Portrait" },
]

interface TabPaketProps {
  items: SettingsRow[]
  isOwner: boolean
  onRefresh: () => void
}

type ModalMode = "edit" | "tambah"

interface ModalState {
  mode: ModalMode
  key: string
  value: PaketValue
}

const EMPTY_PAKET: PaketValue = {
  id: "", nama: "", kategori: "wisuda", harga: 0, hargaMulaiDari: false,
  durasiMenit: 30, jumlahBackground: 2, maxOrang: null,
  cetakInclude: null, popular: false, aktif: true,
}

function PaketCard({ row, isOwner, onEdit, onDelete }: {
  row: SettingsRow
  isOwner: boolean
  onEdit: (key: string, v: PaketValue) => void
  onDelete: (key: string, nama: string) => void
}) {
  const v: PaketValue = row.value
  return (
    <div className={`relative bg-white rounded-xl border-2 p-5 transition-all ${
      v.popular ? "border-[#C9A84C]" : "border-gray-200"
    } ${!v.aktif ? "opacity-60" : ""}`}>
      {v.popular && (
        <span className="absolute -top-3 left-4 bg-[#C9A84C] text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 font-semibold">
          <Star className="w-3 h-3" /> Popular
        </span>
      )}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">
            {v.kategori}
          </p>
          <h3 className="text-base font-bold text-[#0d1f3c]">{v.nama}</h3>
          <div className="mt-1">
            {v.hargaMulaiDari && (
              <span className="text-xs text-gray-400 block">Mulai dari</span>
            )}
            <p className="text-2xl font-bold text-[#C9A84C]">{formatRupiah(v.harga)}</p>
          </div>
        </div>
        {isOwner && (
          <div className="flex flex-col gap-1">
            <button
              onClick={() => onEdit(row.key, v)}
              className="p-2 rounded-lg text-gray-400 hover:text-[#0d1f3c] hover:bg-blue-50 transition-colors"
              title="Edit paket"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(row.key, v.nama)}
              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Hapus paket"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1 text-sm text-gray-600">
        <div className="flex justify-between">
          <span className="text-gray-400">Durasi</span>
          <span className="font-medium">{v.durasiMenit} menit</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Background</span>
          <span className="font-medium">{v.jumlahBackground} BG</span>
        </div>
        {v.maxOrang && (
          <div className="flex justify-between">
            <span className="text-gray-400">Max Orang</span>
            <span className="font-medium">{v.maxOrang} orang</span>
          </div>
        )}
        {v.cetakInclude && (
          <div className="flex justify-between">
            <span className="text-gray-400">Cetak</span>
            <span className="font-medium text-green-600">+ {v.cetakInclude}</span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5">
        {v.aktif ? (
          <span className="inline-flex items-center gap-1 text-xs text-green-600">
            <CheckCircle className="w-3 h-3" /> Aktif
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
            <XCircle className="w-3 h-3" /> Nonaktif
          </span>
        )}
      </div>
    </div>
  )
}

export function TabPaket({ items, isOwner, onRefresh }: TabPaketProps) {
  const [modal, setModal] = useState<ModalState | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formKey, setFormKey] = useState("")
  const [formNama, setFormNama] = useState("")
  const [formKategori, setFormKategori] = useState("wisuda")
  const [formHarga, setFormHarga] = useState("")
  const [formDurasi, setFormDurasi] = useState("")
  const [formBg, setFormBg] = useState("")
  const [formMaxOrang, setFormMaxOrang] = useState("")
  const [formCetak, setFormCetak] = useState<PaketValue["cetakInclude"]>(null)
  const [formHargaMulaiDari, setFormHargaMulaiDari] = useState(false)
  const [formPopular, setFormPopular] = useState(false)
  const [formAktif, setFormAktif] = useState(true)

  function openEdit(key: string, v: PaketValue) {
    setModal({ mode: "edit", key, value: v })
    setFormKey(key)
    setFormNama(v.nama)
    setFormKategori(v.kategori)
    setFormHarga(String(v.harga))
    setFormDurasi(String(v.durasiMenit))
    setFormBg(String(v.jumlahBackground))
    setFormMaxOrang(v.maxOrang != null ? String(v.maxOrang) : "")
    setFormCetak(v.cetakInclude)
    setFormHargaMulaiDari(v.hargaMulaiDari ?? v.kategori !== "wisuda")
    setFormPopular(v.popular)
    setFormAktif(v.aktif)
  }

  function openTambah() {
    setModal({ mode: "tambah", key: "", value: EMPTY_PAKET })
    setFormKey("")
    setFormNama("")
    setFormKategori("wisuda")
    setFormHarga("")
    setFormDurasi("30")
    setFormBg("2")
    setFormMaxOrang("")
    setFormCetak(null)
    setFormHargaMulaiDari(false)
    setFormPopular(false)
    setFormAktif(true)
  }

  async function handleDelete(key: string, nama: string) {
    if (!window.confirm(`Hapus paket "${nama}"?\n\nPaket akan hilang dari halaman booking. Booking yang sudah masuk tidak terpengaruh.`)) return
    try {
      const res = await fetch(`/api/settings/${key}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Gagal menghapus"); return }
      toast.success(`Paket "${nama}" dihapus`)
      onRefresh()
    } catch {
      toast.error("Terjadi kesalahan")
    }
  }

  async function handleSave() {
    if (!modal) return

    const hargaNum = parseInt(formHarga.replace(/\D/g, "") || "0")
    const durasiNum = parseInt(formDurasi || "0")
    const bgNum = parseInt(formBg || "0")

    if (!formNama.trim()) { toast.error("Nama paket wajib diisi"); return }
    if (hargaNum <= 0) { toast.error("Harga harus lebih dari 0"); return }
    if (durasiNum < 10) { toast.error("Durasi minimal 10 menit"); return }
    if (bgNum < 1) { toast.error("Background minimal 1"); return }

    if (modal.mode === "tambah") {
      // Generate key dari nama, pastikan unik
      const baseKey = `paket_${formKategori}_${formNama.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")}`
      const finalKey = formKey || baseKey
      if (!finalKey.startsWith("paket_")) { toast.error("Key tidak valid"); return }

      const newValue: PaketValue = {
        id: finalKey.replace("paket_", ""),
        nama: formNama.trim(),
        kategori: formKategori,
        harga: hargaNum,
        hargaMulaiDari: formHargaMulaiDari,
        durasiMenit: durasiNum,
        jumlahBackground: bgNum,
        maxOrang: formMaxOrang ? parseInt(formMaxOrang) : null,
        cetakInclude: formCetak,
        popular: formPopular,
        aktif: formAktif,
      }

      setSaving(true)
      try {
        const res = await fetch("/api/settings/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: finalKey, value: newValue, kategori: "paket", deskripsi: `Paket ${formNama}` }),
        })
        const data = await res.json()
        if (!res.ok) { toast.error(data.error ?? "Gagal menyimpan"); return }
        toast.success(`Paket "${formNama}" berhasil ditambahkan`)
        setModal(null)
        onRefresh()
      } catch {
        toast.error("Terjadi kesalahan")
      } finally {
        setSaving(false)
      }
      return
    }

    // Mode edit
    const oldHarga = modal.value.harga
    const newValue: PaketValue = {
      ...modal.value,
      nama: formNama.trim(),
      harga: hargaNum,
      hargaMulaiDari: formHargaMulaiDari,
      durasiMenit: durasiNum,
      jumlahBackground: bgNum,
      maxOrang: formMaxOrang ? parseInt(formMaxOrang) : null,
      cetakInclude: formCetak,
      popular: formPopular,
      aktif: formAktif,
    }

    if (oldHarga !== hargaNum) {
      const ok = window.confirm(
        `Anda akan mengubah harga paket ${modal.value.nama} dari ${formatRupiah(oldHarga)} menjadi ${formatRupiah(hargaNum)}.\n\nPerubahan berlaku untuk booking baru. Booking yang sudah masuk tidak terpengaruh.\n\nLanjutkan?`
      )
      if (!ok) return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/settings/${modal.key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: newValue }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Gagal menyimpan"); return }
      toast.success(`Paket ${formNama} berhasil diupdate`)
      setModal(null)
      onRefresh()
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  const pakets = items.filter((i) => i.key.startsWith("paket_"))

  return (
    <div className="space-y-4">
      {!isOwner && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          Anda login sebagai Admin. Hanya Owner yang bisa mengubah harga paket.
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{pakets.filter((p) => (p.value as PaketValue).aktif).length} paket aktif</p>
        {isOwner && (
          <Button size="sm" className="bg-[#0d1f3c] hover:bg-[#1a3561] gap-2" onClick={openTambah}>
            <Plus className="w-4 h-4" /> Tambah Paket
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pakets.map((row) => (
          <PaketCard key={row.key} row={row} isOwner={isOwner} onEdit={openEdit} onDelete={handleDelete} />
        ))}
      </div>

      {/* Modal Edit / Tambah Paket */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setModal(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#0d1f3c]">
                {modal.mode === "tambah" ? "Tambah Paket Baru" : `Edit Paket ${modal.value.nama}`}
              </h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">✕</button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Kategori — hanya saat tambah */}
              {modal.mode === "tambah" && (
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Kategori *</label>
                  <select value={formKategori} onChange={(e) => setFormKategori(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20">
                    {KATEGORI_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Nama */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Nama Paket *</label>
                <input type="text" value={formNama} onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Bronze, Prewedding Premium..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20" />
              </div>

              {/* Harga */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Harga (Rp) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">Rp</span>
                  <input type="text"
                    value={Number(formHarga.replace(/\D/g,"")).toLocaleString("id-ID") || ""}
                    onChange={(e) => setFormHarga(e.target.value.replace(/\D/g,""))}
                    placeholder="300.000"
                    className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20" />
                </div>
              </div>

              {/* Grid: Durasi + BG + Max Orang */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Durasi (menit)</label>
                  <input type="number" value={formDurasi} onChange={(e) => setFormDurasi(e.target.value)} min={10}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">BG</label>
                  <input type="number" value={formBg} onChange={(e) => setFormBg(e.target.value)} min={1}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Max Orang</label>
                  <input type="number" value={formMaxOrang} onChange={(e) => setFormMaxOrang(e.target.value)} min={1} placeholder="∞"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20" />
                </div>
              </div>

              {/* Cetak Include */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Cetak Include</label>
                <select value={formCetak ?? ""} onChange={(e) => setFormCetak(e.target.value as PaketValue["cetakInclude"] || null)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20">
                  {CETAK_OPTIONS.map((o) => (
                    <option key={o.value ?? "none"} value={o.value ?? ""}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Toggle hargaMulaiDari */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formHargaMulaiDari} onChange={(e) => setFormHargaMulaiDari(e.target.checked)} className="rounded" />
                  <span className="text-sm text-gray-700">Tampilkan label "Mulai dari" di harga</span>
                </label>
                <p className="text-xs text-gray-400 mt-1 ml-6">Cocok untuk paket dengan harga fleksibel</p>
              </div>

              {/* Toggle popular & aktif */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formPopular} onChange={(e) => setFormPopular(e.target.checked)} className="rounded" />
                  <span className="text-sm text-gray-700">Badge Popular</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formAktif} onChange={(e) => setFormAktif(e.target.checked)} className="rounded" />
                  <span className="text-sm text-gray-700">Aktif (tampil di booking)</span>
                </label>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setModal(null)} disabled={saving}>Batal</Button>
              <Button className="flex-1 bg-[#0d1f3c] hover:bg-[#1a3561]" onClick={handleSave} disabled={saving}>
                {saving ? "Menyimpan..." : modal.mode === "tambah" ? "Tambah Paket" : "Simpan Perubahan"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
