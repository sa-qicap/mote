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

**Use Docling to extract markdown from PDF** - the source is a PDF file.

Docling outputs:
- Markdown with section headers (`## `, `### `)
- Math in LaTeX format (`$...$` for inline, `$$...$$` for display)
- Tables in markdown format
- Images extracted to separate files with `![caption](image.png)` references

### Processing PDFs with Docling

```typescript
import { processWithDocling } from "@/lib/docling";

const result = await processWithDocling("/path/to/book.pdf", "ocrmac");
// result.markdown - extracted markdown content
// result.images - array of { name, path } for extracted images
// result.metadata - { title, page_count }
```

Available OCR engines: `"auto"`, `"easyocr"`, `"tesseract"`, `"rapidocr"`, `"ocrmac"` (Mac only)

---

## Process

### 1. Convert PDF to Markdown

```bash
# Run the Docling processor
python3 scripts/python/docling_processor.py /path/to/book.pdf output.json --ocr-engine ocrmac
```

Or use the TypeScript wrapper:

```typescript
const { markdown, images, metadata } = await processWithDocling(pdfPath);
```

### 2. Analyze the Markdown

```bash
# Find all section headers
grep -E '^#{1,3} ' content.md | head -50

# Count words per section (rough estimate)
# Manually review the markdown structure
```

### 3. Map Chapters and Sections

Identify:
- Chapter boundaries (look for `# Chapter` or `## Chapter` patterns)
- Section headers and their hierarchy
- Estimate content size by word count between sections

### 4. Group into Concepts

Rules:
1. **Section < 10 min** → Merge with adjacent section(s)
2. **Section 10-25 min** → Keep as single concept
3. **Section > 25 min** → Find natural split points:
   - Subsection headers
   - Figure/table boundaries
   - Topic transitions
   - Aim for ~2500-3000 words per split

### 5. Validate Structure

Each concept must:
- [ ] Have ONE central idea or skill
- [ ] Be self-contained (understandable on its own)
- [ ] Be 10-25 minutes of learning time
- [ ] Have a clear, descriptive title
- [ ] Have enough content for 3-5 questions

### 6. Create Ingestion Script

Key structure for markdown-based ingestion:

```typescript
const PDF_PATH = "/path/to/book.pdf";

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
          startMarker: "## Section Name",      // Markdown header to start from
          endMarker: "## Next Section Name",   // Markdown header to stop at
        },
        // ...
      ],
    },
    // ...
  ],
};
```

The script extracts markdown between `startMarker` and `endMarker`.

---

## Content Handling

### Markdown Rendering

Content is rendered using:
- `src/components/markdown-renderer.tsx` - ReactMarkdown with remark-gfm
- `src/app/academic.css` - Academic styling with Source Serif 4 font
- KaTeX for math rendering (inline `$...$` and display `$$...$$`)

The markdown renderer wraps content in `.academic-content` class:

```tsx
<div className="academic-content">
  <ReactMarkdown remarkPlugins={[remarkGfm]}>
    {content}
  </ReactMarkdown>
</div>
```

### Image Handling

Docling extracts images to a temp directory. For production:
1. Copy images to `public/books/<book-id>/images/`
2. Update image references in markdown to use the public path

---

## Splitting Oversized Sections

When a section is > 25 minutes, find split points:

1. **Look for subsection headers** (`## `, `### `)
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
Source: /path/to/source.pdf

## Chapter 1: Chapter Title

### Concept 1: Concept Title (~18 min, 2500 words)
- Start marker: ## Section Name
- End marker: ## Next Section
- Sections included: Section A, Section B

### Concept 2: Concept Title (~15 min, 2000 words)
- Start marker: ## Another Section
- End marker: ## Yet Another
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

- [ ] Obtain source PDF file
- [ ] Process PDF with Docling: `processWithDocling(pdfPath, "ocrmac")`
- [ ] Review extracted markdown quality (math, tables, images)
- [ ] Identify chapter structure via section headers
- [ ] Calculate word counts per section
- [ ] Group sections into 15-20 min concepts
- [ ] Split any sections > 25 min
- [ ] Merge any sections < 10 min
- [ ] **Save structure to `books/<slug>/structure.md`**
- [ ] Review structure manually
- [ ] Create ingestion script with startMarker/endMarker
- [ ] Copy images to `public/books/<book-id>/images/`
- [ ] Run script and verify times
- [ ] Check content renders correctly (math, tables, headings)

---

## Files

- `src/lib/docling.ts` - TypeScript wrapper for Docling
- `scripts/python/docling_processor.py` - Python processor (extracts markdown + images)
- `scripts/python/requirements.txt` - Python dependencies (`docling>=2.0.0`)
- `src/components/markdown-renderer.tsx` - Renders markdown with ReactMarkdown
- `src/app/academic.css` - Academic styling for rendered content
- `prisma/schema.prisma` - Database schema

---

## PDF-Based Learn Phase

Alternative approach: display actual PDF pages instead of extracted markdown.

### Workflow

1. **Input**: PDF file
2. **Concept breakdown**: Use Docling markdown to understand content, split into 15-20 min concepts
3. **Page mapping**: Map each concept to `startPage`/`endPage` in PDF
4. **Output per concept**:
   - `summary` - text for PRIME phase
   - `startPage`/`endPage` - PDF viewer shows these pages in LEARN phase

### When to Use

- Source PDF has better formatting than extracted markdown
- Complex layouts, figures, or tables that don't convert well
- Want to preserve original book appearance

### Process

1. Read the Docling markdown to understand content structure
2. Break into concepts following the 15-20 min rule
3. Open the PDF and note page numbers for each concept boundary
4. Create seed script with `startPage` and `endPage` fields
5. Write summaries for PRIME phase

### Seed Script Structure

```typescript
const concepts = [
  {
    title: "Concept Title",
    summary: "Summary text for PRIME phase...",
    content: "",  // Empty - PDF replaces it
    startPage: 1,
    endPage: 4,
    estimatedMinutes: 17,
  },
  // ...
];
```

### Files

- `scripts/seed-ch1-pdf.ts` - Reference implementation
- `src/components/phases/pdf-learn.tsx` - PDF viewer with highlighting
- `public/books/` - PDF files
