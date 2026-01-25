# PRIME Phase Content Structure

The PRIME phase prepares learners with a concise overview before diving into full content.

---

## Summary Format

A single paragraph of ~500 words, structured like a research paper abstract:

1. **Context** (1-2 sentences): What area/topic this covers
2. **Core content** (bulk): Key ideas, concepts, and relationships explained
3. **Significance** (1-2 sentences): Why this matters, what it enables

---

## Generation Prompt

```
Write a ~500 word summary for this learning concept, structured like a research paper abstract.

Book: "${book.title}" by ${book.author}
Chapter: "${branch.title}"
Concept: "${concept.title}"

Content:
"""
${concept.content}
"""

Requirements:
- Single flowing paragraph, approximately 500 words
- Start with context (what area this covers)
- Explain the key ideas and their relationships
- End with significance (why this matters)
- Use $...$ for any mathematical notation
- Match the terminology from the source content
- Prepare the reader without spoiling detailed explanations
```

---

## Data Model

```prisma
model Concept {
  // ... existing fields
  summary String @db.Text  // ~500 word paragraph
}
```

No changes needed - current schema already supports this.

---

## Quality Criteria

- [ ] ~500 words (400-600 acceptable range)
- [ ] Single paragraph, no bullet points or headers
- [ ] Flows naturally, readable in 2-3 minutes
- [ ] Math notation renders correctly with KaTeX
- [ ] Prepares without spoiling
