export interface KategoriPengeluaran {
  id: string
  nama: string
  tipe: "operasional" | "hpp" | "aset"
  icon: string
  warna: string
  aktif: boolean
  urutan: number
}

export interface PengeluaranTetap {
  id: string
  kategori_id: string | null
  nama: string
  nominal: number
  aktif: boolean
  urutan: number
  catatan: string | null
  kategori_pengeluaran?: KategoriPengeluaran | null
}

export interface Pengeluaran {
  id: string
  tanggal: string
  kategori_id: string | null
  deskripsi: string | null
  nominal: number
  bulan_periode: string
  is_recurring: boolean
  recurring_id: string | null
  bukti_url: string | null
  catatan: string | null
  kategori_pengeluaran?: KategoriPengeluaran | null
}

export const TIPE_LABEL: Record<KategoriPengeluaran["tipe"], string> = {
  operasional: "Operasional",
  hpp: "HPP",
  aset: "Aset",
}

export const TIPE_COLOR: Record<KategoriPengeluaran["tipe"], string> = {
  operasional: "bg-blue-100 text-blue-700",
  hpp: "bg-green-100 text-green-700",
  aset: "bg-purple-100 text-purple-700",
}
