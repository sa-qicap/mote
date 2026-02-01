# Issues and Resolutions

Track issues encountered and their fixes to avoid repeating mistakes.

---

## 2024-02-01: PDF URL path not preserving subdirectories

**Symptom:** "Failed to fetch PDF" error in LEARN phase

**Cause:** In `src/app/api/books/[id]/concepts/[conceptId]/route.ts`, the PDF URL was constructed by extracting only the filename:
```typescript
const pdfFileName = concept.book.sourceFile.split("/").pop() || "";
const pdfUrl = `/books/${pdfFileName}`;
```

This turned `/books/ESL/01_Introduction.pdf` into `/books/01_Introduction.pdf`, losing the `ESL/` subdirectory.

**Fix:** Use the full `sourceFile` path directly since it already includes the `/books/` prefix:
```typescript
const pdfUrl = concept.book.sourceFile;
```

**File:** `src/app/api/books/[id]/concepts/[conceptId]/route.ts:93-95`

---

## 2024-02-01: PDF pages rendered twice (intermittent)

**Symptom:** User saw 16 pages instead of 8 in PDF viewer

**Cause:** Unclear - resolved after page refresh. Possible causes:
- React Strict Mode double-rendering useEffect
- Hot reload causing duplicate extraction
- Browser caching stale blob URL

**Resolution:** Self-resolved on refresh. Monitor for recurrence.

**File:** `src/components/phases/pdf-learn.tsx`

---

## 2024-02-01: "No valid pages to extract" with multi-chapter books

**Symptom:** PDF viewer shows "No valid pages to extract" for Chapter 2+ concepts

**Cause:** Multiple potential issues:
1. Concept `pdfPath` field was missing from schema (added)
2. API needed to use concept-specific `pdfPath` over book's `sourceFile`
3. Chapter 1 concept had NULL pdfPath, potentially causing fallback issues
4. Session/auth issues (401 errors in logs) can cause stale/missing data

**Fix:**
1. Added `pdfPath String?` field to Concept model in schema
2. Updated API: `const pdfUrl = concept.pdfPath || concept.book.sourceFile;`
3. Seed scripts now set concept-specific `pdfPath` for each chapter
4. Updated Chapter 1 to have explicit pdfPath for consistency

**Files:**
- `prisma/schema.prisma` - Added pdfPath field
- `src/app/api/books/[id]/concepts/[conceptId]/route.ts` - Use concept.pdfPath
- `scripts/seed-esl-ch*.ts` - Set pdfPath per chapter

---

## 2024-02-01: Page mappings must be verified after ingestion (CRITICAL - ALWAYS DO THIS)

**Symptom:** Concepts show wrong PDF pages in LEARN phase

**Cause:** Page ranges were estimated based on HTML line counts but didn't match actual PDF page boundaries.

---

### ⚠️ MANDATORY: PDF PAGE VERIFICATION PROCESS ⚠️

**ALWAYS perform this verification when ingesting ANY chapter or book. NO EXCEPTIONS.**

#### Step 1: Extract PDF Text to Find Section Boundaries
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

#### Step 2: Identify Actual Section Start Pages
- Look for section headers (e.g., "3.1 Introduction", "3.2 Linear Regression")
- Note where Bibliographic Notes/Exercises start (EXCLUDE from concepts)

**Rule 1: startPage**
- **startPage = the page where the concept's section header FIRST APPEARS**
- Always start from the header, never from the content after it

**Rule 2: endPage (Two Cases)**

**Case A - No Overlap (next header at TOP of page):**
- If the next concept's header appears at the VERY TOP of a page
- `endPage` = the page BEFORE that (no overlap needed)
- Example: Header B at top of page 15 → Concept A ends at page 14

**Case B - Overlap Required (next header MID-PAGE):**
- If the next concept's header appears PARTWAY THROUGH a page (not at top)
- `endPage` = that SAME page where the next header appears
- This creates overlap: both concepts include that page
- Example: Header B mid-page on page 10 → Concept A ends at 10, Concept B starts at 10

#### Step 3: Map Concepts to Verified Page Ranges

**Concrete Example (ESL Chapter 3):**
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

- NEVER include Bibliographic Notes or Exercises in concept pages

#### Step 4: Update Database with Verified Pages
```typescript
const verifiedPages = [
  { order: 1, start: X, end: Y },  // Section name
  // ... verified from PDF extraction
];
```

#### Step 5: Test in App
- Open each concept in the LEARN phase
- Verify first page shows correct section heading
- Verify content matches the concept title

---

**Why this is NON-NEGOTIABLE:**
- HTML/markdown section sizes DO NOT map linearly to PDF pages
- Figures, tables, and equations take variable space
- Estimated page ranges are ALWAYS wrong
- Users cannot learn effectively with wrong content
- This caused multiple debugging sessions - PREVENT by verifying upfront

**Common mistakes to avoid:**
- Trusting estimated page ranges from HTML line counts
- Including Bibliographic Notes/Exercises in concept pages
- Not accounting for chapter title pages
- Assuming sections are evenly distributed

---
