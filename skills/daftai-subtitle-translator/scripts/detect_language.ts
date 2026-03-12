#!/usr/bin/env npx tsx
/**
 * 检测字幕文件的语言
 * 支持从文件名和内容检测
 */

import * as fs from "fs";
import * as path from "path";

const LANGUAGE_CODES: Record<string, string> = {
  zh: "中文",
  en: "英文",
  ja: "日文",
  ko: "韩文",
  fr: "法文",
  de: "德文",
  es: "西班牙文",
  pt: "葡萄牙文",
  ru: "俄文",
  ar: "阿拉伯文",
};

function detectFromFilename(filename: string): string | null {
  const lower = filename.toLowerCase();

  const patterns: Record<string, RegExp[]> = {
    zh: [/[._-]zh[._-]?/, /[._-]chs[._-]?/, /[._-]cht[._-]?/, /chinese/, /中文/],
    en: [/[._-]en[._-]?/, /[._-]eng[._-]?/, /english/, /英文/],
    ja: [/[._-]ja[._-]?/, /[._-]jp[._-]?/, /[._-]jpn[._-]?/, /japanese/, /日文/],
    ko: [/[._-]ko[._-]?/, /[._-]kor[._-]?/, /korean/, /韩文/],
    fr: [/[._-]fr[._-]?/, /[._-]fra[._-]?/, /french/, /法文/],
    de: [/[._-]de[._-]?/, /[._-]deu[._-]?/, /german/, /德文/],
    es: [/[._-]es[._-]?/, /[._-]spa[._-]?/, /spanish/, /西班牙文/],
  };

  for (const [langCode, langPatterns] of Object.entries(patterns)) {
    for (const pattern of langPatterns) {
      if (pattern.test(lower)) {
        return langCode;
      }
    }
  }

  return null;
}

function detectFromContent(content: string, sampleSize: number = 1000): string | null {
  let sample = content.slice(0, sampleSize);

  // 移除时间戳和数字
  sample = sample.replace(/\d+:\d+:\d+[,.]\d+/g, "");
  sample = sample.replace(/^\d+$/gm, "");
  sample = sample.replace(/-->/g, "");

  const chineseChars = (sample.match(/[\u4e00-\u9fff]/g) || []).length;
  const japaneseChars = (sample.match(/[\u3040-\u309f\u30a0-\u30ff]/g) || []).length;
  const koreanChars = (sample.match(/[\uac00-\ud7af]/g) || []).length;
  const latinChars = (sample.match(/[a-zA-Z]/g) || []).length;

  const totalChars = chineseChars + japaneseChars + koreanChars + latinChars;

  if (totalChars === 0) return null;

  if (chineseChars / totalChars > 0.3) return "zh";
  if (japaneseChars / totalChars > 0.1) return "ja";
  if (koreanChars / totalChars > 0.3) return "ko";
  if (latinChars / totalChars > 0.5) return "en";

  return null;
}

export function detectLanguage(filePath: string): string {
  const filename = path.basename(filePath);
  console.log(`🔍 检测语言: ${filename}`);

  // 1. 先从文件名检测
  const langFromName = detectFromFilename(filename);
  if (langFromName) {
    console.log(`   从文件名检测: ${langFromName} (${LANGUAGE_CODES[langFromName] || langFromName})`);
    return langFromName;
  }

  // 2. 从内容检测
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const langFromContent = detectFromContent(content);
    if (langFromContent) {
      console.log(`   从内容检测: ${langFromContent} (${LANGUAGE_CODES[langFromContent] || langFromContent})`);
      return langFromContent;
    }
  } catch (e: any) {
    console.log(`   读取文件失败: ${e.message}`);
  }

  // 3. 默认返回未知
  console.log(`   无法检测，默认: unknown`);
  return "unknown";
}

// CLI 入口
if (require.main === module) {
  if (process.argv.length < 3) {
    console.log("用法: npx tsx detect_language.ts <字幕文件>");
    process.exit(1);
  }

  const filePath = process.argv[2];
  const lang = detectLanguage(filePath);
  console.log(`\n语言代码: ${lang}`);
}
