# Mote Project Instructions

## Required Reading

1. **`DESIGN.md`** - App vision, data model, UI specs, technical architecture
2. **`INGESTION.md`** - How to break books into properly-sized concepts
3. **`PRIME.md`** - Summary content structure for PRIME phase
4. **`ADD_BOOK.md`** - Step-by-step task for adding a new book from HTML

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
