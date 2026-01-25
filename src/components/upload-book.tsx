"use client";

import { useState, useRef } from "react";

interface UploadBookProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function UploadBook({ onComplete, onCancel }: UploadBookProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      if (author) formData.append("author", author);

      const res = await fetch("/api/books", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        setError("Please select a PDF file");
        return;
      }
      setFile(selectedFile);
      setError("");
      // Try to extract title from filename
      if (!title) {
        const nameWithoutExt = selectedFile.name.replace(/\.pdf$/i, "");
        setTitle(nameWithoutExt);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full p-8 border-2 border-dashed border-foreground/20 rounded-lg hover:border-foreground/40 transition-colors text-center"
        >
          {file ? (
            <span className="text-foreground">{file.name}</span>
          ) : (
            <span className="text-muted">Click to select a PDF</span>
          )}
        </button>
      </div>

      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Book title"
          className="w-full px-4 py-3 bg-transparent border border-foreground/20 rounded-lg focus:border-foreground/40 focus:outline-none transition-colors"
          required
        />
      </div>

      <div>
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Author (optional)"
          className="w-full px-4 py-3 bg-transparent border border-foreground/20 rounded-lg focus:border-foreground/40 focus:outline-none transition-colors"
        />
      </div>

      {error && <p className="text-error text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 btn btn-secondary"
          disabled={uploading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 btn btn-primary"
          disabled={!file || !title || uploading}
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>
    </form>
  );
}
