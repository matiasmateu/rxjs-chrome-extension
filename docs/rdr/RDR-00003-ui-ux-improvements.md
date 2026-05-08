# RDR-00003: Extension Panel UI/UX Improvement Recommendations

- Status: Proposed
- Date: 2026-05-08
- Owners: RxJS DevTools maintainers
- Related: `RDR-0002`

## Context

The current panel UI is functional but has UX friction around responsive behavior, visual hierarchy, readability, interaction consistency, and discoverability. This record captures a prioritized list of improvements to review and execute incrementally.

## Decision

Implement the following prioritized UI/UX improvements:

1. Make the panel responsive first (highest impact):
   - Add breakpoints for DevTools widths.
   - Make the right details panel collapsible/resizable.
   - Prevent controls from clipping at narrow widths.
2. Improve top toolbar hierarchy:
   - Define one primary action (`Pause/Play`).
   - Make secondary actions less dominant.
   - Add icon + text for zoom.
   - Keep event count visually separated.
3. Upgrade filter UX:
   - Add a clear-all filter control.
   - Show active filter chips with counts.
   - Keep filter state visible/persisted so users understand why events are hidden.
4. Fix timeline readability issues:
   - Increase contrast for lane labels/grid.
   - Add better spacing between timestamp labels.
   - Prevent `now` marker text from overlapping tick labels.
5. Improve event encoding (color + shape system):
   - Use consistent color semantics by event kind/domain.
   - Keep shape semantics.
   - Make hover/selected states more distinct.
6. Refine lane organization:
   - Add stronger grouping headers.
   - Reduce duplicate-looking lane labels.
   - Optionally support collapsing inactive groups.
7. Redesign details panel information architecture:
   - Split into clear sections (`Identity`, `Timing`, `Operator`, `Payload`).
   - Keep action buttons sticky.
   - Improve empty-state guidance.
8. Simplify and contextualize help text:
   - Replace the always-visible long legend with a compact help button/shortcut popover.
9. Fix interaction consistency:
   - Align implementation with hints (for example, the legend currently says `pan X/Y` but runtime behavior differs).
10. Accessibility pass:
    - Add proper focus states.
    - Add keyboard navigation order.
    - Add ARIA labels for icon/small buttons.
    - Ensure minimum contrast checks for labels/chips.
11. Visual design system cleanup:
    - Move inline style literals to shared tokens/CSS variables (spacing, radius, surface colors, text tiers).

## Consequences

Positive:

- Better usability in narrow DevTools layouts.
- Faster scanning and interpretation of timeline data.
- More consistent, testable UI behavior.

Tradeoffs:

- Requires coordinated work across `apps/extension` and `packages/panel-ui`.
