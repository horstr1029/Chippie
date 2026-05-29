# Chippie — Complete Master Plan
> *Slimmer met Chippie / Smarter with Chippie*

---

## 1. Project Identity

| Item | Detail |
|---|---|
| **App Name** | Chippie |
| **Tagline** | *Slimmer met Chippie / Smarter with Chippie* |
| **Mascot** | Chippie — a chimpbot (chimp + robot) with a small antenna, circuit-pattern ear patch, and big expressive eyes |
| **Audience** | Grade 1–12 learners, parents, teachers |
| **Languages** | English & Afrikaans (set per subject) |
| **Curriculum** | South African CAPS / NSC |

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) | Existing server |
| Database | PostgreSQL | Existing server |
| ORM | Prisma | Type-safe schema management |
| File Storage | Local filesystem | Upgradeable to S3 / Supabase |
| AI | Anthropic API — Claude Sonnet 4 | Test generation, reading docs, Ask Chippie |
| Auth | NextAuth.js | Learner / parent / teacher / admin roles |
| Styling | Tailwind CSS + Framer Motion | Animations + theming |
| Notifications | node-cron + in-app toast system | Study reminders, exam countdowns |
| TTS | Web Speech API | Browser-native, free, Grade 1–3 on by default |
| PDF Parsing | pdf-parse (server-side) | Extracts text from uploaded PDFs |
| Image Reading | Claude Vision API | Reads uploaded image-based summaries |
| Font Loading | next/font/google | Fredoka, DM Sans, Caveat, DM Mono |

---

## 3. User Roles

| Role | Permissions |
|---|---|
| **Learner** | Full app — upload materials, generate tests, track progress, earn XP |
| **Parent** | Read-only view of their child's subjects, scores, streaks, weak spots |
| **Teacher** | Create classes, assign subjects, view all learner scores, export PDF reports |
| **Admin** | Manage users, system settings |

---

## 4. Database Schema

```sql
-- Users
users
  id, name, email, password_hash,
  role (learner | parent | teacher | admin),
  grade, avatar_id, xp_points, streak_days,
  theme (dark | light), tts_enabled,
  last_active, created_at

-- Classes (teacher-created)
classes
  id, teacher_id, name, grade_level, join_code, created_at

class_members
  id, class_id, learner_id, joined_at

-- Subjects
subjects
  id, user_id, class_id (nullable),
  name, color, icon_emoji,
  language (en | af), grade_level,
  exam_date (nullable), created_at

-- Uploaded Materials
materials
  id, subject_id,
  type (pdf | image | video),
  filename, file_path, video_url,
  video_timestamps_json,
  extracted_text, version,
  is_active, created_at

-- Practice Tests
practice_tests
  id, subject_id, material_ids[],
  questions_json, language,
  difficulty (easy | medium | hard | boss),
  total_marks, is_boss_test, created_at

-- Test Attempts
test_attempts
  id, practice_test_id, user_id,
  answers_json, score, total_marks,
  time_taken_seconds, personal_best,
  completed_at

-- Flashcards
flashcards
  id, subject_id, material_id,
  front_text, back_text,
  times_seen, times_correct,
  next_review_date, created_at

-- Saved Notes (highlighted from test review)
saved_notes
  id, user_id, subject_id,
  highlighted_text, source_material_id,
  created_at

-- Badges
badges
  id, name, description, icon_emoji,
  xp_reward, condition_type, condition_value

user_badges
  id, user_id, badge_id, earned_at

-- Avatars (Chippie upgrade tiers)
avatars
  id, tier (1 | 2 | 3 | 4), name,
  image_url, xp_required_to_unlock

-- Weak Spots
weak_spots
  id, user_id, subject_id,
  topic, times_wrong, last_flagged_at

-- Notifications
notifications
  id, user_id, type, message,
  is_read, scheduled_for, created_at

-- Inspirational Quotes
quotes
  id, text, language (en | af),
  grade_band (junior | middle | senior),
  context (dashboard | pre_test)
```

---

## 5. App Routes

