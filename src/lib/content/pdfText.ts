import type { LessonSourceType, SourcePage } from "@/lib/api/content";

/**
 * Browser-side text extraction for lesson uploads.
 *
 * `POST /api/content/parse` takes text, never a file - `sourceText` for a flat
 * body or `pages: [{pageNumber, text}]` for something paginated - plus a
 * `sourceType` naming what the teacher actually uploaded. There is no upload
 * endpoint on the backend, so the extraction has to happen here, and the
 * per-page request shape is the reason we extract page by page.
 *
 * PDF is the only format we can read today. Word and PowerPoint would each
 * need their own extractor; until then they resolve to `unsupportedFormat` and
 * the wizard keeps its designed demo beat rather than pretending to parse.
 *
 * pdfjs-dist is imported dynamically so the ~1MB worker never reaches the
 * bundle of a teacher who does not upload a PDF.
 */

export type ExtractOutcome =
  | { kind: "pages"; pages: SourcePage[]; sourceType: LessonSourceType }
  | { kind: "empty" }
  | { kind: "unsupportedFormat"; sourceType: LessonSourceType }
  | { kind: "failed"; reason: string };

/** Extension -> the enum the backend wants back in `sourceType`. */
export function sourceTypeFor(fileName: string): LessonSourceType | null {
  const ext = fileName.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  if (!ext) return null;
  if (ext === "pdf") return "pdf";
  if (ext === "doc" || ext === "docx") return "word";
  if (ext === "ppt" || ext === "pptx") return "powerpoint";
  if (ext === "txt" || ext === "md") return "text";
  return null;
}

/** pdf.js text items carry `str`; `hasEOL` is what ends a visual line. */
interface TextItemish {
  str?: string;
  hasEOL?: boolean;
}

function itemsToText(items: TextItemish[]): string {
  let out = "";
  for (const item of items) {
    if (typeof item.str !== "string") continue;
    out += item.str;
    out += item.hasEOL ? "\n" : " ";
  }
  // Collapse the padding the item stream leaves behind without losing the
  // line breaks, which are the only structure the parser gets from us.
  return out
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

let workerStarted = false;

export async function extractText(file: File): Promise<ExtractOutcome> {
  const sourceType = sourceTypeFor(file.name);
  if (!sourceType) return { kind: "failed", reason: "unrecognised extension" };

  if (sourceType === "text") {
    const text = (await file.text()).trim();
    return text
      ? { kind: "pages", pages: [{ pageNumber: 1, text }], sourceType }
      : { kind: "empty" };
  }

  if (sourceType !== "pdf") return { kind: "unsupportedFormat", sourceType };

  try {
    const pdfjs = await import("pdfjs-dist");
    if (!workerStarted) {
      // `workerPort` avoids pinning a bundler-specific `workerSrc` URL.
      pdfjs.GlobalWorkerOptions.workerPort = new Worker(
        new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url),
        { type: "module" },
      );
      workerStarted = true;
    }

    const data = new Uint8Array(await file.arrayBuffer());
    const task = pdfjs.getDocument({ data });
    const doc = await task.promise;

    const pages: SourcePage[] = [];
    for (let n = 1; n <= doc.numPages; n += 1) {
      const page = await doc.getPage(n);
      const content = await page.getTextContent();
      const text = itemsToText(content.items as TextItemish[]);
      if (text) pages.push({ pageNumber: n, text });
    }
    await task.destroy();

    // A scanned PDF parses fine and yields nothing - that is the honest
    // "we could not read this" case, not a failure.
    return pages.length ? { kind: "pages", pages, sourceType } : { kind: "empty" };
  } catch (error) {
    return {
      kind: "failed",
      reason: error instanceof Error ? error.message : "extraction failed",
    };
  }
}
