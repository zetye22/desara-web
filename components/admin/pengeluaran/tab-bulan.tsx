"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { formatRupiah } from "@/lib/utils"
import { ModalPengeluaran } from "./modal-pengeluaran"
import type { Pengeluaran, KategoriPengeluaran } from "./types"
import { useRole } from "@/lib/role-context"
import { useConfirm } from "@/hooks/use-confirm"

interface TabBulanProps {
  items: Pengeluaran[]
  kategoriList: KategoriPengeluaran[]
  bulan: string       // "YYYY-MM"
  loading: boolean
  onBulanChange: (bulan: string) => void
  onRefresh: () => void
}

export function TabBulan({ items, kategoriList, bulan, loading, onBulanChange, onRefresh }: TabBulanProps) {
  const { isAdmin } = useRole()
  const { confirm, ConfirmDialog } = useConfirm()
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Pengeluaran | undefined>(undefined)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [filterKategori, setFilterKategori] = useState("")

  function handlePrevBulan() {
    const [y, m] = bulan.split("-").map(Number)
    const prev = new Date(y, m - 2, 1)
    onBulanChange(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`)
  }

  function handleNextBulan() {
    const [y, m] = bulan.split("-").map(Number)
    const next = new Date(y, m, 1)
    onBulanChange(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`)
  }

  const bulanLabel = new Date(bulan + "-01").toLocaleDateString("id-ID", { month: "long", year: "numeric" })
  const isCurrentMonth = bulan === new Date().toISOString().slice(0, 7)

  const filtered = filterKategori
    ? items.filter((i) => i.kategori_id === filterKategori)
    : items

  const totalFiltered = filtered.reduce((s, i) => s + i.nominal, 0)
  const totalAll = items.reduce((s, i) => s + i.nominal, 0)

  // Kelompokkan per tipe kategori
  const byTipe: Record<string, { label: string; items: Pengeluaran[]; total: number }> = {}
  for (const item of filtered) {
    const tipe = item.kategori_pengeluaran?.tipe ?? "lainnya"
    const label = tipe === "operasional" ? "Operasional" : tipe === "hpp" ? "HPP" : tipe === "aset" ? "Aset" : "Lainnya"
    if (!byTipe[tipe]) byTipe[tipe] = { label, items: [], total: 0 }
    byTipe[tipe].items.push(item)
    byTipe[tipe].total += item.nominal
  }

  async function handleDelete(id: string) {
    const ok = await confirm({ title: "Hapus Pengeluaran?", message: "Pengeluaran ini akan dihapus secara permanen." })
    if (!ok) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/pengeluaran/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Gagal menghapus"); return }
      toast.success("Pengeluaran berhasil dihapus")
      onRefresh()
    } catch {
      toast.error("Gagal terhubung ke server")
    } finally {
      setDeletingId(null)
    }
  }

  function handleEdit(item: Pengeluaran) {
    setEditItem(item)
    setShowModal(true)
  }

  function handleTambah() {
    setEditItem(undefined)
    setShowModal(true)
  }

  return (
    <div className="space-y-4">
      {/* Navigasi bulan */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevBulan}
            className="p-2 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div className="px-4 py-2 rounded-lg border border-gray-100 bg-white min-w-[160px] text-center">
            <span className="text-sm font-semibold text-[#0d1f3c]">{bulanLabel}</span>
            {isCurrentMonth && (
              <span className="ml-2 text-xs text-blue-600 font-medium">(Bulan ini)</span>
            )}
          </div>
          <button
            onClick={handleNextBulan}
            disabled={isCurrentMonth}
            className="p-2 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          {!isAdmin && (
            <Button
              size="sm"
              className="bg-[#0d1f3c] hover:bg-[#1a3561] gap-2"
              onClick={handleTambah}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter kategori */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterKategori("")}
          className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
            filterKategori === ""
              ? "bg-[#0d1f3c] text-white border-[#0d1f3c]"
              : "border-gray-100 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Semua ({items.length})
        </button>
        {kategoriList.map((k) => {
          const count = items.filter((i) => i.kategori_id === k.id).length
          if (count === 0) return null
          return (
            <button
              key={k.id}
              onClick={() => setFilterKategori(k.id)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                filterKategori === k.id
                  ? "text-white border-transparent"
                  : "border-gray-100 text-gray-600 hover:bg-gray-50"
              }`}
              style={filterKategori === k.id ? { backgroundColor: k.warna, borderColor: k.warna } : {}}
            >
              {k.nama} ({count})
            </button>
          )
        })}
      </div>

      {/* Ringkasan per tipe */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(byTipe).map(([tipe, group]) => (
            <div key={tipe} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
              <p className="text-xs text-gray-500">{group.label}</p>
              <p className="text-sm font-bold text-[#0d1f3c] mt-0.5">{formatRupiah(group.total)}</p>
              <p className="text-xs text-gray-400">{group.items.length} item</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabel utama */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-gray-300" />
            Memuat data...
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">
            {items.length === 0
              ? `Belum ada pengeluaran untuk ${bulanLabel}. Klik "+ Tambah" atau "Generate Tetap" untuk mulai.`
              : "Tidak ada pengeluaran dengan filter ini."}
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 text-xs uppercase">
                    <th className="px-5 py-2.5 text-left font-medium">Tanggal</th>
                    <th className="px-5 py-2.5 text-left font-medium">Kategori</th>
                    <th className="px-5 py-2.5 text-left font-medium">Deskripsi</th>
                    <th className="px-5 py-2.5 text-right font-medium">Nominal</th>
                    <th className="px-5 py-2.5 text-center font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((item) => (
                    <tr key={item.id} className={`hover:bg-gray-50 ${item.is_recurring ? "bg-blue-50/30" : ""}`}>
                      <td className="px-5 py-2.5 text-gray-600 whitespace-nowrap">
                        {new Date(item.tanggal + "T00:00:00").toLocaleDateString("id-ID", {
                          day: "2-digit", month: "short",
                        })}
                        {item.is_recurring && (
                          <span className="ml-1.5 text-xs text-blue-400" title="Pengeluaran tetap">●</span>
                        )}
                      </td>
                      <td className="px-5 py-2.5">
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
                      <td className="px-5 py-2.5 text-gray-600">
                        {item.deskripsi ?? <span className="text-gray-300">—</span>}
                        {item.catatan && (
                          <p className="text-xs text-gray-400 mt-0.5">{item.catatan}</p>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-right font-semibold text-gray-700">
                        {formatRupiah(item.nominal)}
                      </td>
                      <td className="px-5 py-2.5 text-center">
                        {!isAdmin && (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-[#0d1f3c] hover:bg-blue-50 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
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
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#0d1f3c] text-white font-semibold">
                    <td colSpan={3} className="px-5 py-3">
                      Total {filterKategori ? `(${filtered.length} item)` : bulanLabel}
                    </td>
                    <td className="px-5 py-3 text-right">{formatRupiah(totalFiltered)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile */}
            <div className="sm:hidden divide-y divide-gray-100">
              {filtered.map((item) => (
                <div key={item.id} className={`px-4 py-3 ${item.is_recurring ? "bg-blue-50/30" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {item.kategori_pengeluaran && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: item.kategori_pengeluaran.warna + "20",
                              color: item.kategori_pengeluaran.warna,
                            }}
                          >
                            {item.kategori_pengeluaran.nama}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {new Date(item.tanggal + "T00:00:00").toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                        </span>
                      </div>
                      {item.deskripsi && (
                        <p className="text-sm text-gray-700 truncate">{item.deskripsi}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-sm font-semibold text-gray-700">{formatRupiah(item.nominal)}</span>
                      {!isAdmin && (
                        <>
                          <button onClick={() => handleEdit(item)} className="p-1 text-gray-400 hover:text-[#0d1f3c]">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                            className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div className="px-4 py-3 bg-[#0d1f3c] flex justify-between text-white font-semibold">
                <span>Total {bulanLabel}</span>
                <span>{formatRupiah(totalAll)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <ModalPengeluaran
          item={editItem}
          kategoriList={kategoriList}
          defaultBulan={bulan}
          onClose={() => setShowModal(false)}
          onSuccess={onRefresh}
        />
      )}
      <ConfirmDialog />
    </div>
  )
}
