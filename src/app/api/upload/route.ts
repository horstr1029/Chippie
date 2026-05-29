import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readFile, unlink } from 'fs/promises'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { tmpdir } from 'os'
import path from 'path'
import { PDFParse } from 'pdf-parse'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { extractTextFromImages } from '@/lib/ai'

const execFileAsync = promisify(execFile)
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads'
const MAX_FILE_SIZE = 200 * 1024 * 1024

const PDF_EXTS = new Set(['.pdf'])
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])
const VIDEO_EXTS = new Set(['.mp4', '.mov', '.webm'])

async function pdfToBase64Images(pdfPath: string): Promise<string[]> {
  const outPrefix = path.join(tmpdir(), `chippie-${Date.now()}`)
  try {
    // pdftoppm renders each page as a PPM file; -r 150 = 150 dpi (good balance of quality/size)
    await execFileAsync('pdftoppm', ['-r', '150', '-png', pdfPath, outPrefix])
  } catch (err) {
    throw new Error(`pdftoppm failed: ${(err as Error).message}`)
  }

  // Collect generated files (sorted by page order)
  const { readdir } = await import('fs/promises')
  const tmp = tmpdir()
  const prefix = path.basename(outPrefix)
  const files = (await readdir(tmp))
    .filter(f => f.startsWith(prefix) && f.endsWith('.png'))
    .sort()
    .map(f => path.join(tmp, f))

  const base64Images: string[] = []
  for (const f of files) {
    const buf = await readFile(f)
    base64Images.push(buf.toString('base64'))
    await unlink(f).catch(() => {})
  }
  return base64Images
}

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

  let extractedText: string | null = null

  if (isPdf) {
    // Try text extraction first
    try {
      const parser = new PDFParse({ data: new Uint8Array(buffer) })
      const result = await parser.getText()
      const trimmed = result.text?.trim() ?? ''
      if (trimmed.length > 50) {
        extractedText = result.text
      }
    } catch (err) {
      console.error('[upload] PDF text parse error:', err)
    }

    // If no text layer found, use vision OCR via pdftoppm + llama3.2-vision
    if (!extractedText) {
      try {
        console.log('[upload] No text layer — running vision OCR on PDF pages')
        const images = await pdfToBase64Images(filePath)
        if (images.length > 0) {
          extractedText = await extractTextFromImages(images)
          console.log(`[upload] Vision OCR extracted ${extractedText.length} chars from ${images.length} pages`)
        }
      } catch (err) {
        console.error('[upload] Vision OCR error:', err)
      }
    }
  }

  if (isImage) {
    // Use vision OCR for all uploaded images
    try {
      console.log('[upload] Running vision OCR on image')
      const base64 = buffer.toString('base64')
      extractedText = await extractTextFromImages([base64])
      console.log(`[upload] Vision OCR extracted ${extractedText.length} chars`)
    } catch (err) {
      console.error('[upload] Image vision OCR error:', err)
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

  const hasText = extractedText && extractedText.trim().length > 50
  const parseWarning = !isVideo && !hasText
    ? 'Could not extract readable text from this file. It will be saved but cannot be used for test generation.'
    : null

  return NextResponse.json({ materialId: material.id, parseWarning })
}
