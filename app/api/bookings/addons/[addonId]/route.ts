import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/server"

// PATCH /api/bookings/addons/[addonId]
// Update addon lapangan (hanya source='lapangan' yang bisa diedit)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { addonId: string } }
) {
  // Cek autentikasi
  const {
    data: { user },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = await (createClient() as any).auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const { addonId } = params

  // Ambil data addon dulu untuk verifikasi
  const { data: existing, error: fetchError } = await supabase
    .from("booking_addons")
    .select("*")
    .eq("id", addonId)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json(
      { error: "Addon tidak ditemukan" },
      { status: 404 }
    )
  }

  // Hanya addon dari lapangan yang boleh diedit
  if (existing.source !== "lapangan") {
    return NextResponse.json(
      { error: "Hanya addon lapangan yang bisa diedit" },
      { status: 403 }
    )
  }

  let body: { nama_item?: string; qty?: number; harga_satuan?: number; catatan?: string }
  try {
    body = await request.json() as typeof body
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 })
  }

  const { nama_item, qty, harga_satuan, catatan } = body

  // Bangun object update
  const updates: Record<string, string | number | null> = {}

  if (nama_item !== undefined) {
    if (typeof nama_item !== "string" || nama_item.trim() === "") {
      return NextResponse.json(
        { error: "Nama item tidak boleh kosong" },
        { status: 400 }
      )
    }
    updates.nama_item = nama_item.trim()
  }

  if (qty !== undefined) {
    if (typeof qty !== "number" || qty < 1) {
      return NextResponse.json(
        { error: "Qty minimal 1" },
        { status: 400 }
      )
    }
    updates.qty = qty
  }

  if (harga_satuan !== undefined) {
    if (typeof harga_satuan !== "number" || harga_satuan < 0) {
      return NextResponse.json(
        { error: "Harga satuan tidak valid" },
        { status: 400 }
      )
    }
    updates.harga_satuan = harga_satuan
  }

  if (catatan !== undefined) {
    updates.catatan = catatan
  }

  // Hitung ulang subtotal jika qty atau harga_satuan berubah
  const finalQty = updates.qty ?? existing.qty
  const finalHarga = updates.harga_satuan ?? existing.harga_satuan
  updates.subtotal = finalQty * finalHarga

  const { error: updateError } = await supabase
    .from("booking_addons")
    .update(updates)
    .eq("id", addonId)

  if (updateError) {
    return NextResponse.json(
      { error: "Gagal mengupdate addon" },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}

// DELETE /api/bookings/addons/[addonId]
// Hapus addon lapangan
export async function DELETE(
  request: NextRequest,
  { params }: { params: { addonId: string } }
) {
  // Cek autentikasi
  const {
    data: { user },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = await (createClient() as any).auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const { addonId } = params

  // Ambil data addon dulu untuk verifikasi
  const { data: existing, error: fetchError } = await supabase
    .from("booking_addons")
    .select("id, source")
    .eq("id", addonId)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json(
      { error: "Addon tidak ditemukan" },
      { status: 404 }
    )
  }

  // Hanya addon dari lapangan yang boleh dihapus
  if (existing.source !== "lapangan") {
    return NextResponse.json(
      { error: "Hanya addon lapangan yang bisa dihapus" },
      { status: 403 }
    )
  }

  const { error: deleteError } = await supabase
    .from("booking_addons")
    .delete()
    .eq("id", addonId)

  if (deleteError) {
    return NextResponse.json(
      { error: "Gagal menghapus addon" },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
