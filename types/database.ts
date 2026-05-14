export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

// kategori_sesi & kategori portfolio disimpan sebagai TEXT di DB (bukan enum)
// → kategori baru bisa ditambahkan hanya dengan mengubah kode, tanpa ALTER TYPE
export type KategoriSesiDB = "wisuda" | "prewed" | "keluarga" | "group" | "portrait" | "couple" | "custom"
export type StatusPembayaranDB = "belum_dp" | "dp_ok" | "lunas"
export type StatusSesiDB = "pending" | "booked" | "selesai_foto" | "selesai_edit" | "diambil" | "cancel"
export type KategoriPortfolioDB = "wisuda" | "prewed" | "keluarga" | "group" | "portrait" | "couple" | "custom" | "semua"
export type KategoriPengeluaranDB = "wifi" | "pdam" | "ipl" | "listrik" | "cetak" | "upah" | "lain"
export type AddonJenisDB = "tambahan_waktu" | "tambahan_orang" | "tambahan_background" | "cetak_12r" | "cetak_20r" | "lainnya"
export type AddonSourceDB = "booking_awal" | "lapangan"
export type RoleAdminDB = "owner" | "admin"

export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: {
          id: string
          kode_booking: string
          created_at: string
          updated_at: string
          nama_client: string
          no_wa: string
          email: string | null
          catatan: string | null
          kategori_sesi: KategoriSesiDB
          paket_id: string
          nama_paket: string
          tgl_foto: string
          jam_mulai: string
          jam_selesai: string
          jumlah_orang: number
          background_dipilih: string[]
          subtotal_paket: number
          subtotal_addon: number
          total_tagihan: number
          dp_dibayar: number
          bukti_transfer_url: string | null
          status_pembayaran: StatusPembayaranDB
          status_sesi: StatusSesiDB
          created_by_admin: boolean
        }
        Insert: {
          id?: string
          kode_booking?: string
          created_at?: string
          updated_at?: string
          nama_client: string
          no_wa: string
          email?: string | null
          catatan?: string | null
          kategori_sesi: KategoriSesiDB
          paket_id: string
          nama_paket: string
          tgl_foto: string
          jam_mulai: string
          jam_selesai: string
          jumlah_orang?: number
          background_dipilih: string[]
          subtotal_paket: number
          subtotal_addon?: number
          total_tagihan: number
          dp_dibayar?: number
          bukti_transfer_url?: string | null
          status_pembayaran?: StatusPembayaranDB
          status_sesi?: StatusSesiDB
          created_by_admin?: boolean
        }
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>
      }
      clients: {
        Row: {
          id: string
          nama: string
          no_wa: string
          email: string | null
          total_booking: number
          total_spending: number
          last_booking_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nama: string
          no_wa: string
          email?: string | null
          total_booking?: number
          total_spending?: number
          last_booking_date?: string | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>
      }
      portfolio: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          image_url: string
          thumbnail_url: string | null
          alt_text: string
          kategori: KategoriPortfolioDB
          urutan: number
          aktif: boolean
          caption: string | null
          uploaded_by: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          image_url: string
          thumbnail_url?: string | null
          alt_text: string
          kategori: KategoriPortfolioDB
          urutan?: number
          aktif?: boolean
          caption?: string | null
          uploaded_by?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["portfolio"]["Insert"]>
      }
      pengeluaran: {
        Row: {
          id: string
          created_at: string
          tanggal: string
          kategori: KategoriPengeluaranDB
          deskripsi: string | null
          nominal: number
          bulan_periode: string
        }
        Insert: {
          id?: string
          created_at?: string
          tanggal: string
          kategori: KategoriPengeluaranDB
          deskripsi?: string | null
          nominal: number
          bulan_periode: string
        }
        Update: Partial<Database["public"]["Tables"]["pengeluaran"]["Insert"]>
      }
      settings: {
        Row: {
          key: string
          value: Json
          updated_at: string
        }
        Insert: {
          key: string
          value: Json
          updated_at?: string
        }
        Update: {
          value?: Json
          updated_at?: string
        }
      }
      admin_profiles: {
        Row: {
          id: string
          user_id: string
          nama: string
          role: RoleAdminDB
          aktif: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nama: string
          role?: RoleAdminDB
          aktif?: boolean
          created_at?: string
        }
        Update: {
          nama?: string
          role?: RoleAdminDB
          aktif?: boolean
        }
      }
      booking_addons: {
        Row: {
          id: string
          booking_id: string
          jenis: AddonJenisDB
          nama_item: string
          qty: number
          harga_satuan: number
          subtotal: number
          source: AddonSourceDB
          catatan: string | null
          ditambahkan_oleh: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          jenis: AddonJenisDB
          nama_item: string
          qty?: number
          harga_satuan: number
          subtotal: number
          source?: AddonSourceDB
          catatan?: string | null
          ditambahkan_oleh?: string | null
          created_at?: string
        }
        Update: {
          booking_id?: string
          jenis?: AddonJenisDB
          nama_item?: string
          qty?: number
          harga_satuan?: number
          subtotal?: number
          source?: AddonSourceDB
          catatan?: string | null
          ditambahkan_oleh?: string | null
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    CompositeTypes: Record<string, never>
    Enums: {
      status_pembayaran_enum: StatusPembayaranDB
      status_sesi_enum: StatusSesiDB
      kategori_pengeluaran_enum: KategoriPengeluaranDB
      addon_jenis_enum: AddonJenisDB
      addon_source_enum: AddonSourceDB
      role_admin_enum: RoleAdminDB
    }
  }
}
