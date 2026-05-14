import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// GET /api/clients/lookup?no_wa=08xxx
// Endpoint publik — cari client berdasarkan nomor WA untuk auto-fill form booking
// Hanya mengembalikan nama & email (tidak ada data sensitif lainnya)
function normalisasiWa(no: string): string[] {
  const digits = no.replace(/\D/g, "")
  const variants: string[] = [no] // simpan input asli juga
  if (digits.startsWith("0")) {
    variants.push(digits)           // "08xxx"
    variants.push("62" + digits.slice(1)) // "628xxx"
    variants.push("+62" + digits.slice(1)) // "+628xxx"
  } else if (digits.startsWith("62")) {
    variants.push(digits)           // "628xxx"
    variants.push("0" + digits.slice(2)) // "08xxx"
    variants.push("+" + digits)     // "+628xxx"
  }
  return Array.from(new Set(variants))
}

export async function GET(request: NextRequest) {
  const no_wa = new URL(request.url).searchParams.get("no_wa") ?? ""

  // Minimal 9 digit angka sebelum mulai lookup
  const digits = no_wa.replace(/\D/g, "")
  if (digits.length < 9) {
    return NextResponse.json({ found: false })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const variants = normalisasiWa(no_wa)

  // Coba cocokkan semua format nomor
  const orClause = variants.map((v) => `no_wa.eq.${v}`).join(",")
  const { data } = await supabase
    .from("clients")
    .select("nama, email, is_blacklist")
    .or(orClause)
    .maybeSingle()

  if (!data) return NextResponse.json({ found: false })
  // Jangan kasih tahu kalau nomor masuk blacklist — cukup kembalikan tidak ditemukan
  if (data.is_blacklist) return NextResponse.json({ found: false })

  return NextResponse.json({
    found: true,
    nama:  data.nama ?? null,
    email: data.email ?? null,
  })
}