```
/                                   → Landing page / login
/register                           → Sign up (role selector in wizard)
/dashboard                          → Learner home — bento grid, streak, XP, quote
/subjects/new                       → Subject setup wizard (3 steps)
/subjects/[id]                      → Subject detail — Materials / Tests / Flashcards / Ask Chippie tabs
/subjects/[id]/upload               → Upload PDF, image, or video link
/subjects/[id]/test/new             → Test config (difficulty, marks, question count)
/subjects/[id]/test/[tid]           → Interactive SA-style test (full focus mode)
/subjects/[id]/test/[tid]/results   → Score screen + answer review
/subjects/[id]/flashcards           → Flashcard study mode (spaced repetition)
/subjects/[id]/teach-me             → Ask Chippie — grade-aware topic explanation
/profile                            → Avatar, grade, theme toggle, streaks, badges, XP
/parent/dashboard                   → Parent view — child progress overview
/teacher/dashboard                  → Teacher home — class overview
/teacher/classes/[id]               → Class detail — learner list + scores
/teacher/classes/[id]/export        → PDF report export
/admin                              → User management, system settings
```

---

## 6. Subject Setup Wizard

### Step 1 — Basics
- Subject name (text input)
- Pick a colour (10 preset swatches)
- Pick an icon (emoji grid — sun, atom, book, globe, calculator, palette, etc.)
- Select grade (1–12, large tap-friendly buttons)

### Step 2 — Language & Exam Date
- English / Afrikaans toggle (large visual buttons)
- Optional: Add exam date → activates countdown timer on dashboard
- Helper text: *"Tests for this subject will always be in this language"*

### Step 3 — Upload First Material *(skippable)*
- Drag & drop zone for PDF or image
- OR paste a NotebookLM / YouTube video link
- Add optional video chapter timestamps
- Preview shown before saving

---

## 7. SA Exam-Style Question Formats

All tests mirror CAPS / NSC paper formatting with mark allocations per question.

| Type | Example | Marks |
|---|---|---|
| Multiple choice | Choose the correct answer (A–D) | 1–2 |
| Name / List | Name THREE functions of... | 3 |
| Define | Define the term '...' | 2 |
| Explain / Describe | Explain why osmosis occurs | 3–4 |
| Distinguish between | Distinguish between X and Y | 4 |
| Give reasons | Give TWO reasons why... | 2–4 |
| True/False + correct | Is this TRUE or FALSE? Rewrite if false. | 2 |
| Short essay / Discuss | Discuss the impact of... | 6–8 |
| Diagram-based | Questions referencing uploaded images | varies |

Total marks displayed at top of test. Timer optional and toggleable.

---

## 8. AI Behaviours

| Behaviour | Detail |
|---|---|
| **Source-locked** | Tests generated strictly from uploaded material — not Claude's general knowledge |
| **Grade-aware** | Grade 3 gets simpler sentence structures and vocabulary than Grade 11 |
| **Language-locked** | Prompt always specifies English or Afrikaans per subject setting |
| **CAPS mark allocation** | Claude assigns realistic mark values per question type |
| **Weak spot detection** | After 3+ wrong answers on same topic, Claude flags it in weak_spots table |
| **Ask Chippie mode** | Claude explains a topic back in grade-appropriate language |
| **Spaced repetition** | Claude schedules flashcard review based on performance history |
| **Test review explanations** | After test, Claude quotes from uploaded summary to explain each answer |

---

## 9. Inspirational Moments

### 9.1 Dashboard — Chippie's Daily Quote
Shown at the top of the dashboard every time the app is opened. Seeded by date (same quote all day, changes daily). Switches language based on learner's most-used subject language.

**English examples (Grade 8–12):**
- *"Every expert was once a beginner. Let's get to work 🐒"*
- *"You don't have to be perfect. You just have to show up today."*
- *"One practice test today = one less surprise on exam day 💪"*
- *"Your brain grows every time you study. Literally."*
- *"Chippie believes in you. Do you believe in you? Let's find out."*
- *"Consistent effort beats talent every time."*
- *"The exam doesn't define you — your preparation does."*

**Afrikaans examples (Grade 8–12):**
- *"Elke wenner het eers verloor. Vandag oefen ons 🐒"*
- *"Jy hoef nie perfek te wees nie — net hier te wees."*
- *"Een toets vandag = een minder verrassing in die eksamen 💪"*
- *"Jou brein word sterker elke keer as jy leer. Regtig."*
- *"Chippie glo in jou. Kom wys my hoekom."*

