#!/usr/bin/env python3
"""
Automatically split a PDF into chapters using a table of contents file.

Usage:
    python split_pdf_auto.py book.pdf toc.md -o chapters/
    python split_pdf_auto.py book.pdf toc.html -o chapters/

The TOC file should contain lines like:
    1 Introduction ..... 1
    2 Overview of Supervised Learning ..... 9
    3 Linear Methods for Regression ..... 43

Or markdown format:
    # 1 Introduction (page 1)
    # 2 Overview (page 9)
"""

import argparse
import re
import sys
from pathlib import Path

try:
    from pypdf import PdfReader, PdfWriter
except ImportError:
    print("Error: pypdf not installed. Run: pip install pypdf")
    sys.exit(1)


def sanitize_filename(name: str) -> str:
    """Convert a chapter title to a safe filename."""
    import html
    # Decode HTML entities
    name = html.unescape(name)

    # If title has a colon followed by math-like content, truncate there
    if ':' in name:
        parts = name.split(':')
        # Keep the part before colon if the rest looks like math symbols
        rest = ':'.join(parts[1:])
        if len(rest) < 20 or re.search(r'[≫≪≥≤∞∑∏]|\\[a-z]+', rest):
            name = parts[0].strip()

    # Remove or replace special characters
    name = re.sub(r'[<>:"/\\|?*≫≪→←≥≤]', '', name)
    name = re.sub(r'[^\w\s-]', '', name)  # Keep only alphanumeric, spaces, hyphens
    name = re.sub(r'\s+', ' ', name).strip()

    # Remove duplicate words (from multiple math representations)
    words = name.split()
    seen = set()
    unique_words = []
    for word in words:
        word_lower = word.lower()
        if word_lower not in seen:
            seen.add(word_lower)
            unique_words.append(word)
    name = '_'.join(unique_words)

    return name[:80]


def parse_toc_file(toc_path: str) -> list[tuple[str, str, int]]:
    """
    Parse a TOC file to extract chapter information.

    Returns list of (chapter_num, title, start_page) tuples.
    """
    path = Path(toc_path)
    content = path.read_text(encoding='utf-8')

    chapters = []

    # Split by <br> tags to get TOC lines, then clean each
    # This handles multi-line HTML entries
    toc_entries = re.split(r'<br\s*/?>', content, flags=re.IGNORECASE)

    # Pattern: "1 Title ..... 123" or "Chapter 1 Title ..... 123"
    patterns = [
        r'^(\d+)\s+(.+?)\s*\.{3,}\s*(\d+)$',
        r'^(\d+)\.\s+(.+?)\s*\.{3,}\s*(\d+)$',
        r'^Chapter\s+(\d+)\s+(.+?)\s*\.{3,}\s*(\d+)$',
        r'^CHAPTER\s+(\d+)\s+(.+?)\s*\.{3,}\s*(\d+)$',
    ]

    for entry in toc_entries:
        # Clean HTML tags and normalize whitespace
        clean_line = re.sub(r'<[^>]+>', ' ', entry)
        # Remove duplicate whole words (from multiple math representations)
        # Use word boundaries to avoid matching partial words
        clean_line = re.sub(r'\b(\w+)\s+\1\b', r'\1', clean_line)
        clean_line = re.sub(r'\s+', ' ', clean_line).strip()

        for pattern in patterns:
            match = re.search(pattern, clean_line, re.IGNORECASE)
            if match:
                num = match.group(1)
                title = match.group(2).strip()
                page = int(match.group(3))

                # Skip if this looks like a subsection (e.g., "2.1 Introduction")
                if '.' in num:
                    continue

                # Skip very short titles (likely parsing errors)
                if len(title) < 3:
                    continue

                chapters.append((num, title, page))
                break

    # Remove duplicates while preserving order
    seen = set()
    unique_chapters = []
    for ch in chapters:
        key = (ch[0], ch[2])  # (chapter_num, page)
        if key not in seen:
            seen.add(key)
            unique_chapters.append(ch)

    return unique_chapters


def detect_offset(reader: PdfReader, first_chapter_title: str = "Introduction") -> int:
    """
    Auto-detect the page offset by finding where chapter 1 starts.

    Returns the offset (PDF page = book page + offset).
    """
    # Search first 50 pages for chapter 1
    for i in range(min(50, len(reader.pages))):
        text = reader.pages[i].extract_text() or ""

        # Look for "This is page 1" which is a strong indicator
        if "This is page 1" in text:
            print(f"Detected: Book page 1 = PDF page {i + 1}")
            return i  # offset = PDF_page_index (0-based) when book page is 1

        # Look for chapter 1 header at the START of meaningful content
        # Must have "1" followed by chapter title, and be a chapter page (not TOC)
        lines = text.split('\n')
        for j, line in enumerate(lines[:10]):  # Check first 10 lines
            # Pattern: starts with "1" followed by title, chapter content follows
            if re.match(r'^1\s*$', line.strip()) and j + 1 < len(lines):
                next_line = lines[j + 1].strip()
                if first_chapter_title.lower() in next_line.lower():
                    # Verify this is a chapter page, not TOC (should have substantial text)
                    if len(text) > 500:
                        print(f"Detected: Book page 1 = PDF page {i + 1}")
                        return i

    # Fallback: ask user or assume no offset
    print("Warning: Could not auto-detect page offset. Assuming offset=0.")
    print("If chapters are misaligned, re-run with --offset flag.")
    return 0


