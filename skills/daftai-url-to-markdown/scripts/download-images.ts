import { mkdir, writeFile } from "node:fs/promises";
import * as path from "node:path";

const IMAGE_URL_REGEX = /!\[[^\]]*\]\(([^)]+)\)/g;
const MAX_BASENAME_LENGTH = 80;
const FETCH_TIMEOUT_MS = 30_000;

export function extractImageUrls(markdown: string): string[] {
  const urls = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = IMAGE_URL_REGEX.exec(markdown)) !== null) {
    const url = match[1].trim();
    if (url.startsWith("http://") || url.startsWith("https://")) {
      urls.add(url);
    }
  }

  return Array.from(urls);
}

export function sanitizeFilename(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "image.png";
  }

  const pathname = decodeURIComponent(parsed.pathname);
  const ext = path.extname(pathname) || ".png";
  let basename = path.basename(pathname, ext);

  basename = basename
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  if (!basename) {
    basename = "image";
  }

  if (basename.length > MAX_BASENAME_LENGTH) {
    basename = basename.slice(0, MAX_BASENAME_LENGTH);
    basename = basename.replace(/-$/, "");
  }

  return `${basename}${ext.toLowerCase()}`;
}

export async function downloadImage(
  url: string,
  outputDir: string,
  existingFiles: Set<string>
): Promise<{ localPath: string; filename: string } | null> {
  try {
    await mkdir(outputDir, { recursive: true });

    let filename = sanitizeFilename(url);
    const ext = path.extname(filename);
    const base = path.basename(filename, ext);

    if (existingFiles.has(filename)) {
      let counter = 2;
      while (existingFiles.has(`${base}-${counter}${ext}`)) {
        counter++;
      }
      filename = `${base}-${counter}${ext}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      console.error(`Failed to download ${url}: HTTP ${response.status}`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const localPath = path.join(outputDir, filename);
    await writeFile(localPath, buffer);

    existingFiles.add(filename);

    return { localPath, filename };
  } catch (error) {
    console.error(
      `Failed to download ${url}: ${error instanceof Error ? error.message : error}`
    );
    return null;
  }
}

export async function downloadAndReplaceImages(
  markdown: string,
  outputDir: string
): Promise<{ markdown: string; downloaded: number; failed: number }> {
  const urls = extractImageUrls(markdown);

  if (urls.length === 0) {
    return { markdown, downloaded: 0, failed: 0 };
  }

  let downloaded = 0;
  let failed = 0;
  const existingFiles = new Set<string>();
  const urlToFilename = new Map<string, string>();

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`Downloading images: ${i + 1}/${urls.length}...`);

    const result = await downloadImage(url, outputDir, existingFiles);
    if (result) {
      urlToFilename.set(url, result.filename);
      downloaded++;
    } else {
      failed++;
    }
  }

  let updatedMarkdown = markdown;
  for (const [url, filename] of urlToFilename) {
    updatedMarkdown = updatedMarkdown.replaceAll(url, `images/${filename}`);
  }

  return { markdown: updatedMarkdown, downloaded, failed };
}
