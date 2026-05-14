import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format angka ke format Rupiah, contoh: 300000 → "Rp 300.000"
export function formatRupiah(angka: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(angka)
}

// Format tanggal ke format Indonesia, contoh: "Senin, 7 Mei 2026"
export function formatTanggal(tanggal: Date | string): string {
  const date = typeof tanggal === "string" ? new Date(tanggal) : tanggal
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date)
}

// Format tanggal pendek, contoh: "07/05/2026"
export function formatTanggalPendek(tanggal: Date | string): string {
  const date = typeof tanggal === "string" ? new Date(tanggal) : tanggal
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(date)
}

// Generate nomor booking unik, contoh: "DSR-20260507-001"
export function generateNomorBooking(urutan: number): string {
  const tanggal = new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Jakarta",
  })
    .format(new Date())
    .replace(/\//g, "")
  return `DSR-${tanggal}-${String(urutan).padStart(3, "0")}`
}
