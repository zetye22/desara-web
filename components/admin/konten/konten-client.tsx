"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Star, Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Save, X, ArrowUp, ArrowDown } from "lucide-react"

interface TestimoniRow {
  id: string
  nama: string
  paket: string
  teks: string
  bintang: number
  inisial: string
  urutan: number
  aktif: boolean
}

const EMPTY_FORM = {
  nama: "", paket: "", teks: "", bintang: 5, inisial: "", urutan: 0, aktif: true,
}

export function KontenClient() {
  const [items, setItems]       = useState<TestimoniRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]     = useState<string | null>(null)
  const [form, setForm]         = useState({ ...EMPTY_FORM })
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch("/api/konten/testimoni")
      const data = await res.json()
      if (res.ok) setItems(data.items ?? [])
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function openNew() {
    setEditId(null)
    setForm({ ...EMPTY_FORM, urutan: (items.length + 1) })
    setShowForm(true)
  }

  function openEdit(item: TestimoniRow) {
    setEditId(item.id)
    setForm({
      nama: item.nama,
      paket: item.paket,
      teks: item.teks,
      bintang: item.bintang,
      inisial: item.inisial,
      urutan: item.urutan,
      aktif: item.aktif,
    })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditId(null)
    setForm({ ...EMPTY_FORM })
  }

  // Auto-generate inisial dari nama
  function handleNamaChange(nama: string) {
    const inisial = nama
      .split(/[\s&]+/)
      .filter(Boolean)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .slice(0, 2)
      .join("")
    setForm((prev) => ({ ...prev, nama, inisial: prev.inisial || inisial }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nama.trim() || !form.paket.trim() || !form.teks.trim()) {
      toast.error("Nama, paket, dan teks testimoni wajib diisi")
      return
    }

    setSaving(true)
    try {
      const url    = editId ? `/api/konten/testimoni/${editId}` : "/api/konten/testimoni"
      const method = editId ? "PATCH" : "POST"
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Gagal menyimpan"); return }
      toast.success(editId ? "Testimoni berhasil diupdate" : "Testimoni berhasil ditambahkan")
      closeForm()
      load()
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, nama: string) {
    if (!confirm(`Hapus testimoni dari "${nama}"?`)) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/konten/testimoni/${id}`, { method: "DELETE" })
      if (!res.ok) { toast.error("Gagal menghapus"); return }
      toast.success("Testimoni dihapus")
      load()
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setDeleting(null)
    }
  }

  async function toggleAktif(item: TestimoniRow) {
    try {
      const res = await fetch(`/api/konten/testimoni/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aktif: !item.aktif }),
      })
      if (!res.ok) { toast.error("Gagal mengubah status"); return }
      toast.success(item.aktif ? "Testimoni disembunyikan" : "Testimoni ditampilkan")
      load()
    } catch {
      toast.error("Terjadi kesalahan")
    }
  }

  async function moveUrutan(item: TestimoniRow, direction: "up" | "down") {
    const sorted = [...items].sort((a, b) => a.urutan - b.urutan)
    const idx    = sorted.findIndex((i) => i.id === item.id)
    const swapIdx = direction === "up" ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return

    const other = sorted[swapIdx]
    try {
      await Promise.all([
        fetch(`/api/konten/testimoni/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urutan: other.urutan }),
        }),
        fetch(`/api/konten/testimoni/${other.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urutan: item.urutan }),
        }),
      ])
      load()
    } catch {
      toast.error("Gagal mengubah urutan")
    }
  }

  const sorted = [...items].sort((a, b) => a.urutan - b.urutan)

  return (
    <div className="space-y-5">
      {/* Info sync */}
      <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700">
        <p className="font-semibold mb-0.5">Sinkron otomatis dengan halaman depan</p>
        <p className="text-blue-600 text-xs">
          Perubahan di sini langsung tampil di landing page. Info studio (WA, jam buka, Instagram) diatur di{" "}
          <a href="/admin/settings" className="underline font-medium">Pengaturan → Rekening & Kontak</a>.
        </p>
      </div>

      {/* Header + tombol tambah */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#0d1f3c]">Testimoni Client</h2>
          <p className="text-xs text-gray-400 mt-0.5">{items.filter((i) => i.aktif).length} aktif ditampilkan</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-[#0d1f3c] hover:bg-[#1a3a6e] text-white text-sm font-medium px-4 py-2 rounded-xl transition"
        >
          <Plus className="w-4 h-4" />
          Tambah Testimoni
        </button>
      </div>

      {/* Form tambah/edit */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#0d1f3c] text-sm">
              {editId ? "Edit Testimoni" : "Tambah Testimoni Baru"}
            </h3>
            <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Nama Client *</label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) => handleNamaChange(e.target.value)}
                  placeholder="Rina & Dika"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Paket *</label>
                <input
                  type="text"
                  value={form.paket}
                  onChange={(e) => setForm({ ...form, paket: e.target.value })}
                  placeholder="Paket Gold, Foto Keluarga..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Teks Testimoni *</label>
              <textarea
                value={form.teks}
                onChange={(e) => setForm({ ...form, teks: e.target.value })}
                rows={3}
                placeholder="Tuliskan ulasan dari client..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20 resize-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Bintang</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setForm({ ...form, bintang: n })}
                    >
                      <Star
                        className={`w-5 h-5 transition-colors ${
                          n <= form.bintang ? "fill-[#C9A84C] text-[#C9A84C]" : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Inisial (2 huruf)</label>
                <input
                  type="text"
                  value={form.inisial}
                  onChange={(e) => setForm({ ...form, inisial: e.target.value.toUpperCase().slice(0, 3) })}
                  maxLength={3}
                  placeholder="RD"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20 uppercase"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Urutan</label>
                <input
                  type="number"
                  value={form.urutan}
                  onChange={(e) => setForm({ ...form, urutan: parseInt(e.target.value || "0") })}
                  min={0}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="aktif"
                checked={form.aktif}
                onChange={(e) => setForm({ ...form, aktif: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="aktif" className="text-sm text-gray-600 cursor-pointer">
                Tampilkan di halaman depan
              </label>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={closeForm}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#0d1f3c] hover:bg-[#1a3a6e] py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Daftar testimoni */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Belum ada testimoni. Tambahkan yang pertama!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((item, idx) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-4 transition ${
                item.aktif ? "border-gray-200" : "border-gray-100 opacity-60"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#0d1f3c] flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {item.inisial}
                </div>

                {/* Konten */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{item.nama}</p>
                      <p className="text-xs text-gray-400">{item.paket}</p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: item.bintang }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-[#C9A84C] text-[#C9A84C]" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1.5 italic leading-relaxed line-clamp-2">
                    &ldquo;{item.teks}&rdquo;
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Urutan */}
                  <button
                    onClick={() => moveUrutan(item, "up")}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-20 disabled:cursor-not-allowed transition"
                    title="Naikan urutan"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveUrutan(item, "down")}
                    disabled={idx === sorted.length - 1}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-20 disabled:cursor-not-allowed transition"
                    title="Turunkan urutan"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Toggle aktif */}
                  <button
                    onClick={() => toggleAktif(item)}
                    className={`p-1.5 rounded-lg transition ${
                      item.aktif
                        ? "text-green-500 hover:text-green-700 hover:bg-green-50"
                        : "text-gray-300 hover:text-gray-500 hover:bg-gray-100"
                    }`}
                    title={item.aktif ? "Sembunyikan" : "Tampilkan"}
                  >
                    {item.aktif ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => openEdit(item)}
                    className="p-1.5 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  {/* Hapus */}
                  <button
                    onClick={() => handleDelete(item.id, item.nama)}
                    disabled={deleting === item.id}
                    className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                    title="Hapus"
                  >
                    {deleting === item.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />
                    }
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
