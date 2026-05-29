export type GradeBand = 'junior' | 'middle' | 'senior'
export type QuoteContext = 'dashboard' | 'pre_test'
export type Language = 'en' | 'af'

export interface Quote {
  text: string
  language: Language
  gradeBand: GradeBand
  context: QuoteContext
}

export function getGradeBand(grade: number | null): GradeBand {
  if (!grade || grade <= 3) return 'junior'
  if (grade <= 7) return 'middle'
  return 'senior'
}

// ── Daily quote (date-seeded, consistent all day) ─────────────────────────────
export function getDailyQuote(grade: number | null, language: Language = 'en'): Quote {
  const band = getGradeBand(grade)
  const pool = QUOTES.filter(q => q.gradeBand === band && q.context === 'dashboard' && q.language === language)
  const fallback = QUOTES.filter(q => q.gradeBand === band && q.context === 'dashboard')
  const source = pool.length ? pool : fallback
  const seed = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const index = seed.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % source.length
  return source[index]
}

// ── Random pre-test pep talk ──────────────────────────────────────────────────
export function getPepTalk(grade: number | null, language: Language = 'en'): Quote {
  const band = getGradeBand(grade)
  const pool = QUOTES.filter(q => q.gradeBand === band && q.context === 'pre_test' && q.language === language)
  const fallback = QUOTES.filter(q => q.gradeBand === band && q.context === 'pre_test')
  const source = pool.length ? pool : fallback
  return source[Math.floor(Math.random() * source.length)]
}

