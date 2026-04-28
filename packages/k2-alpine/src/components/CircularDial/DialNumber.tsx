import {
  Canvas,
  Group,
  Text as SkText,
  useFont
} from '@shopify/react-native-skia'
import React, { FC, memo, useMemo } from 'react'
import {
  SharedValue,
  useDerivedValue
} from 'react-native-reanimated'

type SkFont = NonNullable<ReturnType<typeof useFont>>

// Layout packed into a single derived value so each per-frame computation
// runs once on the UI thread and the per-slot hooks just pluck fields.
type DialNumberLayout = {
  chars: string[]
  neighborChars: string[]
  xs: number[]
  prefixX: number
  suffixX: number
  fadeProgress: number
}

// How far decimal digits fade as the value transitions toward the next
// snap. 1 = stays full. 0.2 = fades to 20% at the boundary.
const DIGIT_MIN_OPACITY = 0.2
// Canvas height and baseline are pinned to the maximum font size so that
// when auto-fit shrinks the rendered fontSize, the text stays anchored to
// the same baseline (y = BASELINE_Y) inside the same-sized canvas. Only
// the glyphs themselves get smaller; vertical alignment doesn't move.
// BASELINE_Y is tuned to match where RN's flex-centered TextInput puts
// its baseline (with `lineHeight = MAX_FONT_SIZE` in a CANVAS_HEIGHT-tall
// row), so the Skia display and the editing input line up cleanly.
const MAX_FONT_SIZE = 50
// 1.4× gives the canvas (and the overlay it backs) enough vertical room
// to show tall glyphs like "$" without clipping the top stroke.
const CANVAS_HEIGHT = MAX_FONT_SIZE * 1.4 // 70
const BASELINE_Y = MAX_FONT_SIZE * 1 // 45

type DialNumberProps = {
  progressSv: SharedValue<number>
  min: number
  max: number
  step: number
  decimals: number
  prefix: string
  suffix: string
  color: SharedValue<string>
  /**
   * Animated visual font size. The Skia font is always loaded at
   * `MAX_FONT_SIZE`; this drives a scale transform so size changes can
   * smoothly animate via `withTiming` without reloading the font.
   */
  fontSizeSv: SharedValue<number>
  /** Maximum width (and canvas width) the rendered amount may occupy. */
  maxWidth?: number
}

/**
 * Per-digit animated Skia render of the dial's value — ported from
 * LeverageGauge's AnimatedNumber. Each character sits in its own slot;
 * decimal digits that differ from the approaching-snap neighbor fade
 * smoothly while integer digits and structural characters (dot, prefix,
 * suffix) stay solid.
 */
