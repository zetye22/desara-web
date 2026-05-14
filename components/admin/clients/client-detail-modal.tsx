"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Phone, Mail, Tag, BookOpen, BarChart2, MessageSquare, AlertTriangle, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { formatRupiah } from "@/lib/utils"
import type { Client, ClientBooking } from "./types"
import { getClientBadges, AVAILABLE_TAGS } from "./types"

interface ClientDetailModalProps {
  client: Client
  onClose: () => void
  onUpdated: (c: Client) => void
  onDeleted: (id: string) => void
}

type Tab = "info" | "riwayat" | "stats" | "catatan"

const STATUS_LABEL: Record<string, string> = {
  booked: "Booked",
  dp_ok: "DP OK",
  selesai_foto: "Selesai Foto",
  selesai_edit: "Selesai Edit",
  diambil: "Diambil",
  cancel: "Cancel",
}

const STATUS_COLOR: Record<string, string> = {
  booked: "bg-blue-100 text-blue-700",
  dp_ok: "bg-yellow-100 text-yellow-700",
  selesai_foto: "bg-purple-100 text-purple-700",
  selesai_edit: "bg-indigo-100 text-indigo-700",
  diambil: "bg-green-100 text-green-700",
  cancel: "bg-red-100 text-red-700",
}

interface FreshStats {
  total_booking: number
  total_spending: number
  last_booking_date: string | null
}

