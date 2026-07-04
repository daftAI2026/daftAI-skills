/**
 * [INPUT]: 依赖 RGBA 像素缓冲与图片尺寸
 * [OUTPUT]: 对外提供纯色背景检测、前景色估计与 Alpha 重建能力
 * [POS]: daftai-image-to-svg 的预处理器，把白底/绿底/红底单色图归一为透明单色图
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export interface Dimensions {
	width: number;
	height: number;
}

export interface Rgb {
	r: number;
	g: number;
	b: number;
}

export interface SolidBackgroundResult {
	rgba: Buffer;
	background: Rgb;
	foreground: Rgb;
}

export function rgbToHex(color: Rgb): string {
	return `#${[color.r, color.g, color.b]
		.map((value) => value.toString(16).padStart(2, "0"))
		.join("")}`;
}

export function removeSolidBackground(
	rgba: Uint8Array,
	dimensions: Dimensions,
): SolidBackgroundResult {
	if (rgba.length !== dimensions.width * dimensions.height * 4) {
		throw new Error("RGBA size does not match image dimensions");
	}

	const background = estimateBackground(rgba, dimensions);
	const foreground = estimateForeground(rgba, background);
	const output = Buffer.alloc(rgba.length);

	for (let index = 0; index < rgba.length; index += 4) {
		const alpha = estimateCoverage(
			{ r: rgba[index], g: rgba[index + 1], b: rgba[index + 2] },
			background,
			foreground,
		);
		output[index] = foreground.r;
		output[index + 1] = foreground.g;
		output[index + 2] = foreground.b;
		output[index + 3] = alpha < 8 ? 0 : alpha;
	}

	return { rgba: output, background, foreground };
}

function estimateBackground(rgba: Uint8Array, dimensions: Dimensions): Rgb {
	const corners = [
		rgbAt(rgba, 0, 0, dimensions.width),
		rgbAt(rgba, dimensions.width - 1, 0, dimensions.width),
		rgbAt(rgba, 0, dimensions.height - 1, dimensions.width),
		rgbAt(rgba, dimensions.width - 1, dimensions.height - 1, dimensions.width),
	];
	return averageColor(corners);
}

function estimateForeground(rgba: Uint8Array, background: Rgb): Rgb {
	const counts = new Map<string, { color: Rgb; count: number }>();
	for (let index = 0; index < rgba.length; index += 4) {
		const color = { r: rgba[index], g: rgba[index + 1], b: rgba[index + 2] };
		if (distance(color, background) < 32) continue;
		const key = rgbToHex(color);
		const entry = counts.get(key);
		if (entry) entry.count += 1;
		else counts.set(key, { color, count: 1 });
	}

	const ranked = [...counts.values()].sort((left, right) => right.count - left.count);
	if (!ranked.length) {
		throw new Error("Solid background removal found no foreground pixels");
	}
	return ranked[0].color;
}

function estimateCoverage(pixel: Rgb, background: Rgb, foreground: Rgb): number {
	const coverages = [
		channelCoverage(pixel.r, background.r, foreground.r),
		channelCoverage(pixel.g, background.g, foreground.g),
		channelCoverage(pixel.b, background.b, foreground.b),
	].filter((value) => value !== undefined);
	if (!coverages.length) return distance(pixel, background) < 4 ? 0 : 255;
	const coverage = Math.max(...coverages);
	return Math.round(clamp(coverage, 0, 1) * 255);
}

function channelCoverage(
	value: number,
	background: number,
	foreground: number,
): number | undefined {
	const span = foreground - background;
	if (Math.abs(span) < 4) return undefined;
	return (value - background) / span;
}

function rgbAt(rgba: Uint8Array, x: number, y: number, width: number): Rgb {
	const index = (y * width + x) * 4;
	return { r: rgba[index], g: rgba[index + 1], b: rgba[index + 2] };
}

function averageColor(colors: Rgb[]): Rgb {
	const sum = colors.reduce(
		(total, color) => ({
			r: total.r + color.r,
			g: total.g + color.g,
			b: total.b + color.b,
		}),
		{ r: 0, g: 0, b: 0 },
	);
	return {
		r: Math.round(sum.r / colors.length),
		g: Math.round(sum.g / colors.length),
		b: Math.round(sum.b / colors.length),
	};
}

function distance(left: Rgb, right: Rgb): number {
	return Math.hypot(left.r - right.r, left.g - right.g, left.b - right.b);
}

function clamp(value: number, minimum: number, maximum: number): number {
	return Math.min(maximum, Math.max(minimum, value));
}
