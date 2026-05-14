"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatRupiah, formatTanggal } from "@/lib/utils"
import TambahAddonModal from "./tambah-addon-modal"

// Tipe addon
type AddonJenis =
  | "tambahan_waktu"
  | "tambahan_orang"
  | "tambahan_background"
  | "cetak_12r"
  | "cetak_20r"
  | "lainnya"

interface BookingAddon {
  id: string
  booking_id: string
  jenis: AddonJenis
  nama_item: string
  qty: number
  harga_satuan: number
  subtotal: number
  source: "booking_awal" | "lapangan"
  catatan: string | null
  ditambahkan_oleh: string | null
  created_at: string
}

interface BookingRow {
  id: string
  kode_booking: string
  nama_client: string
  no_wa: string
  paket_id: string
  nama_paket: string
  tgl_foto: string
  jam_mulai: string
  jam_selesai: string
  jumlah_orang: number
  background_dipilih: string[]
  status_sesi: string
  status_pembayaran: string
  total_tagihan: number
  dp_dibayar: number
  subtotal_paket: number
  subtotal_addon: number
  kategori_sesi: string
  catatan: string | null
  created_at: string
}

interface TabAddonProps {
  booking: BookingRow
  adminName: string
}

// State untuk inline edit
interface EditState {
  nama_item: string
  qty: number
  harga_satuan: number
  catatan: string
}

