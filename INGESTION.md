# Book Ingestion Guide

How to break a book into properly-sized learning concepts for Mote.

---

## Goal

Each concept should be **15-20 minutes** of learning time.
- Minimum: 10 minutes (if smaller → merge with adjacent)
- Maximum: 25 minutes (if larger → split)

---

## Time Estimation Formula

```
base_time = word_count / 200        # ~200 words/min reading speed

adjustments:
  + formulas * 0.025 min            # ~1.5 sec per formula
  + code_blocks * 2 min             # code takes longer to parse

estimated_time = base_time + adjustments + 5 min (for questions)
```

**Quick reference:**
- 2000 words ≈ 15 min
- 3000 words ≈ 20 min
- 4000 words ≈ 25 min

---

## Source Format

**Use Mathpix HTML directly** - no markdown conversion needed.

The Mathpix HTML has:
- Section headings with IDs: `<h2 class="section-title" id="the-delta">`
- Paragraphs: `<div class="preview-paragraph-XXX">`
- Math already rendered as MathJax SVGs
- Tables with inline styles preserved
- Proper fonts and formatting

---

## Process

### 1. Analyze the HTML File

```bash
# Find all section IDs
grep -o 'id="[^"]*"' book.html | head -50

# Find all h2 section titles
grep '<h2' book.html | head -30
```

### 2. Map Chapters and Sections

Identify:
- Chapter boundaries (look for chapter number patterns in IDs)
- Section titles and their IDs
- Estimate content size by paragraph count between sections

### 3. Group into Concepts

Rules:
1. **Section < 10 min** → Merge with adjacent section(s)
2. **Section 10-25 min** → Keep as single concept
3. **Section > 25 min** → Find natural split points:
   - Subsection headers
   - Figure/table boundaries
   - Topic transitions
   - Aim for ~2500-3000 words per split

### 4. Validate Structure

Each concept must:
- [ ] Have ONE central idea or skill
- [ ] Be self-contained (understandable on its own)
- [ ] Be 10-25 minutes of learning time
- [ ] Have a clear, descriptive title
- [ ] Have enough content for 3-5 questions

### 5. Create Ingestion Script

Use `scripts/ingest-natenberg.ts` as template. Key structure:

```typescript
const HTML_PATH = "/path/to/book.html";

const BOOK_STRUCTURE = {
  title: "Book Title",
  author: "Author Name",
  chapters: [
    {
      number: 1,
      title: "Chapter Title",
      concepts: [
        {
          title: "Concept Title",
          startId: "section-id-start",    // HTML element ID
          endId: "section-id-end",        // Next section's ID
        },
        // ...
      ],
    },
    // ...
  ],
};
```

The script extracts HTML between `startId` and `endId` and stores it directly.

---

## Content Handling

### DO NOT convert or clean the HTML

The HTML is rendered as-is using:
- `src/app/mathpix.css` - Original CSS from source HTML
- `id="preview"` and `id="preview-content"` wrappers in `learn.tsx`
- `dangerouslySetInnerHTML` to inject the content

This preserves:
- Math (MathJax SVGs)
- Tables (with inline border styles)
- Headings (with proper fonts)
- All formatting exactly as in the original

### Critical: Rendering Setup

See CLAUDE.md "Content Rendering" section. The content wrapper must have:
```tsx
<div id="preview">
  <div id="preview-content" dangerouslySetInnerHTML={{ __html: content }} />
</div>
```

---

## Splitting Oversized Sections

When a section is > 25 minutes, find split points:

1. **Look for subsection headers** (`<h2>`, `<h3>` tags)
2. **Find natural breakpoints** around:
   - Figures and tables
   - Example problems
   - Topic transitions
3. **Target ~2500-3000 words** per resulting concept
4. **Ensure each part is self-contained** with a clear focus

Example from Natenberg book:
- "Using an Option's Theoretical Value" was 44 min (7265 words)
- Split into 3 concepts:
  - "Capturing Theoretical Edge" (2608 words, 18 min)
  - "The Adjustment Process" (1975 words, 15 min)
  - "Option Replication" (2682 words, 21 min)

---

## Storing Concept Structure

Before running ingestion, save the planned structure to a file for review:

**Location:** `books/<book-slug>/structure.md`

**Format:**
```markdown
# Book Title
Author: Author Name
Source: /path/to/source.html

## Chapter 1: Chapter Title

### Concept 1: Concept Title (~18 min, 2500 words)
- Start ID: section-name
- End ID: next-section
- Sections included: Section A, Section B

### Concept 2: Concept Title (~15 min, 2000 words)
- Start ID: another-section
- End ID: yet-another
- Sections included: Another Section

## Chapter 2: Chapter Title
...

---

## Summary
- Total concepts: 21
- Average time: 17 min
- Shortest: 11 min (Concept Name)
- Longest: 25 min (Concept Name)
```

---

## Checklist for New Books

- [ ] Obtain Mathpix HTML file
- [ ] Extract CSS from HTML into `src/app/mathpix.css` (if different from existing)
- [ ] Identify chapter structure via section IDs
- [ ] Calculate word counts per section
- [ ] Group sections into 15-20 min concepts
- [ ] Split any sections > 25 min
- [ ] Merge any sections < 10 min
- [ ] **Save structure to `books/<slug>/structure.md`**
- [ ] Review structure manually
- [ ] Create ingestion script with startId/endId markers
- [ ] Run script and verify times
- [ ] Check content renders correctly (math, tables, headings)

---

## Files

- `scripts/ingest-natenberg.ts` - Reference implementation
- `src/app/mathpix.css` - Original Mathpix CSS (extract from source HTML)
- `src/components/phases/learn.tsx` - Renders HTML with preview/preview-content IDs
- `prisma/schema.prisma` - Database schema
