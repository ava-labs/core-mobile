import { View } from '@avalabs/k2-alpine'
import React from 'react'

interface StatusDotProps {
  /** Dot diameter in px. Defaults to 6 (used on the detail screen). */
  size?: number
  /** Background color — typically a theme color like `theme.colors.$textSuccess`. */
  color: string
}

/**
 * Small filled circle used to indicate stake status (currently "Active"). Size
 * varies by surface: `StakeCard` uses a 5px dot to sit comfortably alongside
 * the caption-sized label, while the detail screen uses a 6px dot next to a
 * body-sized label.
 */
export const StatusDot = ({ size = 6, color }: StatusDotProps): JSX.Element => {
  return (
    <View
      sx={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color
      }}
    />
  )
}
