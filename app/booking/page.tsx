import { createAdminClient } from "@/lib/supabase/server"
import { BookingForm } from "@/components/booking/booking-form"
import { SEMUA_PAKET, ADD_ONS, BACKGROUNDS } from "@/lib/constants"
import type { KatalogData, PaketKatalog, AddonKatalog, AddonItem } from "@/lib/katalog-types"
import type { KategoriSesi } from "@/types"

const ADDON_KEY_MAP: Record<string, keyof AddonKatalog> = {
  addon_tambahan_waktu: "tambahanWaktu",
  addon_tambahan_orang: "tambahanOrang",
  addon_tambahan_bg:    "tambahanBackground",
  addon_cetak_12r:      "cetak12R",
  addon_cetak_20r:      "cetak20R",
}

async function fetchKatalog(): Promise<KatalogData> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any

    const [settingsRes, bgRes] = await Promise.all([
      supabase.from("settings").select("key, value").or("key.like.paket_%,key.like.addon_%"),
      supabase.from("studio_backgrounds").select("id, nama, warna").eq("aktif", true).order("urutan"),
    ])

    const rows: { key: string; value: Record<string, unknown> }[] = settingsRes.data ?? []

    // Paket
    const paketRows = rows.filter((r: { key: string }) => r.key.startsWith("paket_"))
    let paket: PaketKatalog[] = paketRows
      .map((r: { key: string; value: Record<string, unknown> }) => {
        const v = r.value as {
          id?: string; nama?: string; kategori?: string; harga?: number
          durasiMenit?: number; jumlahBackground?: number; maxOrang?: number | null
          cetakInclude?: "12R" | "20R" | null; popular?: boolean; aktif?: boolean
          hargaMulaiDari?: boolean
        }
        if (!v.aktif) return null
        return {
          key: r.key, id: v.id ?? r.key, nama: v.nama ?? "",
          kategori: (v.kategori ?? "wisuda") as KategoriSesi,
          harga: v.harga ?? 0,
          hargaMulaiDari: v.hargaMulaiDari ?? (v.kategori !== "wisuda"),
          durasiMenit: v.durasiMenit ?? 30, jumlahBackground: v.jumlahBackground ?? 1,
          maxOrang: v.maxOrang ?? null, cetakInclude: v.cetakInclude ?? null,
          popular: v.popular ?? false,
        } satisfies PaketKatalog
      })
      .filter(Boolean) as PaketKatalog[]

    if (paket.length === 0) {
      paket = SEMUA_PAKET.map((p) => ({
        key: `paket_${p.id}`, id: p.id, nama: p.nama, kategori: p.kategori,
        harga: p.harga, hargaMulaiDari: p.hargaMulaiDari, durasiMenit: p.durasiMenit,
        jumlahBackground: p.jumlahBackground, maxOrang: p.maxOrang,
        cetakInclude: p.cetakInclude ?? null, popular: p.popular ?? false,
      }))
    }

    // Addon
    const addon: AddonKatalog = {
      tambahanWaktu:      { nama: ADD_ONS.tambahanWaktu.nama,      harga: ADD_ONS.tambahanWaktu.harga,      satuan: ADD_ONS.tambahanWaktu.satuan },
      tambahanOrang:      { nama: ADD_ONS.tambahanOrang.nama,      harga: ADD_ONS.tambahanOrang.harga,      satuan: ADD_ONS.tambahanOrang.satuan },
      tambahanBackground: { nama: ADD_ONS.tambahanBackground.nama, harga: ADD_ONS.tambahanBackground.harga, satuan: ADD_ONS.tambahanBackground.satuan },
      cetak12R:           { nama: ADD_ONS.cetak12R.nama,           harga: ADD_ONS.cetak12R.harga },
      cetak20R:           { nama: ADD_ONS.cetak20R.nama,           harga: ADD_ONS.cetak20R.harga },
    }
    for (const r of rows.filter((x: { key: string }) => x.key.startsWith("addon_"))) {
      const mapKey = ADDON_KEY_MAP[r.key]
      if (mapKey) {
        const v = r.value as { nama?: string; harga?: number; satuan?: string }
        if (v.harga) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(addon as any)[mapKey] = { nama: v.nama ?? mapKey, harga: v.harga, satuan: v.satuan ?? "" }
        }
      }
    }

    // allAddons — semua add-on dari DB untuk landing page
    const allAddonRows = rows.filter((x: { key: string }) => x.key.startsWith("addon_"))
    let allAddons: AddonItem[] = allAddonRows
      .map((r: { key: string; value: Record<string, unknown> }) => {
        const v = r.value as { nama?: string; harga?: number; satuan?: string }
        if (!v.harga) return null
        return { key: r.key, nama: v.nama ?? r.key, harga: v.harga, satuan: v.satuan }
      })
      .filter(Boolean) as AddonItem[]
    if (allAddons.length === 0) {
      allAddons = [
        { key: "addon_tambahan_waktu", nama: ADD_ONS.tambahanWaktu.nama,      harga: ADD_ONS.tambahanWaktu.harga,      satuan: ADD_ONS.tambahanWaktu.satuan },
        { key: "addon_tambahan_orang", nama: ADD_ONS.tambahanOrang.nama,      harga: ADD_ONS.tambahanOrang.harga,      satuan: ADD_ONS.tambahanOrang.satuan },
        { key: "addon_tambahan_bg",    nama: ADD_ONS.tambahanBackground.nama, harga: ADD_ONS.tambahanBackground.harga, satuan: ADD_ONS.tambahanBackground.satuan },
        { key: "addon_cetak_12r",      nama: ADD_ONS.cetak12R.nama,           harga: ADD_ONS.cetak12R.harga },
        { key: "addon_cetak_20r",      nama: ADD_ONS.cetak20R.nama,           harga: ADD_ONS.cetak20R.harga },
      ]
    }

    // Background
    let backgrounds = (bgRes.data ?? []) as { id: string; nama: string; warna: string }[]
    if (backgrounds.length === 0) {
      backgrounds = BACKGROUNDS.map((b) => ({ id: b.id, nama: b.nama, warna: b.warna }))
    }

    return { paket, addon, backgrounds, allAddons }
  } catch {
    const defaultAllAddons: AddonItem[] = [
      { key: "addon_tambahan_waktu", nama: ADD_ONS.tambahanWaktu.nama,      harga: ADD_ONS.tambahanWaktu.harga,      satuan: ADD_ONS.tambahanWaktu.satuan },
      { key: "addon_tambahan_orang", nama: ADD_ONS.tambahanOrang.nama,      harga: ADD_ONS.tambahanOrang.harga,      satuan: ADD_ONS.tambahanOrang.satuan },
      { key: "addon_tambahan_bg",    nama: ADD_ONS.tambahanBackground.nama, harga: ADD_ONS.tambahanBackground.harga, satuan: ADD_ONS.tambahanBackground.satuan },
      { key: "addon_cetak_12r",      nama: ADD_ONS.cetak12R.nama,           harga: ADD_ONS.cetak12R.harga },
      { key: "addon_cetak_20r",      nama: ADD_ONS.cetak20R.nama,           harga: ADD_ONS.cetak20R.harga },
    ]
    return {
      paket: SEMUA_PAKET.map((p) => ({
        key: `paket_${p.id}`, id: p.id, nama: p.nama, kategori: p.kategori,
        harga: p.harga, hargaMulaiDari: p.hargaMulaiDari, durasiMenit: p.durasiMenit,
        jumlahBackground: p.jumlahBackground, maxOrang: p.maxOrang,
        cetakInclude: p.cetakInclude ?? null, popular: p.popular ?? false,
      })),
      addon: {
        tambahanWaktu:      { nama: ADD_ONS.tambahanWaktu.nama,      harga: ADD_ONS.tambahanWaktu.harga,      satuan: ADD_ONS.tambahanWaktu.satuan },
        tambahanOrang:      { nama: ADD_ONS.tambahanOrang.nama,      harga: ADD_ONS.tambahanOrang.harga,      satuan: ADD_ONS.tambahanOrang.satuan },
        tambahanBackground: { nama: ADD_ONS.tambahanBackground.nama, harga: ADD_ONS.tambahanBackground.harga, satuan: ADD_ONS.tambahanBackground.satuan },
        cetak12R:           { nama: ADD_ONS.cetak12R.nama,           harga: ADD_ONS.cetak12R.harga },
        cetak20R:           { nama: ADD_ONS.cetak20R.nama,           harga: ADD_ONS.cetak20R.harga },
      },
      backgrounds: BACKGROUNDS.map((b) => ({ id: b.id, nama: b.nama, warna: b.warna })),
      allAddons: defaultAllAddons,
    }
  }
}

export default async function BookingPage() {
  const katalog = await fetchKatalog()
  return <BookingForm katalog={katalog} />
}
