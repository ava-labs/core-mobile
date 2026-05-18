/** Line/area mode overrides to 0 (edge-to-edge). */
export const CHART_INSET = 8

export const VOLUME_ROW_HEIGHT = 30
export const CHART_FOOTER_HEIGHT = 24

/** Reserves space for the max-price label above its gridline. */
export const PRICE_TOP_PADDING = 14

export const LINE_MODE_CROSSHAIR_WIDTH = 3
export const CANDLE_BODY_WIDTH_RATIO = 0.6
export const VOLUME_BAR_WIDTH_RATIO = 0.6

export const DURATIONS = {
  headerPress: 200,
  headerZone: 220,
  labelsFade: 150
} as const

/** Crosshair x / containerWidth ratios for header inner alignment. */
export const HEADER_LEFT_ZONE_THRESHOLD = 0.19
export const HEADER_RIGHT_ZONE_THRESHOLD = 0.81

/** Alpha bytes appended to the line color for the gradient stops. */
export const AREA_GRADIENT_TOP_ALPHA = '66'
export const AREA_GRADIENT_BOTTOM_ALPHA = '00'
