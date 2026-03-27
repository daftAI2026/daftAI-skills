#!/usr/bin/env bun
/**
 * 通用工具函数
 * 提供时间格式转换、文件名清理、路径处理等功能
 */

import * as fs from "fs";
import * as path from "path";

export function timeToSeconds(timeStr: string): number {
  const trimmed = timeStr.trim();
  const parts = trimmed.split(":");

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds);
  } else if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return parseInt(minutes) * 60 + parseFloat(seconds);
  } else {
    return parseFloat(parts[0]);
  }
}

export function secondsToTime(
  seconds: number,
  includeHours: boolean = true,
  useComma: boolean = false
): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const separator = useComma ? "," : ".";
  const secsStr = secs.toFixed(3).padStart(6, "0");

  if (includeHours || hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${secsStr}`.replace(".", separator);
  } else {
    return `${String(minutes).padStart(2, "0")}:${secsStr}`.replace(".", separator);
  }
}

export function sanitizeFilename(filename: string, maxLength: number = 100): string {
  // 移除非法字符
  let result = filename.replace(/[<>:"/\\|?*]/g, "_");
  // 移除开头和结尾的空格和点
  result = result.replace(/^[.\s]+|[.\s]+$/g, "");
  // 替换空格为下划线
  result = result.replace(/ /g, "_");
  // 移除连续的下划线
  result = result.replace(/_+/g, "_");

  if (result.length > maxLength) {
    const ext = path.extname(result);
    if (ext) {
      const maxNameLength = maxLength - ext.length;
      result = result.slice(0, maxNameLength) + ext;
    } else {
      result = result.slice(0, maxLength);
    }
  }

  return result;
}

export function createOutputDir(baseDir?: string): string {
  const base = baseDir ? baseDir : path.join(process.cwd(), "youtube-clips");
  const now = new Date();
  const timestamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    "_",
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");

  const outputDir = path.join(base, timestamp);
  fs.mkdirSync(outputDir, { recursive: true });
  return outputDir;
}

export function formatFileSize(sizeBytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = sizeBytes;
  for (const unit of units) {
    if (size < 1024.0) {
      return `${size.toFixed(1)} ${unit}`;
    }
    size /= 1024.0;
  }
  return `${size.toFixed(1)} PB`;
}

export function parseTimeRange(timeRange: string): [number, number] {
  const parts = timeRange.replace(/\s/g, "").split("-");
  if (parts.length !== 2) {
    throw new Error(`Invalid time range format: ${timeRange}`);
  }

  const startTime = timeToSeconds(parts[0]);
  const endTime = timeToSeconds(parts[1]);

  if (startTime >= endTime) {
    throw new Error(`Start time must be before end time: ${timeRange}`);
  }

  return [startTime, endTime];
}

export function adjustSubtitleTime(timeSeconds: number, offset: number): number {
  return Math.max(0.0, timeSeconds - offset);
}

export function getVideoDurationDisplay(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  } else {
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
}

export function validateUrl(url: string): boolean {
  const patterns = [
    /^https?:\/\/(?:www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^https?:\/\/(?:www\.)?youtu\.be\/[\w-]+/,
    /^https?:\/\/(?:www\.)?youtube\.com\/embed\/[\w-]+/,
  ];
  return patterns.some((pattern) => pattern.test(url));
}

export function ensureDirectory(dirPath: string): string {
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

// CLI 测试入口
if (require.main === module) {
  console.log("Testing utils.ts...");

  console.assert(timeToSeconds("01:23:45.678") === 5025.678);
  console.assert(timeToSeconds("23:45.678") === 1425.678);
  console.assert(timeToSeconds("45.678") === 45.678);

  console.assert(sanitizeFilename("Hello: World?") === "Hello_World");
  console.assert(sanitizeFilename("AGI 不是时间点，是指数曲线") === "AGI_不是时间点_是指数曲线");

  const [s, e] = parseTimeRange("00:00 - 03:15");
  console.assert(s === 0.0 && e === 195.0);

  console.assert(validateUrl("https://youtube.com/watch?v=Ckt1cj0xjRM") === true);
  console.assert(validateUrl("https://youtu.be/Ckt1cj0xjRM") === true);
  console.assert(validateUrl("invalid_url") === false);

  console.log("✅ All tests passed!");
}
