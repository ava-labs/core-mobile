import { Platform } from 'react-native'
import type { WebViewMessageEvent } from 'react-native-webview'
import Logger from 'utils/Logger'

// Information about the frame that posted a WebView message
export type MessageFrameInfo = {
  isMainFrame?: boolean
  frameOrigin?: string
}

let hasReportedMissingProvenance = false

/**
 * Reads platform-reported frame provenance off a WebView message event.
 * Normalizes the "unknown" cases to `undefined` so callers have a single thing
 * to check: an opaque origin arrives as `''` on iOS and as the string `'null'`
 * on Android, and neither is a real origin to compare against.
 */
export const getMessageFrameInfo = (
  // Deliberately `Pick` of the real event type rather than a hand-written shape:
  // both fields exist only because of patches/react-native-webview+13.15.0.patch,
  // so if that patch ever stops applying this fails to compile instead of
  // quietly returning `undefined` and downgrading the frame gate.
  nativeEvent: Pick<
    WebViewMessageEvent['nativeEvent'],
    'isMainFrame' | 'frameOrigin'
  >
): MessageFrameInfo => {
  const { isMainFrame, frameOrigin } = nativeEvent

  if (
    isMainFrame === undefined &&
    Platform.OS === 'ios' &&
    !hasReportedMissingProvenance
  ) {
    hasReportedMissingProvenance = true
    Logger.error(
      '[Browser] WebView message carries no frame provenance on iOS — the react-native-webview patch is missing; every provider request will be refused as unattributable'
    )
  }

  return {
    isMainFrame,
    frameOrigin:
      frameOrigin === undefined || frameOrigin === '' || frameOrigin === 'null'
        ? undefined
        : frameOrigin
  }
}
