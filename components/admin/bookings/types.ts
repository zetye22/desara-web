// Tipe BookingRow yang dipakai di semua komponen admin booking
// Satu tempat — kalau schema berubah, cukup update di sini
export interface BookingRow {
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
