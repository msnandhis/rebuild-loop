# ReBuild Loop Design System — Field Ledger

Status: approved foundation, revised 29 July 2026.

## Design thesis

ReBuild Loop should feel like a professional site-survey workbook crossed with a marked-up drawing set: photographic evidence, ruled ledgers, revision marks, numbered inspection notes, and formal sign-off blocks.

It must not resemble an interchangeable AI startup or generic SaaS dashboard. Agent behavior appears inline as proposed observations, evidence requests, decision gates, and revision history. There is no chatbot-first experience.

## Rejected patterns

- Purple, blue, neon, mesh, or brand gradients used as decoration.
- Glassmorphism, glow, blur, ambient blobs, or dark cinematic surfaces.
- Bento grids, generic KPI quartets, donut scores, and fake real-time feeds.
- Oversized centered marketing headings with excessive empty space.
- Floating assistants, sparkles, or an “AI” navigation destination.
- Excessive rounded cards, pills, drop shadows, and decorative animation.
- Pulsing controls, hover-scale cards, animated background elements, or scroll-reveal theatre.
- Stock construction imagery used as decoration rather than evidence.

The supplied brand direction includes gradients, glass overlays, rounded cards, and broad `transition-all` treatments. Those patterns are deliberately excluded from the operational product because they reduce clarity and resemble generic AI-product styling. Its brand colors, typography, accessibility, responsive, and form guidance remain applicable.

## Product posture

- Professional, precise, calm, and evidence-led.
- Daylight-friendly light interface for field and office use.
- Dense enough for quantity surveyors without making capture difficult on mobile.
- Honest about uncertainty, missing evidence, synthetic demand, and professional review.
- Human decisions are visually more authoritative than model proposals.

## Color tokens

Use semantic tokens only. Do not place raw color values inside components.

| Token            |     Value | Purpose                                     |
| ---------------- | --------: | ------------------------------------------- |
| `--brand`        | `#FF0076` | Brand mark, large accents, selected markers |
| `--brand-action` | `#D00060` | Accessible CTA background/text on white     |
| `--brand-black`  | `#12131A` | Headers, primary text, dark surfaces        |
| `--brand-light`  | `#F0FAFF` | Application canvas and light sections       |
| `--canvas`       | `#F0FAFF` | Global application background               |
| `--paper`        | `#FFFFFF` | Primary work surface                        |
| `--paper-subtle` | `#F6F6F7` | Grouped rows and secondary surfaces         |
| `--paper-raised` | `#FFFFFF` | Menus and modal sheets only                 |
| `--ink`          | `#12131A` | Primary text                                |
| `--ink-muted`    | `#52545E` | Secondary text                              |
| `--rule`         | `#D9DADE` | Borders and ruled separators                |
| `--rule-strong`  | `#8B8D96` | Emphasized boundaries                       |
| `--evidence`     | `#4C3A8A` | Evidence references and source focus        |
| `--attention`    | `#A34B00` | Missing information and pending review      |
| `--blocked`      | `#B42318` | Specialist/safety block                     |
| `--verified`     | `#087A55` | Human-verified and reusable states          |
| `--rubble`       | `#625C66` | EPR-relevant mineral register               |
| `--focus`        | `#FF0076` | Keyboard focus ring                         |

`#FF0076` with white text has only 3.81:1 contrast, so ordinary-size CTA text must not use that pairing. Primary buttons use `--brand-action` with white text; the brighter brand magenta remains a brand/focus/accent color. Success green also uses dark text or a pale success background rather than white text.

Status colors must always be paired with text and an icon or pattern. Color never carries meaning alone. Purple is a functional evidence color only, never a decorative gradient.

## Typography

- Marketing headings and major page titles: **Quicksand**, weights 600 and 700.
- Interface, forms, tables, and narrative: **Inter**, weights 400, 500, 600, and 700.
- Evidence IDs, quantities, timestamps, checksums, and rule versions: **IBM Plex Mono**, weights 400 and 500.
- Quicksand is not used for dense tables, form labels, metadata, or long paragraphs.

| Role             | Size/line-height                |   Weight |
| ---------------- | ------------------------------- | -------: |
| Marketing H1     | `56/62` desktop, `38/44` mobile |      700 |
| Page title       | `36/42` desktop, `28/34` mobile |      700 |
| Section title    | `20/28`                         |      600 |
| Subsection title | `16/24`                         |      600 |
| Body             | `16/24` mobile, `15/23` desktop |      400 |
| Dense ledger     | `14/20` desktop only            |      400 |
| Label            | `13/18`                         |      500 |
| Metadata         | `12/18`                         | 500 mono |

Long-form text is limited to 70 characters. Tabular figures are enabled for numeric columns.

## Shape, spacing, and depth

