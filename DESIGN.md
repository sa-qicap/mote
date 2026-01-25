# Mote

*Motes of knowledge, connected.*

A focused learning app that breaks down books into digestible concepts.

---

## Vision

Help learners conquer any book through a divide-and-conquer approach. Break content into small concepts (15-20 min each), visualize connections, and provide a distraction-free learning experience.

---

## Core Principles

1. **One thing at a time** - Minimize cognitive load
2. **Flexible pacing** - No daily quotas, no guilt
3. **Active learning** - Completion requires answering questions
4. **Always available help** - LLM tutor on standby
5. **Capture thoughts** - Notes and bookmarks throughout

---

## Features

### 1. Book Ingestion
- Upload PDF/ebook
- AI extracts and organizes content into:
  - **Branches** (1:1 with book chapters)
  - **Concepts** (atomic learning units, ~15-20 min each)
- AI determines concept dependencies for mind map edges

### 2. Mind Map
- Visual graph of all concepts
- Nodes colored by status (completed, in-progress, available, suggested)
- Click any node to start learning
- Shows overall progress

### 3. Learning Flow (per concept)

| Phase | Purpose | Completion Trigger |
|-------|---------|-------------------|
| PRIME | Summary, key takeaways | Click continue |
| LEARN | Full content from book | Click continue |
| TEST | 3-5 questions | Answer all questions |
| REFLECT | Score, review mistakes | Auto after TEST |

**A concept is only marked complete after TEST phase.**

### 4. Continue Button
- Auto-selects next uncompleted concept
- Follows linear chapter order
- Wraps around to find skipped concepts
- Zero-decision way to keep learning

### 5. Notes & Bookmarks
- Available in all phases (except TEST)
- Highlight text → quick actions (bookmark, note, ask)
- Dedicated notes tab per book
- Searchable, organized by chapter

### 6. LLM Chat Assistant
- Context-aware (knows current concept, phase, user progress)
- Available via `Ask` button or highlight → ask
- **Phase behavior:**
  - PRIME/LEARN: Explains, clarifies, gives examples
  - TEST: Hints only, Socratic method, no direct answers
  - REFLECT: Discusses mistakes, deeper exploration
- Chat history saved per concept

### 7. Virtual Pet
- Small, unobtrusive, lives in corner
- States: curious (learning), thinking (testing), celebrating (completed)
- Positive reinforcement only, never negative

---

## Data Model

```
User
├── id
├── email
├── createdAt
└── preferences: { theme, petName }

Book
├── id
├── userId
├── title
├── author
├── sourceFile (PDF path/url)
├── totalConcepts
├── createdAt
└── updatedAt

Branch
├── id
├── bookId
├── title (chapter name)
├── chapterNumber (determines order)
└── conceptIds[]

Concept
├── id
├── bookId
├── branchId
├── title
├── summary (AI-generated, for PRIME phase)
├── content (extracted from book, for LEARN phase)
├── orderInBranch
├── dependencies[] (conceptIds, soft - for mind map edges)
├── estimatedMinutes
└── questions[]

Question
├── id
├── conceptId
├── type: 'mcq' | 'short' | 'reflection'
├── text
├── options[] (for mcq)
├── correctAnswer
└── sourceRef (page/section in book)

UserProgress
├── userId
├── bookId
├── currentConceptId
├── completedConceptIds[]
├── lastStudyDate
└── conceptProgress: Map<conceptId, ConceptProgress>

ConceptProgress
├── oderId
├── conceptId
├── status: 'not_started' | 'primed' | 'learning' | 'testing' | 'completed'
├── scrollPosition (for resuming LEARN phase)
├── questionAnswers: [{ questionId, answer, correct }]
├── primedAt
├── learningStartedAt
├── testingStartedAt
├── completedAt
└── timeSpent: { prime: ms, learn: ms, test: ms }

Note
├── id
├── userId
├── bookId
├── conceptId (nullable - can be book-level)
├── phase: 'prime' | 'learn' | 'reflect' | 'general'
├── content (markdown)
├── highlight: { text, startOffset, endOffset } (optional)
└── createdAt

Bookmark
├── id
├── userId
├── bookId
├── conceptId
├── phase
├── highlightedText
├── annotation (optional short note)
└── createdAt

ConceptChat
├── id
├── userId
├── conceptId
├── messages: [{
│     role: 'user' | 'assistant'
│     content: string
│     phase: string
│     timestamp: Date
│     relatedHighlight?: string
│   }]
└── updatedAt
```

