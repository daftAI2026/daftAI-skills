import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { composite, parseArgs, probe, run, type Options } from "./composite";
import { foregroundMask, parseRect, scaleFilter, validateGeometry } from "./geometry";

const hasTools = ["ffmpeg", "ffprobe"].every(tool => Bun.spawnSync([tool, "-version"]).exitCode === 0);
const integration = hasTools ? test : test.skip;

async function temporary(body: (root: string) => Promise<void>): Promise<void> {
  const root = mkdtempSync(join(tmpdir(), "daftai-compositor-test-"));
  try { await body(root); } finally { rmSync(root, { recursive: true, force: true }); }
}

async function fixture(root: string, audio = true, vfr = false): Promise<Options> {
  const image = join(root, "截图 🔥.ppm");
  const pixels = Buffer.alloc(64 * 96 * 3);
  for (let i = 0; i < pixels.length; i += 3) {
    pixels[i] = 17; pixels[i + 1] = 43; pixels[i + 2] = 89;
  }
  writeFileSync(image, Buffer.concat([Buffer.from("P6\n64 96\n255\n"), pixels]));
  const video = join(root, "原片 🔥.mp4");
  await run("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", "testsrc2=size=32x32:rate=5:duration=1.4",
    ...(audio ? ["-f", "lavfi", "-i", "sine=frequency=440:sample_rate=44100:duration=1.5"] : []),
    ...(vfr ? ["-vf", "select=not(eq(n\\,2)),settb=1/1000,setpts=N*207+eq(N\\,3)*17",
      "-enc_time_base:v", "1/1000", "-fps_mode", "passthrough"] : []),
    "-c:v", "libx264", "-pix_fmt", "yuv420p", ...(audio ? ["-c:a", "aac"] : []), video]);
  return { image, video, rect: { x: 9, y: 17, width: 32, height: 32 },
    radius: 7, border: 1, fit: "strict", previewTime: 0, output: join(root, "成品 🔥.mp4") };
}

