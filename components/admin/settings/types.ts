export interface PaketValue {
  id: string
  nama: string
  kategori: string
  harga: number
  hargaMulaiDari: boolean
  durasiMenit: number
  jumlahBackground: number
  maxOrang: number | null
  cetakInclude: "12R" | "20R" | null
  popular: boolean
  aktif: boolean
}

export interface AddonValue {
  nama: string
  harga: number
  satuan: string
}

export interface OperasionalValue {
  jam_buka: string
  jam_tutup: string
  dp_minimum: number
  toleransi_terlambat: number
  waktu_editing_reguler_jam: number
  waktu_editing_prewed_jam: number
}

export interface RekeningValue {
  bank: string
  nomor: string
  nama_pemilik: string
}

export interface KontakValue {
  wa: string
  email: string
  alamat: string
  maps_url: string
  instagram: string
  tiktok: string
}

export interface SettingsRow {
  key: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any
  kategori: string
  deskripsi: string | null
  updated_at: string
}

export interface Background {
  id: string
  nama: string
  warna: string
  aktif: boolean
  urutan: number
}

export interface SettingsLog {
  id: string
  setting_key: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value_lama: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value_baru: any
  diubah_pada: string
  diubah_oleh?: string
  admin_profiles?: { nama: string; role: string }
}

// Urutan dan label paket
export const PAKET_KEYS = [
  "paket_wisuda_bronze",
  "paket_wisuda_silver",
  "paket_wisuda_gold",
  "paket_prewed",
  "paket_keluarga",
  "paket_group",
  "paket_portrait",
] as const

export const ADDON_KEYS = [
  "addon_tambahan_waktu",
  "addon_tambahan_orang",
  "addon_tambahan_bg",
  "addon_cetak_12r",
  "addon_cetak_20r",
] as const

export const CETAK_OPTIONS: Array<{ value: PaketValue["cetakInclude"]; label: string }> = [
  { value: null, label: "Tidak ada" },
  { value: "12R", label: "Cetak 12R + Frame" },
  { value: "20R", label: "Cetak 20R + Frame" },
]
