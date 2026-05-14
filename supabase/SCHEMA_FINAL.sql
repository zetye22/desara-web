-- ================================================================
-- DESARA HOME STUDIO — Schema Final (Bersih)
-- Untuk fresh setup Supabase baru (tanpa legacy columns)
-- Cara pakai: Copy semua → paste di Supabase SQL Editor → Run
-- ================================================================


-- ================================================================
-- LANGKAH 1: ENUM TYPES
-- CATATAN: kategori_sesi & kategori portfolio disimpan sebagai TEXT
-- sehingga kategori baru bisa ditambahkan tanpa ALTER TYPE (hanya ubah kode)
-- ================================================================

DO $$ BEGIN
  CREATE TYPE status_pembayaran_enum AS ENUM ('belum_dp','dp_ok','lunas');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  -- 'pending' = menunggu DP, 'booked' = sudah DP, dst
  CREATE TYPE status_sesi_enum AS ENUM ('pending','booked','selesai_foto','selesai_edit','diambil','cancel');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE addon_source AS ENUM ('booking_awal','lapangan');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE addon_jenis AS ENUM (
    'tambahan_waktu','tambahan_orang','tambahan_background',
    'cetak_12r','cetak_20r','lainnya'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE role_admin_enum AS ENUM ('owner', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ================================================================
-- LANGKAH 2: TABEL KONFIGURASI (dibuat lebih dulu)
-- ================================================================

-- ── staff_upah ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff_upah (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nama             TEXT        NOT NULL,
  role             TEXT        NOT NULL CHECK (role IN ('photographer','editor')),
  upah_per_client  INTEGER     NOT NULL DEFAULT 0,
  no_wa            TEXT,
  aktif            BOOLEAN     NOT NULL DEFAULT true,
  catatan          TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE staff_upah ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_kelola_staff_upah" ON staff_upah;
CREATE POLICY "admin_kelola_staff_upah" ON staff_upah
  FOR ALL USING (auth.role() = 'authenticated');

-- ── kategori_pengeluaran ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kategori_pengeluaran (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nama       TEXT        NOT NULL,
  tipe       TEXT        NOT NULL DEFAULT 'operasional'
             CHECK (tipe IN ('operasional','hpp','aset')),
  icon       TEXT        NOT NULL DEFAULT 'receipt',
  warna      TEXT        NOT NULL DEFAULT '#6B7280',
  aktif      BOOLEAN     NOT NULL DEFAULT true,
  urutan     INT         NOT NULL DEFAULT 99,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE kategori_pengeluaran ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_kategori" ON kategori_pengeluaran;
CREATE POLICY "public_read_kategori" ON kategori_pengeluaran
  FOR SELECT USING (true);

-- ── studio_backgrounds ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS studio_backgrounds (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nama       TEXT        NOT NULL,
  warna      TEXT        NOT NULL DEFAULT '#CCCCCC',
  aktif      BOOLEAN     NOT NULL DEFAULT true,
  urutan     INT         NOT NULL DEFAULT 99,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE studio_backgrounds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_baca_backgrounds" ON studio_backgrounds;
CREATE POLICY "public_baca_backgrounds" ON studio_backgrounds
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "admin_kelola_backgrounds" ON studio_backgrounds;
CREATE POLICY "admin_kelola_backgrounds" ON studio_backgrounds
  FOR ALL USING (auth.role() = 'authenticated');

-- ── settings ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  key         TEXT    PRIMARY KEY,
  value       JSONB   NOT NULL,
  kategori    TEXT    NOT NULL DEFAULT 'umum',
  deskripsi   TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by  UUID    REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_baca_settings" ON settings;
CREATE POLICY "public_baca_settings" ON settings
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "admin_update_settings" ON settings;
CREATE POLICY "admin_update_settings" ON settings
  FOR ALL USING (auth.role() = 'authenticated');

-- ── settings_log ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings_log (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key  TEXT        NOT NULL,
  value_lama   JSONB,
  value_baru   JSONB       NOT NULL,
  diubah_oleh  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  diubah_pada  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_settings_log_key  ON settings_log(setting_key);
CREATE INDEX IF NOT EXISTS idx_settings_log_pada ON settings_log(diubah_pada DESC);

ALTER TABLE settings_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_baca_settings_log" ON settings_log;
CREATE POLICY "admin_baca_settings_log" ON settings_log
  FOR SELECT USING (auth.role() = 'authenticated');

-- ── pengeluaran_tetap ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pengeluaran_tetap (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  kategori_id  UUID        REFERENCES kategori_pengeluaran(id) ON DELETE SET NULL,
  nama         TEXT        NOT NULL,
  nominal      BIGINT      NOT NULL DEFAULT 0,
  aktif        BOOLEAN     NOT NULL DEFAULT true,
  urutan       INT         NOT NULL DEFAULT 99,
  catatan      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE pengeluaran_tetap ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_tetap" ON pengeluaran_tetap;
CREATE POLICY "public_read_tetap" ON pengeluaran_tetap
  FOR SELECT USING (true);

-- ── pegawai_tetap ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pegawai_tetap (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  nama             TEXT    NOT NULL,
  posisi           TEXT    NOT NULL,
  gaji_bulanan     INTEGER NOT NULL DEFAULT 0,
  tanggal_gajian   INTEGER NOT NULL DEFAULT 1 CHECK (tanggal_gajian BETWEEN 1 AND 28),
  no_wa            TEXT,
  no_rekening      TEXT,
  bank             TEXT,
  aktif            BOOLEAN NOT NULL DEFAULT true,
  tanggal_mulai    DATE    NOT NULL DEFAULT CURRENT_DATE,
  tanggal_berhenti DATE,
  catatan          TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE pegawai_tetap ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_kelola_pegawai_tetap" ON pegawai_tetap;
CREATE POLICY "admin_kelola_pegawai_tetap" ON pegawai_tetap
  FOR ALL USING (auth.role() = 'authenticated');

-- ── testimoni ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS testimoni (
  id         UUID       DEFAULT gen_random_uuid() PRIMARY KEY,
  nama       TEXT       NOT NULL,
  paket      TEXT       NOT NULL,
  teks       TEXT       NOT NULL,
  bintang    SMALLINT   NOT NULL DEFAULT 5 CHECK (bintang BETWEEN 1 AND 5),
  inisial    VARCHAR(3) NOT NULL,
  urutan     INT        NOT NULL DEFAULT 0,
  aktif      BOOLEAN    NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_testimoni_aktif_urutan ON testimoni(aktif, urutan);


-- ================================================================
-- LANGKAH 3: TABEL TRANSAKSI
-- ================================================================

-- ── clients ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id                UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  nama              TEXT    NOT NULL,
  no_wa             TEXT    UNIQUE NOT NULL,
  email             TEXT,
  total_booking     INTEGER NOT NULL DEFAULT 0,
  total_spending    INTEGER NOT NULL DEFAULT 0,
  last_booking_date DATE,
  tags              TEXT[]  NOT NULL DEFAULT ARRAY[]::TEXT[],
  catatan           TEXT,
  is_blacklist      BOOLEAN NOT NULL DEFAULT false,
  alasan_blacklist  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_no_wa          ON clients(no_wa);
CREATE INDEX IF NOT EXISTS idx_clients_total_booking  ON clients(total_booking DESC);
CREATE INDEX IF NOT EXISTS idx_clients_total_spending ON clients(total_spending DESC);
CREATE INDEX IF NOT EXISTS idx_clients_last_booking   ON clients(last_booking_date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_clients_blacklist       ON clients(is_blacklist);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_kelola_clients" ON clients;
CREATE POLICY "admin_kelola_clients" ON clients
  FOR ALL USING (auth.role() = 'authenticated');

-- ── bookings ─────────────────────────────────────────────────────
-- BERSIH: tanpa kolom legacy (addons jsonb, photographer enum, editor text)
CREATE TABLE IF NOT EXISTS bookings (
  id                  UUID   PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_booking        TEXT   UNIQUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Data client
  nama_client         TEXT   NOT NULL,
  no_wa               TEXT   NOT NULL,
  email               TEXT,
  catatan             TEXT,

  -- Detail sesi
  -- TEXT (bukan enum) agar kategori baru tidak perlu ALTER TYPE di database
  kategori_sesi       TEXT NOT NULL,
  paket_id            TEXT   NOT NULL,
  nama_paket          TEXT   NOT NULL,
  tgl_foto            DATE   NOT NULL,
  jam_mulai           TIME   NOT NULL,
  jam_selesai         TIME   NOT NULL,
  jumlah_orang        INTEGER NOT NULL DEFAULT 1,
  background_dipilih  TEXT[] NOT NULL DEFAULT '{}',

  -- Keuangan
  subtotal_paket      INTEGER NOT NULL,
  subtotal_addon      INTEGER NOT NULL DEFAULT 0,
  total_tagihan       INTEGER NOT NULL,
  dp_dibayar          INTEGER NOT NULL DEFAULT 0,
  bukti_transfer_url  TEXT,
  metode_pelunasan    TEXT,
  tgl_dp              DATE,

  -- Status
  status_pembayaran   status_pembayaran_enum NOT NULL DEFAULT 'belum_dp',
  status_sesi         status_sesi_enum       NOT NULL DEFAULT 'pending',

  -- Staff (FK ke staff_upah)
  photographer_1_id   UUID    REFERENCES staff_upah(id) ON DELETE SET NULL,
  photographer_2_id   UUID    REFERENCES staff_upah(id) ON DELETE SET NULL,
  editor_id           UUID    REFERENCES staff_upah(id) ON DELETE SET NULL,
  upah_pg1            INTEGER NOT NULL DEFAULT 0,
  upah_pg2            INTEGER NOT NULL DEFAULT 0,
  upah_editor         INTEGER NOT NULL DEFAULT 0,
  total_upah_staff    INTEGER NOT NULL DEFAULT 0,

  created_by_admin    BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_bookings_tgl_foto        ON bookings(tgl_foto);
CREATE INDEX IF NOT EXISTS idx_bookings_tgl_status      ON bookings(tgl_foto, status_sesi);
CREATE INDEX IF NOT EXISTS idx_bookings_status_sesi     ON bookings(status_sesi);
CREATE INDEX IF NOT EXISTS idx_bookings_status_pembayaran ON bookings(status_pembayaran);
CREATE INDEX IF NOT EXISTS idx_bookings_no_wa           ON bookings(no_wa);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at      ON bookings(created_at) WHERE status_sesi = 'pending';
CREATE INDEX IF NOT EXISTS idx_bookings_pg1             ON bookings(photographer_1_id);
CREATE INDEX IF NOT EXISTS idx_bookings_pg2             ON bookings(photographer_2_id);
CREATE INDEX IF NOT EXISTS idx_bookings_editor          ON bookings(editor_id);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "client_bisa_booking" ON bookings;
CREATE POLICY "client_bisa_booking" ON bookings
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "admin_kelola_bookings" ON bookings;
CREATE POLICY "admin_kelola_bookings" ON bookings
  FOR ALL USING (auth.role() = 'authenticated');

-- ── booking_addons ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS booking_addons (
  id                UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id        UUID    NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  jenis             addon_jenis NOT NULL,
  nama_item         TEXT    NOT NULL,
  qty               INTEGER NOT NULL DEFAULT 1 CHECK (qty > 0),
  harga_satuan      INTEGER NOT NULL CHECK (harga_satuan >= 0),
  subtotal          INTEGER NOT NULL CHECK (subtotal >= 0),
  source            addon_source NOT NULL DEFAULT 'booking_awal',
  catatan           TEXT,
  ditambahkan_oleh  UUID    REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_addons_booking        ON booking_addons(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_addons_source         ON booking_addons(source);
CREATE INDEX IF NOT EXISTS idx_booking_addons_booking_source ON booking_addons(booking_id, source);

ALTER TABLE booking_addons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_kelola_booking_addons" ON booking_addons;
CREATE POLICY "admin_kelola_booking_addons" ON booking_addons
  FOR ALL USING (auth.role() = 'authenticated');

-- ── booking_reschedule_log ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS booking_reschedule_log (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id       UUID    NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  tgl_foto_lama    DATE    NOT NULL,
  jam_mulai_lama   TIME    NOT NULL,
  jam_selesai_lama TIME    NOT NULL,
  tgl_foto_baru    DATE    NOT NULL,
  jam_mulai_baru   TIME    NOT NULL,
  jam_selesai_baru TIME    NOT NULL,
  alasan           TEXT,
  oleh_admin       UUID    REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reschedule_log_booking_id ON booking_reschedule_log(booking_id);

ALTER TABLE booking_reschedule_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_kelola_reschedule_log" ON booking_reschedule_log;
CREATE POLICY "admin_kelola_reschedule_log" ON booking_reschedule_log
  FOR ALL USING (auth.role() = 'authenticated');

-- ── pengeluaran ──────────────────────────────────────────────────
-- BERSIH: tanpa kolom legacy 'kategori' enum, pakai kategori_id FK
CREATE TABLE IF NOT EXISTS pengeluaran (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  tanggal       DATE    NOT NULL,
  kategori_id   UUID    REFERENCES kategori_pengeluaran(id) ON DELETE SET NULL,
  deskripsi     TEXT,
  nominal       INTEGER NOT NULL,
  catatan       TEXT,
  bukti_url     TEXT,
  is_recurring  BOOLEAN NOT NULL DEFAULT false,
  recurring_id  UUID,
  bulan_periode TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pengeluaran_periode ON pengeluaran(bulan_periode);

ALTER TABLE pengeluaran ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_kelola_pengeluaran" ON pengeluaran;
CREATE POLICY "admin_kelola_pengeluaran" ON pengeluaran
  FOR ALL USING (auth.role() = 'authenticated');

-- ── portfolio ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolio (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  image_url     TEXT    NOT NULL,
  thumbnail_url TEXT,
  alt_text      TEXT    NOT NULL,
  kategori      TEXT NOT NULL DEFAULT 'semua',
  urutan        INTEGER NOT NULL DEFAULT 0,
  aktif         BOOLEAN NOT NULL DEFAULT true,
  caption       TEXT,
  uploaded_by   UUID    REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_portfolio_display ON portfolio(kategori, aktif, urutan);

ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_lihat_portfolio" ON portfolio;
CREATE POLICY "public_lihat_portfolio" ON portfolio
  FOR SELECT USING (aktif = true);
DROP POLICY IF EXISTS "admin_kelola_portfolio" ON portfolio;
CREATE POLICY "admin_kelola_portfolio" ON portfolio
  FOR ALL USING (auth.role() = 'authenticated');

-- ── admin_profiles ───────────────────────────────────────────────
-- Profil admin linked ke auth.users (login via Supabase Auth)
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

-- ── broadcast_log ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS broadcast_log (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_id    UUID    REFERENCES clients(id) ON DELETE SET NULL,
  no_wa        TEXT    NOT NULL,
  pesan        TEXT    NOT NULL,
  status       TEXT    NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','sent','failed')),
  error_msg    TEXT,
  sent_at      TIMESTAMPTZ,
  broadcast_id UUID,
  dikirim_oleh UUID    REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_broadcast_log_client  ON broadcast_log(client_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_log_bcast   ON broadcast_log(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_log_created ON broadcast_log(created_at DESC);

ALTER TABLE broadcast_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_kelola_broadcast_log" ON broadcast_log;
CREATE POLICY "admin_kelola_broadcast_log" ON broadcast_log
  FOR ALL USING (auth.role() = 'authenticated');


-- ================================================================
-- LANGKAH 4: FUNCTIONS & TRIGGERS
-- ================================================================

-- ── auto-update updated_at ───────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_bookings     ON bookings;
CREATE TRIGGER set_updated_at_bookings
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_portfolio    ON portfolio;
CREATE TRIGGER set_updated_at_portfolio
  BEFORE UPDATE ON portfolio
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_settings     ON settings;
CREATE TRIGGER set_updated_at_settings
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS trg_pengeluaran_updated_at  ON pengeluaran;
CREATE TRIGGER trg_pengeluaran_updated_at
  BEFORE UPDATE ON pengeluaran
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS trg_pengeluaran_tetap_updated_at ON pengeluaran_tetap;
CREATE TRIGGER trg_pengeluaran_tetap_updated_at
  BEFORE UPDATE ON pengeluaran_tetap
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS trg_pegawai_updated_at ON pegawai_tetap;
CREATE TRIGGER trg_pegawai_updated_at
  BEFORE UPDATE ON pegawai_tetap
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ── auto-generate kode_booking ───────────────────────────────────
CREATE OR REPLACE FUNCTION generate_kode_booking()
RETURNS TRIGGER AS $$
DECLARE
  v_tanggal TEXT;
  v_urutan  INTEGER;
  v_kode    TEXT;
BEGIN
  v_tanggal := to_char(NOW() AT TIME ZONE 'Asia/Jakarta', 'YYYYMMDD');
  SELECT COUNT(*) + 1 INTO v_urutan
  FROM bookings
  WHERE to_char(created_at AT TIME ZONE 'Asia/Jakarta', 'YYYYMMDD') = v_tanggal;
  v_kode := 'DSR-' || v_tanggal || '-' || lpad(v_urutan::text, 3, '0');
  NEW.kode_booking := v_kode;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auto_kode_booking ON bookings;
CREATE TRIGGER auto_kode_booking
  BEFORE INSERT ON bookings
  FOR EACH ROW
  WHEN (NEW.kode_booking IS NULL)
  EXECUTE FUNCTION generate_kode_booking();


-- ── auto-sync data client dari booking ──────────────────────────
CREATE OR REPLACE FUNCTION sync_client_from_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO clients (
      id, nama, no_wa, email,
      total_booking, total_spending,
      last_booking_date, created_at
    )
    VALUES (
      gen_random_uuid(),
      NEW.nama_client,
      NEW.no_wa,
      NEW.email,
      1,
      NEW.total_tagihan,
      NEW.tgl_foto,
      NOW()
    )
    ON CONFLICT (no_wa) DO UPDATE SET
      nama              = EXCLUDED.nama,
      email             = COALESCE(EXCLUDED.email, clients.email),
      total_booking     = clients.total_booking + 1,
      total_spending    = clients.total_spending + EXCLUDED.total_spending,
      last_booking_date = GREATEST(clients.last_booking_date, EXCLUDED.last_booking_date);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_client_on_booking ON bookings;
CREATE TRIGGER sync_client_on_booking
  AFTER INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION sync_client_from_booking();


-- ── auto-update total tagihan saat addon berubah ─────────────────
CREATE OR REPLACE FUNCTION update_booking_total()
RETURNS TRIGGER AS $$
DECLARE
  v_booking_id     UUID;
  v_subtotal_addon INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_booking_id := OLD.booking_id;
  ELSE
    v_booking_id := NEW.booking_id;
  END IF;
  SELECT COALESCE(SUM(subtotal), 0)
  INTO v_subtotal_addon
  FROM booking_addons
  WHERE booking_id = v_booking_id;
  UPDATE bookings
  SET
    subtotal_addon = v_subtotal_addon,
    total_tagihan  = subtotal_paket + v_subtotal_addon,
    updated_at     = now()
  WHERE id = v_booking_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_addon_update_total ON booking_addons;
CREATE TRIGGER trg_addon_update_total
  AFTER INSERT OR UPDATE OR DELETE ON booking_addons
  FOR EACH ROW EXECUTE FUNCTION update_booking_total();


-- ── auto-fill upah staff dari master + recalculate total ─────────
CREATE OR REPLACE FUNCTION sync_upah_staff()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.photographer_1_id IS DISTINCT FROM OLD.photographer_1_id
     AND NEW.upah_pg1 = OLD.upah_pg1 THEN
    NEW.upah_pg1 := COALESCE(
      (SELECT upah_per_client FROM staff_upah WHERE id = NEW.photographer_1_id), 0
    );
  END IF;
  IF NEW.photographer_2_id IS DISTINCT FROM OLD.photographer_2_id
     AND NEW.upah_pg2 = OLD.upah_pg2 THEN
    NEW.upah_pg2 := COALESCE(
      (SELECT upah_per_client FROM staff_upah WHERE id = NEW.photographer_2_id), 0
    );
  END IF;
  IF NEW.editor_id IS DISTINCT FROM OLD.editor_id
     AND NEW.upah_editor = OLD.upah_editor THEN
    NEW.upah_editor := COALESCE(
      (SELECT upah_per_client FROM staff_upah WHERE id = NEW.editor_id), 0
    );
  END IF;
  NEW.total_upah_staff := NEW.upah_pg1 + NEW.upah_pg2 + NEW.upah_editor;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_upah_staff ON bookings;
CREATE TRIGGER trg_sync_upah_staff
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION sync_upah_staff();


-- ── auto-set bulan_periode dari tanggal pengeluaran ──────────────
CREATE OR REPLACE FUNCTION fn_set_bulan_periode()
RETURNS TRIGGER AS $$
BEGIN
  NEW.bulan_periode := TO_CHAR(NEW.tanggal::DATE, 'YYYY-MM');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_bulan_periode ON pengeluaran;
CREATE TRIGGER trg_set_bulan_periode
  BEFORE INSERT OR UPDATE OF tanggal ON pengeluaran
  FOR EACH ROW EXECUTE FUNCTION fn_set_bulan_periode();


-- ── auto-log perubahan settings ──────────────────────────────────
CREATE OR REPLACE FUNCTION log_settings_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.value IS DISTINCT FROM NEW.value THEN
    INSERT INTO settings_log (setting_key, value_lama, value_baru, diubah_oleh)
    VALUES (NEW.key, OLD.value, NEW.value, NEW.updated_by);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_settings_log ON settings;
CREATE TRIGGER trg_settings_log
  AFTER UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION log_settings_change();


-- ================================================================
-- LANGKAH 5: STORED FUNCTIONS
-- ================================================================

-- ── Hitung HPP cetak per bulan ───────────────────────────────────
CREATE OR REPLACE FUNCTION hitung_hpp_cetak(bulan_tahun text)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result         json;
  bulan_mulai    date;
  bulan_akhir    date;
  jumlah_silver  integer;
  jumlah_gold    integer;
  addon_12r      integer;
  addon_20r      integer;
  hpp_12r_satuan integer := 150000;
  hpp_20r_satuan integer := 400000;
BEGIN
  bulan_mulai := (bulan_tahun || '-01')::date;
  bulan_akhir := (bulan_mulai + interval '1 month' - interval '1 day')::date;
  SELECT COUNT(*)::int INTO jumlah_silver
  FROM bookings
  WHERE tgl_foto BETWEEN bulan_mulai AND bulan_akhir
    AND status_sesi != 'cancel'
    AND nama_paket ILIKE '%Silver%';
  SELECT COUNT(*)::int INTO jumlah_gold
  FROM bookings
  WHERE tgl_foto BETWEEN bulan_mulai AND bulan_akhir
    AND status_sesi != 'cancel'
    AND nama_paket ILIKE '%Gold%';
  SELECT COALESCE(SUM(ba.qty), 0)::int INTO addon_12r
  FROM booking_addons ba
  JOIN bookings b ON b.id = ba.booking_id
  WHERE b.tgl_foto BETWEEN bulan_mulai AND bulan_akhir
    AND b.status_sesi != 'cancel'
    AND ba.jenis = 'cetak_12r';
  SELECT COALESCE(SUM(ba.qty), 0)::int INTO addon_20r
  FROM booking_addons ba
  JOIN bookings b ON b.id = ba.booking_id
  WHERE b.tgl_foto BETWEEN bulan_mulai AND bulan_akhir
    AND b.status_sesi != 'cancel'
    AND ba.jenis = 'cetak_20r';
  SELECT json_build_object(
    'periode', bulan_tahun,
    'cetak_12r', json_build_object(
      'dari_paket_silver', jumlah_silver,
      'dari_addon',        addon_12r,
      'total_unit',        jumlah_silver + addon_12r,
      'hpp_satuan',        hpp_12r_satuan,
      'total_hpp',         (jumlah_silver + addon_12r) * hpp_12r_satuan
    ),
    'cetak_20r', json_build_object(
      'dari_paket_gold', jumlah_gold,
      'dari_addon',      addon_20r,
      'total_unit',      jumlah_gold + addon_20r,
      'hpp_satuan',      hpp_20r_satuan,
      'total_hpp',       (jumlah_gold + addon_20r) * hpp_20r_satuan
    ),
    'total_hpp_cetak',
      (jumlah_silver + addon_12r) * hpp_12r_satuan +
      (jumlah_gold + addon_20r) * hpp_20r_satuan
  ) INTO result;
  RETURN result;
END;
$$;


-- ================================================================
-- LANGKAH 6: STORAGE BUCKETS
-- ================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bukti-transfer', 'bukti-transfer', false, 5242880,
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio', 'portfolio', true, 10485760,
  ARRAY['image/jpeg','image/png','image/webp']
) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_lihat_foto_portfolio"  ON storage.objects;
CREATE POLICY "public_lihat_foto_portfolio" ON storage.objects
  FOR SELECT USING (bucket_id = 'portfolio');

DROP POLICY IF EXISTS "admin_kelola_foto_portfolio"  ON storage.objects;
CREATE POLICY "admin_kelola_foto_portfolio" ON storage.objects
  FOR ALL USING (bucket_id = 'portfolio' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "client_upload_bukti" ON storage.objects;
CREATE POLICY "client_upload_bukti" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'bukti-transfer');

DROP POLICY IF EXISTS "admin_kelola_bukti_transfer"  ON storage.objects;
CREATE POLICY "admin_kelola_bukti_transfer" ON storage.objects
  FOR ALL USING (bucket_id = 'bukti-transfer' AND auth.role() = 'authenticated');


-- ================================================================
-- LANGKAH 7: REALTIME
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
-- LANGKAH 8: SEED DATA KONFIGURASI
-- ================================================================

-- ── Staff ───────────────────────────────────────────────────────
INSERT INTO staff_upah (nama, role, upah_per_client) VALUES
  ('EZY',       'photographer', 50000),
  ('TYO',       'photographer', 35000),
  ('EDWIN',     'editor',       30000),
  ('Freelance', 'photographer', 0),
  ('Freelance', 'editor',       0)
ON CONFLICT DO NOTHING;

-- ── Kategori Pengeluaran ────────────────────────────────────────
INSERT INTO kategori_pengeluaran (nama, tipe, icon, warna, urutan) VALUES
  ('Wifi',            'operasional', 'wifi',            '#3B82F6', 1),
  ('PDAM',            'operasional', 'droplets',        '#06B6D4', 2),
  ('IPL',             'operasional', 'building-2',      '#8B5CF6', 3),
  ('Listrik',         'operasional', 'zap',             '#F59E0B', 4),
  ('Cetak Foto',      'hpp',         'printer',         '#10B981', 5),
  ('Properti Studio', 'aset',        'package',         '#6366F1', 6),
  ('Maintenance',     'operasional', 'wrench',          '#EC4899', 7),
  ('Marketing',       'operasional', 'megaphone',       '#F97316', 8),
  ('Gaji',            'operasional', 'user',            '#6366f1', 9),
  ('Lainnya',         'operasional', 'more-horizontal', '#6B7280', 10)
ON CONFLICT DO NOTHING;

-- ── Pengeluaran Tetap Bulanan ───────────────────────────────────
INSERT INTO pengeluaran_tetap (nama, nominal, urutan, kategori_id)
SELECT 'Wifi',    300000, 1, id FROM kategori_pengeluaran WHERE nama = 'Wifi'    LIMIT 1
ON CONFLICT DO NOTHING;
INSERT INTO pengeluaran_tetap (nama, nominal, urutan, kategori_id)
SELECT 'PDAM',    100000, 2, id FROM kategori_pengeluaran WHERE nama = 'PDAM'    LIMIT 1
ON CONFLICT DO NOTHING;
INSERT INTO pengeluaran_tetap (nama, nominal, urutan, kategori_id)
SELECT 'IPL',     200000, 3, id FROM kategori_pengeluaran WHERE nama = 'IPL'     LIMIT 1
ON CONFLICT DO NOTHING;
INSERT INTO pengeluaran_tetap (nama, nominal, urutan, kategori_id)
SELECT 'Listrik', 500000, 4, id FROM kategori_pengeluaran WHERE nama = 'Listrik' LIMIT 1
ON CONFLICT DO NOTHING;

-- ── Pegawai Tetap ───────────────────────────────────────────────
INSERT INTO pegawai_tetap (nama, posisi, gaji_bulanan, tanggal_gajian)
SELECT 'Erni', 'Admin', 1500000, 1
WHERE NOT EXISTS (SELECT 1 FROM pegawai_tetap WHERE nama = 'Erni');

-- ── Studio Backgrounds ──────────────────────────────────────────
INSERT INTO studio_backgrounds (nama, warna, aktif, urutan) VALUES
  ('BG Utama',   '#D4C5A9', true, 1),
  ('BG Abstrak', '#A8C4D4', true, 2),
  ('BG Bunga',   '#F4A7B9', true, 3),
  ('BG Merah',   '#C53030', true, 4),
  ('BG Putih',   '#FFFFFF', true, 5),
  ('BG Hitam',   '#1A1A1A', true, 6)
ON CONFLICT DO NOTHING;

-- ── Testimoni Default ───────────────────────────────────────────
INSERT INTO testimoni (nama, paket, teks, bintang, inisial, urutan) VALUES
  ('Rina & Dika',      'Paket Gold',    'Hasilnya luar biasa! Foto prewedding kami terlihat sangat profesional. Tim photographer ramah dan sabar banget. Pasti balik lagi!', 5, 'RD', 1),
  ('Keluarga Santoso', 'Foto Keluarga', 'Studio bersih, nyaman, dan backgroundnya bagus-bagus. Anak-anak yang biasanya susah difoto malah enjoy banget. Harga juga sangat terjangkau.', 5, 'KS', 2),
  ('Melati',           'Paket Silver',  'Pelayanannya ramah, hasil edit fotonya cantik dan natural. Cetak 12R-nya juga bagus kualitasnya. Sangat rekomen untuk foto wisuda!', 5, 'ML', 3)
ON CONFLICT DO NOTHING;

-- ── Settings ────────────────────────────────────────────────────
INSERT INTO settings (key, kategori, deskripsi, value) VALUES
  ('jam_operasional', 'umum', 'Jam operasional studio', '{"mulai":"10:00","tutup":"21:00"}'::jsonb),
  ('jumlah_background', 'umum', 'Jumlah background tersedia', '4'::jsonb),
  ('dp_minimum', 'umum', 'DP minimum booking', '100000'::jsonb),
  ('rekening', 'umum', 'Rekening transfer pembayaran', '{
    "bank": "BCA",
    "nomor": "GANTI-NOMOR-REKENING",
    "nama": "GANTI-NAMA-PEMILIK"
  }'::jsonb),
  ('kontak', 'umum', 'Info kontak studio', '{
    "wa": "GANTI-NOMOR-WA-STUDIO",
    "alamat": "GANTI-ALAMAT-STUDIO",
    "ig": "@desarastudio"
  }'::jsonb),
  ('fonnte_token', 'sistem', 'Token Fonnte WhatsApp', '"GANTI-TOKEN-FONNTE"'::jsonb),
  ('operasional', 'umum', 'Pengaturan operasional studio', '{
    "jam_buka": "10:00",
    "jam_tutup": "21:00",
    "dp_minimum": 100000,
    "toleransi_terlambat": 15,
    "waktu_editing_reguler_jam": 12,
    "waktu_editing_prewed_jam": 24
  }'::jsonb),
  -- Paket wisuda
  ('paket_wisuda_bronze', 'paket', 'Paket wisuda Bronze', '{
    "id":"bronze-wisuda","nama":"Bronze","kategori":"wisuda",
    "harga":300000,"durasiMenit":30,"jumlahBackground":2,"maxOrang":6,
    "cetakInclude":null,"popular":false,"aktif":true,"hargaMulaiDari":false
  }'::jsonb),
  ('paket_wisuda_silver', 'paket', 'Paket wisuda Silver', '{
    "id":"silver-wisuda","nama":"Silver","kategori":"wisuda",
    "harga":550000,"durasiMenit":30,"jumlahBackground":2,"maxOrang":6,
    "cetakInclude":"12R","popular":true,"aktif":true,"hargaMulaiDari":false
  }'::jsonb),
  ('paket_wisuda_gold', 'paket', 'Paket wisuda Gold', '{
    "id":"gold-wisuda","nama":"Gold","kategori":"wisuda",
    "harga":900000,"durasiMenit":45,"jumlahBackground":3,"maxOrang":10,
    "cetakInclude":"20R","popular":false,"aktif":true,"hargaMulaiDari":false
  }'::jsonb),
  -- Paket lain
  ('paket_prewed',   'paket', 'Paket prewedding',     '{"id":"prewed",  "nama":"Prewedding","kategori":"prewed",  "harga":750000,"durasiMenit":90,"jumlahBackground":1,"maxOrang":null,"cetakInclude":null,"popular":false,"aktif":true,"hargaMulaiDari":true}'::jsonb),
  ('paket_keluarga', 'paket', 'Paket foto keluarga',  '{"id":"keluarga","nama":"Keluarga", "kategori":"keluarga","harga":450000,"durasiMenit":40,"jumlahBackground":2,"maxOrang":6,   "cetakInclude":null,"popular":false,"aktif":true,"hargaMulaiDari":true}'::jsonb),
  ('paket_group',    'paket', 'Paket foto group',     '{"id":"group",   "nama":"Group",    "kategori":"group",   "harga":550000,"durasiMenit":40,"jumlahBackground":2,"maxOrang":10,  "cetakInclude":null,"popular":false,"aktif":true,"hargaMulaiDari":true}'::jsonb),
  ('paket_portrait', 'paket', 'Paket portrait',       '{"id":"portrait","nama":"Portrait", "kategori":"portrait","harga":250000,"durasiMenit":30,"jumlahBackground":1,"maxOrang":null,"cetakInclude":null,"popular":false,"aktif":true,"hargaMulaiDari":true}'::jsonb),
  ('paket_couple',   'paket', 'Paket foto couple',    '{"id":"couple",  "nama":"Couple",   "kategori":"couple",  "harga":350000,"durasiMenit":30,"jumlahBackground":1,"maxOrang":2,   "cetakInclude":null,"popular":false,"aktif":true,"hargaMulaiDari":true}'::jsonb),
  ('paket_custom',   'paket', 'Paket sesi custom',    '{"id":"custom",  "nama":"Custom",   "kategori":"custom",  "harga":350000,"durasiMenit":45,"jumlahBackground":2,"maxOrang":null,"cetakInclude":null,"popular":false,"aktif":true,"hargaMulaiDari":true}'::jsonb),
  -- Add-on
  ('addon_tambahan_waktu', 'addon', 'Biaya tambahan waktu sesi',  '{"nama":"Tambahan Waktu",       "harga":150000,"satuan":"per 10 menit"}'::jsonb),
  ('addon_tambahan_orang', 'addon', 'Biaya tambahan orang',       '{"nama":"Tambahan Orang",       "harga":20000, "satuan":"per orang"}'::jsonb),
  ('addon_tambahan_bg',    'addon', 'Biaya tambahan background',  '{"nama":"Tambahan Background",  "harga":100000,"satuan":"per background"}'::jsonb),
  ('addon_cetak_12r',      'addon', 'Paket cetak 12R + Frame',    '{"nama":"Cetak 12R + Frame",    "harga":150000,"satuan":"per set"}'::jsonb),
  ('addon_cetak_20r',      'addon', 'Paket cetak 20R + Frame',    '{"nama":"Cetak 20R + Frame",    "harga":400000,"satuan":"per set"}'::jsonb)
ON CONFLICT (key) DO NOTHING;


-- ================================================================
-- LANGKAH 9: SETUP ADMIN PERTAMA
-- ================================================================
-- Setelah schema selesai dibuat, buat akun admin di Supabase Dashboard:
--   1. Buka Supabase Dashboard → Authentication → Users → Add user
--   2. Isi email + password untuk akun Uti Hirzy
--   3. Copy UUID user yang baru dibuat (kolom "UID")
--   4. Jalankan SQL di bawah (ganti UUID-nya):
--
-- INSERT INTO admin_profiles (user_id, nama, role)
-- VALUES ('GANTI-DENGAN-UUID-USER', 'Uti Hirzy', 'owner');


-- ================================================================
-- SELESAI — Verifikasi dengan query ini:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' ORDER BY table_name;
-- ================================================================
