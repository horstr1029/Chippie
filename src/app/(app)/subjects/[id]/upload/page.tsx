'use client'

import { useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

type Mode = 'file' | 'video'

const FILE_CONFIG = {
  file: { accept: '.pdf,.jpg,.jpeg,.png,.webp', label: 'PDF or image', maxMb: 20 },
  video: { accept: '.mp4,.mov,.webm', label: 'MP4 / MOV / WebM', maxMb: 200 },
}

export default function UploadPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [mode, setMode] = useState<Mode>('file')
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleModeSwitch(m: Mode) {
    setMode(m)
    setSelectedFile(null)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!selectedFile) { setError('Please select a file.'); return }

    const cfg = FILE_CONFIG[mode]
    if (selectedFile.size > cfg.maxMb * 1024 * 1024) {
      setError(`File too large. Maximum is ${cfg.maxMb} MB.`)
      return
    }

    setLoading(true)
    setProgress(0)

    const fd = new FormData()
    fd.append('subjectId', id)
    fd.append('file', selectedFile)

    // Use XHR for upload progress
    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100))
    }
    xhr.onload = () => {
      setLoading(false)
      if (xhr.status >= 200 && xhr.status < 300) {
        router.push(`/subjects/${id}`)
        router.refresh()
      } else {
        try {
          const body = JSON.parse(xhr.responseText)
          setError(body.error ?? 'Upload failed')
        } catch {
          setError('Upload failed')
        }
      }
    }
    xhr.onerror = () => { setLoading(false); setError('Upload failed. Check your connection.') }
    xhr.open('POST', '/api/upload')
    xhr.send(fd)
  }

  const cfg = FILE_CONFIG[mode]

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg)' }}>
      <div className="max-w-lg mx-auto px-4 py-8">
        <Link href={`/subjects/${id}`} className="text-sm mb-6 block" style={{ color: 'var(--text-muted)' }}>
          ← Back
        </Link>

        <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--text)' }}>
          Upload material
        </h1>

        {/* Mode toggle */}
        <div className="flex rounded-xl overflow-hidden border mb-6" style={{ borderColor: 'var(--border)' }}>
          {(['file', 'video'] as const).map(m => (
            <button key={m} type="button" onClick={() => handleModeSwitch(m)}
              className="flex-1 py-2.5 text-sm font-semibold transition-colors"
              style={{
                background: mode === m ? 'var(--primary)' : 'var(--surface-raised)',
                color: mode === m ? '#0F1F1A' : 'var(--text-muted)',
              }}>
              {m === 'file' ? '📄 PDF / Image' : '🎥 Video file'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Drop zone */}
          <div
            className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-12 cursor-pointer transition-colors"
            style={{
              borderColor: dragOver ? 'var(--primary)' : 'var(--border)',
              background: dragOver ? '#A8FF3E11' : 'var(--surface)',
            }}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault(); setDragOver(false)
              const f = e.dataTransfer.files[0]
              if (f) { setSelectedFile(f); setError('') }
            }}
            onClick={() => fileRef.current?.click()}
          >
            <span className="text-4xl">{selectedFile ? '✅' : mode === 'video' ? '🎥' : '📂'}</span>
            <p className="font-medium text-center px-4" style={{ color: 'var(--text)' }}>
              {selectedFile ? selectedFile.name : 'Drag & drop or click to browse'}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {cfg.label} · max {cfg.maxMb} MB
            </p>
            <input
              ref={fileRef}
              type="file"
              accept={cfg.accept}
              className="sr-only"
              onChange={e => { setSelectedFile(e.target.files?.[0] ?? null); setError('') }}
            />
          </div>

          {mode === 'video' && (
            <p className="text-xs rounded-xl px-4 py-3"
              style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)' }}>
              ℹ️ Videos are stored as reference material. Chippie generates tests from PDF text — upload a matching PDF to enable test generation.
            </p>
          )}

          {/* Upload progress */}
          {loading && (
            <div>
              <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                <span>Uploading…</span>
                <span>{progress}%</span>
              </div>
              <div className="rounded-full h-2 overflow-hidden" style={{ background: 'var(--surface-raised)' }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${progress}%`, background: 'var(--primary)' }} />
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm rounded-xl px-4 py-2" style={{ background: '#FF5C5C22', color: 'var(--highlight)' }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}
            className="w-full rounded-xl py-3 font-semibold transition-opacity disabled:opacity-60"
            style={{ background: 'var(--primary)', color: '#0F1F1A' }}>
            {loading ? `Uploading ${progress}%…` : 'Save material'}
          </button>
        </form>
      </div>
    </div>
  )
}