---

## User Flows

### First Time User
```
Upload PDF
    ↓
"Processing your book..." (AI extraction)
    ↓
Mind map appears with all concepts
    ↓
[Continue] → First concept PRIME phase
```

### Returning User
```
Open app
    ↓
See mind map with progress
    ↓
[Continue] → Resume where left off
   or
Click any concept → Start/resume that concept
```

### Learning a Concept
```
PRIME (read summary)
    ↓
[Continue]
    ↓
LEARN (read full content)
  ├── Highlight → bookmark/note/ask
  ├── 📝 → open notes panel
  └── 💬 → open chat panel
    ↓
[Continue]
    ↓
TEST (answer questions)
  ├── Answer each question
  └── 💬 hint → get Socratic help
    ↓
All answered
    ↓
REFLECT (see score)
  ├── Review wrong answers
  └── 📝 → add reflection notes
    ↓
[Continue] → next concept
   or
[Done for now] → back to map
```

### Interruption & Resume
| Left during | Resume at |
|-------------|-----------|
| PRIME | PRIME, same position |
| LEARN | LEARN, same scroll position |
| TEST Q2/5 | TEST Q2 |
| REFLECT | REFLECT (already complete) |

---

## UI Specifications

### Design Tokens

```
Colors:
  --bg:         #fafafa
  --text:       #1a1a1a
  --muted:      #888888
  --accent:     #2563eb
  --success:    #22c55e
  --error:      #ef4444

  Concept states:
  --completed:  #22c55e (green)
  --in-progress:#eab308 (yellow)
  --available:  #1a1a1a (dark)
  --suggested:  #88888850 (grey, 50% opacity)

Typography:
  --font-display: Georgia, serif
  --font-body:    Inter, -apple-system, sans-serif
  --font-mono:    JetBrains Mono, monospace

  --text-xl:    1.5rem
  --text-lg:    1.125rem
  --text-base:  1rem
  --text-sm:    0.875rem

Spacing:
  --content-max-width: 600px
  --line-height:       1.8
  --padding-page:      2rem
```

### Layout Principles

1. **Content centered**, max 600px for optimal reading
2. **Generous whitespace**
3. **Minimal navigation** - single back arrow, phase dots
4. **Actions tucked away** - small icons, bottom of screen
5. **Panels slide in** - notes and chat from right side
6. **Pet in corner** - small, unobtrusive

### Screen: Home / Mind Map

```
┌─────────────────────────────────────────┐
│                                         │
│              Book Title                 │
│               Author                    │
│                                         │
│           ████████░░░░ 41%              │
│                                         │
│                                         │
│           ●───●───●───◐                 │
│           │       │                     │
│           ●       ●───○───○             │
│           │                             │
│           ●───○───○───○                 │
│                                         │
│                                         │
│             [Continue]                  │
│                                         │
│                                🐱       │
└─────────────────────────────────────────┘
```

### Screen: Learning (PRIME / LEARN)

```
┌─────────────────────────────────────────┐
│  ←                           ○ ○ ● ○    │
│                                         │
│                                         │
│            Concept Title                │
│                                         │
│                                         │
│    Content content content content      │
│    content content content content      │
│    content content content.             │
│                                         │
│    More content here with enough        │
│    spacing for comfortable reading.     │
│                                         │
│                                         │
│                                         │
│                                         │
│    📝   💬                 [Continue]   │
│                                🐱       │
└─────────────────────────────────────────┘
```

### Screen: TEST

```
┌─────────────────────────────────────────┐
│  ←                               2/5    │
│                                         │
│                                         │
│                                         │
│        Question text goes here?         │
│                                         │
│             code example                │
│                                         │
│                                         │
│          ○  Option A                    │
│                                         │
│          ○  Option B                    │
│                                         │
│          ○  Option C                    │
│                                         │
│                                         │
│                                         │
│    💬 hint                              │
│                                🐱       │
└─────────────────────────────────────────┘
```

### Screen: REFLECT

