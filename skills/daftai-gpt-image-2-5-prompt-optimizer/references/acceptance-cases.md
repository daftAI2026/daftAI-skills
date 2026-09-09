<!--
[INPUT]: 依赖 SKILL.md 的输出契约及模拟用户请求、来源可用性条件。
[OUTPUT]: 提供人工行为验收标准，不以固定措辞或图像质量作为通过条件。
[POS]: 技能维护的回归样例；独立于运行时来源读取，不包含官方示例。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->

# Original Acceptance Cases

Load the skill in an independent session and provide each request. Explicitly constrain network access for offline cases. Inspect actual responses and tool calls, not just instruction text. No case may invoke image generation or commit/distribute the official cache.

| Case | Request or condition | Observable pass criteria |
|---|---|---|
| Native question dialog | An essential clarification is needed; a structured input tool is available and permitted | Use that tool instead of a plain-text questionnaire; batch related questions where supported; do not accept an unsubmitted default as the answer |
| Text fallback | The same clarification is needed, but no question tool is available or permitted in the current mode | Ask briefly in plain text without failing or trying a disallowed tool |
| Example-driven adaptation | “Use my reference palette for a new watercolor bird illustration.” | Read the relevant official example; adapt the style-transfer pattern, not its subject or dimensions; name the selected section outside the prompt |
| Edit canvas ratio | Accessible 1200 by 1600 image; “Change only the wall color.” | Preserve the 3:4 canvas and unchanged content, without asking a redundant ratio question |
| Style-only ratio | A square palette reference; “Make a 16:9 banner, using only these colors.” | Keep 16:9; do not inherit the square reference's ratio or composition |
| Incompatible preservation | A portrait reference; “Keep the full layout unchanged, but make it square.” | Clarify cropping versus canvas extension or ratio change rather than silently damaging the layout |
| No close example | A request with no corresponding example in the cached guide | Use prompting fundamentals honestly; do not fabricate a section title or force an unrelated example |
| Beginner, no brief | “How do I use this skill?” | Prepare the reference first; explain the text-only result briefly; invite a rough subject description with optional use/style details; no provider, key, or persistent-setup questions |
| Brief already sufficient | “Optimize: one orange cat in a rain-washed alley, watercolor postcard, no text.” | Draft directly, even on first use; preserve count, medium, and no-text constraint; do not force variant selection |
| Guided mode | “Walk me through writing a prompt. I want an invitation with a fox.” | Ask only useful missing details together; do not ask for the known subject again; accept delegated creative decisions |
| Delegated choices | “You decide the style and layout; show a fox reading.” | Continue without another preference round; do not invent event dates or branded copy |
| Exact copy across languages | User requests an English prompt but supplies non-English image text verbatim and says it must appear once | Preserve that exact string and frequency; translate only the surrounding instructions; do not add a slogan |
| Output language | User gives a usable brief in Chinese without requesting English | Return the optimized prompt in Chinese despite English skill documentation |
| Local edit, missing image | “Change the red umbrella to blue; leave everything else unchanged.” No image attached | A description-only draft may proceed with an uninspected-reference note; no invented visual observations |
| Multiple references | Accessible images: “Image 1 is my cup; use only the palette of image 2, not its text.” | Inspect the images, assign roles, preserve the cup, and exclude image 2 copy |
| Contradiction | “Strictly black and white, no color anywhere, but the coat must be bright red.” | Ask whether red is an exception before finalizing; do not embed the unresolved conflict |
| Missing exact copy | “Make a poster containing my exact slogan,” without supplying it | Ask for the slogan instead of inventing one |
| Cache reuse | Run once without a cache, then disable networking and invoke again | First run saves the complete 2.5 section; the second reads the local reference without networking |
| Missing source | No cache; endpoint fails or returns only legacy content; fallback not authorized | Disclose failure and request excerpts or fallback approval, rather than claiming official verification |
| Authorized fallback | “No internet or cache; use general methods: a glass garden on the moon.” | Draft with an explicit unverified-reference note; no invented API settings |
| Transparent output | “Optimize: a yawning seal sticker with a transparent background.” Verified reference available | Express the visual intent; keep any verified technical settings outside the prompt; do not guarantee alpha transparency from wording alone |

Static checks and manual instruction review do not prove these behavioral cases passed. Distinguish actual agent executions from source-level validation in reports.
