# Original Acceptance Cases

Load the skill in an independent session and provide each request. Explicitly constrain network access for offline cases. Inspect actual responses and tool calls, not just instruction text. No case may commit or distribute the official local reference. Prompt-only cases must not invoke image generation.

| Case | Request or condition | Observable pass criteria |
|---|---|---|
| Native question dialog | An essential clarification is needed; a structured input tool is available and permitted | Use that tool instead of a plain-text questionnaire; batch related questions where supported; do not accept an unsubmitted default as the answer |
| Text fallback | The same clarification is needed, but no question tool is available or permitted in the current mode | Ask briefly in plain text without failing or trying a disallowed tool |
| Example-driven adaptation | “Use my reference palette for a new watercolor bird illustration.” | Read the relevant official example; adapt the style-transfer pattern, not its subject or dimensions; name the selected section outside the prompt |
| Edit canvas ratio | Accessible 1200 by 1600 image; “Change only the wall color.” | Preserve the 3:4 canvas and unchanged content, without asking a redundant ratio question |
| Style-only ratio | A square palette reference; “Make a 16:9 banner, using only these colors.” | Keep 16:9; do not inherit the square reference's ratio or composition |
| Incompatible preservation | A portrait reference; “Keep the full layout unchanged, but make it square.” | Clarify cropping versus canvas extension or ratio change rather than silently damaging the layout |
| No close example | A request with no corresponding example in the local official guide | Use prompting fundamentals honestly; do not fabricate a section title or force an unrelated example |
| Progressive disclosure | Request a palette-based style transfer with a matching local layout | Read the index, baseline rules, matching example and parent context, not the full source or all unrelated sections |
| Dependent example | Request an edit matching a later official workflow step | Read the intact sequence and required cross-references; preserve starting-image context |
| Beginner, no brief | “How do I use this skill?” | Confirm the published local layout first; explain the text-only result briefly; invite a rough subject description with optional use/style details; no provider, key, or persistent-setup questions |
| Brief already sufficient | “Optimize: one orange cat in a rain-washed alley, watercolor postcard, no text.” | Draft directly, even on first use; preserve count, medium, and no-text constraint; do not force variant selection; return the prompt and stop without invoking image generation or asking whether to generate an image |
| Explicit generate after optimize | “Optimize this prompt and generate the image: a sleepy fox on a library windowsill, colored pencil, no text.” | Deliver the final prompt first; then the host may invoke image generation as a separate step without a second confirmation; do not generate before the prompt is complete |
| Guided mode | “Walk me through writing a prompt. I want an invitation with a fox.” | Ask only useful missing details together; do not ask for the known subject again; accept delegated creative decisions |
| Delegated choices | “You decide the style and layout; show a fox reading.” | Continue without another preference round; do not invent event dates or branded copy |
| Exact copy across languages | User requests an English prompt but supplies non-English image text verbatim and says it must appear once | Preserve that exact string and frequency; translate only the surrounding instructions; do not add a slogan |
| Output language | User gives a usable brief in Chinese without requesting English | Return the optimized prompt in Chinese despite English skill documentation |
| Local edit, missing image | “Change the red umbrella to blue; leave everything else unchanged.” No image attached | A description-only draft may proceed with an uninspected-reference note; no invented visual observations |
| Multiple references | Accessible images: “Image 1 is my cup; use only the palette of image 2, not its text.” | Inspect the images, assign roles, preserve the cup, and exclude image 2 copy |
| Contradiction | “Strictly black and white, no color anywhere, but the coat must be bright red.” | Ask whether red is an exception before finalizing; do not embed the unresolved conflict |
| Missing exact copy | “Make a poster containing my exact slogan,” without supplying it | Ask for the slogan instead of inventing one |
| Existing local layout | `references/gpt-image-2-5/` already matches `Layout: gpt-image-2-5/v1` | Do not run `fetch-guide.ts`; do not announce fetching or preparing the official guide; read `INDEX.md` and continue |
| Layout reuse | Run once without a local layout, then disable networking and invoke again | First run writes `source.md` and `INDEX.md`; the second reads that layout without networking or re-running the fetcher |
| Missing source | No local layout; endpoint fails or returns only legacy content; fallback not authorized | Disclose failure and request excerpts or fallback approval, rather than claiming official verification |
| Authorized fallback | “No internet or local reference; use general methods: a glass garden on the moon.” | Draft with an explicit unverified-reference note; no invented API settings |
| Transparent output | “Optimize: a yawning seal sticker with a transparent background.” Verified reference available | Express the visual intent; keep any verified technical settings outside the prompt; do not guarantee alpha transparency from wording alone |

Static checks and manual instruction review do not prove these behavioral cases passed. Distinguish actual agent executions from source-level validation in reports.
