import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { getSessionUserWithRole } from "@/lib/auth-server"

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionUserWithRole()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("waiting_list")
    .select("*")
    .eq("id", params.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Data waiting list tidak ditemukan" }, { status: 404 })
  }

  return NextResponse.json({ item: data })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionUserWithRole()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: Record<string, any>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Format request tidak valid" }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Jika hanya update status sederhana
  if (body.status && !body.nama_client && !body.action) {
    if (!["menunggu", "batal"].includes(body.status)) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 })
    }

    const { error } = await supabase
      .from("waiting_list")
      .update({ status: body.status, updated_at: new Date().toISOString() })
      .eq("id", params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  // Jika update data client / form edit
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  }

  if (typeof body.nama_client === "string") {
    if (!body.nama_client.trim()) {
      return NextResponse.json({ error: "Nama client tidak boleh kosong" }, { status: 400 })
    }
    updateData.nama_client = body.nama_client.trim()
  }

  if (typeof body.no_wa === "string") {
    if (!body.no_wa.trim()) {
      return NextResponse.json({ error: "No WhatsApp tidak boleh kosong" }, { status: 400 })
    }
    updateData.no_wa = body.no_wa.trim()
  }

  if (body.email !== undefined) {
    updateData.email = body.email ? String(body.email).trim() : null
  }

  if (body.preferensi_jadwal !== undefined) {
    updateData.preferensi_jadwal = body.preferensi_jadwal ? String(body.preferensi_jadwal).trim() : null
  }

  if (body.jam_diinginkan !== undefined) {
    updateData.jam_diinginkan = body.jam_diinginkan ? String(body.jam_diinginkan).trim() : null
  }

  if (body.catatan !== undefined) {
    updateData.catatan = body.catatan ? String(body.catatan).trim() : null
  }

  if (body.status && ["menunggu", "batal"].includes(body.status)) {
    updateData.status = body.status
  }

  const { error } = await supabase
    .from("waiting_list")
    .update(updateData)
    .eq("id", params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, updated: updateData })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionUserWithRole()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("waiting_list")
    .delete()
    .eq("id", params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
