"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Trash2, CalendarX, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface TanggalLibur {
  id: string
  tanggal: string
  keterangan: string | null
  created_at: string
}

interface TabLiburProps {
  isOwner: boolean
}

const HARI  = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]

function formatTanggal(tgl: string) {
  const d = new Date(tgl + "T00:00:00")
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`
}

export function TabLibur({ isOwner }: TabLiburProps) {
  const [items, setItems]           = useState<TanggalLibur[]>([])
  const [loading, setLoading]       = useState(true)
  const [tanggalInput, setTanggal]  = useState("")
  const [keteranganInput, setKet]   = useState("")
  const [saving, setSaving]         = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/tanggal-libur")
      const data = await res.json()
      if (res.ok) setItems(data.items ?? [])
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleAdd() {
    if (!tanggalInput) { toast.error("Pilih tanggal terlebih dahulu"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/tanggal-libur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tanggal: tanggalInput, keterangan: keteranganInput || null }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Gagal menambahkan"); return }
      toast.success("Tanggal libur ditambahkan")
      setTanggal("")
      setKet("")
      load()
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item: TanggalLibur) {
    if (!confirm(`Hapus libur tanggal ${formatTanggal(item.tanggal)}?`)) return
    setDeletingId(item.id)
    try {
      const res = await fetch(`/api/tanggal-libur/${item.tanggal}`, { method: "DELETE" })
      if (!res.ok) { toast.error("Gagal menghapus"); return }
      toast.success("Tanggal libur dihapus")
      load()
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setDeletingId(null)
    }
  }

  const today    = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })
  const upcoming = items.filter((i) => i.tanggal >= today).sort((a, b) => a.tanggal.localeCompare(b.tanggal))
  const past     = items.filter((i) => i.tanggal <  today).sort((a, b) => b.tanggal.localeCompare(a.tanggal))

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <CalendarX className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-[#0d1f3c] text-sm">Tanggal Libur / Tutup</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Tanggal yang diblokir tidak bisa dibooking oleh client.
            </p>
          </div>
        </div>

        {/* Form tambah — owner only */}
        {isOwner && (
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 mb-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Tambah Tanggal Libur</p>
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Tanggal *</label>
                <input
                  type="date"
                  value={tanggalInput}
                  min={today}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Keterangan (opsional)</label>
                <input
                  type="text"
                  value={keteranganInput}
                  onChange={(e) => setKet(e.target.value)}
                  placeholder="cth: Libur Lebaran, Maintenance..."
                  className="h-9 w-56 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20"
                />
              </div>
              <button
                onClick={handleAdd}
                disabled={saving || !tanggalInput}
                className="h-9 px-4 bg-[#0d1f3c] text-white text-sm rounded-lg font-medium hover:bg-[#162d56] disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Tambah
              </button>
            </div>
          </div>
        )}

        {/* Daftar mendatang */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
          </div>
        ) : upcoming.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <CalendarX className="w-7 h-7 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Tidak ada tanggal libur yang dijadwalkan</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Mendatang</p>
            {upcoming.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <CalendarX className="w-4 h-4 text-red-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">{formatTanggal(item.tanggal)}</p>
                    {item.keterangan && (
                      <p className="text-xs text-red-400 mt-0.5">{item.keterangan}</p>
                    )}
                  </div>
                </div>
                {isOwner && (
                  <button
                    onClick={() => handleDelete(item)}
                    disabled={deletingId === item.id}
                    className="p-1.5 rounded-lg text-red-300 hover:text-red-600 hover:bg-red-100 transition"
                    title="Hapus"
                  >
                    {deletingId === item.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />
                    }
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Daftar lampau */}
        {past.length > 0 && (
          <details className="mt-4">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 select-none">
              {past.length} tanggal libur lampau
            </summary>
            <div className="mt-2 space-y-1.5">
              {past.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2 opacity-50"
                >
                  <div>
                    <p className="text-xs font-medium text-gray-500">{formatTanggal(item.tanggal)}</p>
                    {item.keterangan && <p className="text-xs text-gray-400">{item.keterangan}</p>}
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item.id}
                      className="p-1 rounded text-gray-300 hover:text-red-400 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  )
}
