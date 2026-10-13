# scripts/
> L2 | 父级: ../CLAUDE.md

成员清单

- `geometry.ts`: 纯函数校验窗口、计算比例与生成 PGM 遮罩。
- `composite.ts`: 唯一 CLI。预览与合成共享同一坐标和遮罩。
- `composite.test.ts`: Bun 回归测试，真实调用 FFmpeg。

编码阶段只输出视频。
封装阶段复制全部原声音轨，不使用最短流截断。
临时目录与成品同盘，硬链接发布拒绝覆盖。
测试夹具只写临时目录，结束后删除。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
