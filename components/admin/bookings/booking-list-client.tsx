"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { formatRupiah, formatTanggal } from "@/lib/utils"
import DetailModal from "./detail-modal"
import { createClient } from "@/lib/supabase/client"

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
  ed?: { id: string; nama: string } | null
}

interface BookingListClientProps {
  initialBookings: BookingRow[]
  addonLapanganIds: Set<string>
  adminName: string
}

// Warna badge status sesi
function badgeSesiClass(status: string) {
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
function badgeBayarClass(status: string) {
  const map: Record<string, string> = {
    belum_dp: "bg-red-100 text-red-700",
    dp_ok:    "bg-amber-100 text-amber-700",
    lunas:    "bg-green-100 text-green-700",
  }
  return map[status] ?? "bg-gray-100 text-gray-700"
}

// Label status sesi
function labelSesi(status: string) {
  const map: Record<string, string> = {
    pending:      "Pending",
    booked:       "Booked",
    selesai_foto: "Selesai Foto",
    selesai_edit: "Selesai Edit",
    diambil:      "Diambil",
    cancel:       "Cancel",
  }
  return map[status] ?? status
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

export default function BookingListClient({
  initialBookings,
  addonLapanganIds: initialAddonIds,
  adminName,
}: BookingListClientProps) {
  const router = useRouter()

  const [bookings, setBookings]         = useState<BookingRow[]>(initialBookings)
  const [addonLapanganIds, setAddonIds] = useState<Set<string>>(initialAddonIds)
  const selectedBookingRef              = useRef<BookingRow | null>(null)

  // Sync dari server props (setelah router.refresh())
  useEffect(() => { setBookings(initialBookings) }, [initialBookings])
  useEffect(() => { setAddonIds(initialAddonIds) }, [initialAddonIds])

  // ── Realtime subscription ──────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel("admin-bookings-realtime")

      // ── Booking UPDATE ──
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "bookings" }, (payload) => {
        const u = payload.new as Partial<BookingRow> & { id: string }
        setBookings((prev) => prev.map((b) => b.id === u.id ? { ...b, ...u } : b))
        setSelectedBooking((sel) => sel?.id === u.id ? { ...sel, ...u } : sel)
      })

      // ── Booking INSERT ──
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "bookings" }, async (payload) => {
        const newRow = payload.new as { id: string }
        try {
          const res  = await fetch(`/api/bookings/${newRow.id}`)
          const data = await res.json()
          if (res.ok && data.booking) {
            setBookings((prev) => [data.booking, ...prev])
            toast.success(
              `📸 Booking baru masuk: ${data.booking.nama_client} — ${data.booking.kode_booking}`,
              { duration: 7000 }
            )
          } else {
            router.refresh()
          }
        } catch {
          router.refresh()
        }
      })

      // ── Booking DELETE ──
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "bookings" }, (payload) => {
        const del = payload.old as { id?: string; kode_booking?: string }
        if (!del.id) return
        setBookings((prev) => prev.filter((b) => b.id !== del.id))
        setSelectedBooking((sel) => sel?.id === del.id ? null : sel)
        toast.info(`Booking ${del.kode_booking ?? ""} dihapus`)
      })

      // ── Addon lapangan INSERT/DELETE ──
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "booking_addons" }, (payload) => {
        const row = payload.new as { booking_id?: string; source?: string }
        if (row.source === "lapangan" && row.booking_id) {
          setAddonIds((prev) => new Set([...Array.from(prev), row.booking_id!]))
        }
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "booking_addons" }, (payload) => {
        const row = payload.old as { booking_id?: string; source?: string }
        if (row.source === "lapangan" && row.booking_id) {
          setAddonIds((prev) => {
            const next = new Set(Array.from(prev))
            // Hanya hapus flag jika tidak ada addon lapangan lain
            next.delete(row.booking_id!)
            return next
          })
        }
      })

      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [router])

  // State filter
  const [search, setSearch]         = useState("")
  const [dateFrom, setDateFrom]     = useState("")
  const [dateTo, setDateTo]         = useState("")
  const [filterSesi, setFilterSesi] = useState("")
  const [filterBayar, setFilterBayar] = useState("")
  const [filterAddon, setFilterAddon] = useState("")

  // State modal
  const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(null)

  // Sync ref agar closure realtime bisa akses nilai terkini
  useEffect(() => { selectedBookingRef.current = selectedBooking }, [selectedBooking])

  // Filter data client-side
  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      // Filter pencarian: nama atau kode
      if (search.trim()) {
        const q = search.toLowerCase()
        const match =
          b.nama_client.toLowerCase().includes(q) ||
          b.kode_booking.toLowerCase().includes(q)
        if (!match) return false
      }

      // Filter tanggal dari
      if (dateFrom && b.tgl_foto < dateFrom) return false

      // Filter tanggal sampai
      if (dateTo && b.tgl_foto > dateTo) return false

      // Filter status sesi
      if (filterSesi && b.status_sesi !== filterSesi) return false

      // Filter status pembayaran
      if (filterBayar && b.status_pembayaran !== filterBayar) return false

      // Filter add-on
      if (filterAddon === "ada_lapangan" && !addonLapanganIds.has(b.id)) return false
      if (filterAddon === "hanya_awal" && (b.subtotal_addon === 0 || addonLapanganIds.has(b.id))) return false
      if (filterAddon === "tanpa_addon" && b.subtotal_addon > 0) return false

      return true
    })
  }, [bookings, search, dateFrom, dateTo, filterSesi, filterBayar, filterAddon, addonLapanganIds])

  function handleModalClose() { setSelectedBooking(null) }
  function handleStatusChange() { router.refresh() }

  // Hitung per-status untuk quick filter
  const countPending  = bookings.filter((b) => b.status_sesi === "pending").length
  const countBooked   = bookings.filter((b) => b.status_sesi === "booked").length
  const countHariIni  = bookings.filter((b) => {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })
    return b.tgl_foto === today && b.status_sesi !== "cancel"
  }).length

  return (
    <div className="space-y-4">
      {/* ===== Header: Quick Filter + Live Indicator ===== */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-wrap gap-2">
        {[
          { label: "Semua", value: "", count: bookings.filter(b => b.status_sesi !== "cancel").length },
          { label: "Pending", value: "pending", count: countPending, urgent: countPending > 0 },
          { label: "Booked", value: "booked", count: countBooked },
          { label: "Foto Hari Ini", value: "_hari_ini", count: countHariIni },
        ].map(({ label, value, count, urgent }) => {
          const isActive = filterSesi === value || (value === "_hari_ini" && filterSesi === "_hari_ini")
          return (
            <button
              key={value}
              onClick={() => {
                if (value === "_hari_ini") {
                  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })
                  setFilterSesi("")
                  setDateFrom(today)
                  setDateTo(today)
                } else {
                  setFilterSesi(value)
                  if (filterSesi === "_hari_ini") { setDateFrom(""); setDateTo("") }
                }
              }}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
                isActive
                  ? "border-[#0d1f3c] bg-[#0d1f3c] text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
              }`}
            >
              {label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                isActive ? "bg-white/20 text-white" : urgent ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"
              }`}>
                {count}
              </span>
              {urgent && !isActive && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
            </button>
          )
        })}
        </div>

      </div>

      {/* ===== Filter Bar ===== */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {/* Pencarian */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Input
              placeholder="Cari nama / kode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Tanggal dari */}
          <div>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20"
              title="Tanggal dari"
            />
          </div>

          {/* Tanggal sampai */}
          <div>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20"
              title="Tanggal sampai"
            />
          </div>

          {/* Filter status sesi */}
          <div>
            <select
              value={filterSesi}
              onChange={(e) => setFilterSesi(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20"
            >
              <option value="">Semua Status Sesi</option>
              <option value="pending">Pending</option>
              <option value="booked">Booked</option>
              <option value="selesai_foto">Selesai Foto</option>
              <option value="selesai_edit">Selesai Edit</option>
              <option value="diambil">Diambil</option>
              <option value="cancel">Cancel</option>
            </select>
          </div>

          {/* Filter status bayar */}
          <div>
            <select
              value={filterBayar}
              onChange={(e) => setFilterBayar(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20"
            >
              <option value="">Semua Status Bayar</option>
              <option value="belum_dp">Belum DP</option>
              <option value="dp_ok">DP OK</option>
              <option value="lunas">Lunas</option>
            </select>
          </div>

          {/* Filter add-on */}
          <div>
            <select
              value={filterAddon}
              onChange={(e) => setFilterAddon(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20"
            >
              <option value="">Semua Add-on</option>
              <option value="ada_lapangan">Ada Add-on Lapangan</option>
              <option value="hanya_awal">Hanya Add-on Booking Awal</option>
              <option value="tanpa_addon">Tanpa Add-on</option>
            </select>
          </div>
        </div>

        {/* Jumlah hasil */}
        <p className="mt-2 text-xs text-gray-400">
          Menampilkan {filtered.length} dari {bookings.length} booking
        </p>
      </div>

      {/* ===== Tabel Desktop ===== */}
      <div className="hidden overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Kode
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Nama Client
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Tanggal
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Jam
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Paket
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Status Sesi
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Status Bayar
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-sm text-gray-400 italic"
                  >
                    Tidak ada booking yang sesuai filter
                  </td>
                </tr>
              ) : (
                filtered.map((booking) => (
                  <tr
                    key={booking.id}
                    onClick={() => setSelectedBooking(booking)}
                    className="cursor-pointer border-b border-gray-50 transition hover:bg-gray-50 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-medium text-gray-700">
                        {booking.kode_booking}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">
                          {booking.nama_client}
                        </span>
                        {addonLapanganIds.has(booking.id) && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                            +addon
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatTanggal(booking.tgl_foto)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {booking.jam_mulai}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {booking.nama_paket}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeSesiClass(booking.status_sesi)}`}
                      >
                        {labelSesi(booking.status_sesi)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeBayarClass(booking.status_pembayaran)}`}
                      >
                        {labelBayar(booking.status_pembayaran)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800">
                      {formatRupiah(booking.total_tagihan)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== Card List Mobile ===== */}
      <div className="space-y-3 lg:hidden">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-400 italic shadow-sm">
            Tidak ada booking yang sesuai filter
          </div>
        ) : (
          filtered.map((booking) => (
            <div
              key={booking.id}
              onClick={() => setSelectedBooking(booking)}
              className="cursor-pointer rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              {/* Header card */}
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800">
                      {booking.nama_client}
                    </p>
                    {addonLapanganIds.has(booking.id) && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                        +addon
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-gray-400">
                    {booking.kode_booking}
                  </p>
                </div>
                <span className="text-sm font-bold" style={{ color: "#0d1f3c" }}>
                  {formatRupiah(booking.total_tagihan)}
                </span>
              </div>

              {/* Info */}
              <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>
                  <span className="font-medium">Tanggal: </span>
                  {formatTanggal(booking.tgl_foto)}
                </div>
                <div>
                  <span className="font-medium">Jam: </span>
                  {booking.jam_mulai}
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Paket: </span>
                  {booking.nama_paket}
                </div>
              </div>

              {/* Badge status */}
              <div className="flex gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeSesiClass(booking.status_sesi)}`}
                >
                  {labelSesi(booking.status_sesi)}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeBayarClass(booking.status_pembayaran)}`}
                >
                  {labelBayar(booking.status_pembayaran)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ===== Detail Modal ===== */}
      {selectedBooking && (
        <DetailModal
          booking={selectedBooking}
          adminName={adminName}
          onClose={handleModalClose}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}
