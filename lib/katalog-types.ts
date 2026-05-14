// Tipe data katalog yang dipakai di landing page dan form booking

import type { KategoriSesi } from "@/types"

export interface PaketKatalog {
  key: string                         // settings key: "paket_wisuda_bronze"
  id: string                          // id internal: "bronze-wisuda"
  nama: string
  kategori: KategoriSesi
  harga: number
  hargaMulaiDari: boolean
  durasiMenit: number
  jumlahBackground: number
  maxOrang: number | null
  cetakInclude: "12R" | "20R" | null
  popular: boolean
}

export interface AddonKatalog {
  tambahanWaktu:      { nama: string; harga: number; satuan: string }
  tambahanOrang:      { nama: string; harga: number; satuan: string }
  tambahanBackground: { nama: string; harga: number; satuan: string }
  cetak12R:           { nama: string; harga: number }
  cetak20R:           { nama: string; harga: number }
}

export interface BgKatalog {
  id: string
  nama: string
  warna: string
}

export interface AddonItem {
  key:    string
  nama:   string
  harga:  number
  satuan?: string
}

export interface KatalogData {
  paket:       PaketKatalog[]
  addon:       AddonKatalog    // dipakai form booking (5 add-on tetap)
  backgrounds: BgKatalog[]
  allAddons:   AddonItem[]     // dipakai landing page (semua add-on dari DB)
}
