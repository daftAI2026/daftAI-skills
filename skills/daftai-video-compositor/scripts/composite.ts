#!/usr/bin/env bun
import { spawn } from "node:child_process";
import { existsSync, linkSync, lstatSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { homedir } from "node:os";
import { foregroundMask, parseRect, scaleFilter, validateGeometry, type Fit, type Rect, type Size } from "./geometry";

export interface Options {
  image: string;
  video: string;
  rect: Rect;
  radius: number;
  border: number;
  fit: Fit;
  output?: string;
  previewOnly?: string;
  previewTime: number;
}
interface Stream {
  index: number;
  codec_type: string;
  width?: number;
  height?: number;
  sample_aspect_ratio?: string;
  time_base?: string;
  start_time?: string;
  duration?: string;
  nb_frames?: string;
  nb_read_frames?: string;
  disposition?: { attached_pic?: number };
  side_data_list?: { rotation?: number }[];
}
export interface Media {
  streams: Stream[];
  format?: { duration?: string; start_time?: string };
}

export async function run(command: string, args: string[], signal?: AbortSignal): Promise<string> {
  return new Promise((accept, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"], signal });
    const output: Buffer[] = [];
    let size = 0;
    let error = "";
    let failure: Error | undefined;
    child.stdout.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > 32 * 1024 * 1024) {
        failure = new Error(`${command} 输出超过限制`);
        child.kill();
      } else output.push(chunk);
    });
    child.stderr.on("data", chunk => { error = (error + chunk.toString()).slice(-65536); });
    // === 等待子进程关闭后再清理，避免取消时仍有文件写入 ===
    child.on("error", reason => { failure = reason; });
    child.on("close", code => {
      if (failure) reject(failure);
      else if (code !== 0) reject(new Error(`${command} 失败 (${code}): ${error}`));
      else accept(Buffer.concat(output).toString());
    });
  });
}

export async function probe(file: string, count = false, signal?: AbortSignal): Promise<Media> {
  return JSON.parse(await run("ffprobe", ["-v", "error", ...(count ? ["-count_frames"] : []),
    "-show_streams", "-show_format", "-of", "json", file], signal));
}

function videoStream(media: Media): Stream {
  const stream = media.streams.find(s => s.codec_type === "video" && !s.disposition?.attached_pic);
  if (!stream) throw new Error("素材没有可播放的视频流");
  return stream;
}

function displaySize(stream: Stream): Size {
  const rotation = Math.abs(stream.side_data_list?.find(s => s.rotation !== undefined)?.rotation ?? 0);
  const width = stream.width ?? 0;
  const height = stream.height ?? 0;
  return rotation % 180 === 90 ? { width: height, height: width } : { width, height };
}

function displayRatio(stream: Stream): number {
  const [n, d] = (stream.sample_aspect_ratio ?? "1:1").split(":").map(Number);
  const sar = n > 0 && d > 0 ? n / d : 1;
  const size = displaySize(stream);
  const rotation = Math.abs(stream.side_data_list?.find(s => s.rotation !== undefined)?.rotation ?? 0);
  return size.width / size.height * (rotation % 180 === 90 ? 1 / sar : sar);
}

function present(file: string): boolean {
  try { lstatSync(file); return true; } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw e;
  }
}

export function destination(options: Options): string {
  if (options.previewOnly) return resolve(options.previewOnly);
  if (options.output) return resolve(options.output);
  const stem = Array.from(basename(options.video, extname(options.video))).slice(0, 48).join("");
  const path = join(homedir(), "Downloads", `composited-${stem}.mp4`);
  if (!present(path)) return path;
  return path.slice(0, -4) + `-${Date.now()}.mp4`;
}