export function ClientDetailModal({ client, onClose, onUpdated, onDeleted }: ClientDetailModalProps) {
  const [tab, setTab] = useState<Tab>("info")
  const [bookings, setBookings] = useState<ClientBooking[]>([])
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [freshStats, setFreshStats] = useState<FreshStats | null>(null)
  const [bookingsLoaded, setBookingsLoaded] = useState(false)

  // Edit states
  const [editTags, setEditTags] = useState<string[]>(client.tags ?? [])
  const [editCatatan, setEditCatatan] = useState(client.catatan ?? "")
  const [editBlacklist, setEditBlacklist] = useState(client.is_blacklist)
  const [editAlasan, setEditAlasan] = useState(client.alasan_blacklist ?? "")
  const [saving, setSaving] = useState(false)

  // Konfirmasi hapus
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteMode, setDeleteMode] = useState<"anonymize" | "hard">("anonymize")

  const loadBookings = useCallback(async () => {
    if (bookingsLoaded) return
    setLoadingBookings(true)
    try {
      const res = await fetch(`/api/clients/${client.id}/bookings`)
      const data = await res.json()
      if (res.ok) {
        setBookings(data.bookings ?? [])
        if (data.stats) setFreshStats(data.stats)
        setBookingsLoaded(true)
      }
    } finally {
      setLoadingBookings(false)
    }
  }, [client.id, bookingsLoaded])

  useEffect(() => {
    if (tab === "riwayat" || tab === "stats") loadBookings()
  }, [tab, loadBookings])

  function toggleTag(tag: string) {
    setEditTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tags: editTags,
          catatan: editCatatan || null,
          is_blacklist: editBlacklist,
          alasan_blacklist: editAlasan || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Gagal menyimpan"); return }
      toast.success("Data client berhasil diupdate")
      onUpdated(data.client)
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/clients/${client.id}?mode=${deleteMode}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Gagal hapus"); return }
      if (deleteMode === "anonymize") {
        toast.success("Data client dianonimkan")
        onClose()
      } else {
        toast.success("Client dan semua booking terkait dihapus")
        onDeleted(client.id)
      }
    } catch {
      toast.error("Terjadi kesalahan")
    }
  }

  const badges = getClientBadges(client)
  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "info", label: "Info", icon: <Phone className="w-3.5 h-3.5" /> },
    { key: "riwayat", label: "Riwayat", icon: <BookOpen className="w-3.5 h-3.5" /> },
    { key: "stats", label: "Statistik", icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { key: "catatan", label: "Catatan & Tag", icon: <MessageSquare className="w-3.5 h-3.5" /> },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="w-12 h-12 rounded-full bg-[#0d1f3c] flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
            {client.nama.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-[#0d1f3c] text-lg leading-tight">{client.nama}</h2>
            <p className="text-sm text-gray-500">{client.no_wa}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {badges.map((b) => (
                <span key={b.label} className={`text-xs px-2 py-0.5 rounded-full ${b.color}`}>{b.label}</span>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-5 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                ${tab === t.key
                  ? "border-[#0d1f3c] text-[#0d1f3c]"
                  : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === "info" && (
            <div className="space-y-3">
              <InfoRow label="No WA" value={client.no_wa} />
              <InfoRow label="Email" value={client.email ?? "—"} />
              <InfoRow label="Bergabung" value={new Date(client.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} />
              <InfoRow label="Terakhir Booking" value={client.last_booking_date
                ? new Date(client.last_booking_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                : "—"} />

              <div className="flex gap-3 pt-2">
                <a
                  href={`https://wa.me/${client.no_wa.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 py-2 text-sm text-green-700 hover:bg-green-100 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Chat WA
                </a>
                {client.email && (
                  <a
                    href={`mailto:${client.email}`}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 py-2 text-sm text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </a>
                )}
              </div>

              {/* Hapus data */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-2">Kelola Data</p>
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Hapus / Anonimkan data client ini
                  </button>
                ) : (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 space-y-2">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="w-4 h-4" />
                      <p className="text-xs font-medium">Pilih metode penghapusan</p>
                    </div>

                    {/* Warning jumlah booking terdampak */}
                    {client.total_booking > 0 && (
                      <div className="rounded-md bg-red-100 border border-red-300 px-2.5 py-2 text-xs text-red-800">
                        <strong>Perhatian:</strong> Client ini memiliki{" "}
                        <strong>{client.total_booking} riwayat booking</strong>.{" "}
                        {deleteMode === "hard"
                          ? "Semua booking akan ikut terhapus permanen."
                          : "Data nama & nomor WA di semua booking akan dianonimkan."}
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input type="radio" name="deleteMode" value="anonymize" checked={deleteMode === "anonymize"}
                          onChange={() => setDeleteMode("anonymize")} className="mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-gray-700">Anonimkan (Disarankan)</p>
                          <p className="text-xs text-gray-500">Hapus nama & WA dari client dan semua bookingnya, statistik tetap tersimpan</p>
                        </div>
                      </label>
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input type="radio" name="deleteMode" value="hard" checked={deleteMode === "hard"}
                          onChange={() => setDeleteMode("hard")} className="mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-gray-700">Hapus Permanen</p>
                          <p className="text-xs text-gray-500">Hapus client dan semua booking terkait secara permanen dari database</p>
                        </div>
                      </label>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 text-xs py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                        Batal
                      </button>
                      <button onClick={handleDelete} className="flex-1 text-xs py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700">
                        Konfirmasi Hapus
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "riwayat" && (
            <div>
              {loadingBookings ? (
                <div className="py-8 text-center text-gray-400 text-sm">Memuat riwayat...</div>
              ) : bookings.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm">Belum ada riwayat booking</div>
              ) : (
                <div className="space-y-2">
                  {bookings.map((b) => (
                    <div key={b.id} className="rounded-lg border border-gray-100 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <p className="text-sm font-medium text-[#0d1f3c]">{b.nama_paket}</p>
                          <p className="text-xs text-gray-400">{b.kode_booking}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[b.status_sesi] ?? "bg-gray-100 text-gray-600"}`}>
                          {STATUS_LABEL[b.status_sesi] ?? b.status_sesi}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(b.tgl_foto + "T00:00:00").toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      <p className="text-xs text-[#C9A84C] font-medium mt-1">{formatRupiah(b.total_tagihan)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "stats" && (
            <div className="space-y-3">
              {loadingBookings ? (
                <div className="py-8 text-center text-gray-400 text-sm">Menghitung statistik...</div>
              ) : (() => {
                const totalBooking  = freshStats?.total_booking  ?? client.total_booking
                const totalSpending = freshStats?.total_spending ?? client.total_spending
                const lastDate      = freshStats?.last_booking_date ?? client.last_booking_date
                return (
                  <>
                    <StatCard label="Total Booking" value={`${totalBooking}x`} />
                    <StatCard label="Total Spending" value={formatRupiah(totalSpending)} highlight />
                    <StatCard
                      label="Rata-rata per Booking"
                      value={totalBooking > 0
                        ? formatRupiah(Math.round(totalSpending / totalBooking))
                        : "—"}
                    />
                    <StatCard
                      label="Terakhir Booking"
                      value={lastDate
                        ? new Date(lastDate + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                        : "Belum pernah"}
                    />
                    <StatCard
                      label="Bergabung Sejak"
                      value={new Date(client.created_at).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
                    />
                  </>
                )
              })()}
            </div>
          )}

          {tab === "catatan" && (
            <div className="space-y-4">
              {/* Tags */}
              <div>
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-2">
                  <Tag className="w-3.5 h-3.5" />
                  Tag Client
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors
                        ${editTags.includes(tag)
                          ? "bg-[#0d1f3c] text-white border-[#0d1f3c]"
                          : "bg-white text-gray-600 border-gray-200 hover:border-[#0d1f3c]/40"}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Catatan */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Catatan Internal</label>
                <textarea
                  value={editCatatan}
                  onChange={(e) => setEditCatatan(e.target.value)}
                  rows={3}
                  placeholder="Catatan khusus untuk client ini (tidak terlihat client)..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20 resize-none"
                />
              </div>

              {/* Blacklist */}
              <div className={`rounded-lg border p-3 space-y-2 ${editBlacklist ? "border-red-200 bg-red-50" : "border-gray-200"}`}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editBlacklist}
                    onChange={(e) => setEditBlacklist(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    Masukkan ke Blacklist
                  </span>
                </label>
                {editBlacklist && (
                  <textarea
                    value={editAlasan}
                    onChange={(e) => setEditAlasan(e.target.value)}
                    rows={2}
                    placeholder="Alasan blacklist (wajib)..."
                    className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none bg-white"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {tab === "catatan" && (
          <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Tutup</Button>
            <Button className="flex-1 bg-[#0d1f3c] hover:bg-[#1a3561]" onClick={handleSave} disabled={saving}>
              {saving ? "Menyimpan..." : (
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  Simpan
                </span>
              )}
            </Button>
          </div>
        )}
        {tab !== "catatan" && (
          <div className="px-5 py-3 border-t border-gray-100">
            <Button variant="outline" className="w-full" onClick={onClose}>Tutup</Button>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-sm font-medium text-[#0d1f3c] text-right max-w-[60%] break-all">{value}</p>
    </div>
  )
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-3">
      <p className="text-sm text-gray-600">{label}</p>
      <p className={`text-base font-bold ${highlight ? "text-[#C9A84C]" : "text-[#0d1f3c]"}`}>{value}</p>
    </div>
  )
}
