# Execution Discipline

Use this reference when turning a selected `DESIGN.md` into a built interface. It adds operational guardrails so the result feels authored instead of generated.

## Design Read

Before substantial code changes, state one sentence in your own notes or user-facing plan:

`Reading this as: <page/app kind> for <audience>, with a <visual language>, leaning toward <implementation posture>.`

Examples:

- `Reading this as: technical product landing for engineering buyers, with a precise dark documentation language, leaning toward restrained motion and real product screenshots.`
- `Reading this as: creative portfolio for art directors, with an editorial image-led language, leaning toward asymmetric grids and kinetic type.`
- `Reading this as: product workspace for daily operators, with a dense utilitarian language, leaning toward stable panels and low motion.`

If two readings would produce very different designs, ask one concise clarifying question. Otherwise declare the read and continue.

## Execution Dials

Set these internally from the brief, `TASTE.md`, and source `DESIGN.md`:

- Layout variance: 1 means symmetrical and familiar; 10 means highly asymmetric and experimental.
- Motion intensity: 1 means static plus simple hover states; 10 means cinematic, scroll-led, or physics-like.
- Visual density: 1 means airy and gallery-like; 10 means packed and operational.

Use the dials to govern choices:

- Trust-first, regulated, or accessibility-critical: lower variance, lower motion, medium density.
- Premium consumer: medium variance, medium motion, low-medium density.
- Creative studio, campaign, or art object: high variance, high motion, low-medium density.
- Developer tool landing: medium variance, low-medium motion, medium density.
- Daily-use product workspace: low-medium variance, low motion, higher density.

## Design Locks

Before implementation, choose and maintain:

- Accent lock: one accent system for the page unless semantic status colors require exceptions.
- Shape lock: one radius grammar, such as sharp, soft, or pill, with explicit component exceptions.
- Type lock: display, body, mono/utility roles; no random mixed-family emphasis.
- Theme lock: one neutral temperature and surface system.
- CTA lock: one label per action intent across nav, hero, body, and footer.
- Asset lock: real or generated imagery when the source style depends on photography, media, product shots, or logos.

## Anti-Default Rules

Avoid these unless the selected source or user brief explicitly requires them:

- centered hero plus three equal feature cards
- vague purple-blue gradients or glows as the main personality
- decorative glass panels on every surface
- tiny uppercase eyebrows above every section
- repeated zigzag image/text sections
- fake product screenshots made from empty boxes
- feature grids with more cells than real content
- placeholder text acting as form labels
- generic circular spinners where skeletons would better match the layout

## Component Completeness

Build the states a real product needs:

- loading state that matches final layout shape
- empty state that gives direction
- error state with a fix path
- active/pressed state for primary controls
- focus state visible on keyboard navigation
- reduced-motion fallback for nonessential animation

## Preflight

Check before finishing:

- Hero or primary workspace has one job and fits the viewport.
- Main headline is readable and not clipped; italic descenders have room.
- Navigation stays on one line at desktop or collapses deliberately.
- Primary CTA label fits on one line at desktop.
- Button and form contrast passes visually and semantically.
- Accent, shape, type, and CTA language stay consistent.
- Multi-column sections have explicit mobile behavior.
- Every visual asset is real, generated, or clearly identified as a needed placeholder.