export function parseArgs(args: string[]): Options {
  const values = new Map<string, string>();
  const flags = new Set(["image", "video", "rect", "radius", "border", "fit", "output", "preview-only", "preview-time"]);
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, "");
    if (!args[i].startsWith("--") || !flags.has(key) || args[i + 1] === undefined ||
        !args[i + 1].trim() || args[i + 1].startsWith("--") || values.has(key)) throw new Error(`无效或重复参数：${args[i]}`);
    values.set(key, args[i + 1]);
  }
  for (const key of ["image", "video", "rect"]) {
    if (!values.get(key)) throw new Error(`缺少 --${key}`);
  }
  const fit = values.get("fit") ?? "strict";
  if (!["strict", "contain", "cover"].includes(fit)) throw new Error("--fit 仅支持 strict、contain、cover");
  const radius = Number(values.get("radius") ?? 0);
  const border = Number(values.get("border") ?? 1);
  const previewTime = Number(values.get("preview-time") ?? 0);
  if (!Number.isSafeInteger(radius) || radius < 0 || !Number.isSafeInteger(border) || border < 0 ||
      !Number.isFinite(previewTime) || previewTime < 0) throw new Error("圆角、边框或预览时间无效");
  if (values.has("output") && values.has("preview-only")) throw new Error("--output 与 --preview-only 不能同时使用");
  if (values.has("preview-time") && !values.has("preview-only")) throw new Error("--preview-time 仅用于预览");
  return {
    image: resolve(values.get("image")!), video: resolve(values.get("video")!),
    rect: parseRect(values.get("rect")!), radius, border, fit: fit as Fit,
    output: values.get("output"), previewOnly: values.get("preview-only"), previewTime,
  };
}

async function frameCount(file: string, stream: Stream, signal?: AbortSignal): Promise<number> {
  let count = Number(stream.nb_frames);
  if (!Number.isSafeInteger(count) || count < 1) {
    count = Number(videoStream(await probe(file, true, signal)).nb_read_frames);
  }
  if (!Number.isSafeInteger(count) || count < 1) throw new Error("无法确定源视频完整帧数");
  return count;
}

export async function audioHash(file: string, streamIndex: number, signal?: AbortSignal): Promise<string> {
  return (await run("ffmpeg", ["-v", "error", "-i", file, "-map", `0:${streamIndex}`,
    "-c", "copy", "-f", "hash", "-hash", "sha256", "-"], signal)).trim();
}

async function verify(source: Media, sourcePath: string, stage: string, canvas: Size,
    frames: number, signal?: AbortSignal): Promise<Media> {
  const result = await probe(stage, true, signal);
  const video = videoStream(result);
  if (video.width !== canvas.width || video.height !== canvas.height ||
      Number(video.nb_read_frames) !== frames) throw new Error("验收失败：画布尺寸或帧数改变");
  const originalVideo = videoStream(source);
  const originalDuration = Number(originalVideo.duration);
  const resultDuration = Number(video.duration);
  if (Number.isFinite(originalDuration) && Math.abs(resultDuration - originalDuration) > 0.05) {
    throw new Error("验收失败：视频时长改变");
  }
  const sourceAudio = source.streams.filter(s => s.codec_type === "audio");
  const outputAudio = result.streams.filter(s => s.codec_type === "audio");
  if (sourceAudio.length !== outputAudio.length) throw new Error("验收失败：音轨数量改变");
  for (let i = 0; i < sourceAudio.length; i++) {
    if (await audioHash(sourcePath, sourceAudio[i].index, signal) !==
        await audioHash(stage, outputAudio[i].index, signal)) throw new Error("验收失败：原声音轨被截断或改写");
  }
  await run("ffmpeg", ["-v", "error", "-xerror", "-i", stage, "-map", "0", "-f", "null", "-"], signal);
  return result;
}

