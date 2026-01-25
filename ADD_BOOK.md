# Add Book Task

Instructions for Claude to add a new book from a Mathpix HTML file.

---

## Input Required

User provides:
- Path to Mathpix HTML file (e.g., `/path/to/book.html`)
- Book title and author (if not obvious from content)

---

## Task Steps

### Step 1: Analyze HTML Structure

```bash
# Find all section IDs
grep -o 'id="[^"]*"' book.html | head -100

# Find all h2 section titles
grep '<h2' book.html | head -50

# Count total paragraphs
grep -c 'preview-paragraph' book.html
```

Identify:
- Chapter boundaries (numbered IDs or chapter headings)
- Section titles and their element IDs
- Approximate content size per section

---

### Step 2: Design Concept Structure

Follow **INGESTION.md** rules:

| Section Size | Action |
|-------------|--------|
| < 10 min | Merge with adjacent |
| 10-25 min | Keep as single concept |
| > 25 min | Split at natural breakpoints |

**Time formula:**
```
time = (word_count / 200) + (formulas * 0.025) + 5 min
```

Quick reference: 2000 words ≈ 15 min, 3000 words ≈ 20 min

---

### Step 3: Create Structure Document

Save to `books/<book-slug>/structure.md`:

```markdown
# Book Title
Author: Author Name
Source: /path/to/source.html

## Chapter 1: Chapter Title

### Concept 1: Concept Title (~18 min, 2500 words)
- Start ID: section-id
- End ID: next-section-id

### Concept 2: Concept Title (~15 min, 2000 words)
- Start ID: another-section
- End ID: yet-another

## Summary
- Total concepts: N
- Average time: X min
```

---

### Step 4: Create Ingestion Script

Use `scripts/ingest-natenberg.ts` as template. Create `scripts/ingest-<book-slug>.ts`:

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
          startId: "section-id-start",
          endId: "section-id-end",
        },
      ],
    },
  ],
};
```

---

### Step 5: Run Ingestion

```bash
npx tsx scripts/ingest-<book-slug>.ts
```

Verify:
- All concepts created in database
- Content renders correctly (check one concept in browser)
- Estimated times are within 10-25 min range

---

### Step 6: Generate PRIME Summaries

For each concept, generate a ~500 word summary following **PRIME.md**:

**Format:**
- Single flowing paragraph, abstract-style
- Context → Core content → Significance structure
- Use `<strong>` for key terms
- Use `<em>` for numbers and math
- Match terminology from source content

**Update database directly:**
```sql
UPDATE Concept SET summary = '...' WHERE id = 'concept-id';
```

---

### Step 7: Verify

- [ ] All concepts have summaries (check `length(summary) > 0`)
- [ ] PRIME phase renders formatted text correctly
- [ ] LEARN phase renders HTML content correctly
- [ ] Time estimates are reasonable

---

## Quick Command Reference

```bash
# Check concepts were created
sqlite3 prisma/dev.db "SELECT title, estimatedMinutes FROM Concept WHERE bookId = 'xxx';"

# Check summaries exist
sqlite3 prisma/dev.db "SELECT title, length(summary) FROM Concept WHERE bookId = 'xxx';"

# View in browser
open http://localhost:3001
```

---

## Checklist

- [ ] HTML file analyzed
- [ ] Structure document created (`books/<slug>/structure.md`)
- [ ] Ingestion script created and run
- [ ] All concepts have PRIME summaries with formatting
- [ ] Content renders correctly in browser
