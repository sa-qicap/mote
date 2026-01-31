# Mote Project Instructions

## Required Reading

1. **`DESIGN.md`** - App vision, data model, UI specs, technical architecture
2. **`INGESTION.md`** - How to break books into properly-sized concepts
3. **`PRIME.md`** - Summary content structure for PRIME phase
4. **`ADD_BOOK.md`** - Step-by-step task for adding a new book from PDF

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
- Use Docling to extract markdown from PDF
- Preserve math in `$...$` for KaTeX rendering
- Section headers as `## ` markdown
- Images as `![caption](path)`

### Content Rendering (CRITICAL)
The LEARN phase renders markdown content with academic styling:

1. **Use academic CSS** - `src/app/academic.css` with Source Serif 4 font
2. **MarkdownRenderer component** - `src/components/markdown-renderer.tsx` wraps content in `.academic-content`
3. **Import order** - academic.css imported in `globals.css`
4. **KaTeX for math** - Inline `$...$` and display `$$...$$` rendered with KaTeX

This ensures proper typography and math rendering for extracted content.

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
