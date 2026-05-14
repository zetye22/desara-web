"use client"

import { useState } from "react"
import { Pencil, Check, X, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { formatRupiah } from "@/lib/utils"
import type { SettingsRow, AddonValue } from "./types"
import { ADDON_KEYS } from "./types"

interface TabAddonProps {
  items: SettingsRow[]
  isOwner: boolean
  onRefresh: () => void
}

interface TambahState {
  nama: string
  harga: string
  satuan: string
}

export function TabAddon({ items, isOwner, onRefresh }: TabAddonProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [formHarga, setFormHarga] = useState("")
  const [formSatuan, setFormSatuan] = useState("")
  const [saving, setSaving] = useState(false)

  const [showTambah, setShowTambah] = useState(false)
  const [tambah, setTambah] = useState<TambahState>({ nama: "", harga: "", satuan: "" })

  const addons = items.filter((i) => i.key.startsWith("addon_"))
  const fixedKeys = ADDON_KEYS as readonly string[]

  function startEdit(row: SettingsRow) {
    const v: AddonValue = row.value
    setEditingKey(row.key)
    setFormHarga(String(v.harga))
    setFormSatuan(v.satuan ?? "")
  }

  function cancelEdit() { setEditingKey(null) }

  async function saveEdit(row: SettingsRow) {
    const hargaNum = parseInt(formHarga.replace(/\D/g, "") || "0")
    if (hargaNum <= 0) { toast.error("Harga harus lebih dari 0"); return }

    const oldHarga = (row.value as AddonValue).harga
    if (oldHarga !== hargaNum) {
      const ok = window.confirm(
        `Ubah harga "${row.value.nama}" dari ${formatRupiah(oldHarga)} ke ${formatRupiah(hargaNum)}?`
      )
      if (!ok) return
    }

    setSaving(true)
    try {
      const newValue: AddonValue = { ...row.value, harga: hargaNum, satuan: formSatuan.trim() }
      const res = await fetch(`/api/settings/${row.key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: newValue }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Gagal menyimpan"); return }
      toast.success(`Harga "${row.value.nama}" berhasil diupdate`)
      setEditingKey(null)
      onRefresh()
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(row: SettingsRow) {
    if (!window.confirm(`Hapus add-on "${row.value.nama}"?\n\nAdd-on ini tidak akan tampil di halaman depan. Add-on bawaan (tambahan waktu, orang, dll) tidak akan hilang dari form booking.`)) return
    try {
      const res = await fetch(`/api/settings/${row.key}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Gagal menghapus"); return }
      toast.success(`Add-on "${row.value.nama}" dihapus`)
      onRefresh()
    } catch {
      toast.error("Terjadi kesalahan")
    }
  }

  async function handleTambah() {
    if (!tambah.nama.trim()) { toast.error("Nama add-on wajib diisi"); return }
    const hargaNum = parseInt(tambah.harga.replace(/\D/g, "") || "0")
    if (hargaNum <= 0) { toast.error("Harga harus lebih dari 0"); return }

    const key = `addon_${tambah.nama.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")}_${Date.now()}`
    const value: AddonValue = {
      nama: tambah.nama.trim(),
      harga: hargaNum,
      satuan: tambah.satuan.trim(),
    }

    setSaving(true)
    try {
      const res = await fetch("/api/settings/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value, kategori: "addon", deskripsi: tambah.nama.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Gagal menyimpan"); return }
      toast.success(`Add-on "${tambah.nama}" berhasil ditambahkan`)
      setShowTambah(false)
      setTambah({ nama: "", harga: "", satuan: "" })
      onRefresh()
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {!isOwner && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          Hanya Owner yang bisa mengubah harga add-on.
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{addons.length} add-on tersedia</p>
        {isOwner && (
          <Button size="sm" className="bg-[#0d1f3c] hover:bg-[#1a3561] gap-2"
            onClick={() => { setShowTambah(true); setTambah({ nama: "", harga: "", satuan: "" }) }}>
            <Plus className="w-4 h-4" /> Tambah Add-on
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-[#0d1f3c]">Daftar Add-on</h3>
          <p className="text-xs text-gray-400 mt-0.5">Layanan tambahan yang tampil di halaman depan website</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-xs uppercase">
                <th className="px-5 py-2.5 text-left font-medium">Add-on</th>
                <th className="px-5 py-2.5 text-right font-medium">Harga</th>
                <th className="px-5 py-2.5 text-left font-medium">Satuan</th>
                {isOwner && <th className="px-5 py-2.5 text-center font-medium">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {addons.map((row) => {
                const v: AddonValue = row.value
                const isEditing = editingKey === row.key
                const isFixed = fixedKeys.includes(row.key)
                return (
                  <tr key={row.key} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <span className="font-medium text-[#0d1f3c]">{v.nama}</span>
                      {!isFixed && (
                        <span className="ml-2 text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">custom</span>
                      )}
                    </td>

                    {isEditing ? (
                      <>
                        <td className="px-5 py-2">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">Rp</span>
                            <input
                              type="text"
                              value={Number(formHarga.replace(/\D/g,"")).toLocaleString("id-ID") || ""}
                              onChange={(e) => setFormHarga(e.target.value.replace(/\D/g,""))}
                              className="w-full rounded border border-blue-300 pl-7 pr-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-400"
                              autoFocus
                            />
                          </div>
                        </td>
                        <td className="px-5 py-2">
                          <input
                            type="text"
                            value={formSatuan}
                            onChange={(e) => setFormSatuan(e.target.value)}
                            placeholder="per 10 menit"
                            className="w-full rounded border border-blue-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                        </td>
                        <td className="px-5 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => saveEdit(row)} disabled={saving}
                              className="p-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={cancelEdit} disabled={saving}
                              className="p-1.5 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-50">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-5 py-3 text-right font-semibold text-[#C9A84C]">
                          {formatRupiah(v.harga)}
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs">{v.satuan}</td>
                        {isOwner && (
                          <td className="px-5 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => startEdit(row)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-[#0d1f3c] hover:bg-blue-50 transition-colors"
                                title="Edit">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDelete(row)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Hapus">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form tambah add-on baru */}
      {showTambah && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowTambah(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#0d1f3c]">Tambah Add-on Baru</h2>
              <button onClick={() => setShowTambah(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">✕</button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Nama Add-on *</label>
                <input type="text" value={tambah.nama}
                  onChange={(e) => setTambah({ ...tambah, nama: e.target.value })}
                  placeholder="Contoh: Makeup Artist, Kostum Kebaya..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20" />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Harga (Rp) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">Rp</span>
                  <input type="text"
                    value={Number(tambah.harga.replace(/\D/g,"")).toLocaleString("id-ID") || ""}
                    onChange={(e) => setTambah({ ...tambah, harga: e.target.value.replace(/\D/g,"") })}
                    placeholder="150.000"
                    className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Satuan (opsional)</label>
                <input type="text" value={tambah.satuan}
                  onChange={(e) => setTambah({ ...tambah, satuan: e.target.value })}
                  placeholder="per sesi, per orang, per jam..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20" />
              </div>

              <p className="text-xs text-gray-400">
                Add-on ini akan tampil di bagian &quot;Add-On Tambahan&quot; di halaman depan website.
              </p>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowTambah(false)} disabled={saving}>Batal</Button>
              <Button className="flex-1 bg-[#0d1f3c] hover:bg-[#1a3561]" onClick={handleTambah} disabled={saving}>
                {saving ? "Menyimpan..." : "Tambah Add-on"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