**Grade 1–3 examples:**
- *"Today we learn! 🌟 You are AMAZING!"*
- *"Every time you study, you grow smarter! 🧠✨"*
- *"Chippie is so excited to learn with you today! 🐒"*

### 9.2 Pre-Test — Chippie's Pep Talk
Full-screen Chippie moment after learner taps "Start Test". Animated (bounce/fist pump), 1.5–2 seconds, skippable. Large "Let's go!" button to proceed.

**English examples:**
- *"Breathe. You studied this. Chippie saw you. 🐒"*
- *"This is just practice. No pressure. Just your best."*
- *"Read every question carefully. Take your time. You've got this."*
- *"Mistakes are just lessons in disguise. Let's collect some wisdom."*
- *"The exam doesn't define you — but this practice makes you ready."*

**Afrikaans examples:**
- *"Asem. Jy het dit geleer. Chippie het jou gesien. 🐒"*
- *"Dit is net oefening. Geen druk nie. Net jou beste."*
- *"Lees elke vraag versigtig. Neem jou tyd."*
- *"Foute is lesse in vermomming. Kom ons leer vandag."*
- *"Die eksamen definieer jou nie — maar hierdie oefening maak jou gereed."*

### 9.3 Grade-Aware Tone

| Grade band | Tone |
|---|---|
| Grade 1–3 | Super simple, emoji-heavy, exclamation marks |
| Grade 4–7 | Friendly and encouraging, moderate emoji |
| Grade 8–12 | Motivational, mature, minimal emoji |

### 9.4 Technical Notes
- Store 30+ quotes per language per grade band in `/lib/quotes.ts`
- Dashboard quote: `seed = date string hashed to index` — consistent all day
- Pre-test quote: randomly selected each time from the pool
- Both are skippable — tap anywhere or hit "Let's go!" button

---

## 10. Gamification System

### XP Events
| Action | XP Earned |
|---|---|
| Complete a practice test | +10 |
| Score above 80% | +20 bonus |
| Personal best score | +15 bonus |
| Daily streak (each day) | +5 |
| Upload new material | +5 |
| Complete flashcard session | +8 |
| Beat a Boss Test | +50 |
| First test within 24h of signup | +25 |

### Badges
| Badge | Emoji | Condition |
|---|---|---|
| On Fire | 🔥 | 7-day streak |
| Star Learner | ⭐ | Score 100% on any test |
| Bookworm | 📚 | Upload 10 materials |
| Subject Master | 🏆 | Complete 20 tests in one subject |
| Boss Slayer | 👊 | Pass a Boss Test |
| Bilingual | 🌍 | Use both English and Afrikaans subjects |
| Rocket Start | 🚀 | Complete first test within 24h of signup |
| Consistent | 📅 | 30-day streak |
| Perfect Week | 💎 | Study every day for 7 days |

### Chippie Avatar Upgrade Tiers
| Tier | Name | XP Required |
|---|---|---|
| 1 | Baby Chippie | 0 (default) |
| 2 | Student Chippie | 200 XP |
| 3 | Scholar Chippie | 600 XP |
| 4 | Professor Chippie 🎓 | 1500 XP |

### Boss Test (Chippie's Challenge)
- Unlocks after completing 5 practice tests on a subject
- Harder questions, full exam paper format, timed
- Awards 50 XP + Boss Slayer badge on pass
- Shown with special Chippie animation (serious / determined expression)

### Leaderboard
- Within a class only (teacher must enable it)
- Shows top 5 learners
- Weekly reset every Monday

---

## 11. Progress & Analytics

### Learner View
- Score history graph per subject (line chart)
- Weak spots panel — flagged topics with "Practise this" button
- Subject report card — star rating (1–5 stars) based on average score
- Streak calendar (GitHub contribution grid style)
- Personal best tracker per subject

### Parent View (read-only)
- All subjects + latest scores
- Time spent studying per week
- Streak status
- Weak spots summary
- No ability to edit or interact

### Teacher View
- Class average per subject
- Individual learner breakdown
- Flag struggling learners (below 50% average, highlighted in red)
- Export full class report as PDF

---

## 12. Notifications & Reminders

