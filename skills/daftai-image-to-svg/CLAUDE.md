# daftai-image-to-svg/
> L2 | 父级: ../../CLAUDE.md

成员清单

- `SKILL.md`: 定义透明或纯色底单色图像转真矢量 SVG 的触发范围、单文件/批量输出契约、IoU/MAE 目标、依赖、工作流与验收门。
- `agents/openai.yaml`: 提供 Codex 技能列表的名称、摘要与默认调用提示。
- `scripts/background.ts`: 检测纯色背景、估计前景色并重建 Alpha。
- `scripts/vectorize.ts`: 提取 Alpha、扫描 Potrace 阈值与曲线参数、按目标量化误差并交付 path-only SVG。
- `scripts/vectorize.test.ts`: 覆盖解析、指标、纯色底去除、输出命名、候选保留策略、目标化候选排序、不覆盖旧结果与真实工具链。

依赖边界

`SKILL.md` 只负责编排；`vectorize.ts` 是唯一执行入口并依赖 `background.ts` 做纯色底归一化。脚本只使用 Bun/Node 内建模块，外部进程限于 FFmpeg、FFprobe、Potrace 与一个 SVG 栅格器。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
