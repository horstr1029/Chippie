'use client'

import { useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function UploadPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [mode, setMode] = useState<'file' | 'video'>('file')
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const fd = new FormData()
    fd.append('subjectId', id)

    if (mode === 'file') {
      if (!selectedFile) { setError('Please select a file.'); setLoading(false); return }
      fd.append('file', selectedFile)
    } else {
      const videoUrl = (document.getElementById('videoUrl') as HTMLInputElement).value
      if (!videoUrl) { setError('Please enter a video URL.'); setLoading(false); return }
      fd.append('videoUrl', videoUrl)
      const ts = (document.getElementById('timestamps') as HTMLInputElement).value
      if (ts) fd.append('videoTimestamps', ts)
    }

    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const body = await res.json()
    setLoading(false)
    if (!res.ok) { setError(body.error ?? 'Upload failed'); return }
    router.push(`/subjects/${id}`)
    router.refresh()
  }

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
            <button key={m} type="button" onClick={() => setMode(m)}
              className="flex-1 py-2.5 text-sm font-semibold transition-colors"
              style={{
                background: mode === m ? 'var(--primary)' : 'var(--surface-raised)',
                color: mode === m ? '#0F1F1A' : 'var(--text-muted)',
              }}>
              {m === 'file' ? '📄 PDF / Image' : '🎥 Video link'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'file' ? (
            <div
              className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-12 cursor-pointer transition-colors"
              style={{
                borderColor: dragOver ? 'var(--primary)' : 'var(--border)',
                background: dragOver ? '#A8FF3E11' : 'var(--surface)',
              }}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); setSelectedFile(e.dataTransfer.files[0] ?? null) }}
              onClick={() => fileRef.current?.click()}
            >
              <span className="text-4xl">{selectedFile ? '✅' : '📂'}</span>
              <p className="font-medium" style={{ color: 'var(--text)' }}>
                {selectedFile ? selectedFile.name : 'Drag & drop or click to browse'}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>PDF or image · max 20 MB</p>
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="sr-only"
                onChange={e => setSelectedFile(e.target.files?.[0] ?? null)} />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>Video URL</label>
                <input id="videoUrl" type="url" placeholder="https://youtube.com/…"
                  className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
                  Chapter timestamps <span style={{ fontWeight: 400 }}>(optional JSON)</span>
                </label>
                <input id="timestamps" type="text"
                  placeholder='[{"time":"0:00","label":"Intro"}]'
                  className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }} />
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
            {loading ? 'Uploading…' : 'Save material'}
          </button>
        </form>
      </div>
    </div>
  )
}