// ── Quote bank ────────────────────────────────────────────────────────────────
export const QUOTES: Quote[] = [
  // ── JUNIOR · EN · dashboard ─────────────────────────────────────────────
  { text: "Today we learn! 🌟 You are AMAZING!", language: 'en', gradeBand: 'junior', context: 'dashboard' },
  { text: "Every time you study, you grow smarter! 🧠✨", language: 'en', gradeBand: 'junior', context: 'dashboard' },
  { text: "Chippie is so excited to learn with you today! 🐒", language: 'en', gradeBand: 'junior', context: 'dashboard' },
  { text: "You are a star learner! ⭐ Let's go!", language: 'en', gradeBand: 'junior', context: 'dashboard' },
  { text: "Practice makes perfect! 🎯 Let's do it!", language: 'en', gradeBand: 'junior', context: 'dashboard' },
  { text: "Your brain is like a muscle — it gets stronger when you use it! 💪", language: 'en', gradeBand: 'junior', context: 'dashboard' },
  { text: "Even Chippie had to learn the alphabet once! You've got this! 🐒", language: 'en', gradeBand: 'junior', context: 'dashboard' },

  // ── JUNIOR · EN · pre_test ──────────────────────────────────────────────
  { text: "You can do it! Chippie believes in you! 🐒💛", language: 'en', gradeBand: 'junior', context: 'pre_test' },
  { text: "Take a deep breath. Read carefully. You're ready! 🌟", language: 'en', gradeBand: 'junior', context: 'pre_test' },
  { text: "Chippie studied with you — you know this stuff! 🐒", language: 'en', gradeBand: 'junior', context: 'pre_test' },
  { text: "Do your best and Chippie will be so proud! 🌈", language: 'en', gradeBand: 'junior', context: 'pre_test' },

  // ── JUNIOR · AF · dashboard ─────────────────────────────────────────────
  { text: "Vandag leer ons! 🌟 Jy is AMAZING!", language: 'af', gradeBand: 'junior', context: 'dashboard' },
  { text: "Elke keer as jy oefen, word jy slimmer! 🧠✨", language: 'af', gradeBand: 'junior', context: 'dashboard' },
  { text: "Chippie is so opgewonde om saam met jou te leer vandag! 🐒", language: 'af', gradeBand: 'junior', context: 'dashboard' },
  { text: "Jy is 'n sterleerling! ⭐ Kom ons gaan!", language: 'af', gradeBand: 'junior', context: 'dashboard' },

  // ── JUNIOR · AF · pre_test ──────────────────────────────────────────────
  { text: "Jy kan dit doen! Chippie glo in jou! 🐒💛", language: 'af', gradeBand: 'junior', context: 'pre_test' },
  { text: "Neem 'n diep asem. Lees versigtig. Jy is gereed! 🌟", language: 'af', gradeBand: 'junior', context: 'pre_test' },

  // ── MIDDLE · EN · dashboard ─────────────────────────────────────────────
  { text: "Every expert was once a beginner. Today you take another step. 🚀", language: 'en', gradeBand: 'middle', context: 'dashboard' },
  { text: "One practice session today = one less surprise on test day. 📚", language: 'en', gradeBand: 'middle', context: 'dashboard' },
  { text: "Your future self will thank you for studying today. 🙌", language: 'en', gradeBand: 'middle', context: 'dashboard' },
  { text: "Hard work beats talent when talent doesn't work hard. 💪", language: 'en', gradeBand: 'middle', context: 'dashboard' },
  { text: "Chippie is watching. Make your brain proud. 🐒", language: 'en', gradeBand: 'middle', context: 'dashboard' },
  { text: "A little progress every day adds up to big results. 📈", language: 'en', gradeBand: 'middle', context: 'dashboard' },
  { text: "Don't wish for it — work for it! 🔥", language: 'en', gradeBand: 'middle', context: 'dashboard' },
  { text: "You don't have to be perfect. You just have to start. ✏️", language: 'en', gradeBand: 'middle', context: 'dashboard' },

  // ── MIDDLE · EN · pre_test ──────────────────────────────────────────────
  { text: "Breathe. You've studied this. Chippie saw you. 🐒", language: 'en', gradeBand: 'middle', context: 'pre_test' },
  { text: "Read every question carefully. You've got this.", language: 'en', gradeBand: 'middle', context: 'pre_test' },
  { text: "This is practice. No pressure — just your best. 💛", language: 'en', gradeBand: 'middle', context: 'pre_test' },
  { text: "Mistakes are just lessons in disguise. Let's learn something today.", language: 'en', gradeBand: 'middle', context: 'pre_test' },

  // ── MIDDLE · AF · dashboard ─────────────────────────────────────────────
  { text: "Elke wenner het eers verloor. Vandag oefen ons. 🐒", language: 'af', gradeBand: 'middle', context: 'dashboard' },
  { text: "Een oefeningsessie vandag = een minder verrassing op toetsdag. 📚", language: 'af', gradeBand: 'middle', context: 'dashboard' },
  { text: "Jou toekomstige self sal jou bedank vir vandag se studie. 🙌", language: 'af', gradeBand: 'middle', context: 'dashboard' },
  { text: "Chippie kyk. Maak jou brein trots. 🐒", language: 'af', gradeBand: 'middle', context: 'dashboard' },

  // ── MIDDLE · AF · pre_test ──────────────────────────────────────────────
  { text: "Asem. Jy het dit geleer. Chippie het jou gesien. 🐒", language: 'af', gradeBand: 'middle', context: 'pre_test' },
  { text: "Lees elke vraag versigtig. Jy het dit. 💛", language: 'af', gradeBand: 'middle', context: 'pre_test' },

  // ── SENIOR · EN · dashboard ─────────────────────────────────────────────
  { text: "Every expert was once a beginner. Let's get to work. 🐒", language: 'en', gradeBand: 'senior', context: 'dashboard' },
  { text: "You don't have to be perfect. You just have to show up today.", language: 'en', gradeBand: 'senior', context: 'dashboard' },
  { text: "One practice test today = one less surprise on exam day. 💪", language: 'en', gradeBand: 'senior', context: 'dashboard' },
  { text: "Your brain grows every time you study. Literally.", language: 'en', gradeBand: 'senior', context: 'dashboard' },
  { text: "Chippie believes in you. Do you believe in you? Let's find out.", language: 'en', gradeBand: 'senior', context: 'dashboard' },
  { text: "Consistent effort beats talent every time.", language: 'en', gradeBand: 'senior', context: 'dashboard' },
  { text: "The exam doesn't define you — your preparation does.", language: 'en', gradeBand: 'senior', context: 'dashboard' },
  { text: "Discipline is choosing between what you want now and what you want most.", language: 'en', gradeBand: 'senior', context: 'dashboard' },
  { text: "The only way out is through. Start now.", language: 'en', gradeBand: 'senior', context: 'dashboard' },
  { text: "Results happen over time, not overnight. Keep going.", language: 'en', gradeBand: 'senior', context: 'dashboard' },

  // ── SENIOR · EN · pre_test ──────────────────────────────────────────────
  { text: "Breathe. You studied this. Chippie saw you. 🐒", language: 'en', gradeBand: 'senior', context: 'pre_test' },
  { text: "This is just practice. No pressure. Just your best.", language: 'en', gradeBand: 'senior', context: 'pre_test' },
  { text: "Read every question carefully. Take your time. You've got this.", language: 'en', gradeBand: 'senior', context: 'pre_test' },
  { text: "Mistakes are just lessons in disguise. Let's collect some wisdom.", language: 'en', gradeBand: 'senior', context: 'pre_test' },
  { text: "The exam doesn't define you — but this practice makes you ready.", language: 'en', gradeBand: 'senior', context: 'pre_test' },

  // ── SENIOR · AF · dashboard ─────────────────────────────────────────────
  { text: "Elke wenner het eers verloor. Vandag oefen ons. 🐒", language: 'af', gradeBand: 'senior', context: 'dashboard' },
  { text: "Jy hoef nie perfek te wees nie — net hier te wees.", language: 'af', gradeBand: 'senior', context: 'dashboard' },
  { text: "Een toets vandag = een minder verrassing in die eksamen. 💪", language: 'af', gradeBand: 'senior', context: 'dashboard' },
  { text: "Jou brein word sterker elke keer as jy leer. Regtig.", language: 'af', gradeBand: 'senior', context: 'dashboard' },
  { text: "Chippie glo in jou. Kom wys my hoekom.", language: 'af', gradeBand: 'senior', context: 'dashboard' },
  { text: "Konsekwente inspanning klop talent elke keer.", language: 'af', gradeBand: 'senior', context: 'dashboard' },
  { text: "Die eksamen definieer jou nie — jou voorbereiding doen dit.", language: 'af', gradeBand: 'senior', context: 'dashboard' },

  // ── SENIOR · AF · pre_test ──────────────────────────────────────────────
  { text: "Asem. Jy het dit geleer. Chippie het jou gesien. 🐒", language: 'af', gradeBand: 'senior', context: 'pre_test' },
  { text: "Dit is net oefening. Geen druk nie. Net jou beste.", language: 'af', gradeBand: 'senior', context: 'pre_test' },
  { text: "Lees elke vraag versigtig. Neem jou tyd.", language: 'af', gradeBand: 'senior', context: 'pre_test' },
  { text: "Foute is lesse in vermomming. Kom ons leer vandag.", language: 'af', gradeBand: 'senior', context: 'pre_test' },
  { text: "Die eksamen definieer jou nie — maar hierdie oefening maak jou gereed.", language: 'af', gradeBand: 'senior', context: 'pre_test' },
]
