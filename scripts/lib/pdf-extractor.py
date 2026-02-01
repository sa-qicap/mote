#!/usr/bin/env python3
"""
PDF text extraction helper for ingestion verification.

Usage:
    python pdf-extractor.py <pdf_path> [--json]

Extracts text from each page and identifies section headers.
Outputs JSON for consumption by TypeScript verification script.
"""

import sys
import json
import re
from pathlib import Path

try:
    import fitz  # pymupdf
except ImportError:
    print(json.dumps({"error": "pymupdf not installed. Run: pip install pymupdf"}))
    sys.exit(1)


def extract_text_range(pdf_path: str, start_page: int, end_page: int) -> dict:
    """Extract text from a specific page range in a PDF.

    Args:
        pdf_path: Path to the PDF file
        start_page: 1-indexed start page
        end_page: 1-indexed end page (inclusive)

    Returns:
        dict with 'text' or 'error' key
    """
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        return {"error": f"Failed to open PDF: {e}"}

    if start_page < 1 or end_page > len(doc):
        return {"error": f"Invalid page range: {start_page}-{end_page} (PDF has {len(doc)} pages)"}

    text_parts = []
    for page_num in range(start_page - 1, end_page):  # Convert to 0-indexed
        page = doc[page_num]
        text_parts.append(page.get_text())

    doc.close()
    return {
        "text": "\n\n".join(text_parts),
        "pages": f"{start_page}-{end_page}",
        "charCount": sum(len(t) for t in text_parts)
    }


def extract_pdf_content(pdf_path: str) -> dict:
    """Extract text and identify sections from a PDF."""
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        return {"error": f"Failed to open PDF: {e}"}

    result = {
        "path": pdf_path,
        "totalPages": len(doc),
        "pages": [],
        "sections": [],
        "endContentStartPage": None,
        "endContentType": None,
    }

    # Common section header patterns
    section_patterns = [
        # "3.1 Section Title" or "3.1.1 Subsection"
        r"^\s*(\d+\.\d+(?:\.\d+)?)\s+([A-Z][^\n]{2,60})",
        # "Chapter 3: Title"
        r"^\s*(Chapter\s+\d+)[:\s]+([^\n]+)",
        # "Section 3.1" type headers
        r"^\s*(Section\s+\d+\.\d+)[:\s]*([^\n]*)",
    ]

    # Patterns indicating end of main content (exclude from concepts)
    # Order matters - earlier patterns have priority
    # Patterns must be precise to avoid false positives like "Index Shrinkage Factor"
    end_patterns = [
        (r"^Bibliographic\s+Notes\s*$", "Bibliographic Notes"),
        (r"^Exercises\s*$", "Exercises"),
        (r"^References\s*$", "References"),
        (r"^Bibliography\s*$", "Bibliography"),
        (r"^Appendix\s*[A-Z]?\s*$", "Appendix"),
        (r"^Index\s*$", "Index"),  # Must be standalone "Index" at start of line
    ]

    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()

        page_data = {
            "pageNumber": page_num + 1,  # 1-indexed
            "textPreview": text[:500].replace("\n", " ").strip(),
            "textLength": len(text),
            "sectionsFound": [],
            "isEndContent": False,
        }

        # Check for section headers
        lines = text.split("\n")
        for line_idx, line in enumerate(lines):
            line_stripped = line.strip()

            # Check for end content markers
            for pattern, content_type in end_patterns:
                if re.search(pattern, line_stripped, re.IGNORECASE):
                    # Extra check for "Index" - must not be followed by continuation text
                    # that suggests it's part of a figure label (e.g., "Index Shrinkage Factor")
                    if content_type == "Index":
                        # Check next few non-empty lines for continuation
                        next_lines = [l.strip() for l in lines[line_idx+1:line_idx+4] if l.strip()]
                        if next_lines and any(word in next_lines[0].lower() for word in
                            ['shrinkage', 'factor', 'value', 'score', 'number', 'plot', 'figure']):
                            continue  # Skip this false positive

                    page_data["isEndContent"] = True
                    page_data["endContentType"] = content_type
                    # Track first occurrence across entire PDF
                    if result["endContentStartPage"] is None:
                        result["endContentStartPage"] = page_num + 1
                        result["endContentType"] = content_type
                    break

            # Check for section headers
            for pattern in section_patterns:
                match = re.match(pattern, line_stripped)
                if match:
                    section_num = match.group(1)
                    section_title = match.group(2).strip() if match.lastindex >= 2 else ""

                    # Determine if header is at top of page (first 5 non-empty lines)
                    non_empty_lines_before = sum(1 for l in lines[:line_idx] if l.strip())
                    is_at_top = non_empty_lines_before < 5

                    # Detect running headers (repeated section titles at page tops)
                    # Running headers typically:
                    # 1. Appear in first 2 non-empty lines
                    # 2. Are immediately followed by a page number
                    # 3. Don't have section intro text after
                    is_running_header = False
                    if non_empty_lines_before < 2:
                        # Check if next non-empty line is just a page number
                        next_lines = [l.strip() for l in lines[line_idx+1:line_idx+4] if l.strip()]
                        if next_lines:
                            # Page number pattern: just digits, possibly with period
                            if re.match(r'^\d{1,4}\.?$', next_lines[0]):
                                is_running_header = True
                            # Also check if first line is the page number before this
                            prev_lines = [l.strip() for l in lines[:line_idx] if l.strip()]
                            if prev_lines and re.match(r'^\d{1,4}\.?$', prev_lines[-1]):
                                is_running_header = True

                    section_info = {
                        "pageNumber": page_num + 1,
                        "sectionNumber": section_num,
                        "sectionTitle": section_title,
                        "fullText": line_stripped[:100],
                        "lineInPage": line_idx + 1,
                        "isAtTopOfPage": is_at_top,
                        "isRunningHeader": is_running_header,
                        "approximatePosition": "top" if is_at_top else "middle",
                    }
                    page_data["sectionsFound"].append(section_info)
                    result["sections"].append(section_info)
                    break

        result["pages"].append(page_data)

    doc.close()
    return result


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python pdf-extractor.py <pdf_path> [--json] OR python pdf-extractor.py <pdf_path> --extract <start> <end>"}))
        sys.exit(1)

    pdf_path = sys.argv[1]

    if not Path(pdf_path).exists():
        print(json.dumps({"error": f"PDF not found: {pdf_path}"}))
        sys.exit(1)

    # Check for text extraction mode
    if "--extract" in sys.argv:
        try:
            extract_idx = sys.argv.index("--extract")
            start_page = int(sys.argv[extract_idx + 1])
            end_page = int(sys.argv[extract_idx + 2])
        except (IndexError, ValueError):
            print(json.dumps({"error": "Usage: --extract <start_page> <end_page>"}))
            sys.exit(1)

        result = extract_text_range(pdf_path, start_page, end_page)
        print(json.dumps(result, indent=2))
        return

    # Default: full PDF analysis
    output_json = "--json" in sys.argv
    result = extract_pdf_content(pdf_path)

    if output_json or True:  # Always output JSON for script consumption
        print(json.dumps(result, indent=2))
    else:
        # Human-readable output
        if "error" in result:
            print(f"Error: {result['error']}")
            sys.exit(1)

        print(f"PDF: {result['path']}")
        print(f"Total pages: {result['totalPages']}")
        print("\nSections found:")
        for section in result["sections"]:
            print(f"  Page {section['pageNumber']}: {section['sectionNumber']} {section['sectionTitle']}")
            print(f"    Position: {section['approximatePosition']}")


if __name__ == "__main__":
    main()
