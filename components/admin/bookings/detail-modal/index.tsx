"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CalendarClock, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatRupiah, formatTanggal } from "@/lib/utils"
import TabAddon from "./tab-addon"
import TabRiwayat from "./tab-riwayat"
import TabStaff from "./tab-staff"
import KirimWaModal from "./kirim-wa-modal"
import RescheduleModal from "@/components/admin/bookings/reschedule-modal"

// Tipe data
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
  // Field tambahan yang mungkin ada
  email?: string | null
  bukti_transfer_url?: string | null
  // Multi-staff
  photographer_1_id?: string | null
  photographer_2_id?: string | null
  editor_id?: string | null
  upah_pg1?: number
  upah_pg2?: number
  upah_editor?: number
  total_upah_staff?: number
  pg1?: { id: string; nama: string } | null
  pg2?: { id: string; nama: string } | null
  ed?:  { id: string; nama: string } | null
}

interface DetailModalProps {
  booking: BookingRow | null
  adminName: string
  onClose: () => void
  onStatusChange: () => void
}

// Tab yang tersedia
const TABS = [
  { id: "info_client", label: "Info Client" },
  { id: "info_booking", label: "Info Booking" },
  { id: "pembayaran", label: "Pembayaran" },
  { id: "staff", label: "Staff" },
  { id: "riwayat", label: "Riwayat" },
  { id: "addon", label: "Add-on" },
] as const

type TabId = (typeof TABS)[number]["id"]

// Label status sesi
const STATUS_SESI_OPTIONS = [
  { value: "pending",      label: "Pending" },
  { value: "booked",       label: "Booked" },
  { value: "selesai_foto", label: "Selesai Foto" },
  { value: "selesai_edit", label: "Selesai Edit" },
  { value: "diambil",      label: "Diambil" },
  { value: "cancel",       label: "Cancel" },
]

// Warna badge status sesi
function badgeSesi(status: string) {
  const map: Record<string, string> = {
    pending:      "bg-yellow-100 text-yellow-700",
    booked:       "bg-blue-100 text-blue-700",
    selesai_foto: "bg-purple-100 text-purple-700",
    selesai_edit: "bg-indigo-100 text-indigo-700",
    diambil:      "bg-green-100 text-green-700",
    cancel:       "bg-red-100 text-red-700",
  }
  return map[status] ?? "bg-gray-100 text-gray-700"
}

// Warna badge status pembayaran
function badgeBayar(status: string) {
  const map: Record<string, string> = {
    belum_dp: "bg-red-100 text-red-700",
    dp_ok: "bg-amber-100 text-amber-700",
    lunas: "bg-green-100 text-green-700",
  }
  return map[status] ?? "bg-gray-100 text-gray-700"
}

// Label status pembayaran
function labelBayar(status: string) {
  const map: Record<string, string> = {
    belum_dp: "Belum DP",
    dp_ok: "DP OK",
    lunas: "Lunas",
  }
  return map[status] ?? status
}

// Label status sesi
function labelSesi(status: string) {
  return (
    STATUS_SESI_OPTIONS.find((o) => o.value === status)?.label ?? status
  )
}

