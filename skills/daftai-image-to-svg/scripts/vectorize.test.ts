/**
 * [INPUT]: 依赖 Bun test 与 vectorize.ts 的纯函数契约
 * [OUTPUT]: 提供 SVG 识别、位图提取、误差计算、候选排序和结构验证测试
 * [POS]: daftai-image-to-svg 的回归门，阻止伪矢量与选择逻辑漂移
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { describe, expect, test } from "bun:test";
import {
	existsSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
	analyzeSvg,
	computeMetrics,
	extractRaster,
	normalizeSvg,
	parseArgs,
	resolveRenderer,
	selectCandidate,
	vectorize,
} from "./vectorize";

function createTransparentFixture(root: string): string {
	const input = join(root, "blue-square.png");
	const fixture = Bun.spawnSync([
		"ffmpeg",
		"-v",
		"error",
		"-f",
		"lavfi",
		"-i",
		"color=c=black@0.0:s=64x64,format=rgba,drawbox=x=8:y=8:w=48:h=48:color=0x0113A8@1:t=fill:replace=1",
		"-frames:v",
		"1",
		"-y",
		input,
	]);
	expect(fixture.exitCode).toBe(0);
	return input;
}

function createSolidBackgroundFixture(root: string): string {
	const input = join(root, "blue-on-green.png");
	const fixture = Bun.spawnSync([
		"ffmpeg",
		"-v",
		"error",
		"-f",
		"lavfi",
		"-i",
		"color=c=0x00ff00:s=64x64,format=rgb24,drawbox=x=8:y=8:w=48:h=48:color=0x0113A8:t=fill",
		"-frames:v",
		"1",
		"-y",
		input,
	]);
	expect(fixture.exitCode).toBe(0);
	return input;
}

describe("analyzeSvg", () => {
	test("detects mixed raster and vector content", () => {
		expect(
			analyzeSvg('<svg><image href="a.png"/><path d="M0 0h1v1z"/></svg>'),
		).toEqual({
			imageCount: 1,
			pathCount: 1,
			dataImageCount: 0,
			mixed: true,
		});
	});
});

describe("extractRaster", () => {
	test("extracts one Base64 PNG", () => {
		const png = Buffer.from("89504e470d0a1a0a", "hex");
		const svg = `<svg><image href="data:image/png;base64,${png.toString("base64")}"/></svg>`;

		expect(extractRaster(svg, "/tmp/source.svg")).toEqual({
			bytes: png,
			source: "embedded",
		});
	});

	test("rejects remote image references", () => {
		const svg = '<svg><image href="https://example.com/a.png"/></svg>';

		expect(() => extractRaster(svg, "/tmp/source.svg")).toThrow(
			"Remote image references are not supported",
		);
	});
});

describe("computeMetrics", () => {
	test("computes alpha MAE, RMSE, and IoU", () => {
		const source = Uint8Array.from([0, 128, 255, 255]);
		const candidate = Uint8Array.from([0, 255, 255, 0]);

		const metrics = computeMetrics(source, candidate);

		expect(metrics.mae).toBe(95.5);
		expect(metrics.rmse).toBeCloseTo(142.4377056821683);
		expect(metrics.iou128).toBeCloseTo(2 / 3);
	});
});

describe("selectCandidate", () => {
	test("orders by MAE, RMSE, IoU, then threshold", () => {
		const result = selectCandidate([
			{ threshold: 132, mae: 3.4, rmse: 14, iou128: 0.97 },
			{ threshold: 130, mae: 3.3, rmse: 15, iou128: 0.96 },
			{ threshold: 128, mae: 3.3, rmse: 14, iou128: 0.95 },
			{ threshold: 126, mae: 3.3, rmse: 14, iou128: 0.96 },
		]);

		expect(result.threshold).toBe(126);
	});

	test("can optimize for binary outline IoU", () => {
		const result = selectCandidate(
			[
				{ threshold: 130, mae: 3.2, rmse: 13.5, iou128: 0.979 },
				{ threshold: 127, mae: 3.3, rmse: 13.7, iou128: 0.981 },
			],
			"iou",
		);

		expect(result.threshold).toBe(127);
	});
});

describe("parseArgs", () => {
	test("uses the validated high-fidelity defaults", () => {
		expect(parseArgs(["/tmp/source.png"])).toEqual({
			input: "/tmp/source.png",
			outputDir: undefined,
			color: undefined,
			thresholdMin: 124,
			thresholdMax: 144,
			thresholdStep: 2,
			objective: "mae",
			alphamaxValues: [0.2],
			opttoleranceValues: [0.03],
			keepCandidates: false,
		});
	});

	test("parses outline-focused objective and Potrace parameter scans", () => {
		expect(
			parseArgs([
				"/tmp/source.png",
				"--objective",
				"iou",
				"--alphamax",
				"0,0.2",
				"--opttolerance",
				"0,0.03",
			]),
		).toMatchObject({
			objective: "iou",
			alphamaxValues: [0, 0.2],
			opttoleranceValues: [0, 0.03],
		});
	});

	test("rejects malformed colors and threshold ranges", () => {
		expect(() =>
			parseArgs(["/tmp/source.png", "--color", "blue"]),
		).toThrow("--color must use #rrggbb");
		expect(() =>
			parseArgs([
				"/tmp/source.png",
				"--threshold-min",
				"200",
				"--threshold-max",
				"100",
			]),
		).toThrow("Invalid threshold range");
		expect(() =>
			parseArgs(["/tmp/source.png", "--objective", "pixels"]),
		).toThrow("Invalid objective");
		expect(() =>
			parseArgs(["/tmp/source.png", "--alphamax", "0,bad"]),
		).toThrow("Invalid --alphamax list");
	});
});

describe("resolveRenderer", () => {
	test("prefers librsvg and falls back to Inkscape", () => {
		expect(resolveRenderer(new Set(["inkscape", "rsvg-convert"]))).toBe(
			"rsvg-convert",
		);
		expect(resolveRenderer(new Set(["inkscape"]))).toBe("inkscape");
		expect(() => resolveRenderer(new Set())).toThrow("SVG rasterizer");
	});
});

describe("normalizeSvg", () => {
	test("sets pixel dimensions, title, and fill color", () => {
		const input =
			'<svg width="10pt" height="20pt" viewBox="0 0 10 20"><g fill="#000000"><path d="M0 0h1v1z"/></g></svg>';

		const output = normalizeSvg(input, {
			width: 10,
			height: 20,
			color: "#0113a8",
			title: "Blue emblem",
		});

		expect(output).toContain('width="10" height="20" viewBox="0 0 10 20"');
		expect(output).toContain("<title>Blue emblem</title>");
		expect(output).toContain('fill="#0113a8"');
		expect(output).not.toContain("<image");
		expect(output).not.toContain("data:image");
	});

	test("rejects SVG that still contains raster data", () => {
		const input =
			'<svg width="10" height="10"><image href="data:image/png;base64,eA=="/></svg>';

		expect(() =>
			normalizeSvg(input, {
				width: 10,
				height: 10,
				color: "#000000",
				title: "Invalid",
			}),
		).toThrow("Candidate is not a path-only SVG");
	});
});

describe("vectorize", () => {
	test("creates measured path-only output without overwriting", async () => {
		const root = mkdtempSync(join(tmpdir(), "vectorize-e2e-"));
		const input = createTransparentFixture(root);

		try {
			const options = {
				input,
				outputDir: root,
				color: undefined,
				thresholdMin: 124,
				thresholdMax: 132,
				thresholdStep: 4,
				keepCandidates: false,
			};
			const first = await vectorize(options);
			const second = await vectorize(options);
			const svg = readFileSync(first.svgPath, "utf8");
			const report = JSON.parse(readFileSync(first.reportPath, "utf8"));

			expect(first.outputDir).toBe(root);
			expect(second.outputDir).toBe(root);
			expect(first.svgPath).not.toBe(second.svgPath);
			expect(first.svgPath).toBe(join(root, "blue-square.svg"));
			expect(first.previewPath).toBe(join(root, "blue-square.preview.png"));
			expect(first.reportPath).toBe(join(root, "blue-square.report.json"));
			expect(existsSync(join(root, "source-blue-square.png"))).toBe(false);
			expect(existsSync(first.previewPath)).toBe(true);
			expect(svg).toMatch(/<path\b/);
			expect(svg).not.toMatch(/<image\b|data:image\//);
			expect(report.selectedMetrics.mae).toBeLessThan(1);
			expect(report.structure.imageCount).toBe(0);
			expect(report.verified4x).toBe(true);
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	test("resolves local PNG references from the original SVG directory", async () => {
		const root = mkdtempSync(join(tmpdir(), "vectorize-local-svg-"));
		createTransparentFixture(root);
		const input = join(root, "wrapper.svg");
		writeFileSync(
			input,
			'<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><g fill="#0113a8"><image width="64" height="64" href="blue-square.png"/></g></svg>',
		);

		try {
			const result = await vectorize({
				input,
				outputDir: root,
				color: undefined,
				thresholdMin: 128,
				thresholdMax: 128,
				thresholdStep: 1,
				keepCandidates: false,
			});

			expect(existsSync(result.svgPath)).toBe(true);
			expect(readFileSync(result.svgPath, "utf8")).toContain('fill="#0113a8"');
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	test("converts single-color artwork on a solid background", async () => {
		const root = mkdtempSync(join(tmpdir(), "vectorize-solid-bg-"));
		const input = createSolidBackgroundFixture(root);

		try {
			const result = await vectorize({
				input,
				outputDir: root,
				color: undefined,
				thresholdMin: 128,
				thresholdMax: 128,
				thresholdStep: 1,
				keepCandidates: false,
			});
			const svg = readFileSync(result.svgPath, "utf8");
			const report = JSON.parse(readFileSync(result.reportPath, "utf8"));

			expect(svg).toContain('fill="#0113a8"');
			expect(svg).not.toMatch(/<image\b|data:image\//);
			expect(report.backgroundRemoval).toEqual({
				applied: true,
				backgroundColor: "#00ff00",
				foregroundColor: "#0113a8",
				method: "solid-color-corners",
			});
			expect(report.structure.pathCount).toBe(1);
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	test("keeps candidate files only when requested", async () => {
		const root = mkdtempSync(join(tmpdir(), "vectorize-candidates-"));
		const input = createTransparentFixture(root);

		try {
			const withoutCandidates = await vectorize({
				input,
				outputDir: root,
				color: undefined,
				thresholdMin: 128,
				thresholdMax: 128,
				thresholdStep: 1,
				keepCandidates: false,
			});
			expect(existsSync(join(withoutCandidates.outputDir, "candidates"))).toBe(
				false,
			);

			const withCandidates = await vectorize({
				input,
				outputDir: root,
				color: undefined,
				thresholdMin: 128,
				thresholdMax: 128,
				thresholdStep: 1,
				keepCandidates: true,
			});
			expect(existsSync(join(withCandidates.outputDir, "candidates"))).toBe(
				true,
			);
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});
});
