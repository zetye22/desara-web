import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/server"

// GET — List semua portfolio (auth required), sort by urutan ASC
export async function GET() {
  // Cek autentikasi
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient() as any).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const { data: items, error } = await supabase
    .from("portfolio")
    .select("*")
    .order("urutan", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ items: items ?? [] })
}

// POST — Upload foto baru (menerima FormData)
export async function POST(request: NextRequest) {
  // Cek autentikasi
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient() as any).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("file") as File | null
  const kategori = formData.get("kategori") as string | null
  const alt_text = formData.get("alt_text") as string | null
  const caption = formData.get("caption") as string | null

  // Validasi input
  if (!file) {
    return NextResponse.json({ error: "File wajib diisi" }, { status: 400 })
  }
  if (!kategori) {
    return NextResponse.json({ error: "Kategori wajib diisi" }, { status: 400 })
  }
  if (!alt_text) {
    return NextResponse.json({ error: "Alt text wajib diisi" }, { status: 400 })
  }

  // Validasi ukuran file (maks 5 MB)
  const MAX_SIZE = 5 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Ukuran file maksimal 5 MB" }, { status: 400 })
  }

  // Validasi tipe file
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Tipe file harus JPG, PNG, atau WEBP" }, { status: 400 })
  }

  // Sanitasi nama file
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
  const path = `${Date.now()}-${sanitizedName}`

  // Convert file ke buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Upload ke Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("portfolio")
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // Ambil public URL
  const { data: urlData } = supabase.storage
    .from("portfolio")
    .getPublicUrl(path)
  const publicUrl = urlData.publicUrl

  // Ambil urutan maksimum yang ada
  const { data: maxRow } = await supabase
    .from("portfolio")
    .select("urutan")
    .order("urutan", { ascending: false })
    .limit(1)
    .single()

  const urutan = maxRow ? (maxRow.urutan ?? 0) + 1 : 1

  // Insert ke tabel portfolio
  const { data: item, error: insertError } = await supabase
    .from("portfolio")
    .insert({
      image_url: publicUrl,
      thumbnail_url: publicUrl,
      alt_text,
      kategori,
      urutan,
      aktif: true,
      caption: caption || null,
      uploaded_by: user.id,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, item })
}
