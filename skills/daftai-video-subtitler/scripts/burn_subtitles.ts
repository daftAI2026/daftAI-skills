#!/usr/bin/env bun
/**
 * 烧录字幕到视频
 * 支持字体检测、自动回退、H.264 编码
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { execFileSync, execSync } from "child_process";
import { formatFileSize } from "./utils";

// 默认参数
const DEFAULT_FONT_SIZE = 21;
const DEFAULT_OUTLINE = 0.75;
const DEFAULT_MARGIN_V = 15;
const DEFAULT_CRF = 18;

// 水印默认参数
const DEFAULT_WATERMARK_OPACITY = 0.7;
const DEFAULT_WATERMARK_FONTSIZE_RATIO = 0.025;

// 素材来源默认参数
const DEFAULT_SOURCE_OPACITY = 0.7;
const DEFAULT_SOURCE_FONTSIZE_RATIO = 0.025;

// 字体优先级
const FONT_PRIORITY = [
  "Alibaba PuHuiTi 3.0",
  "Alibaba PuHuiTi 3.0 55 Regular",
  "AlibabaPuHuiTi-3-55-Regular",
  "Noto Sans CJK SC",
  "Noto Sans CJK",
  "PingFang SC",
  "Hiragino Sans GB",
  "Microsoft YaHei",
];

function which(cmd: string): string | null {
  try {
    return execSync(`which ${cmd}`, { encoding: "utf-8" }).trim() || null;
  } catch {
    return null;
  }
}

function getVideoHeight(videoPath: string, ffprobePath?: string | null): number {
  const probe = ffprobePath ?? which("ffprobe");
  if (!probe) return 1080;
  try {
    const result = execFileSync(probe, [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=height",
      "-of", "csv=p=0",
      videoPath,
    ], { encoding: "utf-8", timeout: 10000 });
    return parseInt(result.trim()) || 1080;
  } catch {
    return 1080;
  }
}

function detectAvailableFont(): string {
  console.log("🔍 检测可用字体...");

  if (os.platform() === "darwin") {
    const fontDirs = [
      path.join(os.homedir(), "Library/Fonts"),
      "/Library/Fonts",
      "/System/Library/Fonts",
    ];

    for (const fontName of FONT_PRIORITY) {
      for (const fontDir of fontDirs) {
        if (!fs.existsSync(fontDir)) continue;

        if (fontName.toLowerCase().includes("alibaba")) {
          try {
            const entries = fs.readdirSync(fontDir);
            if (entries.some((e) => e.toLowerCase().includes("alibaba"))) {
              console.log(`   找到字体: ${fontName}`);
              return "Alibaba PuHuiTi 3.0";
            }
          } catch { /* ignore */ }
        }

        if (fontName.includes("Noto")) {
          try {
            const entries = fs.readdirSync(fontDir);
            if (entries.some((e) => e.includes("Noto") && e.includes("CJK"))) {
              console.log(`   找到字体: ${fontName}`);
              return fontName;
            }
          } catch { /* ignore */ }
        }
      }
    }
  }

  const defaultFont = os.platform() === "darwin" ? "PingFang SC" : "sans-serif";
  console.log(`   使用系统默认字体: ${defaultFont}`);
  return defaultFont;
}

function checkLibassSupport(ffmpegPath: string): boolean {
  try {
    const result = execFileSync(ffmpegPath, ["-filters"], {
      encoding: "utf-8",
      timeout: 5000,
    });
    return result.toLowerCase().includes("subtitles");
  } catch {
    return false;
  }
}

function detectFfmpegVariant(): { path: string | null; hasLibass: boolean } {
  console.log("🔍 检测 FFmpeg 环境...");

  const standardPath = which("ffmpeg");
  if (standardPath) {
    const hasLibass = checkLibassSupport(standardPath);
    console.log(`   找到 FFmpeg: ${standardPath}`);
    console.log(`   libass 支持: ${hasLibass ? "✅ 是" : "❌ 否"}`);
    return { path: standardPath, hasLibass };
  }

  console.log("   ❌ 未找到 FFmpeg");
  return { path: null, hasLibass: false };
}

const SUPPORTED_SUBTITLE_EXTS = new Set([".srt", ".vtt", ".ass", ".ssa"]);

function getSubtitleExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase();
}

function isSupportedSubtitle(filePath: string): boolean {
  return SUPPORTED_SUBTITLE_EXTS.has(getSubtitleExtension(filePath));
}

function getDrawtextPosition(position: string, margin: number = 20): string {
  const positions: Record<string, string> = {
    "top-right": `x=w-tw-${margin}:y=${margin}`,
    "top-left": `x=${margin}:y=${margin}`,
    "bottom-right": `x=w-tw-${margin}:y=h-th-${margin}`,
    "bottom-left": `x=${margin}:y=h-th-${margin}`,
  };
  return positions[position] || positions["top-right"];
}

