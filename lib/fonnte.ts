// Fonnte WhatsApp Gateway — https://fonnte.com
// Hanya dipakai di server-side (tidak ada "use client")

const FONNTE_API = "https://api.fonnte.com/send"

// Format nomor: 08xx atau 628xx → 628xx
export function formatNomor(no: string): string {
  const digits = no.replace(/\D/g, "")
  if (digits.startsWith("0")) return "62" + digits.slice(1)
  if (digits.startsWith("62")) return digits
  return "62" + digits
}

export interface SendResult {
  success: boolean
  error?: string
}

export async function sendWhatsApp(no_wa: string, pesan: string): Promise<SendResult> {
  const token = process.env.FONNTE_API_TOKEN
  if (!token) {
    return { success: false, error: "FONNTE_API_TOKEN belum dikonfigurasi" }
  }

  const nomor = formatNomor(no_wa)

  try {
    const res = await fetch(FONNTE_API, {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        target: nomor,
        message: pesan,
        countryCode: "62",
      }),
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json().catch(() => ({}))

    if (!res.ok || data.status === false) {
      return { success: false, error: data.reason ?? `HTTP ${res.status}` }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" }
  }
}
