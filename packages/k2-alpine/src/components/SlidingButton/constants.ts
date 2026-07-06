import { colors } from '../../theme/tokens/colors'

export const TRACK_HEIGHT = 64
export const THUMB_SIZE = 50
export const THUMB_INSET = (TRACK_HEIGHT - THUMB_SIZE) / 2 // 7
export const TRACK_RADIUS = 60
export const DEFAULT_LEFT_FILL_COLOR = colors.$accentDanger
export const DEFAULT_RIGHT_FILL_COLOR = colors.$accentSuccessL
export const ERROR_RESET_MS = 250
// Distance (px) over which the chevrons fade out and the pill reaches its
// full fill colour. The pill keeps growing past this point, but the colour is
// already fully saturated and the chevrons are gone.
export const CHEVRON_FADE_DISTANCE = 20
// Active-side label+icon scale at rest. They scale up to 1 as the user slides.
export const MOVING_LABEL_MIN_SCALE = 0.7
// Fraction of max travel at which the track-edge (background) labels have
// fully faded. They're hints that should get out of the way quickly — not a
// progress indicator.
export const SIDE_LABELS_FADE_AT = 0.4
// Crossfade duration between the committed label and the spinner.
export const LOADING_FADE_MS = 200
// Pill shadow — shared by single + bidirectional tracks so the two render with
// the same elevation and blur radius (Figma: 0 10 20 rgba(0,0,0,0.25)).
export const PILL_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.25,
  shadowRadius: 20,
  elevation: 8
} as const