function checksum(file: string): string {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

function rawRgb(file: string): Buffer {
  const result = Bun.spawnSync(["ffmpeg", "-v", "error", "-i", file,
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]);
  expect(result.exitCode).toBe(0);
  return Buffer.from(result.stdout);
}

function noIntermediates(root: string): void {
  expect(readdirSync(root).filter(name => name.startsWith(".daftai-video-compositor-"))).toEqual([]);
}

describe("像素几何", () => {
  test("解析窗口，不接受遗漏与小数", () => {
    expect(parseRect("32,560,1132,1132")).toEqual({ x: 32, y: 560, width: 1132, height: 1132 });
    for (const value of ["1,2,3", "1,2,3,4,5", "1,2,3.5,4", "1,,3,4", "NaN,2,3,4"]) {
      expect(() => parseRect(value)).toThrow();
    }
  });

  test("窗口不得越界，半开边界允许贴边", () => {
    const canvas = { width: 64, height: 96 };
    expect(() => validateGeometry(canvas, { x: 32, y: 64, width: 32, height: 32 }, 16, 1)).not.toThrow();
    expect(() => validateGeometry(canvas, { x: 33, y: 64, width: 32, height: 32 }, 0, 1)).toThrow();
    expect(() => validateGeometry(canvas, { x: 0, y: 0, width: 32, height: 32 }, 17, 1)).toThrow();
    expect(() => validateGeometry(canvas, { x: 0, y: 0, width: 32, height: 32 }, 1, 16)).toThrow();
  });

  test("圆角遮罩保留边框与外侧像素，边缘含抗锯齿", () => {
    const pgm = foregroundMask({ width: 64, height: 96 }, { x: 8, y: 16, width: 32, height: 32 }, 7, 1);
    const pixels = pgm.subarray(Buffer.byteLength("P5\n64 96\n255\n"));
    expect(pixels[0]).toBe(255);
    expect(pixels[16 * 64 + 8]).toBe(255);
    expect(pixels[16 * 64 + 24]).toBe(255);
    expect(pixels[32 * 64 + 24]).toBe(0);
    expect(pixels.some(v => v > 0 && v < 255)).toBe(true);
  });

  test("比例不一致时拒绝隐式拉伸", () => {
    const rect = { x: 0, y: 0, width: 32, height: 32 };
    expect(() => scaleFilter(rect, "strict", 16 / 9)).toThrow("比例");
    expect(scaleFilter(rect, "contain", 16 / 9)).toContain("pad=32:32");
    expect(scaleFilter(rect, "cover", 16 / 9)).toContain("crop=32:32");
  });

  test("CLI 拒绝未知、重复和冲突参数", () => {
    const base = ["--image", "/image.png", "--video", "/video.mp4", "--rect", "1,2,32,32"];
    expect(parseArgs(base).fit).toBe("strict");
    expect(parseArgs(base).border).toBe(1);
    for (const extra of [["--wrong", "1"], ["--radius", "-1"], ["--fit", "stretch"],
      ["--rect", "0,0,8,8"], ["--preview-time", "1"],
      ["--output", "/x.mp4", "--preview-only", "/x.png"]]) {
      expect(() => parseArgs([...base, ...extra])).toThrow();
    }
  });
});

describe("真实 FFmpeg 工具链", () => {
  integration("奇数窗口坐标不移动；无损预览的外侧像素逐点一致", async () => {
    await temporary(async root => {
      const options = await fixture(root);
      const output = join(root, "preview.png");
      await composite({ ...options, output: undefined, previewOnly: output });
      const original = rawRgb(options.image);
      const preview = rawRgb(output);
      for (let y = 0; y < 96; y++) for (let x = 0; x < 64; x++) {
        if (x < 9 || x >= 41 || y < 17 || y >= 49) {
          const index = (y * 64 + x) * 3;
          expect(preview.subarray(index, index + 3).equals(original.subarray(index, index + 3))).toBe(true);
        }
      }
      const center = (33 * 64 + 25) * 3;
      expect(preview.subarray(center, center + 3).equals(original.subarray(center, center + 3))).toBe(false);
      noIntermediates(root);
    });
  }, 30000);

  integration("保留全部尾帧和更长的完整原声，不写源副本或缓存", async () => {
    await temporary(async root => {
      const options = await fixture(root);
      const before = [checksum(options.image), checksum(options.video)];
      const result = await composite(options);
      expect(result.frames).toBe(7);
      expect(result.audioTracks).toBe(1);
      expect(result.audioUnchanged).toBe(true);
      expect(Number(result.duration)).toBeGreaterThan(1.49);
      const media = await probe(options.output!);
      expect(media.streams.find(s => s.codec_type === "video")?.nb_frames).toBe("7");
      expect([checksum(options.image), checksum(options.video)]).toEqual(before);
      expect(readdirSync(root).sort()).toEqual(["原片 🔥.mp4", "成品 🔥.mp4", "截图 🔥.ppm"].sort());
    });
  }, 30000);

  integration("支持无声 VFR 视频，并保持源视频的帧时间戳", async () => {
    await temporary(async root => {
      const options = await fixture(root, false, true);
      const result = await composite(options);
      expect(result.frames).toBe(6);
      expect(result.audioTracks).toBe(0);
      const timestamps = async (file: string) => {
        const data = JSON.parse(await run("ffprobe", ["-v", "error", "-select_streams", "v:0",
          "-show_frames", "-show_entries", "frame=best_effort_timestamp_time", "-of", "json", file]));
        return data.frames.map((frame: { best_effort_timestamp_time: string }) => Number(frame.best_effort_timestamp_time));
      };
      expect(await timestamps(options.output!)).toEqual(await timestamps(options.video));
      noIntermediates(root);
    });
  }, 30000);

  integration("已有成品不可覆盖", async () => {
    await temporary(async root => {
      const options = await fixture(root, false);
      writeFileSync(options.output!, "existing-result");
      await expect(composite(options)).rejects.toThrow("不覆盖");
      expect(readFileSync(options.output!, "utf8")).toBe("existing-result");
      noIntermediates(root);
    });
  }, 30000);

  integration("复制并验证全部音轨，而非只保留第一条", async () => {
    await temporary(async root => {
      const options = await fixture(root);
      const multi = join(root, "multi-audio.mp4");
      await run("ffmpeg", ["-v", "error", "-y", "-i", options.video, "-f", "lavfi", "-i",
        "sine=frequency=880:duration=1.7", "-map", "0:v", "-map", "0:a", "-map", "1:a",
        "-c:v", "copy", "-c:a", "aac", multi]);
      const result = await composite({ ...options, video: multi });
      expect(result.audioTracks).toBe(2);
      expect(result.audioUnchanged).toBe(true);
      expect(Number(result.duration)).toBeGreaterThan(1.69);
      noIntermediates(root);
    });
  }, 30000);

  integration("比例冲突先拒绝；明确选择 contain 后才留黑边", async () => {
    await temporary(async root => {
      const base = await fixture(root, false);
      const options = { ...base, rect: { x: 9, y: 17, width: 32, height: 16 }, radius: 0 };
      await expect(composite(options)).rejects.toThrow("比例");
      const output = join(root, "contain.png");
      await composite({ ...options, output: undefined, fit: "contain", previewOnly: output });
      const pixels = rawRgb(output);
      const position = (25 * 64 + 11) * 3;
      expect([...pixels.subarray(position, position + 3)]).toEqual([0, 0, 0]);
      noIntermediates(root);
    });
  }, 30000);

  integration("奇数画布不自动裁切或补白", async () => {
    await temporary(async root => {
      const options = await fixture(root, false);
      const image = join(root, "odd.ppm");
      writeFileSync(image, Buffer.concat([Buffer.from("P6\n65 97\n255\n"), Buffer.alloc(65 * 97 * 3)]));
      await expect(composite({ ...options, image })).rejects.toThrow("偶数画布");
      expect(existsSync(options.output!)).toBe(false);
      noIntermediates(root);
    });
  }, 30000);

  integration("独立音画偏移需先校准，不能静默丢弃", async () => {
    await temporary(async root => {
      const options = await fixture(root);
      const offset = join(root, "offset.mp4");
      await run("ffmpeg", ["-v", "error", "-y", "-i", options.video, "-itsoffset", "0.2",
        "-i", options.video, "-map", "0:v", "-map", "1:a", "-c", "copy", offset]);
      await expect(composite({ ...options, video: offset })).rejects.toThrow("时间偏移");
      noIntermediates(root);
    });
  }, 30000);

  integration("封装不兼容音轨失败后，无半成品和临时目录", async () => {
    await temporary(async root => {
      const options = await fixture(root, false);
      const pcm = join(root, "pcm.mkv");
      await run("ffmpeg", ["-v", "error", "-y", "-i", options.video, "-f", "lavfi", "-i",
        "sine=frequency=440:duration=1.5", "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "pcm_mulaw", pcm]);
      await expect(composite({ ...options, video: pcm })).rejects.toThrow("pcm_mulaw");
      expect(existsSync(options.output!)).toBe(false);
      noIntermediates(root);
    });
  }, 30000);

  integration("中断后没有成品或遗留临时目录", async () => {
    await temporary(async root => {
      const options = await fixture(root, false);
      const controller = new AbortController();
      // === 遮罩落盘后取消，覆盖实际清理路径 ===
      const interval = setInterval(() => {
        if (readdirSync(root).some(n => n.startsWith(".daftai-video-compositor-"))) controller.abort();
      }, 5);
      try { await expect(composite(options, controller.signal)).rejects.toThrow(); }
      finally { clearInterval(interval); }
      expect(existsSync(options.output!)).toBe(false);
      noIntermediates(root);
    });
  }, 30000);
});
