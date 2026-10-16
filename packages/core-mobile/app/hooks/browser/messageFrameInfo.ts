import { Platform } from 'react-native'
import type { WebViewMessageEvent } from 'react-native-webview'
import Logger from 'utils/Logger'

export type MessageFrameInfo = {
  isMainFrame?: boolean
  frameOrigin?: string
}

let hasReportedMissingProvenance = false

/**
 * Unknown cases become `undefined`: an opaque origin arrives as `''` on iOS and
 * as `'null'` on Android.
 */
export const getMessageFrameInfo = (
  // Deliberately `Pick` of the real event type rather than a hand-written shape:
  // both fields come from the ava-labs/react-native-webview fork (pinned in
  // package.json), so a fork regression fails to compile here instead of
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
      '[Browser] WebView message carries no frame provenance on iOS — the react-native-webview fork pin is missing; every provider request will be refused as unattributable'
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
