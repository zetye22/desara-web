export interface Client {
  id: string
  nama: string
  no_wa: string
  email: string | null
  total_booking: number
  total_spending: number
  last_booking_date: string | null
  created_at: string
  tags: string[]
  catatan: string | null
  is_blacklist: boolean
  alasan_blacklist: string | null
}

export interface ClientBooking {
  id: string
  kode_booking: string
  tgl_foto: string
  nama_paket: string
  nama_client: string
  total_tagihan: number
  dp_dibayar: number
  status_sesi: string
  status_pembayaran: string
  created_at: string
}

export interface Insights {
  totalClients: number
  vipCount: number
  inactiveCount: number
  blacklistCount: number
  newThisMonth: number
}

export interface FilterState {
  search: string
  tags: string[]
  bookingMin: string
  bookingMax: string
  spendingMin: string
  spendingMax: string
  inactiveBulan: string
  blacklist: "" | "true" | "false"
  sort: string
  order: "asc" | "desc"
  page: number
}

export const DEFAULT_FILTERS: FilterState = {
  search: "",
  tags: [],
  bookingMin: "",
  bookingMax: "",
  spendingMin: "",
  spendingMax: "",
  inactiveBulan: "",
  blacklist: "",
  sort: "last_booking_date",
  order: "desc",
  page: 1,
}

export const AVAILABLE_TAGS = ["VIP", "Loyal", "Prewedding", "Keluarga", "Wisuda", "Reguler", "Repeat Order"]

export function getClientBadges(c: Client): { label: string; color: string }[] {
  const badges: { label: string; color: string }[] = []

  if (c.is_blacklist) {
    badges.push({ label: "Blacklist", color: "bg-red-100 text-red-700" })
    return badges
  }

  if (c.total_booking >= 6 || c.total_spending >= 2_000_000) {
    badges.push({ label: "VIP", color: "bg-amber-100 text-amber-700" })
  } else if (c.total_booking >= 3) {
    badges.push({ label: "Loyal", color: "bg-blue-100 text-blue-700" })
  } else if (c.total_booking <= 1) {
    badges.push({ label: "Baru", color: "bg-green-100 text-green-700" })
  }

  if (c.last_booking_date) {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    if (new Date(c.last_booking_date) < sixMonthsAgo) {
      badges.push({ label: "Tidak Aktif", color: "bg-gray-100 text-gray-500" })
    }
  }

  return badges
}
