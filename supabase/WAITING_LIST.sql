-- ================================================================
-- TABEL WAITING LIST (DESARA HOME STUDIO)
-- Jalankan query ini di Supabase SQL Editor
-- ================================================================

CREATE TABLE IF NOT EXISTS waiting_list (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Data client
  nama_client         TEXT        NOT NULL,
  no_wa               TEXT        NOT NULL,
  email               TEXT,
  catatan             TEXT,

  -- Detail paket & konfigurasi yang dipilih
  kategori_sesi       TEXT        NOT NULL,
  paket_id            TEXT        NOT NULL,
  nama_paket          TEXT        NOT NULL,
  jumlah_orang        INTEGER     NOT NULL DEFAULT 1,
  background_dipilih  TEXT[]      NOT NULL DEFAULT '{}',
  addons              JSONB       NOT NULL DEFAULT '{}'::jsonb,

  -- Estimasi biaya
  subtotal_paket      INTEGER     NOT NULL DEFAULT 0,
  subtotal_addon      INTEGER     NOT NULL DEFAULT 0,
  total_tagihan       INTEGER     NOT NULL DEFAULT 0,

  -- Preferensi jadwal dari client (opsional / fleksibel)
  preferensi_jadwal   TEXT,

  -- Status antrean: 'menunggu', 'dijadwalkan', 'batal'
  status              TEXT        NOT NULL DEFAULT 'menunggu'
                      CHECK (status IN ('menunggu', 'dijadwalkan', 'batal')),

  -- Terhubung ke booking resmi jika sudah dijadwalkan
  booking_id          UUID        REFERENCES bookings(id) ON DELETE SET NULL,
  dijadwalkan_pada    TIMESTAMPTZ,
  dijadwalkan_oleh    UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index untuk mempercepat query list waiting list aktif
CREATE INDEX IF NOT EXISTS idx_waiting_list_status ON waiting_list(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_waiting_list_no_wa  ON waiting_list(no_wa);

-- RLS (Row Level Security)
ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;

-- Public bisa mendaftar (INSERT)
DROP POLICY IF EXISTS "public_bisa_insert_waiting_list" ON waiting_list;
CREATE POLICY "public_bisa_insert_waiting_list" ON waiting_list
  FOR INSERT WITH CHECK (true);

-- Hanya Admin terautentikasi yang bisa kelola / lihat data waiting list
DROP POLICY IF EXISTS "admin_kelola_waiting_list" ON waiting_list;
CREATE POLICY "admin_kelola_waiting_list" ON waiting_list
  FOR ALL USING (auth.role() = 'authenticated');

-- Realtime publication agar antrean ter-update live di admin panel jika ada client baru daftar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'waiting_list'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE waiting_list;
  END IF;
END $$;
