# daftai-video-compositor/
> L2 | 父级: ../CLAUDE.md

成员清单

- `SKILL.md`: 定义截图像素定位、预览验收与成品交付边界。
- `agents/openai.yaml`: Codex 展示名称与调用提示。
- `agents/CLAUDE.md`: Codex 元数据地图。
- `scripts/CLAUDE.md`: 执行层与几何层地图。
- `scripts/geometry.ts`: 校验窗口并生成抗锯齿前景遮罩。
- `scripts/composite.ts`: 编排预览、编码、独立音轨封装与验收。
- `scripts/composite.test.ts`: 验证像素、尾帧、音轨与临时文件清理。

依赖边界

技能先确定窗口，再调用执行入口。
几何层不读文件，不依赖 FFmpeg。
执行层只依赖 Node 内建模块与 FFmpeg。
FFprobe 验证完整帧数与尺寸。
音轨哈希验证原声未截断。
只有验收通过的成品进入目标路径。
临时文件在成功、失败和可捕获中断后删除。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
