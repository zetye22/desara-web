import type { KategoriSesi } from "@/types"

export interface PortfolioItem {
  id: string
  src: string
  alt: string
  kategori: KategoriSesi
  caption?: string
}

// Seed konsisten = foto tidak berubah tiap reload
// Format URL: https://picsum.photos/seed/{seed}/600/750
const BASE = "https://picsum.photos/seed"

export const PORTFOLIO_ITEMS: PortfolioItem[] = [
  // ── WISUDA (8) ──────────────────────────────────────────────
  {
    id: "w1",
    src: `${BASE}/dsr-w1/600/750`,
    alt: "Sesi foto wisuda - toga dan selempang kebanggaan",
    kategori: "wisuda",
    caption: "Paket Silver Wisuda",
  },
  {
    id: "w2",
    src: `${BASE}/dsr-w2/600/750`,
    alt: "Sesi foto wisuda - pose formal background putih",
    kategori: "wisuda",
    caption: "Paket Bronze Wisuda",
  },
  {
    id: "w3",
    src: `${BASE}/dsr-w3/600/750`,
    alt: "Sesi foto wisuda - close-up ekspresi bahagia",
    kategori: "wisuda",
    caption: "Paket Gold Wisuda",
  },
  {
    id: "w4",
    src: `${BASE}/dsr-w4/600/750`,
    alt: "Sesi foto wisuda - pose bersama keluarga",
    kategori: "wisuda",
    caption: "Paket Silver Wisuda",
  },
  {
    id: "w5",
    src: `${BASE}/dsr-w5/600/750`,
    alt: "Sesi foto wisuda - background abstrak biru",
    kategori: "wisuda",
    caption: "Paket Gold Wisuda",
  },
  {
    id: "w6",
    src: `${BASE}/dsr-w6/600/750`,
    alt: "Sesi foto wisuda - full body dengan topi toga",
    kategori: "wisuda",
    caption: "Paket Bronze Wisuda",
  },
  {
    id: "w7",
    src: `${BASE}/dsr-w7/600/750`,
    alt: "Sesi foto wisuda - pose kasual modern",
    kategori: "wisuda",
    caption: "Paket Silver Wisuda",
  },
  {
    id: "w8",
    src: `${BASE}/dsr-w8/600/750`,
    alt: "Sesi foto wisuda - background hitam elegan",
    kategori: "wisuda",
    caption: "Paket Gold Wisuda",
  },

  // ── PREWED (6) ──────────────────────────────────────────────
  {
    id: "p1",
    src: `${BASE}/dsr-p1/600/750`,
    alt: "Sesi foto prewedding - momen intim berdua",
    kategori: "prewed",
    caption: "Paket Prewedding",
  },
  {
    id: "p2",
    src: `${BASE}/dsr-p2/600/750`,
    alt: "Sesi foto prewedding - gaun pengantin klasik",
    kategori: "prewed",
    caption: "Paket Prewedding",
  },
  {
    id: "p3",
    src: `${BASE}/dsr-p3/600/750`,
    alt: "Sesi foto prewedding - pose romantis pasangan",
    kategori: "prewed",
    caption: "Paket Prewedding",
  },
  {
    id: "p4",
    src: `${BASE}/dsr-p4/600/750`,
    alt: "Sesi foto prewedding - ekspresi natural dan hangat",
    kategori: "prewed",
    caption: "Paket Prewedding",
  },
  {
    id: "p5",
    src: `${BASE}/dsr-p5/600/750`,
    alt: "Sesi foto prewedding - konsep modern minimalis",
    kategori: "prewed",
    caption: "Paket Prewedding",
  },
  {
    id: "p6",
    src: `${BASE}/dsr-p6/600/750`,
    alt: "Sesi foto prewedding - detail buket dan gaun",
    kategori: "prewed",
    caption: "Paket Prewedding",
  },

  // ── KELUARGA (4) ────────────────────────────────────────────
  {
    id: "k1",
    src: `${BASE}/dsr-k1/600/750`,
    alt: "Sesi foto keluarga - momen hangat bersama",
    kategori: "keluarga",
    caption: "Paket Keluarga",
  },
  {
    id: "k2",
    src: `${BASE}/dsr-k2/600/750`,
    alt: "Sesi foto keluarga - senyum bahagia tiga generasi",
    kategori: "keluarga",
    caption: "Paket Keluarga",
  },
  {
    id: "k3",
    src: `${BASE}/dsr-k3/600/750`,
    alt: "Sesi foto keluarga - pose formal background merah",
    kategori: "keluarga",
    caption: "Paket Keluarga",
  },
  {
    id: "k4",
    src: `${BASE}/dsr-k4/600/750`,
    alt: "Sesi foto keluarga - momen candid natural",
    kategori: "keluarga",
    caption: "Paket Keluarga",
  },

  // ── GROUP (4) ────────────────────────────────────────────────
  {
    id: "g1",
    src: `${BASE}/dsr-g1/600/750`,
    alt: "Sesi foto group - foto angkatan kompak",
    kategori: "group",
    caption: "Paket Group",
  },
  {
    id: "g2",
    src: `${BASE}/dsr-g2/600/750`,
    alt: "Sesi foto group - reuni sahabat lama",
    kategori: "group",
    caption: "Paket Group",
  },
  {
    id: "g3",
    src: `${BASE}/dsr-g3/600/750`,
    alt: "Sesi foto group - team kantor kompak",
    kategori: "group",
    caption: "Paket Group",
  },
  {
    id: "g4",
    src: `${BASE}/dsr-g4/600/750`,
    alt: "Sesi foto group - komunitas besar semangat",
    kategori: "group",
    caption: "Paket Group",
  },

  // ── PORTRAIT (2) ─────────────────────────────────────────────
  {
    id: "pt1",
    src: `${BASE}/dsr-pt1/600/750`,
    alt: "Sesi foto portrait - headshot profesional",
    kategori: "portrait",
    caption: "Paket Portrait",
  },
  {
    id: "pt2",
    src: `${BASE}/dsr-pt2/600/750`,
    alt: "Sesi foto portrait - ekspresi natural close-up",
    kategori: "portrait",
    caption: "Paket Portrait",
  },
]
