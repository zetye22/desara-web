// Template pesan WhatsApp untuk Desara Home Studio

export type JenisTemplate =
  | "konfirmasi_dp_diterima"
  | "reminder_h1"
  | "foto_siap_diambil"
  | "follow_up_review"

// Jenis enum di Supabase notifikasi_log
export type JenisNotifikasi =
  | "konfirmasi"
  | "reminder_h1"
  | "foto_siap"
  | "follow_up"
  | "custom"

export const TEMPLATE_TO_JENIS: Record<JenisTemplate, JenisNotifikasi> = {
  konfirmasi_dp_diterima: "konfirmasi",
  reminder_h1: "reminder_h1",
  foto_siap_diambil: "foto_siap",
  follow_up_review: "follow_up",
}

export const TEMPLATE_LABELS: Record<JenisTemplate, string> = {
  konfirmasi_dp_diterima: "Konfirmasi DP Diterima",
  reminder_h1: "Reminder H-1",
  foto_siap_diambil: "Foto Siap Diambil",
  follow_up_review: "Follow-up Review",
}

export interface TemplateData {
  nama: string
  tanggal_lengkap: string
  jam: string
  paket: string
  sisa: string
  jumlah_foto?: string
}

// Ambil estimasi jumlah foto dari nama paket
export function getJumlahFoto(namaPaket: string): string {
  const p = namaPaket.toLowerCase()
  if (p.includes("gold")) return "50 foto pilihan"
  if (p.includes("silver")) return "30 foto pilihan"
  if (p.includes("bronze")) return "20 foto pilihan"
  if (p.includes("prewed")) return "50 foto pilihan"
  if (p.includes("keluarga")) return "30 foto pilihan"
  return "foto pilihan"
}

// Format Rupiah tanpa simbol "Rp "
function fmtAngka(n: number): string {
  return new Intl.NumberFormat("id-ID").format(n)
}

export function formatSisa(total: number, dpDibayar: number): string {
  return fmtAngka(Math.max(0, total - dpDibayar))
}

const TEMPLATES: Record<JenisTemplate, (d: TemplateData) => string> = {
  konfirmasi_dp_diterima: (d) =>
    `Halo Kak ${d.nama} 🎉\nDP sudah kami terima ✅\nBooking Anda CONFIRMED:\n📅 ${d.tanggal_lengkap}\n🕐 ${d.jam}\n📦 ${d.paket}\nSisa: Rp ${d.sisa}\nSampai jumpa! 📸`,

  reminder_h1: (d) =>
    `Halo Kak ${d.nama} 👋\nReminder besok ada jadwal foto:\n📅 ${d.tanggal_lengkap}\n🕐 ${d.jam}\nDatang 15 menit lebih awal ya. Sisa Rp ${d.sisa} bisa dilunasi di studio.`,

  foto_siap_diambil: (d) =>
    `Halo Kak ${d.nama} ✨\nFoto Anda sudah selesai diedit! 📸\nUntuk paket ${d.paket} dengan ${d.jumlah_foto ?? "foto pilihan"}.\nBisa diambil di studio jam 10-21 WIB, atau kirim via GoSend (ongkir client).`,

  follow_up_review: (d) =>
    `Halo Kak ${d.nama} 💝\nTerima kasih sudah memilih Desara Studio!\nMohon bantuannya kasih review di:\n[Link Google Maps]\nBonus diskon 10% untuk booking next!`,
}

export function generatePesan(jenis: JenisTemplate, data: TemplateData): string {
  return TEMPLATES[jenis](data)
}

export const ALL_TEMPLATES: JenisTemplate[] = [
  "konfirmasi_dp_diterima",
  "reminder_h1",
  "foto_siap_diambil",
  "follow_up_review",
]