export default function DetailModal({
  booking,
  adminName,
  onClose,
  onStatusChange,
}: DetailModalProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId>("info_client")
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [updatingBayar, setUpdatingBayar] = useState(false)
  const [updatingLunas, setUpdatingLunas] = useState(false)
  const [showWaModal, setShowWaModal] = useState(false)
  const [showReschedule, setShowReschedule] = useState(false)
  const [selectedSesi, setSelectedSesi] = useState<string>(
    booking?.status_sesi ?? "pending"
  )
  const [dpForm, setDpForm] = useState({ nominal: 100000, catatan: "" })
  const [lunasForm, setLunasForm] = useState({ metode: "transfer" })

  // Background list — untuk resolve UUID → nama
  const [backgrounds, setBackgrounds] = useState<{ id: string; nama: string }[]>([])
  useEffect(() => {
    fetch("/api/settings/background")
      .then((r) => r.json())
      .then((d) => setBackgrounds(d.items ?? []))
      .catch(() => {})
  }, [])

  const bgMap = useMemo(() => {
    const m = new Map<string, string>()
    backgrounds.forEach((b) => m.set(b.id, b.nama))
    return m
  }, [backgrounds])

  // Local state pembayaran — update langsung setelah API sukses
  const [localBayar, setLocalBayar] = useState(booking?.status_pembayaran ?? "belum_dp")
  const [localSesi, setLocalSesi]   = useState(booking?.status_sesi ?? "pending")
  const [localDpDibayar, setLocalDpDibayar] = useState(booking?.dp_dibayar ?? 0)

  // Sync saat prop booking berubah dari luar (realtime parent)
  const prevIdRef = useRef(booking?.id)
  useEffect(() => {
    if (!booking) return
    // Reset state jika booking berganti
    if (prevIdRef.current !== booking.id) {
      prevIdRef.current = booking.id
      setSelectedSesi(booking.status_sesi)
    }
    setLocalBayar(booking.status_pembayaran)
    setLocalSesi(booking.status_sesi)
    setLocalDpDibayar(booking.dp_dibayar)
  }, [booking?.id, booking?.status_pembayaran, booking?.status_sesi, booking?.dp_dibayar]) // eslint-disable-line react-hooks/exhaustive-deps

  // Jika tidak ada booking, tidak tampilkan modal
  if (!booking) return null

  const sisaBayar = booking.total_tagihan - localDpDibayar

  // Update status sesi
  async function handleUpdateStatusSesi(newStatus: string) {
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/bookings/${booking!.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status_sesi: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Gagal mengupdate status")
        return
      }
      toast.success(`Status diubah ke: ${labelSesi(newStatus)}`)
      setSelectedSesi(newStatus)
      setLocalSesi(newStatus)
      onStatusChange()
      router.refresh()
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Konfirmasi DP
  async function handleKonfirmasiDP() {
    if (dpForm.nominal < 100000) return toast.error("Minimal DP Rp 100.000")
    setUpdatingBayar(true)
    try {
      const res = await fetch(`/api/bookings/${booking!.id}/konfirmasi-dp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nominal: dpForm.nominal, catatan: dpForm.catatan || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Gagal konfirmasi DP")
        return
      }
      const label = data.status_pembayaran === "lunas" ? "Booking LUNAS!" : "DP dikonfirmasi, booking BOOKED"
      toast.success(label)
      setLocalBayar(data.status_pembayaran)
      setLocalDpDibayar(data.status_pembayaran === "lunas" ? booking!.total_tagihan : dpForm.nominal)
      if (data.status_sesi) setLocalSesi(data.status_sesi)
      onStatusChange()
      router.refresh()
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setUpdatingBayar(false)
    }
  }

  // Tandai lunas
  async function handleTandaiLunas() {
    setUpdatingLunas(true)
    try {
      const res = await fetch(`/api/bookings/${booking!.id}/lunas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metode: lunasForm.metode }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Gagal menandai lunas")
        return
      }
      toast.success("Pembayaran lunas! Terima kasih.")
      setLocalBayar("lunas")
      setLocalDpDibayar(booking!.total_tagihan)
      onStatusChange()
      router.refresh()
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setUpdatingLunas(false)
    }
  }

  // Format nomor WA untuk link
  function formatWaLink(no: string) {
    const cleaned = no.replace(/\D/g, "")
    const international = cleaned.startsWith("0")
      ? "62" + cleaned.slice(1)
      : cleaned
    return `https://wa.me/${international}`
  }

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      {/* Modal */}
      <div
        className="relative flex h-full max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ backgroundColor: "#0d1f3c" }}
        >
          <div>
            <p className="text-xs text-white/60">Detail Booking</p>
            <h2 className="text-lg font-bold text-white">
              {booking.kode_booking}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReschedule(true)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition"
              title="Reschedule booking"
            >
              <CalendarClock className="w-3.5 h-3.5" />
              Reschedule
            </button>
            <button
              onClick={() => setShowWaModal(true)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-green-500/20 text-green-300 hover:bg-green-500/30 transition"
              title="Kirim WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Kirim WA
            </button>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-white/70 transition hover:text-white"
              aria-label="Tutup"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab bar — horizontal scroll */}
        <div className="overflow-x-auto border-b bg-gray-50">
          <div className="flex min-w-max gap-1 px-4 py-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-200"
                }`}
                style={
                  activeTab === tab.id
                    ? { backgroundColor: "#0d1f3c" }
                    : {}
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Konten tab */}
        <div className="flex-1 overflow-y-auto">
          {/* ============ TAB 1: Info Client ============ */}
          {activeTab === "info_client" && (
            <div className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoField label="Nama Client" value={booking.nama_client} />
                <InfoField
                  label="No. WhatsApp"
                  value={
                    <a
                      href={formatWaLink(booking.no_wa)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 font-medium text-green-600 hover:underline"
                    >
                      {booking.no_wa}
                      <span className="text-xs">↗</span>
                    </a>
                  }
                />
                {booking.email && (
                  <InfoField label="Email" value={booking.email} />
                )}
                <InfoField
                  label="Jumlah Orang"
                  value={`${booking.jumlah_orang} orang`}
                />
                {booking.catatan && (
                  <div className="sm:col-span-2">
                    <InfoField label="Catatan" value={booking.catatan} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============ TAB 2: Info Booking ============ */}
          {activeTab === "info_booking" && (
            <div className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoField
                  label="Kategori Sesi"
                  value={booking.kategori_sesi}
                />
                <InfoField label="Paket" value={booking.nama_paket} />
                <InfoField
                  label="Tanggal Foto"
                  value={formatTanggal(booking.tgl_foto)}
                />
                <InfoField
                  label="Jam"
                  value={`${booking.jam_mulai} — ${booking.jam_selesai}`}
                />
                <InfoField
                  label="Background Dipilih"
                  value={
                    booking.background_dipilih?.length > 0
                      ? booking.background_dipilih
                          .map((id) => bgMap.get(id) ?? id)
                          .join(", ")
                      : "-"
                  }
                />
                {booking.pg1 && (
                  <InfoField label="PG 1" value={`${booking.pg1.nama}${booking.upah_pg1 ? ` — ${formatRupiah(booking.upah_pg1)}` : ""}`} />
                )}
                {booking.pg2 && (
                  <InfoField label="PG 2" value={`${booking.pg2.nama}${booking.upah_pg2 ? ` — ${formatRupiah(booking.upah_pg2)}` : ""}`} />
                )}
                {booking.ed && (
                  <InfoField label="Editor" value={`${booking.ed.nama}${booking.upah_editor ? ` — ${formatRupiah(booking.upah_editor)}` : ""}`} />
                )}
              </div>
            </div>
          )}

          {/* ============ TAB 3: Pembayaran ============ */}
          {activeTab === "pembayaran" && (
            <div className="space-y-4 p-5">
              {/* Badge status */}
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${badgeSesi(localSesi)}`}>
                  Sesi: {labelSesi(localSesi)}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${badgeBayar(localBayar)}`}>
                  Bayar: {labelBayar(localBayar)}
                </span>
              </div>

              {/* Rincian tagihan */}
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Rincian Tagihan</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal Paket</span>
                    <span>{formatRupiah(booking.subtotal_paket)}</span>
                  </div>
                  {booking.subtotal_addon > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal Add-on</span>
                      <span>{formatRupiah(booking.subtotal_addon)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-gray-800">
                    <span>Total Tagihan</span>
                    <span>{formatRupiah(booking.total_tagihan)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>DP Minimum</span>
                    <span>Rp 100.000</span>
                  </div>
                  {localDpDibayar > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>DP Diterima</span>
                      <span>{formatRupiah(localDpDibayar)}</span>
                    </div>
                  )}
                  {sisaBayar > 0 && localDpDibayar > 0 && (
                    <div className="flex justify-between font-semibold text-red-600">
                      <span>Sisa Bayar</span>
                      <span>{formatRupiah(sisaBayar)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bukti transfer */}
              <div>
                <p className="mb-1 text-xs font-medium text-gray-500">Bukti Transfer</p>
                {booking.bukti_transfer_url ? (
                  <a
                    href={booking.bukti_transfer_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                  >
                    Lihat Bukti Transfer ↗
                  </a>
                ) : (
                  <p className="text-xs text-gray-400 italic">Belum ada bukti transfer diunggah</p>
                )}
              </div>

              {/* ── FORM KONFIRMASI DP (belum_dp) ── */}
              {localBayar === "belum_dp" && (
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 space-y-3">
                  <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Konfirmasi DP</p>

                  {/* Input nominal */}
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Jumlah DP Diterima</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Rp</span>
                      <input
                        type="number"
                        min={100000}
                        step={50000}
                        value={dpForm.nominal}
                        onChange={(e) => setDpForm((f) => ({ ...f, nominal: Number(e.target.value) }))}
                        className="w-40 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                      />
                    </div>
                    {dpForm.nominal < 100000 && (
                      <p className="mt-0.5 text-xs text-red-500">Minimal Rp 100.000</p>
                    )}
                  </div>

                  {/* Quick buttons */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">Pilih cepat:</p>
                    <div className="flex flex-wrap gap-2">
                      {[100000, 150000, 200000, booking.total_tagihan].map((v) => (
                        <button
                          key={v}
                          onClick={() => setDpForm((f) => ({ ...f, nominal: v }))}
                          className={`rounded-lg border px-3 py-1 text-xs font-medium transition ${
                            dpForm.nominal === v
                              ? "border-amber-500 bg-amber-500 text-white"
                              : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
                          }`}
                        >
                          {v === booking.total_tagihan ? "Lunas" : `${(v / 1000).toFixed(0)}rb`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Catatan */}
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Catatan <span className="font-normal text-gray-400">(opsional)</span></p>
                    <input
                      type="text"
                      value={dpForm.catatan}
                      onChange={(e) => setDpForm((f) => ({ ...f, catatan: e.target.value }))}
                      placeholder="Contoh: transfer BCA, konfirmasi via WA..."
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                    />
                  </div>

                  <Button
                    onClick={handleKonfirmasiDP}
                    disabled={updatingBayar || dpForm.nominal < 100000}
                    className="w-full text-white font-semibold"
                    style={{ backgroundColor: "#C9A84C" }}
                  >
                    {updatingBayar
                      ? "Memproses..."
                      : dpForm.nominal >= booking.total_tagihan
                      ? "Konfirmasi — Langsung Lunas"
                      : "Konfirmasi DP"}
                  </Button>
                </div>
              )}

              {/* ── FORM PELUNASAN SISA (dp_ok) ── */}
              {localBayar === "dp_ok" && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-3">
                  <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Pelunasan Sisa</p>
                  <p className="text-sm text-blue-700">
                    Sisa yang harus dibayar: <strong>{formatRupiah(sisaBayar)}</strong>
                  </p>

                  {/* Metode */}
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Metode Pembayaran</p>
                    <div className="flex gap-2">
                      {["cash", "transfer", "qris"].map((m) => (
                        <button
                          key={m}
                          onClick={() => setLunasForm({ metode: m })}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition ${
                            lunasForm.metode === m
                              ? "border-blue-500 bg-blue-500 text-white"
                              : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
                          }`}
                        >
                          {m.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleTandaiLunas}
                    disabled={updatingLunas}
                    className="w-full text-white font-semibold"
                    style={{ backgroundColor: "#0d1f3c" }}
                  >
                    {updatingLunas ? "Memproses..." : `Tandai Lunas via ${lunasForm.metode.toUpperCase()}`}
                  </Button>
                </div>
              )}

              {/* ── SUDAH LUNAS ── */}
              {localBayar === "lunas" && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
                  <p className="text-2xl mb-1">✅</p>
                  <p className="font-semibold text-green-700">Pembayaran Lunas</p>
                  <p className="text-xs text-green-600 mt-0.5">Total {formatRupiah(booking.total_tagihan)} sudah diterima</p>
                </div>
              )}
            </div>
          )}

          {/* ============ TAB 4: Staff ============ */}
          {activeTab === "staff" && (
            <TabStaff
              booking={booking}
              onSuccess={() => {
                onStatusChange()
                router.refresh()
              }}
            />
          )}

          {/* ============ TAB 5: Riwayat ============ */}
          {activeTab === "riwayat" && (
            <div className="space-y-5 p-5">
              {/* Info kode & waktu */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoField
                  label="Kode Booking"
                  value={booking.kode_booking}
                />
                <InfoField
                  label="Dibuat Pada"
                  value={formatTanggal(booking.created_at)}
                />
              </div>

              {/* Status saat ini */}
              <div>
                <p className="mb-2 text-xs font-medium text-gray-500">
                  Status Saat Ini
                </p>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${badgeSesi(localSesi)}`}
                  >
                    Sesi: {labelSesi(localSesi)}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${badgeBayar(localBayar)}`}
                  >
                    Bayar: {labelBayar(localBayar)}
                  </span>
                </div>
              </div>

              {/* Update status sesi */}
              <div>
                <p className="mb-2 text-xs font-medium text-gray-500">
                  Update Status Sesi
                </p>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedSesi}
                    onChange={(e) => setSelectedSesi(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20"
                  >
                    {STATUS_SESI_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={() => handleUpdateStatusSesi(selectedSesi)}
                    disabled={
                      updatingStatus || selectedSesi === localSesi
                    }
                    className="text-white"
                    style={{ backgroundColor: "#0d1f3c" }}
                  >
                    {updatingStatus ? "Menyimpan..." : "Simpan"}
                  </Button>
                </div>
              </div>

              {/* Progress bar status sesi */}
              <div>
                <p className="mb-2 text-xs font-medium text-gray-500">
                  Progress
                </p>
                <div className="flex items-center gap-1">
                  {["booked", "dp_ok", "selesai_foto", "selesai_edit", "diambil"].map(
                    (s, i) => {
                      const statuses = [
                        "booked",
                        "dp_ok",
                        "selesai_foto",
                        "selesai_edit",
                        "diambil",
                      ]
                      const currentIdx = statuses.indexOf(localSesi)
                      const isActive = i <= currentIdx
                      const isCurrent = i === currentIdx
                      return (
                        <div key={s} className="flex flex-1 flex-col items-center gap-1">
                          <div
                            className={`h-2 w-full rounded-full transition-all ${
                              isActive
                                ? isCurrent
                                  ? "bg-[#C9A84C]"
                                  : "bg-[#0d1f3c]"
                                : "bg-gray-200"
                            }`}
                          />
                          <span className="text-center text-[9px] leading-tight text-gray-500">
                            {labelSesi(s)}
                          </span>
                        </div>
                      )
                    }
                  )}
                </div>
              </div>

              {/* Riwayat reschedule */}
              <div className="border-t border-gray-100 pt-4">
                <TabRiwayat
                  bookingId={booking.id}
                  createdAt={booking.created_at}
                  kodeBooking={booking.kode_booking}
                />
              </div>
            </div>
          )}

          {/* ============ TAB 6: Add-on ============ */}
          {activeTab === "addon" && (
            <TabAddon booking={booking} adminName={adminName} />
          )}
        </div>
      </div>

      {/* Modal Kirim WA */}
      {showWaModal && (
        <KirimWaModal
          booking={booking}
          onClose={() => setShowWaModal(false)}
        />
      )}

      {/* Modal Reschedule */}
      {showReschedule && (
        <RescheduleModal
          booking={booking}
          onClose={() => setShowReschedule(false)}
          onSuccess={() => {
            setShowReschedule(false)
            onStatusChange()
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

// Komponen helper untuk field info
function InfoField({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div>
      <p className="mb-0.5 text-xs font-medium text-gray-400">{label}</p>
      <div className="text-sm font-medium text-gray-800">{value ?? "-"}</div>
    </div>
  )
}
