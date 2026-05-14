import { ADD_ONS, SEMUA_PAKET, OPERASIONAL } from "@/lib/constants"
import type { AddonState } from "@/lib/booking-store"
import type { KatalogData } from "@/lib/katalog-types"

export interface AddonBaris {
  nama: string
  harga: number
}

export interface RincianHarga {
  namaPaket: string
  subtotalPaket: number
  addonItems: AddonBaris[]
  subtotalAddon: number
  total: number
  dpMinimum: number
  sisaBayar: number
  durasiTotal: number // menit
}

export function hitungHarga(
  paketId: string | null,
  addons: AddonState,
  katalog?: KatalogData | null,
): RincianHarga {
  // Cari paket dari katalog DB (jika ada) atau fallback ke constants
  const paketDB  = katalog?.paket.find((p) => p.id === paketId)
  const paketConst = SEMUA_PAKET.find((p) => p.id === paketId)
  const paket = paketDB ?? paketConst

  const subtotalPaket = paket?.harga ?? 0
  const namaPaket     = paket?.nama ?? "—"
  const durasiDasar   = paket?.durasiMenit ?? 0

  // Harga add-on dari katalog DB atau fallback ke constants
  const tw  = katalog?.addon.tambahanWaktu      ?? ADD_ONS.tambahanWaktu
  const to  = katalog?.addon.tambahanOrang       ?? ADD_ONS.tambahanOrang
  const tbg = katalog?.addon.tambahanBackground  ?? ADD_ONS.tambahanBackground
  const c12 = katalog?.addon.cetak12R            ?? ADD_ONS.cetak12R
  const c20 = katalog?.addon.cetak20R            ?? ADD_ONS.cetak20R

  const addonItems: AddonBaris[] = []

  if (addons.tambahanWaktu > 0) {
    addonItems.push({
      nama:  `Tambahan Waktu (${addons.tambahanWaktu}×10 menit)`,
      harga: tw.harga * addons.tambahanWaktu,
    })
  }
  if (addons.tambahanOrang > 0) {
    addonItems.push({
      nama:  `Tambahan ${addons.tambahanOrang} Orang`,
      harga: to.harga * addons.tambahanOrang,
    })
  }
  if (addons.tambahanBackground > 0) {
    addonItems.push({
      nama:  `Tambahan ${addons.tambahanBackground} Background`,
      harga: tbg.harga * addons.tambahanBackground,
    })
  }
  if (addons.cetak12R) {
    addonItems.push({ nama: "Cetak 12R + Frame", harga: c12.harga })
  }
  if (addons.cetak20R) {
    addonItems.push({ nama: "Cetak 20R + Frame", harga: c20.harga })
  }

  const subtotalAddon = addonItems.reduce((sum, i) => sum + i.harga, 0)
  const total         = subtotalPaket + subtotalAddon
  const dpMinimum     = OPERASIONAL.dpMinimum
  const sisaBayar     = Math.max(0, total - dpMinimum)
  const durasiTotal   = durasiDasar + addons.tambahanWaktu * 10

  return { namaPaket, subtotalPaket, addonItems, subtotalAddon, total, dpMinimum, sisaBayar, durasiTotal }
}
