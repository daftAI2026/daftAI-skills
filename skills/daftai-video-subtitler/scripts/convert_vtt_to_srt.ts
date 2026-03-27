#!/usr/bin/env bun
/**
 * 将 VTT 字幕转换为 SRT 格式
 */

import * as fs from "fs";
import * as path from "path";

export function vttToSrt(vttPath: string, srtPath: string): string {
  if (!fs.existsSync(vttPath)) {
    throw new Error(`VTT file not found: ${vttPath}`);
  }

  console.log(`🔄 转换 VTT → SRT...`);
  console.log(`   输入: ${vttPath}`);
  console.log(`   输出: ${srtPath}`);

  const content = fs.readFileSync(vttPath, "utf-8");
  const blocks = content.trim().split("\n\n");

  const srtBlocks: string[] = [];
  let index = 1;

  for (const block of blocks) {
    const lines = block.trim().split("\n");

    // 跳过 WEBVTT 头部和元数据
    if (lines.some((line) => /^(WEBVTT|Kind:|Language:|X-TIMESTAMP)/.test(line))) {
      continue;
    }

    // 查找时间戳
    let timestampLine: string | null = null;
    let timestampIdx = -1;

    for (let idx = 0; idx < lines.length; idx++) {
      if (lines[idx].includes("-->")) {
        timestampLine = lines[idx];
        timestampIdx = idx;
        break;
      }
    }

    if (timestampLine === null) continue;

    // 获取文本（时间戳之后的所有行）
    const textLines: string[] = [];
    for (let i = timestampIdx + 1; i < lines.length; i++) {
      const cleanLine = lines[i].replace(/<[^>]+>/g, "").trim();
      if (cleanLine) {
        textLines.push(cleanLine);
      }
    }

    if (textLines.length === 0) continue;

    // 转换时间戳格式
    // VTT: 00:00:00.000 --> 00:00:03.500
    // SRT: 00:00:00,000 --> 00:00:03,500
    let srtTimestamp = timestampLine.replace(
      /\s+(align|position|line|size|vertical):\S+/g,
      ""
    );
    srtTimestamp = srtTimestamp.replace(/\./g, ",").trim();

    srtBlocks.push(`${index}\n${srtTimestamp}\n${textLines.join("\n")}`);
    index++;
  }

  // 写入 SRT 文件
  const srtDir = path.dirname(srtPath);
  fs.mkdirSync(srtDir, { recursive: true });
  fs.writeFileSync(srtPath, srtBlocks.join("\n\n") + "\n", "utf-8");

  console.log(`✅ 转换完成，共 ${index - 1} 条字幕`);
  return srtPath;
}

// CLI 入口
if (require.main === module) {
  if (process.argv.length < 4) {
    console.log("用法: bun convert_vtt_to_srt.ts <input.vtt> <output.srt>");
    process.exit(1);
  }

  const vttPath = process.argv[2];
  const srtPath = process.argv[3];

  try {
    const result = vttToSrt(vttPath, srtPath);
    console.log(`\n✨ 完成！输出文件: ${result}`);
  } catch (e: any) {
    console.log(`\n❌ 错误: ${e.message}`);
    process.exit(1);
  }
}
