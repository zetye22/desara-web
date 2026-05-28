import { NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"

// Ambil user dari session (menggantikan pola (createClient() as any).auth.getUser())
export async function getSessionUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user ?? null
}

// Ambil user + role — dipakai di route yang perlu cek owner vs admin
export async function getSessionUserWithRole(): Promise<{
  user: { id: string; email?: string | null }
  role: "owner" | "admin"
} | null> {
  const user = await getSessionUser()
  if (!user) return null

  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("role")
    .eq("user_id", user.id)
    .single()

  const role: "owner" | "admin" = profile?.role === "owner" ? "owner" : "admin"
  return { user: { id: user.id, email: user.email }, role }
}

// Guard: hanya owner yang bisa lanjut
// Pemakaian: const guard = await requireOwner(); if (guard) return guard;
export async function requireOwner(): Promise<NextResponse | null> {
  const result = await getSessionUserWithRole()
  if (!result) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (result.role !== "owner") {
    return NextResponse.json(
      { error: "Hanya Owner yang bisa melakukan aksi ini" },
      { status: 403 }
    )
  }
  return null
}
