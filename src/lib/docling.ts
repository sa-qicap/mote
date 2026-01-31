import { spawn } from "child_process";
import { join } from "path";
import { readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

export interface DoclingImage {
  name: string;
  path: string;
}

export interface DoclingMetadata {
  title: string | null;
  page_count: number;
}

export interface DoclingOutput {
  markdown: string;
  images: DoclingImage[];
  metadata: DoclingMetadata;
}

export type OcrEngine = "auto" | "easyocr" | "tesseract" | "rapidocr" | "ocrmac";

/**
 * Process a PDF file using Docling (Python) to extract markdown and images.
 *
 * @param pdfPath - Absolute path to the PDF file
 * @param ocrEngine - OCR engine to use: "auto", "easyocr", "tesseract", "rapidocr", "ocrmac"
 * @returns Parsed DoclingOutput with markdown, images, and metadata
 */
export async function processWithDocling(
  pdfPath: string,
  ocrEngine: OcrEngine = "auto"
): Promise<DoclingOutput> {
  const scriptPath = join(process.cwd(), "scripts/python/docling_processor.py");
  const outputPath = join(tmpdir(), `docling-output-${randomUUID()}.json`);

  return new Promise((resolve, reject) => {
    const args = [scriptPath, pdfPath, outputPath, "--ocr-engine", ocrEngine];

    const pythonProcess = spawn("python3", args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";

    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    pythonProcess.on("close", async (code) => {
      if (code !== 0) {
        reject(new Error(`Docling processing failed (code ${code}): ${stderr}`));
        return;
      }

      try {
        // Read the output JSON file
        const outputJson = await readFile(outputPath, "utf-8");
        const output: DoclingOutput = JSON.parse(outputJson);

        // Clean up the temp output file
        await unlink(outputPath).catch(() => {});

        resolve(output);
      } catch (error) {
        reject(
          new Error(
            `Failed to read Docling output: ${error instanceof Error ? error.message : error}`
          )
        );
      }
    });

    pythonProcess.on("error", (error) => {
      if (error.message.includes("ENOENT")) {
        reject(
          new Error(
            "Python3 not found. Please install Python 3 and the docling package."
          )
        );
      } else {
        reject(new Error(`Failed to spawn Python process: ${error.message}`));
      }
    });
  });
}

/**
 * Check if Docling is available by attempting a dry run.
 * This can be used to show a helpful error message to users.
 */
export async function checkDoclingAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const pythonProcess = spawn("python3", ["-c", "import docling; print('ok')"], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    pythonProcess.on("close", (code) => {
      resolve(code === 0);
    });

    pythonProcess.on("error", () => {
      resolve(false);
    });
  });
}
