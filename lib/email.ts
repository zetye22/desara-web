import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

interface BookingNotifData {
  kode_booking: string
  nama_client: string
  no_wa: string
  tgl_foto: string
  jam_mulai: string
  jam_selesai: string
  nama_paket: string
  total_tagihan: number
  dp_minimum: number
  catatan?: string | null
}

function formatRp(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(n)
}

function formatTgl(tgl: string): string {
  return new Date(tgl + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })
}

export async function kirimNotifBookingBaru(data: BookingNotifData): Promise<void> {
  const apiKey     = process.env.RESEND_API_KEY
  const adminEmail = process.env.ADMIN_EMAIL
  if (!apiKey || !adminEmail) return

  const fromAddr = process.env.RESEND_FROM ?? "onboarding@resend.dev"

  await resend.emails.send({
    from:    fromAddr,
    to:      adminEmail,
    subject: `📸 Booking Baru: ${data.nama_client} — ${data.kode_booking}`,
    html: `
<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#0d1f3c;border-radius:16px 16px 0 0;padding:24px 28px;">
            <p style="margin:0;color:#C9A84C;font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">Desara Home Studio</p>
            <h1 style="margin:6px 0 0;color:#ffffff;font-size:20px;">📸 Booking Baru Masuk!</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:28px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">

            <!-- Info rows -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px;width:40%;">Kode Booking</td>
                <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-weight:bold;font-family:monospace;color:#0d1f3c;">${data.kode_booking}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px;">Nama Client</td>
                <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-weight:600;color:#111827;">${data.nama_client}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px;">No. WhatsApp</td>
                <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#111827;">${data.no_wa}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px;">Tanggal Foto</td>
                <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#111827;">${formatTgl(data.tgl_foto)}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px;">Jam Sesi</td>
                <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-weight:600;color:#111827;">${data.jam_mulai} – ${data.jam_selesai} WIB</td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px;">Paket</td>
                <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#111827;">${data.nama_paket}</td>
              </tr>
              <tr>
                <td style="padding:12px 0 4px;color:#6b7280;font-size:13px;">Total Tagihan</td>
                <td style="padding:12px 0 4px;font-weight:bold;color:#0d1f3c;font-size:18px;">${formatRp(data.total_tagihan)}</td>
              </tr>
              <tr>
                <td style="padding:0 0 8px;color:#6b7280;font-size:13px;">DP Minimum</td>
                <td style="padding:0 0 8px;font-weight:600;color:#C9A84C;">${formatRp(data.dp_minimum)}</td>
              </tr>
              ${data.catatan ? `
              <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:13px;vertical-align:top;">Catatan</td>
                <td style="padding:8px 0;color:#374151;font-style:italic;">${data.catatan}</td>
              </tr>` : ""}
            </table>

            <!-- Status banner -->
            <div style="margin-top:20px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 16px;">
              <p style="margin:0;font-size:13px;color:#92400e;">
                ⏳ Status: <strong>Menunggu konfirmasi DP</strong><br>
                <span style="font-size:12px;color:#a16207;">Segera konfirmasi setelah DP diterima dari client.</span>
              </p>
            </div>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;padding:16px 28px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">Email ini dikirim otomatis oleh sistem Desara Home Studio.<br>Jangan balas email ini.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
    `.trim(),
  })
}