| Trigger | Message (English) | Message (Afrikaans) |
|---|---|---|
| No activity 3 days | "You haven't practised [Subject] in 3 days 📚" | "Jy het nie [Vak] in 3 dae geoefen nie 📚" |
| Exam in 7 days | "Your [Subject] exam is in 7 days — let's practise! ⏰" | "Jou [Vak] eksamen is oor 7 dae ⏰" |
| Exam in 1 day | "Big day tomorrow! One last [Subject] test? 💪" | "Groot dag môre! Nog een [Vak] toets? 💪" |
| Near personal best | "You're 3 marks away from your best score in [Subject]!" | "Jy is 3 punte van jou beste telling af!" |
| Streak at risk | "Don't break your 🔥 streak — study something today!" | "Moenie jou 🔥 streek breek nie — leer iets vandag!" |
| New badge earned | "You just earned [Badge]! 🏅" | "Jy het sopas [Kenteken] verdien! 🏅" |

---

## 13. Accessibility & Inclusivity

| Feature | Detail |
|---|---|
| Text-to-speech | Web Speech API reads questions aloud; on by default for Grade 1–4 |
| Dyslexia-friendly font | OpenDyslexic toggle in settings |
| Font size control | Small / Medium / Large toggle in settings |
| High contrast mode | Accessible colour theme option |
| Grade-aware language | Grade 1–3 UI uses shorter words and bigger buttons |
| Gentle failure states | Wrong answers never shown harshly — always followed by Chippie explanation |
| Reduced motion | All animations respect `prefers-reduced-motion` |
| Minimum tap target | 48px minimum on all interactive elements |

---

## 14. Design System

### Colour Palettes

**Dark Theme — "Jungle Night"**
| Role | Colour | Hex |
|---|---|---|
| Background | Deep jungle night | `#0F1F1A` |
| Surface | Soft dark green | `#162D26` |
| Surface raised | Card hover / elevated | `#1E3830` |
| Primary accent | Electric lime | `#A8FF3E` |
| Secondary accent | Warm amber | `#FFB830` |
| Highlight | Hot coral | `#FF5C5C` |
| Text primary | Warm white | `#F0EDE6` |
| Text secondary | Muted sage | `#7A9E8E` |
| Border | Subtle green | `#2A4A3E` |

**Light Theme — "Jungle Day"**
| Role | Colour | Hex |
|---|---|---|
| Background | Warm cream | `#F5F0E8` |
| Surface | Clean white | `#FFFFFF` |
| Surface raised | Soft grey | `#F0EBE0` |
| Primary accent | Deep jungle green | `#1A6B4A` |
| Secondary accent | Warm amber | `#FFB830` |
| Highlight | Hot coral | `#FF5C5C` |
| Text primary | Deep charcoal | `#1A1A1A` |
| Text secondary | Warm grey | `#6B7B74` |
| Border | Soft sand | `#E0D8CC` |

### Subject Colour Swatches (10 options)
| Name | Dark Hex | Light Hex |
|---|---|---|
| Lime | `#A8FF3E` | `#4CAF50` |
| Amber | `#FFB830` | `#F59E0B` |
| Coral | `#FF5C5C` | `#EF4444` |
| Sky | `#38BDF8` | `#0EA5E9` |
| Violet | `#A78BFA` | `#7C3AED` |
| Rose | `#FB7185` | `#E11D48` |
| Teal | `#2DD4BF` | `#0D9488` |
| Orange | `#FB923C` | `#EA580C` |
| Indigo | `#818CF8` | `#4338CA` |
| Mint | `#6EE7B7` | `#059669` |

### Typography
| Role | Font | Usage |
|---|---|---|
| Display / headings | **Fredoka** | Page titles, subject names, big numbers |
| Body / UI | **DM Sans** | All body copy, labels, nav items |
| Chippie voice | **Caveat** | Quote cards, Chippie speech, badge reveals |
| Marks / numbers | **DM Mono** | Mark allocations, scores, timers |

Load via `next/font/google`.

### Grade-Aware Scaling
Applied via `data-grade-band` attribute on `<html>`:

| Grade band | Base font | Chippie size | Emoji density | Nav labels |
|---|---|---|---|---|
| 1–3 (junior) | 18px | Large | High | Short + emoji |
| 4–7 (middle) | 16px | Medium | Medium | Standard |
| 8–12 (senior) | 15px | Standard | Low | Text only |

