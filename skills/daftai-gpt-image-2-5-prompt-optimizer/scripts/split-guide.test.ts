import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { ensureSections, splitGuide } from "./split-guide";

const source = `<!-- Source: original test fixture -->
## GPT Image 2.5 prompting guide
## Overview
Overview text.
## Prompting fundamentals
Shared rules.
## Generate images
Context for all generation examples.
### Example A
Explanation and settings.
\`\`\`text
## Not a heading
### Nor an example
Draw a leaf.
\`\`\`
![Input](https://example.com/image.png)
<figure>Original markup</figure>
### Example B
Preserved text referencing [Example A](#example-a).
## Refine an image across turns
Use the previous result.
### First turn
Create something.
### Second turn
Change the previous image.
#### Detail
Keep this nested step.
## Run a complete example
### Runnable sequence
~~~python
## Code, not a section
~~~
## Check the result
Final check.
`;

test("slices reconstruct the source exactly, with examples and parent context", () => {
  const slices = splitGuide(source);
  expect(slices.map(s => s.text).join("")).toBe(source);
  const a = slices.find(s => s.title === "Example A")!;
  expect(a.text).toContain("Explanation and settings.");
  expect(a.text).toContain("<figure>Original markup</figure>");
  expect(slices.find(s => s.file === a.context)?.text).toContain("Context for all generation");
  expect(slices.some(s => s.title === "Not a heading")).toBe(false);
  expect(slices.find(s => s.title === "Refine an image across turns")?.text).toContain("### Second turn");
  expect(slices.find(s => s.title === "Run a complete example")?.text).toContain("~~~python");
});

test("preserves CRLF and unknown sections without guessing how to subdivide them", () => {
  const raw = source.replaceAll("\n", "\r\n") + "## Future section\r\n### Unknown flow\r\nKeep together.\r\n";
  const slices = splitGuide(raw);
  expect(slices.map(s => s.text).join("")).toBe(raw);
  expect(slices.at(-1)?.text).toContain("### Unknown flow");
  expect(() => splitGuide(source + "```text\nunfinished")).toThrow("Unclosed");
});

test("stable index, missing-file repair, and new source generations", async () => {
  const dir = await mkdtemp(join(tmpdir(), "split-guide-test-"));
  try {
    const path = join(dir, "source.md");
    const first = await ensureSections(path, source);
    const mtime = (await stat(first.indexPath)).mtimeMs;
    const again = await ensureSections(path, source);
    expect(again.indexPath).toBe(first.indexPath);
    expect((await stat(first.indexPath)).mtimeMs).toBe(mtime);
    const slice = splitGuide(source).find(s => s.title === "Example A")!;
    const slicePath = join(dirname(first.indexPath), slice.file);
    await rm(slicePath);
    await ensureSections(path, source);
    expect(await readFile(slicePath, "utf8")).toBe(slice.text);
    await writeFile(slicePath, "corrupt");
    await ensureSections(path, source);
    expect(await readFile(slicePath, "utf8")).toBe(slice.text);
    const index = await readFile(first.indexPath, "utf8");
    expect(index).toContain("Second turn");
    expect(index).toContain(slice.context!);
    const changed = await ensureSections(path, source + "New ending.\n");
    expect(changed.indexPath).not.toBe(first.indexPath);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
