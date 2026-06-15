import { Icons, useTheme, View as ThemedView } from '@avalabs/k2-alpine'
import GlobeSVG from 'new/assets/globalSVG'
import React from 'react'
import { Image, ImageStyle, StyleProp, View, ViewStyle } from 'react-native'
import { formatUriImageToPng } from 'utils/Contentful'
import { isPChain, isXChain } from 'utils/network/isAvalancheNetwork'

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
  testID,
  asBadge = false,
  chainBadgeBorderColor = 'transparent'
}: {
  logoUri: string | undefined
  chainId?: number
  size: number
  style?: StyleProp<ImageStyle>
  testID?: string
  asBadge?: boolean
  /**
   * Color of the ring drawn around the P/X letter badge inside the composite.
   * Defaults to `'transparent'` — the ring still occupies space but is
   * invisible. Pass the surrounding surface color (e.g.
   * `theme.colors.$surfaceSecondary`) to create a visible gap between the
   * AVAX logo and the letter badge.
   */
  chainBadgeBorderColor?: string
}): JSX.Element {
  const {
    theme: { isDark }
  } = useTheme()
  const baseStyle = {
    width: size,
    height: size
  }

  const isP = chainId !== undefined && isPChain(chainId)
  const isX = chainId !== undefined && isXChain(chainId)

  if (isP || isX) {
    const LetterIcon = isP
      ? isDark
        ? Icons.TokenLogos.AVAX_P_DARK
        : Icons.TokenLogos.AVAX_P_LIGHT
      : isDark
      ? Icons.TokenLogos.AVAX_X_DARK
      : Icons.TokenLogos.AVAX_X_LIGHT

    if (asBadge) {
      return <LetterIcon width={size} height={size} testID={testID} />
    }

    const overlaySize = Math.max(8, Math.round(size * 0.55))
    // Push the letter badge out past the AVAX circle's corner so it reads as
    // an attached chain badge rather than overlapping the logo. Consumers
    // (NetworkBadge, TokenAmountRow) intentionally do not clip overflow so
    // this offset is visible.
    const offset = -Math.round(overlaySize / 3)
    // Ring around the letter badge — color is provided by the consumer
    // via `chainBadgeBorderColor` (defaults to `'transparent'` so the ring
    // is invisible but still occupies space). Pass the surrounding surface
    // color to make the gap visible.
    const ringWidth = Math.max(1, Math.round(overlaySize / 8))
    const innerSize = overlaySize - ringWidth * 2
    return (
      <ThemedView sx={{ width: size, height: size }} testID={testID}>
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
            borderColor: chainBadgeBorderColor,
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
      testID={testID}
    />
  ) : (
    <View style={[baseStyle, style as ViewStyle]} testID={testID}>
      <GlobeSVG height={'100%'} testID="network_logo__globe_svg" />
    </View>
  )
}