---

## 15. Layout System

### Dashboard — Bento Grid
Irregular asymmetric CSS Grid with named areas. Mobile-first, scales to tablet and desktop.

```
Desktop layout:
┌──────────────────────────────────────────┐
│         Chippie Quote of the Day         │  full width — Caveat font
├─────────────┬─────────────┬──────────────┤
│             │             │  🔥 Streak   │
│  Subject 1  │  Subject 2  │  12 days     │
│  (tall)     │             ├──────────────┤
│             ├─────────────┤  ⭐ XP       │
│             │  Subject 3  │  1,240 pts   │
├─────────────┴──────┬───────┴─────────────┤
│    Subject 4       │    Subject 5         │
│    Exam in 4 days  │                      │
└────────────────────┴──────────────────────┘

Mobile layout:
┌─────────────────────┐
│  Chippie Quote      │  full width
├──────────┬──────────┤
│Subject 1 │Subject 2 │  2-column
├──────────┴──────────┤
│  Subject 3 (wide)   │  occasional full width
├──────────┬──────────┤
│ 🔥Streak │ ⭐ XP   │
└──────────┴──────────┘
```

### Subject Detail Page
- Sticky top tab bar: Materials / Tests / Flashcards / Ask Chippie
- Content scrolls below tabs
- Floating action button (bottom right): context-aware per active tab

### Test Screen — Full Focus Mode
- App chrome removed (no nav, no sidebar)
- Progress bar top + timer top right (toggleable)
- Question large and centred
- Answer inputs / buttons in lower half
- Exit via explicit X button with confirmation modal

### Pre-Test Screen
```
┌─────────────────────────────────┐
│                                 │
│         🐒 (animated)           │
│                                 │
│   "Breathe. You studied this.   │
│    Chippie saw you."            │
│                                 │
│   ┌─────────────────────────┐   │
│   │      Let's go! 🚀       │   │
│   └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

### Navigation
| Breakpoint | Nav style |
|---|---|
| < 640px | Bottom tab bar — 5 icons: Home, Subjects, Tests, Progress, Profile |
| 640–1024px | Bottom tab bar — fuller bento |
| > 1024px | Left sidebar — collapsible, Chippie avatar top, XP bar bottom |

---

## 16. Chippie's Presence Map

Chippie appears only at meaningful moments — never cluttering the UI.

| Screen | Chippie moment | Expression |
|---|---|---|
| Dashboard | Daily quote card | Neutral / waving |
| Pre-test screen | Full motivational moment | Excited / fist pump |
| Correct answer | Small pop-up bottom right | Happy / jumping |
| Wrong answer | Small pop-up bottom right | Sympathetic / thinking |
| Personal best | Centred celebration | Proud / arms up |
| Badge earned | Badge reveal modal | Excited |
| Empty state | Welcome / onboarding | Waving |
| Boss Test intro | Full screen moment | Serious / determined |

Chippie is **absent** from all other screens — nav, settings, forms, upload screens.

### Chippie Expressions (6 states)
`neutral` | `happy` | `excited` | `thinking` | `sad` | `proud`

### Chippie Design Spec
- Style: Flat vector, slightly chunky lines — sticker aesthetic
- Details: Small antenna on head, circuit-pattern patch on ear, big round eyes
- Animation: Framer Motion spring bounce, idle loop, fist pump, wobble

---

## 17. Animation System

| Moment | Animation |
|---|---|
| Page transitions | Fade + slight upward slide (120ms) |
| Card hover | Subtle lift + border glow (CSS transform) |
| Chippie appearances | Bounce in from bottom (Framer Motion spring) |
| Score reveal | Count-up number animation |
| Celebration | Canvas confetti burst (on personal best or 80%+) |
| Badge unlock | Flip card reveal + glow pulse |
| Progress bar fill | Smooth animated fill on mount |
| Theme toggle | CSS transition on root CSS vars |
| Pre-test Chippie | Full bounce sequence 1.5s then idle loop |

All animations respect `prefers-reduced-motion`.

---

## 18. Component Library

| Component | Notes |
|---|---|
| `<SubjectCard>` | Colour-coded, avg score, exam countdown badge if set |
| `<ChippieQuote>` | Caveat font, themed background, daily / random prop |
| `<ChippieMoment>` | Full or partial screen, accepts expression prop |
| `<BentoGrid>` | CSS Grid wrapper with named area templates |
| `<TestQuestion>` | Handles all SA question types — MCQ, text input, T/F |
| `<ProgressHUD>` | Top bar during test — progress + optional timer |
| `<ScoreReveal>` | Animated count-up, confetti trigger, Chippie reaction |
| `<BadgeModal>` | Flip reveal, glow, XP awarded display |
| `<WizardStep>` | Step wrapper with back/next nav and dot indicator |
| `<ThemeToggle>` | Sun/moon icon, smooth CSS var transition |
| `<StreakCard>` | Fire emoji, day count, contribution calendar grid |
| `<XPBar>` | Animated fill, tier label, next tier preview |
| `<FlashCard>` | Flip animation, front/back, self-rating buttons |
| `<WeakSpotPanel>` | Flagged topics list, "Practise this" CTA per topic |
| `<ExamCountdown>` | Days remaining, colour shifts as exam approaches |

---

## 19. File & Folder Structure

```
/app
  /dashboard
  /subjects
    /new
    /[id]
      /upload
      /test
        /new
        /[tid]
          /results
      /flashcards
      /teach-me
  /profile
  /parent/dashboard
  /teacher
    /dashboard
    /classes/[id]/export
  /admin

