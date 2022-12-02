import React from 'react'
import GlobeSVG from 'components/svg/GlobeSVG'
import { Image, ImageStyle, StyleProp, View } from 'react-native'

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
}) {
  style = [{ borderRadius: size / 2, width: size, height: size }, style]
  return logoUri ? (
    <Image source={{ uri: logoUri }} style={style} />
  ) : (
    <View style={style}>
      <GlobeSVG height={size} testID="network_logo__globe_svg" />
    </View>
  )
}
