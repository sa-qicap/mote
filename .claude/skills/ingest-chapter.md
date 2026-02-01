# Ingest Chapter

Ingest a chapter from a PDF and HTML/markdown file into Mote, breaking it into properly-sized learning concepts.

## Usage

```
/ingest-chapter <chapter_pdf> <chapter_html_or_md> [--book-id ID] [--chapter-num N]
```

## Arguments

- `chapter_pdf` - Path to the chapter PDF file
- `chapter_html_or_md` - Path to the chapter HTML or markdown (MMD) file from Mathpix
- `--book-id ID` - (Optional) Existing book ID to add chapter to
- `--chapter-num N` - (Optional) Chapter number (default: 1)

## Examples

```
/ingest-chapter ~/Downloads/ESL/ch1.pdf ~/Downloads/ESL/ch1.html
/ingest-chapter ~/Downloads/prob/ch3.pdf ~/Downloads/prob/ch3.mmd --book-id abc123 --chapter-num 3
```

## Instructions

When the user invokes this skill:

### 1. Parse Arguments

Extract from the user's command:
- `chapter_pdf` - the PDF path (required)
- `chapter_html_or_md` - the HTML/MD path (required)
- `--book-id` - existing book ID (optional)
- `--chapter-num` - chapter number (optional, default 1)

### 2. Validate Inputs

- Check that both files exist
- Determine file type (HTML vs MD/MMD) from extension
- If either is missing, ask the user to provide the correct path

### 3. Analyze Content Structure

Read the HTML/markdown file and identify:
- Chapter title (from first h1/h2 or `# ` heading)
- Section headings and their IDs (for HTML) or line numbers (for MD)
- Paragraph counts between sections
- Math formulas (count `$...$`, `\[...\]`, or MathJax containers)

### 4. Calculate Word Counts and Time Estimates

For each section:
```
word_count = count words in section
formula_count = count math expressions
base_time = word_count / 200
formula_time = formula_count * 0.025
estimated_time = base_time + formula_time + 5 min (for questions)
```

Quick reference:
- 2000 words ≈ 15 min
- 3000 words ≈ 20 min
- 4000 words ≈ 25 min

### 5. Group into Concepts

Apply these rules:
1. **Section < 10 min** → Merge with adjacent section(s)
2. **Section 10-25 min** → Keep as single concept
3. **Section > 25 min** → Find natural split points:
   - Subsection headers
   - Figure/table boundaries
   - Topic transitions
   - Aim for ~2500-3000 words per split

### 6. Map to PDF Pages (CRITICAL - MUST VERIFY)

**NEVER estimate page ranges. ALWAYS extract actual PDF content to verify.**

```bash
source .venv/bin/activate && python3 -c "
import fitz
doc = fitz.open('path/to/chapter.pdf')
print(f'Total pages: {len(doc)}')
for i in range(len(doc)):
    text = doc[i].get_text()
    preview = text[:400].replace('\n', ' ')
    print(f'Page {i+1}: {preview[:150]}...')
"
```

From the output:
1. Find the EXACT page where each section header appears
2. Note where Bibliographic Notes/Exercises start (EXCLUDE these)
3. Record verified `startPage` and `endPage` for each concept

**IMPORTANT PAGE BOUNDARY RULES:**

### Rule 1: startPage
**startPage = the page where the concept's section header FIRST APPEARS**
- Always start from the header, never from the content after it

### Rule 2: endPage (Two Cases)

**Case A - No Overlap (next header at TOP of page):**
- If the next concept's header appears at the VERY TOP of a page
- `endPage` = the page BEFORE that (no overlap needed)
- Example: Header B at top of page 15 → Concept A ends at page 14

**Case B - Overlap Required (next header MID-PAGE):**
- If the next concept's header appears PARTWAY THROUGH a page (not at top)
- `endPage` = that SAME page where the next header appears
- This creates overlap: both concepts include that page
- Example: Header B mid-page on page 10 → Concept A ends at 10, Concept B starts at 10

### Concrete Example (ESL Chapter 3)
```
Page 7:
  [top] F-statistic content (Concept 1 content)
  [middle] "3.2.1 Example: Prostate Cancer" header appears
  [bottom] Intro text for prostate cancer
Page 8:
  [top] TABLE 3.1 prostate cancer data

Correct mapping:
- Concept 1: pages 1-7 (ends at 7 to include F-statistic content)
- Concept 2: pages 7-10 (starts at 7 where header appears)
- Page 7 is in BOTH → overlap REQUIRED
```

**WRONG mapping:**
- Concept 1: pages 1-6 (misses F-statistic content on page 7)
- Concept 2: pages 8-10 (misses section header on page 7)

**DO NOT proceed without this verification step.**

### 7. Generate Summaries

For each concept, write a summary for the PRIME phase:
- 3-5 sentences capturing the key ideas
- Include important formulas in LaTeX: `$formula$`
- Focus on what the reader will learn
- Should be understandable without reading the full content

### 8. Present Plan for Review

Before creating anything, show the user:

```markdown
## Chapter: [Title]

### Concept 1: [Title] (~X min, Y words)
- Pages: startPage - endPage
- Sections: [list of included sections]
- Summary: [draft summary]

### Concept 2: [Title] (~X min, Y words)
...

---
Total: N concepts, avg X min each
```

Ask for confirmation before proceeding.

### 9. Create or Update Book

If `--book-id` not provided:
- Ask user for book title, author
- Create new book record with `sourceFile` pointing to PDF

If `--book-id` provided:
- Verify book exists
- Add chapter to existing book

### 10. Create Seed Script

Generate a TypeScript seed script at `scripts/seed-[book-slug]-ch[N].ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BOOK_ID = "[book-id]"; // or null for new book

const concepts = [
  {
    title: "Concept Title",
    orderInBranch: 1,
    startPage: 1,
    endPage: 4,
    estimatedMinutes: 17,
    summary: `Summary text with $math$ if needed...`,
    content: "", // Empty - PDF replaces it
  },
  // ... more concepts
];

async function main() {
  // ... ingestion logic
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### 11. Run Ingestion

Execute the seed script:
```bash
npx ts-node scripts/seed-[book-slug]-ch[N].ts
```

### 12. Verify Results

- Confirm concepts were created in database
- Report summary: N concepts created, avg time, page ranges
- Remind user to test PDF rendering in the app

## Concept Sizing Guidelines

Target: **15-20 minutes** per concept
- Minimum: 10 min (merge if smaller)
- Maximum: 25 min (split if larger)

Signs a concept should be split:
- Multiple major topics
- More than 4000 words
- Could stand alone as separate lessons

Signs concepts should be merged:
- Too short for meaningful quiz questions
- Continuation of same topic
- Less than 1500 words combined

## Output Files

The skill creates:
1. `scripts/seed-[book-slug]-ch[N].ts` - Seed script for this chapter
2. Updates database with book, branch (chapter), and concepts

## Troubleshooting

### PDF page numbers don't match content
- Check if PDF has front matter (title page, TOC) before chapter starts
- Calculate offset: actual_page = content_page + offset
- Store offset in book's `pageOffset` field

### Can't find section boundaries in PDF
- Use text search for unique phrases near section starts
- Look for figure/table numbers as landmarks
- Fall back to approximate page ratios

### Content has complex formatting
- Prefer HTML source if math/tables render poorly in markdown
- Keep original HTML structure for rendering
- Only extract page ranges for PDF-based display

### Sections are highly variable in size
- Some chapters have one 40-min section and several 5-min sections
- Prioritize splitting long sections over merging short ones
- A 12-min concept is fine; a 35-min concept is not
