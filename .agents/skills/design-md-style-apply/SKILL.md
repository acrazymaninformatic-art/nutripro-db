---
name: design-md-style-apply
description: Apply a selected voltagent/awesome-design-md DESIGN.md aesthetic to an actual product UI, website, dashboard, app shell, or redesign. Use when the user names a style or brand from DESIGN.md, provides a DESIGN.md path, asks to build in the same style/aesthetic, or wants Codex to translate a reference design language into working frontend code.
---

# DESIGN.md Style Apply

## Overview

Turn a source `DESIGN.md` into a product-specific interface. The goal is not a themed skin; it is a coherent translation of the source's design DNA into the user's product, with real content, responsive behavior, and implementation details that match the existing codebase. If the project has `TASTE.md`, use it to decide what to emphasize, omit, and critique.

## Resolve the Source

If the user gives a path, read that `DESIGN.md` directly. If the user gives a brand, style, category, or mood, resolve it through the local checkout of `https://github.com/voltagent/awesome-design-md`:

```bash
python3 "$SKILLS_SCRIPTS/design_md_catalog.py" ensure
python3 "$SKILLS_SCRIPTS/design_md_catalog.py" search "linear precise project management"
python3 "$SKILLS_SCRIPTS/design_md_catalog.py" path linear.app
```

Load only the selected source file plus `references/translation-workflow.md` and `references/execution-discipline.md`. Also load the project `TASTE.md` if present. Do not load the entire catalog unless selection is still unresolved.

## Translation Workflow

### 1. Extract the source DNA

- atmosphere and product posture
- color tokens and semantic roles
- typography roles, weights, spacing, and casing
- component geometry, state treatment, and density
- layout rhythm, media strategy, and signature element
- explicit do/don't constraints

**Done when:** all 7 DNA dimensions (palette, typography, surfaces, components, layout, motion, signature) are recorded in your internal map.

### 2. Set the dials and locks

- write a one-line design read
- set the execution dials: layout variance, motion intensity, and visual density
- set the design locks: accent, shape, type, theme, CTA language, and asset strategy
- identify anti-default patterns that would weaken this brief

**Done when:** the design read, three dials, and five locks are set.

### 3. Map the DNA to the user's product

- replace source-specific content with real product concepts
- adapt the signature element to the product's workflow
- keep semantics intact, such as primary actions, warnings, code/data surfaces, or media moments
- remove source brand marks, logos, slogans, proprietary product names, and exact hero copy
- use `TASTE.md` to decide where to spend visual drama and what anti-patterns to avoid

**Done when:** every DNA dimension has a concrete product mapping.

### 4. Implement through the repo's existing patterns

- use existing framework, component structure, design tokens, icon library, routing, and state conventions
- introduce CSS variables or token objects when the repo already uses tokens or the change spans multiple components
- keep the edit scope tight unless a shared token layer is clearly needed

**Done when:** code compiles and renders without errors.

### 5. Verify visually

- run the app when possible
- inspect desktop and mobile screenshots
- check that the source's strongest constraints are visible in the implemented UI
- fix text overflow, contrast, focus states, and responsive layout problems before finishing
- run the preflight checks in `references/execution-discipline.md`

**Done when:** all preflight checks pass.

## Guardrails

- Do not produce a brand clone. Translate aesthetics, not identity.
- Do not mix multiple famous styles unless the user asks. A muddled hybrid usually feels less designed than a single strong source.
- Do not treat color alone as style. A successful translation also carries typography, spacing, density, component geometry, and interaction behavior.
- Do not ship generic default structure when the source style demands a stronger layout. Centered hero plus three cards is a fallback, not a design concept.
- Do not paste large chunks of `DESIGN.md` into the final answer. Summarize the applied decisions and point to the source path.
- Respect the product's domain. If a source style's hero-first marketing structure conflicts with a dense tool workflow, preserve its tokens and interaction grammar while designing the workspace first.
- When `TASTE.md` and `DESIGN.md` conflict, follow explicit user instructions first, then `TASTE.md` judgment, then source `DESIGN.md` details.

## Final Response

State the selected style, the source file, the main implementation changes, and how you verified them. If the output should be audited, invoke or follow `$design-md-style-audit`.
