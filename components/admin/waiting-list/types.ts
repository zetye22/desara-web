import type { KategoriSesiDB } from "@/types/database"

export interface WaitingListRow {
  id: string
  created_at: string
  updated_at: string
  nama_client: string
  no_wa: string
  email: string | null
  catatan: string | null
  kategori_sesi: KategoriSesiDB
  paket_id: string
  nama_paket: string
  jumlah_orang: number
  background_dipilih: string[]
  addons: {
    tambahanWaktu?: number
    tambahanOrang?: number
    tambahanBackground?: number
    cetak12R?: number
    cetak20R?: number
  } | null
  subtotal_paket: number
  subtotal_addon: number
  total_tagihan: number
  preferensi_jadwal: string | null
  status: "menunggu" | "dijadwalkan" | "batal"
  booking_id: string | null
  dijadwalkan_pada: string | null
  dijadwalkan_oleh: string | null
}
