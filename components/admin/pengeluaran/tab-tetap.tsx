"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, CheckCircle2, XCircle, RefreshCw, Zap } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { formatRupiah } from "@/lib/utils"
import { ModalPosTetap } from "./modal-pos-tetap"
import type { PengeluaranTetap, KategoriPengeluaran } from "./types"

interface TabTetapProps {
  items: PengeluaranTetap[]
  kategoriList: KategoriPengeluaran[]
  bulanAktif: string // "YYYY-MM" — untuk cek apakah sudah di-generate
  sudahDigenerate: Set<string> // set of recurring_id yang sudah ada di bulan ini
  onRefresh: () => void
}

export function TabTetap({ items, kategoriList, bulanAktif, sudahDigenerate, onRefresh }: TabTetapProps) {
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<PengeluaranTetap | undefined>(undefined)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const aktifItems = items.filter((i) => i.aktif)
  const nonaktifItems = items.filter((i) => !i.aktif)
  const totalBulanan = aktifItems.reduce((s, i) => s + i.nominal, 0)
  const belumDigenerate = aktifItems.filter((i) => !sudahDigenerate.has(i.id))

  function handleTambah() {
    setEditItem(undefined)
    setShowModal(true)
  }

  function handleEdit(item: PengeluaranTetap) {
    setEditItem(item)
    setShowModal(true)
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Yakin ingin menghapus pos tetap ini?")) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/pengeluaran/tetap/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Gagal menghapus"); return }
      toast.success("Pos tetap berhasil dihapus")
      onRefresh()
    } catch {
      toast.error("Gagal terhubung ke server")
    } finally {
      setDeletingId(null)
    }
  }

  async function handleToggleAktif(item: PengeluaranTetap) {
    setTogglingId(item.id)
    try {
      const res = await fetch(`/api/pengeluaran/tetap/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aktif: !item.aktif }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Gagal mengubah status"); return }
      toast.success(`Pos "${item.nama}" ${!item.aktif ? "diaktifkan" : "dinonaktifkan"}`)
      onRefresh()
    } catch {
      toast.error("Gagal terhubung ke server")
    } finally {
      setTogglingId(null)
    }
  }

  async function handleGenerate() {
    if (belumDigenerate.length === 0) {
      toast.info("Semua pos tetap sudah di-generate untuk bulan ini")
      return
    }

    const bulanLabel = new Date(bulanAktif + "-01").toLocaleDateString("id-ID", { month: "long", year: "numeric" })
    if (!window.confirm(`Generate ${belumDigenerate.length} pos tetap ke ${bulanLabel}?`)) return

    setGenerating(true)
    try {
      const res = await fetch("/api/pengeluaran/tetap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulan: bulanAktif }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Gagal generate"); return }
      toast.success(`${data.generated} pos tetap berhasil di-generate`)
      onRefresh()
    } catch {
      toast.error("Gagal terhubung ke server")
    } finally {
      setGenerating(false)
    }
  }

  const bulanLabel = new Date(bulanAktif + "-01").toLocaleDateString("id-ID", { month: "long", year: "numeric" })

  return (
    <div className="space-y-4">
      {/* Info card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-xs text-blue-500 font-medium">Total Pos Aktif</p>
          <p className="text-xl font-bold text-[#0d1f3c] mt-0.5">{aktifItems.length} pos</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
          <p className="text-xs text-amber-600 font-medium">Total / Bulan</p>
          <p className="text-xl font-bold text-[#0d1f3c] mt-0.5">{formatRupiah(totalBulanan)}</p>
        </div>
        <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3">
          <p className="text-xs text-green-600 font-medium">Status {bulanLabel}</p>
          {belumDigenerate.length === 0 ? (
            <p className="text-sm font-semibold text-green-700 mt-0.5">Semua sudah di-generate</p>
          ) : (
            <p className="text-sm font-semibold text-amber-700 mt-0.5">{belumDigenerate.length} belum di-generate</p>
          )}
        </div>
      </div>

      {/* Tombol aksi */}
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <Button
          size="sm"
          className="bg-[#0d1f3c] hover:bg-[#1a3561] gap-2"
          onClick={handleTambah}
        >
          <Plus className="w-4 h-4" />
          Tambah Pos Tetap
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="gap-2 border-green-600 text-green-700 hover:bg-green-50"
          onClick={handleGenerate}
          disabled={generating || belumDigenerate.length === 0}
        >
          {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {generating ? "Memproses..." : `Generate ke ${bulanLabel}`}
          {belumDigenerate.length > 0 && !generating && (
            <span className="ml-1 bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {belumDigenerate.length}
            </span>
          )}
        </Button>
      </div>

      {/* Tabel pos aktif */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-blue-50 border-b border-blue-100">
          <p className="text-xs font-semibold text-[#0d1f3c] uppercase tracking-wide">
            Pos Tetap Aktif ({aktifItems.length})
          </p>
        </div>

        {aktifItems.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">
            Belum ada pos tetap. Klik &ldquo;+ Tambah Pos Tetap&rdquo; untuk memulai.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-400 text-xs uppercase">
                  <th className="px-5 py-2.5 text-left font-medium">Nama</th>
                  <th className="px-5 py-2.5 text-left font-medium">Kategori</th>
                  <th className="px-5 py-2.5 text-right font-medium">Nominal/Bulan</th>
                  <th className="px-5 py-2.5 text-center font-medium">Status {bulanLabel}</th>
                  <th className="px-5 py-2.5 text-center font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {aktifItems.map((item) => {
                  const generated = sudahDigenerate.has(item.id)
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-[#0d1f3c]">
                        {item.nama}
                        {item.catatan && (
                          <p className="text-xs text-gray-400 font-normal mt-0.5">{item.catatan}</p>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {item.kategori_pengeluaran ? (
                          <span
                            className="inline-block text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: item.kategori_pengeluaran.warna + "20",
                              color: item.kategori_pengeluaran.warna,
                            }}
                          >
                            {item.kategori_pengeluaran.nama}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-700">
                        {formatRupiah(item.nominal)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {generated ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Sudah generate
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-500">
                            <XCircle className="w-3.5 h-3.5" />
                            Belum
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#0d1f3c] hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleAktif(item)}
                            disabled={togglingId === item.id}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50"
                            title="Nonaktifkan"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#0d1f3c] text-white font-semibold">
                  <td colSpan={2} className="px-5 py-3">Total Pengeluaran Tetap / Bulan</td>
                  <td className="px-5 py-3 text-right">{formatRupiah(totalBulanan)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Pos nonaktif (collapsible sederhana) */}
      {nonaktifItems.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Pos Nonaktif ({nonaktifItems.length})
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {nonaktifItems.map((item) => (
              <div key={item.id} className="px-5 py-3 flex items-center justify-between opacity-60">
                <div>
                  <p className="text-sm text-gray-600 line-through">{item.nama}</p>
                  <p className="text-xs text-gray-400">{formatRupiah(item.nominal)}/bulan</p>
                </div>
                <button
                  onClick={() => handleToggleAktif(item)}
                  disabled={togglingId === item.id}
                  className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                >
                  Aktifkan
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <ModalPosTetap
          item={editItem}
          kategoriList={kategoriList}
          onClose={() => setShowModal(false)}
          onSuccess={onRefresh}
        />
      )}
    </div>
  )
}
