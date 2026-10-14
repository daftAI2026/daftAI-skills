import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { DEFAULT_PREFERENCES, writePreferences, type Mode } from "./shared";

function withFixture(check: (fixture: Fixture) => void): void {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "copywriting-cli-test-"));
  try {
    check(new Fixture(root));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

class Fixture {
  readonly skill: string;
  readonly home: string;
  readonly source: string;
  readonly preferences: string;
  readonly engineLog: string;
  private readonly preload: string;

  constructor(readonly root: string) {
    this.skill = path.join(root, "formatter");
    this.home = path.join(root, "home");
    this.source = path.join(root, "source.md");
    this.preferences = path.join(this.skill, ".daftAI-skills", "daftai-chinese-copywriting", "EXTEND.json");
    this.engineLog = path.join(root, "engine.log");
    this.preload = path.join(root, "mock-engine.ts");
    fs.mkdirSync(path.join(this.skill, "scripts"), { recursive: true });
    fs.mkdirSync(this.home);
    for (const name of ["main.ts", "shared.ts", "autocorrect.ts"]) {
      fs.copyFileSync(path.join(import.meta.dir, name), path.join(this.skill, "scripts", name));
    }
    fs.writeFileSync(this.source, "# 示例\n\n你好world\n");
    const enginePath = path.join(this.skill, "scripts", "autocorrect.ts");
    fs.writeFileSync(this.preload, `
import { mock } from "bun:test";
import { appendFileSync } from "node:fs";
const log = (message) => appendFileSync(${JSON.stringify(this.engineLog)}, message + "\\n");
mock.module(${JSON.stringify(enginePath)}, () => ({
  ensureAutocorrect() {
    log("ensure");
    return { available: true, installAttempted: false, installLog: "" };
  },
  runAutocorrect({ mode, content }) {
    log(mode);
    const correctedContent = content.replaceAll("你好world", "你好 world");
    return {
      changed: correctedContent !== content,
      correctedContent,
      lintOutput: "fixture: missing space",
      installAttempted: false,
      installLog: "",
    };
  },
}));
`);
  }

  run(...args: string[]) {
    return spawnSync(process.execPath, ["--preload", this.preload, "scripts/main.ts", ...args], {
      cwd: this.skill,
      env: { ...process.env, HOME: this.home, USERPROFILE: this.home },
      encoding: "utf8",
      timeout: 30_000,
    });
  }

  configure(mode: Mode, legacy = false): void {
    const filePath = legacy ? path.join(path.dirname(this.preferences), "EXTEND.md") : this.preferences;
    writePreferences(filePath, { ...DEFAULT_PREFERENCES, defaultMode: mode });
  }

  assertUnconfigured(): void {
    assert.equal(fs.existsSync(path.join(this.skill, ".daftAI-skills")), false);
    assert.equal(fs.existsSync(path.join(this.home, ".daftAI-skills")), false);
  }
}

let scenarios = 0;

withFixture((f) => {
  const result = f.run("review", "你好world");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Mode: review/);
  assert.match(result.stdout, /issues found/);
  assert.equal(fs.readFileSync(f.engineLog, "utf8"), "ensure\nreview\n");
  f.assertUnconfigured();
  scenarios++;
});

withFixture((f) => {
  const original = fs.readFileSync(f.source);
  const result = f.run("review", f.source);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(fs.readFileSync(f.source), original);
  assert.equal(fs.existsSync(path.join(f.root, "source-corrected.md")), false);
  assert.equal(fs.existsSync(path.join(f.root, "source-review.md")), false);
  f.assertUnconfigured();
  scenarios++;
});

for (const mode of ["stable", "quick", undefined]) {
  withFixture((f) => {
    const original = fs.readFileSync(f.source);
    const args = mode ? [mode, f.source] : [f.source];
    const result = f.run(...args);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /First-time setup required/);
    assert.equal(fs.existsSync(f.engineLog), false);
    assert.deepEqual(fs.readFileSync(f.source), original);
    assert.equal(fs.existsSync(path.join(f.root, "source-corrected.md")), false);
    f.assertUnconfigured();
    scenarios++;
  });
}

withFixture((f) => {
  f.configure("review");
  const preferences = fs.readFileSync(f.preferences);
  const result = f.run(f.source);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Mode: review/);
  assert.deepEqual(fs.readFileSync(f.preferences), preferences);
  assert.equal(fs.existsSync(path.join(f.root, "source-corrected.md")), false);
  scenarios++;
});

withFixture((f) => {
  f.configure("stable");
  const result = f.run("review", f.source);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Mode: review/);
  assert.equal(fs.existsSync(path.join(f.root, "source-corrected.md")), false);
  scenarios++;
});

for (const mode of ["quick", "stable"] as const) {
  withFixture((f) => {
    f.configure(mode);
    const original = fs.readFileSync(f.source);
    const result = f.run(f.source);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, new RegExp(`Mode: ${mode}`));
    assert.match(fs.readFileSync(path.join(f.root, "source-corrected.md"), "utf8"), /你好 world/);
    assert.deepEqual(fs.readFileSync(f.source), original);
    if (mode === "stable") assert.match(result.stdout, /AI post-processing/);
    scenarios++;
  });
}

withFixture((f) => {
  f.configure("quick", true);
  const result = f.run(f.source);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Mode: quick/);
  assert.equal(fs.existsSync(f.preferences), false);
  assert.equal(fs.existsSync(path.join(path.dirname(f.preferences), "EXTEND.md")), true);
  scenarios++;
});

for (const scope of ["project", "user"] as const) {
  withFixture((f) => {
    const result = f.run("init", "--mode", "quick", "--scope", scope);
    assert.equal(result.status, 0, result.stderr);
    const directory = path.join(scope === "project" ? f.skill : f.home, ".daftAI-skills", "daftai-chinese-copywriting");
    const jsonPath = path.join(directory, "EXTEND.json");
    assert.match(result.stdout, /EXTEND\.json/);
    assert.equal(JSON.parse(fs.readFileSync(jsonPath, "utf8")).default_mode, "quick");
    assert.equal(fs.existsSync(path.join(directory, "EXTEND.md")), false);
    assert.equal(fs.existsSync(f.engineLog), false);
    const next = f.run("你好world");
    assert.equal(next.status, 0, next.stderr);
    assert.match(next.stdout, /Mode: quick/);
    scenarios++;
  });
}

withFixture((f) => {
  f.configure("quick", true);
  fs.writeFileSync(f.preferences, '{"chunk_threshold":0}');
  const result = f.run("review", f.source);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Invalid preferences field/);
  assert.equal(fs.existsSync(f.engineLog), false);
  scenarios++;
});

console.log(`cli.test.ts passed (${scenarios} scenarios)`);
