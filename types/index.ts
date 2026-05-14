// Tipe data utama untuk sistem booking Desara Home Studio

export type StatusPembayaran = "BELUM_BAYAR" | "DP_OK" | "LUNAS"

// Add-on types (sinkron dengan enum di database)
export type AddonJenis =
  | "tambahan_waktu"
  | "tambahan_orang"
  | "tambahan_background"
  | "cetak_12r"
  | "cetak_20r"
  | "lainnya"

export type AddonSource = "booking_awal" | "lapangan"

export interface BookingAddon {
  id: string
  booking_id: string
  jenis: AddonJenis
  nama_item: string
  qty: number
  harga_satuan: number
  subtotal: number
  source: AddonSource
  catatan: string | null
  ditambahkan_oleh: string | null
  created_at: string
}

export type StatusSesi =
  | "BOOKED"
  | "DP_OK"
  | "SELESAI_FOTO"
  | "SELESAI_EDIT"
  | "DIAMBIL"
  | "CANCEL"

export type KategoriSesi =
  | "wisuda"
  | "prewed"
  | "keluarga"
  | "group"
  | "portrait"
  | "couple"
  | "custom"

export interface Paket {
  id: string
  kategori: KategoriSesi
  nama: string
  harga: number
  hargaMulaiDari: boolean
  durasiMenit: number
  jumlahBackground: number
  maxOrang: number | null
  cetakInclude: "12R" | "20R" | null
  popular?: boolean
  deskripsi?: string
}

export interface Client {
  id: string
  nama: string
  noHp: string
  email?: string
  createdAt: Date
  totalBooking: number
}

export interface Booking {
  id: string
  nomorBooking: string
  client: Client
  paket: Paket
  tanggalSesi: Date
  jamMulai: string // format "HH:mm"
  jamSelesai: string
  jumlahBackground: number
  jumlahOrang?: number // untuk paket Tanpa Paket
  totalHarga: number
  dpMinimum: number
  dpDibayar: number
  statusPembayaran: StatusPembayaran
  statusSesi: StatusSesi
  photographer?: string
  editor?: string
  catatanAdmin?: string
  buktiBayarUrl?: string
  createdAt: Date
  updatedAt: Date
}

export interface LaporanKeuangan {
  bulan: number
  tahun: number
  totalOmzet: number
  totalDP: number
  totalPelunasan: number
  jumlahBooking: number
  jumlahCancel: number
  biayaStaff: number
  biayaTetap: number
  totalBiaya: number
  profit: number
}