function buildDrawtextFilter(
  text: string,
  position: string,
  opacity: number,
  fontName: string,
  fontSize: number,
  margin: number = 20
): string {
  const pos = getDrawtextPosition(position, margin);
  const escapedText = text.replace(/'/g, "'\\''").replace(/:/g, "\\:");

  return (
    `drawtext=text='${escapedText}':` +
    `fontfile='':` +
    `font='${fontName}':` +
    `fontsize=${fontSize}:` +
    `fontcolor=white@${opacity}:` +
    pos
  );
}

export interface BurnSubtitlesOptions {
  videoPath: string;
  subtitlePath: string;
  outputPath: string;
  ffmpegPath?: string;
  fontName?: string;
  fontSize?: number;
  outline?: number;
  marginV?: number;
  crf?: number;
  watermarkText?: string;
  watermarkPosition?: string;
  watermarkOpacity?: number;
  sourceText?: string;
  sourcePosition?: string;
  sourceOpacity?: number;
}

export function burnSubtitles(opts: BurnSubtitlesOptions): string {
  const {
    videoPath,
    subtitlePath,
    outputPath,
    ffmpegPath: ffmpegPathOpt,
    fontName: fontNameOpt,
    fontSize = DEFAULT_FONT_SIZE,
    outline = DEFAULT_OUTLINE,
    marginV = DEFAULT_MARGIN_V,
    crf = DEFAULT_CRF,
    watermarkText,
    watermarkPosition = "top-right",
    watermarkOpacity = DEFAULT_WATERMARK_OPACITY,
    sourceText,
    sourcePosition = "top-left",
    sourceOpacity = DEFAULT_SOURCE_OPACITY,
  } = opts;

  // 验证输入文件
  if (!fs.existsSync(videoPath)) {
    throw new Error(`视频文件不存在: ${videoPath}`);
  }
  if (!fs.existsSync(subtitlePath)) {
    throw new Error(`字幕文件不存在: ${subtitlePath}`);
  }
  if (!isSupportedSubtitle(subtitlePath)) {
    throw new Error(`不支持的字幕格式: ${path.extname(subtitlePath)}（支持 .srt/.vtt/.ass/.ssa）`);
  }

  // 检测 FFmpeg
  let ffmpegPath = ffmpegPathOpt ?? null;
  if (!ffmpegPath) {
    const ffmpegInfo = detectFfmpegVariant();
    if (!ffmpegInfo.path) throw new Error("未找到 FFmpeg，请先安装");
    if (!ffmpegInfo.hasLibass) throw new Error("FFmpeg 不支持 libass，无法烧录字幕");
    ffmpegPath = ffmpegInfo.path;
  }

  // 检测字体
  const fontName = fontNameOpt ?? detectAvailableFont();

  console.log(`\n🎬 烧录字幕到视频...`);
  console.log(`   视频: ${path.basename(videoPath)}`);
  console.log(`   字幕: ${path.basename(subtitlePath)}`);
  console.log(`   输出: ${path.basename(outputPath)}`);
  console.log(`   字体: ${fontName}`);
  console.log(`   字号: ${fontSize}, 描边: ${outline}, 边距: ${marginV}`);

  // 创建临时目录
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "video_subtitler_"));
  console.log(`   临时目录: ${tempDir}`);

  try {
    const subtitleExt = getSubtitleExtension(subtitlePath);
    const tempVideo = path.join(tempDir, "video.mp4");
    const tempSubtitle = path.join(tempDir, `subtitle${subtitleExt}`);
    const tempOutput = path.join(tempDir, "output.mp4");

    console.log(`   复制文件...`);
    fs.copyFileSync(videoPath, tempVideo);
    fs.copyFileSync(subtitlePath, tempSubtitle);

    // 构建字幕滤镜
    const subtitleFilter =
      `subtitles=${tempSubtitle}:` +
      `force_style='FontName=${fontName},` +
      `FontSize=${fontSize},` +
      `PrimaryColour=&H00FFFFFF,` +
      `OutlineColour=&H00000000,` +
      `Outline=${outline},` +
      `MarginV=${marginV}'`;

    const vfFilters: string[] = [subtitleFilter];

    // 获取视频高度
    const videoHeight = getVideoHeight(videoPath);

    // 添加水印
    if (watermarkText) {
      const wmFontsize = Math.floor(videoHeight * DEFAULT_WATERMARK_FONTSIZE_RATIO);
      vfFilters.push(
        buildDrawtextFilter(watermarkText, watermarkPosition, watermarkOpacity, fontName, wmFontsize)
      );
      console.log(`   水印: '${watermarkText}' (${watermarkPosition}, 透明度 ${watermarkOpacity})`);
    }

    // 添加素材来源标注
    if (sourceText) {
      const srcFontsize = Math.floor(videoHeight * DEFAULT_SOURCE_FONTSIZE_RATIO);
      vfFilters.push(
        buildDrawtextFilter(sourceText, sourcePosition, sourceOpacity, fontName, srcFontsize)
      );
      console.log(`   来源: '${sourceText}' (${sourcePosition}, 透明度 ${sourceOpacity})`);
    }

    const combinedFilter = vfFilters.join(",");

    // 构建 FFmpeg 命令
    const cmd = [
      "-i", tempVideo,
      "-vf", combinedFilter,
      "-c:v", "libx264",
      "-crf", String(crf),
      "-preset", "medium",
      "-c:a", "copy",
      "-y",
      tempOutput,
    ];

    console.log(`   执行 FFmpeg...`);

    try {
      execFileSync(ffmpegPath, cmd, { encoding: "utf-8" });
    } catch (e: any) {
      const stderr = e.stderr || "";
      console.log(`\n❌ FFmpeg 执行失败:`);
      console.log(stderr.slice(-1000));
      throw new Error(`FFmpeg 失败，返回码: ${e.status}`);
    }

    if (!fs.existsSync(tempOutput)) {
      throw new Error("输出文件未创建");
    }

    // 移动到目标位置
    console.log(`   移动输出文件...`);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.renameSync(tempOutput, outputPath);

    const outputSize = fs.statSync(outputPath).size;
    console.log(`✅ 字幕烧录完成`);
    console.log(`   输出文件: ${outputPath}`);
    console.log(`   文件大小: ${formatFileSize(outputSize)}`);

    return outputPath;
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log(`   清理临时目录`);
    } catch { /* ignore */ }
  }
}

