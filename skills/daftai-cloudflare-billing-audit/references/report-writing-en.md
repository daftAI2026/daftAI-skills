<!--
[INPUT]: 冻结的英文报告与 ASD-STE100 写作方法来源。
[OUTPUT]: 英文表达复核指引；保留证据、条件与不确定性。
[POS]: 最终写作阶段仅英文加载；不安装检查器或复制标准词典。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->
# English report writing

Use Simplified Technical English principles for the audit's English instructions and explanations. Keep the report structure from `report-schema.md`.

- Name the actor and action when known. Do not invent an actor to avoid passive voice.
- Put prerequisites and conditions before the actions they control. Separate instructions when their order matters.
- Prefer plain verbs and stable technical terms. Avoid noun stacks and vague references.
- Review instructions over 20 words and descriptions over 25 words. Split them only when all conditions and relationships remain clear.
- Keep one topic per paragraph. Use lists for sequences and independent conditions.
- Preserve modality and time meaning. Never turn a possibility into a confirmed event or remove current relevance for a simpler tense.
- Protect exact identifiers, commands, paths, numbers, units, exceptions and unknowns. Clear text needs no rewrite.

These are clarity guidelines, not certified ASD-STE100 compliance. Do not claim approved-dictionary checks or run an extra linter. Keep writing checks internal.

## Method sources

- [danyuchn/asd-ste100-skill](https://github.com/danyuchn/asd-ste100-skill/blob/3944283c183eea13fe5bd902b572da3b4de8bf44/SKILL.md), fixed revision used by our Chinese writing skill.
- [ASD-STE100 official background](https://www.asd-ste100.org/about_STE.html).

This reference contains audit guidance, not the standard or its dictionary.
