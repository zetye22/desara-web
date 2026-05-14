export interface PegawaiTetap {
  id: string
  nama: string
  posisi: string
  gaji_bulanan: number
  tanggal_gajian: number
  no_wa: string | null
  no_rekening: string | null
  bank: string | null
  aktif: boolean
  tanggal_mulai: string
  tanggal_berhenti: string | null
  catatan: string | null
  created_at: string
  updated_at: string
}

export interface PegawaiForm {
  nama: string
  posisi: string
  gaji_bulanan: number
  tanggal_gajian: number
  no_wa: string
  no_rekening: string
  bank: string
  tanggal_mulai: string
  catatan: string
}

export const DEFAULT_FORM: PegawaiForm = {
  nama: "",
  posisi: "",
  gaji_bulanan: 0,
  tanggal_gajian: 1,
  no_wa: "",
  no_rekening: "",
  bank: "",
  tanggal_mulai: new Date().toISOString().split("T")[0],
  catatan: "",
}

export const POSISI_SUGGESTIONS = ["Admin", "Manager", "Cleaning", "Security", "Kasir", "Resepsionis"]
