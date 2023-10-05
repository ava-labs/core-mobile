import React from 'react'
import GlobeSVG from 'components/svg/GlobeSVG'
import { Image, ImageStyle, StyleProp, View } from 'react-native'
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
  style = [
    {
      borderRadius: size / 2,
      width: size,
      height: size
    },
    style
  ]
  return logoUri ? (
    <Image
      source={{
        uri: formatUriImageToPng(logoUri, size)
      }}
      style={style}
    />
  ) : (
    <View style={style}>
      <GlobeSVG height={'100%'} testID="network_logo__globe_svg" />
    </View>
  )
}
