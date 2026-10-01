"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Search,
  MessageCircle,
  CalendarCheck,
  Ban,
  Clock,
  CheckCircle2,
  Eye,
  Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatRupiah, formatTanggal, parseKampusFromCatatan } from "@/lib/utils"
import { SetJadwalModal } from "./set-jadwal-modal"
import { EditModal } from "./edit-modal"
import type { WaitingListRow } from "./types"

interface WaitingListClientProps {
  initialItems: WaitingListRow[]
}

export function WaitingListClient({ initialItems }: WaitingListClientProps) {
  const router = useRouter()
  const [items, setItems] = useState<WaitingListRow[]>(initialItems)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<"semua" | "menunggu" | "dijadwalkan" | "batal">("menunggu")
  const [selectedItem, setSelectedItem] = useState<WaitingListRow | null>(null)
  const [editingItem, setEditingItem] = useState<WaitingListRow | null>(null)

  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  // Filter pencarian & status
  const filtered = items.filter((item) => {
    const cocokStatus =
      filterStatus === "semua" ? true : item.status === filterStatus

    const q = search.toLowerCase()
    const { kampus } = parseKampusFromCatatan(item.catatan)
    const cocokQuery =
      !q ||
      item.nama_client.toLowerCase().includes(q) ||
      item.no_wa.includes(q) ||
      item.nama_paket.toLowerCase().includes(q) ||
      (item.preferensi_jadwal && item.preferensi_jadwal.toLowerCase().includes(q)) ||
      (kampus && kampus.toLowerCase().includes(q))

    return cocokStatus && cocokQuery
  })

  // Format WA Link — Template konfirmasi penerimaan data waiting list
  const getWaLink = (item: WaitingListRow) => {
    const digits = item.no_wa.replace(/\D/g, "")
    const num = digits.startsWith("0") ? "62" + digits.slice(1) : digits

    const dpMinimum = 100000
    const baris = [
      `Halo Kak *${item.nama_client}* 👋`,
      ``,
      `Kami dari *Desara Home Studio* ingin mengonfirmasi bahwa data pendaftaran Waiting List Anda sudah kami terima ✅`,
      ``,
      `📋 *Ringkasan Antrean:*`,
      `• Paket : ${item.nama_paket}`,
      `• Jumlah peserta : ${item.jumlah_orang} orang`,
      item.preferensi_jadwal ? `• Preferensi hari : ${item.preferensi_jadwal}` : null,
      item.jam_diinginkan ? `• Jam yang diinginkan : ${item.jam_diinginkan} WIB` : null,
      `• Estimasi total : Rp ${item.total_tagihan.toLocaleString("id-ID")}`,
      `• DP wajib : Rp ${dpMinimum.toLocaleString("id-ID")}`,
      ``,
      `📌 *Langkah Selanjutnya:*`,
      `Kami akan segera menghubungi Kakak untuk mencocokkan jadwal sesi foto yang tersedia. Setelah jadwal disepakati, Kakak diminta melakukan pembayaran DP untuk mengunci slot booking.`,
      ``,
      `Terima kasih sudah mendaftar, Kak! Sampai ketemu di sesi fotonya 📸`,
      ``,
      `— Tim Desara Home Studio`,
    ].filter((b) => b !== null).join("\n")

    return `https://wa.me/${num}?text=${encodeURIComponent(baris)}`
  }

  // Aksi batalkan antrean
  const handleBatal = async (id: string) => {
    if (!confirm("Yakin ingin membatalkan antrean waiting list ini?")) return
    try {
      const res = await fetch(`/api/waiting-list/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "batal" }),
      })
      if (!res.ok) throw new Error()
      setItems((prev) => prev.map((it) => it.id === id ? { ...it, status: "batal" } : it))
      toast.success("Antrean dibatalkan")
      router.refresh()
    } catch {
      toast.error("Gagal membatalkan antrean")
    }
  }

  return (
    <div className="space-y-6">
      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Cari nama, no WhatsApp, atau paket..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-xl bg-gray-50 border-gray-200"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(["menunggu", "dijadwalkan", "batal", "semua"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl capitalize transition-colors whitespace-nowrap ${
                filterStatus === st
                  ? "bg-[#0d1f3c] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Tabel Waiting List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0d1f3c]/5 text-[#0d1f3c] text-xs uppercase tracking-wider font-semibold border-b border-gray-100">
              <tr>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Paket & Biaya</th>
                <th className="py-3.5 px-4">Preferensi Jadwal</th>
                <th className="py-3.5 px-4">Tgl Daftar</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    Tidak ada antrean waiting list dalam kategori ini
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Client */}
                      <td className="py-3.5 px-4">
                        {(() => {
                          const { kampus, catatanBersih } = parseKampusFromCatatan(item.catatan)
                          return (
                            <>
                              <p className="font-bold text-gray-900">{item.nama_client}</p>
                              <p className="text-xs text-gray-500 font-mono mt-0.5">{item.no_wa}</p>
                              {kampus && (
                                <p className="text-xs text-indigo-700 bg-indigo-50 font-medium rounded px-1.5 py-0.5 mt-1 inline-flex items-center gap-1 border border-indigo-100">
                                  🎓 {kampus}
                                </p>
                              )}
                              {catatanBersih && (
                                <p className="text-xs text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 mt-1 block">
                                  Catatan: {catatanBersih}
                                </p>
                              )}
                            </>
                          )
                        })()}
                      </td>

                      {/* Paket & Biaya */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[#0d1f3c]">{item.nama_paket}</span>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {formatRupiah(item.total_tagihan)} ({item.jumlah_orang} org)
                        </div>
                        {item.background_dipilih.length > 0 && (
                          <div className="text-[11px] text-gray-400 mt-0.5">
                            BG: {item.background_dipilih.join(", ")}
                          </div>
                        )}
                      </td>

                      {/* Preferensi Jadwal */}
                      <td className="py-3.5 px-4">
                        {item.preferensi_jadwal ? (
                          <span className="inline-block bg-blue-50 text-blue-800 text-xs px-2.5 py-1 rounded-lg font-medium border border-blue-100">
                            {item.preferensi_jadwal}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Belum ada estimasi</span>
                        )}
                        {item.jam_diinginkan && (
                          <span className="mt-1 flex items-center gap-1 text-xs text-purple-700 bg-purple-50 border border-purple-100 rounded-lg px-2 py-0.5 w-fit">
                            🕐 {item.jam_diinginkan} WIB
                          </span>
                        )}
                      </td>

                      {/* Tgl Daftar */}
                      <td className="py-3.5 px-4 text-xs text-gray-600">
                        {formatTanggal(item.created_at)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {item.status === "menunggu" && (
                          <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 font-semibold px-2.5 py-1 rounded-full border border-amber-200">
                            <Clock className="w-3 h-3" /> Menunggu
                          </span>
                        )}
                        {item.status === "dijadwalkan" && (
                          <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Dijadwalkan
                          </span>
                        )}
                        {item.status === "batal" && (
                          <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-600 font-semibold px-2.5 py-1 rounded-full border border-red-200">
                            <Ban className="w-3 h-3" /> Batal
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Chat WhatsApp — Kirim Konfirmasi Penerimaan Data */}
                          <a
                            href={getWaLink(item)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Kirim konfirmasi WA ke client bahwa data waiting list sudah diterima"
                            className="p-2 rounded-xl border border-gray-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>

                          {/* Edit Data Client */}
                          <button
                            onClick={() => setEditingItem(item)}
                            title="Edit Data Client"
                            className="p-2 rounded-xl border border-gray-200 text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Tombol Set Jadwal (Hanya jika masih status menunggu) */}
                          {item.status === "menunggu" ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => setSelectedItem(item)}
                                className="bg-[#C9A84C] hover:bg-[#b8963d] text-white text-xs h-8 rounded-xl font-semibold gap-1"
                              >
                                <CalendarCheck className="w-3.5 h-3.5" />
                                Set Jadwal
                              </Button>
                              <button
                                onClick={() => handleBatal(item.id)}
                                title="Batalkan Antrean"
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            item.booking_id && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(`/admin/bookings`)}
                                className="text-xs h-8 rounded-xl gap-1 text-blue-700 border-blue-200 bg-blue-50/50 hover:bg-blue-100/50"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Ke Booking
                              </Button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Set Jadwal & Konversi */}
      <SetJadwalModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onSuccess={() => {
          router.refresh()
        }}
      />

      {/* Modal Edit Data Waiting List */}
      <EditModal
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSuccess={(updated) => {
          setItems((prev) =>
            prev.map((it) => (it.id === editingItem?.id ? { ...it, ...updated } : it))
          )
          router.refresh()
        }}
      />
    </div>
  )
}
