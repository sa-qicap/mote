# Split PDF by Chapter

Split a PDF into separate chapter files using a table of contents file.

## Usage

```
/split-pdf <pdf_file> <toc_file> [output_dir] [--offset N]
```

## Arguments

- `pdf_file` - Path to the PDF to split
- `toc_file` - Path to TOC file (HTML or MD) containing chapter titles and page numbers
- `output_dir` - (Optional) Output directory for chapter PDFs. Defaults to a folder named after the PDF.
- `--offset N` - (Optional) Page offset if auto-detection fails (PDF page = book page + offset)

## Examples

```
/split-pdf ~/Downloads/book.pdf ~/Downloads/book_toc.html
/split-pdf ~/Downloads/ESL.pdf ~/Downloads/ESL.html ~/Downloads/ESL_chapters/
/split-pdf ~/Downloads/book.pdf ~/Downloads/toc.html --offset 16
```

## Instructions

When the user invokes this skill:

1. **Parse the arguments** from the user's command to extract:
   - `pdf_file` - the PDF path (required)
   - `toc_file` - the TOC file path (required)
   - `output_dir` - output directory (optional, default: create folder based on PDF name)
   - `--offset` - manual page offset (optional)

2. **Validate inputs**:
   - Check that the PDF file exists
   - Check that the TOC file exists
   - If either is missing, ask the user to provide the correct path

3. **Determine output directory**:
   - If not specified, create a directory named after the PDF (without extension) in the same location as the PDF
   - Example: `~/Downloads/book.pdf` → `~/Downloads/book/`

4. **Run the split tool**:
   ```bash
   python3 tools/split_pdf_auto.py <pdf_file> <toc_file> -o <output_dir> [--offset N]
   ```

5. **Handle common issues**:

   a. **If offset auto-detection fails** (warning message about offset=0):
      - Check the first ~20 pages of the PDF to find where Chapter 1 starts
      - Look for text like "Chapter 1", "1 Introduction", or the first chapter title
      - Calculate offset as: (PDF page where Ch1 starts) - (book page number of Ch1)
      - Re-run with `--offset` flag

   b. **If no chapters found in TOC**:
      - Check the TOC file format
      - Expected formats:
        - `1 Title ..... 1`
        - `Chapter 1 Title ..... 1`
        - `1. Title ..... 1`
      - If format is different, help parse it manually or suggest the user provide a simpler TOC

   c. **If last chapter is too long** (likely includes appendices):
      - The tool should auto-detect References/Index/Appendix sections
      - If not, manually check what's at the end of the PDF and adjust

6. **Verify the output**:
   - List the created chapter files
   - Spot-check that Chapter 1 starts with the correct content
   - Report success with a summary of chapters created

## TOC File Formats Supported

The tool recognizes these patterns in HTML/MD files:

```
1 Introduction ..... 1
2 Methods ..... 15
```

```
Chapter 1 Introduction ..... 1
Chapter 2 Methods ..... 15
```

```
1. Introduction ..... 1
2. Methods ..... 15
```

Lines are split by `<br>` tags in HTML. The tool strips HTML tags and normalizes whitespace.

## Troubleshooting

- **Pages misaligned**: Use `--offset` flag. Find where Chapter 1 starts in the PDF and calculate: offset = (PDF page) - (book page)
- **Missing chapters**: Check if chapter titles have special characters (math symbols, colons) that might confuse parsing
- **Last chapter too long**: The tool looks for "References", "Bibliography", "Index", "Answers to exercises" to detect end of content
