import React from 'react'
import { Canvas, Text as SkText, useFont } from '@shopify/react-native-skia'

/**
 * Warms Skia's typeface cache AND the glyph rasterization cache at app
 * startup so Skia-rendered components appear without a ~1–2s blank frame
 * on first visit.
 *
 * Without this, the first Canvas that draws large text (e.g. the 60pt
 * leverage number) pays the glyph-atlas cost per digit on first paint —
 * visibly lagging behind smaller-font canvases like the wheel ticks.
 *
 * We render invisible SkText covering all digit glyphs at both sizes so
 * the rasterized atlases are populated before any real component mounts.
 * Mount once near the root of the app.
 */
const BIG_FONT_SIZE = 60
const SMALL_FONT_SIZE = 11
// Characters any LeverageGauge-style Skia component might render — digits,
// decimal point, and the "×" multiplier glyph.
const WARMUP_CHARS = '0123456789.×'
// Canvas must be large enough to actually contain the drawn glyphs;
// otherwise Skia clips outside the viewport and most glyphs never hit the
// rasterization atlas. The Canvas is positioned off-screen (negative top)
// so it's never visible while still being part of the layout tree.
const WARMUP_CANVAS_WIDTH = 800
const WARMUP_CANVAS_HEIGHT = 100

export const SkiaPreload = React.memo(function SkiaPreload() {
  const bigFont = useFont(
    require('../assets/fonts/Aeonik-Medium.otf'),
    BIG_FONT_SIZE
  )
  const smallFont = useFont(
    require('../assets/fonts/Inter-Medium.ttf'),
    SMALL_FONT_SIZE
  )

  return (
    <Canvas
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: -WARMUP_CANVAS_HEIGHT * 2,
        left: 0,
        width: WARMUP_CANVAS_WIDTH,
        height: WARMUP_CANVAS_HEIGHT,
        opacity: 0
      }}>
      {bigFont && (
        <SkText
          text={WARMUP_CHARS}
          x={0}
          y={BIG_FONT_SIZE}
          font={bigFont}
          color="black"
        />
      )}
      {smallFont && (
        <SkText
          text={WARMUP_CHARS}
          x={0}
          y={BIG_FONT_SIZE + SMALL_FONT_SIZE + 4}
          font={smallFont}
          color="black"
        />
      )}
    </Canvas>
  )
})
