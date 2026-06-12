import { ChainId } from '@avalabs/core-chains-sdk'
import { Icons, useTheme, View as ThemedView } from '@avalabs/k2-alpine'
import GlobeSVG from 'new/assets/globalSVG'
import React from 'react'
import { Image, ImageStyle, StyleProp, View, ViewStyle } from 'react-native'
import { formatUriImageToPng } from 'utils/Contentful'

/**
 * Displays the network's logo or a globe icon fallback.
 *
 * For P-Chain and X-Chain:
 *  - default: composite the AVAX triangle + the letter badge so the icon is
 *    a self-contained chain logo.
 *  - `asBadge`: render only the letter circle, intended for use as an
 *    overlay on top of an existing AVAX token logo so the AVAX isn't
 *    duplicated.
 *
 * `logoUri` can be an empty string.
 */
export function NetworkLogo({
  logoUri,
  chainId,
  size,
  style,
  asBadge = false
}: {
  logoUri: string | undefined
  chainId?: number
  size: number
  style?: StyleProp<ImageStyle>
  testID?: string
  asBadge?: boolean
}): JSX.Element {
  const {
    theme: { isDark }
  } = useTheme()
  const baseStyle = {
    width: size,
    height: size
  }

  const isPChain =
    chainId === ChainId.AVALANCHE_P || chainId === ChainId.AVALANCHE_TEST_P
  const isXChain =
    chainId === ChainId.AVALANCHE_X || chainId === ChainId.AVALANCHE_TEST_X

  if (isPChain || isXChain) {
    const LetterIconForBadge = isPChain
      ? isDark
        ? Icons.TokenLogos.AVAX_P_DARK
        : Icons.TokenLogos.AVAX_P_LIGHT
      : isDark
      ? Icons.TokenLogos.AVAX_X_DARK
      : Icons.TokenLogos.AVAX_X_LIGHT

    if (asBadge) {
      return <LetterIconForBadge width={size} height={size} />
    }

    const overlaySize = Math.max(8, Math.round(size * 0.55))
    // Push the letter badge out past the AVAX circle's corner so it reads as
    // an attached chain badge rather than overlapping the logo. Consumers
    // (NetworkBadge, TokenAmountRow) intentionally do not clip overflow so
    // this offset is visible.
    const offset = -Math.round(overlaySize / 3)
    // A solid ring around the badge creates a visual gap between the letter
    // and the AVAX logo. Using `$surfacePrimary` (white in light mode, dark
    // in dark mode) so it reads clearly against both the red AVAX and the
    // contrasting letter circle.
    const ringWidth = Math.max(1, Math.round(overlaySize / 8))
    const innerSize = overlaySize - ringWidth * 2
    const LetterIcon = LetterIconForBadge
    return (
      <ThemedView sx={{ width: size, height: size }}>
        <ThemedView
          sx={{
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: 'hidden'
          }}>
          <Icons.TokenLogos.AVAX width={size} height={size} />
        </ThemedView>
        <ThemedView
          sx={{
            position: 'absolute',
            bottom: offset,
            right: offset,
            width: overlaySize,
            height: overlaySize,
            borderRadius: overlaySize / 2,
            borderWidth: ringWidth,
            borderColor: '$surfacePrimary',
            overflow: 'hidden',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
          <LetterIcon width={innerSize} height={innerSize} />
        </ThemedView>
      </ThemedView>
    )
  }

  return logoUri ? (
    <Image
      source={{
        uri: formatUriImageToPng(logoUri, size)
      }}
      style={[baseStyle, style]}
    />
  ) : (
    <View style={[baseStyle, style as ViewStyle]}>
      <GlobeSVG height={'100%'} testID="network_logo__globe_svg" />
    </View>
  )
}
