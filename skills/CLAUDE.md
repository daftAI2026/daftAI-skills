# skills/
> L2 | 父级: ../CLAUDE.md

模块入口

- `daftai-video-subtitler/SKILL.md`: 本地视频字幕烧录入口，编排翻译、合并与 FFmpeg 输出。
- `daftai-subtitle-translator/SKILL.md`: 字幕翻译入口，保持术语、时间戳与条目数量一致。
- `daftai-extracting-video-subtitles/SKILL.md`: Whisper 字幕提取入口，从本地音视频输出 SRT。
- `daftai-url-to-markdown/SKILL.md`: Chrome CDP 网页捕获入口，保存正文与配套图片。
- `daftai-chinese-copywriting/SKILL.md`: autocorrect 排版入口，区分只读检查与文件修正。
- `daftai-image-to-svg/SKILL.md`: 单色位图描摹入口，交付经过误差验证的纯路径 SVG。
- `daftai-gpt-image-2-5-prompt-optimizer/SKILL.md`: 提示词优化入口，首次抓取完整 2.5 官方参考，之后复用忽略提交的本地缓存，不生图。

分类注册由 `../.claude-plugin/marketplace.json` 维护；各技能独立加载，局部成员由对应模块地图描述。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
