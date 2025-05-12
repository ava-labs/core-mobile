import GlobeSVG from 'new/assets/globalSVG'
import React from 'react'
import { Image, ImageStyle, StyleProp, View, ViewStyle } from 'react-native'
import { formatUriImageToPng } from 'utils/Contentful'

/**
 * Displays the network's logo or a globe icon fallback.
 * `logoUri` can be an empty string.
 */
export function NetworkLogo({
  logoUri,
  size,
  style
}: {
  logoUri: string | undefined
  size: number
  style?: StyleProp<ImageStyle>
  testID?: string
}): JSX.Element {
  const baseStyle = {
    width: size,
    height: size
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
