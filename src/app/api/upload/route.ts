import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads'
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const subjectId = formData.get('subjectId') as string
  const file = formData.get('file') as File | null
  const videoUrl = formData.get('videoUrl') as string | null
  const videoTimestamps = formData.get('videoTimestamps') as string | null

  if (!subjectId) return NextResponse.json({ error: 'subjectId required' }, { status: 400 })

  // Verify subject belongs to user
  const subject = await prisma.subject.findFirst({
    where: { id: subjectId, userId: session.user.id },
  })
  if (!subject) return NextResponse.json({ error: 'Subject not found' }, { status: 404 })

  // Video link
  if (videoUrl) {
    const material = await prisma.material.create({
      data: {
        subjectId,
        type: 'VIDEO',
        videoUrl,
        videoTimestampsJson: videoTimestamps ? JSON.parse(videoTimestamps) : null,
      },
    })
    return NextResponse.json({ materialId: material.id })
  }

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'File too large (max 20 MB)' }, { status: 400 })

  const ext = path.extname(file.name).toLowerCase()
  const isPdf = ext === '.pdf'
  const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)
  if (!isPdf && !isImage) return NextResponse.json({ error: 'Only PDF and image files are supported' }, { status: 400 })

  // Save to disk
  const dir = path.join(process.cwd(), UPLOAD_DIR, subjectId)
  await mkdir(dir, { recursive: true })
  const filename = `${Date.now()}-${file.name.replace(/[^a-z0-9._-]/gi, '_')}`
  const filePath = path.join(dir, filename)
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filePath, buffer)

  // Extract text from PDF
  let extractedText: string | null = null
  if (isPdf) {
    try {
      const { PDFParse } = await import('pdf-parse')
      const parser = new PDFParse({ data: new Uint8Array(buffer) })
      const result = await parser.getText()
      extractedText = result.text
    } catch {
      // PDF parse failure is non-fatal — test generation will note limited text
    }
  }

  const material = await prisma.material.create({
    data: {
      subjectId,
      type: isPdf ? 'PDF' : 'IMAGE',
      filename: file.name,
      filePath: path.relative(process.cwd(), filePath),
      extractedText,
    },
  })

  return NextResponse.json({ materialId: material.id })
}