```
┌─────────────────────────────────────────┐
│  ←                                      │
│                                         │
│                                         │
│                 ✓                       │
│                                         │
│            Concept Title                │
│                                         │
│               4/5                       │
│                                         │
│          ✓  ✓  ✗  ✓  ✓                 │
│                                         │
│           tap to review                 │
│                                         │
│                                         │
│                                         │
│                                         │
│    📝                      [Continue]   │
│                               🐱 !      │
└─────────────────────────────────────────┘
```

### Component: Highlight Actions

```
    selected text here
    ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀

         🔖   📝   💬
```

### Component: Notes Panel (slide-in)

```
│ Content...          │                   │
│                     │ Notes        ✕    │
│                     │                   │
│                     │ + add note        │
│                     │                   │
│                     │ ──────────        │
│                     │                   │
│                     │ "My note here"    │
│                     │                   │
│                     │ 🔖 "Bookmark..."  │
│                     │                   │
```

### Component: Chat Panel (slide-in)

```
│ Content...          │                   │
│                     │ Ask          ✕    │
│                     │                   │
│                     │ You               │
│                     │ Question here?    │
│                     │                   │
│                     │ mote              │
│                     │ Answer here...    │
│                     │                   │
│                     │ ────────────────  │
│                     │ ask...        ↵   │
```

### Pet States

| State | When | Visual |
|-------|------|--------|
| neutral | default | 🐱 |
| curious | PRIME/LEARN | 🐱 |
| thinking | TEST | 🐱 |
| celebrating | concept completed | 🐱 ! |

---

## LLM Integration

### 1. Book Processing Pipeline

```
PDF Upload
    ↓
Text Extraction (pdf-parse or similar)
    ↓
Chapter Detection (headings, TOC)
    ↓
For each chapter:
    ↓
    LLM: Extract Concepts
    ├── Input: chapter text
    ├── Output: list of concepts with:
    │   ├── title
    │   ├── content (relevant excerpts)
    │   ├── summary
    │   └── estimated time
    ↓
    LLM: Generate Questions
    ├── Input: concept content
    ├── Output: 3-5 questions per concept
    ↓
    LLM: Determine Dependencies
    ├── Input: all concept titles + summaries
    └── Output: dependency edges
```

### 2. Concept Granularity

**Size Bounds:**
```
Minimum:  10 min  (if smaller → merge with adjacent)
Target:   15-20 min
Maximum:  25 min  (if larger → LLM splits)
```

**Time Estimation:**
```
base_time = word_count / 200        # ~200 words/min reading speed

adjustments:
  + (code_blocks * 2 min)           # code takes longer to parse
  + (formulas * 1.5 min)            # math needs processing
  + (density_factor)                # 0.8x light, 1x medium, 1.3x dense

estimated_time = base_time * adjustments + 5 min (for questions)
```

**Chunking Rules:**
```
1. Parse chapter into sections (by headings)

2. Estimate time for each section

3. If section < 10 min:
   → Merge with next section
   → If last section, merge with previous

4. If section > 25 min:
   → LLM splits into sub-concepts
   → Each sub-concept must be self-contained
   → Each must have ONE core idea

5. Validate each concept:
   ✓ Has clear title
   ✓ Can be summarized in 2-3 sentences
   ✓ Has enough content for 3-5 questions
   ✓ Time estimate within 10-25 min bounds
```

**LLM Splitting Prompt:**
```
This section is ${estimatedTime} minutes, which exceeds the 25-minute
maximum for a single learning session.

Split it into smaller concepts where each:
1. Has ONE central idea or skill
2. Is self-contained (understandable on its own)
3. Is 10-25 minutes of learning time
4. Has a clear, descriptive title

Section content:
"""
${sectionContent}
"""
```

### 3. Chat Context

```typescript
interface ChatContext {
  book: {
    title: string
    author: string
  }
  concept: {
    title: string
    summary: string
    content: string
    branch: string
  }
  currentPhase: 'prime' | 'learn' | 'test' | 'reflect'
  userNotes: Note[]
  previousMessages: Message[]

  // Phase-specific system instructions
  systemPrompt: string
}
```

### 3. Phase-Specific Prompts

