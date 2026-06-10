import { Text, useTheme, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import LottieView from 'lottie-react-native'
import React from 'react'

// ~Half the height of the 2-line heading3 status title (lineHeight 27 × 2).
// Used to offset the icon/subtitle from the screen center so the title
// itself stays pinned to the exact center across both status variants.
const STATUS_TITLE_HALF_HEIGHT = 30

const FAST_STAKE_LOTTIE_LIGHT = require('assets/lotties/fast-stake-icon-light.json')
const FAST_STAKE_LOTTIE_DARK = require('assets/lotties/fast-stake-icon-dark.json')
const SUCCESS_LOTTIE_LIGHT = require('assets/lotties/success-checkmark-icon-light.json')
const SUCCESS_LOTTIE_DARK = require('assets/lotties/success-checkmark-icon-dark.json')

export type StakeStatusVariant = 'processing' | 'success'

/**
 * Full-screen states shown after the user slides to stake: the in-flight
 * "processing" state (looping fast-stake animation) and the terminal
 * "success" state (checkmark animation). Both are dismissable by swiping
 * the modal down; success additionally auto-dismisses from the parent.
 *
 * The success copy is currently Fast Stake-specific ("Fast stake
 * successfully added"). When the advanced delegate flow lands and
 * reuses this screen, surface the copy through props or a flow-driven
 * config so each flow can stamp its own wording.
 */
export const StakeStatusScreen = ({
  variant
}: {
  variant: StakeStatusVariant
}): JSX.Element => {
  const { theme } = useTheme()
  const isProcessing = variant === 'processing'

  const lottieSource = isProcessing
    ? theme.isDark
      ? FAST_STAKE_LOTTIE_DARK
      : FAST_STAKE_LOTTIE_LIGHT
    : theme.isDark
    ? SUCCESS_LOTTIE_DARK
    : SUCCESS_LOTTIE_LIGHT

  return (
    <ScrollScreen
      isModal
      scrollEnabled={false}
      contentContainerStyle={{ flexGrow: 1 }}>
      {/* The title is the only in-flow child, so it stays pinned to the exact
          vertical center regardless of the variant. The icon and subtitle are
          positioned absolutely relative to that center (above / below), so
          their presence never shifts the title between processing/success. */}
      <View sx={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View
          style={{
            position: 'absolute',
            bottom: '50%',
            left: 0,
            right: 0,
            alignItems: 'center',
            paddingBottom: STATUS_TITLE_HALF_HEIGHT + 24
          }}>
          <LottieView
            // Remount per variant so the new animation plays from the start.
            key={variant}
            source={lottieSource}
            autoPlay
            loop={isProcessing}
            style={{ width: 120, height: 120 }}
          />
        </View>

        <Text
          variant="heading3"
          sx={{ textAlign: 'center', paddingHorizontal: 32 }}>
          {isProcessing
            ? `We are processing\nyour transaction`
            : `Fast stake\nsuccessfully added`}
        </Text>

        {isProcessing && (
          <View
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              alignItems: 'center',
              paddingTop: STATUS_TITLE_HALF_HEIGHT + 16,
              paddingHorizontal: 32
            }}>
            <Text
              variant="body1"
              sx={{ textAlign: 'center', color: '$textSecondary' }}>
              Please wait while we process your transaction. You can dismiss
              this screen at any time, just swipe down!
            </Text>
          </View>
        )}
      </View>
    </ScrollScreen>
  )
}
