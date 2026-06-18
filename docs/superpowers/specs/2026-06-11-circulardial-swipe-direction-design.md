# CircularDial swipe directions sometimes inverted (CP-14466)

**Ticket:** [CP-14466](https://ava-labs.atlassian.net/browse/CP-14466)
**Type:** Bug — UX / gesture behavior
**Component:** `packages/k2-alpine/src/components/CircularDial/`

## Problem

Dragging the `CircularDial` vertically feels inverted depending on where you grab
it: on the left half a swipe up increases the value, on the right half a swipe up
decreases it. Reported as "swipe directions sometimes inverted based on which half
of the slider I'm on."

## Root cause

`onUpdate` maps the gesture by projecting translation deltas onto the arc tangent
captured at the touch's start position:

```ts
// CircularDial.tsx onStart
startTangentY.value = Math.cos(Math.PI + progressSv.value * Math.PI)
// CircularDial.tsx onUpdate
const proj = event.translationX + event.translationY * startTangentY.value
const deltaProgress = proj / (2 * ARC_RADIUS)
const target = gestureStartProgress.value + deltaProgress
```

`startTangentY` is −1 at the left end, 0 at the top, +1 at the right end, so the
vertical contribution flips sign across the halfway point. This is geometrically
correct "knob-follows-the-track" behavior, but the flip is what users read as
inverted.

The inversion is **inherent to any swipe-direction → value mapping on an arc**: the
top (12 o'clock) is the *middle* of the range and both ends sit at the bottom, so
"up = toward the top" means *increase* from the left and *decrease* from the right.
Tangent projection and angular-delta tracking both still flip. Only **absolute
positional tracking** removes the felt inversion, because the user manipulates the
handle by position, not by swipe direction.

## Chosen approach: absolute angular tracking (Apple Bedtime-style)

The knob follows the finger's **angle around the dial center**, so the handle is
always where the finger points on the ring. There is no swipe-direction-to-value
mapping left to invert.

### Sweep convention (unchanged)

Upper semicircle, screen coords (y down): position = `(cx + r·cosθ, cy + r·sinθ)`
with `θ = π + progress·π`.
- progress 0 → 9 o'clock (left), progress 0.5 → 12 o'clock (top), progress 1 → 3 o'clock (right).

### `onUpdate` math

The angle→progress mapping is extracted into a pure worklet helper in `helpers.ts`
so the shipped code is exactly the tested code:

```ts
// helpers.ts
// dx/dy are the finger offset from the arc center (ARC_CX, ARC_CY) in canvas space.
export const progressFromCanvasPoint = (dx: number, dy: number): number => {
  'worklet'
  let progress: number
  if (dy >= 0) {
    // On or below the horizontal diameter (off the arc): pin to the nearer end.
    // `>= 0` (not `> 0`) so the exact left end (−r, 0) doesn't land on the +π
    // side of the atan2 seam and jump to the far end.
    return dx < 0 ? 0 : 1
  }
  // Upper semicircle: atan2 ∈ (-π, 0) → progress ∈ (0, 1).
  const progress = (Math.atan2(dy, dx) + Math.PI) / Math.PI
  return progress < 0 ? 0 : progress > 1 ? 1 : progress
}
```

```ts
// CircularDial.tsx onUpdate
// Finger position in canvas space (same conversion onTouchesDown already uses for
// knob hit-testing): canvas is horizontally centered in the outer container and
// offset by canvasPadding at the top.
const canvasX = event.x - (outerWidth.value - CANVAS_WIDTH) / 2
const canvasY = event.y - canvasPadding
progressSv.value = progressFromCanvasPoint(canvasX - ARC_CX, canvasY - ARC_CY)
```

### Behavior changes / preserved

- **Changed:** the knob tracks the finger's angle uniformly across the whole arc —
  no inversion. Because tracking is positional, starting a drag moves the knob to
  the finger's angle (snap-to-finger). This intentionally replaces the previous
  "anchor to start progress so the knob doesn't jump" behavior — that anchoring
  produced the directional mapping that inverts.
- **Eased off-knob snap:** "swipe anywhere" is kept (large hit area), but to avoid
  a jarring teleport when the grab starts away from the knob, `onUpdate` eases
  `progressSv` toward the finger angle with a short `withTiming` (`SNAP_CHASE_MS`,
  re-targeted each frame — the same chase `DialReadout` uses for typing). A
  knob-grab (`startedOnKnob`) skips the easing and tracks 1:1 for precision. Note
  this softens the *feel* only; positional semantics (value follows the touch)
  are unchanged, and the activation wedge still lets vertical scroll escape so the
  only off-knob trigger is a deliberate horizontal swipe.
- **Preserved:**
  - **Tap-to-edit** — the separate `Tap` gesture (movement ≤ `TAP_SLOP`) is
    unaffected; a tap still opens manual input and never moves the knob.
  - **Activation** — `onTouchesDown`/`onTouchesMove` logic stays: knob-grab
    bypasses the wedge; touches elsewhere still gate on the horizontal wedge so a
    predominantly vertical swipe falls through to parent scroll.
  - Step-snapping + haptics on release (`onEnd`), preset animations, manual input,
    and the commit/settle flow are untouched.
- **Removed:** `startTangentY` and `gestureStartProgress` shared values and their
  assignments become unused and are deleted. `ACTIVATION_TAN` / the wedge stay.

### Edge cases

- **atan2 seam at the bottom diameter:** handled by the `dy > 0` branch (below-left
  → 0, below-right → 1) so dragging below the dial pins to the nearest end rather
  than wrapping.
- **Ends reachable:** progress 0 and 1 are reachable exactly at 9/3 o'clock and via
  the clamp.
- **Knob-grab from anywhere:** unchanged; once active, the angle mapping applies
  regardless of where the touch began.

## Testing

- **Unit:** test the `progressFromCanvasPoint(dx, dy)` helper: left/top/right
  (`(-r,0)`/`(0,-r)`/`(r,0)`) map to 0/0.5/1; below-left → 0, below-right → 1;
  off-axis points on the upper semicircle map monotonically; out-of-range clamps.
  Keeps the gesture worklet thin and the math verifiable.
- **Device (manual):**
  - Drag around the arc from both halves — value tracks the finger's angle; no
    direction ever feels inverted.
  - Vertical swipe on the left vs right behaves consistently (knob goes to finger).
  - Tap (no drag) still opens the keypad and does not move the knob.
  - A predominantly vertical swipe over the dial (not on the knob) still lets the
    parent scroll.
  - Release snaps to the nearest step with the usual haptic.

## Out of scope

- The CP-14428 throttle/settle/decouple work (separate branch/PR #3898).
- Any change to presets, manual input, or the visual arc rendering.
