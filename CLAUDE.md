# Mote Project Instructions

## Required Reading

1. **`DESIGN.md`** - App vision, data model, UI specs, technical architecture
2. **`INGESTION.md`** - How to break books into properly-sized concepts
3. **`PRIME.md`** - Summary content structure for PRIME phase
4. **`ADD_BOOK.md`** - Step-by-step task for adding a new book from HTML
5. **`notes/issues.md`** - Past issues and their resolutions (check before debugging)

## Key Constraints

### Concept Sizing (CRITICAL)
- Target: **15-20 minutes** per concept
- Minimum: 10 min (if smaller → merge with adjacent)
- Maximum: 25 min (if larger → split)
- Formula: `word_count / 200 + formulas * 0.025 + 5 min`
- Quick ref: 2000 words ≈ 15 min, 3000 words ≈ 20 min

### Each Concept Needs
- Summary (for PRIME phase)
- Content (for LEARN phase)
- 3-5 questions (for TEST phase)

### Content Format
- Use Mathpix Markdown (MMD) as source
- Preserve math in `$...$` for KaTeX rendering
- Convert `\section*{}` to `## ` headers
- Convert figures to `![caption](url)`

### Content Rendering (CRITICAL)
The LEARN phase must render content exactly like the original Mathpix HTML:

1. **Use original CSS** - `src/app/mathpix.css` extracted from source HTML
2. **Match HTML structure** - Content wrapper needs `id="preview"` containing `id="preview-content"`
3. **Import order** - mathpix.css must come AFTER Tailwind in `globals.css` to override resets
4. **No custom styles** - Don't add custom `.mathpix-content` or other styling; use original as-is

This ensures math, tables, headings, and fonts render identically to opening the source HTML file directly.

## Context Management

### On Session Start
If `session-summary.md` exists in the project root, read it first to understand what we were working on previously.

### During Long Sessions
When the conversation feels long (roughly 40-50 exchanges) or before starting a significantly different task:
1. Update `session-summary.md` with:
   - What we accomplished
   - Current state of the work
   - Any pending tasks or issues
   - Key file paths modified
   - Important decisions made
2. Run /compact to reset context

### Summary File Format
Keep the summary concise but include:
- Current objective
- Files changed and why
- Blockers or errors encountered
- Next steps

## Skills

### /split-pdf
Split a PDF into chapter files using a table of contents.

**Usage:**
```
/split-pdf <pdf_file> <toc_file> [output_dir] [--offset N]
```

**Example:**
```
/split-pdf ~/Downloads/ESL.pdf ~/Downloads/ESL.html ~/Downloads/ESL/
/split-pdf ~/Downloads/book.pdf ~/Downloads/toc.html --offset 16
```

The skill uses `tools/split_pdf_auto.py` which:
- Parses TOC from HTML/MD (formats: `1 Title ..... 1` or `Chapter 1 Title ..... 1`)
- Auto-detects page offset (finds where Chapter 1 starts in PDF)
- Detects end of content (References, Index, Appendix)
- Creates numbered chapter PDFs with clean filenames

See `.claude/skills/split-pdf.md` for full documentation.

### /ingest-chapter
Ingest a chapter from PDF + HTML/markdown into Mote, breaking it into 15-20 minute concepts.

**Usage:**
```
/ingest-chapter <chapter_pdf> <chapter_html_or_md> [--book-id ID] [--chapter-num N]
```

**Example:**
```
/ingest-chapter ~/Downloads/ESL/ch1.pdf ~/Downloads/ESL/ch1.html
/ingest-chapter ~/Downloads/prob/ch3.pdf ~/Downloads/prob/ch3.mmd --book-id abc123 --chapter-num 3
```

The skill:
- Analyzes content to identify sections and calculate time estimates
- Groups sections into 15-20 min concepts (merges short, splits long)
- Maps each concept to PDF page ranges
- Generates summaries for PRIME phase
- Creates a seed script and runs ingestion

See `.claude/skills/ingest-chapter.md` for full documentation.

## Issue Tracking

**Directory:** `notes/issues.md`

When encountering and fixing bugs:
1. **Check `notes/issues.md` first** - The issue may already be documented
2. **After fixing**, add an entry with:
   - Date and short title
   - Symptom (what the user saw)
   - Cause (root cause analysis)
   - Fix (code changes made)
   - File path and line numbers

This prevents re-encountering the same issues.

## CRITICAL: PDF Page Verification (ALWAYS DO THIS)

**When ingesting ANY chapter or book, you MUST verify page mappings by extracting actual PDF content.**

See `notes/issues.md` and `.claude/skills/ingest-chapter.md` for the full mandatory verification process.

### Page Mapping Rules (Key Summary)

**startPage** = the page where the concept's section header FIRST APPEARS

**endPage** has two cases:
- **Case A (no overlap):** Next header at TOP of page → endPage = page BEFORE that
- **Case B (overlap required):** Next header MID-PAGE → endPage = SAME page as next startPage

Example: If Header B appears mid-page on page 7, then Concept A ends at 7 AND Concept B starts at 7 (both include page 7).

### Verification Steps
1. Extract PDF text using pymupdf to find actual section boundaries
2. Note exact page numbers where each section header appears
3. Determine if overlap is needed (is next header at top or mid-page?)
4. Exclude Bibliographic Notes/Exercises from concept pages
5. Update database with verified page ranges
6. Test each concept in the app

**NEVER trust estimated page ranges. ALWAYS verify from the PDF.**
