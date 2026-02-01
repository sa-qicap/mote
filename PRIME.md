# PRIME Phase Content Structure

The PRIME phase prepares learners with a concise overview before diving into full content.

---

## Summary Format

A single paragraph of 500-600 words (range: 400-800), written in **Feynman-style teaching** that builds intuition before formulas:

### Structure (within single paragraph)
1. **Hook** (1-2 sentences): Why this matters - what problem are we trying to solve?
2. **Intuition** (2-3 sentences): Analogy, example, or mental model to build understanding
3. **Core idea** (bulk): Plain English explanation of the key concepts
4. **Formalization** (1-2 sentences): Mathematical notation with context
5. **Implications** (1-2 sentences): What this enables or connects to

---

## Writing Style: Feynman-Style Teaching

1. **Start with the "why"** - What problem are we trying to solve? Why should we care?
2. **Build intuition first** - Use analogies, examples, or mental models before any math
3. **Introduce concepts gradually** - Layer ideas, each building on the previous
4. **Math comes last** - Only after intuition is established, introduce formal notation
5. **Connect to the bigger picture** - How does this fit into the chapter/book?

### Style Guidelines
- Conversational but precise
- No bullet points or headers - one flowing paragraph
- Assume the reader is intelligent but unfamiliar with this specific topic
- Bold key terms using **term** syntax
- Match terminology from the source content

---

## Generation Prompt

```
You are a master teacher who explains complex topics like Richard Feynman - building deep intuition before introducing formulas.

Write a 500-600 word summary for this learning concept. The summary should be a SINGLE FLOWING PARAGRAPH.

Book: "${book.title}" by ${book.author}
Chapter: "${branch.title}"
Concept: "${concept.title}"

Source Content:
"""
${conceptContent}
"""

Writing Guidelines:
1. START with why this matters - what problem does it solve?
2. BUILD INTUITION using an analogy, example, or mental model
3. EXPLAIN the core idea in plain English first
4. ONLY THEN introduce mathematical notation (use $...$ for LaTeX)
5. END with what this enables or connects to

Style:
- Conversational but precise
- No bullet points or headers - one flowing paragraph
- Assume the reader is intelligent but unfamiliar with this specific topic
- Bold key terms using **term** syntax
- Match terminology from the source content

Target: 500-600 words (must be between 400-800)
```

---

## Data Model

```prisma
model Concept {
  // ... existing fields
  summary String @db.Text  // 500-600 word paragraph
}
```

No changes needed - current schema already supports this.

---

## Regeneration Script

Use `scripts/regenerate-summaries.ts` to generate or regenerate summaries:

```bash
# Preview summaries without saving (dry run)
npx tsx scripts/regenerate-summaries.ts "Statistical" --dry-run

# Generate and save to database
npx tsx scripts/regenerate-summaries.ts "Statistical"

# Process all books
npx tsx scripts/regenerate-summaries.ts
```

The script:
1. Queries concepts for matching book(s)
2. Extracts source content (HTML if available, else PDF text)
3. Generates Feynman-style summary via Claude
4. Validates word count (400-800) and format
5. Updates database (unless --dry-run)

---

## Quality Criteria

- [ ] 500-600 words (400-800 acceptable range)
- [ ] Single paragraph, no bullet points or headers
- [ ] Flows naturally, readable in 2-3 minutes
- [ ] Starts with "why" - problem or motivation
- [ ] Includes intuition/analogy before math
- [ ] Math notation renders correctly with KaTeX
- [ ] Bold terms for key vocabulary
- [ ] Connects to bigger picture at end
