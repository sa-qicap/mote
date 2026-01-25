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
