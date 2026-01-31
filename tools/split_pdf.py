#!/usr/bin/env python3
"""
Split a PDF into multiple PDFs by chapter.

Usage:
    # Auto-detect chapters from PDF bookmarks/outline
    python split_pdf.py input.pdf -o output_dir/

    # Specify chapter page ranges manually (PDF page numbers)
    python split_pdf.py input.pdf -o output_dir/ --chapters "1:Introduction:20-27" "2:Background:28-61"

    # Use book page numbers with offset (if book page 1 = PDF page 20)
    python split_pdf.py input.pdf -o output_dir/ --offset 19 --chapters "1:Introduction:1-8" "2:Background:9-42"

    # List bookmarks without splitting (to see what's available)
    python split_pdf.py input.pdf --list-bookmarks
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
    # Remove or replace invalid characters
    name = re.sub(r'[<>:"/\\|?*]', '', name)
    name = re.sub(r'\s+', '_', name.strip())
    return name[:100]  # Limit length


def get_bookmarks_with_pages(reader: PdfReader) -> list[tuple[str, int, int]]:
    """
    Extract bookmarks and their page ranges from PDF outline.
    Returns list of (title, start_page, end_page) tuples (1-indexed).
    """
    outline = reader.outline
    if not outline:
        return []

    # Flatten the outline and get page numbers
    bookmarks = []

    def process_outline(items, depth=0):
        for item in items:
            if isinstance(item, list):
                # Nested bookmarks
                process_outline(item, depth + 1)
            else:
                # Get page number for this bookmark
                try:
                    page_num = reader.get_destination_page_number(item) + 1  # 1-indexed
                    title = item.title
                    bookmarks.append((title, page_num, depth))
                except Exception:
                    pass

    process_outline(outline)

    if not bookmarks:
        return []

    # Filter to top-level bookmarks only (chapters) and calculate page ranges
    top_level = [(title, start) for title, start, depth in bookmarks if depth == 0]

    if not top_level:
        # No top-level bookmarks, use all bookmarks
        top_level = [(title, start) for title, start, depth in bookmarks]

    # Calculate end pages
    total_pages = len(reader.pages)
    chapters = []
    for i, (title, start) in enumerate(top_level):
        if i + 1 < len(top_level):
            end = top_level[i + 1][1] - 1
        else:
            end = total_pages
        chapters.append((title, start, end))

    return chapters


def list_bookmarks(pdf_path: str) -> None:
    """Print all bookmarks in the PDF."""
    reader = PdfReader(pdf_path)
    chapters = get_bookmarks_with_pages(reader)

    if not chapters:
        print("No bookmarks found in PDF.")
        print("You'll need to specify chapters manually with --chapters")
        return

    print(f"Found {len(chapters)} top-level bookmarks:\n")
    for i, (title, start, end) in enumerate(chapters, 1):
        print(f"  {i:2}. {title}")
        print(f"      Pages {start}-{end} ({end - start + 1} pages)\n")


def parse_chapter_spec(spec: str) -> tuple[str, str, int, int]:
    """
    Parse a chapter specification string.
    Format: "number:title:start-end" or "title:start-end"
    Returns: (number, title, start_page, end_page)
    """
    parts = spec.split(':')
    if len(parts) == 3:
        num, title, pages = parts
    elif len(parts) == 2:
        num = ""
        title, pages = parts
    else:
        raise ValueError(f"Invalid chapter spec: {spec}")

    page_match = re.match(r'(\d+)-(\d+)', pages)
    if not page_match:
        raise ValueError(f"Invalid page range: {pages}")

    start = int(page_match.group(1))
    end = int(page_match.group(2))

    return num, title, start, end


def split_pdf(
    pdf_path: str,
    output_dir: str,
    chapters: list[tuple[str, int, int]] | None = None,
    chapter_specs: list[str] | None = None,
    prefix: str = "",
    offset: int = 0,
) -> list[str]:
    """
    Split a PDF into separate files by chapter.

    Args:
        pdf_path: Path to input PDF
        output_dir: Directory to write output files
        chapters: List of (title, start_page, end_page) from bookmarks
        chapter_specs: List of chapter specification strings
        prefix: Optional prefix for output filenames
        offset: Page offset to add (use when specifying book page numbers)
                e.g., if book page 1 = PDF page 20, use offset=19

    Returns:
        List of created file paths
    """
    reader = PdfReader(pdf_path)
    total_pages = len(reader.pages)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # Determine chapters to extract
    if chapter_specs:
        # Parse manual chapter specifications
        chapters_to_extract = []
        for spec in chapter_specs:
            num, title, start, end = parse_chapter_spec(spec)
            # Apply offset (convert book pages to PDF pages)
            start += offset
            end += offset
            if num:
                full_title = f"{num}_{title}"
            else:
                full_title = title
            chapters_to_extract.append((full_title, start, end))
    elif chapters:
        chapters_to_extract = chapters
    else:
        # Try to get from bookmarks
        chapters_to_extract = get_bookmarks_with_pages(reader)
        if not chapters_to_extract:
            print("Error: No bookmarks found and no chapters specified.")
            print("Use --chapters to specify page ranges manually.")
            sys.exit(1)

    created_files = []

    for i, (title, start, end) in enumerate(chapters_to_extract, 1):
        # Validate page range
        if start < 1 or end > total_pages or start > end:
            print(f"Warning: Invalid page range {start}-{end} for '{title}', skipping")
            continue

        # Create new PDF with selected pages
        writer = PdfWriter()
        for page_num in range(start - 1, end):  # Convert to 0-indexed
            writer.add_page(reader.pages[page_num])

        # Generate output filename
        safe_title = sanitize_filename(title)
        if prefix:
            filename = f"{prefix}_{i:02d}_{safe_title}.pdf"
        else:
            filename = f"{i:02d}_{safe_title}.pdf"

        output_file = output_path / filename

        # Write the new PDF
        with open(output_file, 'wb') as f:
            writer.write(f)

        created_files.append(str(output_file))
        print(f"Created: {output_file} (pages {start}-{end}, {end - start + 1} pages)")

    return created_files


def main():
    parser = argparse.ArgumentParser(
        description="Split a PDF into multiple PDFs by chapter",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # List available bookmarks
    %(prog)s book.pdf --list-bookmarks

    # Split using PDF bookmarks
    %(prog)s book.pdf -o chapters/

    # Split with manual chapter specs (using PDF page numbers)
    %(prog)s book.pdf -o chapters/ --chapters "1:Intro:20-27" "2:Methods:28-61"

    # Split using book page numbers with offset
    # (if book page 1 = PDF page 20, use --offset 19)
    %(prog)s book.pdf -o chapters/ --offset 19 --chapters "1:Intro:1-8" "2:Methods:9-42"

    # Add a prefix to output files
    %(prog)s book.pdf -o chapters/ --prefix "physics"
        """,
    )

    parser.add_argument("pdf", help="Input PDF file")
    parser.add_argument("-o", "--output", help="Output directory", default="./chapters")
    parser.add_argument(
        "--chapters",
        nargs="+",
        help='Chapter specs in format "num:title:start-end" or "title:start-end"',
    )
    parser.add_argument(
        "--list-bookmarks",
        action="store_true",
        help="List bookmarks and exit without splitting",
    )
    parser.add_argument("--prefix", help="Prefix for output filenames", default="")
    parser.add_argument(
        "--offset",
        type=int,
        default=0,
        help="Page offset (PDF page = book page + offset). Use when specifying book page numbers.",
    )

    args = parser.parse_args()

    # Validate input file
    if not Path(args.pdf).exists():
        print(f"Error: File not found: {args.pdf}")
        sys.exit(1)

    if args.list_bookmarks:
        list_bookmarks(args.pdf)
        return

    # Split the PDF
    created = split_pdf(
        args.pdf,
        args.output,
        chapter_specs=args.chapters,
        prefix=args.prefix,
        offset=args.offset,
    )

    print(f"\nDone! Created {len(created)} chapter files in {args.output}")


if __name__ == "__main__":
    main()
