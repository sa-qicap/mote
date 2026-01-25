#!/usr/bin/env python3
"""
PDF Extraction Script for Mote
Extracts text, formatting, and images/figures from PDF files.
"""

import fitz  # PyMuPDF
import json
import os
import sys
import re
from pathlib import Path


class PDFExtractor:
    def __init__(self, pdf_path, page_offset=0):
        self.doc = fitz.open(pdf_path)
        self.page_offset = page_offset  # PDF page = book page + offset

    def book_page_to_pdf_page(self, book_page):
        """Convert book page number to PDF page index (0-based)."""
        return book_page + self.page_offset - 1

    def extract_text_blocks(self, page):
        """Extract text blocks with formatting info."""
        blocks = page.get_text("dict", flags=fitz.TEXT_PRESERVE_WHITESPACE)["blocks"]
        text_blocks = []

        for block in blocks:
            if block["type"] == 0:  # Text block
                block_text = ""
                block_styles = []

                for line in block.get("lines", []):
                    for span in line.get("spans", []):
                        text = span["text"]
                        font = span["font"]
                        size = span["size"]
                        flags = span["flags"]

                        is_bold = bool(flags & 2**4) or "Bold" in font
                        is_italic = bool(flags & 2**1) or "Italic" in font

                        block_text += text
                        block_styles.append({
                            "text": text,
                            "bold": is_bold,
                            "italic": is_italic,
                            "size": round(size, 1),
                            "font": font
                        })
                    block_text += "\n"

                if block_text.strip():
                    text_blocks.append({
                        "text": block_text.strip(),
                        "styles": block_styles,
                        "bbox": block["bbox"],
                        "y_pos": block["bbox"][1]
                    })

        return text_blocks

    def detect_figures(self, page, page_num):
        """Detect figure regions on a page by looking for FIGURE captions."""
        text = page.get_text()
        figures = []

        # Find FIGURE captions
        pattern = r'FIGURE\s+(\d+\.?\d*)[.:]\s*([^\n]+(?:\n(?![A-Z]{2,})[^\n]+)*)'
        matches = re.finditer(pattern, text, re.IGNORECASE)

        for match in matches:
            fig_num = match.group(1)
            caption = match.group(2).strip()
            figures.append({
                "figure_num": fig_num,
                "caption": caption,
                "page": page_num
            })

        return figures

    def render_page_region(self, page, output_path, clip=None, zoom=2.0):
        """Render a page or region to an image."""
        mat = fitz.Matrix(zoom, zoom)
        if clip:
            pix = page.get_pixmap(matrix=mat, clip=clip)
        else:
            pix = page.get_pixmap(matrix=mat)
        pix.save(output_path)
        return output_path

    def render_figure(self, page, page_num, output_dir, zoom=2.0):
        """Render the figure portion of a page (top 60% typically contains figure)."""
        rect = page.rect
        # Figures are usually in top portion, text below
        # We'll render full page and let user crop if needed

        img_path = os.path.join(output_dir, f"page_{page_num}.png")
        self.render_page_region(page, img_path, zoom=zoom)
        return img_path

    def extract_pages(self, start_book_page, end_book_page, output_dir):
        """Extract content from a range of book pages."""
        os.makedirs(output_dir, exist_ok=True)

        all_text = []
        all_figures = []
        figure_images = []

        start_idx = self.book_page_to_pdf_page(start_book_page)
        end_idx = self.book_page_to_pdf_page(end_book_page) + 1

        print(f"Extracting book pages {start_book_page}-{end_book_page}")
        print(f"(PDF pages {start_idx + 1}-{end_idx})")

        for pdf_page_idx in range(start_idx, end_idx):
            page = self.doc[pdf_page_idx]
            book_page = pdf_page_idx - self.page_offset + 1
            print(f"  Processing book page {book_page} (PDF page {pdf_page_idx + 1})...")

            # Extract text
            text_blocks = self.extract_text_blocks(page)
            all_text.extend(text_blocks)

            # Detect figures
            figures = self.detect_figures(page, book_page)
            if figures:
                all_figures.extend(figures)
                # Render page as image for figures
                img_path = self.render_figure(page, book_page, output_dir)
                figure_images.append({
                    "book_page": book_page,
                    "path": img_path,
                    "figures": figures
                })
                print(f"    Found {len(figures)} figure(s), rendered page")

        return {
            "text_blocks": all_text,
            "figures": all_figures,
            "figure_images": figure_images
        }

    def format_markdown(self, text_blocks, figures):
        """Convert extracted content to markdown."""
        lines = []
        current_para = []
        last_y = None

        # Sort by vertical position
        text_blocks.sort(key=lambda x: x["y_pos"])

        for block in text_blocks:
            text = block["text"].strip()
            if not text:
                continue

            # Skip page numbers (usually just a number at top)
            if re.match(r'^\d{1,3}$', text):
                continue

            # Skip headers like "2. Overview of Supervised Learning"
            if re.match(r'^\d+\.\s+[A-Z]', text) and len(text) < 60:
                if current_para:
                    lines.append(" ".join(current_para))
                    lines.append("")
                    current_para = []
                lines.append(f"## {text}")
                lines.append("")
                continue

            # Check for section headers (e.g., "2.3.3 From Least Squares...")
            section_match = re.match(r'^(\d+\.\d+\.?\d*)\s+(.+)$', text)
            if section_match and len(text) < 80:
                if current_para:
                    lines.append(" ".join(current_para))
                    lines.append("")
                    current_para = []
                lines.append(f"### {text}")
                lines.append("")
                continue

            # Check for FIGURE captions
            if text.upper().startswith('FIGURE'):
                if current_para:
                    lines.append(" ".join(current_para))
                    lines.append("")
                    current_para = []
                lines.append(f"*{text}*")
                lines.append("")
                continue

            # Detect paragraph breaks
            y_pos = block["y_pos"]
            if last_y is not None and y_pos - last_y > 25:
                if current_para:
                    lines.append(" ".join(current_para))
                    lines.append("")
                    current_para = []
            last_y = y_pos

            # Clean up text
            clean_text = re.sub(r'\s+', ' ', text)
            current_para.append(clean_text)

        if current_para:
            lines.append(" ".join(current_para))

        return "\n".join(lines)

    def close(self):
        self.doc.close()


