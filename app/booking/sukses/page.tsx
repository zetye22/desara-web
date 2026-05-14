"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle2, Copy, MessageCircle, Home, FileImage, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useBookingStore } from "@/lib/booking-store"
import { formatRupiah, formatTanggal } from "@/lib/utils"

// Nomor WA studio (sumber: settings di Supabase, hardcode sementara)
const WA_STUDIO = "6282148832027"  // ← ganti dengan nomor WA studio Anda
const REKENING  = "BNI 1990890597 a.n. Edwin Desara"  // ← ganti dengan rekening asli

export default function SuksesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>}>
      <SuksesContent />
    </Suspense>
  )
}

function SuksesContent() {
  const router      = useRouter()
  const searchParams = useSearchParams()
  const kodeParam   = searchParams.get("kode") ?? ""

  const { bookingResult, reset } = useBookingStore()
  const [copied, setCopied]     = useState(false)

  // Upload bukti transfer dari halaman sukses
  const [uploadFile, setUploadFile]   = useState<File | null>(null)
  const [uploading, setUploading]     = useState(false)
  const [uploaded, setUploaded]       = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const kode = bookingResult?.kode_booking ?? kodeParam

  // Kalau kode tidak ada sama sekali, redirect ke beranda
  useEffect(() => {
    if (!kode) router.replace("/")
  }, [kode, router])

  if (!kode) return null

  // ── Copy kode booking ─────────────────────────────────────────
  const copyKode = () => {
    navigator.clipboard.writeText(kode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── WA template ───────────────────────────────────────────────
  const waMessage = [
    `Halo Desara Studio, saya ingin konfirmasi booking saya 🙏`,
    ``,
    `Kode Booking: *${kode}*`,
    bookingResult ? `Nama: ${bookingResult.nama_client}` : "",
    bookingResult ? `Paket: ${bookingResult.nama_paket}` : "",
    bookingResult ? `Tanggal: ${formatTanggal(bookingResult.tgl_foto + "T00:00:00")}` : "",
    bookingResult ? `Jam: ${bookingResult.jam_mulai} WIB` : "",
    ``,
    `DP yang akan saya transfer: ${bookingResult ? formatRupiah(bookingResult.dp_minimum) : "Rp 100.000"}`,
    `Rekening tujuan: ${REKENING}`,
  ].filter(Boolean).join("\n")

  const waUrl = `https://wa.me/${WA_STUDIO}?text=${encodeURIComponent(waMessage)}`

  // ── Upload bukti dari halaman sukses ──────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error("Ukuran file maksimal 5 MB"); return }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Format file harus JPG, PNG, atau WebP")
      return
    }
    setUploadFile(file)
  }

  const handleUpload = async () => {
    if (!uploadFile || !kode) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", uploadFile)
      fd.append("kode_booking", kode)
      const res  = await fetch("/api/bookings/upload-bukti", { method: "POST", body: fd })
      const json = await res.json() as { success?: boolean; error?: string }
      if (json.success) {
        setUploaded(true)
        toast.success("Bukti transfer berhasil diupload!")
      } else {
        toast.error(json.error ?? "Gagal upload. Silakan kirim via WhatsApp.")
      }
    } catch {
      toast.error("Gagal koneksi. Silakan kirim bukti via WhatsApp.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full">

        {/* Header sukses */}
        <div className="text-center mb-6">
          <div className="relative inline-flex">
            <CheckCircle2 className="w-20 h-20 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-[#0d1f3c] mt-3">Booking Berhasil!</h1>
          <p className="text-sm text-gray-500 mt-1">Terima kasih, booking Anda sudah kami terima</p>
        </div>

        {/* Kode booking */}
        <div className="bg-[#0d1f3c] rounded-xl px-5 py-4 text-center mb-5">
          <p className="text-xs text-blue-200 mb-1">Nomor Booking Anda</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-bold text-[#C9A84C] tracking-wider">{kode}</span>
            <button
              onClick={copyKode}
              className="text-blue-300 hover:text-white transition-colors"
              aria-label="Salin kode booking"
            >
              {copied
                ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                : <Copy className="w-4 h-4" />
              }
            </button>
          </div>
          <p className="text-xs text-blue-300 mt-1">Simpan kode ini sebagai bukti booking</p>
        </div>

        {/* Ringkasan (kalau ada data dari store) */}
        {bookingResult && (
          <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-1.5 text-sm">
            <SummaryRow label="Nama"    value={bookingResult.nama_client} />
            <SummaryRow label="Paket"   value={bookingResult.nama_paket} />
            <SummaryRow
              label="Tanggal"
              value={formatTanggal(bookingResult.tgl_foto + "T00:00:00")}
            />
            <SummaryRow label="Jam"     value={`${bookingResult.jam_mulai} WIB`} />
            <div className="border-t border-gray-200 pt-2 mt-2">
              <SummaryRow label="Total"       value={formatRupiah(bookingResult.total_tagihan)} bold />
              <SummaryRow label="DP Sekarang" value={formatRupiah(bookingResult.dp_minimum)} bold accent />
              <SummaryRow label="Sisa di Studio" value={formatRupiah(bookingResult.sisa_bayar)} />
            </div>
          </div>
        )}

        {/* Info rekening */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
          <p className="text-sm font-semibold text-amber-800 mb-2">Langkah Selanjutnya:</p>
          <ol className="text-sm text-amber-700 space-y-1.5 list-decimal list-inside">
            <li>
              Transfer DP{" "}
              <strong>{bookingResult ? formatRupiah(bookingResult.dp_minimum) : "Rp 100.000"}</strong>{" "}
              ke:
            </li>
          </ol>
          <div className="mt-2 bg-white rounded-lg border border-amber-200 px-3 py-2 flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-gray-800">{REKENING}</span>
            <button
              onClick={() => { navigator.clipboard.writeText(REKENING); toast.success("Nomor rekening disalin!") }}
              className="text-[#C9A84C] hover:text-[#b8963d] shrink-0"
              aria-label="Salin rekening"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <ol className="text-sm text-amber-700 space-y-1.5 list-decimal list-inside mt-2" start={2}>
            <li>Kirim bukti transfer ke WhatsApp kami atau upload di bawah</li>
            <li>Konfirmasi dalam max 2 jam kerja</li>
          </ol>
        </div>

        {/* Upload bukti transfer */}
        {!uploaded ? (
          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-700 mb-2">Upload Bukti Transfer</p>
            {uploadFile ? (
              <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-3 py-2.5 mb-2">
                <FileImage className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-700 truncate flex-1">{uploadFile.name}</span>
                <button onClick={() => setUploadFile(null)} className="text-gray-400 hover:text-red-500">
                  <span className="text-xs">✕</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-400 hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors"
              >
                Klik untuk pilih file (JPG/PNG/WebP, max 5 MB)
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            {uploadFile && (
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white rounded-xl h-10"
              >
                {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mengupload…</> : "Upload Bukti Transfer"}
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span className="text-sm text-green-700 font-medium">Bukti transfer berhasil diupload!</span>
          </div>
        )}

        {/* Tombol aksi */}
        <div className="space-y-2.5">
          <a href={waUrl} target="_blank" rel="noopener noreferrer">
            <Button className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl h-11 gap-2">
              <MessageCircle className="w-4 h-4" />
              Kirim Konfirmasi via WhatsApp
            </Button>
          </a>
          <Button
            variant="outline"
            onClick={() => { reset(); router.push("/") }}
            className="w-full rounded-xl h-11 gap-2"
          >
            <Home className="w-4 h-4" />
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    </div>
  )
}  // end SuksesContent

function SummaryRow({
  label, value, bold, accent,
}: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-gray-500">{label}</span>
      <span className={`text-right ${bold ? "font-semibold" : ""} ${accent ? "text-green-700" : "text-gray-800"}`}>
        {value}
      </span>
    </div>
  )
}
