import { createClient } from "@/lib/supabase/client"
import { ADD_ONS } from "@/lib/constants"
import type { AddonJenis, AddonSource, BookingAddon } from "@/types"
import type { SupabaseClient } from "@supabase/supabase-js"

// Alias untuk query tanpa type constraint (tabel baru sebelum supabase gen types)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = SupabaseClient<any>

// ── Helper: harga default tiap jenis addon ──────────────────────────
export function getAddonHargaDefault(jenis: AddonJenis): number {
  const map: Record<AddonJenis, number> = {
    tambahan_waktu:      ADD_ONS.tambahanWaktu.harga,
    tambahan_orang:      ADD_ONS.tambahanOrang.harga,
    tambahan_background: ADD_ONS.tambahanBackground.harga,
    cetak_12r:           ADD_ONS.cetak12R.harga,
    cetak_20r:           ADD_ONS.cetak20R.harga,
    lainnya:             0,
  }
  return map[jenis]
}

// ── Helper: format nama tampilan addon ──────────────────────────────
export function formatAddonName(jenis: AddonJenis, qty: number): string {
  switch (jenis) {
    case "tambahan_waktu":
      return `Tambahan Waktu (${qty * 10} menit)`
    case "tambahan_orang":
      return `Tambahan Orang (${qty} orang)`
    case "tambahan_background":
      return `Tambahan Background (${qty} background)`
    case "cetak_12r":
      return "Cetak 12R + Frame"
    case "cetak_20r":
      return "Cetak 20R + Frame"
    default:
      return "Add-on Lainnya"
  }
}

// ── Helper: hitung subtotal ─────────────────────────────────────────
export function hitungSubtotal(hargaSatuan: number, qty: number): number {
  return hargaSatuan * qty
}

// ── Fetch: ambil semua addons untuk 1 booking ───────────────────────
export async function getAddonsForBooking(bookingId: string): Promise<BookingAddon[]> {
  const supabase = createClient() as AnyClient
  const { data, error } = await supabase
    .from("booking_addons")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true })

  if (error) throw new Error(`Gagal ambil addons: ${error.message}`)
  return (data ?? []) as BookingAddon[]
}

// ── Fetch: ambil addons difilter per source ─────────────────────────
export async function getAddonsBySource(
  bookingId: string,
  source: AddonSource
): Promise<BookingAddon[]> {
  const supabase = createClient() as AnyClient
  const { data, error } = await supabase
    .from("booking_addons")
    .select("*")
    .eq("booking_id", bookingId)
    .eq("source", source)
    .order("created_at", { ascending: true })

  if (error) throw new Error(`Gagal ambil addons: ${error.message}`)
  return (data ?? []) as BookingAddon[]
}

// ── Mutation: tambah addon lapangan (dipanggil dari admin panel) ─────
export async function tambahAddonLapangan(params: {
  bookingId: string
  jenis: AddonJenis
  qty: number
  hargaSatuan?: number  // kalau tidak diisi, pakai harga default
  catatan?: string
}): Promise<BookingAddon> {
  const supabase = createClient() as AnyClient

  const hargaSatuan = params.hargaSatuan ?? getAddonHargaDefault(params.jenis)
  const subtotal    = hitungSubtotal(hargaSatuan, params.qty)
  const namaItem    = formatAddonName(params.jenis, params.qty)

  const { data, error } = await supabase
    .from("booking_addons")
    .insert({
      booking_id:   params.bookingId,
      jenis:        params.jenis,
      nama_item:    namaItem,
      qty:          params.qty,
      harga_satuan: hargaSatuan,
      subtotal:     subtotal,
      source:       "lapangan",
      catatan:      params.catatan ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(`Gagal tambah addon: ${error.message}`)
  return data as BookingAddon
}

// ── Mutation: hapus addon lapangan ──────────────────────────────────
export async function hapusAddonLapangan(addonId: string): Promise<void> {
  const supabase = createClient() as AnyClient
  const { error } = await supabase
    .from("booking_addons")
    .delete()
    .eq("id", addonId)
    .eq("source", "lapangan")  // keamanan: hanya bisa hapus addon lapangan

  if (error) throw new Error(`Gagal hapus addon: ${error.message}`)
}

// ── Summary: total nilai addon lapangan ─────────────────────────────
export function hitungTotalAddonLapangan(addons: BookingAddon[]): number {
  return addons
    .filter((a) => a.source === "lapangan")
    .reduce((acc, a) => acc + a.subtotal, 0)
}

// ── Summary: pisahkan addon booking awal vs lapangan ────────────────
export function groupAddonBySource(addons: BookingAddon[]): {
  booking_awal: BookingAddon[]
  lapangan: BookingAddon[]
} {
  return {
    booking_awal: addons.filter((a) => a.source === "booking_awal"),
    lapangan:     addons.filter((a) => a.source === "lapangan"),
  }
}
