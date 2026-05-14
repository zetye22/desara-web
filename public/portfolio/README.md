# Panduan Foto Portfolio — Desara Home Studio

Folder ini untuk menyimpan foto-foto portfolio yang ditampilkan di landing page.
Saat ini website masih pakai foto placeholder dari internet.
Ikuti panduan di bawah untuk mengganti dengan foto asli.

---

## Cara Mengganti Foto Placeholder

### Langkah 1 — Siapkan Foto

Simpan foto asli ke folder ini (`public/portfolio/`).
Ikuti format nama file di bawah (jangan pakai spasi atau huruf kapital).

### Langkah 2 — Update File Data

Buka file `lib/portfolio.ts` di VS Code.
Ganti nilai `src` dari URL picsum menjadi path lokal.

**Sebelum:**
```ts
src: "https://picsum.photos/seed/dsr-w1/600/750"
```

**Sesudah:**
```ts
src: "/portfolio/wisuda-1.jpg"
```

### Langkah 3 — Restart Dev Server

```
Ctrl+C  →  npm run dev
```

---

## Format Nama File yang Direkomendasikan

| Kategori   | Contoh nama file                             |
|------------|----------------------------------------------|
| Wisuda     | `wisuda-1.jpg`, `wisuda-2.jpg`, ...          |
| Prewedding | `prewed-1.jpg`, `prewed-2.jpg`, ...          |
| Keluarga   | `keluarga-1.jpg`, `keluarga-2.jpg`, ...      |
| Group      | `group-1.jpg`, `group-2.jpg`, ...            |
| Portrait   | `portrait-1.jpg`, `portrait-2.jpg`, ...      |

---

## Spesifikasi Foto Ideal

| Setting        | Rekomendasi                        |
|----------------|------------------------------------|
| **Format**     | JPG (untuk foto), WebP (lebih ringan) |
| **Ukuran file**| Maks. 500 KB per foto              |
| **Dimensi**    | 600 × 750 px (rasio 4:5 / portrait)|
| **Resolusi**   | 72–96 DPI (untuk web)              |
| **Warna**      | sRGB                               |

> **Tips:** Untuk kompres foto tanpa kehilangan kualitas, gunakan:
> - [Squoosh.app](https://squoosh.app) — gratis, online, mudah
> - [TinyJPG.com](https://tinyjpg.com) — drag & drop langsung

---

## Cara Kompres Foto di Squoosh

1. Buka squoosh.app di browser
2. Drag foto ke halaman
3. Di panel kanan, pilih format **MozJPEG**
4. Set quality ke **75–80**
5. Klik **Download**

---

## Catatan Penting

- Pastikan foto **tidak menyertakan wajah tanpa izin** dari klien
- Simpan izin penggunaan foto dari tiap klien secara tertulis
- Foto dengan watermark tidak disarankan — terlihat tidak profesional
- Ganti alt text di `lib/portfolio.ts` sesuai isi foto yang sebenarnya
  (alt text penting untuk SEO dan aksesibilitas)
