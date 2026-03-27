#!/usr/bin/env bun
/**
 * 合并中文和英文字幕为双语 SRT 文件
 * 中文在上，英文在下
 */

import * as fs from "fs";
import * as path from "path";

interface Subtitle {
  index: string;
  time: string;
  text: string;
}

function parseSrtFile(filePath: string): Subtitle[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const blocks = content.trim().split("\n\n");
  const subtitles: Subtitle[] = [];

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length >= 3) {
      subtitles.push({
        index: lines[0],
        time: lines[1],
        text: lines.slice(2).join("\n"),
      });
    }
  }

  return subtitles;
}

export function mergeBilingualSubtitles(
  primaryFile: string,
  secondaryFile: string,
  outputFile: string,
  primaryOnTop: boolean = true
): string {
  const primaryName = path.basename(primaryFile);
  const secondaryName = path.basename(secondaryFile);

  console.log(`📝 合并双语字幕...`);
  console.log(`   上方字幕: ${primaryName}`);
  console.log(`   下方字幕: ${secondaryName}`);

  const primarySubs = parseSrtFile(primaryFile);
  const secondarySubs = parseSrtFile(secondaryFile);

  if (primarySubs.length !== secondarySubs.length) {
    console.log(`⚠️  警告: 字幕数量不匹配 (${primarySubs.length} vs ${secondarySubs.length})`);
  }

  const bilingualSubs: Subtitle[] = [];
  const count = Math.min(primarySubs.length, secondarySubs.length);

  for (let i = 0; i < count; i++) {
    const combinedText = primaryOnTop
      ? `${primarySubs[i].text}\n${secondarySubs[i].text}`
      : `${secondarySubs[i].text}\n${primarySubs[i].text}`;

    bilingualSubs.push({
      index: primarySubs[i].index,
      time: primarySubs[i].time,
      text: combinedText,
    });
  }

  // 写入双语字幕文件
  const outputDir = path.dirname(outputFile);
  fs.mkdirSync(outputDir, { recursive: true });

  const output = bilingualSubs
    .map((sub) => `${sub.index}\n${sub.time}\n${sub.text}\n`)
    .join("\n");
  fs.writeFileSync(outputFile, output, "utf-8");

  console.log(`✅ 双语字幕生成完成`);
  console.log(`   输出文件: ${outputFile}`);
  console.log(`   字幕条数: ${bilingualSubs.length}`);

  return outputFile;
}

// CLI 入口
if (require.main === module) {
  if (process.argv.length < 5) {
    console.log("用法: bun merge_bilingual_subtitles.ts <上方字幕> <下方字幕> <输出文件>");
    console.log("\n示例（中文在上，英文在下）:");
    console.log("  bun merge_bilingual_subtitles.ts subtitles_zh.srt subtitles_en.srt bilingual.srt");
    process.exit(1);
  }

  const primaryFile = process.argv[2];
  const secondaryFile = process.argv[3];
  const outputFile = process.argv[4];

  mergeBilingualSubtitles(primaryFile, secondaryFile, outputFile);
}
