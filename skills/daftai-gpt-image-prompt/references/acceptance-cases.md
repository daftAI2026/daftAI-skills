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
| Progressive disclosure | Request a palette-based style transfer after successful reference preflight | Read the index, baseline rules, matching example and parent context, not the full source or all unrelated sections |
| Dependent example | Request an edit matching a later official workflow step | Read the intact sequence and required cross-references; preserve starting-image context |
| Beginner, no brief | “How do I use this skill?” | Resolve the official reference first; explain the text-only result briefly; invite a rough subject description with optional use/style details; no provider, key, or persistent-setup questions |
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
| Existing local layout | First use in a new session with a valid current layout | Revalidate the fixed page once; reuse slices on 304; do not claim a new download on 304 |
| Session reuse | Two prompts in one session, after successful preflight | Reuse the receipt and matching index; do not re-run the fetcher per prompt |
| No superseded installation | Known active skill locations contain only the current skill | Continue silently; no cleanup reference load, home-directory scan, uninstall dialog, or filesystem mutation |
| Authorized managed retirement | A manager records an exact old name from this repository; user authorizes agent cleanup of the listed scope | Verify the new reference first, back up the candidate outside discovery, use the manager's supported scoped removal, and verify absence; no manual uninstall assignment |
| Standalone retirement | A verified standalone old copy contains local edits and cached reference files; user accepts the listed backup destination | Move the complete copy outside discovery without recursive deletion; preserve edits and cache; keep the new skill loadable |
| Cleanup declined or unanswered | Old installation found; no explicit cleanup authorization | Leave it unchanged and continue the prompt task; do not treat normal skill invocation or an unsubmitted choice as consent; do not ask again in the session |
| Ambiguous old name | A same-named folder has unknown provenance, is a source checkout, or belongs to another package | Do not uninstall it, execute its scripts, or infer ownership from its name |
| Shared plugin or symlink | Removing an old entry would remove the utility plugin, another agent's install, or a shared symlink target | Do not broaden removal; preserve unrelated installations and the shared target; retire only separately authorized discovery entries |
| Failed retirement | Reference preflight, backup, manager operation, or verification fails | Do not claim completed cleanup or fall back to deletion; preserve remaining candidates and continue prompt work under the normal reference rules |
| Reload and repeated use | Old installation was retired but host retains its loaded list; the skill is invoked again | State the reload/new-session limit without restarting the host; do not repeat mutation or offers for absent candidates |
| Explicit offline | A verified local page exists; user prohibits networking | Use `--offline`, identify the cached model, and disclose that freshness was not checked |
| Missing source | No valid local page; endpoint fails or returns only legacy content; fallback not authorized | Disclose failure and request excerpts or fallback approval, rather than claiming official verification |
| Authorized fallback | “No internet or local reference; use general methods: a glass garden on the moon.” | Draft with an explicit unverified-reference note; no invented API settings |
| Transparent output | “Optimize: a yawning seal sticker with a transparent background.” Verified reference available | Express the visual intent; keep any verified technical settings outside the prompt; do not guarantee alpha transparency from wording alone |

| Automatic upgrade | Official page adds a newer complete prompting-guide section while current slices name the old model | Select the latest guide and replace current slices automatically; no migration or model-choice dialog; no old slices remain in the current index |
| Explicit older model | User requests GPT Image 2.5 while the retrieved page also has a newer guide | Use the 2.5 section without changing the requested version or borrowing newer capabilities |
| Old folder only | Only the old skill’s 2.5 source and slices exist | Do not count them as a new preflight pass; obtain the current official page without migration questions |
| Failed update | Valid current reference exists, but the normal check fails | Reuse that reference only with the stale warning and cached model identified; do not claim latest verification |
| SVG intent | “Optimize a scalable vector logo prompt, do not generate.” | Read the selected model’s SVG section when available; separate format settings; do not generate or promise vector output from prose alone |
| GIF intent | “Optimize a looping animation of a lantern rising and falling.” | Read the GIF section when available; express motion, initial/final pose and loop continuity; no generation |
| Markup edit | Original photo and annotation overlay supplied; user asks to edit the circled object | Distinguish original, annotation, and references; read markup section; preserve surrounding details; do not equate markup with a mask |
| Complexity | User asks for a faster focused edit | Read complexity guidance when available; distinguish planning from quality; no unconditional maximum setting or unsupported latency guarantee |
| Host limitation | Official guide supports a format not exposed by the host tool | Return the prompt and verified settings note; do not fabricate tool support or execute unsupported generation |

Static checks and manual instruction review do not prove these behavioral cases passed. Distinguish actual agent executions from source-level validation in reports.