export default function TabAddon({ booking, adminName }: TabAddonProps) {
  const [addons, setAddons] = useState<BookingAddon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTambahModal, setShowTambahModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>({
    nama_item: "",
    qty: 1,
    harga_satuan: 0,
    catatan: "",
  })
  const [editLoading, setEditLoading] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [lunasLoading, setLunasLoading] = useState(false)

  // Ambil addons dari API
  const fetchAddons = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/bookings/${booking.id}/addons`)
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? "Gagal mengambil data addon")
      }
      const data = await res.json()
      setAddons(data.addons ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }, [booking.id])

  useEffect(() => {
    fetchAddons()
  }, [fetchAddons])

  // Pisahkan addon berdasarkan source
  const addonAwal = addons.filter((a) => a.source === "booking_awal")
  const addonLapangan = addons.filter((a) => a.source === "lapangan")

  // Hitung total
  const subtotalAwal = addonAwal.reduce((s, a) => s + a.subtotal, 0)
  const subtotalLapangan = addonLapangan.reduce((s, a) => s + a.subtotal, 0)
  const totalAddon = subtotalAwal + subtotalLapangan

  // Jenis yang sudah ada (untuk saran di modal tambah)
  const existingAddonJenis = addons.map((a) => a.jenis)

  // Mulai edit
  function startEdit(addon: BookingAddon) {
    setEditingId(addon.id)
    setEditState({
      nama_item: addon.nama_item,
      qty: addon.qty,
      harga_satuan: addon.harga_satuan,
      catatan: addon.catatan ?? "",
    })
  }

  // Batal edit
  function cancelEdit() {
    setEditingId(null)
  }

  // Simpan edit
  async function saveEdit(addonId: string) {
    setEditLoading(true)
    try {
      const res = await fetch(`/api/bookings/addons/${addonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_item: editState.nama_item,
          qty: editState.qty,
          harga_satuan: editState.harga_satuan,
          catatan: editState.catatan || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Gagal mengupdate addon")
        return
      }
      toast.success("Addon berhasil diupdate")
      setEditingId(null)
      await fetchAddons()
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setEditLoading(false)
    }
  }

  // Hapus addon
  async function handleDelete(addonId: string) {
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/bookings/addons/${addonId}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Gagal menghapus addon")
        return
      }
      toast.success("Addon berhasil dihapus")
      setDeleteConfirmId(null)
      await fetchAddons()
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setDeleteLoading(false)
    }
  }

  // Tandai lunas
  async function handleTandaiLunas() {
    setLunasLoading(true)
    try {
      const res = await fetch(`/api/bookings/${booking.id}/lunas`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Gagal menandai lunas")
        return
      }
      toast.success("Pembayaran ditandai lunas")
      // Refresh halaman agar booking.dp_dibayar terupdate
      window.location.reload()
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setLunasLoading(false)
    }
  }

  // Hitung sisa bayar
  const sisaBayar = booking.total_tagihan - booking.dp_dibayar
  const adaSisaBayar = sisaBayar > 0

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="mb-3 text-sm text-red-500">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchAddons}>
          Coba Lagi
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5 p-4">
      {/* ===== Saat Booking Awal ===== */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-700">
          Saat Booking Awal
        </h3>
        {addonAwal.length === 0 ? (
          <p className="text-sm text-gray-400 italic">
            Tidak ada add-on saat booking awal
          </p>
        ) : (
          <ul className="space-y-2">
            {addonAwal.map((addon) => (
              <li
                key={addon.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {addon.nama_item}
                  </p>
                  <p className="text-xs text-gray-500">
                    {addon.qty} ×{" "}
                    {formatRupiah(addon.harga_satuan)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-gray-800">
                  {formatRupiah(addon.subtotal)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ===== Tambahan di Lapangan ===== */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">
            Tambahan di Lapangan
          </h3>
          <button
            onClick={() => setShowTambahModal(true)}
            className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-white transition hover:opacity-90"
            style={{ backgroundColor: "#0d1f3c" }}
          >
            + Tambah Add-on
          </button>
        </div>

        {addonLapangan.length === 0 ? (
          <p className="text-sm text-gray-400 italic">
            Belum ada tambahan di lapangan
          </p>
        ) : (
          <ul className="space-y-3">
            {addonLapangan.map((addon) => (
              <li
                key={addon.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                {/* Mode edit inline */}
                {editingId === addon.id ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor={`edit-nama-${addon.id}`}>
                        Nama Item
                      </Label>
                      <Input
                        id={`edit-nama-${addon.id}`}
                        value={editState.nama_item}
                        onChange={(e) =>
                          setEditState((s) => ({
                            ...s,
                            nama_item: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor={`edit-qty-${addon.id}`}>Qty</Label>
                        <Input
                          id={`edit-qty-${addon.id}`}
                          type="number"
                          min={1}
                          value={editState.qty}
                          onChange={(e) =>
                            setEditState((s) => ({
                              ...s,
                              qty: Math.max(1, parseInt(e.target.value) || 1),
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`edit-harga-${addon.id}`}>
                          Harga Satuan
                        </Label>
                        <Input
                          id={`edit-harga-${addon.id}`}
                          type="number"
                          min={0}
                          value={editState.harga_satuan}
                          onChange={(e) =>
                            setEditState((s) => ({
                              ...s,
                              harga_satuan: Math.max(
                                0,
                                parseInt(e.target.value) || 0
                              ),
                            }))
                          }
                        />
                      </div>
                    </div>
                    {/* Subtotal preview */}
                    <p className="text-right text-sm font-medium text-gray-600">
                      Subtotal:{" "}
                      <span className="font-bold" style={{ color: "#0d1f3c" }}>
                        {formatRupiah(editState.qty * editState.harga_satuan)}
                      </span>
                    </p>
                    <div className="space-y-1">
                      <Label htmlFor={`edit-catatan-${addon.id}`}>
                        Catatan (opsional)
                      </Label>
                      <Input
                        id={`edit-catatan-${addon.id}`}
                        value={editState.catatan}
                        onChange={(e) =>
                          setEditState((s) => ({
                            ...s,
                            catatan: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEdit}
                        disabled={editLoading}
                        className="flex-1"
                      >
                        Batal
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 text-white"
                        style={{ backgroundColor: "#0d1f3c" }}
                        onClick={() => saveEdit(addon.id)}
                        disabled={editLoading}
                      >
                        {editLoading ? "Menyimpan..." : "Simpan"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Mode tampil normal
                  <>
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-800">
                          {addon.nama_item}
                        </p>
                        <p className="text-xs text-gray-500">
                          {addon.qty} ×{" "}
                          {formatRupiah(addon.harga_satuan)} ={" "}
                          <span className="font-semibold text-gray-700">
                            {formatRupiah(addon.subtotal)}
                          </span>
                        </p>
                        {addon.catatan && (
                          <p className="mt-1 text-xs text-gray-400 italic">
                            Catatan: {addon.catatan}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-gray-400">
                          Ditambah oleh: {adminName} —{" "}
                          {formatTanggal(addon.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(addon)}
                          className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(addon.id)}
                          className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-500 transition hover:bg-red-50"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>

                    {/* Konfirmasi hapus */}
                    {deleteConfirmId === addon.id && (
                      <div className="mt-2 rounded-lg bg-red-50 p-3">
                        <p className="mb-2 text-sm font-medium text-red-700">
                          Yakin ingin menghapus addon ini?
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeleteConfirmId(null)}
                            disabled={deleteLoading}
                            className="flex-1 text-xs"
                          >
                            Batal
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-red-500 text-xs text-white hover:bg-red-600"
                            onClick={() => handleDelete(addon.id)}
                            disabled={deleteLoading}
                          >
                            {deleteLoading ? "Menghapus..." : "Ya, Hapus"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ===== Ringkasan Total ===== */}
      <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">
          Ringkasan Add-on
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal Awal</span>
            <span>{formatRupiah(subtotalAwal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Subtotal Lapangan</span>
            <span>{formatRupiah(subtotalLapangan)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-gray-800">
            <span>Total Add-on</span>
            <span>{formatRupiah(totalAddon)}</span>
          </div>
        </div>
      </section>

      {/* ===== Quick action sisa pembayaran ===== */}
      {adaSisaBayar && booking.status_pembayaran !== "lunas" && (
        <section
          className="rounded-xl border p-4"
          style={{
            borderColor: "#C9A84C",
            backgroundColor: "#FFFBF0",
          }}
        >
          <p className="mb-3 text-sm font-medium" style={{ color: "#7A5C00" }}>
            Sisa pembayaran:{" "}
            <span className="font-bold">{formatRupiah(sisaBayar)}</span> —
            apakah sudah lunas?
          </p>
          <Button
            size="sm"
            className="text-white"
            style={{ backgroundColor: "#C9A84C" }}
            onClick={handleTandaiLunas}
            disabled={lunasLoading}
          >
            {lunasLoading ? "Memproses..." : "Tandai Sudah Lunas"}
          </Button>
        </section>
      )}

      {/* ===== Modal Tambah Addon ===== */}
      {showTambahModal && (
        <TambahAddonModal
          bookingId={booking.id}
          kategoriSesi={booking.kategori_sesi}
          namaPaket={booking.nama_paket}
          existingAddonJenis={existingAddonJenis}
          onSuccess={fetchAddons}
          onClose={() => setShowTambahModal(false)}
        />
      )}
    </div>
  )
}
