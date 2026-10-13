/**
 * [INPUT]: 依赖截图像素尺寸、窗口矩形、圆角与边框参数。
 * [OUTPUT]: 提供窗口校验与抗锯齿 PGM 前景遮罩。
 * [POS]: 合成器的纯几何层，不读文件，不调用 FFmpeg。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export interface Size { width: number; height: number }
export interface Rect extends Size { x: number; y: number }
export type Fit = "strict" | "contain" | "cover";

export function parseRect(value: string): Rect {
  const numbers = value.split(",").map(Number);
  if (numbers.length !== 4 || value.split(",").some(v => !v.trim()) ||
      numbers.some(n => !Number.isSafeInteger(n))) {
    throw new Error("--rect 需要四个整数：x,y,width,height");
  }
  const [x, y, width, height] = numbers;
  return { x, y, width, height };
}

export function validateGeometry(canvas: Size, rect: Rect, radius: number, border: number): void {
  if ([canvas.width, canvas.height, rect.x, rect.y, rect.width, rect.height, radius, border]
      .some(n => !Number.isSafeInteger(n))) throw new Error("几何参数必须是整数");
  if (canvas.width < 1 || canvas.height < 1 || rect.width < 1 || rect.height < 1 ||
      rect.x < 0 || rect.y < 0 || rect.x + rect.width > canvas.width ||
      rect.y + rect.height > canvas.height) throw new Error("窗口必须完全位于截图内");
  if (radius < 0 || radius > Math.min(rect.width, rect.height) / 2 ||
      border < 0 || border * 2 >= Math.min(rect.width, rect.height)) {
    throw new Error("圆角或边框超出窗口范围");
  }
}

// === 4×4 子像素采样；255 保留截图，0 显示视频 ===
export function foregroundMask(canvas: Size, rect: Rect, radius: number, border: number): Buffer {
  validateGeometry(canvas, rect, radius, border);
  const pixels = Buffer.alloc(canvas.width * canvas.height, 255);
  const width = rect.width - border * 2;
  const height = rect.height - border * 2;
  const innerRadius = Math.max(0, radius - border);
  const samples = 4;
  for (let y = border; y < rect.height - border; y++) {
    for (let x = border; x < rect.width - border; x++) {
      let covered = 0;
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const px = x - border + (sx + 0.5) / samples;
          const py = y - border + (sy + 0.5) / samples;
          const dx = Math.max(innerRadius - px, 0, px - (width - innerRadius));
          const dy = Math.max(innerRadius - py, 0, py - (height - innerRadius));
          if (dx * dx + dy * dy <= innerRadius * innerRadius) covered++;
        }
      }
      pixels[(y + rect.y) * canvas.width + x + rect.x] =
        Math.round(255 * (1 - covered / (samples * samples)));
    }
  }
  return Buffer.concat([Buffer.from(`P5\n${canvas.width} ${canvas.height}\n255\n`), pixels]);
}

export function scaleFilter(rect: Rect, fit: Fit, sourceRatio: number): string {
  if (fit === "strict") {
    if (Math.abs(sourceRatio / (rect.width / rect.height) - 1) > 0.005) {
      throw new Error("视频与窗口比例不一致；确认留白或裁切后指定 --fit contain 或 cover");
    }
    return `scale=${rect.width}:${rect.height}:flags=lanczos,setsar=1`;
  }
  // === 先归一化非方形像素，再按窗口比例缩放 ===
  const normalize = "scale=round(iw*sar):ih:flags=lanczos,setsar=1";
  if (fit === "contain") {
    return `${normalize},scale=${rect.width}:${rect.height}:force_original_aspect_ratio=decrease:flags=lanczos,` +
      `pad=${rect.width}:${rect.height}:(ow-iw)/2:(oh-ih)/2:color=black`;
  }
  return `${normalize},scale=${rect.width}:${rect.height}:force_original_aspect_ratio=increase:flags=lanczos,` +
    `crop=${rect.width}:${rect.height}`;
}