**PRIME / LEARN:**
```
You are a helpful tutor assisting with learning "${concept.title}"
from "${book.title}".

The user is currently reading this content:
${concept.content}

Help them understand the material. Explain concepts, give examples,
clarify jargon, and connect ideas to things they may already know.
Be concise and friendly.
```

**TEST:**
```
You are a tutor helping a student who is being tested on
"${concept.title}".

IMPORTANT: Do NOT give direct answers. Use the Socratic method:
- Ask guiding questions
- Give hints that lead them to think
- Help them reason through the problem
- If they're stuck, break down the problem into smaller parts

Current question: ${currentQuestion.text}
```

**REFLECT:**
```
You are a tutor helping a student reflect on "${concept.title}".
They just completed the test with score ${score}/${total}.

Wrong answers: ${wrongAnswers}

Help them understand their mistakes without being discouraging.
Encourage deeper exploration of the topic.
```

---

## Technical Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         Frontend                              │
│                     (Next.js + React)                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐  │
│  │ Mind Map│  │ Learning│  │ Notes   │  │ Chat Interface  │  │
│  │  View   │  │  Flow   │  │ Panel   │  │                 │  │
│  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                         Backend                               │
│                    (Node.js / Python)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │ Auth        │  │ Book        │  │ Progress            │   │
│  │ Service     │  │ Processing  │  │ Tracking            │   │
│  └─────────────┘  └─────────────┘  └─────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
      ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
      │ PostgreSQL  │ │ File Store  │ │ LLM API     │
      │ (data)      │ │ (PDFs)      │ │ (Claude)    │
      └─────────────┘ └─────────────┘ └─────────────┘
```

### Suggested Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | Next.js 14 (App Router) | React, SSR, API routes |
| Styling | Tailwind CSS | Rapid, minimal UI |
| Mind Map | React Flow | Flexible graph visualization |
| State | Zustand | Lightweight, simple |
| Backend | Next.js API Routes | Keep it simple, monolith |
| Database | PostgreSQL + Prisma | Relational, typed ORM |
| File Storage | S3 / Local | PDF storage |
| Auth | NextAuth.js | Simple auth |
| LLM | Claude API | Concept extraction, chat |
| PDF Parsing | pdf-parse | Text extraction |

---

## API Endpoints

```
Auth:
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout

Books:
GET    /api/books                    # List user's books
POST   /api/books                    # Upload new book (triggers processing)
GET    /api/books/:id                # Get book with branches
DELETE /api/books/:id                # Delete book

Concepts:
GET    /api/books/:id/concepts       # All concepts (for mind map)
GET    /api/concepts/:id             # Single concept with content

Progress:
GET    /api/books/:id/progress       # User's progress for book
POST   /api/concepts/:id/progress    # Update concept progress
POST   /api/concepts/:id/complete    # Mark concept complete (after TEST)

Notes:
GET    /api/books/:id/notes          # All notes for book
POST   /api/notes                    # Create note
PUT    /api/notes/:id                # Update note
DELETE /api/notes/:id                # Delete note

Bookmarks:
GET    /api/books/:id/bookmarks      # All bookmarks for book
POST   /api/bookmarks                # Create bookmark
DELETE /api/bookmarks/:id            # Delete bookmark

Chat:
GET    /api/concepts/:id/chat        # Get chat history
POST   /api/concepts/:id/chat        # Send message, get response
```

---

## Future Considerations (Out of Scope for V1)

- Spaced repetition / review scheduling
- Multiple books simultaneously
- Social features (share progress, study groups)
- Mobile app (React Native)
- Offline mode
- Custom pet collection
- Export notes to markdown
- Integration with external tools (Notion, Anki)

---

## Open Questions

1. **PDF parsing quality** - How to handle complex layouts, images, code blocks?
2. **Processing time** - Large books may take minutes to process. Background job + notification?
3. **Cost** - LLM calls for processing + chat. Rate limiting? Token budgets?

---

## Success Metrics

- User completes at least one concept per session
- 70%+ of started books reach 50% completion
- Users return within 7 days of last session
- Notes/bookmarks created (indicates engagement)
- Chat usage (indicates active learning)

---

## Related Documentation

- **`INGESTION.md`** - How to break books into properly-sized concepts
- **`PRIME.md`** - Summary content structure for PRIME phase
- **`ADD_BOOK.md`** - Step-by-step task for adding a new book from HTML
