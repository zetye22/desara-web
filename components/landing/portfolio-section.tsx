"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { KATEGORI_LABEL } from "@/lib/constants"
import type { KategoriSesi } from "@/types"
import type { PortfolioItem } from "@/lib/portfolio"

// Data dari database Supabase (hanya field yang dibutuhkan di landing page)
interface DbPortfolioItem {
  id: string
  image_url: string
  alt_text: string
  kategori: string
  caption: string | null
}

type FilterKategori = "semua" | KategoriSesi

const INITIAL_COUNT = 12
const LOAD_MORE_COUNT = 8

// 1×1 gray placeholder — cegah layout shift saat gambar load
const BLUR_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k="

// ─── Lightbox ─────────────────────────────────────────────────
function Lightbox({
  items,
  startIndex,
  onClose,
}: {
  items: PortfolioItem[]
  startIndex: number
  onClose: () => void
}) {
  const [cur, setCur] = useState(startIndex)
  const item = items[cur]

  const prev = useCallback(
    () => setCur((i) => (i > 0 ? i - 1 : items.length - 1)),
    [items.length]
  )
  const next = useCallback(
    () => setCur((i) => (i < items.length - 1 ? i + 1 : 0)),
    [items.length]
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [prev, next, onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Lightbox portfolio foto"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Foto */}
        <div className="relative w-full aspect-[4/5] sm:aspect-[3/4]">
          <Image
            src={item.src}
            alt={item.alt}
            fill
            className="object-contain"
            sizes="(max-width: 640px) 100vw, 672px"
            priority
          />
        </div>

        {/* Caption */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-5 py-6">
          <span className="inline-block bg-[#C9A84C] text-white text-xs font-bold px-2.5 py-0.5 rounded-full mb-2 capitalize">
            {KATEGORI_LABEL[item.kategori as KategoriSesi]}
          </span>
          <p className="text-white font-medium text-sm leading-snug">{item.alt}</p>
          {item.caption && (
            <p className="text-white/50 text-xs mt-0.5">{item.caption}</p>
          )}
          <p className="text-white/30 text-xs mt-1">
            {cur + 1} / {items.length}
          </p>
        </div>

        {/* Tombol tutup */}
        <button
          onClick={onClose}
          aria-label="Tutup lightbox"
          className="absolute -top-4 right-0 sm:top-2 sm:-right-12 w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Prev */}
        <button
          onClick={prev}
          aria-label="Foto sebelumnya"
          className="absolute left-2 top-1/2 -translate-y-8 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Next */}
        <button
          onClick={next}
          aria-label="Foto berikutnya"
          className="absolute right-2 top-1/2 -translate-y-8 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

// ─── Thumbnail card ───────────────────────────────────────────
function FotoCard({
  item,
  onClick,
}: {
  item: PortfolioItem
  onClick: () => void
}) {
  return (
    <div className="mb-3 break-inside-avoid">
      <button
        onClick={onClick}
        className="group relative w-full overflow-hidden rounded-xl bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:ring-offset-2 transition-shadow hover:shadow-lg block"
        aria-label={`Buka foto: ${item.alt}`}
      >
        <Image
          src={item.src}
          alt={item.alt}
          width={800}
          height={1000}
          loading="lazy"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="w-full h-auto transition-transform duration-300 group-hover:scale-105"
          placeholder="blur"
          blurDataURL={BLUR_URL}
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/55 transition-colors duration-300">
          {/* Zoom icon — tengah */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <ZoomIn className="w-6 h-6 text-white" />
            </div>
          </div>
          {/* Label kategori — pojok bawah */}
          <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="inline-block bg-[#C9A84C] text-white text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize">
              {KATEGORI_LABEL[item.kategori as KategoriSesi]}
            </span>
          </div>
        </div>
      </button>
    </div>
  )
}

// ─── Komponen utama ───────────────────────────────────────────
const FILTER_LIST: { value: FilterKategori; label: string }[] = [
  { value: "semua", label: "Semua" },
  { value: "wisuda", label: "Wisuda" },
  { value: "prewed", label: "Prewedding" },
  { value: "keluarga", label: "Keluarga" },
  { value: "group", label: "Group" },
  { value: "portrait", label: "Portrait" },
]

interface PortfolioSectionProps {
  initialItems?: DbPortfolioItem[]
}

export function PortfolioSection({ initialItems }: PortfolioSectionProps) {
  // Hanya tampilkan data dari DB — tidak ada fallback ke dummy data
  const items: PortfolioItem[] = (initialItems ?? []).map((i) => ({
    id: i.id,
    src: i.image_url,
    alt: i.alt_text,
    kategori: i.kategori as KategoriSesi,
    caption: i.caption ?? undefined,
  }))

  // Schema.org ImageGallery untuk SEO
  const SCHEMA = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: "Portfolio Desara Home Studio",
    description:
      "Koleksi hasil foto dari berbagai sesi di Desara Home Studio — wisuda, prewedding, keluarga, group, dan portrait.",
    image: items.map((p) => ({
      "@type": "ImageObject",
      contentUrl: p.src,
      description: p.alt,
    })),
  }

  const [filter, setFilter] = useState<FilterKategori>("semua")
  const [tampil, setTampil] = useState(INITIAL_COUNT)
  const [lightbox, setLightbox] = useState<{
    items: PortfolioItem[]
    index: number
  } | null>(null)

  // Reset jumlah tampil saat filter berubah
  useEffect(() => setTampil(INITIAL_COUNT), [filter])

  const filtered =
    filter === "semua"
      ? items
      : items.filter((p) => p.kategori === filter)

  const visible = filtered.slice(0, tampil)
  const sisaFoto = filtered.length - tampil

  return (
    <section id="portfolio" className="py-20 px-4 bg-[#F8F5F0]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }}
      />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-[#C9A84C] text-sm font-semibold tracking-widest uppercase">
            Portfolio
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0d1f3c] mt-3 mb-4">
            Hasil Karya Kami
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Lihat hasil foto dari berbagai sesi yang pernah kami kerjakan
          </p>
        </div>

        {/* Filter kategori */}
        <div
          className="flex flex-wrap justify-center gap-2 mb-8"
          role="group"
          aria-label="Filter kategori portfolio"
        >
          {FILTER_LIST.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              aria-pressed={filter === f.value}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:ring-offset-1 ${
                filter === f.value
                  ? "bg-[#0d1f3c] text-white shadow-md"
                  : "bg-white text-gray-500 border border-gray-200 hover:border-gray-400 hover:text-gray-800"
              }`}
            >
              {f.label}
              {f.value !== "semua" && (
                <span className="ml-1.5 text-xs opacity-60">
                  ({items.filter((p) => p.kategori === f.value).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Grid foto — masonry agar landscape & portrait tampil natural */}
        <div className="columns-2 md:columns-3 lg:columns-4 gap-3">
          {visible.map((item, i) => (
            <FotoCard
              key={item.id}
              item={item}
              onClick={() => setLightbox({ items: visible, index: i })}
            />
          ))}
        </div>

        {/* Load More */}
        {sisaFoto > 0 && (
          <div className="text-center mt-10">
            <Button
              variant="outline"
              onClick={() => setTampil((t) => t + LOAD_MORE_COUNT)}
              className="border-[#0d1f3c] text-[#0d1f3c] hover:bg-[#0d1f3c] hover:text-white rounded-full px-8 h-11 font-semibold transition-all"
            >
              Muat Lebih Banyak
              <span className="ml-1.5 opacity-60 text-sm">({sisaFoto} foto lagi)</span>
            </Button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          items={lightbox.items}
          startIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </section>
  )
}
