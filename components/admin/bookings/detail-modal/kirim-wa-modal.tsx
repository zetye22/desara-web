"use client"

import { useState } from "react"
import { toast } from "sonner"
import { MessageCircle, Send, ExternalLink, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  ALL_TEMPLATES,
  TEMPLATE_LABELS,
  generatePesan,
  getJumlahFoto,
  formatSisa,
  type JenisTemplate,
} from "@/lib/wa-templates"
import { formatTanggal } from "@/lib/utils"

interface BookingForWA {
  id: string
  nama_client: string
  no_wa: string
  tgl_foto: string
  jam_mulai: string
  nama_paket: string
  total_tagihan: number
  dp_dibayar: number
}

interface KirimWaModalProps {
  booking: BookingForWA
  onClose: () => void
}

function formatNomor(no: string): string {
  const digits = no.replace(/\D/g, "")
  if (digits.startsWith("0")) return "62" + digits.slice(1)
  if (digits.startsWith("62")) return digits
  return "62" + digits
}

export default function KirimWaModal({ booking, onClose }: KirimWaModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<JenisTemplate | "custom">(
    "konfirmasi_dp_diterima"
  )
  const [pesanCustom, setPesanCustom] = useState("")
  const [sending, setSending] = useState(false)

  // Generate preview pesan
  const templateData = {
    nama: booking.nama_client.split(" ")[0],
    tanggal_lengkap: formatTanggal(booking.tgl_foto),
    jam: booking.jam_mulai,
    paket: booking.nama_paket,
    sisa: formatSisa(booking.total_tagihan, booking.dp_dibayar),
    jumlah_foto: getJumlahFoto(booking.nama_paket),
  }

  const pesanPreview =
    selectedTemplate === "custom"
      ? pesanCustom
      : generatePesan(selectedTemplate, templateData)

  // Mode 1: Buka WhatsApp Web (manual)
  function handleBukaWaWeb() {
    const nomor = formatNomor(booking.no_wa)
    const url = `https://wa.me/${nomor}?text=${encodeURIComponent(pesanPreview)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  // Mode 2: Kirim otomatis via Fonnte
  async function handleKirimOtomatis() {
    if (!pesanPreview.trim()) {
      toast.error("Pesan tidak boleh kosong")
      return
    }
    setSending(true)
    try {
      const res = await fetch("/api/notifikasi/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: booking.id,
          jenis_template: selectedTemplate,
          pesan_custom: selectedTemplate === "custom" ? pesanCustom : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.error ?? "Gagal mengirim WA")
        return
      }
      toast.success(`WhatsApp berhasil dikirim ke ${booking.no_wa}`)
      onClose()
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-green-600">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-white" />
            <h2 className="text-base font-semibold text-white">Kirim WhatsApp</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-white/80 hover:text-white transition"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Info client */}
          <div className="rounded-lg bg-gray-50 px-4 py-2.5 text-sm">
            <span className="text-gray-500">Ke: </span>
            <span className="font-semibold text-gray-800">{booking.nama_client}</span>
            <span className="ml-2 text-gray-400">{booking.no_wa}</span>
          </div>

          {/* Pilih template */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">
              Template Pesan
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value as JenisTemplate | "custom")}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30"
            >
              {ALL_TEMPLATES.map((t) => (
                <option key={t} value={t}>
                  {TEMPLATE_LABELS[t]}
                </option>
              ))}
              <option value="custom">Pesan Custom</option>
            </select>
          </div>

          {/* Input custom */}
          {selectedTemplate === "custom" && (
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                Tulis Pesan
              </label>
              <textarea
                value={pesanCustom}
                onChange={(e) => setPesanCustom(e.target.value)}
                rows={4}
                placeholder="Ketik pesan WhatsApp..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 resize-none"
              />
            </div>
          )}

          {/* Preview pesan */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">
              Preview Pesan
            </label>
            <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {pesanPreview || <span className="text-gray-400 italic">Pesan kosong</span>}
            </div>
          </div>

          {/* Tombol aksi */}
          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              className="flex-1 gap-2 border-green-600 text-green-700 hover:bg-green-50"
              onClick={handleBukaWaWeb}
              disabled={!pesanPreview.trim()}
            >
              <ExternalLink className="w-4 h-4" />
              WA Web (Manual)
            </Button>
            <Button
              className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
              onClick={handleKirimOtomatis}
              disabled={sending || !pesanPreview.trim()}
            >
              <Send className="w-4 h-4" />
              {sending ? "Mengirim..." : "Kirim Otomatis"}
            </Button>
          </div>
          <p className="text-xs text-center text-gray-400">
            &quot;Kirim Otomatis&quot; memerlukan Fonnte token dikonfigurasi
          </p>
        </div>
      </div>
    </div>
  )
}
