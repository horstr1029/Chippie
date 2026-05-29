const BASE_URL = (process.env.OPENWEBUI_BASE_URL ?? 'https://mst.gloworm.org.za').replace(/\/$/, '')
const API_KEY = process.env.OPENWEBUI_API_KEY ?? ''
const CF_ID = process.env.CF_ACCESS_CLIENT_ID ?? ''
const CF_SECRET = process.env.CF_ACCESS_CLIENT_SECRET ?? ''
const MODEL = process.env.OPENWEBUI_MODEL ?? 'llama3.1:8b-instruct-q8_0'

async function chat(prompt: string, temperature = 0.3): Promise<string> {
  const res = await fetch(`${BASE_URL}/ollama/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY && { Authorization: `Bearer ${API_KEY}` }),
      ...(CF_ID && { 'CF-Access-Client-Id': CF_ID }),
      ...(CF_SECRET && { 'CF-Access-Client-Secret': CF_SECRET }),
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      options: { temperature },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`AI request failed (${res.status}): ${text}`)
  }

  const data = await res.json() as { message?: { content?: string } }
  return data.message?.content ?? ''
}

export type QuestionType =
  | 'multiple_choice'
  | 'name_list'
  | 'define'
  | 'explain'
  | 'distinguish'
  | 'give_reasons'
  | 'true_false'
  | 'short_essay'

export type Difficulty = 'easy' | 'medium' | 'hard' | 'boss'

export interface Question {
  id: string
  type: QuestionType
  question: string
  marks: number
  options?: string[]
  correctAnswer: string
  modelAnswer: string
  topic: string
}

export interface GeneratedTest {
  questions: Question[]
  totalMarks: number
  language: 'en' | 'af'
  difficulty: Difficulty
}

export async function generateTest(params: {
  subjectName: string
  gradeLevel: number
  language: 'en' | 'af'
  difficulty: Difficulty
  questionCount: number
  extractedText: string
}): Promise<GeneratedTest> {
  const { subjectName, gradeLevel, language, difficulty, questionCount, extractedText } = params

  const langLabel = language === 'af' ? 'Afrikaans' : 'English'
  const difficultyGuide = {
    easy: 'simple recall and definition questions',
    medium: 'mix of recall, explanation, and application questions',
    hard: 'analysis, comparison, and longer-answer questions',
    boss: 'full exam-paper style — all question types, harder application and essay questions',
  }[difficulty]

  const prompt = `You are a South African CAPS/NSC exam paper generator for Grade ${gradeLevel} ${subjectName}.

Generate exactly ${questionCount} questions in ${langLabel} based ONLY on the following study material. Do not use outside knowledge.

STUDY MATERIAL:
${extractedText.slice(0, 12000)}

REQUIREMENTS:
- All questions must come strictly from the study material above
- Use SA exam question types: multiple_choice, name_list, define, explain, distinguish, give_reasons, true_false, short_essay
- Assign realistic CAPS mark allocations per question type
- Difficulty level: ${difficulty} — ${difficultyGuide}
- Grade level: ${gradeLevel} — use appropriate vocabulary and complexity
- Language: ${langLabel}

Return a JSON object with this exact structure (no markdown, no explanation — just the JSON):
{
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "...",
      "marks": 2,
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctAnswer": "A. ...",
      "modelAnswer": "The correct answer is A because...",
      "topic": "topic name from the material"
    }
  ],
  "totalMarks": 0
}

For non-MCQ questions, omit the "options" field. The "totalMarks" should be the sum of all question marks.`

  const raw = await chat(prompt, 0.3)
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('AI returned no valid JSON')

  const parsed = JSON.parse(jsonMatch[0]) as { questions: Question[]; totalMarks: number }
  const totalMarks = parsed.questions.reduce((sum, q) => sum + q.marks, 0)

  return { questions: parsed.questions, totalMarks, language, difficulty }
}

export async function explainAnswer(params: {
  question: string
  correctAnswer: string
  learnerAnswer: string
  subjectName: string
  gradeLevel: number
  language: 'en' | 'af'
  sourceText: string
}): Promise<string> {
  const { question, correctAnswer, learnerAnswer, subjectName, gradeLevel, language, sourceText } = params
  const langLabel = language === 'af' ? 'Afrikaans' : 'English'

  const prompt = `You are Chippie, a friendly study assistant for a Grade ${gradeLevel} ${subjectName} learner.

The learner answered a question incorrectly. Explain the correct answer in simple, encouraging ${langLabel} appropriate for Grade ${gradeLevel}. Quote from the study material where possible.

QUESTION: ${question}
LEARNER'S ANSWER: ${learnerAnswer}
CORRECT ANSWER: ${correctAnswer}

STUDY MATERIAL EXCERPT:
${sourceText.slice(0, 3000)}

Give a short (2–4 sentence) explanation. Be encouraging, not harsh.`

  return chat(prompt, 0.5)
}
