import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { KategoriSesi } from "@/types"
import type { KatalogData } from "@/lib/katalog-types"
import { DEFAULT_ADDONS, type AddonState } from "@/lib/booking-store"

export interface WaitingListResult {
  id: string
  nama_client: string
  no_wa: string
  nama_paket: string
  total_tagihan: number
  dp_minimum: number
}

export interface WaitingListState {
  currentStep: number // 1: Paket, 2: Detail & Background, 3: Konfirmasi

  // Paket
  kategori: KategoriSesi | null
  paketId: string | null
  addons: AddonState

  // Detail Client & Background
  backgroundDipilih: string[]
  namaClient: string
  noWa: string
  email: string
  jumlahOrang: number
  preferensiJadwal: string
  kampus: string
  catatan: string

  // Katalog dari DB
  katalog: KatalogData | null

  // Hasil submit
  waitingListResult: WaitingListResult | null

  // Actions
  setKatalog: (k: KatalogData) => void
  setKategori: (k: KategoriSesi) => void
  setPaketId: (id: string) => void
  setAddon: (key: keyof AddonState, value: number) => void
  setBackground: (bgs: string[]) => void
  setFormDetail: (
    data: Partial<
      Pick<
        WaitingListState,
        "namaClient" | "noWa" | "email" | "jumlahOrang" | "preferensiJadwal" | "kampus" | "catatan"
      >
    >
  ) => void
  setWaitingListResult: (res: WaitingListResult) => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
  reset: () => void
}

export const useWaitingListStore = create<WaitingListState>()(
  persist(
    (set) => ({
      currentStep: 1,
      katalog: null,
      kategori: null,
      paketId: null,
      addons: DEFAULT_ADDONS,
      backgroundDipilih: [],
      namaClient: "",
      noWa: "",
      email: "",
      jumlahOrang: 1,
      preferensiJadwal: "",
      kampus: "",
      catatan: "",
      waitingListResult: null,

      setKatalog: (k) => set({ katalog: k }),
      setKategori: (k) =>
        set({ kategori: k, paketId: null, addons: DEFAULT_ADDONS, backgroundDipilih: [] }),
      setPaketId: (id) =>
        set({ paketId: id, addons: DEFAULT_ADDONS, backgroundDipilih: [] }),
      setAddon: (key, value) =>
        set((s) => ({ addons: { ...s.addons, [key]: value } })),
      setBackground: (bgs) => set({ backgroundDipilih: bgs }),
      setFormDetail: (data) => set(data),
      setWaitingListResult: (res) => set({ waitingListResult: res }),
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
          backgroundDipilih: [],
          namaClient: "",
          noWa: "",
          email: "",
          jumlahOrang: 1,
          preferensiJadwal: "",
          kampus: "",
          catatan: "",
          waitingListResult: null,
        }),
    }),
    {
      name: "desara-waiting-list",
      version: 1,
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? sessionStorage : localStorage
      ),
    }
  )
)
