# Changelog

## [2.0.0] - 2026-02-24

### 💥 Skill 重命名 / Skill Renamed (BREAKING)

**中文**

Skill 从 `daftai-local-video-subtitler` 重命名为 `daftai-video-subtitler`，去掉多余的 `local`。

#### ⚠️ 破坏性变更

已有的 EXTEND.md 偏好文件路径变更：

```diff
- .daftAI-skills/daftAI-local-video-subtitler/EXTEND.md
+ .daftAI-skills/daftAI-video-subtitler/EXTEND.md

- ~/.daftAI-skills/daftAI-local-video-subtitler/EXTEND.md
+ ~/.daftAI-skills/daftAI-video-subtitler/EXTEND.md
```

需手动重命名目录，否则会触发首次设置流程。

---

**English**

Skill renamed from `daftai-local-video-subtitler` to `daftai-video-subtitler`, removing redundant `local`.

#### ⚠️ Breaking Changes

EXTEND.md preference file paths changed:

```diff
- .daftAI-skills/daftAI-local-video-subtitler/EXTEND.md
+ .daftAI-skills/daftAI-video-subtitler/EXTEND.md

- ~/.daftAI-skills/daftAI-local-video-subtitler/EXTEND.md
+ ~/.daftAI-skills/daftAI-video-subtitler/EXTEND.md
```

Existing directories must be renamed manually, or the first-time setup will be triggered.

---

## [1.2.0] - 2026-02-24

### 🎛️ CLI 支持全部参数 / CLI Supports All Options

**中文**

`burn_subtitles.ts` CLI 入口从纯位置参数改为支持 `--` 命名参数，覆盖所有烧录选项（水印、来源标注、字体、编码等）。之前水印等参数只能通过代码调用，每次都需要写临时脚本。

#### 变更内容

- `burn_subtitles.ts` — CLI 新增 `--watermark-text`、`--watermark-position`、`--watermark-opacity`、`--source-text`、`--source-position`、`--source-opacity`、`--font-size`、`--outline`、`--margin-v`、`--crf` 等命名参数
- `SKILL.md` Step 5 — 更新调用示例，标注所有可用 `--` 参数

#### 调用方式变更

```diff
- npx tsx burn_subtitles.ts <视频> <字幕> <输出> [字号] [描边] [边距]
+ npx tsx burn_subtitles.ts <视频> <字幕> <输出> [--font-size 24] [--watermark-text "daftAI"] [--watermark-position top-left] ...
```

- `SKILL.md` Step 6 — 明确中间文件（翻译字幕、合并字幕）保留到 output 目录，不删除

---

**English**

`burn_subtitles.ts` CLI entry now supports named `--` arguments for all burn options (watermark, source label, font, encoding, etc.). Previously, watermark and other advanced options were only accessible via programmatic API, requiring a temporary wrapper script each time.

#### Changes

- `burn_subtitles.ts` — CLI now accepts `--watermark-text`, `--watermark-position`, `--watermark-opacity`, `--source-text`, `--source-position`, `--source-opacity`, `--font-size`, `--outline`, `--margin-v`, `--crf` named arguments
- `SKILL.md` Step 5 — Updated invocation examples with all available `--` options

#### Command Changes

```diff
- npx tsx burn_subtitles.ts <video> <subtitle> <output> [fontSize] [outline] [marginV]
+ npx tsx burn_subtitles.ts <video> <subtitle> <output> [--font-size 24] [--watermark-text "daftAI"] [--watermark-position top-left] ...
```

- `SKILL.md` Step 6 — Intermediate files (translated subtitles, merged bilingual subtitles) are now kept in the output directory, not deleted

---

## [1.1.0] - 2026-02-22

### 🔄 Python → TypeScript 全量迁移 / Full Migration from Python to TypeScript

**中文**

所有脚本从 Python 全量迁移至 TypeScript，运行方式从 `python3` 改为 `npx tsx`。

#### 变更内容

- `utils.py` → `utils.ts` — 通用工具函数（时间转换、文件名清理、文件大小格式化等）
- `detect_language.py` → `detect_language.ts` — 字幕语言检测（文件名 + 内容识别）
- `convert_vtt_to_srt.py` → `convert_vtt_to_srt.ts` — VTT 转 SRT 格式转换
- `merge_bilingual_subtitles.py` → `merge_bilingual_subtitles.ts` — 双语字幕合并
- `burn_subtitles.py` → `burn_subtitles.ts` — 字幕烧录主脚本（FFmpeg 调用、字体检测、水印/来源标注）

#### 技术说明

- 仅使用 Node.js 内置模块（`fs`、`path`、`child_process`、`os`），无需额外 npm 依赖
- 通过 `npx tsx` 直接运行 TypeScript，无需编译步骤
- FFmpeg 仍为外部依赖，不受影响
- 所有功能、参数、默认值与 Python 版本完全一致

#### 运行方式变更

```diff
- python3 scripts/burn_subtitles.py <video> <subtitle> <output>
+ npx tsx scripts/burn_subtitles.ts <video> <subtitle> <output>

- python3 scripts/convert_vtt_to_srt.py <input.vtt> <output.srt>
+ npx tsx scripts/convert_vtt_to_srt.ts <input.vtt> <output.srt>

- python3 scripts/merge_bilingual_subtitles.py <top> <bottom> <output>
+ npx tsx scripts/merge_bilingual_subtitles.ts <top> <bottom> <output>
```

---

**English**

All scripts fully migrated from Python to TypeScript. Runtime changed from `python3` to `npx tsx`.

#### Changes

- `utils.py` → `utils.ts` — Utility functions (time conversion, filename sanitization, file size formatting, etc.)
- `detect_language.py` → `detect_language.ts` — Subtitle language detection (filename + content analysis)
- `convert_vtt_to_srt.py` → `convert_vtt_to_srt.ts` — VTT to SRT format conversion
- `merge_bilingual_subtitles.py` → `merge_bilingual_subtitles.ts` — Bilingual subtitle merging
- `burn_subtitles.py` → `burn_subtitles.ts` — Main subtitle burning script (FFmpeg invocation, font detection, watermark/source label)

#### Technical Notes

- Uses only Node.js built-in modules (`fs`, `path`, `child_process`, `os`) — no additional npm dependencies required
- Runs TypeScript directly via `npx tsx` — no compilation step needed
- FFmpeg remains an external dependency, unaffected by this change
- All features, parameters, and defaults are identical to the Python version

#### Command Changes

```diff
- python3 scripts/burn_subtitles.py <video> <subtitle> <output>
+ npx tsx scripts/burn_subtitles.ts <video> <subtitle> <output>

- python3 scripts/convert_vtt_to_srt.py <input.vtt> <output.srt>
+ npx tsx scripts/convert_vtt_to_srt.ts <input.vtt> <output.srt>

- python3 scripts/merge_bilingual_subtitles.py <top> <bottom> <output>
+ npx tsx scripts/merge_bilingual_subtitles.ts <top> <bottom> <output>
```
