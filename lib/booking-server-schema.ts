import { z } from "zod"

function normalizeWA(wa: string): string {
  const cleaned = wa.replace(/[\s\-().]/g, "")
  if (cleaned.startsWith("+62")) return "0" + cleaned.slice(3)
  if (cleaned.startsWith("62")) return "0" + cleaned.slice(2)
  return cleaned
}

export const createBookingSchema = z.object({
  kategori_sesi: z.enum(["wisuda", "prewed", "keluarga", "group", "portrait", "couple", "custom"]),
  paket_id: z.string().min(1, "Paket harus dipilih"),
  tgl_foto: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid")
    .refine((d) => new Date(d) >= new Date(new Date().toDateString()), "Tanggal sudah lewat"),
  jam_mulai: z.string().regex(/^\d{2}:\d{2}$/, "Format jam tidak valid"),
  nama_client: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama terlalu panjang"),
  no_wa: z
    .string()
    .regex(/^(\+62|62|0)8[1-9][0-9]{7,11}$/, "Format nomor WA tidak valid (08xx...)")
    .transform(normalizeWA),
  email: z
    .string()
    .email("Format email tidak valid")
    .optional()
    .or(z.literal(""))
    .transform((v) => v || null),
  jumlah_orang: z.number().int().min(1).max(100),
  background_dipilih: z
    .array(z.string())
    .min(1, "Pilih minimal 1 background")
    .max(10),
  addons: z.object({
    tambahanWaktu: z.number().int().min(0).max(12),
    tambahanOrang: z.number().int().min(0).max(50),
    tambahanBackground: z.number().int().min(0).max(10),
    cetak12R: z.number().int().min(0).max(10),
    cetak20R: z.number().int().min(0).max(10),
  }),
  catatan: z.string().max(500).optional(),
})

export type CreateBookingInput = z.infer<typeof createBookingSchema>