function parseCliArgs(argv: string[]): { positional: string[]; flags: Record<string, string> } {
  const positional: string[] = [];
  const flags: Record<string, string> = {};
  let i = 2; // skip node and script path
  while (i < argv.length) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
      flags[key] = value;
    } else {
      positional.push(argv[i]);
    }
    i++;
  }
  return { positional, flags };
}

// CLI 入口
if (require.main === module) {
  const { positional, flags } = parseCliArgs(process.argv);

  if (positional.length < 3 || flags["help"] || flags["h"]) {
    console.log(`用法: bun burn_subtitles.ts <视频> <字幕> <输出> [选项]`);
    console.log(`\n必填参数:`);
    console.log(`  视频   - 输入视频文件路径`);
    console.log(`  字幕   - 字幕文件路径（SRT/VTT/ASS/SSA）`);
    console.log(`  输出   - 输出视频文件路径`);
    console.log(`\n可选参数:`);
    console.log(`  --font-size <数字>           字体大小，默认 ${DEFAULT_FONT_SIZE}`);
    console.log(`  --outline <数字>             描边粗细，默认 ${DEFAULT_OUTLINE}`);
    console.log(`  --margin-v <数字>            底部边距，默认 ${DEFAULT_MARGIN_V}`);
    console.log(`  --crf <数字>                 编码质量，默认 ${DEFAULT_CRF}`);
    console.log(`  --watermark-text <文字>      水印文字`);
    console.log(`  --watermark-position <位置>  水印位置（top-left/top-right/bottom-left/bottom-right），默认 top-right`);
    console.log(`  --watermark-opacity <数字>   水印透明度 0-1，默认 ${DEFAULT_WATERMARK_OPACITY}`);
    console.log(`  --source-text <文字>         素材来源文字`);
    console.log(`  --source-position <位置>     来源位置，默认 top-left`);
    console.log(`  --source-opacity <数字>      来源透明度 0-1，默认 ${DEFAULT_SOURCE_OPACITY}`);
    console.log(`\n示例:`);
    console.log(`  bun burn_subtitles.ts video.mp4 subtitle.srt output.mp4`);
    console.log(`  bun burn_subtitles.ts video.mp4 subtitle.srt output.mp4 --font-size 24`);
    console.log(`  bun burn_subtitles.ts video.mp4 subtitle.srt output.mp4 --watermark-text "@daftAI" --watermark-position top-left`);
    process.exit(1);
  }

  const opts: BurnSubtitlesOptions = {
    videoPath: positional[0],
    subtitlePath: positional[1],
    outputPath: positional[2],
    fontSize: flags["font-size"] ? parseInt(flags["font-size"]) : DEFAULT_FONT_SIZE,
    outline: flags["outline"] ? parseFloat(flags["outline"]) : DEFAULT_OUTLINE,
    marginV: flags["margin-v"] ? parseInt(flags["margin-v"]) : DEFAULT_MARGIN_V,
    crf: flags["crf"] ? parseInt(flags["crf"]) : DEFAULT_CRF,
    watermarkText: flags["watermark-text"],
    watermarkPosition: flags["watermark-position"] ?? "top-right",
    watermarkOpacity: flags["watermark-opacity"] ? parseFloat(flags["watermark-opacity"]) : DEFAULT_WATERMARK_OPACITY,
    sourceText: flags["source-text"],
    sourcePosition: flags["source-position"] ?? "top-left",
    sourceOpacity: flags["source-opacity"] ? parseFloat(flags["source-opacity"]) : DEFAULT_SOURCE_OPACITY,
  };

  try {
    const resultPath = burnSubtitles(opts);
    console.log(`\n✨ 完成！输出文件: ${resultPath}`);
  } catch (e: any) {
    console.log(`\n❌ 错误: ${e.message}`);
    process.exit(1);
  }
}