def main():
    if len(sys.argv) < 4:
        print("Usage: python extract-pdf.py <pdf_path> <start_page> <end_page> [output_dir] [page_offset]")
        print("Example: python extract-pdf.py ESL.pdf 16 22 ./output 19")
        print("")
        print("page_offset: PDF page = book page + offset (e.g., 19 for ESL)")
        sys.exit(1)

    pdf_path = sys.argv[1]
    start_page = int(sys.argv[2])
    end_page = int(sys.argv[3])
    output_dir = sys.argv[4] if len(sys.argv) > 4 else "./pdf_output"
    page_offset = int(sys.argv[5]) if len(sys.argv) > 5 else 0

    if not os.path.exists(pdf_path):
        print(f"Error: PDF file not found: {pdf_path}")
        sys.exit(1)

    extractor = PDFExtractor(pdf_path, page_offset)
    result = extractor.extract_pages(start_page, end_page, output_dir)

    # Generate markdown
    markdown = extractor.format_markdown(result["text_blocks"], result["figures"])

    # Save markdown
    md_path = os.path.join(output_dir, f"pages_{start_page}-{end_page}.md")
    with open(md_path, "w") as f:
        f.write(markdown)
    print(f"\nMarkdown saved to: {md_path}")

    # Save JSON
    json_data = {
        "start_page": start_page,
        "end_page": end_page,
        "page_offset": page_offset,
        "content": markdown,
        "figures": result["figures"],
        "figure_images": [
            {"book_page": fi["book_page"], "path": os.path.basename(fi["path"]), "figures": fi["figures"]}
            for fi in result["figure_images"]
        ]
    }

    json_path = os.path.join(output_dir, f"pages_{start_page}-{end_page}.json")
    with open(json_path, "w") as f:
        json.dump(json_data, f, indent=2)
    print(f"JSON saved to: {json_path}")

    print(f"\nExtracted {len(result['figures'])} figure(s)")
    print(f"Rendered {len(result['figure_images'])} page image(s)")
    print(f"Content length: {len(markdown)} characters")

    extractor.close()


if __name__ == "__main__":
    main()
