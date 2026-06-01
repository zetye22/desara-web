// Utilitas waktu — dipakai di client dan server

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

export function minutesToTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`
}

// Slot jam 06:00–20:30 (setiap 30 menit, sesi terakhir bisa berakhir pukul 21:00)
export function generateSlotJam(): string[] {
  const slots: string[] = []
  for (let h = 6; h <= 20; h++) {
    for (const m of [0, 30]) {
      if (h === 20 && m === 30) break
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`)
    }
  }
  return slots
}
