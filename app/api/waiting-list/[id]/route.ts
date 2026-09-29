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

  let body: { status: "menunggu" | "batal" }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Format request tidak valid" }, { status: 400 })
  }

  if (!["menunggu", "batal"].includes(body.status)) {
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("waiting_list")
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq("id", params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
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
