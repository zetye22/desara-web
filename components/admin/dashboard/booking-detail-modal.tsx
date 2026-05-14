"use client"

import { X, Phone, Calendar, Clock, Users, Image, CreditCard, FileImage } from "lucide-react"
import { formatRupiah, formatTanggal } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { BACKGROUNDS } from "@/lib/constants"
import type { BookingRow } from "./types"

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  booked:       { label: "Booked",       cls: "bg-gray-100 text-gray-700" },
  dp_ok:        { label: "DP OK",        cls: "bg-green-100 text-green-700" },
  selesai_foto: { label: "Foto Selesai", cls: "bg-blue-100 text-blue-700" },
  selesai_edit: { label: "Edit Selesai", cls: "bg-purple-100 text-purple-700" },
  diambil:      { label: "Diambil",      cls: "bg-teal-100 text-teal-700" },
  cancel:       { label: "Cancel",       cls: "bg-red-100 text-red-700" },
}

const BAYAR_LABEL: Record<string, { label: string; cls: string }> = {
  belum_dp: { label: "Belum DP",   cls: "bg-orange-100 text-orange-700" },
  dp_ok:    { label: "DP OK",      cls: "bg-green-100 text-green-700" },
  lunas:    { label: "Lunas",      cls: "bg-emerald-100 text-emerald-700" },
}

interface Props {
  booking: BookingRow | null
  onClose: () => void
}

export function BookingDetailModal({ booking, onClose }: Props) {
  if (!booking) return null

  const bgNama = (booking.background_dipilih ?? [])
    .map((id) => BACKGROUNDS.find((b) => b.id === id)?.nama ?? id)
    .join(", ")

  const sStatus = STATUS_LABEL[booking.status_sesi] ?? { label: booking.status_sesi, cls: "bg-gray-100 text-gray-600" }
  const bStatus = BAYAR_LABEL[booking.status_pembayaran] ?? { label: booking.status_pembayaran, cls: "bg-gray-100 text-gray-600" }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div>
            <p className="text-xs text-gray-400">Detail Booking</p>
            <p className="font-bold text-[#0d1f3c] text-base">{booking.kode_booking}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${sStatus.cls}`}>{sStatus.label}</span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${bStatus.cls}`}>{bStatus.label}</span>
          </div>

          {/* Info client */}
          <Section title="Data Client">
            <InfoRow icon={<Users className="w-4 h-4" />} label="Nama" value={booking.nama_client} />
            <InfoRow icon={<Phone className="w-4 h-4" />} label="WhatsApp" value={booking.no_wa} />
            {booking.jumlah_orang > 1 && (
              <InfoRow icon={<Users className="w-4 h-4" />} label="Jumlah Orang" value={`${booking.jumlah_orang} orang`} />
            )}
            {booking.catatan && (
              <InfoRow icon={<FileImage className="w-4 h-4" />} label="Catatan" value={booking.catatan} />
            )}
          </Section>

          {/* Info sesi */}
          <Section title="Detail Sesi">
            <InfoRow icon={<Calendar className="w-4 h-4" />} label="Tanggal" value={formatTanggal(booking.tgl_foto + "T00:00:00")} />
            <InfoRow icon={<Clock className="w-4 h-4" />} label="Jam" value={`${booking.jam_mulai.slice(0,5)} – ${booking.jam_selesai.slice(0,5)} WIB`} />
            <InfoRow icon={<Image className="w-4 h-4" />} label="Paket" value={booking.nama_paket} />
            <InfoRow icon={<Image className="w-4 h-4" />} label="Background" value={bgNama || "—"} />
          </Section>

          {/* Keuangan */}
          <Section title="Pembayaran">
            <InfoRow icon={<CreditCard className="w-4 h-4" />} label="Total Tagihan" value={formatRupiah(booking.total_tagihan)} bold />
            <InfoRow icon={<CreditCard className="w-4 h-4" />} label="DP Dibayar" value={formatRupiah(booking.dp_dibayar)} />
            <InfoRow
              icon={<CreditCard className="w-4 h-4" />}
              label="Sisa Bayar"
              value={formatRupiah(booking.total_tagihan - booking.dp_dibayar)}
              accent={booking.total_tagihan - booking.dp_dibayar > 0}
            />
          </Section>
        </div>

        {/* Footer actions */}
        <div className="px-6 pb-5 flex gap-2">
          <a
            href={`https://wa.me/${booking.no_wa}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button variant="outline" className="w-full rounded-xl h-10 text-sm">
              Hubungi via WA
            </Button>
          </a>
          <Button onClick={onClose} className="flex-1 bg-[#0d1f3c] hover:bg-[#162d56] text-white rounded-xl h-10 text-sm">
            Tutup
          </Button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function InfoRow({
  icon, label, value, bold, accent,
}: { icon: React.ReactNode; label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-gray-300 mt-0.5 shrink-0">{icon}</span>
      <span className="text-xs text-gray-400 w-28 shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm flex-1 ${bold ? "font-semibold text-[#0d1f3c]" : ""} ${accent ? "text-orange-600 font-medium" : "text-gray-700"}`}>
        {value}
      </span>
    </div>
  )
}
