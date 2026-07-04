/**
 * [INPUT]: 依赖 Bun/Node 内建模块及 ffmpeg、ffprobe、potrace、rsvg-convert 或 inkscape
 * [OUTPUT]: 对外提供 path-only SVG、PNG 预览、可按目标优化的误差报告与可复用纯函数
 * [POS]: daftai-image-to-svg 的唯一执行入口，编排提取、描摹、量化和验收
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { spawnSync } from "node:child_process";
import {
	copyFileSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, extname, join, resolve } from "node:path";
import { removeSolidBackground, rgbToHex } from "./background";

export interface SvgAnalysis {
	imageCount: number;
	pathCount: number;
	dataImageCount: number;
	mixed: boolean;
}

export interface CandidateMetrics {
	threshold: number;
	alphamax?: number;
	opttolerance?: number;
	mae: number;
	rmse: number;
	iou128: number;
}

interface Candidate extends CandidateMetrics {
	svgPath: string;
	previewPath: string;
}

interface NormalizeOptions {
	width: number;
	height: number;
	color: string;
	title: string;
}

interface BackgroundRemovalReport {
	applied: boolean;
	backgroundColor?: string;
	foregroundColor?: string;
	method?: "solid-color-corners";
}

export interface CliOptions {
	input: string;
	outputDir?: string;
	color?: string;
	thresholdMin: number;
	thresholdMax: number;
	thresholdStep: number;
	objective?: Objective;
	alphamaxValues?: number[];
	opttoleranceValues?: number[];
	keepCandidates: boolean;
}

export type Renderer = "rsvg-convert" | "inkscape";
export type Objective = "mae" | "rmse" | "iou";

export interface VectorizeResult {
	outputDir: string;
	svgPath: string;
	previewPath: string;
	reportPath: string;
}

export function parseArgs(argv: string[]): CliOptions {
	if (argv.length === 0) {
		throw new Error("Usage: vectorize.ts <input> [options]");
	}

	const options: CliOptions = {
		input: resolve(argv[0]),
		outputDir: undefined,
		color: undefined,
		thresholdMin: 124,
		thresholdMax: 144,
		thresholdStep: 2,
		objective: "mae",
		alphamaxValues: [0.2],
		opttoleranceValues: [0.03],
		keepCandidates: false,
	};

	for (let index = 1; index < argv.length; index += 1) {
		const flag = argv[index];
		if (flag === "--keep-candidates") {
			options.keepCandidates = true;
			continue;
		}
		const value = argv[++index];
		if (value === undefined) throw new Error(`Missing value for ${flag}`);

		if (flag === "--output-dir") options.outputDir = resolve(value);
		else if (flag === "--color") options.color = value.toLowerCase();
		else if (flag === "--threshold-min") options.thresholdMin = Number(value);
		else if (flag === "--threshold-max") options.thresholdMax = Number(value);
		else if (flag === "--threshold-step") options.thresholdStep = Number(value);
		else if (flag === "--objective") options.objective = parseObjective(value);
		else if (flag === "--alphamax") {
			options.alphamaxValues = parseNumberList(value, "--alphamax", 0, 1);
		} else if (flag === "--opttolerance") {
			options.opttoleranceValues = parseNumberList(value, "--opttolerance", 0);
		}
		else throw new Error(`Unknown option: ${flag}`);
	}

	if (options.color && !/^#[0-9a-f]{6}$/.test(options.color)) {
		throw new Error("--color must use #rrggbb");
	}
	const thresholds = [
		options.thresholdMin,
		options.thresholdMax,
		options.thresholdStep,
	];
	if (
		!thresholds.every(Number.isInteger) ||
		options.thresholdMin < 1 ||
		options.thresholdMax > 254 ||
		options.thresholdMin > options.thresholdMax ||
		options.thresholdStep < 1
	) {
		throw new Error("Invalid threshold range");
	}

	return options;
}

function parseObjective(value: string): Objective {
	if (value === "mae" || value === "rmse" || value === "iou") return value;
	throw new Error("Invalid objective");
}

function parseNumberList(
	value: string,
	flag: string,
	minimum: number,
	maximum = Number.POSITIVE_INFINITY,
): number[] {
	const values = value.split(",").map((part) => Number(part.trim()));
	if (
		values.length === 0 ||
		values.some(
			(entry) =>
				!Number.isFinite(entry) || entry < minimum || entry > maximum,
		)
	) {
		throw new Error(`Invalid ${flag} list`);
	}
	return values;
}

export function resolveRenderer(commands: Set<string>): Renderer {
	if (commands.has("rsvg-convert")) return "rsvg-convert";
	if (commands.has("inkscape")) return "inkscape";
	throw new Error("SVG rasterizer missing: install librsvg or Inkscape");
}

export async function vectorize(
	options: CliOptions,
): Promise<VectorizeResult> {
	checkDependencies();
	if (!existsSync(options.input)) {
		throw new Error(`Input not found: ${options.input}`);
	}

	const extension = extname(options.input).toLowerCase();
	if (extension !== ".png" && extension !== ".svg") {
		throw new Error("Only PNG and SVG input are supported");
	}

	const renderer = resolveRenderer(
		new Set(["rsvg-convert", "inkscape"].filter(commandExists)),
	);
	const slug = slugify(options.input);
	const outputDir = options.outputDir ?? join(dirname(options.input), `${slug}-svg-output`);
	const outputSlug = createOutputSlug(outputDir, slug);
	const workDir = mkdtempSync(join(tmpdir(), "daftai-vectorize-"));
	mkdirSync(outputDir, { recursive: true });

	try {
		const prepared = prepareRaster(options.input, extension, workDir);
		const dimensions = probeDimensions(prepared.pngPath);
		let rgba = decodeRgba(prepared.pngPath);
		const expectedBytes = dimensions.width * dimensions.height * 4;
		if (rgba.length !== expectedBytes) {
			throw new Error("Decoded RGBA size does not match image dimensions");
		}

		let backgroundRemoval: BackgroundRemovalReport = { applied: false };
		let alpha = alphaFromRgba(rgba);
		if (alpha.every((value) => value === 255)) {
			const removed = removeSolidBackground(rgba, dimensions);
			rgba = removed.rgba;
			alpha = alphaFromRgba(rgba);
			backgroundRemoval = {
				applied: true,
				backgroundColor: rgbToHex(removed.background),
				foregroundColor: rgbToHex(removed.foreground),
				method: "solid-color-corners",
			};
		}
		if (alpha.every((value) => value === 255)) {
			throw new Error("Input has no meaningful transparency or removable solid background");
		}

		const detected = detectColor(rgba);
		if (!options.color && !prepared.wrapperFill && detected.multicolor) {
			throw new Error("Multicolor artwork is outside this skill; use VTracer");
		}
		const color = options.color ?? prepared.wrapperFill ?? detected.color;
		const candidates = traceCandidates({
			alpha,
			color,
			dimensions,
			options,
			renderer,
			workDir,
		});
		const selected = selectCandidate(candidates, options.objective ?? "mae");
		const svgPath = join(outputDir, `${outputSlug}.svg`);
		const previewPath = join(outputDir, `${outputSlug}.preview.png`);
		const reportPath = join(outputDir, `${outputSlug}.report.json`);
		const finalSvg = normalizeSvg(readFileSync(selected.svgPath, "utf8"), {
			...dimensions,
			color,
			title: `${slug} — true vector high-fidelity trace`,
		});

		writeFileSync(svgPath, finalSvg);
		renderSvg(renderer, svgPath, previewPath, dimensions.width, dimensions.height);
		renderSvg(
			renderer,
			svgPath,
			join(workDir, "verify-4x.png"),
			dimensions.width * 4,
			dimensions.height * 4,
		);
		const structure = analyzeSvg(finalSvg);
		if (structure.imageCount || structure.dataImageCount || !structure.pathCount) {
			throw new Error("Final SVG failed path-only validation");
		}

		if (options.keepCandidates) {
			const candidateDir = join(outputDir, "candidates");
			mkdirSync(candidateDir);
			for (const candidate of candidates) {
				copyFileSync(candidate.svgPath, join(candidateDir, basename(candidate.svgPath)));
				copyFileSync(
					candidate.previewPath,
					join(candidateDir, basename(candidate.previewPath)),
				);
			}
		}

		writeReport(reportPath, {
			sourcePath: options.input,
			svgPath,
			previewPath,
			dimensions,
			color,
			backgroundRemoval,
			renderer,
			objective: options.objective ?? "mae",
			candidates,
			selected,
			structure,
		});
		return { outputDir, svgPath, previewPath, reportPath };
	} catch (error) {
		rmSync(outputDir, { recursive: true, force: true });
		throw error;
	} finally {
		rmSync(workDir, { recursive: true, force: true });
	}
}

export function analyzeSvg(svg: string): SvgAnalysis {
	const imageCount = svg.match(/<image\b/gi)?.length ?? 0;
	const pathCount = svg.match(/<path\b/gi)?.length ?? 0;
	const dataImageCount = svg.match(/data:image\//gi)?.length ?? 0;

	return {
		imageCount,
		pathCount,
		dataImageCount,
		mixed: imageCount > 0 && pathCount > 0,
	};
}

export function extractRaster(
	svg: string,
	svgPath: string,
): { bytes: Buffer; source: "embedded" | "local" } {
	const analysis = analyzeSvg(svg);
	if (analysis.imageCount !== 1) {
		throw new Error("SVG must contain exactly one image");
	}
	if (analysis.mixed) {
		throw new Error("Mixed raster and vector SVG is not supported");
	}

	const match = svg.match(
		/<image\b[^>]*(?:href|xlink:href)=["']([^"']+)["']/i,
	);
	if (!match) throw new Error("SVG image reference is missing");

	const href = match[1];
	const embedded = href.match(/^data:image\/png;base64,(.+)$/is);
	if (embedded) {
		return { bytes: Buffer.from(embedded[1], "base64"), source: "embedded" };
	}
	if (/^[a-z]+:/i.test(href) || href.startsWith("//")) {
		throw new Error("Remote image references are not supported");
	}

	const localPath = resolve(dirname(svgPath), href);
	if (!existsSync(localPath)) throw new Error(`Local PNG not found: ${localPath}`);
	if (extname(localPath).toLowerCase() !== ".png") {
		throw new Error("Only PNG raster input is supported");
	}
	return { bytes: readFileSync(localPath), source: "local" };
}

export function computeMetrics(
	source: Uint8Array,
	candidate: Uint8Array,
): Omit<CandidateMetrics, "threshold"> {
	if (source.length !== candidate.length) {
		throw new Error("Alpha buffers differ in size");
	}

	let absolute = 0;
	let squared = 0;
	let intersection = 0;
	let union = 0;

	for (let index = 0; index < source.length; index += 1) {
		const delta = candidate[index] - source[index];
		absolute += Math.abs(delta);
		squared += delta * delta;
		const sourceOn = source[index] >= 128;
		const candidateOn = candidate[index] >= 128;
		if (sourceOn && candidateOn) intersection += 1;
		if (sourceOn || candidateOn) union += 1;
	}

	return {
		mae: absolute / source.length,
		rmse: Math.sqrt(squared / source.length),
		iou128: union === 0 ? 1 : intersection / union,
	};
}

export function selectCandidate<T extends CandidateMetrics>(
	candidates: T[],
	objective: Objective = "mae",
): T {
	if (candidates.length === 0) throw new Error("No valid vector candidates");

	const byStableTieBreakers = (left: T, right: T) =>
		left.mae - right.mae ||
		left.rmse - right.rmse ||
		right.iou128 - left.iou128 ||
		left.threshold - right.threshold ||
		(left.alphamax ?? 0) - (right.alphamax ?? 0) ||
		(left.opttolerance ?? 0) - (right.opttolerance ?? 0);

	return [...candidates].sort(
		(left, right) => {
			if (objective === "iou") {
				return right.iou128 - left.iou128 || byStableTieBreakers(left, right);
			}
			if (objective === "rmse") {
				return left.rmse - right.rmse || byStableTieBreakers(left, right);
			}
			return byStableTieBreakers(left, right);
		},
	)[0];
}

function escapeXml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&apos;");
}

export function normalizeSvg(
	svg: string,
	options: NormalizeOptions,
): string {
	const analysis = analyzeSvg(svg);
	if (analysis.imageCount || analysis.dataImageCount || analysis.pathCount === 0) {
		throw new Error("Candidate is not a path-only SVG");
	}

	let normalized = svg.replace(
		/width="[^"]+"\s+height="[^"]+"\s+viewBox="[^"]+"/,
		`width="${options.width}" height="${options.height}" viewBox="0 0 ${options.width} ${options.height}"`,
	);
	normalized = normalized.replace(
		/fill="#[0-9a-f]{6}"/i,
		`fill="${options.color}"`,
	);
	normalized = normalized.replace(/<title>[\s\S]*?<\/title>/i, "");

	return normalized.replace(
		/(<svg\b[^>]*>)/i,
		`$1\n<title>${escapeXml(options.title)}</title>`,
	);
}

function run(command: string, args: string[]): Buffer {
	const result = spawnSync(command, args, {
		encoding: null,
		maxBuffer: 256 * 1024 * 1024,
	});
	if (result.status !== 0) {
		const detail = Buffer.from(result.stderr ?? []).toString("utf8").trim();
		throw new Error(`${command} failed${detail ? `: ${detail}` : ""}`);
	}
	return Buffer.from(result.stdout ?? []);
}

function commandExists(command: string): boolean {
	return spawnSync("sh", ["-lc", `command -v ${command}`], {
		stdio: "ignore",
	}).status === 0;
}

function checkDependencies(): void {
	for (const command of ["ffmpeg", "ffprobe", "potrace"]) {
		if (!commandExists(command)) {
			throw new Error(`Missing dependency: ${command}`);
		}
	}
}

function slugify(path: string): string {
	return (
		basename(path, extname(path))
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "")
			.slice(0, 64) || "artwork"
	);
}

function timestamp(): string {
	return new Date().toISOString().replace(/\D/g, "").slice(0, 14);
}

function createOutputSlug(outputDir: string, slug: string): string {
	mkdirSync(outputDir, { recursive: true });
	if (!outputFilesExist(outputDir, slug)) return slug;

	const stamped = `${slug}-${timestamp()}`;
	if (!outputFilesExist(outputDir, stamped)) return stamped;
	let sequence = 2;
	while (outputFilesExist(outputDir, `${stamped}-${sequence}`)) sequence += 1;
	return `${stamped}-${sequence}`;
}

function outputFilesExist(outputDir: string, slug: string): boolean {
	return [
		`${slug}.svg`,
		`${slug}.preview.png`,
		`${slug}.report.json`,
	].some((name) => existsSync(join(outputDir, name)));
}

function prepareRaster(
	sourcePath: string,
	extension: string,
	workDir: string,
): { pngPath: string; wrapperFill?: string } {
	if (extension === ".png") return { pngPath: sourcePath };

	const svg = readFileSync(sourcePath, "utf8");
	const raster = extractRaster(svg, sourcePath);
	const pngPath = join(workDir, "source.png");
	writeFileSync(pngPath, raster.bytes);
	return { pngPath, wrapperFill: detectWrapperFill(svg) };
}

function detectWrapperFill(svg: string): string | undefined {
	return svg.match(/\bfill=["'](#[0-9a-f]{6})["']/i)?.[1]?.toLowerCase();
}

function probeDimensions(path: string): { width: number; height: number } {
	const output = run("ffprobe", [
		"-v",
		"error",
		"-select_streams",
		"v:0",
		"-show_entries",
		"stream=width,height",
		"-of",
		"json",
		path,
	]).toString("utf8");
	const stream = JSON.parse(output).streams?.[0];
	if (!stream?.width || !stream?.height) {
		throw new Error("Could not determine image dimensions");
	}
	return { width: stream.width, height: stream.height };
}

function decodeRgba(path: string): Buffer {
	return run("ffmpeg", [
		"-v",
		"error",
		"-i",
		path,
		"-frames:v",
		"1",
		"-f",
		"rawvideo",
		"-pix_fmt",
		"rgba",
		"pipe:1",
	]);
}

function alphaFromRgba(rgba: Uint8Array): Uint8Array {
	if (rgba.length % 4 !== 0) throw new Error("Invalid RGBA buffer");
	const alpha = new Uint8Array(rgba.length / 4);
	for (let index = 0; index < alpha.length; index += 1) {
		alpha[index] = rgba[index * 4 + 3];
	}
	return alpha;
}

function detectColor(
	rgba: Uint8Array,
): { color: string; multicolor: boolean } {
	const counts = new Map<string, number>();
	for (let index = 0; index < rgba.length; index += 4) {
		if (rgba[index + 3] < 128) continue;
		const color = `#${[rgba[index], rgba[index + 1], rgba[index + 2]]
			.map((value) => value.toString(16).padStart(2, "0"))
			.join("")}`;
		counts.set(color, (counts.get(color) ?? 0) + 1);
	}
	const ranked = [...counts].sort((left, right) => right[1] - left[1]);
	if (!ranked.length) throw new Error("No meaningful nontransparent pixels");
	const total = ranked.reduce((sum, entry) => sum + entry[1], 0);
	return {
		color: ranked[0][0],
		multicolor: 1 - ranked[0][1] / total > 0.01,
	};
}

function writeThresholdPgm(
	path: string,
	alpha: Uint8Array,
	width: number,
	height: number,
	threshold: number,
): void {
	const pixels = Buffer.alloc(alpha.length);
	for (let index = 0; index < alpha.length; index += 1) {
		pixels[index] = alpha[index] >= threshold ? 0 : 255;
	}
	writeFileSync(
		path,
		Buffer.concat([Buffer.from(`P5\n${width} ${height}\n255\n`), pixels]),
	);
}

function traceCandidate(
	pgmPath: string,
	svgPath: string,
	color: string,
	params: { alphamax: number; opttolerance: number },
): void {
	run("potrace", [
		pgmPath,
		"--svg",
		"--output",
		svgPath,
		"--color",
		color,
		"--turdsize",
		"0",
		"--alphamax",
		String(params.alphamax),
		"--opttolerance",
		String(params.opttolerance),
		"--unit",
		"100",
		"--flat",
	]);
}

function renderSvg(
	renderer: Renderer,
	svgPath: string,
	pngPath: string,
	width: number,
	height: number,
): void {
	if (renderer === "rsvg-convert") {
		run("rsvg-convert", [
			"-w",
			String(width),
			"-h",
			String(height),
			"-o",
			pngPath,
			svgPath,
		]);
		return;
	}
	run("inkscape", [
		svgPath,
		`--export-filename=${pngPath}`,
		`--export-width=${width}`,
		`--export-height=${height}`,
	]);
}

function traceCandidates(input: {
	alpha: Uint8Array;
	color: string;
	dimensions: { width: number; height: number };
	options: CliOptions;
	renderer: Renderer;
	workDir: string;
}): Candidate[] {
	const candidates: Candidate[] = [];
	const alphamaxValues = input.options.alphamaxValues ?? [0.2];
	const opttoleranceValues = input.options.opttoleranceValues ?? [0.03];
	for (
		let threshold = input.options.thresholdMin;
		threshold <= input.options.thresholdMax;
		threshold += input.options.thresholdStep
	) {
		const pgmPath = join(input.workDir, `threshold-${threshold}.pgm`);
		writeThresholdPgm(
			pgmPath,
			input.alpha,
			input.dimensions.width,
			input.dimensions.height,
			threshold,
		);
		for (const alphamax of alphamaxValues) {
			for (const opttolerance of opttoleranceValues) {
				const tag = `t${threshold}-a${alphamax}-o${opttolerance}`;
				const svgPath = join(input.workDir, `candidate-${tag}.svg`);
				const previewPath = join(input.workDir, `candidate-${tag}.png`);
				traceCandidate(pgmPath, svgPath, input.color, {
					alphamax,
					opttolerance,
				});
				const normalized = normalizeSvg(readFileSync(svgPath, "utf8"), {
					...input.dimensions,
					color: input.color,
					title: `Vector candidate ${tag}`,
				});
				writeFileSync(svgPath, normalized);
				renderSvg(
					input.renderer,
					svgPath,
					previewPath,
					input.dimensions.width,
					input.dimensions.height,
				);
				const candidateAlpha = alphaFromRgba(decodeRgba(previewPath));
				candidates.push({
					threshold,
					alphamax,
					opttolerance,
					...computeMetrics(input.alpha, candidateAlpha),
					svgPath,
					previewPath,
				});
			}
		}
	}
	return candidates;
}

function writeReport(
	path: string,
	input: {
		sourcePath: string;
		svgPath: string;
		previewPath: string;
		dimensions: { width: number; height: number };
		color: string;
		backgroundRemoval: BackgroundRemovalReport;
		renderer: Renderer;
		objective: Objective;
		candidates: Candidate[];
		selected: Candidate;
		structure: SvgAnalysis;
	},
): void {
	const metrics = (candidate: Candidate) => ({
		threshold: candidate.threshold,
		alphamax: candidate.alphamax,
		opttolerance: candidate.opttolerance,
		mae: candidate.mae,
		rmse: candidate.rmse,
		iou128: candidate.iou128,
	});
	writeFileSync(
		path,
		`${JSON.stringify(
			{
				sourcePath: input.sourcePath,
				svgPath: input.svgPath,
				previewPath: input.previewPath,
				...input.dimensions,
				color: input.color,
				backgroundRemoval: input.backgroundRemoval,
				renderer: input.renderer,
				objective: input.objective,
				candidates: input.candidates.map(metrics),
				selectedThreshold: input.selected.threshold,
				selectedPotrace: {
					alphamax: input.selected.alphamax,
					opttolerance: input.selected.opttolerance,
					turdsize: 0,
					unit: 100,
					flat: true,
				},
				selectedMetrics: metrics(input.selected),
				structure: input.structure,
				verified4x: true,
				limitation:
					"Automatic tracing approximates unavailable source curves.",
			},
			null,
			2,
		)}\n`,
	);
}

async function main(): Promise<void> {
	try {
		const result = await vectorize(parseArgs(process.argv.slice(2)));
		process.stdout.write(`${JSON.stringify(result)}\n`);
	} catch (error) {
		process.stderr.write(
			`${error instanceof Error ? error.message : String(error)}\n`,
		);
		process.exitCode = 1;
	}
}

if (import.meta.main) await main();