const DialNumberInner: FC<DialNumberProps> = ({
  progressSv,
  min,
  max,
  step,
  decimals,
  prefix,
  suffix,
  color,
  fontSizeSv,
  maxWidth = 180
}) => {
  // Font always loaded at MAX_FONT_SIZE — scaling is done via transform
  // so animating size doesn't require reloading the font.
  const font = useFont(
    require('../../assets/fonts/Aeonik-Medium.otf'),
    MAX_FONT_SIZE
  )

  // Widest possible number → how many slots we need.
  const slotCount = useMemo(() => {
    const widest = decimals > 0 ? `${max}.${'0'.repeat(decimals)}` : `${max}`
    return widest.length
  }, [max, decimals])

  // Canvas width is fixed to `maxWidth` — content rendered at full font
  // size may be wider, but the scale transform shrinks it to fit.
  const canvasWidth = maxWidth

  const prefixWidth = useMemo(
    () => (font && prefix.length > 0 ? font.measureText(prefix).width : 0),
    [font, prefix]
  )
  const suffixWidth = useMemo(
    () => (font && suffix.length > 0 ? font.measureText(suffix).width : 0),
    [font, suffix]
  )

  const layout = useDerivedValue<DialNumberLayout>(() => {
    const raw = min + progressSv.value * (max - min)
    const clamped = raw < min ? min : raw > max ? max : raw
    const maxStepIdx = Math.round((max - min) / step)
    const rawIdx = Math.round((clamped - min) / step)
    const stepIndex = Math.max(0, Math.min(maxStepIdx, rawIdx))
    const snappedValue = min + stepIndex * step

    // Direction of the approaching neighbor snap.
    const neighborOffset = clamped > snappedValue ? 1 : -1
    const neighborIdx = Math.max(
      0,
      Math.min(maxStepIdx, stepIndex + neighborOffset)
    )

    const formatSnapped = (idx: number): string => {
      const rs = min + idx * step
      const s = min + Number((rs - min).toFixed(decimals))
      return decimals > 0 ? s.toFixed(decimals) : `${s}`
    }
    const currentText = formatSnapped(stepIndex)
    const neighborText = formatSnapped(neighborIdx)

    // 0 at the snap, 1 at the midpoint between current and neighbor.
    const distFromSnap = Math.abs(clamped - snappedValue)
    const fadeProgress = Math.min(distFromSnap / (step / 2), 1)

    const chars: string[] = []
    const neighborChars: string[] = []
    const widths: number[] = []
    let numberWidth = 0
    for (let i = 0; i < slotCount; i++) {
      const ch = currentText[i] ?? ''
      const nch = neighborText[i] ?? ''
      chars.push(ch)
      neighborChars.push(nch)
      const w = ch && font ? font.measureText(ch).width : 0
      widths.push(w)
      numberWidth += w
    }
    const totalWidth = prefixWidth + numberWidth + suffixWidth
    const startX = (canvasWidth - totalWidth) / 2
    const prefixX = startX
    const xs: number[] = []
    let cursor = startX + prefixWidth
    for (let i = 0; i < slotCount; i++) {
      xs.push(cursor)
      cursor += widths[i] ?? 0
    }
    const suffixX = cursor
    return { chars, neighborChars, xs, prefixX, suffixX, fadeProgress }
  })

  const prefixX = useDerivedValue(() => layout.value.prefixX)
  const suffixX = useDerivedValue(() => layout.value.suffixX)

  // Scale transform anchored at (canvasWidth/2, BASELINE_Y) so the text
  // shrinks/grows around its visual center while keeping the baseline
  // pinned at y = BASELINE_Y. Driven by `fontSizeSv` for smooth animation.
  const groupTransform = useDerivedValue(() => {
    const scale = fontSizeSv.value / MAX_FONT_SIZE
    const cx = canvasWidth / 2
    return [
      { translateX: cx },
      { translateY: BASELINE_Y },
      { scale },
      { translateY: -BASELINE_Y },
      { translateX: -cx }
    ]
  }, [canvasWidth])

  if (!font) return null

  return (
    <Canvas
      pointerEvents="none"
      style={{ width: canvasWidth, height: CANVAS_HEIGHT }}>
      <Group transform={groupTransform}>
        {prefix.length > 0 && (
          <SkText
            text={prefix}
            x={prefixX}
            y={BASELINE_Y}
            font={font}
            color={color}
          />
        )}
        {Array.from({ length: slotCount }).map((_, i) => (
          <DigitSlot
            key={i}
            index={i}
            layout={layout}
            font={font}
            color={color}
          />
        ))}
        {suffix.length > 0 && (
          <SkText
            text={suffix}
            x={suffixX}
            y={BASELINE_Y}
            font={font}
            color={color}
          />
        )}
      </Group>
    </Canvas>
  )
}

// Shallow-compare bail-out — DialReadout re-renders for state changes
// (draft, forcedSelection, fontSize, etc.) but DialNumber's props are
// all stable shared values + primitives, so memo prevents the heavy
// Skia canvas from being torn down and recreated on each parent render.
export const DialNumber = memo(DialNumberInner)

/**
 * A single digit slot. Opacity fades progressively only for decimal
 * digits that differ from the next-snap neighbor. Integers, the decimal
 * point, and empty slots stay solid.
 */
const DigitSlot: FC<{
  index: number
  layout: SharedValue<DialNumberLayout>
  font: SkFont
  color: SharedValue<string>
}> = ({ index, layout, font, color }) => {
  const char = useDerivedValue(() => layout.value.chars[index] ?? '')
  const x = useDerivedValue(() => layout.value.xs[index] ?? 0)
  const opacity = useDerivedValue(() => {
    const chars = layout.value.chars
    const dotIndex = chars.indexOf('.')
    // Only decimal-digit slots (after the ".") fade.
    if (dotIndex === -1 || index <= dotIndex) return 1
    const cur = chars[index] ?? ''
    const nxt = layout.value.neighborChars[index] ?? ''
    if (cur === nxt) return 1
    if (cur === '' || nxt === '') return 1
    return 1 - layout.value.fadeProgress * (1 - DIGIT_MIN_OPACITY)
  })
  return (
    <Group opacity={opacity}>
      <SkText text={char} x={x} y={BASELINE_Y} font={font} color={color} />
    </Group>
  )
}
