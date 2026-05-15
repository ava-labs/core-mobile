/**
 * Horizontal inset applied INSIDE the chart canvas — candles and volume bars
 * are positioned within [CHART_INSET, width - CHART_INSET] so the first/last
 * data points don't sit flush against the canvas edges. Line/area mode
 * overrides this to 0 (edge-to-edge).
 */
export const CHART_INSET = 8

/** Height of the volume-row strip below the candle area (candle mode only). */
export const VOLUME_ROW_HEIGHT = 30

/** Height of the chart footer ("Last update: …" / volume swap). */
export const CHART_FOOTER_HEIGHT = 24

/** Top padding reserved for the max-price y-axis label above its gridline. */
export const PRICE_TOP_PADDING = 14

/** Bottom breathing room below the line in area-chart mode. */
export const LINE_BOTTOM_PADDING = 30

/** Stroke width of the crosshair line when rendered over an area chart. */
export const LINE_MODE_CROSSHAIR_WIDTH = 3

/** Candle body width as a fraction of the per-candle slot width. */
export const CANDLE_BODY_WIDTH_RATIO = 0.6

/** Volume bar width as a fraction of the per-candle slot width. */
export const VOLUME_BAR_WIDTH_RATIO = 0.6
