#!/usr/bin/env npx tsx
/**
 * Extract timed SRT subtitles from video/audio files using OpenAI Whisper CLI.
 * Handles complex filenames by copying to temp directory.
 *
 * Usage: npx tsx extract_subtitles.ts <video_file> [language] [model]
 * Example: npx tsx extract_subtitles.ts video.mp4 en turbo
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { execSync, execFileSync } from "child_process";

// Defaults
const DEFAULT_MODEL = "turbo";
const DEFAULT_LANGUAGE = "en";

// Model selection by video duration
const MODEL_BY_DURATION: Array<{ maxSeconds: number; model: string }> = [
  { maxSeconds: 120, model: "medium" },
  { maxSeconds: 1800, model: "turbo" },
  { maxSeconds: Infinity, model: "base" },
];

function which(cmd: string): string | null {
  try {
    return execSync(`which ${cmd}`, { encoding: "utf-8" }).trim() || null;
  } catch {
    return null;
  }
}

function getVideoDuration(videoPath: string): number {
  const ffprobe = which("ffprobe");
  if (!ffprobe) return 0;
  try {
    const result = execFileSync(ffprobe, [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "csv=p=0",
      videoPath,
    ], { encoding: "utf-8", timeout: 10000 });
    return parseFloat(result.trim()) || 0;
  } catch {
    return 0;
  }
}

function hasAudioStream(videoPath: string): boolean {
  const ffprobe = which("ffprobe");
  if (!ffprobe) return false;
  try {
    const result = execFileSync(ffprobe, [
      "-v", "error",
      "-select_streams", "a",
      "-show_entries", "stream=codec_name",
      "-of", "csv=p=0",
      videoPath,
    ], { encoding: "utf-8", timeout: 10000 });
    return result.trim().length > 0;
  } catch {
    return false;
  }
}

function suggestModel(durationSeconds: number): string {
  for (const entry of MODEL_BY_DURATION) {
    if (durationSeconds <= entry.maxSeconds) {
      return entry.model;
    }
  }
  return DEFAULT_MODEL;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m${s}s` : `${s}s`;
}

function countSubtitleEntries(srtPath: string): number {
  try {
    const content = fs.readFileSync(srtPath, "utf-8");
    const matches = content.match(/^\d+$/gm);
    return matches ? matches.length : 0;
  } catch {
    return 0;
  }
}

export interface ExtractSubtitlesOptions {
  videoPath: string;
  language?: string;
  model?: string;
  outputDir?: string;
}

export function extractSubtitles(opts: ExtractSubtitlesOptions): string {
  const {
    videoPath,
    language = DEFAULT_LANGUAGE,
    model: modelOpt,
    outputDir: outputDirOpt,
  } = opts;

  // Validate input file
  if (!fs.existsSync(videoPath)) {
    throw new Error(`File not found: ${videoPath}`);
  }

  // Check environment
  const whisperPath = which("whisper");
  if (!whisperPath) {
    throw new Error("whisper not found. Install: brew install openai-whisper");
  }

  const ffprobePath = which("ffprobe");
  if (!ffprobePath) {
    throw new Error("ffprobe not found. Install: brew install ffmpeg");
  }

  // Check audio stream
  if (!hasAudioStream(videoPath)) {
    throw new Error("No audio stream found in video file");
  }

  // Get duration and select model
  const duration = getVideoDuration(videoPath);
  const model = modelOpt ?? suggestModel(duration);

  console.log(`\n🎬 Extracting subtitles...`);
  console.log(`   File: ${path.basename(videoPath)}`);
  console.log(`   Duration: ${formatDuration(duration)}`);
  console.log(`   Language: ${language}`);
  console.log(`   Model: ${model}`);

  // Create temp directory to avoid complex filename issues
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "whisper_extract_"));
  const tempInput = path.join(tempDir, "input.mp4");

  try {
    console.log(`   Copying to temp directory...`);
    fs.copyFileSync(videoPath, tempInput);

    // Run Whisper
    console.log(`   Running Whisper transcription...`);
    const startTime = Date.now();

    try {
      execFileSync(whisperPath, [
        tempInput,
        "--model", model,
        "--language", language,
        "--output_format", "srt",
        "--output_dir", tempDir,
      ], {
        encoding: "utf-8",
        maxBuffer: 50 * 1024 * 1024,
        timeout: 30 * 60 * 1000, // 30 min timeout
        stdio: "inherit",
      });
    } catch (e: any) {
      throw new Error(`Whisper failed (exit ${e.status})`);
    }

    const elapsed = (Date.now() - startTime) / 1000;

    // Check output file
    const tempSrt = path.join(tempDir, "input.srt");
    if (!fs.existsSync(tempSrt)) {
      throw new Error("Whisper did not produce SRT output");
    }

    // Determine output path
    const outputDir = outputDirOpt ?? path.dirname(videoPath);
    const baseName = path.basename(videoPath, path.extname(videoPath));
    const outputSrt = path.join(outputDir, `${baseName}.srt`);

    // Copy to destination
    fs.copyFileSync(tempSrt, outputSrt);

    const entryCount = countSubtitleEntries(outputSrt);

    console.log(`\n✅ Subtitles extracted`);
    console.log(`   Output: ${outputSrt}`);
    console.log(`   Entries: ${entryCount}`);
    console.log(`   Elapsed: ${formatDuration(elapsed)}`);

    return outputSrt;
  } finally {
    // Clean up temp files
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch { /* ignore */ }
  }
}

// CLI entry
if (require.main === module) {
  if (process.argv.length < 3) {
    console.log(`Usage: npx tsx extract_subtitles.ts <video_file> [language] [model]`);
    console.log(`\nArguments:`);
    console.log(`  video_file  - Input video/audio file path`);
    console.log(`  language    - Language code, default: ${DEFAULT_LANGUAGE} (options: zh, ja, ko, fr, de, es, etc.)`);
    console.log(`  model       - Whisper model, default: auto-selected by duration`);
    console.log(`                tiny / base / small / medium / turbo / large`);
    console.log(`\nModel recommendation:`);
    console.log(`  < 2 min    → medium`);
    console.log(`  2-30 min   → turbo`);
    console.log(`  > 30 min   → base`);
    console.log(`\nExamples:`);
    console.log(`  npx tsx extract_subtitles.ts video.mp4`);
    console.log(`  npx tsx extract_subtitles.ts video.mp4 zh`);
    console.log(`  npx tsx extract_subtitles.ts video.mp4 en turbo`);
    process.exit(1);
  }

  const videoPath = process.argv[2];
  const language = process.argv[3] ?? DEFAULT_LANGUAGE;
  const model = process.argv[4];

  try {
    const resultPath = extractSubtitles({ videoPath, language, model });
    console.log(`\n✨ Done! Output: ${resultPath}`);
  } catch (e: any) {
    console.error(`\n❌ Error: ${e.message}`);
    process.exit(1);
  }
}
