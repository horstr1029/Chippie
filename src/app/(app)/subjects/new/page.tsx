'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createSubject } from '@/app/actions/subjects'

// ── Constants ───────────────────────────────────────────────────────────────

const COLORS = [
  { name: 'Lime',   hex: '#A8FF3E' },
  { name: 'Amber',  hex: '#FFB830' },
  { name: 'Coral',  hex: '#FF5C5C' },
  { name: 'Sky',    hex: '#38BDF8' },
  { name: 'Violet', hex: '#A78BFA' },
  { name: 'Rose',   hex: '#FB7185' },
  { name: 'Teal',   hex: '#2DD4BF' },
  { name: 'Orange', hex: '#FB923C' },
  { name: 'Indigo', hex: '#818CF8' },
  { name: 'Mint',   hex: '#6EE7B7' },
]

const ICONS = ['☀️','⚛️','📚','🌍','🧮','🎨','🔬','🏛️','🎵','✏️','📐','🌱','🏃','🎭','💻','📊','🔭','🗺️','🎯','🧬']

const GRADES = Array.from({ length: 12 }, (_, i) => i + 1)

// ── Types ────────────────────────────────────────────────────────────────────

interface WizardData {
  name: string
  color: string
  iconEmoji: string
  gradeLevel: number | null
  language: 'EN' | 'AF'
  examDate: string
}

