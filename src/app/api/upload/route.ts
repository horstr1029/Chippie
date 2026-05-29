import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads'
const MAX_FILE_SIZE = 200 * 1024 * 1024 // 200 MB (covers video)

const PDF_EXTS = new Set(['.pdf'])
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])
const VIDEO_EXTS = new Set(['.mp4', '.mov', '.webm'])

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const subjectId = formData.get('subjectId') as string
  const file = formData.get('file') as File | null

  if (!subjectId) return NextResponse.json({ error: 'subjectId required' }, { status: 400 })
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const subject = await prisma.subject.findFirst({
    where: { id: subjectId, userId: session.user.id },
  })
  if (!subject) return NextResponse.json({ error: 'Subject not found' }, { status: 404 })

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large (max 200 MB)' }, { status: 400 })
  }

  const ext = path.extname(file.name).toLowerCase()
  const isPdf = PDF_EXTS.has(ext)
  const isImage = IMAGE_EXTS.has(ext)
  const isVideo = VIDEO_EXTS.has(ext)

  if (!isPdf && !isImage && !isVideo) {
    return NextResponse.json(
      { error: 'Unsupported file type. Upload a PDF, image, or MP4/MOV/WebM video.' },
      { status: 400 }
    )
  }

  // Save to disk
  const dir = path.join(/*turbopackIgnore: true*/ process.cwd(), UPLOAD_DIR, subjectId)
  await mkdir(dir, { recursive: true })
  const filename = `${Date.now()}-${file.name.replace(/[^a-z0-9._-]/gi, '_')}`
  const filePath = path.join(dir, filename)
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filePath, buffer)

  const relativePath = path.relative(/*turbopackIgnore: true*/ process.cwd(), filePath)

  // Extract text from PDF
  let extractedText: string | null = null
  if (isPdf) {
    try {
      const { PDFParse } = await import('pdf-parse')
      const parser = new PDFParse({ data: new Uint8Array(buffer) })
      const result = await parser.getText()
      extractedText = result.text
    } catch {
      // Non-fatal — test generation will note limited text
    }
  }

  const materialType = isPdf ? 'PDF' : isImage ? 'IMAGE' : 'VIDEO'

  const material = await prisma.material.create({
    data: {
      subjectId,
      type: materialType,
      filename: file.name,
      filePath: relativePath,
      extractedText,
    },
  })

  return NextResponse.json({ materialId: material.id })
}
