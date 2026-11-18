import React from 'react'
import { SxProp } from '@avalabs/k2-alpine'
import { Warning } from './Warning'

export const getScreenshotWarningMessage = (secretLabel: string): string =>
  `Do not take screenshots of your ${secretLabel}. Screenshots can be synced to the cloud or read by other apps.`

/**
 * WSR-PHYS-001: persistent warning shown on every screen that reveals a
 * secret. Android additionally blocks screenshots via `useSecureScreen`
 * (FLAG_SECURE); iOS has no equivalent, so this warning is the protection
 * there.
 */
export const ScreenshotWarning = ({
  secretLabel = 'recovery phrase',
  sx
}: {
  secretLabel?: string
  sx?: SxProp
}): React.JSX.Element => (
  <Warning
    testID="screenshot_warning"
    message={getScreenshotWarningMessage(secretLabel)}
    sx={sx}
  />
)