export async function composite(options: Options, signal?: AbortSignal): Promise<Record<string, unknown>> {
  for (const file of [options.image, options.video]) {
    if (!existsSync(file)) throw new Error(`素材不存在：${file}`);
  }
  const output = destination(options);
  const extension = options.previewOnly ? ".png" : ".mp4";
  if (extname(output).toLowerCase() !== extension) throw new Error(`输出扩展名必须是 ${extension}`);
  if (present(output)) throw new Error(`不覆盖已有文件：${output}`);
  const image = videoStream(await probe(options.image, false, signal));
  const source = await probe(options.video, false, signal);
  const video = videoStream(source);
  const canvas = displaySize(image);
  validateGeometry(canvas, options.rect, options.radius, options.border);
  const scale = scaleFilter(options.rect, options.fit, displayRatio(video));
  if (!options.previewOnly && (canvas.width % 2 || canvas.height % 2)) {
    throw new Error("H.264 yuv420p 需要偶数画布；先确认补白方案，不自动裁切截图");
  }
  // === 暂不猜测独立音画偏移；拒绝会静默改变同步关系的素材 ===
  const audio = source.streams.filter(s => s.codec_type === "audio");
  if (audio.some(s => Math.abs(Number(s.start_time ?? 0) - Number(video.start_time ?? 0)) > 0.05)) {
    throw new Error("素材存在独立音画时间偏移；先校准同步关系再合成");
  }
  const duration = Number(video.duration ?? source.format?.duration);
  if (options.previewOnly && options.previewTime >= duration) throw new Error("预览时间超出视频时长");
  mkdirSync(dirname(output), { recursive: true });
  const temporary = mkdtempSync(join(dirname(output), ".daftai-video-compositor-"));
  try {
    const mask = join(temporary, "mask.pgm");
    const foreground = join(temporary, "foreground.png");
    writeFileSync(mask, foregroundMask(canvas, options.rect, options.radius, options.border));
    await run("ffmpeg", ["-v", "error", "-y", "-i", options.image, "-i", mask,
      "-filter_complex", "[0:v]format=rgb24[image];[image][1:v]alphamerge,format=rgba[out]",
      "-map", "[out]", "-frames:v", "1", foreground], signal);
    const { x, y } = options.rect;
    // === RGB 合成避免奇数坐标被 YUV 色度采样取整 ===
    const filter = `[0:${video.index}]setpts=PTS-STARTPTS,${scale},format=rgba,` +
      `pad=${canvas.width}:${canvas.height}:${x}:${y}:color=white[placed];` +
      "[placed][1:v]overlay=0:0:shortest=0:format=auto[out]";
    const stage = join(temporary, `complete${extension}`);
    if (options.previewOnly) {
      await run("ffmpeg", ["-v", "error", "-y", "-ss", String(options.previewTime),
        "-i", options.video, "-i", foreground, "-filter_complex", filter,
        "-map", "[out]", "-frames:v", "1", stage], signal);
      if (!existsSync(stage)) throw new Error("预览未生成：检查时间位置");
      signal?.throwIfAborted();
      linkSync(stage, output);
      return { output, preview: true, canvas, rect: options.rect };
    }
    const frames = await frameCount(options.video, video, signal);
    const encoded = join(temporary, "video-only.mp4");
    await run("ffmpeg", ["-v", "error", "-y", "-i", options.video,
      "-loop", "1", "-framerate", "30", "-i", foreground, "-filter_complex", filter,
      "-map", "[out]", "-an", "-c:v", "libx264", "-preset", "fast", "-crf", "17",
      "-pix_fmt", "yuv420p", "-fps_mode", "passthrough", "-enc_time_base:v", video.time_base ?? "0",
      "-frames:v", String(frames), encoded], signal);
    // === 限制帧数只作用于编码；独立封装完整原声，禁用 -shortest ===
    await run("ffmpeg", ["-v", "error", "-y", "-i", encoded, "-i", options.video,
      "-map", "0:v:0", "-map", "1:a?", "-c", "copy", "-movflags", "+faststart", stage], signal);
    const verified = await verify(source, options.video, stage, canvas, frames, signal);
    // === 同盘硬链接原子发布；目标被其他进程创建时拒绝覆盖 ===
    signal?.throwIfAborted();
    linkSync(stage, output);
    return { output, canvas, rect: options.rect, frames,
      duration: Number(verified.format?.duration), audioTracks: audio.length, audioUnchanged: true };
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

if (import.meta.main) {
  if (process.argv.includes("--help")) {
    process.stdout.write("Usage: bun scripts/composite.ts --image IMAGE --video VIDEO --rect x,y,w,h\n" +
      "  [--radius 0] [--border 1] [--fit strict|contain|cover] [--output OUTPUT.mp4]\n" +
      "  [--preview-only PREVIEW.png --preview-time 0]\n" +
      "默认输出 Downloads；拒绝覆盖；临时文件自动删除。\n");
  } else {
    const controller = new AbortController();
    const stop = () => controller.abort();
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
    try {
      const result = await composite(parseArgs(process.argv.slice(2)), controller.signal);
      process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    } catch (error) {
      process.stderr.write((error instanceof Error ? error.message : String(error)) + "\n");
      process.exitCode = controller.signal.aborted ? 130 : 1;
    } finally {
      process.removeListener("SIGINT", stop);
      process.removeListener("SIGTERM", stop);
    }
  }
}
