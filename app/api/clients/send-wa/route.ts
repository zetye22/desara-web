import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient() as any).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "Format request tidak valid" }, { status: 400 })
  }

  const { client_id, no_wa, pesan, broadcast_id } = body as {
    client_id?: string
    no_wa: string
    pesan: string
    broadcast_id?: string
  }

  if (!no_wa || !pesan) {
    return NextResponse.json({ error: "no_wa dan pesan wajib diisi" }, { status: 400 })
  }

  const token = process.env.FONNTE_TOKEN
  if (!token) {
    return NextResponse.json({ error: "FONNTE_TOKEN belum dikonfigurasi" }, { status: 500 })
  }

  // Kirim via Fonnte
  let status: "sent" | "failed" = "sent"
  let errorMsg: string | null = null
  let sentAt: string | null = null

  try {
    const formData = new URLSearchParams()
    formData.append("target", no_wa)
    formData.append("message", pesan)
    formData.append("delay", "2")
    formData.append("countryCode", "62")

    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    })

    const result = await res.json()
    if (!result.status) {
      status = "failed"
      errorMsg = result.reason ?? "Fonnte error"
    } else {
      sentAt = new Date().toISOString()
    }
  } catch (err) {
    status = "failed"
    errorMsg = err instanceof Error ? err.message : "Network error"
  }

  // Log ke broadcast_log
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  await supabase.from("broadcast_log").insert({
    client_id: client_id ?? null,
    no_wa,
    pesan,
    status,
    error_msg: errorMsg,
    sent_at: sentAt,
    broadcast_id: broadcast_id ?? null,
    dikirim_oleh: user.id,
  })

  if (status === "failed") {
    return NextResponse.json({ error: errorMsg ?? "Gagal kirim WA" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
