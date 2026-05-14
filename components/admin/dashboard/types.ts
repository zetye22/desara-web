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
  kategori_sesi: string
  catatan: string | null
  created_at: string
}

export interface KpiData {
  bookingHariIni: number
  bookingHariIniLunas: number
  bookingHariIniPending: number
  bookingMingguIni: number
  bookingMingguLalu: number
  omzetBulanIni: number
  jumlahBookingBulanIni: number
  pendingDp: number
  nilaiPendingDp: number
}

export interface ChartPoint {
  tanggal: string   // "Sen 05"
  jumlah: number
}

export interface ActionItem {
  id: string
  kode_booking: string
  nama_client: string
  no_wa: string
  tgl_foto: string
  jam_mulai: string
  nama_paket: string
  tipe: "reminder_besok" | "foto_siap" | "dp_overdue"
}

export interface QuickStats {
  paketTerlaris: string
  rataTagihan: number
  rataHariIni: number
}
