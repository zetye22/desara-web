import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { KategoriSesi } from "@/types"
import type { KatalogData } from "@/lib/katalog-types"

export interface AddonState {
  tambahanWaktu: number      // jumlah unit (1 unit = 10 menit)
  tambahanOrang: number      // jumlah orang tambahan
  tambahanBackground: number // jumlah BG tambahan
  cetak12R: number           // jumlah cetakan 12R
  cetak20R: number           // jumlah cetakan 20R
}

export interface BookingResult {
  kode_booking: string
  total_tagihan: number
  dp_minimum: number
  sisa_bayar: number
  nama_client: string
  no_wa: string
  tgl_foto: string
  jam_mulai: string
  nama_paket: string
}

export interface BookingState {
  currentStep: number

  // Step 1 — Paket
  kategori: KategoriSesi | null
  paketId: string | null
  addons: AddonState

  // Step 2 — Jadwal
  tanggalFoto: string | null  // "YYYY-MM-DD"
  jamMulai: string | null     // "HH:mm"

  // Step 3 — Detail
  backgroundDipilih: string[]
  namaClient: string
  noWa: string
  email: string
  jumlahOrang: number
  catatan: string

  // Katalog dari DB (paket, addon, background)
  katalog: KatalogData | null

  // Hasil booking sukses
  bookingResult: BookingResult | null

  // Actions
  setKatalog: (k: KatalogData) => void
  setKategori: (k: KategoriSesi) => void
  setPaketId: (id: string) => void
  setAddon: (key: keyof AddonState, value: number) => void
  setTanggal: (d: string) => void
  setJamMulai: (j: string) => void
  setBackground: (bgs: string[]) => void
  setFormDetail: (
    data: Partial<
      Pick<BookingState, "namaClient" | "noWa" | "email" | "jumlahOrang" | "catatan">
    >
  ) => void
  setBookingResult: (result: BookingResult) => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
  reset: () => void
}

export const DEFAULT_ADDONS: AddonState = {
  tambahanWaktu: 0,
  tambahanOrang: 0,
  tambahanBackground: 0,
  cetak12R: 0,
  cetak20R: 0,
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set) => ({
      currentStep: 1,
      katalog: null,
      kategori: null,
      paketId: null,
      addons: DEFAULT_ADDONS,
      tanggalFoto: null,
      jamMulai: null,
      backgroundDipilih: [],
      namaClient: "",
      noWa: "",
      email: "",
      jumlahOrang: 1,
      catatan: "",
      bookingResult: null,

      setKatalog: (k) => set({ katalog: k }),
      setKategori: (k) =>
        set({ kategori: k, paketId: null, addons: DEFAULT_ADDONS, backgroundDipilih: [] }),
      setPaketId: (id) =>
        set({ paketId: id, addons: DEFAULT_ADDONS, backgroundDipilih: [] }),
      setAddon: (key, value) =>
        set((s) => ({ addons: { ...s.addons, [key]: value } })),
      setTanggal: (d) => set({ tanggalFoto: d }),
      setJamMulai: (j) => set({ jamMulai: j }),
      setBackground: (bgs) => set({ backgroundDipilih: bgs }),
      setFormDetail: (data) => set(data),
      setBookingResult: (result) => set({ bookingResult: result }),
      nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, 4) })),
      prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),
      goToStep: (step) => set({ currentStep: step }),
      reset: () =>
        set({
          currentStep: 1,
          katalog: null,
          kategori: null,
          paketId: null,
          addons: DEFAULT_ADDONS,
          tanggalFoto: null,
          jamMulai: null,
          backgroundDipilih: [],
          namaClient: "",
          noWa: "",
          email: "",
          jumlahOrang: 1,
          catatan: "",
          bookingResult: null,
        }),
    }),
    {
      name: "desara-booking",
      version: 2,
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? sessionStorage : localStorage
      ),
    }
  )
)
