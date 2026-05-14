-- ================================================================
-- DESARA HOME STUDIO — Cleanup & Migrasi Database Lama
-- Jalankan di Supabase SQL Editor SECARA BERURUTAN
-- Gunakan file ini jika sudah ada database lama yang perlu di-upgrade.
-- Untuk database baru, gunakan SCHEMA_FINAL.sql saja.
-- ================================================================


-- ================================================================
-- BAGIAN 1: TRUNCATE DATA TRANSAKSI
-- (Hapus semua data tes/lama, konfigurasi tetap tersimpan)
-- ================================================================

-- bookings + CASCADE → booking_addons, booking_reschedule_log ikut terhapus
TRUNCATE TABLE bookings RESTART IDENTITY CASCADE;
TRUNCATE TABLE clients       RESTART IDENTITY CASCADE;
TRUNCATE TABLE pengeluaran   RESTART IDENTITY CASCADE;
TRUNCATE TABLE broadcast_log RESTART IDENTITY CASCADE;
TRUNCATE TABLE settings_log  RESTART IDENTITY CASCADE;

-- Yang TIDAK dihapus (konfigurasi tetap):
-- settings, staff_upah, kategori_pengeluaran, pengeluaran_tetap,
-- pegawai_tetap, studio_backgrounds, testimoni, portfolio


-- ================================================================
-- BAGIAN 2: HAPUS KOLOM LEGACY DI bookings
-- ================================================================

ALTER TABLE bookings DROP COLUMN IF EXISTS addons;
ALTER TABLE bookings DROP COLUMN IF EXISTS photographer;
ALTER TABLE bookings DROP COLUMN IF EXISTS editor;


-- ================================================================
-- BAGIAN 3: HAPUS KOLOM LEGACY DI pengeluaran
-- ================================================================

ALTER TABLE pengeluaran DROP COLUMN IF EXISTS kategori;


-- ================================================================
-- BAGIAN 4: UBAH kategori_sesi & kategori portfolio DARI ENUM KE TEXT
-- Setelah ini, kategori baru bisa ditambahkan hanya dengan ubah kode.
-- PENTING: Drop DEFAULT dulu sebelum ganti tipe, karena DEFAULT masih
-- menyimpan referensi ke tipe enum lama.
-- ================================================================

-- bookings.kategori_sesi (tidak punya DEFAULT, langsung ganti tipe)
ALTER TABLE bookings
  ALTER COLUMN kategori_sesi TYPE TEXT USING kategori_sesi::TEXT;

-- portfolio.kategori (punya DEFAULT 'semua' dengan tipe enum → harus drop dulu)
ALTER TABLE portfolio ALTER COLUMN kategori DROP DEFAULT;
ALTER TABLE portfolio ALTER COLUMN kategori TYPE TEXT USING kategori::TEXT;
ALTER TABLE portfolio ALTER COLUMN kategori SET DEFAULT 'semua';


-- ================================================================
-- BAGIAN 5: HAPUS TABEL & ENUM TYPES YANG TIDAK DIPAKAI
-- ================================================================

DROP TABLE IF EXISTS notifikasi_log;

DROP TYPE IF EXISTS photographer_enum;
DROP TYPE IF EXISTS jenis_notifikasi_enum;
DROP TYPE IF EXISTS status_notifikasi_enum;
DROP TYPE IF EXISTS kategori_pengeluaran_enum;
-- Kolom sudah diubah ke TEXT di Bagian 4, enum ini aman dihapus
DROP TYPE IF EXISTS kategori_sesi_enum;
DROP TYPE IF EXISTS kategori_portfolio_enum;


-- ================================================================
-- BAGIAN 6: TAMBAH TABEL YANG MUNGKIN BELUM ADA
-- ================================================================

-- admin_profiles (dibutuhkan untuk login admin)
DO $$ BEGIN
  CREATE TYPE role_admin_enum AS ENUM ('owner', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS admin_profiles (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nama       TEXT    NOT NULL,
  role       role_admin_enum NOT NULL DEFAULT 'admin',
  aktif      BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_profiles_user_id ON admin_profiles(user_id);

ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_profiles_select_own" ON admin_profiles;
CREATE POLICY "admin_profiles_select_own" ON admin_profiles
  FOR SELECT USING (auth.uid() = user_id);


-- ================================================================
-- BAGIAN 7: TAMBAH PAKET COUPLE & CUSTOM KE SETTINGS
-- ================================================================

INSERT INTO settings (key, kategori, deskripsi, value)
VALUES (
  'paket_couple', 'paket', 'Paket foto couple', '{
    "id": "couple",
    "nama": "Couple",
    "kategori": "couple",
    "harga": 350000,
    "durasiMenit": 30,
    "jumlahBackground": 1,
    "maxOrang": 2,
    "cetakInclude": null,
    "popular": false,
    "aktif": true,
    "hargaMulaiDari": true
  }'::jsonb
) ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, kategori, deskripsi, value)
VALUES (
  'paket_custom', 'paket', 'Paket sesi custom (admin only)', '{
    "id": "custom",
    "nama": "Custom",
    "kategori": "custom",
    "harga": 350000,
    "durasiMenit": 45,
    "jumlahBackground": 2,
    "maxOrang": null,
    "cetakInclude": null,
    "popular": false,
    "aktif": true,
    "hargaMulaiDari": true
  }'::jsonb
) ON CONFLICT (key) DO NOTHING;


-- ================================================================
-- BAGIAN 8: PASTIKAN REALTIME AKTIF (idempotent)
-- ================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'booking_reschedule_log'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE booking_reschedule_log;
  END IF;
END $$;


-- ================================================================
-- BAGIAN 9: SETUP ADMIN PERTAMA (jika belum ada)
-- ================================================================
-- Setelah script ini selesai, buat akun admin jika belum ada:
--   1. Supabase Dashboard → Authentication → Users → Add user
--   2. Isi email + password untuk Uti Hirzy
--   3. Copy UUID user yang baru dibuat
--   4. Jalankan SQL ini (ganti UUID-nya):
--
-- INSERT INTO admin_profiles (user_id, nama, role)
-- VALUES ('GANTI-DENGAN-UUID-USER', 'Uti Hirzy', 'owner')
-- ON CONFLICT (user_id) DO NOTHING;


-- ================================================================
-- VERIFIKASI — Jalankan query ini untuk cek hasilnya
-- ================================================================

-- Cek tipe kolom kategori_sesi (harus 'text', bukan 'USER-DEFINED'):
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'bookings' AND column_name = 'kategori_sesi';

-- Cek kolom bookings (tidak boleh ada: addons, photographer, editor):
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'bookings' AND table_schema = 'public'
-- ORDER BY ordinal_position;

-- Cek enum types yang tersisa:
-- SELECT typname FROM pg_type WHERE typtype = 'e'
-- AND typnamespace = 'public'::regnamespace ORDER BY typname;
