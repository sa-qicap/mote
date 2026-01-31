#!/usr/bin/env python3
"""
Docling PDF Processor

Extracts markdown and images from PDF files using the Docling library.

Usage:
    python docling_processor.py <pdf_path> <output_path> [--ocr]

Output (JSON):
    {
        "markdown": "...",
        "images": [{"name": "img-001.png", "path": "/abs/path/img-001.png"}, ...],
        "metadata": {"title": "...", "page_count": N}
    }
"""

import argparse
import json
import os
import sys
import tempfile
from pathlib import Path


def process_pdf(pdf_path: str, output_path: str, ocr_engine: str = "auto") -> dict:
    """
    Process a PDF file and extract markdown content and images.

    Args:
        pdf_path: Path to the input PDF file
        output_path: Path where the JSON output will be written
        ocr_engine: OCR engine to use - "auto", "easyocr", "tesseract", "rapidocr", "ocrmac"

    Returns:
        Dictionary with markdown, images, and metadata
    """
    from docling.document_converter import DocumentConverter, PdfFormatOption
    from docling.datamodel.base_models import InputFormat
    from docling.datamodel.pipeline_options import (
        PdfPipelineOptions, OcrEngine,
        EasyOcrOptions, TesseractOcrOptions, RapidOcrOptions, OcrMacOptions
    )

    # Validate input file
    pdf_file = Path(pdf_path)
    if not pdf_file.exists():
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")

    # Create temp directory for images
    images_dir = Path(tempfile.mkdtemp(prefix="docling_images_"))

    # Configure pipeline options
    pipeline_options = PdfPipelineOptions()
    pipeline_options.do_ocr = True
    pipeline_options.images_scale = 2.0  # Higher quality images
    pipeline_options.generate_page_images = False
    pipeline_options.generate_picture_images = True

    # Configure OCR engine
    ocr_engine_lower = ocr_engine.lower()
    if ocr_engine_lower == "easyocr":
        pipeline_options.ocr_options = EasyOcrOptions()
        print(f"Using EasyOCR engine", file=sys.stderr)
    elif ocr_engine_lower == "tesseract":
        pipeline_options.ocr_options = TesseractOcrOptions()
        print(f"Using Tesseract engine", file=sys.stderr)
    elif ocr_engine_lower == "rapidocr":
        pipeline_options.ocr_options = RapidOcrOptions()
        print(f"Using RapidOCR (PaddleOCR) engine", file=sys.stderr)
    elif ocr_engine_lower == "ocrmac":
        pipeline_options.ocr_options = OcrMacOptions()
        print(f"Using Mac Vision OCR engine", file=sys.stderr)
    else:
        # Default: auto-detection
        print(f"Using auto-detection OCR (kind={pipeline_options.ocr_options.kind})", file=sys.stderr)

    # Create converter with options
    converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
        }
    )

    # Convert the document
    result = converter.convert(pdf_path)
    doc = result.document

    # Extract images first, then export markdown with image references
    images = []
    image_counter = 0
    image_map = {}  # Map from picture ref to image path

    # Try to extract images from the document
    try:
        # Check for pictures in the document
        if hasattr(doc, 'pictures') and doc.pictures:
            print(f"Found {len(doc.pictures)} pictures in document", file=sys.stderr)
            for idx, picture in enumerate(doc.pictures):
                try:
                    image_counter += 1
                    image_name = f"img-{image_counter:03d}.png"
                    image_path = images_dir / image_name

                    # Try to get image using the document's get_picture_image method
                    pil_image = None

                    if hasattr(doc, 'get_picture_image'):
                        pil_image = doc.get_picture_image(picture)
                    elif hasattr(picture, 'get_image'):
                        pil_image = picture.get_image(doc)
                    elif hasattr(picture, 'image'):
                        img = picture.image
                        if hasattr(img, 'pil_image'):
                            pil_image = img.pil_image
                        elif hasattr(img, 'save'):
                            pil_image = img

                    if pil_image is not None:
                        pil_image.save(str(image_path))
                        images.append({"name": image_name, "path": str(image_path)})
                        # Store mapping for later replacement
                        if hasattr(picture, 'self_ref'):
                            image_map[str(picture.self_ref)] = image_name
                        print(f"  Extracted image {image_counter}: {image_name}", file=sys.stderr)
                    else:
                        print(f"  Warning: Could not get PIL image for picture {idx}", file=sys.stderr)

                except Exception as img_err:
                    print(f"  Warning: Could not extract image {image_counter}: {img_err}", file=sys.stderr)
                    continue
        else:
            print("No pictures found in document", file=sys.stderr)
    except Exception as e:
        print(f"Warning: Image extraction failed: {e}", file=sys.stderr)

    # Export to markdown
    try:
        # Try with image_mode parameter if available
        # Use "placeholder" to avoid huge base64 embedded images
        if hasattr(doc, 'export_to_markdown'):
            import inspect
            sig = inspect.signature(doc.export_to_markdown)
            if 'image_mode' in sig.parameters:
                # Use placeholder mode to avoid base64 bloat
                markdown_content = doc.export_to_markdown(image_mode="placeholder")
            else:
                markdown_content = doc.export_to_markdown()
        else:
            markdown_content = str(doc)
    except Exception as e:
        print(f"Warning: Markdown export issue: {e}", file=sys.stderr)
        markdown_content = doc.export_to_markdown()

    # Ensure it's a string
    if callable(markdown_content):
        markdown_content = markdown_content()
    markdown_content = str(markdown_content)

    # Remove base64 embedded images (they bloat the content)
    import re
    base64_pattern = r'!\[([^\]]*)\]\(data:image/[^;]+;base64,[^)]+\)'
    base64_count = len(re.findall(base64_pattern, markdown_content))
    if base64_count > 0:
        print(f"Removing {base64_count} base64 embedded images", file=sys.stderr)
        markdown_content = re.sub(base64_pattern, r'[Image: \1]', markdown_content)

    # Replace <!-- image --> placeholders with actual image references
    # This is a simple replacement - replace each placeholder with the next image
    if images and "<!-- image -->" in markdown_content:
        for img in images:
            markdown_content = markdown_content.replace(
                "<!-- image -->",
                f"![{img['name']}]({img['name']})",
                1  # Replace only first occurrence
            )

    # Extract metadata
    title = getattr(doc, 'title', None) or pdf_file.stem
    if callable(title):
        title = title()
    page_count = getattr(doc, 'num_pages', None) or 0
    if callable(page_count):
        page_count = page_count()

    metadata = {
        "title": str(title) if title else pdf_file.stem,
        "page_count": int(page_count) if page_count else 0,
    }

    # Build output
    output = {
        "markdown": markdown_content,
        "images": images,
        "metadata": metadata
    }

    # Write output to file
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    return output


def main():
    parser = argparse.ArgumentParser(
        description="Process PDF files using Docling to extract markdown and images"
    )
    parser.add_argument(
        "pdf_path",
        help="Path to the input PDF file"
    )
    parser.add_argument(
        "output_path",
        help="Path for the JSON output file"
    )
    parser.add_argument(
        "--ocr-engine",
        choices=["auto", "easyocr", "tesseract", "rapidocr", "ocrmac"],
        default="auto",
        help="OCR engine to use (default: auto)"
    )

    args = parser.parse_args()

    try:
        result = process_pdf(args.pdf_path, args.output_path, args.ocr_engine)

        # Print summary to stderr (stdout is for the output path)
        print(f"Processed successfully:", file=sys.stderr)
        print(f"  - Markdown length: {len(result['markdown'])} chars", file=sys.stderr)
        print(f"  - Images extracted: {len(result['images'])}", file=sys.stderr)
        print(f"  - Output written to: {args.output_path}", file=sys.stderr)

        # Print output path to stdout for programmatic use
        print(args.output_path)

    except ImportError as e:
        print(f"Error: Docling not installed. Run: pip install docling", file=sys.stderr)
        sys.exit(1)
    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error processing PDF: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
