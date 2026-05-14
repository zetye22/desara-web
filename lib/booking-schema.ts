import { z } from "zod"

// Validasi no WA Indonesia: diawali 08 atau +62, 10-13 digit
const noWaRegex = /^(\+62|62|0)8[1-9][0-9]{7,11}$/

export const detailSchema = z.object({
  namaClient: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(80, "Nama terlalu panjang"),
  noWa: z
    .string()
    .regex(noWaRegex, "Format nomor WhatsApp tidak valid (contoh: 081234567890)"),
  email: z
    .string()
    .email("Format email tidak valid")
    .optional()
    .or(z.literal("")),
  jumlahOrang: z
    .number()
    .int()
    .min(1, "Minimal 1 orang"),
  catatan: z.string().max(300, "Catatan maksimal 300 karakter").optional(),
})

export type DetailFormValues = z.infer<typeof detailSchema>
