"use client"

import { useState, useRef, useCallback } from "react"
import imageCompression from "browser-image-compression"
import { X, Upload, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface FileEntry {
  file: File
  preview: string
  kategori: string
  alt_text: string
  caption: string
  status: "idle" | "uploading" | "done" | "error"
}

interface UploadModalProps {
  onClose: () => void
  onSuccess: () => void
}

const KATEGORI_OPTIONS = [
  { value: "wisuda",   label: "Wisuda" },
  { value: "prewed",   label: "Prewedding" },
  { value: "keluarga", label: "Keluarga" },
  { value: "group",    label: "Group" },
  { value: "portrait", label: "Portrait" },
  { value: "couple",   label: "Couple" },
  { value: "custom",   label: "Custom" },
]

// Konversi nama file ke title case (tanpa ekstensi)
function fileNameToTitleCase(filename: string): string {
  const withoutExt = filename.replace(/\.[^.]+$/, "")
  return withoutExt
    .replace(/[-_]+/g, " ")
    .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
}

export function UploadModal({ onClose, onSuccess }: UploadModalProps) {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Tambah file ke queue dengan validasi
  const addFiles = useCallback((newFiles: File[]) => {
    const valid = newFiles.filter((f) => {
      if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
        toast.error(`${f.name}: tipe file tidak didukung (gunakan JPG, PNG, atau WEBP)`)
        return false
      }
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name}: ukuran melebihi 5 MB`)
        return false
      }
      return true
    })

    setFiles((prev) => {
      const remaining = 10 - prev.length
      const toAdd = valid.slice(0, remaining)
      if (valid.length > remaining) {
        toast.warning(`Hanya ${remaining} foto lagi yang bisa ditambahkan (maks. 10)`)
      }
      return [
        ...prev,
        ...toAdd.map((f) => ({
          file: f,
          preview: URL.createObjectURL(f),
          kategori: "",
          alt_text: fileNameToTitleCase(f.name),
          caption: "",
          status: "idle" as const,
        })),
      ]
    })
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const dropped = Array.from(e.dataTransfer.files)
      addFiles(dropped)
    },
    [addFiles]
  )

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    addFiles(Array.from(e.target.files))
    e.target.value = ""
  }

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const entry = prev[index]
      URL.revokeObjectURL(entry.preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const updateField = (index: number, field: keyof FileEntry, value: string) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, [field]: value } : f))
    )
  }

  // Validasi semua file sebelum upload
  const isReadyToUpload = files.length > 0 && files.every((f) => f.kategori && f.alt_text.trim())

  const handleUploadAll = async () => {
    if (!isReadyToUpload) {
      toast.error("Lengkapi kategori dan alt text untuk semua foto")
      return
    }

    setUploadProgress({ current: 0, total: files.length })
    let hasError = false

    for (let i = 0; i < files.length; i++) {
      const entry = files[i]
      setFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: "uploading" } : f))
      )
      setUploadProgress({ current: i + 1, total: files.length })

      try {
        // Kompres gambar sebelum upload
        const compressed = await imageCompression(entry.file, {
          maxWidthOrHeight: 1500,
          maxSizeMB: 1,
          useWebWorker: true,
        })

        const formData = new FormData()
        formData.append("file", compressed, entry.file.name)
        formData.append("kategori", entry.kategori)
        formData.append("alt_text", entry.alt_text.trim())
        formData.append("caption", entry.caption.trim())

        const res = await fetch("/api/portfolio", {
          method: "POST",
          body: formData,
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Upload gagal" }))
          throw new Error(err.error ?? "Upload gagal")
        }

        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: "done" } : f))
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload gagal"
        toast.error(`${entry.file.name}: ${message}`)
        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: "error" } : f))
        )
        hasError = true
      }
    }

    setUploadProgress(null)

    if (!hasError) {
      toast.success("Semua foto berhasil diupload!")
      onSuccess()
      onClose()
    } else {
      toast.warning("Beberapa foto gagal diupload")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#0d1f3c]">Upload Foto Portfolio</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            aria-label="Tutup modal"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {/* Area drag & drop */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              isDragOver
                ? "border-[#C9A84C] bg-[#C9A84C]/5"
                : "border-gray-300 hover:border-[#C9A84C] hover:bg-gray-50"
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-[#0d1f3c]/5 flex items-center justify-center">
                <Upload className="w-7 h-7 text-[#0d1f3c]/50" />
              </div>
              <div>
                <p className="font-semibold text-[#0d1f3c]">
                  Drag &amp; drop foto di sini atau klik untuk pilih
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Maks. 10 file, 5 MB per foto · JPG PNG WEBP
                </p>
              </div>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileInput}
            />
          </div>

          {/* Daftar file yang dipilih */}
          {files.length > 0 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm font-semibold text-gray-600">{files.length} foto dipilih</p>
              {files.map((entry, index) => (
                <div
                  key={index}
                  className={`flex gap-4 p-4 rounded-xl border ${
                    entry.status === "done"
                      ? "border-green-200 bg-green-50"
                      : entry.status === "error"
                      ? "border-red-200 bg-red-50"
                      : entry.status === "uploading"
                      ? "border-blue-200 bg-blue-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  {/* Thumbnail preview */}
                  <div className="relative shrink-0">
                    <div className="w-20 h-24 rounded-lg overflow-hidden bg-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={entry.preview}
                        alt={entry.alt_text}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {entry.status === "uploading" && (
                      <div className="absolute inset-0 rounded-lg bg-blue-500/30 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    {entry.status === "done" && (
                      <div className="absolute inset-0 rounded-lg bg-green-500/30 flex items-center justify-center">
                        <span className="text-white text-xl font-bold">✓</span>
                      </div>
                    )}
                  </div>

                  {/* Form per foto */}
                  <div className="flex-1 flex flex-col gap-3 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-gray-500 truncate">{entry.file.name}</p>
                      {entry.status === "idle" && (
                        <button
                          onClick={() => removeFile(index)}
                          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                          aria-label="Hapus foto dari queue"
                        >
                          <X className="w-3 h-3 text-gray-500" />
                        </button>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs font-medium text-gray-700">
                        Kategori <span className="text-red-500">*</span>
                      </Label>
                      <select
                        value={entry.kategori}
                        onChange={(e) => updateField(index, "kategori", e.target.value)}
                        disabled={entry.status !== "idle"}
                        className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C] disabled:opacity-50"
                      >
                        <option value="">-- Pilih kategori --</option>
                        {KATEGORI_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label className="text-xs font-medium text-gray-700">
                        Alt Text / Deskripsi <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={entry.alt_text}
                        onChange={(e) => updateField(index, "alt_text", e.target.value)}
                        disabled={entry.status !== "idle"}
                        placeholder="Deskripsi singkat foto"
                        className="mt-1 text-sm h-9"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-medium text-gray-700">Caption (opsional)</Label>
                      <Input
                        value={entry.caption}
                        onChange={(e) => updateField(index, "caption", e.target.value)}
                        disabled={entry.status !== "idle"}
                        placeholder="Contoh: Paket Silver Wisuda"
                        className="mt-1 text-sm h-9"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Progress indicator */}
          {uploadProgress && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
                <p className="text-sm font-medium text-blue-700">
                  Mengupload {uploadProgress.current}/{uploadProgress.total}...
                </p>
              </div>
              <div className="mt-3 h-2 bg-blue-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer tombol */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={!!uploadProgress}
            className="rounded-lg"
          >
            Batal
          </Button>
          <Button
            onClick={handleUploadAll}
            disabled={!isReadyToUpload || !!uploadProgress}
            className="rounded-lg bg-[#0d1f3c] hover:bg-[#0d1f3c]/90 text-white"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            {uploadProgress
              ? `Mengupload ${uploadProgress.current}/${uploadProgress.total}...`
              : `Upload Semua (${files.length} foto)`}
          </Button>
        </div>
      </div>
    </div>
  )
}
