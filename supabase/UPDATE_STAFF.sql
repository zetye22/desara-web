-- Update nama staf: hapus semua, ganti dengan 4 nama baru
-- Jalankan di Supabase Dashboard → SQL Editor → New Query

-- Hapus semua staf lama
DELETE FROM staff_upah;

-- Insert staf baru
INSERT INTO staff_upah (nama, role, upah_per_client, aktif) VALUES
  ('EZY',       'photographer', 50000, true),
  ('TYO',       'photographer', 35000, true),
  ('EDWIN',     'editor',       30000, true),
  ('FREELANCE', 'photographer',     0, true);
