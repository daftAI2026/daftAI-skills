# daftAI-skills

[English](./README.md) | 中文

daftAI 分享的 AI Agent Skills，提升日常工作效率。

## 环境要求

- 已安装 Node.js 环境
- 能运行 `npx bun` 命令

## 安装

### 快速安装（推荐）

```bash
npx skills add daftAI2026/daftAI-skills
```

## 可用 Skills

| Skill | 描述 |
|-------|------|
| [daftai-cloudflare-billing-audit](skills/daftai-cloudflare-billing-audit/) | 只读、离线检查 Cloudflare 项目的账单风险，按产品加载案例依据；需要 Bun，平台保障与限制见技能说明。 |
| [daftai-video-compositor](skills/daftai-video-compositor/) | 把本地视频嵌进截图的精确矩形或圆角区域，保留版式和原音轨。需要 Bun、FFmpeg 和 FFprobe。 |
| [daftai-video-subtitler](skills/daftai-video-subtitler/) | 本地视频字幕烧录工具，支持 SRT/VTT/ASS 格式、双语字幕合并和翻译 |
| [daftai-subtitle-translator](skills/daftai-subtitle-translator/) | 字幕文件翻译（SRT/VTT），支持术语一致性检查 |
| [daftai-extracting-video-subtitles](skills/daftai-extracting-video-subtitles/) | 使用 OpenAI Whisper 从视频/音频文件中提取带时间戳的 SRT 字幕 |
| [daftai-url-to-markdown](skills/daftai-url-to-markdown/) | 通过 Chrome CDP 抓取网页并转换为 Markdown，自动下载图片 |
| [daftai-chinese-copywriting](skills/daftai-chinese-copywriting/) | 基于 autocorrect 检查和修正中文排版（标点、空格、全角/半角） |
| [daftai-chinese-technical-writing](skills/daftai-chinese-technical-writing/) | 基于阮一峰指南与 STE 启发的中文方法，撰写和审阅中文技术文档、产品文案与界面文案；格式检查联动格式 Skill |
| [daftai-image-to-svg](skills/daftai-image-to-svg/) | 将透明或纯色底单色 PNG/SVG 转换为经过误差量化的纯路径真矢量 SVG |
| [daftai-gpt-image-2-5-prompt-optimizer](skills/daftai-gpt-image-2-5-prompt-optimizer/) | 依据在线官方参考，将自然语言优化为 GPT Image 2.5 提示词；只输出文字，不生图 |

## 使用方式

每个 skill 都有独立的 `SKILL.md` 文件，包含详细的使用说明。AI 助手会在加载 skill 后自动按照指令执行。

### 示例：提取字幕

```
用户：帮我提取这个视频的字幕
→ AI 加载 daftai-extracting-video-subtitles skill
→ bun scripts/extract_subtitles.ts video.mp4 en
→ 输出：video.srt
```

### 示例：烧录字幕

```
用户：把这个视频加上中文字幕
→ AI 加载 daftai-video-subtitler skill
→ 检测环境 → 扫描字幕 → 烧录到视频
→ 输出：video_zh.mp4
```

### 示例：优化生图提示词

```text
用户：用 daftai-gpt-image-2-5-prompt-optimizer 优化：雨后巷子里的橘猫，水彩明信片，不要字。
→ 若 `references/gpt-image-2-5/` 已符合发布布局，则直接读本地索引；否则才抓取一次
→ 之后复用该本地官方参考；不需要生图 API Key
```

### 示例：中文技术写作与界面文案

```text
用户：把这份中文 README 改得步骤清楚，再检查格式。
→ 加载 daftai-chinese-technical-writing 与所需的本地 references
→ 保留命令、事实和限制，调整结构与措辞
→ 联动 daftai-chinese-copywriting，以 review 模式检查格式
```

写作 Skill 本身不需要运行时或偏好设置。可选的自动格式检查需要单独安装 `daftai-chinese-copywriting`、Bun 和 autocorrect。

操作说明、工具描述、Agent 指令和状态消息按需采用 STE 启发的中文方法，保留条件、权限与失败分支；不提供 ASD-STE100 合规结论。

格式 Skill 优先读取 `EXTEND.json`，新设置保存为 JSON；旧 `EXTEND.md` 继续兼容，不会自动迁移。

## 项目结构

```
daftAI-skills/
├── README.md             # 英文说明
├── README.zh.md          # 中文说明
├── CHANGELOG.md          # 英文变更日志
├── CHANGELOG.zh.md       # 中文变更日志
├── AGENTS.md             # AI 助手指南
├── .gitignore
└── skills/
    ├── daftai-video-compositor/
    │   ├── SKILL.md
    │   ├── agents/           # Codex 元数据
    │   └── scripts/          # TypeScript 合成器、遮罩与测试
    ├── daftai-video-subtitler/
    │   ├── SKILL.md
    │   ├── scripts/          # TypeScript 工具脚本
    │   └── references/       # 配置文档
    ├── daftai-subtitle-translator/
    │   ├── SKILL.md
    │   └── references/       # 术语表
    ├── daftai-extracting-video-subtitles/
    │   ├── SKILL.md
    │   └── scripts/          # TypeScript 工具脚本
    ├── daftai-url-to-markdown/
    │   ├── SKILL.md
    │   └── scripts/          # TypeScript 工具脚本
    ├── daftai-chinese-copywriting/
    │   ├── SKILL.md
    │   ├── scripts/          # TypeScript 工具脚本
    │   └── references/       # 配置文档
    ├── daftai-chinese-technical-writing/
    │   ├── SKILL.md
    │   └── references/       # 六份原文、受控中文方法与产品/界面扩展
    ├── daftai-image-to-svg/
    │   ├── SKILL.md
    │   ├── agents/           # Codex 元数据
    │   └── scripts/          # TypeScript 转换器与测试
    └── daftai-gpt-image-2-5-prompt-optimizer/
        ├── SKILL.md
        ├── agents/           # Codex 元数据
        ├── scripts/          # 轻量 TypeScript 抓取器与测试
        └── references/       # 来源规则、本地官方参考布局与原创验收场景
```

## 贡献

欢迎提交 Issue 和 Pull Request。

## 许可证

MIT License
