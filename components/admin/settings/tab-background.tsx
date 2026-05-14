"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Eye, EyeOff, Check, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import type { Background } from "./types"

interface TabBackgroundProps {
  items: Background[]
  isOwner: boolean
  onRefresh: () => void
}

interface EditState {
  id: string | null // null = tambah baru
  nama: string
  warna: string
}

export function TabBackground({ items, isOwner, onRefresh }: TabBackgroundProps) {
  const [editState, setEditState] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)

  const aktif = items.filter((i) => i.aktif)
  const nonaktif = items.filter((i) => !i.aktif)

  function startEdit(bg: Background) {
    setEditState({ id: bg.id, nama: bg.nama, warna: bg.warna })
  }

  function startTambah() {
    setEditState({ id: null, nama: "", warna: "#AABBCC" })
  }

  async function handleSave() {
    if (!editState) return
    if (!editState.nama.trim()) { toast.error("Nama background wajib diisi"); return }

    setSaving(true)
    try {
      let res: Response
      if (editState.id) {
        res = await fetch(`/api/settings/background/${editState.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nama: editState.nama.trim(), warna: editState.warna }),
        })
      } else {
        res = await fetch("/api/settings/background", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nama: editState.nama.trim(), warna: editState.warna }),
        })
      }

      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Gagal menyimpan"); return }

      toast.success(`Background "${editState.nama}" ${editState.id ? "diupdate" : "ditambahkan"}`)
      setEditState(null)
      onRefresh()
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(bg: Background) {
    try {
      const res = await fetch(`/api/settings/background/${bg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aktif: !bg.aktif }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Gagal mengubah"); return }
      toast.success(`BG "${bg.nama}" ${!bg.aktif ? "diaktifkan" : "disembunyikan"}`)
      onRefresh()
    } catch { toast.error("Terjadi kesalahan") }
  }

  async function handleDelete(bg: Background) {
    if (!window.confirm(`Hapus background "${bg.nama}"? Tindakan ini tidak bisa dibatalkan.`)) return
    try {
      const res = await fetch(`/api/settings/background/${bg.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Gagal menghapus"); return }
      toast.success(`BG "${bg.nama}" dihapus`)
      onRefresh()
    } catch { toast.error("Terjadi kesalahan") }
  }

  return (
    <div className="space-y-4">
      {!isOwner && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          Hanya Owner yang bisa mengubah background.
        </div>
      )}

      {/* Info jumlah aktif */}
      <div className="flex items-center justify-between">
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 inline-flex items-center gap-3">
          <div>
            <p className="text-xs text-blue-500 font-medium">Background Aktif</p>
            <p className="text-xl font-bold text-[#0d1f3c]">{aktif.length} background</p>
          </div>
        </div>
        {isOwner && (
          <Button size="sm" className="bg-[#0d1f3c] hover:bg-[#1a3561] gap-2" onClick={startTambah}>
            <Plus className="w-4 h-4" /> Tambah BG
          </Button>
        )}
      </div>

      {/* Grid background aktif */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {aktif.map((bg) => (
          <div key={bg.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Preview warna */}
            <div className="h-24 relative" style={{ backgroundColor: bg.warna }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold opacity-30" style={{
                  color: bg.warna === "#FFFFFF" ? "#000" : "#FFF"
                }}>
                  {bg.nama.charAt(0)}
                </span>
              </div>
            </div>
            {/* Info */}
            <div className="p-3">
              <p className="text-sm font-semibold text-[#0d1f3c]">{bg.nama}</p>
              <p className="text-xs text-gray-400 font-mono">{bg.warna}</p>
              {isOwner && (
                <div className="flex gap-1 mt-2">
                  <button onClick={() => startEdit(bg)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-[#0d1f3c] hover:bg-blue-50 flex-1 flex justify-center">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleToggle(bg)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 flex-1 flex justify-center">
                    <EyeOff className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(bg)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 flex-1 flex justify-center">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Background tersembunyi */}
      {nonaktif.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Tersembunyi ({nonaktif.length})
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {nonaktif.map((bg) => (
              <div key={bg.id} className="px-4 py-3 flex items-center gap-3 opacity-60">
                <div className="w-8 h-8 rounded-full shrink-0 border border-gray-200" style={{ backgroundColor: bg.warna }} />
                <p className="text-sm text-gray-600 flex-1 line-through">{bg.nama}</p>
                {isOwner && (
                  <button onClick={() => handleToggle(bg)} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                    <Eye className="w-3.5 h-3.5" /> Tampilkan
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Edit / Tambah */}
      {editState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditState(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#0d1f3c]">
                {editState.id ? "Edit Background" : "Tambah Background Baru"}
              </h2>
              <button onClick={() => setEditState(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">✕</button>
            </div>

            <div className="p-5 space-y-4">
              {/* Preview */}
              <div className="h-28 rounded-xl border border-gray-200 flex items-center justify-center"
                style={{ backgroundColor: editState.warna }}>
                <span className="text-3xl font-bold opacity-30"
                  style={{ color: editState.warna === "#FFFFFF" ? "#000" : "#FFF" }}>
                  {editState.nama.charAt(0) || "?"}
                </span>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Nama Background *</label>
                <input type="text" value={editState.nama}
                  onChange={(e) => setEditState({ ...editState, nama: e.target.value })}
                  placeholder="Contoh: BG Bunga Mawar"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20" />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Warna (Hex)</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={editState.warna}
                    onChange={(e) => setEditState({ ...editState, warna: e.target.value })}
                    className="w-12 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                  <input type="text" value={editState.warna}
                    onChange={(e) => setEditState({ ...editState, warna: e.target.value })}
                    placeholder="#AABBCC"
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20" />
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setEditState(null)} disabled={saving}>
                <X className="w-4 h-4 mr-1" /> Batal
              </Button>
              <Button className="flex-1 bg-[#0d1f3c] hover:bg-[#1a3561]" onClick={handleSave} disabled={saving}>
                <Check className="w-4 h-4 mr-1" />
                {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
