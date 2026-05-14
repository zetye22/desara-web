import type { Paket, KategoriSesi } from "@/types"

// Re-export agar bisa diimport dari satu tempat
export type { KategoriSesi, Paket }

export const SEMUA_PAKET: Paket[] = [
  // ── WISUDA ─────────────────────────────────────────────────
  {
    id: "bronze-wisuda",
    kategori: "wisuda",
    nama: "Bronze",
    harga: 300000,
    hargaMulaiDari: false,
    durasiMenit: 30,
    jumlahBackground: 2,
    maxOrang: 6,
    cetakInclude: null,
  },
  {
    id: "silver-wisuda",
    kategori: "wisuda",
    nama: "Silver",
    harga: 550000,
    hargaMulaiDari: false,
    durasiMenit: 30,
    jumlahBackground: 2,
    maxOrang: 6,
    cetakInclude: "12R",
    popular: true,
  },
  {
    id: "gold-wisuda",
    kategori: "wisuda",
    nama: "Gold",
    harga: 900000,
    hargaMulaiDari: false,
    durasiMenit: 45,
    jumlahBackground: 3,
    maxOrang: 10,
    cetakInclude: "20R",
  },
  // ── PREWED ─────────────────────────────────────────────────
  {
    id: "prewed",
    kategori: "prewed",
    nama: "Prewedding",
    harga: 750000,
    hargaMulaiDari: true,
    durasiMenit: 90,
    jumlahBackground: 1,
    maxOrang: null,
    cetakInclude: null,
  },
  // ── KELUARGA ───────────────────────────────────────────────
  {
    id: "keluarga",
    kategori: "keluarga",
    nama: "Keluarga",
    harga: 450000,
    hargaMulaiDari: true,
    durasiMenit: 40,
    jumlahBackground: 2,
    maxOrang: 6,
    cetakInclude: null,
  },
  // ── GROUP ──────────────────────────────────────────────────
  {
    id: "group",
    kategori: "group",
    nama: "Group",
    harga: 550000,
    hargaMulaiDari: true,
    durasiMenit: 40,
    jumlahBackground: 2,
    maxOrang: 10,
    cetakInclude: null,
  },
  // ── PORTRAIT ───────────────────────────────────────────────
  {
    id: "portrait",
    kategori: "portrait",
    nama: "Portrait",
    harga: 250000,
    hargaMulaiDari: true,
    durasiMenit: 30,
    jumlahBackground: 1,
    maxOrang: null,
    cetakInclude: null,
  },
  // ── COUPLE ─────────────────────────────────────────────────
  {
    id: "couple",
    kategori: "couple",
    nama: "Couple",
    harga: 350000,
    hargaMulaiDari: true,
    durasiMenit: 30,
    jumlahBackground: 1,
    maxOrang: 2,
    cetakInclude: null,
  },
  // ── CUSTOM ─────────────────────────────────────────────────
  {
    id: "custom",
    kategori: "custom",
    nama: "Custom",
    harga: 350000,
    hargaMulaiDari: true,
    durasiMenit: 45,
    jumlahBackground: 2,
    maxOrang: null,
    cetakInclude: null,
  },
]

export const ADD_ONS = {
  tambahanWaktu: {
    nama: "Tambahan Waktu",
    harga: 150000,
    satuan: "per 10 menit",
  },
  tambahanOrang: {
    nama: "Tambahan Orang",
    harga: 20000,
    satuan: "per orang",
  },
  tambahanBackground: {
    nama: "Tambahan Background",
    harga: 100000,
    satuan: "per background",
  },
  cetak12R: {
    nama: "Cetak 12R + Frame",
    harga: 150000,
  },
  cetak20R: {
    nama: "Cetak 20R + Frame",
    harga: 400000,
  },
}

export const BACKGROUNDS = [
  { id: "utama", nama: "BG Utama", warna: "#D4C5A9" },
  { id: "abstrak", nama: "BG Abstrak", warna: "#A8C4D4" },
  { id: "bunga", nama: "BG Bunga", warna: "#F4A7B9" },
  { id: "merah", nama: "BG Merah", warna: "#C53030" },
  { id: "putih", nama: "BG Putih", warna: "#FFFFFF" },
  { id: "hitam", nama: "BG Hitam", warna: "#1A1A1A" },
]

export const INCLUDED_ALL_PAKET = [
  "All edit foto (semua foto di-edit profesional)",
  "Link Google Drive dikirim max 1x12 jam",
]

export const BIAYA_TETAP_BULANAN = {
  wifi: 300000,
  pdam: 100000,
  ipl: 200000,
  listrik: 500000,
  total: 1100000,
}

export const OPERASIONAL = {
  jamBuka: "10:00",
  jamTutup: "21:00",
  jumlahBackground: 4,
  dpMinimum: 100000,
  waktuEditingJam: 12,
}

export const STATUS_SESI_LABEL: Record<string, string> = {
  BOOKED: "Booked",
  DP_OK: "DP OK",
  SELESAI_FOTO: "Selesai Foto",
  SELESAI_EDIT: "Selesai Edit",
  DIAMBIL: "Diambil",
  CANCEL: "Cancel",
}

export const STATUS_PEMBAYARAN_LABEL: Record<string, string> = {
  BELUM_BAYAR: "Belum Bayar",
  DP_OK: "DP OK",
  LUNAS: "Lunas",
}

export const KATEGORI_LABEL: Record<KategoriSesi, string> = {
  wisuda:   "Wisuda",
  prewed:   "Prewedding",
  keluarga: "Keluarga",
  group:    "Group",
  portrait: "Portrait",
  couple:   "Couple",
  custom:   "Custom",
}

