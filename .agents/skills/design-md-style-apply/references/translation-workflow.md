# Translation Workflow

Use this reference after selecting and reading one source `DESIGN.md`.

## Source Extraction Notes

Create a compact internal map:

- Palette: exact hex values, semantic roles, alpha ladders, and forbidden uses.
- Typography: display/body/utility roles, sizes, casing, weight, letter spacing, and fallback fonts.
- Surfaces: page canvas, cards, panels, media areas, overlays, dividers, and elevation.
- Components: buttons, inputs, tabs, nav, cards, tables, badges, dialogs, and empty states.
- Layout: grids, max widths, section rhythm, density, hero or workspace strategy.
- Motion: allowed transitions, hover behavior, loading states, and reduced-motion fallback.
- Signature: the one element that makes the source recognizable beyond color.

## Product Mapping

Translate by role:

- Source hero image becomes product-relevant media, live preview, data visualization, or workspace screenshot.
- Source editorial headings become product-specific task headings.
- Source cards become real product entities, not generic feature cards.
- Source code blocks become actual examples only for developer products.
- Source luxury whitespace becomes deliberate focus, not missing content.
- Source density becomes scannable product information, not cramped filler.

## Implementation Checks

- Define tokens once if the style touches more than one component.
- Use CSS custom properties, theme objects, or Tailwind config according to the repo's existing practice.
- Keep proprietary font names as desired intent but provide practical fallbacks unless the font already exists in the project.
- Preserve accessible focus styles even when the source has subtle chrome.
- Use real imagery or generated assets when the source depends on photography, media, or product visuals.

## Anti-Clone Rules

- Remove source logos, marks, taglines, and protected product names.
- Do not recreate a specific famous page section one-for-one.
- Do not imply endorsement or affiliation.
- Keep the user's product vocabulary in all UI copy.