// ── Step indicator ───────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-300"
          style={{
            width: i === current ? 24 : 8,
            height: 8,
            background: i <= current ? 'var(--primary)' : 'var(--border)',
          }}
        />
      ))}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export default function NewSubjectPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [uploadProgress, setUploadProgress] = useState<'idle' | 'uploading' | 'done'>('idle')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [data, setData] = useState<WizardData>({
    name: '',
    color: COLORS[0].hex,
    iconEmoji: ICONS[0],
    gradeLevel: null,
    language: 'EN',
    examDate: '',
  })

  function update<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData(prev => ({ ...prev, [key]: value }))
  }

  // ── Step 1 validation
  function step1Valid() {
    return data.name.trim().length >= 2 && data.gradeLevel !== null
  }

  // ── Submit: create subject, then optionally upload, redirect
  function finishWizard(skipUpload: boolean) {
    setError('')
    startTransition(async () => {
      const result = await createSubject({
        name: data.name,
        color: data.color,
        iconEmoji: data.iconEmoji,
        gradeLevel: data.gradeLevel!,
        language: data.language,
        examDate: data.examDate || null,
      })

      if (skipUpload) {
        router.push(`/subjects/${result.id}`)
        return
      }

      // Handle file upload
      const file = fileInputRef.current?.files?.[0]
      const videoUrlInput = (document.getElementById('videoUrl') as HTMLInputElement)?.value
      const timestampsInput = (document.getElementById('timestamps') as HTMLInputElement)?.value

      if (!file && !videoUrlInput) {
        router.push(`/subjects/${result.id}`)
        return
      }

      setUploadProgress('uploading')
      const fd = new FormData()
      fd.append('subjectId', result.id)
      if (file) fd.append('file', file)
      if (videoUrlInput) {
        fd.append('videoUrl', videoUrlInput)
        if (timestampsInput) fd.append('videoTimestamps', timestampsInput)
      }

      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) {
        const body = await res.json()
        setError(body.error ?? 'Upload failed')
        setUploadProgress('idle')
        return
      }

      setUploadProgress('done')
      router.push(`/subjects/${result.id}`)
    })
  }

  // ── Shared card wrapper ───────────────────────────────────────────────────
  const cardStyle = {
    background: 'var(--surface)',
    borderColor: 'var(--border)',
  }

  // ── Step 1: Basics ────────────────────────────────────────────────────────
  const step1 = (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--text)' }}>
          What subject is this?
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Give it a name, colour, and icon.
        </p>
      </div>

      {/* Subject name */}
      <div className="space-y-1">
        <label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Subject name</label>
        <input
          type="text"
          value={data.name}
          onChange={e => update('name', e.target.value)}
          placeholder="e.g. Life Sciences, Wiskunde…"
          className="w-full rounded-xl border px-4 py-3 text-base outline-none"
          style={{ background: 'var(--surface-raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
        />
      </div>

      {/* Colour swatches */}
      <div className="space-y-2">
        <label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Colour</label>
        <div className="flex flex-wrap gap-3">
          {COLORS.map(c => (
            <button
              key={c.hex}
              type="button"
              onClick={() => update('color', c.hex)}
              className="rounded-full transition-transform hover:scale-110"
              style={{
                width: 32,
                height: 32,
                background: c.hex,
                outline: data.color === c.hex ? `3px solid ${c.hex}` : 'none',
                outlineOffset: 3,
              }}
              title={c.name}
            />
          ))}
        </div>
      </div>

      {/* Icon emoji grid */}
      <div className="space-y-2">
        <label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Icon</label>
        <div className="grid grid-cols-10 gap-1">
          {ICONS.map(icon => (
            <button
              key={icon}
              type="button"
              onClick={() => update('iconEmoji', icon)}
              className="rounded-xl text-xl p-1.5 transition-colors"
              style={{
                background: data.iconEmoji === icon ? 'var(--surface-raised)' : 'transparent',
                outline: data.iconEmoji === icon ? `2px solid ${data.color}` : 'none',
              }}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Grade */}
      <div className="space-y-2">
        <label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Grade</label>
        <div className="grid grid-cols-6 gap-2">
          {GRADES.map(g => (
            <button
              key={g}
              type="button"
              onClick={() => update('gradeLevel', g)}
              className="rounded-xl py-2.5 text-sm font-semibold border transition-colors"
              style={{
                background: data.gradeLevel === g ? data.color : 'var(--surface-raised)',
                color: data.gradeLevel === g ? '#0F1F1A' : 'var(--text)',
                borderColor: data.gradeLevel === g ? data.color : 'var(--border)',
              }}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        disabled={!step1Valid()}
        onClick={() => setStep(1)}
        className="w-full rounded-xl py-3 font-semibold transition-opacity disabled:opacity-40"
        style={{ background: data.color, color: '#0F1F1A' }}
      >
        Next →
      </button>
    </div>
  )

  // ── Step 2: Language & Exam Date ──────────────────────────────────────────
  const step2 = (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--text)' }}>
          Language & exam date
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Tests for this subject will always be in this language.
        </p>
      </div>

      {/* Language toggle */}
      <div className="grid grid-cols-2 gap-3">
        {(['EN', 'AF'] as const).map(lang => (
          <button
            key={lang}
            type="button"
            onClick={() => update('language', lang)}
            className="rounded-2xl border-2 py-6 flex flex-col items-center gap-2 transition-all"
            style={{
              background: data.language === lang ? `${data.color}22` : 'var(--surface-raised)',
              borderColor: data.language === lang ? data.color : 'var(--border)',
            }}
          >
            <span className="text-3xl">{lang === 'EN' ? '🇬🇧' : '🇿🇦'}</span>
            <span className="font-semibold" style={{ color: data.language === lang ? data.color : 'var(--text)' }}>
              {lang === 'EN' ? 'English' : 'Afrikaans'}
            </span>
          </button>
        ))}
      </div>

      {/* Exam date (optional) */}
      <div className="space-y-1">
        <label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          Exam date <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional — adds countdown to dashboard)</span>
        </label>
        <input
          type="date"
          value={data.examDate}
          onChange={e => update('examDate', e.target.value)}
          className="w-full rounded-xl border px-4 py-3 text-base outline-none"
          style={{ background: 'var(--surface-raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setStep(0)}
          className="flex-1 rounded-xl py-3 font-semibold border"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={() => setStep(2)}
          className="flex-1 rounded-xl py-3 font-semibold"
          style={{ background: data.color, color: '#0F1F1A' }}
        >
          Next →
        </button>
      </div>
    </div>
  )

  // ── Step 3: Upload first material (skippable) ─────────────────────────────
  const [uploadMode, setUploadMode] = useState<'file' | 'video'>('file')
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) setSelectedFile(f)
  }

  const step3 = (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--text)' }}>
          Add your first material
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Upload a PDF, image, or paste a video link. You can skip this and add later.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
        {(['file', 'video'] as const).map(mode => (
          <button
            key={mode}
            type="button"
            onClick={() => setUploadMode(mode)}
            className="flex-1 py-2.5 text-sm font-semibold transition-colors"
            style={{
              background: uploadMode === mode ? data.color : 'var(--surface-raised)',
              color: uploadMode === mode ? '#0F1F1A' : 'var(--text-muted)',
            }}
          >
            {mode === 'file' ? '📄 PDF / Image' : '🎥 Video link'}
          </button>
        ))}
      </div>

      {uploadMode === 'file' ? (
        <div
          className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-10 cursor-pointer transition-colors"
          style={{
            borderColor: dragOver ? data.color : 'var(--border)',
            background: dragOver ? `${data.color}11` : 'var(--surface-raised)',
          }}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <span className="text-3xl">{selectedFile ? '✅' : '📂'}</span>
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            {selectedFile ? selectedFile.name : 'Drag & drop or click to browse'}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>PDF or image · max 20 MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="sr-only"
            onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Video URL</label>
            <input
              id="videoUrl"
              type="url"
              placeholder="https://youtube.com/watch?v=… or NotebookLM link"
              className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
              style={{ background: 'var(--surface-raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Chapter timestamps <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span>
            </label>
            <input
              id="timestamps"
              type="text"
              placeholder='e.g. [{"time":"0:00","label":"Intro"},{"time":"5:30","label":"Main concept"}]'
              className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
              style={{ background: 'var(--surface-raised)', borderColor: 'var(--border)', color: 'var(--text)' }}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm rounded-xl px-4 py-2" style={{ background: '#FF5C5C22', color: 'var(--highlight)' }}>
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="flex-1 rounded-xl py-3 font-semibold border"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          ← Back
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => finishWizard(false)}
          className="flex-1 rounded-xl py-3 font-semibold transition-opacity disabled:opacity-60"
          style={{ background: data.color, color: '#0F1F1A' }}
        >
          {isPending
            ? uploadProgress === 'uploading' ? 'Uploading…' : 'Creating…'
            : selectedFile || uploadMode === 'video' ? 'Save & Upload' : 'Save subject'}
        </button>
      </div>

      <button
        type="button"
        disabled={isPending}
        onClick={() => finishWizard(true)}
        className="w-full text-sm py-2 transition-opacity disabled:opacity-40"
        style={{ color: 'var(--text-muted)' }}
      >
        Skip for now →
      </button>
    </div>
  )

  const steps = [step1, step2, step3]

  // ── Preview pill (shows in steps 2+) ──────────────────────────────────────
  const preview = step > 0 && (
    <div className="flex items-center gap-3 mb-6 rounded-2xl px-4 py-3"
      style={{ background: 'var(--surface-raised)', border: `1px solid ${data.color}44` }}>
      <span className="text-2xl">{data.iconEmoji}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate" style={{ color: 'var(--text)' }}>{data.name}</p>
        {data.gradeLevel && (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Grade {data.gradeLevel}</p>
        )}
      </div>
      <div className="rounded-full w-3 h-3 flex-shrink-0" style={{ background: data.color }} />
    </div>
  )

  return (
    <div className="min-h-dvh flex items-start justify-center px-4 py-8" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md">
        <StepDots current={step} total={3} />
        {preview}
        <div className="rounded-2xl border p-6" style={cardStyle}>
          {steps[step]}
        </div>
      </div>
    </div>
  )
}
