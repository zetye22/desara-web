// Tipe data untuk modul laporan keuangan

export interface TransaksiHarian {
  tanggal: string
  keterangan: string
  tipe: "masuk" | "keluar"
  nominal: number
  saldo: number
  kode_booking?: string
  nama_client?: string
  kategori?: string
}

export interface BagiHasil {
  laba: number
  persenInvestor: number
  bagianInvestor: number
  bagianStudio: number
  isRugi: boolean
}

export interface KasStudio {
  saldoAwal: number
  totalMasuk: number
  totalKeluar: number
  saldoAkhir: number
  bagiHasil: BagiHasil
  saldoSetelahBagiHasil: number
  persenInvestor: number
}

export interface PengeluaranRow {
  id: string
  tanggal: string
  kategori: string
  kategori_id?: string | null
  kategori_pengeluaran?: { id: string; nama: string } | null
  deskripsi: string | null
  nominal: number
  bulan_periode: string
  is_recurring?: boolean
  recurring_id?: string | null
  created_at: string
}

export interface AddonRow {
  id: string
  booking_id: string
  jenis: string
  nama_item: string
  qty: number
  harga_satuan: number
  subtotal: number
  source: "booking_awal" | "lapangan"
  catatan: string | null
}

export interface DetailAddonLapangan {
  jenis: string
  namaItem: string
  jumlah: number
  totalRevenue: number
}

export interface AddonInsight {
  totalRevenueLapangan: number
  pctDariPemasukan: number
  avgPerBookingAdaAddon: number
  topItem: string | null
  jumlahBookingAdaAddon: number
  totalBooking: number
}

export interface PembayaranRow {
  id: string
  kode_booking: string
  nama_client: string
  nama_paket: string
  tipe: "dp" | "pelunasan"
  nominal: number
  tanggal: string
  tgl_foto: string
}

export interface LaporanData {
  periode: string         // "YYYY-MM"
  pemasukan: {
    perKategori: {
      kategori: string
      jumlah: number
      total: number
      rata: number
    }[]
    totalPaket: number        // sum subtotal_paket
    addonBookingAwal: number  // add-on dari booking awal
    addonLapangan: number     // add-on ditambah saat sesi
    totalAddon: number        // addonBookingAwal + addonLapangan
    total: number
    totalBooking: number
  }
  pengeluaran: {
    hpp: {
      fotografer: { nama: string; jumlah: number; upahPerClient: number; total: number }[]
      editor: { nama: string; jumlah: number; upahPerClient: number; total: number }[]
      cetak: { jenis: string; jumlah: number; hargaSatuan: number; total: number }[]
    }
    operasional: {
      biayaTetap: { nama: string; nominal: number }[]
    }
    lainnya: PengeluaranRow[]
    totalHpp: number
    totalOperasional: number
    totalLainnya: number
    total: number
  }
  laba: number
  margin: number
  kas: KasStudio
  saldoBerjalan: TransaksiHarian[]
  pembayaran: PembayaranRow[]
  tren6Bulan: {
    periode: string
    label: string
    pemasukan: number
    pengeluaran: number
    laba: number
  }[]
  comparison?: {
    pemasukan: { nilai: number; delta: number; pct: number }
    pengeluaran: { nilai: number; delta: number; pct: number }
    laba: { nilai: number; delta: number; pct: number }
  }
  detailAddonLapangan: DetailAddonLapangan[]
  addonInsight: AddonInsight
}

// Tipe booking yang diambil dari Supabase untuk kalkulasi laporan
export interface BookingRingkas {
  id: string
  kategori_sesi: string
  nama_paket: string
  total_tagihan: number
  subtotal_paket: number
  subtotal_addon: number
  tgl_foto: string
  upah_pg1: number
  upah_pg2: number
  upah_editor: number
  pg1: { id: string; nama: string } | null
  pg2: { id: string; nama: string } | null
  ed: { id: string; nama: string } | null
}