/components
  /ui          ← all reusable components above
  /chippie     ← Chippie SVG assets + expression variants
  /layout      ← Sidebar, BottomNav, BentoGrid

/lib
  /ai.ts       ← Anthropic API calls (test gen, flashcards, teach-me)
  /quotes.ts   ← All inspirational quotes (en/af, by grade band and context)
  /xp.ts       ← XP calculation and badge award logic
  /spaced.ts   ← Spaced repetition scheduling

/styles
  tokens.css         ← CSS variables for both themes
  typography.css     ← Font scale
  animations.css     ← Keyframes + motion utilities
  grade-scale.css    ← Grade-band font/size overrides

/prisma
  schema.prisma

/public
  /chippie     ← Chippie SVG/PNG assets per expression and tier
```

---

## 20. Build Phases

### Phase 1 — MVP
Core loop: upload → generate test → take test → see score

- Auth (learner login, register)
- Subject setup wizard
- Material upload (PDF, image, video link)
- Test generation (SA exam style, Claude API)
- Interactive test screen (full focus mode)
- Score screen + answer review
- Basic dashboard (subject cards, bento grid)
- Daily Chippie quote
- Pre-test Chippie pep talk
- Theme toggle (dark / light)

### Phase 2 — Engagement
Bringing learners back daily

- Flashcard mode (auto-generated from material)
- Weak spots detection + panel
- Streak tracker + XP system
- Badges (initial set)
- Chippie avatar upgrade tiers
- Exam countdown per subject
- Ask Chippie (teach-me mode)
- Spaced repetition scheduling
- Highlight & save notes from test review

### Phase 3 — Social & Reporting
Schools and families

- Parent dashboard (read-only)
- Teacher / class mode
- Class leaderboard (teacher-enabled)
- PDF report export
- Struggling learner flagging

### Phase 4 — Polish & Accessibility
Delight and inclusion

- Text-to-speech (Web Speech API)
- Dyslexia-friendly font toggle
- Font size control
- High contrast mode
- Boss Test (Chippie's Challenge)
- Push / email notifications (node-cron)
- Spaced repetition reminders
- Bulk material upload

---

## 21. Environment Variables Required

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
ANTHROPIC_API_KEY=
UPLOAD_DIR=./uploads
```

---

## 22. Handoff Checklist for Claude CLI

Before starting, provide:
- [ ] This document
- [ ] Next.js project structure (`ls` output or repo link)
- [ ] Postgres connection string
- [ ] Preferred package manager (npm / yarn / pnpm)
- [ ] Any existing Tailwind config or design tokens
- [ ] Anthropic API key env var name
- [ ] Upload directory path / storage preference

Build order: **Phase 1 first, validate end-to-end, then Phase 2.**

---

*Chippie Master Plan — ready for development*
*Leer slimmer. Study smarter. 🐒*
