# Desara Home Studio - Website Management System

## Tentang Project
Website management untuk studio foto Desara Home Studio.
Tujuan: menggantikan booking via WhatsApp manual dengan sistem
online yang terintegrasi (booking client + admin panel + laporan
keuangan)
Memudahkan dalam pekerjaan admin.

## Tech Stack (Pilihan)
- Framework: Next.js 14 (App Router) dengan TypeScript
- Styling: Tailwind CSS + shadcn/ui
- Database: Supabase (PostgreSQL) - free tier
- Auth: Supabase Auth (email/password untuk admin)
- Hosting: Vercel (free tier)
- WhatsApp Gateway: Fonnte API
- Payment: Manual transfer + bukti upload (tahap awal)

## Bisnis Context

## Paket Studio (Update)

### SESI WISUDA
- Bronze: Rp 300.000 (30 menit, 2 background, max 6 orang)
- Silver: Rp 550.000 (30 menit, 2 background, max 6 orang,
  cetak 12R + frame)
- Gold: Rp 900.000 (45 menit, 3 background, max 10 orang,
  cetak 20R + frame)

### SESI PREWEDDING
- Mulai dari Rp 750.000 (90 menit, 1 background)

### SESI KELUARGA
- Mulai dari Rp 450.000 (40 menit, 2 background, max 6 orang)

### SESI GROUP
- Mulai dari Rp 550.000 (40 menit, 2 background, max 10 orang)

### SESI PORTRAIT
- Mulai dari Rp 250.000 (30 menit, 1 background)

### Yang Include di SEMUA Paket
- All edit foto (semua foto sudah di-edit, bukan cuma file mentah)
- Link foto dikirim via Google Drive max 1x12 jam setelah sesi

### Add-on (Tambahan)
- Tambahan waktu: Rp 150.000 per 10 menit
- Tambahan orang: Rp 20.000 per orang
- Tambahan background: Rp 100.000 per background
- Cetak 12R + frame: Rp 150.000
- Cetak 20R + frame: Rp 400.000

### Background Tersedia (6 pilihan)
- BG Utama
- BG Abstrak
- BG Bunga
- BG Merah
- BG Putih
- BG Hitam


### Operasional
- Jam buka: 10.00 - 21.00 WIB
- Background tersedia: 4 (bisa booking paralel)
- DP minimum: Rp 100.000
- Editing: 1x12 jam (reguler) / 1x24 jam (Prewed)

### Staff
- Manager: [Uti Hirzy]
- Admin: Erni (upah Rp 50.000/hari saat ada jadwal)
- Photographer 1: Eji (upah Rp 50.000/client)
- Photographer 2: Tyo (upah Rp 35.000/client)
- Editor: Edwin (upah Rp 30.000/client)

### Biaya Tetap Bulanan
- Wifi: Rp 300.000
- PDAM: Rp 100.000
- IPL: Rp 200.000
- Listrik: Rp 500.000

## Fitur Yang Dibutuhkan

### Untuk Client (Public)
1. Landing page (portfolio, harga paket, testimoni)
2. Form booking online (pilih paket, tanggal, jam,
   background, isi data)
3. Cek slot real-time (anti-bentrok)
4. Hitung total tagihan + DP otomatis
5. Halaman konfirmasi + info transfer DP
6. Upload bukti transfer

### Untuk Admin (Login Required)
1. Dashboard (KPI hari ini, booking minggu ini)
2. List semua booking (filter: tanggal, status, paket)
3. Update status booking (Booked > DP OK > Selesai Foto >
   Selesai Edit > Diambil)
4. Konfirmasi pembayaran (verifikasi bukti transfer)
5. Kirim WhatsApp ke client (template terisi otomatis)
6. Database client (untuk repeat order)
7. Laporan keuangan bulanan (omzet, HPP, biaya, profit)

## Status Sesi (State Machine)
Booked > DP OK > Selesai Foto > Selesai Edit > Diambil
Cancel bisa terjadi di state mana saja.

## Konvensi Kode
- Gunakan TypeScript untuk type safety
- Component naming: PascalCase
- File naming: kebab-case
- Format Rupiah: gunakan Intl.NumberFormat('id-ID')
- Tanggal/jam: gunakan timezone Asia/Jakarta
- Tulis komentar dalam Bahasa Indonesia

## Saya Bukan Programmer
Saya manager studio, bukan developer. Tolong:
- Jelaskan setiap langkah dalam Bahasa Indonesia
- Beri perintah terminal yang lengkap (saya tinggal copy-paste)
- Hindari jargon teknis kecuali penting
- Test kode setelah ditulis, perbaiki kalau error
- Kalau ada pilihan teknologi, kasih rekomendasi (jangan
  tanya saya yang teknis)

  ## Status Project
- Fase 1 SELESAI: Landing page, section paket, section
  portfolio (placeholder), section background
- Sedang dikerjakan: Fase 2 (Backend, Database, Admin Panel)

## Catatan Penting
- Foto portfolio akan di-upload via admin dashboard
  (BUKAN hardcode di lib/portfolio.ts)
- Editing waktu cepat: 1x12 jam reguler, 1x24 jam Prewed
- Manager: Uti Hirzy

## Halaman Admin Lengkap

Setelah Fase 2 selesai, struktur admin:

/admin/dashboard - Home & KPI
/admin/bookings - Manajemen booking + add-on
/admin/clients - Database client + broadcast WA
/admin/portfolio - Upload portfolio
/admin/keuangan - Laporan keuangan
/admin/pengeluaran - Kelola pengeluaran (3 tab)
/admin/settings - Konfigurasi semua

## Konsep Penting

1. SEMUA data dinamis dari database, tidak ada hardcode
2. Settings di-cache, invalidate saat ada perubahan
3. Pengeluaran tetap auto-generate tiap bulan
4. Client database auto-update via trigger
5. Add-on lapangan terpisah dari add-on booking awal

## Permission

- Manager (Uti Hirzy): full access
- Admin (Erni): semua kecuali /admin/settings
- Multi-user staff: nanti kalau butuh
lanjut