- Four-pixel base grid; principal rhythm uses 8, 16, 24, 32, 48, and 64 pixels.
- Marketing sections use `64px` vertical space on mobile and `96px` on desktop; application screens remain denser.
- Controls are at least 44 pixels high; mobile primary controls are 48 pixels.
- Radius: 4 pixels for ledger cells, 8 pixels for inputs and operational controls, 12 pixels for dialogs and feature surfaces, full radius only for primary/secondary marketing buttons and compact status tags.
- Default work surfaces use borders and background contrast, not shadows.
- One subtle shadow token is reserved for menus, modal sheets, and a small number of marketing feature cards.
- Hover feedback changes border, background, or shadow only. Components do not scale.
- Transitions target specific properties and last 120–200 milliseconds; never use `transition-all`.
- Icons use one outline family at a consistent 1.75-pixel stroke.

## Layout model

### Global navigation

Global navigation contains Projects, Method & limitations, and the signed-in user menu. There is no permanent AI destination.

### Project stages

Site brief → Capture → Review → Materials ledger → Recovery routes → Recovery pack.

Every stage has a deep link. Unavailable stages remain visible and state the exact blocking reason.

### Desktop review workbench

- Evidence viewer: 44–48%.
- Proposed observation and unknowns: 32–36%.
- Human decision rail: 20% minimum 280 pixels.

The three panes share one viewport but must not introduce nested scrolling unless the evidence viewer requires it.

### Mobile

Mobile is a site companion, not a compressed desktop application. Prioritize today’s evidence requests, full-screen capture, measurements, upload state, and sync/retry. Ledger rows open a full detail sheet. Never force three-pane comparison or wide tables onto a phone.

## Domain component language

- `ProjectStageRail`
- `ProjectContextHeader`
- `CaptureManifest`
- `EvidenceViewer`
- `EvidenceReference`
- `CandidateReviewWorkbench`
- `ClarificationTask`
- `DecisionGate`
- `MaterialLedger`
- `MaterialLotRow`
- `RouteSheet`
- `MatchScoreBreakdown`
- `DeconstructionSequence`
- `TraceDrawer`
- `ApprovalBlock`
- `LimitationNotice`

Do not reduce these patterns to generic `Card` or `StatTile` components. Shared UI contains primitives; workflow meaning stays in feature code.

## Interaction and motion

- Feedback appears within 100 milliseconds.
- State transitions use 120–180 milliseconds.
- Animate only opacity and transform.
- Motion must express cause and effect: evidence arrived, status changed, row moved, or decision revised.
- No entrance reveals, parallax, confetti, pulsing decoration, count-up metrics, or animated gradients.
- Support `prefers-reduced-motion`; the full product remains understandable with motion disabled.

The signature transition is a decision revision: new close-up evidence arrives, the prior route is marked superseded, and the item moves to specialist review with an inline reason.

## CSS architecture

- Tailwind CSS utilities are the primary styling method for new and migrated components.
- Map the semantic tokens in this document into Tailwind theme variables; components must not use raw arbitrary brand/status colors.
- Shared primitives live in `packages/shared/ui`; domain layout and workflow meaning remain in feature components.
- Extract a reusable component only after the same visual/interaction contract appears at least twice.
- Existing CSS Modules may remain during migration, but a touched component should use one styling method rather than mixing module classes and long utility strings.
- Avoid opaque mega-classes: order utilities by layout, spacing, typography, color, state, and responsive behavior.
- Use specific transition utilities such as `transition-colors` or `transition-shadow`, never `transition-all`.

## Accessibility and field usability

- WCAG AA: normal text at least 4.5:1 and UI graphics at least 3:1.
- Focus indicator is 2–3 pixels and never removed.
- Complete keyboard navigation follows the visual order.
- Evidence hotspots are focusable and have a textual evidence-reference alternative.
- Images have meaningful alt text; video has captions/transcript and timecode references.
- Confidence is expressed in words and required action, never only a number/color.
- Every input has a visible label; errors appear adjacent and are announced.
- Async upload and analysis changes use polite live regions.
- Test at 375, 768, 1024, and 1440 pixels; 200% zoom; keyboard-only; reduced motion; bright-light and low-bandwidth conditions.

## Content rules

- Prefer “model proposal” over “AI result.”
- Prefer “accept observation,” “correct,” and “request evidence” over a vague “confirm.”
- Prefer “potential diversion” over “waste saved.”
- Prefer “demonstration demand—not a live offer” over simulated buyer language.
- State why information is needed and how it changes a decision.
- Never imply certification, guaranteed sale, verified impact, or official compliance.

## Page-specific overrides

Page overrides belong in `design-system/rebuild-loop/pages/`. An override may change density or composition, but not the core tokens, accessibility requirements, rejected-pattern list, or agent/human responsibility hierarchy.