def split_pdf(
    pdf_path: str,
    toc_path: str,
    output_dir: str,
    offset: int | None = None,
) -> list[str]:
    """
    Split a PDF into chapters based on a TOC file.
    """
    reader = PdfReader(pdf_path)
    total_pages = len(reader.pages)

    # Parse TOC
    chapters = parse_toc_file(toc_path)
    if not chapters:
        print("Error: No chapters found in TOC file.")
        print("Expected format: '1 Introduction ..... 1'")
        sys.exit(1)

    print(f"Found {len(chapters)} chapters in TOC")

    # Auto-detect offset if not provided
    if offset is None:
        offset = detect_offset(reader)

    print(f"Using offset: {offset} (PDF page = book page + {offset})")

    # Calculate page ranges
    chapter_ranges = []
    for i, (num, title, start_page) in enumerate(chapters):
        pdf_start = start_page + offset

        if i + 1 < len(chapters):
            # End at the page before next chapter starts
            pdf_end = chapters[i + 1][2] + offset - 1
        else:
            # Last chapter: find where back matter starts
            pdf_end = total_pages
            back_matter_markers = [
                r'^\s*References\s*$',
                r'^\s*Bibliography\s*$',
                r'^\s*Index\s*$',
                r'^\s*Answers?\s*(to\s+)?(selected\s+)?exercises?\s*$',
                r'^\s*Appendix',
                r'^\s*Solutions?\s*$',
            ]
            for j in range(pdf_start, min(total_pages, pdf_start + 200)):
                text = reader.pages[j].extract_text() or ""
                lines = text.split('\n')[:8]  # Check first few lines of page
                for line in lines:
                    for marker in back_matter_markers:
                        if re.match(marker, line.strip(), re.IGNORECASE):
                            pdf_end = j  # End before this page
                            break
                    if pdf_end != total_pages:
                        break
                if pdf_end != total_pages:
                    break

        chapter_ranges.append((num, title, pdf_start, pdf_end))

    # Print chapter ranges
    print("\nChapter ranges (PDF pages):")
    print("-" * 60)
    for num, title, start, end in chapter_ranges:
        print(f"  {num:>2}. {title[:40]:<40} {start:>4}-{end:<4} ({end - start + 1} pages)")
    print("-" * 60)

    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # Split PDF
    created_files = []
    for num, title, start, end in chapter_ranges:
        if start < 1 or end > total_pages or start > end:
            print(f"Warning: Invalid range {start}-{end} for chapter {num}, skipping")
            continue

        writer = PdfWriter()
        for page_num in range(start - 1, end):  # Convert to 0-indexed
            writer.add_page(reader.pages[page_num])

        safe_title = sanitize_filename(title)
        filename = f"{int(num):02d}_{safe_title}.pdf"
        output_file = output_path / filename

        with open(output_file, 'wb') as f:
            writer.write(f)

        created_files.append(str(output_file))
        print(f"Created: {output_file}")

    return created_files


def main():
    parser = argparse.ArgumentParser(
        description="Automatically split a PDF into chapters using a TOC file",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    %(prog)s book.pdf toc.html -o chapters/
    %(prog)s book.pdf toc.md -o chapters/ --offset 19

TOC file format (any of these work):
    1 Introduction ..... 1
    2 Methods ..... 15
    3 Results ..... 42
        """,
    )

    parser.add_argument("pdf", help="Input PDF file")
    parser.add_argument("toc", help="Table of contents file (MD, HTML, or TXT)")
    parser.add_argument("-o", "--output", help="Output directory", default="./chapters")
    parser.add_argument(
        "--offset",
        type=int,
        default=None,
        help="Page offset (auto-detected if not specified)",
    )

    args = parser.parse_args()

    # Validate inputs
    if not Path(args.pdf).exists():
        print(f"Error: PDF not found: {args.pdf}")
        sys.exit(1)

    if not Path(args.toc).exists():
        print(f"Error: TOC file not found: {args.toc}")
        sys.exit(1)

    # Split the PDF
    created = split_pdf(args.pdf, args.toc, args.output, args.offset)

    print(f"\nDone! Created {len(created)} chapter files in {args.output}")


if __name__ == "__main__":
    main()
